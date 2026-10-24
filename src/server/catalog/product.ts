import "server-only";
import { DAY } from "@/lib/time";
import { db } from "../db";
import { CONDITION_LABELS, isCouponCurrentlyValid } from "../pricing/coupons";
import type { DealLabelKey, OfferMetrics, ScoreFactor } from "../pricing/evaluate";
import { dailySeries } from "../pricing/stats";
import { includeTestData } from "../visibility";
import { productCardsWhere } from "./queries";

export type OfferRow = {
  id: string;
  retailer: { slug: string; name: string; brandColor: string | null; affiliateEnabled: boolean };
  variantId: string;
  variantLabel: string;
  title: string;
  sellerName: string | null;
  priceMinor: number;
  listPriceMinor: number | null;
  shippingMinor: number | null;
  totalMinor: number | null;
  currency: string;
  stockStatus: string;
  status: string;
  lastCheckedAt: string;
  lastSuccessAt: string;
  firstSeenAt: string;
  labels: DealLabelKey[];
  dealScore: number | null;
  breakdown: { factors: ScoreFactor[]; blockedReason: string | null; configVersion: number } | null;
  metrics: OfferMetrics | null;
  flaggedSuspicious: boolean;
  isSponsored: boolean;
  isTestData: boolean;
  sourceName: string;
  sourceAdapter: string;
  freshnessWindowMinutes: number;
  promotions: { title: string; endsAt: string | null }[];
  matchMethod: string;
  matchConfidence: number;
};

export type ChartSeries = { retailerSlug: string; retailerName: string; variantLabel: string; offerId: string; points: { t: number; v: number | null }[] };

