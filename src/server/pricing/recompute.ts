/**
 * Ürün ve teklif seviyesinde fırsat metriklerini yeniden hesaplar ve önbellek alanlarını günceller.
 * İngestion sonrası etkilenen ürünler için, ayrıca günlük görevle tüm katalog için çalışır.
 */

import type { Prisma } from "@/generated/prisma/client";
import { DAY, MINUTE } from "@/lib/time";
import type { Db } from "../db";
import { type ScoringConfigValue, mergeScoringConfig } from "./config";
import { bestApplicableCoupon, type CouponLike } from "./coupons";
import { type CompetitorOffer, type OfferStatus, evaluateOffer } from "./evaluate";
import { computePriceStats } from "./stats";

let configCache: { at: number; value: ScoringConfigValue } | null = null;

export async function loadScoringConfig(db: Db): Promise<ScoringConfigValue> {
  if (configCache && Date.now() - configCache.at < 60_000) return configCache.value;
  const row = await db.scoringConfig.findFirst({ where: { isActive: true }, orderBy: { version: "desc" } });
  const value = mergeScoringConfig(row ? { version: row.version, weights: row.weights, thresholds: row.thresholds } : null);
  configCache = { at: Date.now(), value };
  return value;
}

export function invalidateScoringConfigCache() {
  configCache = null;
}

/** Teklif durumunu zaman damgalarından türetir (saf fonksiyon). */
export function deriveOfferStatus(
  o: { status: OfferStatus; disabledByAdmin: boolean; stockStatus: string; lastCheckedAt: Date; lastSuccessAt: Date },
  freshnessWindowMinutes: number,
  now: Date,
): OfferStatus {
  if (o.disabledByAdmin) return "DISABLED";
  if (o.status === "EXPIRED") return "EXPIRED";
  const age = now.getTime() - o.lastSuccessAt.getTime();
  if (age > freshnessWindowMinutes * MINUTE) return "STALE";
  if (o.lastCheckedAt.getTime() > o.lastSuccessAt.getTime() + MINUTE) return "REVALIDATING";
  if (o.stockStatus === "OUT_OF_STOCK") return "OUT_OF_STOCK";
  return "ACTIVE";
}

