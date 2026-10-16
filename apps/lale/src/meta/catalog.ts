/**
 * "Lale Bahçıvan" products — the single source of truth for App Store
 * Connect / Google Play Console and RevenueCat (entitlement `bahcivan`).
 *
 * `usd` is the base price the stores convert from. `try` is a MANUAL
 * Türkiye price: student-friendly anchors below Spotify Öğrenci (₺60/month)
 * and well under Forest (₺105/₺579) and YPT (₺99.99/₺599.99). Auto-renewing
 * subscriptions are NOT re-tiered by Apple's TRY updates, so re-price yearly
 * (docs/16).
 *
 * Season passes are non-renewing: they simply end after the exam, so no
 * forgotten renewals for students or parents.
 */
export type ProductKind = 'subscription' | 'lifetime' | 'season';

export interface Product {
  id: string;
  kind: ProductKind;
  usd: number;
  try: number;
  /** Billing period label key for subscriptions. */
  period?: 'month' | 'year';
  trialDays?: number;
  /** Season passes: exam profile they fit and the end of validity (local ISO). */
  exam?: 'yks' | 'lgs';
  until?: string;
  badge?: 'best' | 'season';
}

export const PRODUCTS: readonly Product[] = [
  { id: 'lale_season_yks27', kind: 'season', usd: 14.99, try: 249.99, exam: 'yks', until: '2027-07-31T23:59', badge: 'season' },
  { id: 'lale_season_lgs27', kind: 'season', usd: 14.99, try: 249.99, exam: 'lgs', until: '2027-07-31T23:59', badge: 'season' },
  { id: 'lale_yearly', kind: 'subscription', period: 'year', trialDays: 7, usd: 19.99, try: 349.99, badge: 'best' },
  { id: 'lale_monthly', kind: 'subscription', period: 'month', usd: 2.99, try: 59.99 },
  { id: 'lale_lifetime', kind: 'lifetime', usd: 39.99, try: 699.99 },
];

export const PRODUCT_BY_ID: Readonly<Record<string, Product>> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export function fallbackPrice(p: Product, lang: string): string {
  if (lang === 'tr') return `₺${p.try.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  if (lang === 'de' || lang === 'es') return `${p.usd.toFixed(2).replace('.', ',')} €`;
  return `$${p.usd.toFixed(2)}`;
}