export async function getProductDetail(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: { include: { parent: true } },
      variants: { orderBy: { label: "asc" } },
      offers: {
        where: { status: { not: "EXPIRED" } },
        include: {
          retailer: { select: { id: true, slug: true, name: true, brandColor: true, affiliateEnabled: true } },
          dataSource: { select: { name: true, adapter: true, isTestData: true, freshnessWindowMinutes: true } },
          variant: { select: { label: true } },
          promotions: { where: { isActive: true }, select: { title: true, endsAt: true } },
        },
      },
      editorialItems: { where: { content: { status: "PUBLISHED" } }, include: { content: { select: { slug: true, title: true, type: true, publishedAt: true } } } },
    },
  });
  if (!product || !product.isActive) return null;
  if (product.isTestData && !includeTestData()) return null;

  const now = new Date();
  const offerIds = product.offers.map((o) => o.id);
  const [snapshots, coupons] = await Promise.all([
    db.priceSnapshot.findMany({
      where: { offerId: { in: offerIds }, checkedAt: { gte: new Date(now.getTime() - 181 * DAY) } },
      select: { offerId: true, priceMinor: true, checkedAt: true },
      orderBy: { checkedAt: "asc" },
    }),
    db.coupon.findMany({
      where: { retailerId: { in: [...new Set(product.offers.map((o) => o.retailerId))] }, isActive: true },
      include: { retailer: { select: { name: true, slug: true } }, dataSource: { select: { isTestData: true } } },
      orderBy: [{ verificationStatus: "asc" }, { validUntil: "asc" }],
    }),
  ]);

  const offers: OfferRow[] = product.offers
    .map((o) => ({
      id: o.id,
      retailer: { slug: o.retailer.slug, name: o.retailer.name, brandColor: o.retailer.brandColor, affiliateEnabled: o.retailer.affiliateEnabled },
      variantId: o.variantId,
      variantLabel: o.variant.label,
      title: o.title,
      sellerName: o.sellerName,
      priceMinor: o.priceMinor,
      listPriceMinor: o.listPriceMinor,
      shippingMinor: o.shippingMinor,
      totalMinor: o.totalMinor,
      currency: o.currency,
      stockStatus: o.stockStatus,
      status: o.status,
      lastCheckedAt: o.lastCheckedAt.toISOString(),
      lastSuccessAt: o.lastSuccessAt.toISOString(),
      firstSeenAt: o.firstSeenAt.toISOString(),
      labels: o.dealLabels as DealLabelKey[],
      dealScore: o.dealScore,
      breakdown: (o.dealScoreBreakdown as OfferRow["breakdown"]) ?? null,
      metrics: (o.metrics as OfferMetrics | null) ?? null,
      flaggedSuspicious: o.flaggedSuspicious,
      isSponsored: o.isSponsored,
      isTestData: o.dataSource.isTestData,
      sourceName: o.dataSource.name,
      sourceAdapter: o.dataSource.adapter,
      freshnessWindowMinutes: o.dataSource.freshnessWindowMinutes,
      promotions: o.promotions.map((p) => ({ title: p.title, endsAt: p.endsAt?.toISOString() ?? null })),
      matchMethod: o.matchMethod,
      matchConfidence: o.matchConfidence,
    }))
    .sort((a, b) => {
      const rank = (s: string) => (s === "ACTIVE" ? 0 : s === "REVALIDATING" ? 1 : s === "OUT_OF_STOCK" ? 2 : 3);
      return rank(a.status) - rank(b.status) || (a.totalMinor ?? a.priceMinor) - (b.totalMinor ?? b.priceMinor);
    });

  const byOffer = new Map<string, { priceMinor: number; checkedAt: Date }[]>();
  for (const s of snapshots) {
    const a = byOffer.get(s.offerId) ?? [];
    a.push(s);
    byOffer.set(s.offerId, a);
  }

  // Grafik serileri: mağaza bazında (renk mağazaya bağlıdır, sıralamaya değil)
  const series: ChartSeries[] = product.offers
    .filter((o) => o.status !== "DISABLED")
    .sort((a, b) => a.retailer.slug.localeCompare(b.retailer.slug) || a.variant.label.localeCompare(b.variant.label))
    .map((o) => {
      const obs = [...(byOffer.get(o.id) ?? []), { priceMinor: o.priceMinor, checkedAt: o.lastSuccessAt }];
      return {
        retailerSlug: o.retailer.slug,
        retailerName: o.retailer.name,
        variantLabel: o.variant.label,
        offerId: o.id,
        points: dailySeries(obs, 180, { now }).map((d) => ({ t: d.day, v: d.minMinor })),
      };
    })
    .filter((s) => s.points.some((p) => p.v !== null));

  const firstSnapshot = snapshots[0]?.checkedAt ?? null;
  const lastCheck = product.offers.reduce<Date | null>((m, o) => (!m || o.lastCheckedAt > m ? o.lastCheckedAt : m), null);

  const visibleCoupons = coupons
    .filter((c) => includeTestData() || !c.dataSource?.isTestData)
    .map((c) => ({
      id: c.id,
      retailer: c.retailer,
      code: c.code,
      title: c.title,
      description: c.description,
      conditionType: c.conditionType,
      conditionLabel: CONDITION_LABELS[c.conditionType],
      discountType: c.discountType,
      discountValue: c.discountValue,
      minBasketMinor: c.minBasketMinor,
      maxDiscountMinor: c.maxDiscountMinor,
      validFrom: c.validFrom?.toISOString() ?? null,
      validUntil: c.validUntil?.toISOString() ?? null,
      verificationStatus: c.verificationStatus,
      lastCheckedAt: c.lastCheckedAt?.toISOString() ?? null,
      restrictions: c.restrictions,
      stackable: c.stackable,
      currentlyValid: isCouponCurrentlyValid(c, now),
      isTestData: Boolean(c.dataSource?.isTestData),
    }));

  const best = offers.find((o) => o.id === product.bestOfferId) ?? null;
  const bestTotal = product.bestTotalMinor;
  const [similar, cheaper] = await Promise.all([
    productCardsWhere({ categoryId: product.categoryId, id: { not: product.id }, bestOfferId: { not: null } }, [{ dealScore: { sort: "desc", nulls: "last" } }], 8),
    bestTotal
      ? productCardsWhere(
          { categoryId: product.categoryId, id: { not: product.id }, bestOfferId: { not: null }, bestTotalMinor: { lt: Math.round(bestTotal * 0.85), gte: Math.round(bestTotal * 0.35) } },
          [{ dealScore: { sort: "desc", nulls: "last" } }],
          4,
        )
      : Promise.resolve([]),
  ]);

  return {
    product: {
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand ? { name: product.brand.name, slug: product.brand.slug } : null,
      category: { slug: product.category.slug, name: product.category.name, icon: product.category.icon, parent: product.category.parent ? { slug: product.category.parent.slug, name: product.category.parent.name } : null },
      modelNumber: product.modelNumber,
      description: product.description,
      imageUrl: product.imageUrl,
      specs: (product.specs ?? {}) as Record<string, string>,
      variants: product.variants.map((v) => ({ id: v.id, label: v.label, gtin: v.gtin, attributes: v.attributes as Record<string, string> })),
      bestOfferId: product.bestOfferId,
      dealScore: product.dealScore,
      isTestData: product.isTestData,
      lastVerifiedAt: product.lastVerifiedAt?.toISOString() ?? null,
      createdAt: product.createdAt.toISOString(),
    },
    offers,
    best,
    series,
    coupons: visibleCoupons,
    firstTrackedAt: firstSnapshot?.toISOString() ?? product.createdAt.toISOString(),
    lastCheckedAt: lastCheck?.toISOString() ?? null,
    similar: similar.filter((s) => !cheaper.some((c) => c.id === s.id)).slice(0, 6),
    cheaper,
    editorial: product.editorialItems.map((e) => ({ slug: e.content.slug, title: e.content.title, type: e.content.type, note: e.note })),
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;
