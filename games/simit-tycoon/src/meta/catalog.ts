/**
 * In-app purchase catalogue — the single source of truth for every product
 * created in App Store Connect / Google Play Console — plus the gold shop.
 *
 * Prices: `usd` is the base price (stores auto-convert other storefronts from
 * it). `try` is a MANUAL Türkiye price: auto-conversion lands ~2× above local
 * purchasing power, so TRY prices are set by hand at roughly 45–50% of the
 * converted value, on psychological thresholds (₺24,99 / ₺49,99 / ₺99,99 …).
 * Same rule as Lokum Blast — see docs/04-ekonomi-ve-fiyatlandirma.md.
 *
 * Monetization philosophy (idle genre): rewarded ads are always optional and
 * always worth it; there are NO interstitials and NO banners. Gold is the
 * only premium currency and everything it buys is also earnable for free.
 */
export type ProductType = 'consumable' | 'non_consumable' | 'subscription';

export interface Grant {
  gold?: number;
  /** Instant earnings equal to this many hours of idle income. */
  warpHours?: number;
  /** ×2 income boost hours (not limited by the 8 h ad cap). */
  boostHours?: number;
}

export interface Product {
  id: string;
  type: ProductType;
  grant: Grant;
  usd: number;
  try: number;
  badge?: 'popular' | 'best' | 'limited' | 'new';
  /** Extra gold vs. the smallest pack's rate, shown on gold packs. */
  bonus?: number;
  /** One purchase per player. */
  once?: boolean;
  period?: 'month' | 'year';
}

export const PRODUCTS: readonly Product[] = [
  // ── Gold (consumable) ─────────────────────────────────────────────
  { id: 'gold_80', type: 'consumable', grant: { gold: 80 }, usd: 0.99, try: 24.99 },
  { id: 'gold_500', type: 'consumable', grant: { gold: 500 }, usd: 4.99, try: 119.99, bonus: 25 },
  { id: 'gold_1100', type: 'consumable', grant: { gold: 1100 }, usd: 9.99, try: 229.99, bonus: 35, badge: 'popular' },
  { id: 'gold_2400', type: 'consumable', grant: { gold: 2400 }, usd: 19.99, try: 449.99, bonus: 50 },
  { id: 'gold_6500', type: 'consumable', grant: { gold: 6500 }, usd: 49.99, try: 999.99, bonus: 60, badge: 'best' },
  { id: 'gold_14000', type: 'consumable', grant: { gold: 14000 }, usd: 99.99, try: 1999.99, bonus: 75 },

  // ── Starter pack: shown for 72 h after the first move (or 30 min of play) ──
  { id: 'starter_pack', type: 'consumable', grant: { gold: 300, boostHours: 24, warpHours: 2 }, usd: 1.99, try: 49.99, badge: 'limited', once: true },

  // ── Permanent upgrades (non-consumable, restorable) ────────────────
  { id: 'mult_x2', type: 'non_consumable', grant: {}, usd: 4.99, try: 99.99, once: true },
  { id: 'mult_x3', type: 'non_consumable', grant: {}, usd: 9.99, try: 199.99, once: true, badge: 'best' },
  { id: 'no_ads', type: 'non_consumable', grant: { gold: 100 }, usd: 6.99, try: 149.99, once: true },

  // ── Subscription: Kedi Kulübü ──────────────────────────────────────
  { id: 'club_monthly', type: 'subscription', grant: {}, usd: 5.99, try: 99.99, period: 'month' },
  { id: 'club_yearly', type: 'subscription', grant: {}, usd: 39.99, try: 699.99, period: 'year', badge: 'best' },
];

export const PRODUCT_BY_ID: Readonly<Record<string, Product>> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/** Kedi Kulübü perks, active while the subscription entitlement is. */
export const CLUB_PERKS = {
  incomeMult: 2,
  dailyGold: 30,
  offlineCapH: 24,
  adFree: true,
} as const;

/** RevenueCat entitlement identifiers. */
export const ENTITLEMENT_NO_ADS = 'no_ads';
export const ENTITLEMENT_CLUB = 'club';

// ── Gold shop ─────────────────────────────────────────────────────────

export const TIME_WARPS = [
  { hours: 1, gold: 30 },
  { hours: 4, gold: 100 },
  { hours: 24, gold: 500 },
] as const;

/** Offline earnings cap ("kasa") by upgrade level, and the gold to reach each level. */
export const OFFLINE_CAPS_H = [4, 6, 8, 12, 24] as const;
export const OFFLINE_CAP_COSTS = [0, 60, 150, 350, 800] as const;

/** Rewarded-ad placements and their rewards. */
export const BOOST_HOURS_PER_AD = 2;
export const BOOST_MAX_HOURS = 8;
export const FREE_GOLD_PER_AD = 10;
export const FREE_GOLD_ADS_PER_DAY = 3;

/** Fallback price label when the store has not returned localized prices yet. */
export function fallbackPrice(p: Product, lang: string): string {
  if (lang === 'tr') {
    const [int, dec] = p.try.toFixed(2).split('.');
    return `₺${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
  }
  return `$${p.usd.toFixed(2)}`;
}
