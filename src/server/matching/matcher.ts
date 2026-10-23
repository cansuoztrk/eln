/**
 * Yeni bir kaynak kaydını (listing) mevcut ürün/varyanta bağlar veya yeni ürün oluşturur.
 *
 * Güven sırası:
 *   1. GTIN/EAN (kontrol basamağı doğrulanmış) ............ 0,99 — otomatik
 *   2. Marka + üretici parça numarası (MPN) ................ 0,95 — otomatik (nitelik çelişkisi
 *      varsa aynı ürünün yeni varyantı olur)
 *   3. Başlık benzerliği .................................... ≤0,9 — varsayılan olarak OTOMATİK
 *      BİRLEŞTİRİLMEZ: yeni ürün açılır ve aday yönetici incelemesine (MatchCandidate) düşer.
 */

import { normalizeGtin, normalizeMpn, normalizeText, slugify } from "@/lib/text";
import type { Prisma } from "@/generated/prisma/client";
import type { Db } from "../db";
import type { NormalizedListing } from "../integrations/types";
import { extractAttributes, modelTokens, type VariantAttributes, variantKey, variantLabel } from "./attributes";
import { classifyListing } from "./classify";
import { type CandidateScore, familyKey, familyTitle, scoreCandidate } from "./similarity";

export type MatchSettings = {
  /** Başlık benzerliğiyle otomatik birleştirme eşiği. >1 = kapalı (varsayılan). */
  titleAutoMergeThreshold: number;
  /** Bu eşiğin üzerindeki adaylar incelemeye düşer. */
  reviewThreshold: number;
};

export const DEFAULT_MATCH_SETTINGS: MatchSettings = { titleAutoMergeThreshold: 1.01, reviewThreshold: 0.5 };

export type MatchResult = {
  productId: string;
  variantId: string;
  method: "GTIN" | "BRAND_MPN" | "TITLE_SIMILARITY" | "NEW_PRODUCT";
  confidence: number;
  reviewCandidates: { productId: string; score: CandidateScore }[];
  createdProduct: boolean;
};

export async function findOrCreateBrand(db: Db | Prisma.TransactionClient, raw: string | null): Promise<string | null> {
  if (!raw) return null;
  const name = raw.trim();
  if (!name) return null;
  const slug = slugify(name, 60);
  const norm = normalizeText(name);
  const existing = await db.brand.findFirst({ where: { OR: [{ slug }, { aliases: { has: norm } }] }, select: { id: true } });
  if (existing) return existing.id;
  try {
    const created = await db.brand.create({ data: { slug, name: titleCaseBrand(name), aliases: [norm] }, select: { id: true } });
    return created.id;
  } catch {
    const again = await db.brand.findUnique({ where: { slug }, select: { id: true } });
    return again?.id ?? null;
  }
}

function titleCaseBrand(name: string): string {
  return name === name.toUpperCase() && name.length > 4 ? name.charAt(0) + name.slice(1).toLowerCase() : name;
}

export function buildSearchText(parts: (string | null | undefined)[]): string {
  return normalizeText(parts.filter(Boolean).join(" ")).slice(0, 2000);
}

async function uniqueProductSlug(db: Db, base: string): Promise<string> {
  const slug = slugify(base, 70);
  const taken = await db.product.findMany({ where: { slug: { startsWith: slug } }, select: { slug: true } });
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(slug)) return slug;
  for (let i = 2; i < 500; i++) if (!set.has(`${slug}-${i}`)) return `${slug}-${i}`;
  return `${slug}-${Date.now().toString(36)}`;
}

async function ensureVariant(
  db: Db,
  productId: string,
  attrs: VariantAttributes,
  listing: NormalizedListing,
): Promise<string> {
  const key = variantKey(attrs);
  const gtin = normalizeGtin(listing.gtin);
  const existing = await db.productVariant.findUnique({ where: { productId_variantKey: { productId, variantKey: key } }, select: { id: true, gtin: true } });
  if (existing) {
    if (!existing.gtin && gtin) {
      const clash = await db.productVariant.findUnique({ where: { gtin }, select: { id: true } });
      if (!clash) await db.productVariant.update({ where: { id: existing.id }, data: { gtin } });
    }
    return existing.id;
  }
  const gtinFree = gtin ? !(await db.productVariant.findUnique({ where: { gtin }, select: { id: true } })) : false;
  const created = await db.productVariant.create({
    data: {
      productId,
      variantKey: key,
      label: variantLabel(attrs),
      gtin: gtinFree ? gtin : null,
      mpn: normalizeMpn(listing.mpn),
      attributes: attrs as Prisma.InputJsonValue,
      imageUrl: listing.imageUrl,
    },
    select: { id: true },
  });
  return created.id;
}

