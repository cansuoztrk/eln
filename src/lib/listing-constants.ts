/** Liste sıralama ve fırsat türü seçenekleri (istemci ve sunucu ortak). */
export const SORTS = {
  avantaj: "En avantajlı fırsatlar",
  "fiyat-artan": "En düşük fiyat",
  indirim: "En yüksek doğrulanmış indirim",
  dusus: "Fiyatı en çok düşenler",
  yeni: "Yeni eklenenler",
  guncel: "Son güncellenenler",
  populer: "Popüler olanlar",
  ilgili: "En ilgili",
} as const;

export type SortKey = keyof typeof SORTS;

export const LABEL_FILTERS = {
  "gecmise-gore-avantajli": "HISTORICALLY_GOOD",
  "30-gunun-en-dusugu": "LOWEST_30D",
  "magazalar-arasi-en-uygun": "BEST_ACROSS_STORES",
  "kuponla-daha-uygun": "COUPON_BETTER",
} as const;
