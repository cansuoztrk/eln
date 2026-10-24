/**
 * Fırsat değerlendirme motoru — saf fonksiyonlar.
 *
 * Girdi: teklifin güncel durumu, fiyat geçmişi istatistikleri, aynı ürünün diğer teklifleri,
 * uygulanabilir kupon ve etkileşim sayısı. Çıktı: açıklanabilir metrikler, koşulları gerçekten
 * sağlanan etiketler ve ağırlıklı fırsat puanı (0-100) ile her faktörün katkısı.
 *
 * Önemli ayrımlar:
 *  - "Doğrulanmış indirim" yalnızca kendi topladığımız fiyat geçmişine dayanır (30 gün medyanı
 *    veya kararlı önceki fiyat). Kaynağın liste fiyatına göre indirim AYRI bir metriktir ve
 *    sıralamada kullanılmaz.
 *  - Taze olmayan, şüpheli işaretlenmiş veya stokta olmayan teklifler puan almaz.
 */

import { discountPercent, formatMoney, formatPercent } from "@/lib/money";
import { DAY, HOUR, MINUTE } from "@/lib/time";
import { type ScoringConfigValue, type ScoringWeights, WEIGHT_LABELS } from "./config";
import type { CouponApplication } from "./coupons";
import type { PriceStats, WindowStat } from "./stats";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" | "UNKNOWN";
export type OfferStatus = "ACTIVE" | "REVALIDATING" | "STALE" | "OUT_OF_STOCK" | "EXPIRED" | "DISABLED";

export type OfferInput = {
  id: string;
  retailerId: string;
  priceMinor: number;
  listPriceMinor: number | null;
  shippingMinor: number | null;
  currency: string;
  stockStatus: StockStatus;
  status: OfferStatus;
  lastSuccessAt: Date;
  flaggedSuspicious: boolean;
  freshnessWindowMinutes: number;
  promotionEndsAt?: Date | null;
};

export type CompetitorOffer = {
  offerId: string;
  retailerId: string;
  priceMinor: number;
  shippingMinor: number | null;
  currency: string;
};

export { DEAL_LABELS, type DealLabelKey } from "@/lib/deal-labels";
import type { DealLabelKey } from "@/lib/deal-labels";

type WindowMetric = {
  coverageDays: number;
  sufficient: boolean;
  lowMinor: number | null;
  highMinor: number | null;
  medianMinor: number | null;
  priorLowMinor: number | null;
};

export type OfferMetrics = {
  computedAt: string;
  isFresh: boolean;
  ageMinutes: number;
  dataPoints: number;
  historyDays: number;
  firstSeenAt: string | null;
  currentSince: string | null;
  d30: WindowMetric;
  d90: WindowMetric;
  d180: WindowMetric;
  previous: { priceMinor: number; heldDays: number; endedAt: string; stable: boolean } | null;
  verifiedDiscount: { percent: number; reference: "MEDIAN_30" | "PREVIOUS_STABLE"; referenceMinor: number } | null;
  listDiscount: { percent: number; referenceMinor: number; credible: boolean | null; note: string | null } | null;
  aboveLow90Pct: number | null;
  recentDropPct: number | null;
  competitor: { offersCompared: number; retailersCompared: number; isBest: boolean; bestOtherMinor: number | null; gapPct: number | null } | null;
  totalMinor: number | null;
  shippingKnown: boolean;
  coupon: CouponApplication | null;
};

export type ScoreFactor = {
  key: keyof ScoringWeights;
  label: string;
  weight: number;
  value: number; // 0..1
  points: number; // puana katkı
  detail: string;
};

export type DealEvaluation = {
  metrics: OfferMetrics;
  labels: DealLabelKey[];
  score: number | null;
  breakdown: ScoreFactor[];
  scoreBlockedReason: string | null;
  suspicious: { flag: boolean; reason: string | null };
};

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

function windowMetric(w: WindowStat): WindowMetric {
  return {
    coverageDays: w.coverageDays,
    sufficient: w.sufficient,
    lowMinor: w.lowMinor,
    highMinor: w.highMinor,
    medianMinor: w.medianMinor,
    priorLowMinor: w.priorLowMinor,
  };
}

/** Tek kontrolde gerçekleşen aşırı fiyat değişimini şüpheli olarak işaretler. */
export function detectSuspiciousChange(
  previousMinor: number | null,
  nextMinor: number,
  thresholds: ScoringConfigValue["thresholds"],
): string | null {
  if (!previousMinor || previousMinor <= 0) return null;
  const change = ((nextMinor - previousMinor) / previousMinor) * 100;
  if (change <= -thresholds.suspiciousDropPct) {
    return `Tek kontrolde %${Math.round(-change)} düşüş (${formatMoney(previousMinor)} → ${formatMoney(nextMinor)}). Kaynak hatası olabilir; doğrulanana kadar fırsat olarak gösterilmez.`;
  }
  if (change >= thresholds.suspiciousRisePct) {
    return `Tek kontrolde %${Math.round(change)} artış. Kaynak verisi kontrol edilmeli.`;
  }
  return null;
}

