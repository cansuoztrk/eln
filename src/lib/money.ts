import { market } from "@/config/market";

/** Para birimlerinin ondalık basamak sayısı (ISO 4217). Bilinmeyenler için 2 varsayılır. */
const DECIMALS: Record<string, number> = { JPY: 0, KRW: 0, HUF: 2 };

export function currencyDecimals(currency: string): number {
  return DECIMALS[currency.toUpperCase()] ?? 2;
}

export function toMinor(amount: number, currency = market.currency): number {
  const d = currencyDecimals(currency);
  return Math.round(amount * 10 ** d);
}

export function fromMinor(minor: number, currency = market.currency): number {
  return minor / 10 ** currencyDecimals(currency);
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, fractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(market.locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(key, f);
  }
  return f;
}

/**
 * Tutarı yerel biçimde gösterir. Kuruşsuz tutarlarda ondalık gösterilmez ("1.299 ₺"),
 * kuruşlu tutarlarda gösterilir ("1.299,90 ₺").
 */
export function formatMoney(minor: number | null | undefined, currency = market.currency): string {
  if (minor === null || minor === undefined || Number.isNaN(minor)) return "—";
  const d = currencyDecimals(currency);
  const hasFraction = d > 0 && minor % 10 ** d !== 0;
  return formatter(currency, hasFraction ? d : 0).format(fromMinor(minor, currency));
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `%${value.toLocaleString(market.locale, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

/**
 * Kaynaklardan gelen fiyat değerini minor unit'e çevirir. Desteklenen biçimler:
 *  1299.9 · "1299.90" · "1.299,90 TL" · "1,299.90 TRY" · "1299,90" · "12.999" (binlik ayraç)
 * Belirsiz veya negatif değerlerde null döner — uydurma fiyat üretmemek için.
 */
export function parsePriceToMinor(raw: unknown, currency = market.currency): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return null;
    return toMinor(raw, currency);
  }
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[^\d.,-]/g, "");
  if (!s || s.startsWith("-")) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized: string;
  if (lastComma >= 0 && lastDot >= 0) {
    // İkisi de var: sonda olan ondalık ayırıcıdır.
    normalized = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    // "1299,90" → ondalık; "1,299" / "1,299,000" → binlik ayraç
    const parts = s.split(",");
    const decimals = parts[parts.length - 1].length;
    if (parts.length === 2 && decimals <= 2) normalized = `${parts[0]}.${parts[1]}`;
    else if (decimals === 3 && parts.slice(1).every((p) => p.length === 3)) normalized = s.replace(/,/g, "");
    else return null;
  } else if (lastDot >= 0) {
    const parts = s.split(".");
    const decimals = s.length - lastDot - 1;
    // "12.999" → binlik ayraç (Türkçe biçim); "12.99" → ondalık
    normalized = parts.length > 2 || decimals === 3 ? s.replace(/\./g, "") : s;
  } else {
    normalized = s;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return toMinor(value, currency);
}

/**
 * "1299.90 TRY" gibi tutar + para birimi birleşik değerleri ayrıştırır (Google Merchant biçimi).
 */
export function parseAmountWithCurrency(raw: unknown, fallbackCurrency = market.currency): { minor: number; currency: string } | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  const m = s.match(/([A-Z]{3})/);
  let currency = m ? m[1] : fallbackCurrency;
  if (/₺|\bTL\b/i.test(s)) currency = "TRY";
  const minor = parsePriceToMinor(s.replace(/[A-Z]{3}/g, ""), currency);
  return minor === null ? null : { minor, currency };
}

/** İndirim yüzdesi = (Referans − Güncel) / Referans × 100. Referans geçersizse null. */
export function discountPercent(referenceMinor: number | null | undefined, currentMinor: number): number | null {
  if (!referenceMinor || referenceMinor <= 0) return null;
  if (currentMinor < 0) return null;
  return ((referenceMinor - currentMinor) / referenceMinor) * 100;
}
