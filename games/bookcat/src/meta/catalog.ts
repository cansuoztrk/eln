import type { BoosterId } from './state';

/**
 * In-app purchase catalogue — the single source of truth for every product
 * created in App Store Connect / Google Play Console.
 *
 * `usd` is the base price; stores auto-convert other storefronts from it.
 * `try` is a MANUAL Türkiye price: auto-conversion lands ~2x above local
 * purchasing power, so TRY prices are set by hand at roughly 45–50 % of the
 * converted value on psychological thresholds (₺24,99 / ₺49,99 / ₺99,99…),
 * the same method as Lokum Blast and Simit Tycoon (docs/04, docs/09).
 */
export type ProductType = 'consumable' | 'non_consumable';

export interface Grant {
  coins?: number;
  boosters?: Partial<Record<BoosterId, number>>;
  removeAds?: boolean;
}

export interface Product {
  id: string;
  type: ProductType;
  grant: Grant;
  usd: number;
  try: number;
  badge?: 'popular' | 'best' | 'limited';
  /** Bonus vs. the base rate (600 coins per $0.99). */
  bonus?: number;
  once?: boolean;
}

export const PRODUCTS: readonly Product[] = [
  { id: 'coins_600', type: 'consumable', grant: { coins: 600 }, usd: 0.99, try: 24.99 },
  { id: 'coins_1500', type: 'consumable', grant: { coins: 1500 }, usd: 1.99, try: 49.99, bonus: 25 },
  { id: 'coins_4000', type: 'consumable', grant: { coins: 4000 }, usd: 4.99, try: 119.99, bonus: 33 },
  { id: 'coins_9000', type: 'consumable', grant: { coins: 9000 }, usd: 9.99, try: 229.99, bonus: 50, badge: 'popular' },
  { id: 'coins_20000', type: 'consumable', grant: { coins: 20000 }, usd: 19.99, try: 449.99, bonus: 67 },
  { id: 'coins_55000', type: 'consumable', grant: { coins: 55000 }, usd: 49.99, try: 999.99, bonus: 83, badge: 'best' },
  { id: 'starter_pack', type: 'consumable', grant: { coins: 1500, boosters: { hint: 5, paw: 3 } }, usd: 1.99, try: 49.99, badge: 'limited', once: true },
  { id: 'bundle_kurt', type: 'consumable', grant: { coins: 5000, boosters: { hint: 10, paw: 6 } }, usd: 6.99, try: 159.99 },
  { id: 'bundle_sahaf', type: 'consumable', grant: { coins: 20000, boosters: { hint: 30, paw: 20 } }, usd: 24.99, try: 549.99, badge: 'best' },
  { id: 'no_ads', type: 'non_consumable', grant: { removeAds: true, coins: 1000 }, usd: 4.99, try: 99.99, once: true },
];

export const PRODUCT_BY_ID: Readonly<Record<string, Product>> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/** Price label used when the store has not returned localized prices (web / demo). */
export function fallbackPrice(p: Product, lang: string): string {
  if (lang === 'tr') return `₺${p.try.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  if (lang === 'de' || lang === 'es') return `${p.usd.toFixed(2).replace('.', ',')} €`;
  return `$${p.usd.toFixed(2)}`;
}