async function titleCandidates(db: Db, categoryId: string | null, brandId: string | null, title: string) {
  const q = normalizeText(familyTitle(title));
  // Farklı dilde başlıklar (ör. "Gaming Mouse" / "Oyuncu Faresi") için model kodu belirteçleri de aday getirir.
  const tokens = brandId ? modelTokens(title).slice(0, 3) : [];
  // Parametreli sorgu (SQL enjeksiyonuna kapalı). pg_trgm benzerliği ile ilk 8 aday.
  const rows = await db.$queryRaw<{ id: string; title: string; brand: string | null; sim: number }[]>`
    SELECT p.id, p.title, b.name AS brand,
      GREATEST(similarity(coalesce(p."familyKey", p."searchText"), ${q}), word_similarity(${q}, p."searchText")) AS sim
    FROM "Product" p
    LEFT JOIN "Brand" b ON b.id = p."brandId"
    WHERE p."isActive" = true
      AND (${categoryId}::text IS NULL OR p."categoryId" = ${categoryId})
      AND (${brandId}::text IS NULL OR p."brandId" = ${brandId} OR p."brandId" IS NULL)
      AND (
        similarity(coalesce(p."familyKey", p."searchText"), ${q}) > 0.2
        OR word_similarity(${q}, p."searchText") > 0.35
        OR (cardinality(${tokens}::text[]) > 0 AND EXISTS (
          SELECT 1 FROM unnest(${tokens}::text[]) t WHERE replace(p."searchText", '-', '') LIKE '%' || t || '%'
        ))
      )
    ORDER BY sim DESC
    LIMIT 8`;
  return rows;
}

export async function resolveListing(
  db: Db,
  listing: NormalizedListing,
  source: { key: string },
  settings: MatchSettings = DEFAULT_MATCH_SETTINGS,
): Promise<MatchResult> {
  const attrs = extractAttributes(listing.title, listing.specs, listing.attributes);
  const brandId = await findOrCreateBrand(db, listing.brand);
  const gtin = normalizeGtin(listing.gtin);
  const mpn = normalizeMpn(listing.mpn);

  // 1) GTIN
  if (gtin) {
    const v = await db.productVariant.findUnique({ where: { gtin }, select: { id: true, productId: true } });
    if (v) return { productId: v.productId, variantId: v.id, method: "GTIN", confidence: 0.99, reviewCandidates: [], createdProduct: false };
  }

  // 2) Marka + MPN
  if (mpn && brandId) {
    const v = await db.productVariant.findFirst({ where: { mpn, product: { brandId } }, select: { id: true, productId: true, variantKey: true } });
    if (v) {
      const key = variantKey(attrs);
      if (v.variantKey === key) return { productId: v.productId, variantId: v.id, method: "BRAND_MPN", confidence: 0.95, reviewCandidates: [], createdProduct: false };
      const variantId = await ensureVariant(db, v.productId, attrs, listing);
      return { productId: v.productId, variantId, method: "BRAND_MPN", confidence: 0.9, reviewCandidates: [], createdProduct: false };
    }
  }

  // 3) Aynı marka + birebir aynı model ailesi (varyant sözcükleri hariç başlık) → aynı ürün;
  //    renk/bağlantı/kapasite farkı ayrı varyant olur. Model kodu çelişkisi olamaz çünkü başlık birebir aynıdır.
  const fKey = familyKey(listing.title);
  if (brandId && fKey.length >= 6) {
    const sameFamily = await db.product.findFirst({ where: { brandId, familyKey: fKey, isActive: true }, select: { id: true } });
    if (sameFamily) {
      const variantId = await ensureVariant(db, sameFamily.id, attrs, listing);
      return { productId: sameFamily.id, variantId, method: "TITLE_SIMILARITY", confidence: 0.9, reviewCandidates: [], createdProduct: false };
    }
  }

  // 4) Başlık benzerliği
  const { categoryId } = await classifyListing(db, { categoryPath: listing.categoryPath, title: listing.title, sourceKey: source.key });
  const rows = await titleCandidates(db, categoryId, brandId, listing.title);
  const scored = rows
    .map((r) => ({ productId: r.id, score: scoreCandidate({ title: listing.title, brand: listing.brand, attributes: attrs }, { title: r.title, brand: r.brand }) }))
    .sort((a, b) => b.score.confidence - a.score.confidence);
  const best = scored[0];
  if (
    best &&
    best.score.confidence >= settings.titleAutoMergeThreshold &&
    best.score.signals.brandMatch === true &&
    !best.score.signals.conflictingModelTokens
  ) {
    const variantId = await ensureVariant(db, best.productId, attrs, listing);
    return { productId: best.productId, variantId, method: "TITLE_SIMILARITY", confidence: best.score.confidence, reviewCandidates: [], createdProduct: false };
  }

  // 5) Yeni ürün
  if (!categoryId) throw new Error("Varsayılan kategori (diger-firsatlar) bulunamadı; seed çalıştırılmalı.");
  const title = familyTitle(listing.title) || listing.title;
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { name: true } });
  const brandName = brandId ? (await db.brand.findUnique({ where: { id: brandId }, select: { name: true } }))?.name : null;
  const product = await db.product.create({
    data: {
      slug: await uniqueProductSlug(db, title),
      title,
      brandId,
      categoryId,
      modelNumber: listing.modelNumber,
      familyKey: brandId ? fKey : null,
      description: listing.description,
      imageUrl: listing.imageUrl,
      specs: listing.specs as Prisma.InputJsonValue,
      searchText: buildSearchText([title, brandName, listing.modelNumber, mpn, gtin, category?.name, variantLabel(attrs)]),
    },
    select: { id: true },
  });
  const variantId = await ensureVariant(db, product.id, attrs, listing);
  const reviewCandidates = scored.filter((s) => s.score.confidence >= settings.reviewThreshold).slice(0, 3);
  return { productId: product.id, variantId, method: "NEW_PRODUCT", confidence: 1, reviewCandidates, createdProduct: true };
}
