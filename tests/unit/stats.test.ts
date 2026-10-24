import { describe, expect, it } from "vitest";
import { computePriceStats, dailySeries, type Observation } from "@/server/pricing/stats";

const DAY = 86_400_000;
const now = new Date("2026-10-20T12:00:00Z");
const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY);

/** Her gün bir doğrulama kaydı olan seri üretir. */
function daily(prices: (number | null)[]): Observation[] {
  const out: Observation[] = [];
  prices.forEach((p, i) => {
    const daysAgo = prices.length - i;
    if (p !== null) out.push({ priceMinor: p, checkedAt: at(daysAgo) });
  });
  return out;
}

describe("computePriceStats", () => {
  it("tam kapsamda 30 günlük medyan, en düşük ve önceki-en-düşük hesaplanır", () => {
    const prices = Array.from({ length: 40 }, (_, i) => (i < 35 ? 100000 : 80000));
    const obs = [...daily(prices), { priceMinor: 80000, checkedAt: now }];
    const s = computePriceStats(obs, { now });
    expect(s.w30.sufficient).toBe(true);
    expect(s.w30.medianMinor).toBe(100000);
    expect(s.w30.lowMinor).toBe(80000);
    expect(s.w30.highMinor).toBe(100000);
    expect(s.previous?.priceMinor).toBe(100000);
    expect(s.previous && s.previous.heldMs / DAY).toBeGreaterThan(30);
  });

  it("veri boşluklarını kapsam olarak saymaz (fiyat uydurmaz)", () => {
    // Yalnızca son 10 gün kayıt var
    const obs = daily(Array.from({ length: 10 }, () => 50000));
    const s = computePriceStats(obs, { now });
    expect(s.w30.coverageDays).toBeLessThanOrEqual(11);
    expect(s.w30.sufficient).toBe(false);
    expect(s.w90.sufficient).toBe(false);
  });

  it("36 saatten uzun boşluk 'bilinmiyor' kabul edilir", () => {
    const obs: Observation[] = [
      { priceMinor: 1000, checkedAt: at(20) },
      { priceMinor: 1000, checkedAt: at(1) },
    ];
    const s = computePriceStats(obs, { now });
    // İlk gözlem en fazla 36 saat kapsar, ikincisi 1 gün → toplam ~2.5 gün
    expect(s.w30.coverageDays).toBeLessThan(3);
  });

  it("7 gün önceki fiyatı yalnızca kapsanıyorsa verir", () => {
    const obs = daily(Array.from({ length: 10 }, (_, i) => 1000 - i * 10));
    expect(computePriceStats(obs, { now }).price7dAgoMinor).not.toBeNull();
    const sparse = [{ priceMinor: 1000, checkedAt: at(1) }];
    expect(computePriceStats(sparse, { now }).price7dAgoMinor).toBeNull();
  });

  it("geçersiz ve gelecekteki gözlemler yok sayılır", () => {
    const s = computePriceStats([{ priceMinor: -1, checkedAt: at(1) }, { priceMinor: 1000, checkedAt: new Date(now.getTime() + DAY) }], { now });
    expect(s.dataPoints).toBe(0);
  });
});

describe("dailySeries", () => {
  it("veri olmayan günleri null bırakır", () => {
    const obs = [{ priceMinor: 500, checkedAt: at(2) }];
    const series = dailySeries(obs, 10, { now });
    expect(series).toHaveLength(10);
    expect(series[0].minMinor).toBeNull();
    expect(series.at(-2)?.minMinor).toBe(500);
  });
});
