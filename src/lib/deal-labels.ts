/** Fırsat etiketleri — istemci ve sunucu arasında paylaşılır (saf veri). */
export type DealLabelKey =
  | "VERIFIED_RECENTLY"
  | "HISTORICALLY_GOOD"
  | "BEST_ACROSS_STORES"
  | "LOWEST_30D"
  | "COUPON_BETTER"
  | "WATCH_CLOSELY"
  | "REVALIDATING";

export const DEAL_LABELS: Record<DealLabelKey, { text: string; tone: "brand" | "positive" | "neutral" | "warning"; help: string }> = {
  VERIFIED_RECENTLY: { text: "Son fiyat kontrolünde doğrulandı", tone: "neutral", help: "Fiyat, kaynağın tazelik penceresi içinde başarıyla kontrol edildi." },
  HISTORICALLY_GOOD: { text: "Fiyat geçmişine göre avantajlı", tone: "positive", help: "Güncel fiyat, en az 20 günlük doğrulanmış veriye dayanan 30 günlük tipik fiyatın belirgin biçimde altında." },
  BEST_ACROSS_STORES: { text: "Mağazalar arasında en uygun teklif", tone: "brand", help: "Karşılaştırılan diğer mağazaların güncel tekliflerine göre kargo dâhil en düşük toplam." },
  LOWEST_30D: { text: "Geçmiş 30 günün en düşük fiyatı", tone: "positive", help: "Yeterli kapsamdaki son 30 günlük kayıtlarda bu fiyattan düşüğü görülmedi ve fiyat bu dönemde daha yüksekti." },
  COUPON_BETTER: { text: "Kuponla daha uygun", tone: "brand", help: "Doğrulanmış, geçerli ve bu ürüne uygulanabilir bir kupon var." },
  WATCH_CLOSELY: { text: "Fiyatı yakından takip et", tone: "neutral", help: "Fiyat 90 günlük en düşük seviyesine çok yakın; alarm kurmak mantıklı olabilir." },
  REVALIDATING: { text: "Fiyat bilgisi yeniden kontrol ediliyor", tone: "warning", help: "Son kontrol başarısız oldu veya veri eskidi; son başarılı fiyat gösteriliyor." },
};
