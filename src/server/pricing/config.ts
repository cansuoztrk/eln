/**
 * Fırsat puanı yapılandırması. Yönetim panelinden yeni sürümler oluşturulabilir (ScoringConfig
 * tablosu); etkin sürüm yoksa bu varsayılanlar kullanılır.
 */
export type ScoringWeights = {
  historicalAdvantage: number;
  competitorAdvantage: number;
  verificationReliability: number;
  stock: number;
  totalCost: number;
  coupon: number;
  freshness: number;
  campaignEnding: number;
  engagement: number;
};

export type ScoringThresholds = {
  /** Tipik fiyata göre bu orandaki indirim tam puan alır (%). */
  fullHistoricalDiscountPct: number;
  /** İkinci en iyi teklife göre bu oranda ucuzluk tam puan alır (%). */
  fullCompetitorGapPct: number;
  /** "Fiyat geçmişine göre avantajlı" etiketi için gereken asgari doğrulanmış indirim (%). */
  advantageousMinPct: number;
  /** "Fiyatı yakından takip et": 90 günlük en düşüğe bu oran kadar yakınsa (%). */
  watchCloseToLowPct: number;
  /** Önceki fiyatın "kararlı" sayılması için asgari geçerlilik süresi (gün). */
  stablePreviousDays: number;
  /** Liste fiyatı, 90 günlük en yüksek doğrulanmış fiyatın bu katından büyükse şişirilmiş sayılır. */
  inflatedListPriceFactor: number;
  /** Tek kontrolde bu oranın üzerinde düşüş/artış şüpheli sayılır. */
  suspiciousDropPct: number;
  suspiciousRisePct: number;
  /** Etkileşim puanında tavan (7 günlük tıklama + favori). */
  engagementCap: number;
};

export type ScoringConfigValue = { version: number; weights: ScoringWeights; thresholds: ScoringThresholds };

export const DEFAULT_SCORING: ScoringConfigValue = {
  version: 0,
  weights: {
    historicalAdvantage: 30,
    competitorAdvantage: 20,
    verificationReliability: 15,
    stock: 8,
    totalCost: 7,
    coupon: 5,
    freshness: 10,
    campaignEnding: 0,
    engagement: 5,
  },
  thresholds: {
    fullHistoricalDiscountPct: 30,
    fullCompetitorGapPct: 15,
    advantageousMinPct: 8,
    watchCloseToLowPct: 5,
    stablePreviousDays: 3,
    inflatedListPriceFactor: 1.15,
    suspiciousDropPct: 70,
    suspiciousRisePct: 300,
    engagementCap: 200,
  },
};

export const WEIGHT_LABELS: Record<keyof ScoringWeights, { label: string; help: string }> = {
  historicalAdvantage: { label: "Geçmişe göre avantaj", help: "Doğrulanmış fiyat geçmişindeki tipik fiyata (30 gün medyan) göre indirim." },
  competitorAdvantage: { label: "Rakiplere göre avantaj", help: "Aynı ürünün diğer mağazalardaki kargo dâhil en iyi teklifine göre fark." },
  verificationReliability: { label: "Doğrulama güvenilirliği", help: "Fiyat geçmişi kapsamı, liste fiyatının tutarlılığı ve kargo bilgisinin bilinmesi." },
  stock: { label: "Stok durumu", help: "Stokta olmayan teklifler fırsat sayılmaz." },
  totalCost: { label: "Toplam maliyet", help: "Kargo bedelinin bilinmesi ve ücretsiz olması." },
  coupon: { label: "Kupon avantajı", help: "Yalnızca doğrulanmış, geçerli ve uygulanabilir kuponlar." },
  freshness: { label: "Veri tazeliği", help: "Son başarılı fiyat kontrolünün ne kadar yeni olduğu." },
  campaignEnding: { label: "Kampanya bitişi", help: "Kaynak kampanya bitiş tarihini gerçekten bildiriyorsa yakın bitiş." },
  engagement: { label: "Kullanıcı ilgisi", help: "Favori ve tıklamalar (tavanlı). Tek başına kalite ölçütü değildir." },
};

export function mergeScoringConfig(raw: { version: number; weights: unknown; thresholds: unknown } | null): ScoringConfigValue {
  if (!raw) return DEFAULT_SCORING;
  const w = (raw.weights ?? {}) as Partial<ScoringWeights>;
  const t = (raw.thresholds ?? {}) as Partial<ScoringThresholds>;
  const weights = { ...DEFAULT_SCORING.weights };
  for (const k of Object.keys(weights) as (keyof ScoringWeights)[]) {
    const v = Number(w[k]);
    if (Number.isFinite(v) && v >= 0 && v <= 100) weights[k] = v;
  }
  const thresholds = { ...DEFAULT_SCORING.thresholds };
  for (const k of Object.keys(thresholds) as (keyof ScoringThresholds)[]) {
    const v = Number(t[k]);
    if (Number.isFinite(v) && v >= 0) thresholds[k] = v;
  }
  return { version: raw.version, weights, thresholds };
}
