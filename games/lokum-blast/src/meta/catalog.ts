import type { BoosterId } from './state';

/**
 * In-app purchase catalogue — the single source of truth for every product we
 * create in App Store Connect / Google Play Console.
 *
 * Prices: `usd` is the base price (Apple/Google auto-convert other storefronts
 * from it). `try` is a MANUAL Türkiye price. Auto-conversion puts Turkish
 * prices ~2x above local purchasing power, which kills conversion, so we set
 * TRY prices by hand at roughly 45–50% of the converted value, on
 * psychological thresholds (₺24,99 / ₺49,99 / ₺99,99 …).
 * See docs/04-ekonomi-ve-fiyatlandirma.md for the full rationale.
 */
export type ProductType = 'consumable' | 'non_consumable' | 'subscription';

export interface Grant {
  coins?: number;
  boosters?: Partial<Record<BoosterId, number>>;
  unlimitedLivesHours?: number;
  removeAds?: boolean;
  themes?: string[];
}

export interface Product {
  id: string;
  type: ProductType;
  grant: Grant;
  usd: number;
  try: number;
  /** Visual tag in the shop. */
  badge?: 'popular' | 'best' | 'limited' | 'new';
  /** Bonus percentage vs. the base coin rate, shown on coin packs. */
  bonus?: number;
  /** One purchase per player (starter pack, themes…). */
  once?: boolean;
  /** Subscription period. */
  period?: 'month' | 'year';
}

const all = (n: number): Record<BoosterId, number> => ({ undo: n, hammer: n, refresh: n, bomb: n });

export const PRODUCTS: readonly Product[] = [
  // ── Coin packs (consumable) ──────────────────────────────────────────
  { id: 'coins_600', type: 'consumable', grant: { coins: 600 }, usd: 0.99, try: 24.99 },
  { id: 'coins_1500', type: 'consumable', grant: { coins: 1500 }, usd: 1.99, try: 49.99, bonus: 25 },
  { id: 'coins_4500', type: 'consumable', grant: { coins: 4500 }, usd: 4.99, try: 119.99, bonus: 50 },
  { id: 'coins_10000', type: 'consumable', grant: { coins: 10000 }, usd: 9.99, try: 229.99, bonus: 65, badge: 'popular' },
  { id: 'coins_22000', type: 'consumable', grant: { coins: 22000 }, usd: 19.99, try: 449.99, bonus: 80 },
  { id: 'coins_60000', type: 'consumable', grant: { coins: 60000 }, usd: 49.99, try: 999.99, bonus: 100, badge: 'best' },

  // ── Bundles ──────────────────────────────────────────────────────────
  {
    id: 'starter_pack',
    type: 'consumable',
    grant: { coins: 2500, boosters: all(3), unlimitedLivesHours: 24 },
    usd: 1.99,
    try: 49.99,
    badge: 'limited',
    once: true,
  },
  {
    id: 'bundle_usta',
    type: 'consumable',
    grant: { coins: 6000, boosters: all(5), unlimitedLivesHours: 6 },
    usd: 6.99,
    try: 159.99,
  },
  {
    id: 'bundle_sultan',
    type: 'consumable',
    grant: { coins: 25000, boosters: all(15), unlimitedLivesHours: 72 },
    usd: 24.99,
    try: 549.99,
    badge: 'best',
  },

  // ── Non-consumables ──────────────────────────────────────────────────
  { id: 'no_ads', type: 'non_consumable', grant: { removeAds: true, coins: 1000 }, usd: 4.99, try: 99.99, once: true },
  { id: 'theme_saray', type: 'non_consumable', grant: { themes: ['saray'] }, usd: 2.99, try: 69.99, once: true, badge: 'new' },

  // ── Season pass: Çarşı Pass Premium (one per 28-day season) ─────────
  { id: 'pass_premium', type: 'consumable', grant: {}, usd: 4.99, try: 99.99, badge: 'new' },

  // ── Subscription: Tekir Kulübü (VIP) ─────────────────────────────────
  { id: 'vip_monthly', type: 'subscription', grant: {}, usd: 5.99, try: 99.99, period: 'month' },
  { id: 'vip_yearly', type: 'subscription', grant: {}, usd: 39.99, try: 699.99, period: 'year', badge: 'best' },
];

export const PRODUCT_BY_ID: Readonly<Record<string, Product>> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/** VIP perks — applied while the subscription entitlement is active. */
export const VIP_PERKS = {
  dailyCoins: 250,
  dailyBoosters: 1, // one of each, every day
  unlimitedLives: true,
  noInterstitials: true,
  theme: 'saray',
  wheelMultiplier: 2,
} as const;

/** RevenueCat entitlement identifiers. */
export const ENTITLEMENT_NO_ADS = 'no_ads';
export const ENTITLEMENT_VIP = 'vip';

/** Fallback price label when the store has not returned localized prices yet. */
export function fallbackPrice(p: Product, lang: string): string {
  if (lang === 'tr') return `₺${p.try.toFixed(2).replace('.', ',')}`;
  return `$${p.usd.toFixed(2)}`;
}
