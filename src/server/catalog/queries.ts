import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeText } from "@/lib/text";
import { DAY } from "@/lib/time";
import { db } from "../db";
import { type DealLabelKey, headlineDiscount, type OfferMetrics } from "../pricing/evaluate";
import { dailySeries } from "../pricing/stats";
import { includeTestData } from "../visibility";
import { LABEL_FILTERS, type ProductFilters, type SortKey } from "./filters";

export const PAGE_SIZE = 24;

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  imageUrl: string | null;
  category: { slug: string; name: string; icon: string | null };
  best: {
    offerId: string;
    priceMinor: number;
    shippingMinor: number | null;
    totalMinor: number | null;
    currency: string;
    retailer: { slug: string; name: string };
    lastSuccessAt: string;
    labels: DealLabelKey[];
    isSponsored: boolean;
  } | null;
  offerCount: number;
  retailerCount: number;
  discount: { percent: number; caption: string } | null;
  dealScore: number | null;
  lastVerifiedAt: string | null;
  isTestData: boolean;
  sparkline: (number | null)[];
};

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  imageUrl: true,
  bestOfferId: true,
  offerCount: true,
  retailerCount: true,
  dealScore: true,
  lastVerifiedAt: true,
  isTestData: true,
  brand: { select: { name: true } },
  category: { select: { slug: true, name: true, icon: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

/** Kart verisi: en iyi teklif + 30 günlük günlük-en-düşük seri (gerçek kayıtlardan). */
export async function toCards(rows: CardRow[], now = new Date()): Promise<ProductCardData[]> {
  const offerIds = rows.map((r) => r.bestOfferId).filter((x): x is string => Boolean(x));
  const [offers, snaps] = await Promise.all([
    db.offer.findMany({
      where: { id: { in: offerIds } },
      select: {
        id: true,
        priceMinor: true,
        shippingMinor: true,
        totalMinor: true,
        currency: true,
        lastSuccessAt: true,
        dealLabels: true,
        isSponsored: true,
        metrics: true,
        retailer: { select: { slug: true, name: true } },
      },
    }),
    db.priceSnapshot.findMany({
      where: { offerId: { in: offerIds }, checkedAt: { gte: new Date(now.getTime() - 31 * DAY) } },
      select: { offerId: true, priceMinor: true, checkedAt: true },
      orderBy: { checkedAt: "asc" },
    }),
  ]);
  const offerById = new Map(offers.map((o) => [o.id, o]));
  const snapsBy = new Map<string, { priceMinor: number; checkedAt: Date }[]>();
  for (const s of snaps) {
    const a = snapsBy.get(s.offerId) ?? [];
    a.push(s);
    snapsBy.set(s.offerId, a);
  }
  return rows.map((r) => {
    const o = r.bestOfferId ? offerById.get(r.bestOfferId) : undefined;
    const obs = o ? [...(snapsBy.get(o.id) ?? []), { priceMinor: o.priceMinor, checkedAt: o.lastSuccessAt }] : [];
    const series = o ? dailySeries(obs, 30, { now }).map((d) => d.minMinor) : [];
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      brand: r.brand?.name ?? null,
      imageUrl: r.imageUrl,
      category: r.category,
      best: o
        ? {
            offerId: o.id,
            priceMinor: o.priceMinor,
            shippingMinor: o.shippingMinor,
            totalMinor: o.totalMinor,
            currency: o.currency,
            retailer: o.retailer,
            lastSuccessAt: o.lastSuccessAt.toISOString(),
            labels: o.dealLabels as DealLabelKey[],
            isSponsored: o.isSponsored,
          }
        : null,
      offerCount: r.offerCount,
      retailerCount: r.retailerCount,
      discount: headlineDiscount(o?.metrics as OfferMetrics | null),
      dealScore: r.dealScore,
      lastVerifiedAt: r.lastVerifiedAt?.toISOString() ?? null,
      isTestData: r.isTestData,
      sparkline: series.filter((v) => v !== null).length >= 3 ? series : [],
    };
  });
}

export function visibilityWhere(): Prisma.ProductWhereInput {
  return includeTestData() ? { isActive: true } : { isActive: true, isTestData: false };
}

/** pg_trgm ile yazım hatasına toleranslı arama; ilgililik sırasıyla ürün kimlikleri. */
export async function searchProductIds(q: string, limit = 500): Promise<string[]> {
  const nq = normalizeText(q);
  if (!nq) return [];
  const like = `%${nq.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT p.id
    FROM "Product" p
    WHERE p."isActive" = true
      AND (p."searchText" ILIKE ${like} OR word_similarity(${nq}, p."searchText") > 0.45 OR p."searchText" % ${nq})
    ORDER BY (p."searchText" ILIKE ${like}) DESC, word_similarity(${nq}, p."searchText") DESC, similarity(p."searchText", ${nq}) DESC
    LIMIT ${limit}`;
  return rows.map((r) => r.id);
}

export async function categoryAndDescendantIds(slug: string): Promise<{ ids: string[]; category: { id: string; slug: string; name: string; parentId: string | null } | null }> {
  const cat = await db.category.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, parentId: true, children: { select: { id: true } } } });
  if (!cat) return { ids: [], category: null };
  return { ids: [cat.id, ...cat.children.map((c) => c.id)], category: cat };
}