export async function recomputeProducts(db: Db, productIds: string[], now = new Date()): Promise<{ products: number; offers: number }> {
  const unique = [...new Set(productIds)];
  if (unique.length === 0) return { products: 0, offers: 0 };
  const config = await loadScoringConfig(db);
  let offersUpdated = 0;

  for (let i = 0; i < unique.length; i += 25) {
    const chunk = unique.slice(i, i + 25);
    const products = await db.product.findMany({
      where: { id: { in: chunk } },
      select: {
        id: true,
        category: { select: { slug: true, parent: { select: { slug: true } } } },
        offers: {
          select: {
            id: true,
            retailerId: true,
            priceMinor: true,
            listPriceMinor: true,
            shippingMinor: true,
            currency: true,
            stockStatus: true,
            status: true,
            disabledByAdmin: true,
            flaggedSuspicious: true,
            lastCheckedAt: true,
            lastSuccessAt: true,
            promotions: { where: { isActive: true }, select: { endsAt: true } },
            dataSource: { select: { freshnessWindowMinutes: true, isTestData: true } },
          },
        },
      },
    });

    const offerIds = products.flatMap((p) => p.offers.map((o) => o.id));
    const retailerIds = [...new Set(products.flatMap((p) => p.offers.map((o) => o.retailerId)))];
    const [snapshots, coupons, clicks, favorites] = await Promise.all([
      db.priceSnapshot.findMany({
        where: { offerId: { in: offerIds }, checkedAt: { gte: new Date(now.getTime() - 181 * DAY) } },
        select: { offerId: true, priceMinor: true, checkedAt: true },
        orderBy: { checkedAt: "asc" },
      }),
      db.coupon.findMany({ where: { retailerId: { in: retailerIds }, isActive: true, verificationStatus: "VERIFIED" } }),
      db.clickEvent.groupBy({ by: ["productId"], where: { productId: { in: chunk }, createdAt: { gte: new Date(now.getTime() - 7 * DAY) } }, _count: true }),
      db.userFavorite.groupBy({ by: ["productId"], where: { productId: { in: chunk } }, _count: true }),
    ]);
    const snapsByOffer = new Map<string, { priceMinor: number; checkedAt: Date }[]>();
    for (const s of snapshots) {
      const arr = snapsByOffer.get(s.offerId) ?? [];
      arr.push(s);
      snapsByOffer.set(s.offerId, arr);
    }
    const clickCount = new Map(clicks.map((c) => [c.productId, c._count]));
    const favCount = new Map(favorites.map((f) => [f.productId, f._count]));

    for (const product of products) {
      const categorySlugs = [product.category.slug, product.category.parent?.slug].filter((s): s is string => Boolean(s));
      const engagement = (clickCount.get(product.id) ?? 0) + (favCount.get(product.id) ?? 0) * 3;

      const withStatus = product.offers.map((o) => ({
        ...o,
        derivedStatus: deriveOfferStatus(o, o.dataSource.freshnessWindowMinutes, now),
      }));
      const competitors: CompetitorOffer[] = withStatus
        .filter((o) => o.derivedStatus === "ACTIVE" && !o.flaggedSuspicious)
        .map((o) => ({ offerId: o.id, retailerId: o.retailerId, priceMinor: o.priceMinor, shippingMinor: o.shippingMinor, currency: o.currency }));

      type Eligible = { id: string; total: number; totalKnown: boolean; score: number | null; verifiedDiscountPct: number | null; recentDropPct: number | null; coupon: boolean; currency: string };
      const eligible: Eligible[] = [];

      for (const o of withStatus) {
        const obs = [...(snapsByOffer.get(o.id) ?? []), { priceMinor: o.priceMinor, checkedAt: o.lastSuccessAt }];
        const stats = computePriceStats(obs, { now });
        const coupon = bestApplicableCoupon(o, categorySlugs, coupons as unknown as CouponLike[], now);
        const promoEnd = o.promotions.map((p) => p.endsAt).filter((d): d is Date => d instanceof Date && d > now).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
        const ev = evaluateOffer({
          offer: {
            id: o.id,
            retailerId: o.retailerId,
            priceMinor: o.priceMinor,
            listPriceMinor: o.listPriceMinor,
            shippingMinor: o.shippingMinor,
            currency: o.currency,
            stockStatus: o.stockStatus,
            status: o.derivedStatus,
            lastSuccessAt: o.lastSuccessAt,
            flaggedSuspicious: o.flaggedSuspicious,
            freshnessWindowMinutes: o.dataSource.freshnessWindowMinutes,
            promotionEndsAt: promoEnd,
          },
          stats,
          competitors,
          coupon,
          engagement,
          config,
          now,
        });

        await db.offer.update({
          where: { id: o.id },
          data: {
            status: o.derivedStatus,
            dealScore: ev.score,
            dealScoreBreakdown: { factors: ev.breakdown, blockedReason: ev.scoreBlockedReason, configVersion: config.version } as unknown as Prisma.InputJsonValue,
            dealLabels: ev.labels,
            metrics: ev.metrics as unknown as Prisma.InputJsonValue,
            verifiedDiscountPct: ev.metrics.verifiedDiscount?.percent ?? null,
            recentDropPct: ev.metrics.recentDropPct,
            scoredAt: now,
          },
        });
        offersUpdated++;

        if (o.derivedStatus === "ACTIVE" && !o.flaggedSuspicious && o.stockStatus !== "OUT_OF_STOCK") {
          eligible.push({
            id: o.id,
            total: ev.metrics.totalMinor ?? o.priceMinor,
            totalKnown: ev.metrics.totalMinor !== null,
            score: ev.score,
            verifiedDiscountPct: ev.metrics.verifiedDiscount?.percent ?? null,
            recentDropPct: ev.metrics.recentDropPct,
            coupon: Boolean(coupon),
            currency: o.currency,
          });
        }
      }

      // En iyi teklif: kargo dâhil en düşük toplam (kargosu bilinmeyenler eşitlikte geride kalır)
      eligible.sort((a, b) => a.total - b.total || Number(b.totalKnown) - Number(a.totalKnown));
      const best = eligible[0];
      const scores = eligible.map((e) => e.score).filter((s): s is number => s !== null);
      const activeRetailers = new Set(withStatus.filter((o) => o.derivedStatus === "ACTIVE").map((o) => o.retailerId));
      const lastVerifiedAt = withStatus.reduce<Date | null>((max, o) => (!max || o.lastSuccessAt > max ? o.lastSuccessAt : max), null);
      await db.product.update({
        where: { id: product.id },
        data: {
          bestOfferId: best?.id ?? null,
          bestTotalMinor: best?.total ?? null,
          bestCurrency: best?.currency ?? null,
          offerCount: withStatus.filter((o) => o.derivedStatus === "ACTIVE").length,
          retailerCount: activeRetailers.size,
          dealScore: scores.length ? Math.max(...scores) : null,
          verifiedDiscountPct: best?.verifiedDiscountPct ?? null,
          recentDropPct: best?.recentDropPct ?? null,
          popularity: engagement,
          hasVerifiedCoupon: eligible.some((e) => e.coupon),
          inStock: eligible.length > 0,
          lastVerifiedAt,
          isTestData: product.offers.length > 0 && product.offers.every((o) => o.dataSource.isTestData),
        },
      });
    }
  }
  return { products: unique.length, offers: offersUpdated };
}

/** Tazelik penceresi aşılmış veya durumu değişmesi gereken tekliflerin ürünlerini bulur. */
export async function productsNeedingStatusRefresh(db: Db, now = new Date()): Promise<string[]> {
  const rows = await db.$queryRaw<{ productId: string }[]>`
    SELECT DISTINCT o."productId"
    FROM "Offer" o
    JOIN "DataSource" d ON d.id = o."dataSourceId"
    WHERE (
      o.status IN ('ACTIVE', 'OUT_OF_STOCK', 'REVALIDATING')
      AND o."lastSuccessAt" < ${now}::timestamptz - make_interval(mins => d."freshnessWindowMinutes")
    ) OR (
      o.status IN ('ACTIVE', 'OUT_OF_STOCK')
      AND o."lastCheckedAt" > o."lastSuccessAt" + interval '1 minute'
    )
    LIMIT 5000`;
  return rows.map((r) => r.productId);
}
