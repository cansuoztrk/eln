import type { Grant } from './catalog';
import { store, type BoosterId } from './state';

/**
 * Soft-currency economy. Rule of thumb used for tuning: an engaged player
 * earns ~400–600 coins per day without paying (gameplay + daily systems +
 * optional rewarded ads), i.e. enough for 2–3 boosters a day. Payers skip the
 * grind; non-payers keep playing — and watch rewarded ads.
 */
export const BOOSTER_PRICE: Record<BoosterId, number> = {
  undo: 120,
  hammer: 180,
  refresh: 220,
  bomb: 300,
};

export const REVIVE_PRICE = [200, 400, 800];
export const EXTRA_MOVES = 5;
export const EXTRA_MOVES_PRICE = [250, 500, 900];
export const LIFE_REFILL_PRICE = 350;
export const MAX_LIVES = 5;
export const LIFE_REGEN_MS = 25 * 60 * 1000;
export const DAILY_CHALLENGE_REWARD = 150;
export const REWARDED_COIN_GIFT = 60;
export const MAX_REWARDED_GIFTS_PER_DAY = 5;

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
  });
  return true;
}

export function buyBooster(id: BoosterId, qty = 1): boolean {
  const price = boosterPackPrice(id, qty);
  if (!spendCoins(price)) return false;
  addBooster(id, qty);
  return true;
}

/** Packs of 3 are 10% off — nudges bigger coin spends. */
export function boosterPackPrice(id: BoosterId, qty: number): number {
  const base = BOOSTER_PRICE[id] * qty;
  return qty >= 3 ? Math.round((base * 0.9) / 10) * 10 : base;
}

export function isVip(now = Date.now()): boolean {
  return store.data.vipUntil > now;
}

export function hasNoAds(): boolean {
  return store.data.removeAds || isVip();
}

// ───────────── lives ─────────────

export function unlimitedLives(now = Date.now()): boolean {
  return isVip(now) || store.data.unlimitedLivesUntil > now;
}

/** Applies regeneration and returns current lives. */
export function lives(now = Date.now()): number {
  const d = store.data;
  if (d.lives >= MAX_LIVES) return d.lives;
  const gained = Math.floor((now - d.livesTs) / LIFE_REGEN_MS);
  if (gained > 0) {
    store.update((s) => {
      s.lives = Math.min(MAX_LIVES, s.lives + gained);
      s.livesTs = s.lives >= MAX_LIVES ? now : s.livesTs + gained * LIFE_REGEN_MS;
    });
  }
  return store.data.lives;
}

export function msToNextLife(now = Date.now()): number {
  if (lives(now) >= MAX_LIVES) return 0;
  return Math.max(0, LIFE_REGEN_MS - (now - store.data.livesTs));
}

/** Time until all lives are full (for the "lives refilled" notification). */
export function msToFullLives(now = Date.now()): number {
  const l = lives(now);
  if (l >= MAX_LIVES) return 0;
  return msToNextLife(now) + (MAX_LIVES - l - 1) * LIFE_REGEN_MS;
}

export function canPlayLevel(): boolean {
  return unlimitedLives() || lives() > 0;
}

export function loseLife(now = Date.now()): void {
  if (unlimitedLives(now)) return;
  lives(now);
  store.update((d) => {
    if (d.lives >= MAX_LIVES) d.livesTs = now;
    d.lives = Math.max(0, d.lives - 1);
  });
}

export function addLives(n: number): void {
  store.update((d) => {
    d.lives = Math.min(MAX_LIVES, d.lives + n);
    if (d.lives >= MAX_LIVES) d.livesTs = Date.now();
  });
}

// ───────────── grants (IAP & rewards) ─────────────

export function applyGrant(g: Grant, now = Date.now()): void {
  store.update((d) => {
    if (g.coins) d.coins += g.coins;
    if (g.boosters) for (const [k, v] of Object.entries(g.boosters)) d.boosters[k as BoosterId] += v ?? 0;
    if (g.unlimitedLivesHours) {
      d.unlimitedLivesUntil = Math.max(d.unlimitedLivesUntil, now) + g.unlimitedLivesHours * 3600_000;
      d.lives = MAX_LIVES;
    }
    if (g.removeAds) d.removeAds = true;
    if (g.themes) for (const t of g.themes) if (!d.themes.includes(t)) d.themes.push(t);
  });
}
