import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING } from "@/server/pricing/config";
import { detectSuspiciousChange, evaluateOffer, headlineDiscount, type OfferInput } from "@/server/pricing/evaluate";
import { computePriceStats, type Observation } from "@/server/pricing/stats";

const DAY = 86_400_000;
const now = new Date("2026-10-20T12:00:00Z");

function history(base: number, days: number, current: number): Observation[] {
  const obs: Observation[] = [];
  for (let d = days; d >= 1; d--) obs.push({ priceMinor: base, checkedAt: new Date(now.getTime() - d * DAY) });
  obs.push({ priceMinor: current, checkedAt: new Date(now.getTime() - 10 * 60_000) });
  return obs;
}

const offer = (over: Partial<OfferInput> = {}): OfferInput => ({
  id: "o1",
  retailerId: "r1",
  priceMinor: 80000,
  listPriceMinor: null,
  shippingMinor: 0,
  currency: "TRY",
  stockStatus: "IN_STOCK",
  status: "ACTIVE",
  lastSuccessAt: new Date(now.getTime() - 10 * 60_000),
  flaggedSuspicious: false,
  freshnessWindowMinutes: 360,
  ...over,
});

describe("evaluateOffer", () => {
  it("doğrulanmış indirim kendi geçmişimize (30 gün medyan) dayanır; etiketler koşula bağlı", () => {
    const stats = computePriceStats(history(100000, 60, 80000), { now });
    const ev = evaluateOffer({ offer: offer(), stats, competitors: [], coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(ev.metrics.verifiedDiscount).toMatchObject({ reference: "MEDIAN_30", referenceMinor: 100000, percent: 20 });
    expect(ev.labels).toContain("HISTORICALLY_GOOD");
    expect(ev.labels).toContain("LOWEST_30D");
    expect(ev.labels).toContain("VERIFIED_RECENTLY");
    expect(ev.labels).not.toContain("BEST_ACROSS_STORES"); // tek mağaza
    expect(ev.score).toBeGreaterThan(0);
    expect(headlineDiscount(ev.metrics)?.caption).toBe("30 günlük tipik fiyata göre");
  });

  it("sabit fiyatta '30 günün en düşüğü' etiketi verilmez (yanıltıcı olur)", () => {
    const stats = computePriceStats(history(100000, 60, 100000), { now });
    const ev = evaluateOffer({ offer: offer({ priceMinor: 100000 }), stats, competitors: [], coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(ev.labels).not.toContain("LOWEST_30D");
    expect(ev.labels).not.toContain("HISTORICALLY_GOOD");
    expect(ev.metrics.verifiedDiscount).toBeNull();
  });

  it("yetersiz geçmişte geçmiş etiketi verilmez", () => {
    const stats = computePriceStats(history(100000, 5, 80000), { now });
    const ev = evaluateOffer({ offer: offer(), stats, competitors: [], coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(ev.labels).not.toContain("HISTORICALLY_GOOD");
    expect(ev.labels).not.toContain("LOWEST_30D");
    // 5 gün geçerli kalmış önceki fiyat "kararlı" sayılır → sınırlı referans
    expect(ev.metrics.verifiedDiscount?.reference).toBe("PREVIOUS_STABLE");
  });

  it("şişirilmiş liste fiyatı tespit edilir ve sıralama indirimine girmez", () => {
    const stats = computePriceStats(history(100000, 120, 95000), { now });
    const ev = evaluateOffer({ offer: offer({ priceMinor: 95000, listPriceMinor: 200000 }), stats, competitors: [], coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(ev.metrics.listDiscount?.credible).toBe(false);
    expect(ev.metrics.listDiscount?.percent).toBeCloseTo(52.5, 1);
    expect(ev.metrics.verifiedDiscount?.percent).toBeCloseTo(5, 1);
  });

  it("mağazalar arası en uygun: rakibin kargosu bilinmiyorsa ürün fiyatı alt sınır kabul edilir", () => {
    const stats = computePriceStats(history(100000, 40, 80000), { now });
    const competitors = [
      { offerId: "o1", retailerId: "r1", priceMinor: 80000, shippingMinor: 0, currency: "TRY" },
      { offerId: "o2", retailerId: "r2", priceMinor: 82000, shippingMinor: null, currency: "TRY" },
    ];
    const ev = evaluateOffer({ offer: offer(), stats, competitors, coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(ev.metrics.competitor?.isBest).toBe(true);
    expect(ev.labels).toContain("BEST_ACROSS_STORES");

    // Bu teklifin kargosu bilinmiyorsa "en uygun" iddia edilemez
    const ev2 = evaluateOffer({ offer: offer({ shippingMinor: null }), stats, competitors, coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(ev2.labels).not.toContain("BEST_ACROSS_STORES");
  });

  it("eski veri, stok yok ve şüpheli fiyat puan almaz", () => {
    const stats = computePriceStats(history(100000, 40, 80000), { now });
    const stale = evaluateOffer({ offer: offer({ status: "STALE", lastSuccessAt: new Date(now.getTime() - 2 * DAY) }), stats, competitors: [], coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(stale.score).toBeNull();
    expect(stale.labels).toEqual(["REVALIDATING"]);
    const oos = evaluateOffer({ offer: offer({ stockStatus: "OUT_OF_STOCK", status: "OUT_OF_STOCK" }), stats, competitors: [], coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(oos.score).toBeNull();
    const sus = evaluateOffer({ offer: offer({ flaggedSuspicious: true }), stats, competitors: [], coupon: null, engagement: 0, config: DEFAULT_SCORING, now });
    expect(sus.score).toBeNull();
    expect(sus.labels).not.toContain("HISTORICALLY_GOOD");
  });

  it("puan dökümü ağırlıklarla tutarlıdır (açıklanabilirlik)", () => {
    const stats = computePriceStats(history(100000, 40, 80000), { now });
    const ev = evaluateOffer({ offer: offer(), stats, competitors: [], coupon: null, engagement: 50, config: DEFAULT_SCORING, now });
    const sum = ev.breakdown.reduce((s, f) => s + f.points, 0);
    expect(Math.abs(sum - (ev.score ?? 0))).toBeLessThan(0.6);
    expect(ev.breakdown.every((f) => f.value >= 0 && f.value <= 1 && f.detail.length > 0)).toBe(true);
  });
});

describe("detectSuspiciousChange", () => {
  it("tek kontrolde aşırı düşüşü işaretler", () => {
    expect(detectSuspiciousChange(100000, 20000, DEFAULT_SCORING.thresholds)).toMatch(/düşüş/);
    expect(detectSuspiciousChange(100000, 60000, DEFAULT_SCORING.thresholds)).toBeNull();
    expect(detectSuspiciousChange(10000, 50000, DEFAULT_SCORING.thresholds)).toMatch(/artış/);
  });
});
