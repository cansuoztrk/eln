/**
 * Metin normalizasyonu. Türkçe karakterler ASCII karşılıklarına katlanır; böylece "Kulaklık",
 * "kulaklik" ve "KULAKLIK" aynı arama anahtarına dönüşür. İ/ı dönüşümü locale'e bağlı olduğu için
 * toLowerCase'den ÖNCE yapılır.
 */
const FOLD_MAP: Record<string, string> = {
  ı: "i",
  İ: "i",
  I: "i",
  ğ: "g",
  Ğ: "g",
  ş: "s",
  Ş: "s",
  ç: "c",
  Ç: "c",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
  â: "a",
  Â: "a",
  î: "i",
  Î: "i",
  û: "u",
  Û: "u",
};

export function foldTurkish(input: string): string {
  let out = "";
  for (const ch of input) out += FOLD_MAP[ch] ?? ch;
  return out;
}

/** Küçük harf, Türkçe katlanmış, aksansız, noktalama yerine boşluk. */
export function normalizeText(input: string | null | undefined): string {
  if (!input) return "";
  return foldTurkish(input)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[“”"'`´’]/g, "")
    .replace(/[^a-z0-9.+\-/ ]+/g, " ")
    .replace(/(?<=\d),(?=\d)/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(/[\s/]+/)
    .map((t) => t.replace(/^[.\-+]+|[.\-+]+$/g, ""))
    .filter((t) => t.length > 0);
}

export function slugify(input: string, maxLength = 80): string {
  const s = normalizeText(input)
    .replace(/[.+/]+/g, " ")
    .replace(/[^a-z0-9\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return s.slice(0, maxLength).replace(/-$/, "") || "urun";
}

/** HTML'e güvenli şekilde gömülecek metin (yalnızca sunucu tarafı e-posta şablonları için). */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * GTIN (EAN-8, UPC-12, EAN-13, GTIN-14) doğrular ve GTIN-14'e (soldan sıfır dolgulu) çevirir.
 * Geçersiz kontrol basamağı olan kodlar null döner — yanlış eşleşmeye yol açmaması için.
 */
export function normalizeGtin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (![8, 12, 13, 14].includes(digits.length)) return null;
  if (/^0+$/.test(digits)) return null;
  const padded = digits.padStart(14, "0");
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const n = Number(padded[i]);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(padded[13]) ? padded : null;
}

/** Üretici parça numarası: boşluk/tire/nokta farklarını yok sayar. */
export function normalizeMpn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = foldTurkish(String(raw)).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length >= 3 ? s : null;
}

export function truncate(input: string, max: number): string {
  return input.length <= max ? input : `${input.slice(0, max - 1).trimEnd()}…`;
}
