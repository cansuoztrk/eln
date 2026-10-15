import type { Grant } from './catalog';
import { applyGrant } from './economy';
import { store } from './state';

/**
 * Çarşı Pass — a 28-day season pass.
 *
 * Players earn pass points from normal play (levels, daily puzzle, quests,
 * classic games). Every 100 points unlocks a tier on two tracks: a free track
 * for everyone and a premium track unlocked by the `pass_premium` purchase.
 * Seasons are aligned to a fixed UTC epoch so every player shares the same
 * calendar (and LiveOps can theme them).
 */
export const PASS_EPOCH = Date.UTC(2026, 9, 1); // 1 October 2026, 00:00 UTC
export const SEASON_DAYS = 28;
export const TIERS = 30;
export const POINTS_PER_TIER = 100;
const SEASON_MS = SEASON_DAYS * 86_400_000;

/** Season themes cycle in this order (i18n: pass.season.<id>). */
export const SEASON_THEMES = ['lale', 'kahve', 'fener', 'cini', 'baharat', 'deniz'] as const;

/** How many pass points each activity is worth. */
export const PASS_POINTS = {
  levelWin: 40,
  perStar: 10,
  daily: 50,
  quest: 20,
  chest: 40,
  /** Classic: 1 point per 200 score, capped per game. */
  classicPer: 200,
  classicCap: 60,
} as const;

export function seasonIndex(now = Date.now()): number {
  return Math.max(0, Math.floor((now - PASS_EPOCH) / SEASON_MS));
}

export function seasonEndsAt(now = Date.now()): number {
  return PASS_EPOCH + (seasonIndex(now) + 1) * SEASON_MS;
}

export function seasonTheme(now = Date.now()): (typeof SEASON_THEMES)[number] {
  return SEASON_THEMES[seasonIndex(now) % SEASON_THEMES.length];
}

function freeReward(tier: number): Grant {
  if (tier % 10 === 0) return { coins: 250, boosters: { bomb: 1 } };
  if (tier % 5 === 0) return { boosters: tier % 10 === 5 ? { hammer: 1 } : { refresh: 1 } };
  if (tier % 3 === 0) return { boosters: { undo: 1 } };
  return { coins: 40 + tier * 4 };
}

function premiumReward(tier: number): Grant {
  if (tier === TIERS) return { coins: 1500, themes: ['saray'] };
  if (tier % 10 === 0) return { coins: 800, unlimitedLivesHours: tier === 10 ? 6 : 12 };
  if (tier % 5 === 0) return { boosters: { bomb: 2, hammer: 2 } };
  if (tier % 2 === 0) return { coins: 150 + tier * 5 };
  return { boosters: { refresh: 1, undo: 1 } };
}

export const FREE_TRACK: readonly Grant[] = Array.from({ length: TIERS }, (_, i) => freeReward(i + 1));
export const PREMIUM_TRACK: readonly Grant[] = Array.from({ length: TIERS }, (_, i) => premiumReward(i + 1));

/** Resets the pass when a new season starts. Call before reading pass state. */
export function ensureSeason(now = Date.now()): void {
  const s = seasonIndex(now);
  if (store.data.pass.season === s) return;
  store.update((d) => {
    d.pass = { season: s, points: 0, premium: false, claimedFree: [], claimedPremium: [] };
  });
}

export function passPoints(): number {
  ensureSeason();
  return store.data.pass.points;
}

/** Number of tiers fully unlocked (0..TIERS). */
export function unlockedTiers(points = passPoints()): number {
  return Math.min(TIERS, Math.floor(points / POINTS_PER_TIER));
}

export function addPassPoints(n: number): number {
  if (n <= 0) return 0;
  ensureSeason();
  const before = store.data.pass.points;
  const after = Math.min(TIERS * POINTS_PER_TIER, before + Math.round(n));
  store.update((d) => {
    d.pass.points = after;
  });
  return after - before;
}

export function classicPassPoints(score: number): number {
  return Math.min(PASS_POINTS.classicCap, Math.floor(score / PASS_POINTS.classicPer));
}

export type Track = 'free' | 'premium';

export function canClaim(track: Track, tier: number): boolean {
  ensureSeason();
  const p = store.data.pass;
  if (tier < 1 || tier > unlockedTiers(p.points)) return false;
  if (track === 'premium' && !p.premium) return false;
  const claimed = track === 'free' ? p.claimedFree : p.claimedPremium;
  return !claimed.includes(tier);
}

/** Claims one reward. Returns the grant actually applied, or null. */
export function claimTier(track: Track, tier: number): Grant | null {
  if (!canClaim(track, tier)) return null;
  let grant = (track === 'free' ? FREE_TRACK : PREMIUM_TRACK)[tier - 1];
  // A theme the player already owns is replaced by coins so the top reward never feels empty.
  if (grant.themes && grant.themes.every((t) => store.data.themes.includes(t))) {
    grant = { coins: (grant.coins ?? 0) + 5000 };
  }
  applyGrant(grant);
  store.update((d) => {
    (track === 'free' ? d.pass.claimedFree : d.pass.claimedPremium).push(tier);
  });
  return grant;
}

/** Claims everything available; returns the merged grant for a single reward popup. */
export function claimAll(): Grant | null {
  const merged: Grant = {};
  let any = false;
  for (let tier = 1; tier <= unlockedTiers(); tier++) {
    for (const track of ['free', 'premium'] as const) {
      const g = claimTier(track, tier);
      if (!g) continue;
      any = true;
      if (g.coins) merged.coins = (merged.coins ?? 0) + g.coins;
      if (g.unlimitedLivesHours) merged.unlimitedLivesHours = (merged.unlimitedLivesHours ?? 0) + g.unlimitedLivesHours;
      if (g.themes) merged.themes = [...(merged.themes ?? []), ...g.themes];
      if (g.boosters) {
        merged.boosters = merged.boosters ?? {};
        for (const [k, v] of Object.entries(g.boosters)) {
          const key = k as keyof typeof merged.boosters;
          merged.boosters[key] = (merged.boosters[key] ?? 0) + (v ?? 0);
        }
      }
    }
  }
  return any ? merged : null;
}

export function claimableCount(): number {
  ensureSeason();
  let n = 0;
  for (let tier = 1; tier <= unlockedTiers(); tier++) {
    if (canClaim('free', tier)) n++;
    if (canClaim('premium', tier)) n++;
  }
  return n;
}

/** Called by the IAP layer when `pass_premium` is bought. */
export function unlockPremium(): void {
  ensureSeason();
  store.update((d) => {
    d.pass.premium = true;
  });
}
