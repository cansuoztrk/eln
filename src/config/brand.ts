/**
 * Marka yapılandırması. Ad ortam değişkeniyle değiştirilebilir; logo, sayfa başlıkları,
 * e-postalar ve paylaşım görseli bu değeri kullanır. Marka tescili ve alan adı durumu için
 * bkz. docs/BRAND.md.
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Fiyatiz",
  /** Logoda vurgu rengiyle yazılan son ek ("Fiyat" + "iz"); adın sonunda değilse vurgu yapılmaz. */
  accent: process.env.NEXT_PUBLIC_BRAND_ACCENT ?? "iz",
  tagline: "İyi fiyatı arama. Gerçekten avantajlı olanı gör.",
  description:
    "Mağazalar arası fiyat karşılaştırması, doğrulanmış fiyat geçmişi ve uygun uçak bileti keşfi. Hangi fırsatın gerçekten avantajlı olduğunu verilerle gösterir.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "iletisim@example.com",
} as const;

export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") || path === "" ? path : `/${path}`}`;
}
