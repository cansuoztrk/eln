/**
 * Fiyat geçmişi istatistikleri — saf fonksiyonlar (veritabanına erişmez, birim testlidir).
 *
 * Model: Her PriceSnapshot, "checkedAt anında doğrulanmış fiyat" gözlemidir. Bir gözlem, bir
 * sonraki gözleme kadar geçerli kabul edilir; ancak iki gözlem arası `maxGapMs`'den uzunsa aradaki
 * süre "bilinmiyor" sayılır (kaynak erişilemediyse fiyatı uydurmamak için). Mevcut teklifin
 * kendisi de son başarılı kontrol zamanına kadar bir gözlemdir.
 */

import { DAY, HOUR } from "@/lib/time";

export type Observation = {
  priceMinor: number; // kargo hariç ürün fiyatı
  checkedAt: Date;
  inStock?: boolean;
};

export type WindowStat = {
  days: number;
  /** Penceredeki gözlemlerle kapsanan gün sayısı (veri boşlukları hariç). */
  coverageDays: number;
  /** Kapsam eşiği sağlandı mı? Sağlanmadıysa bu pencere için karşılaştırma yapılmaz. */
  sufficient: boolean;
  lowMinor: number | null;
  highMinor: number | null;
  /** Bugün hariç, gün sonu fiyatlarının medyanı ("tipik fiyat"). */
  medianMinor: number | null;
  /** Bugün hariç pencerenin en düşük fiyatı. */
  priorLowMinor: number | null;
};

export type PriceStats = {
  dataPoints: number;
  firstSeenAt: Date | null;
  lastVerifiedAt: Date | null;
  historyDays: number;
  w7: WindowStat;
  w30: WindowStat;
  w90: WindowStat;
  w180: WindowStat;
  /** Mevcut fiyattan farklı olan son doğrulanmış fiyat ve ne kadar süre geçerli kaldığı. */
  previous: { priceMinor: number; heldMs: number; endedAt: Date } | null;
  /** Mevcut fiyatın ne zamandan beri geçerli olduğu. */
  currentSince: Date | null;
  /** 7 gün önceki fiyat (kapsanıyorsa). */
  price7dAgoMinor: number | null;
};

export type StatsOptions = {
  now?: Date;
  maxGapMs?: number;
  /** Pencere başına gereken asgari kapsam oranı (0-1). */
  minCoverageRatio?: number;
};

const DEFAULTS = { maxGapMs: 36 * HOUR, minCoverageRatio: 0.66 };

type Interval = { start: number; end: number; price: number };

function buildIntervals(obs: Observation[], nowMs: number, maxGapMs: number): Interval[] {
  const sorted = [...obs].sort((a, b) => a.checkedAt.getTime() - b.checkedAt.getTime());
  const intervals: Interval[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i].checkedAt.getTime();
    if (start > nowMs) continue;
    const nextStart = i + 1 < sorted.length ? sorted[i + 1].checkedAt.getTime() : nowMs;
    // Son gözlemden sonra yalnızca maxGap kadar süre "biliniyor" kabul edilir.
    const end = Math.min(nextStart, start + maxGapMs, nowMs);
    intervals.push({ start, end: Math.max(end, start), price: sorted[i].priceMinor });
  }
  return intervals;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function windowStat(intervals: Interval[], nowMs: number, days: number, minCoverageRatio: number): WindowStat {
  const windowStart = nowMs - days * DAY;
  const todayStart = nowMs - DAY;
  let covered = 0;
  let low: number | null = null;
  let high: number | null = null;
  let priorLow: number | null = null;
  for (const iv of intervals) {
    const s = Math.max(iv.start, windowStart);
    const e = Math.min(iv.end, nowMs);
    const touches = iv.end > windowStart && iv.start <= nowMs && (e > s || iv.start >= windowStart);
    if (!touches) continue;
    if (e > s) covered += e - s;
    low = low === null ? iv.price : Math.min(low, iv.price);
    high = high === null ? iv.price : Math.max(high, iv.price);
    if (iv.start < todayStart) priorLow = priorLow === null ? iv.price : Math.min(priorLow, iv.price);
  }

  // Gün sonu fiyatları (bugün hariç) — her gün için o günün sonunda geçerli olan fiyat.
  const closes: number[] = [];
  for (let d = days; d >= 1; d--) {
    const dayEnd = nowMs - (d - 1) * DAY - 1;
    if (dayEnd >= todayStart) continue;
    const iv = intervals.find((x) => x.start <= dayEnd && x.end > dayEnd);
    if (iv) closes.push(iv.price);
  }

  const coverageDays = covered / DAY;
  return {
    days,
    coverageDays: Math.round(coverageDays * 10) / 10,
    sufficient: coverageDays >= days * minCoverageRatio,
    lowMinor: low,
    highMinor: high,
    medianMinor: median(closes),
    priorLowMinor: priorLow,
  };
}

