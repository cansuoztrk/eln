import "server-only";

/**
 * Eksik veya zayıf yapılandırmalar. Yönetim panelinde gösterilir; değişken değerleri asla
 * gösterilmez, yalnızca adları. Eksik isteğe bağlı entegrasyonlar uygulamayı durdurmaz; ilgili
 * veri kaynağı "kimlik bilgisi bekliyor" durumunda kalır (bkz. Veri kaynakları sayfası).
 */
export function configWarnings(): string[] {
  const e = process.env;
  const prod = e.NODE_ENV === "production";
  const out: string[] = [];
  if (!e.ANALYTICS_SALT || e.ANALYTICS_SALT.length < 16) out.push("ANALYTICS_SALT tanımlı değil veya 16 karakterden kısa: anonim tıklama özetleri varsayılan tuzla üretiliyor.");
  if (!e.SMTP_HOST) out.push("SMTP_HOST tanımlı değil: e-posta bildirimleri gönderilmiyor (site içi bildirimler çalışır).");
  if (e.CRON_SECRET && e.CRON_SECRET.length < 16) out.push("CRON_SECRET 16 karakterden kısa: /api/cron/tick uç noktası istekleri reddediyor.");
  if (prod && (!e.NEXT_PUBLIC_SITE_URL || e.NEXT_PUBLIC_SITE_URL.includes("localhost"))) out.push("NEXT_PUBLIC_SITE_URL üretim adresine ayarlanmamış: canonical, sitemap ve e-posta bağlantıları yanlış olur.");
  if (prod && e.SHOW_TEST_DATA === "true") out.push("SHOW_TEST_DATA=true: üretimde test verisi ziyaretçilere gösteriliyor (etiketli olsa da).");
  return out;
}
