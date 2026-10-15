import type { Grant } from './catalog';
import { store, type BoosterId } from './state';

/**
 * Soft-currency economy, tuned against the genre's biggest complaint ("+10
 * moves costs 1500 coins but a win pays 50"): a win pays 20–60 coins, +10
 * moves cost 200 → 350 → 500 within a level, a hint 100, a paw 180. An
 * engaged non-payer can afford a booster or a move refill every 3–4 levels.
 */
export const BOOSTER_PRICE: Record<BoosterId, number> = { hint: 100, paw: 180 };
export const EXTRA_MOVES = 10;
export const EXTRA_MOVES_PRICE = [200, 350, 500];
/** Rewarded videos for +moves per level, and free coins per day. */
export const MAX_MOVE_ADS_PER_LEVEL = 3;
export const REWARDED_COINS = 60;
export const MAX_REWARDED_COINS_PER_DAY = 5;
export const DAILY_REWARD = 100;

export function winCoins(movesLeft: number, kind: 'normal' | 'hard' | 'boss', daily: boolean): number {
  if (daily) return DAILY_REWARD;
  const bonus = kind === 'boss' ? 40 : kind === 'hard' ? 15 : 0;
  return 20 + Math.min(30, Math.floor(movesLeft / 2)) + bonus;
}

export function coins(): number {
  return store.data.coins;
}

export function addCoins(n: number): void {
  store.update((d) => {
    d.coins += n;
  });
}

export function spendCoins(n: number): boolean {
  if (store.data.coins < n) return false;
  store.update((d) => {
    d.coins -= n;
  });
  return true;
}

export function addBooster(id: BoosterId, n = 1): void {
  store.update((d) => {
    d.boosters[id] += n;
  });
}

export function useBooster(id: BoosterId): boolean {
  if (store.data.boosters[id] <= 0) return false;
  store.update((d) => {
    d.boosters[id]--;
    if (id === 'hint') d.stats.hintsUsed++;
    else d.stats.pawsUsed++;
  });
  return true;
}

export function buyBooster(id: BoosterId, qty = 1): boolean {
  if (!spendCoins(BOOSTER_PRICE[id] * qty)) return false;
  addBooster(id, qty);
  return true;
}

export function hasNoAds(): boolean {
  return store.data.removeAds;
}

/** Applies a purchase / reward bundle. */
export function applyGrant(g: Grant): void {
  store.update((d) => {
    if (g.coins) d.coins += g.coins;
    if (g.boosters) for (const [k, v] of Object.entries(g.boosters)) d.boosters[k as BoosterId] += v ?? 0;
    if (g.removeAds) d.removeAds = true;
  });
}