export function computePriceStats(observations: Observation[], options: StatsOptions = {}): PriceStats {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();
  const maxGapMs = options.maxGapMs ?? DEFAULTS.maxGapMs;
  const ratio = options.minCoverageRatio ?? DEFAULTS.minCoverageRatio;
  const sorted = [...observations]
    .filter((o) => o.checkedAt.getTime() <= nowMs && Number.isFinite(o.priceMinor) && o.priceMinor > 0)
    .sort((a, b) => a.checkedAt.getTime() - b.checkedAt.getTime());
  const intervals = buildIntervals(sorted, nowMs, maxGapMs);

  let previous: PriceStats["previous"] = null;
  let currentSince: Date | null = null;
  if (sorted.length > 0) {
    const current = sorted[sorted.length - 1].priceMinor;
    let i = sorted.length - 1;
    while (i > 0 && sorted[i - 1].priceMinor === current) i--;
    currentSince = sorted[i].checkedAt;
    if (i > 0) {
      const prevPrice = sorted[i - 1].priceMinor;
      let j = i - 1;
      while (j > 0 && sorted[j - 1].priceMinor === prevPrice) j--;
      previous = {
        priceMinor: prevPrice,
        heldMs: sorted[i].checkedAt.getTime() - sorted[j].checkedAt.getTime(),
        endedAt: sorted[i].checkedAt,
      };
    }
  }

  const sevenAgo = nowMs - 7 * DAY;
  const iv7 = intervals.find((x) => x.start <= sevenAgo && x.end > sevenAgo);

  const first = sorted[0]?.checkedAt ?? null;
  const last = sorted[sorted.length - 1]?.checkedAt ?? null;
  return {
    dataPoints: sorted.length,
    firstSeenAt: first,
    lastVerifiedAt: last,
    historyDays: first ? Math.round(((nowMs - first.getTime()) / DAY) * 10) / 10 : 0,
    w7: windowStat(intervals, nowMs, 7, ratio),
    w30: windowStat(intervals, nowMs, 30, ratio),
    w90: windowStat(intervals, nowMs, 90, ratio),
    w180: windowStat(intervals, nowMs, 180, ratio),
    previous,
    currentSince,
    price7dAgoMinor: iv7 ? iv7.price : null,
  };
}

/**
 * Grafik için günlük seri: her gün için gün içi en düşük fiyat. Veri olmayan günler boş bırakılır
 * (grafik çizgisi kesilir; boşluk uydurma değerle doldurulmaz).
 */
export function dailySeries(
  observations: Observation[],
  days: number,
  options: { now?: Date; maxGapMs?: number } = {},
): { day: number; minMinor: number | null }[] {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();
  const intervals = buildIntervals(observations, nowMs, options.maxGapMs ?? DEFAULTS.maxGapMs);
  const out: { day: number; minMinor: number | null }[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const dayStart = nowMs - (d + 1) * DAY;
    const dayEnd = nowMs - d * DAY;
    let min: number | null = null;
    for (const iv of intervals) {
      if (iv.end > dayStart && iv.start < dayEnd) min = min === null ? iv.price : Math.min(min, iv.price);
    }
    out.push({ day: dayEnd, minMinor: min });
  }
  return out;
}