export function evaluateOffer(params: {
  offer: OfferInput;
  stats: PriceStats;
  competitors: CompetitorOffer[];
  coupon: CouponApplication | null;
  engagement: number;
  config: ScoringConfigValue;
  now?: Date;
}): DealEvaluation {
  const { offer, stats, competitors, coupon, engagement, config } = params;
  const now = params.now ?? new Date();
  const t = config.thresholds;
  const price = offer.priceMinor;

  const ageMinutes = Math.max(0, (now.getTime() - offer.lastSuccessAt.getTime()) / MINUTE);
  const isFresh = ageMinutes <= offer.freshnessWindowMinutes && offer.status === "ACTIVE";
  const shippingKnown = offer.shippingMinor !== null;
  const totalMinor = shippingKnown ? price + (offer.shippingMinor ?? 0) : null;

  // ── Önceki doğrulanmış fiyat
  const previous = stats.previous
    ? {
        priceMinor: stats.previous.priceMinor,
        heldDays: round1(stats.previous.heldMs / DAY),
        endedAt: stats.previous.endedAt.toISOString(),
        stable: stats.previous.heldMs >= t.stablePreviousDays * DAY,
      }
    : null;

  // ── Doğrulanmış indirim (kendi fiyat geçmişimize göre)
  let verifiedDiscount: OfferMetrics["verifiedDiscount"] = null;
  if (stats.w30.sufficient && stats.w30.medianMinor) {
    const pct = discountPercent(stats.w30.medianMinor, price);
    if (pct !== null && pct > 0.5) verifiedDiscount = { percent: round1(pct), reference: "MEDIAN_30", referenceMinor: stats.w30.medianMinor };
  } else if (previous?.stable && previous.priceMinor > price) {
    const pct = discountPercent(previous.priceMinor, price);
    if (pct !== null && pct > 0.5) verifiedDiscount = { percent: round1(pct), reference: "PREVIOUS_STABLE", referenceMinor: previous.priceMinor };
  }

  // ── Liste fiyatına göre indirim (kaynak beyanı; ayrı metrik)
  let listDiscount: OfferMetrics["listDiscount"] = null;
  if (offer.listPriceMinor && offer.listPriceMinor > price) {
    const pct = discountPercent(offer.listPriceMinor, price) ?? 0;
    let credible: boolean | null = null;
    let note: string | null = null;
    if (stats.w90.sufficient && stats.w90.highMinor) {
      credible = offer.listPriceMinor <= stats.w90.highMinor * t.inflatedListPriceFactor;
      if (!credible) note = `Liste fiyatı (${formatMoney(offer.listPriceMinor)}) son 90 günde doğruladığımız en yüksek fiyatın (${formatMoney(stats.w90.highMinor)}) belirgin biçimde üzerinde.`;
    } else {
      note = "Liste fiyatının geçmişte uygulanıp uygulanmadığını doğrulamak için yeterli geçmiş veri yok.";
    }
    listDiscount = { percent: round1(pct), referenceMinor: offer.listPriceMinor, credible, note };
  }

  const low90 = stats.w90.sufficient ? stats.w90.lowMinor : null;
  const aboveLow90Pct = low90 ? round1(((price - low90) / low90) * 100) : null;
  const recentDropPct =
    stats.price7dAgoMinor && stats.price7dAgoMinor > price ? round1(((stats.price7dAgoMinor - price) / stats.price7dAgoMinor) * 100) : null;

  // ── Rakip karşılaştırması: yalnızca aynı para birimindeki diğer mağazaların taze teklifleri
  const others = competitors.filter((c) => c.offerId !== offer.id && c.currency === offer.currency);
  let competitor: OfferMetrics["competitor"] = null;
  const otherRetailers = new Set(others.map((c) => c.retailerId).filter((r) => r !== offer.retailerId));
  if (otherRetailers.size > 0) {
    const otherFromDifferentRetailers = others.filter((c) => c.retailerId !== offer.retailerId);
    // Rakibin kargosu bilinmiyorsa toplamı en az ürün fiyatı kadardır (alt sınır).
    const lowerBounds = otherFromDifferentRetailers.map((c) => c.priceMinor + (c.shippingMinor ?? 0));
    const bestOther = Math.min(...lowerBounds);
    const isBest = totalMinor !== null && totalMinor <= bestOther;
    competitor = {
      offersCompared: otherFromDifferentRetailers.length + 1,
      retailersCompared: otherRetailers.size + 1,
      isBest,
      bestOtherMinor: bestOther,
      gapPct: totalMinor !== null ? round1(((bestOther - totalMinor) / bestOther) * 100) : null,
    };
  }

  const metrics: OfferMetrics = {
    computedAt: now.toISOString(),
    isFresh,
    ageMinutes: Math.round(ageMinutes),
    dataPoints: stats.dataPoints,
    historyDays: stats.historyDays,
    firstSeenAt: stats.firstSeenAt?.toISOString() ?? null,
    currentSince: stats.currentSince?.toISOString() ?? null,
    d30: windowMetric(stats.w30),
    d90: windowMetric(stats.w90),
    d180: windowMetric(stats.w180),
    previous,
    verifiedDiscount,
    listDiscount,
    aboveLow90Pct,
    recentDropPct,
    competitor,
    totalMinor,
    shippingKnown,
    coupon,
  };

  // ── Etiketler (yalnızca koşul gerçekten sağlanıyorsa)
  const labels: DealLabelKey[] = [];
  if (offer.status === "REVALIDATING" || offer.status === "STALE") labels.push("REVALIDATING");
  if (isFresh && !offer.flaggedSuspicious) {
    labels.push("VERIFIED_RECENTLY");
    if (verifiedDiscount?.reference === "MEDIAN_30" && verifiedDiscount.percent >= t.advantageousMinPct) labels.push("HISTORICALLY_GOOD");
    if (competitor?.isBest) labels.push("BEST_ACROSS_STORES");
    if (
      stats.w30.sufficient &&
      stats.w30.priorLowMinor !== null &&
      stats.w30.highMinor !== null &&
      price <= stats.w30.priorLowMinor &&
      price < stats.w30.highMinor
    ) {
      labels.push("LOWEST_30D");
    }
    if (coupon && coupon.savingMinor > 0) labels.push("COUPON_BETTER");
    if (aboveLow90Pct !== null && aboveLow90Pct > 0 && aboveLow90Pct <= t.watchCloseToLowPct) labels.push("WATCH_CLOSELY");
  }

  // ── Puan
  const suspiciousFlag = offer.flaggedSuspicious;
  let scoreBlockedReason: string | null = null;
  if (offer.status === "DISABLED") scoreBlockedReason = "Teklif yönetici tarafından devre dışı bırakıldı.";
  else if (offer.status === "EXPIRED") scoreBlockedReason = "Teklif kaynakta artık bulunmuyor.";
  else if (offer.status === "OUT_OF_STOCK" || offer.stockStatus === "OUT_OF_STOCK") scoreBlockedReason = "Ürün stokta değil.";
  else if (!isFresh) scoreBlockedReason = "Fiyat güncelliği doğrulanamadı.";
  else if (suspiciousFlag) scoreBlockedReason = "Fiyat şüpheli olarak işaretlendi; inceleme bekliyor.";

  const w = config.weights;
  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const factor = (key: keyof ScoringWeights, value: number, detail: string): ScoreFactor => ({
    key,
    label: WEIGHT_LABELS[key].label,
    weight: w[key],
    value: round1(clamp01(value) * 100) / 100,
    points: round1((w[key] * clamp01(value) * 100) / totalWeight),
    detail,
  });

  const breakdown: ScoreFactor[] = [];
  // Geçmiş
  {
    let v = 0;
    let detail = "Yeterli fiyat geçmişi yok; geçmiş karşılaştırması yapılmadı.";
    if (verifiedDiscount?.reference === "MEDIAN_30") {
      v = verifiedDiscount.percent / t.fullHistoricalDiscountPct;
      detail = `30 günlük tipik fiyat ${formatMoney(verifiedDiscount.referenceMinor, offer.currency)}; güncel fiyat ${formatPercent(verifiedDiscount.percent, 1)} daha düşük.`;
    } else if (verifiedDiscount?.reference === "PREVIOUS_STABLE") {
      v = (verifiedDiscount.percent / t.fullHistoricalDiscountPct) * 0.6;
      detail = `Önceki kararlı fiyat ${formatMoney(verifiedDiscount.referenceMinor, offer.currency)}; geçmiş kapsamı sınırlı olduğu için katsayı 0,6.`;
    } else if (stats.w30.sufficient) {
      detail = "Güncel fiyat 30 günlük tipik fiyatın altında değil.";
    }
    breakdown.push(factor("historicalAdvantage", v, detail));
  }
  // Rakipler
  {
    let v = 0;
    let detail = "Karşılaştırılabilir başka mağaza teklifi yok.";
    if (competitor) {
      if (competitor.isBest) {
        v = Math.max(0.2, (competitor.gapPct ?? 0) / t.fullCompetitorGapPct);
        detail = `${competitor.retailersCompared} mağaza arasında kargo dâhil en uygun; en yakın teklif ${formatMoney(competitor.bestOtherMinor, offer.currency)}.`;
      } else {
        detail = totalMinor === null ? "Kargo bedeli bilinmediği için toplam maliyet karşılaştırılamadı." : "Başka bir mağazada daha uygun teklif var.";
      }
    }
    breakdown.push(factor("competitorAdvantage", v, detail));
  }
  // Güvenilirlik
  {
    const coverage = clamp01(stats.w30.coverageDays / 30);
    const listPart = listDiscount === null ? 1 : listDiscount.credible === null ? 0.5 : listDiscount.credible ? 1 : 0;
    const v = 0.5 * coverage + 0.25 * listPart + 0.25 * (shippingKnown ? 1 : 0);
    const parts = [`30 günün ${stats.w30.coverageDays.toLocaleString("tr-TR")} günü için doğrulanmış veri`];
    if (listDiscount?.credible === false) parts.push("liste fiyatı tutarsız");
    if (!shippingKnown) parts.push("kargo bedeli bilinmiyor");
    breakdown.push(factor("verificationReliability", v, `${parts.join(", ")}.`));
  }
  // Stok
  {
    const map: Record<StockStatus, number> = { IN_STOCK: 1, LOW_STOCK: 0.8, PREORDER: 0.3, UNKNOWN: 0.4, OUT_OF_STOCK: 0 };
    const text: Record<StockStatus, string> = {
      IN_STOCK: "Stokta.",
      LOW_STOCK: "Kaynak düşük stok bildiriyor.",
      PREORDER: "Ön sipariş.",
      UNKNOWN: "Stok bilgisi kaynakta yok.",
      OUT_OF_STOCK: "Stokta değil.",
    };
    breakdown.push(factor("stock", map[offer.stockStatus], text[offer.stockStatus]));
  }
  // Toplam maliyet
  breakdown.push(
    factor(
      "totalCost",
      !shippingKnown ? 0 : offer.shippingMinor === 0 ? 1 : 0.6,
      !shippingKnown ? "Kargo bedeli bilinmiyor." : offer.shippingMinor === 0 ? "Kargo ücretsiz." : `Kargo ${formatMoney(offer.shippingMinor, offer.currency)}.`,
    ),
  );
  // Kupon
  breakdown.push(
    factor(
      "coupon",
      coupon ? (coupon.savingMinor / price) * 10 : 0,
      coupon ? `Doğrulanmış kuponla ${formatMoney(coupon.savingMinor, offer.currency)} tasarruf.` : "Doğrulanmış uygulanabilir kupon yok.",
    ),
  );
  // Tazelik
  breakdown.push(
    factor(
      "freshness",
      1 - ageMinutes / Math.max(offer.freshnessWindowMinutes, 1),
      `Son başarılı kontrol ${Math.round(ageMinutes)} dakika önce (tazelik penceresi ${Math.round(offer.freshnessWindowMinutes / 60)} saat).`,
    ),
  );
  // Kampanya bitişi
  {
    let v = 0;
    let detail = "Kaynak kampanya bitiş tarihi bildirmiyor.";
    if (offer.promotionEndsAt && offer.promotionEndsAt > now) {
      const hoursLeft = (offer.promotionEndsAt.getTime() - now.getTime()) / HOUR;
      v = hoursLeft <= 72 ? 1 - hoursLeft / 72 : 0;
      detail = `Kampanya ${Math.round(hoursLeft)} saat sonra bitiyor (kaynak bildirimi).`;
    }
    breakdown.push(factor("campaignEnding", v, detail));
  }
  // Etkileşim
  breakdown.push(
    factor(
      "engagement",
      Math.log1p(Math.max(0, engagement)) / Math.log1p(t.engagementCap),
      `Son 7 günde ${engagement} favori/tıklama (tavan ${t.engagementCap}).`,
    ),
  );

  const raw = breakdown.reduce((sum, f) => sum + f.points, 0);
  const score = scoreBlockedReason ? null : round1(raw);

  return {
    metrics,
    labels,
    score,
    breakdown,
    scoreBlockedReason,
    suspicious: { flag: suspiciousFlag, reason: null },
  };
}

/** Kartlarda gösterilecek tek indirim değeri: yalnızca doğrulanmış indirim (liste fiyatı değil). */
export function headlineDiscount(metrics: OfferMetrics | null | undefined): { percent: number; caption: string } | null {
  if (!metrics?.verifiedDiscount) return null;
  const v = metrics.verifiedDiscount;
  return {
    percent: v.percent,
    caption: v.reference === "MEDIAN_30" ? "30 günlük tipik fiyata göre" : "önceki doğrulanmış fiyata göre",
  };
}