export async function buildProductWhere(f: ProductFilters, opts: { onlyCurrent: boolean; searchIds?: string[] | null }): Promise<Prisma.ProductWhereInput> {
  const and: Prisma.ProductWhereInput[] = [visibilityWhere()];
  if (opts.onlyCurrent) and.push({ bestOfferId: { not: null } });
  if (opts.searchIds) and.push({ id: { in: opts.searchIds } });
  if (f.kategori) {
    const { ids } = await categoryAndDescendantIds(f.kategori);
    and.push({ categoryId: { in: ids.length ? ids : ["-"] } });
  }
  if (f.marka.length) and.push({ brand: { slug: { in: f.marka } } });
  if (f.magaza.length) and.push({ offers: { some: { retailer: { slug: { in: f.magaza } }, status: "ACTIVE" } } });
  if (f.min !== undefined) and.push({ bestTotalMinor: { gte: f.min } });
  if (f.max !== undefined) and.push({ bestTotalMinor: { lte: f.max } });
  if (f.indirim) and.push({ verifiedDiscountPct: { gte: f.indirim } });
  if (f.stok) and.push({ inStock: true });
  if (f.kupon) and.push({ hasVerifiedCoupon: true });
  if (f.taze) and.push({ lastVerifiedAt: { gte: new Date(Date.now() - f.taze * 3600_000) } });
  if (f.etiket) and.push({ offers: { some: { status: "ACTIVE", dealLabels: { has: LABEL_FILTERS[f.etiket] } } } });
  for (const [key, value] of Object.entries(f.attrs)) {
    if (["connectivity", "color", "capacity", "size"].includes(key)) {
      and.push({ variants: { some: { attributes: { path: [key], equals: value }, offers: { some: { status: "ACTIVE" } } } } });
    } else {
      and.push({ specs: { path: [key], equals: value } });
    }
  }
  return { AND: and };
}

export function orderByFor(sort: SortKey | undefined, hasQuery: boolean): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort ?? (hasQuery ? "ilgili" : "avantaj")) {
    case "fiyat-artan":
      return [{ bestTotalMinor: { sort: "asc", nulls: "last" } }];
    case "indirim":
      return [{ verifiedDiscountPct: { sort: "desc", nulls: "last" } }, { dealScore: { sort: "desc", nulls: "last" } }];
    case "dusus":
      return [{ recentDropPct: { sort: "desc", nulls: "last" } }, { dealScore: { sort: "desc", nulls: "last" } }];
    case "yeni":
      return [{ createdAt: "desc" }];
    case "guncel":
      return [{ lastVerifiedAt: { sort: "desc", nulls: "last" } }];
    case "populer":
      return [{ popularity: "desc" }, { dealScore: { sort: "desc", nulls: "last" } }];
    case "ilgili":
      return [];
    default:
      return [{ dealScore: { sort: "desc", nulls: "last" } }, { verifiedDiscountPct: { sort: "desc", nulls: "last" } }];
  }
}

export async function listProducts(f: ProductFilters, opts: { onlyCurrent?: boolean } = {}) {
  const page = f.sayfa ?? 1;
  const searchIds = f.q ? await searchProductIds(f.q) : null;
  const where = await buildProductWhere(f, { onlyCurrent: opts.onlyCurrent ?? !f.q, searchIds });
  const orderBy = orderByFor(f.sirala, Boolean(f.q));
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    orderBy.length
      ? db.product.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: cardSelect })
      : (async () => {
          // İlgililik sırası: arama sonucundaki sırayı koru; güncel teklifi olanlar önce
          const all = await db.product.findMany({ where, select: { id: true, bestOfferId: true } });
          const rank = new Map((searchIds ?? []).map((id, i) => [id, i]));
          const ordered = all
            .sort((a, b) => Number(Boolean(b.bestOfferId)) - Number(Boolean(a.bestOfferId)) || (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map((x) => x.id);
          const items = await db.product.findMany({ where: { id: { in: ordered } }, select: cardSelect });
          const pos = new Map(ordered.map((id, i) => [id, i]));
          return items.sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
        })(),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), items: await toCards(rows) };
}

