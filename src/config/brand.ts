/**
 * Marka yapılandırması. "FırsatRadar" geçici çalışma adıdır; marka kesinleştiğinde yalnızca bu
 * dosya ve ortam değişkenleri güncellenir. Alan adı/marka müsaitliği doğrulanmadan
 * kullanılmamalıdır (bkz. docs/BRAND.md).
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "FırsatRadar",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT || "Radar",
  tagline: "İyi fiyatı arama. Gerçekten avantajlı olanı gör.",
  description:
    "Mağazalar arası fiyat karşılaştırması, doğrulanmış fiyat geçmişi ve uygun uçak bileti keşfi. Hangi fırsatın gerçekten avantajlı olduğunu verilerle gösterir.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "iletisim@example.com",
} as const;

export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") || path === "" ? path : `/${path}`}`;
}
