/**
 * Gizli değerler yalnızca ortam değişkenlerinden okunur. Veri kaynağı yapılandırmasında
 * (veritabanı) yalnızca değişken ADI tutulur; değerin kendisi asla veritabanına veya
 * istemci paketine yazılmaz.
 */
const ALLOWED_PREFIXES = ["AMAZON_", "TRENDYOL_", "HEPSIBURADA_", "FEED_", "TRAVELPAYOUTS_", "DUFFEL_", "PARTNER_"];

export function secretFromEnvSafe(name: string | undefined | null): string | undefined {
  if (!name) return undefined;
  // Yönetim panelinden girilen bir değişken adıyla DATABASE_URL gibi ilgisiz gizli değerlerin
  // okunmasını engellemek için yalnızca entegrasyon ön ekleri kabul edilir.
  if (!ALLOWED_PREFIXES.some((p) => name.startsWith(p))) return undefined;
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const SECRET_ENV_PREFIXES = ALLOWED_PREFIXES;