export type Facets = {
  brands: { slug: string; name: string; count: number }[];
  retailers: { slug: string; name: string; count: number }[];
  attributes: { key: string; label: string; source: "variant" | "spec"; options: { value: string; label: string; count: number }[] }[];
};

/** Filtre seçenekleri (kategori kapsamında, gerçek verilerden). */
export async function facetsFor(categorySlug?: string): Promise<Facets> {
  const vis = visibilityWhere();
  const { ids, category } = categorySlug ? await categoryAndDescendantIds(categorySlug) : { ids: [] as string[], category: null };
  const productWhere: Prisma.ProductWhereInput = { ...vis, bestOfferId: { not: null }, ...(ids.length ? { categoryId: { in: ids } } : {}) };
  const [brandRows, retailerRows] = await Promise.all([
    db.product.groupBy({ by: ["brandId"], where: { ...productWhere, brandId: { not: null } }, _count: true, orderBy: { _count: { brandId: "desc" } }, take: 30 }),
    db.offer.groupBy({ by: ["retailerId"], where: { status: "ACTIVE", product: productWhere }, _count: true }),
  ]);
  const [brands, retailers] = await Promise.all([
    db.brand.findMany({ where: { id: { in: brandRows.map((b) => b.brandId!).filter(Boolean) } }, select: { id: true, slug: true, name: true } }),
    db.retailer.findMany({ where: { id: { in: retailerRows.map((r) => r.retailerId) } }, select: { id: true, slug: true, name: true } }),
  ]);
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const retailerMap = new Map(retailers.map((r) => [r.id, r]));

  const attributes: Facets["attributes"] = [];
  if (category) {
    const cat = await db.category.findUnique({ where: { id: category.id }, select: { filterSchema: true } });
    const schema = (cat?.filterSchema ?? []) as { key: string; label: string; source: "variant" | "spec"; options?: { value: string; label: string }[] }[];
    for (const def of schema) {
      let values: { value: string; count: number }[] = [];
      if (def.source === "variant") {
        values = (
          await db.$queryRaw<{ value: string; count: bigint }[]>`
            SELECT v.attributes->>${def.key} AS value, count(DISTINCT v."productId") AS count
            FROM "ProductVariant" v JOIN "Product" p ON p.id = v."productId"
            WHERE p."categoryId" = ANY(${ids}::text[]) AND p."bestOfferId" IS NOT NULL AND v.attributes ? ${def.key}
            GROUP BY 1 ORDER BY 2 DESC LIMIT 12`
        ).map((r) => ({ value: r.value, count: Number(r.count) }));
      } else {
        values = (
          await db.$queryRaw<{ value: string; count: bigint }[]>`
            SELECT p.specs->>${def.key} AS value, count(*) AS count
            FROM "Product" p
            WHERE p."categoryId" = ANY(${ids}::text[]) AND p."bestOfferId" IS NOT NULL AND p.specs ? ${def.key}
            GROUP BY 1 ORDER BY 2 DESC LIMIT 12`
        ).map((r) => ({ value: r.value, count: Number(r.count) }));
      }
      if (values.length === 0) continue;
      const labelOf = (v: string) => def.options?.find((o) => o.value === v)?.label ?? (def.key === "capacity" ? v.toUpperCase() : v.charAt(0).toUpperCase() + v.slice(1));
      attributes.push({ key: def.key, label: def.label, source: def.source, options: values.map((v) => ({ value: v.value, label: labelOf(v.value), count: v.count })) });
    }
  }

  return {
    brands: brandRows.map((b) => ({ ...brandMap.get(b.brandId!)!, count: b._count })).filter((b) => b.slug),
    retailers: retailerRows.map((r) => ({ ...retailerMap.get(r.retailerId)!, count: r._count })).filter((r) => r.slug).sort((a, b) => b.count - a.count),
    attributes,
  };
}

export async function productCardsWhere(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[], take: number) {
  const rows = await db.product.findMany({ where: { AND: [visibilityWhere(), where] }, orderBy, take, select: cardSelect });
  return toCards(rows);
}

export async function productCardsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.product.findMany({ where: { AND: [visibilityWhere(), { id: { in: ids } }] }, select: cardSelect });
  const pos = new Map(ids.map((id, i) => [id, i]));
  return toCards(rows.sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0)));
}
