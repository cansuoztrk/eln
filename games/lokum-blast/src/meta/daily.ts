import { todayKey } from '../core/levels';
import { hashSeed, Rng } from '../core/rng';
import type { SessionStats } from '../core/session';
import { VIP_PERKS } from './catalog';
import { applyGrant, isVip } from './economy';
import { store, type BoosterId, type QuestState } from './state';
import type { Grant } from './catalog';

/**
 * Daily retention systems:
 *  - 7-day login calendar (streak resets if a day is missed)
 *  - "Çarkıfelek" daily wheel (free spin + rewarded-ad spins)
 *  - 3 daily quests + bonus chest
 *  - VIP daily gift
 */

// ───────────── login calendar ─────────────

export const LOGIN_REWARDS: readonly Grant[] = [
  { coins: 50 },
  { coins: 80 },
  { coins: 100, boosters: { undo: 1 } },
  { coins: 150 },
  { coins: 200, boosters: { hammer: 1 } },
  { coins: 250, boosters: { refresh: 1 } },
  { coins: 500, boosters: { bomb: 2, hammer: 1 } },
];

function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00`);
  const db = new Date(`${b}T12:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** Returns the calendar day index (0..6) claimable today, or -1 if already claimed. */
export function loginClaimable(today = todayKey()): number {
  const { last, day } = store.data.login;
  if (last === today) return -1;
  if (!last || dayDiff(last, today) > 1) return 0;
  return (day + 1) % 7;
}

export function claimLogin(today = todayKey()): Grant | null {
  const idx = loginClaimable(today);
  if (idx < 0) return null;
  const grant = LOGIN_REWARDS[idx];
  applyGrant(grant);
  store.update((d) => {
    const consecutive = d.login.last && dayDiff(d.login.last, today) === 1;
    d.login.streak = consecutive ? d.login.streak + 1 : 1;
    d.login.day = idx;
    d.login.last = today;
  });
  return grant;
}

// ───────────── VIP daily gift ─────────────

export function vipGiftClaimable(today = todayKey()): boolean {
  return isVip() && store.data.vipLastDaily !== today;
}

export function claimVipGift(today = todayKey()): Grant | null {
  if (!vipGiftClaimable(today)) return null;
  const n = VIP_PERKS.dailyBoosters;
  const grant: Grant = { coins: VIP_PERKS.dailyCoins, boosters: { undo: n, hammer: n, refresh: n, bomb: n } };
  applyGrant(grant);
  store.update((d) => {
    d.vipLastDaily = today;
  });
  return grant;
}

// ───────────── wheel ─────────────

export interface WheelPrize {
  label: string;
  grant: Grant;
  weight: number;
  color: string;
}

export const WHEEL: readonly WheelPrize[] = [
  { label: '25', grant: { coins: 25 }, weight: 24, color: '#ff6fa5' },
  { label: 'undo', grant: { boosters: { undo: 1 } }, weight: 14, color: '#8fd14f' },
  { label: '50', grant: { coins: 50 }, weight: 20, color: '#ffd447' },
  { label: 'hammer', grant: { boosters: { hammer: 1 } }, weight: 11, color: '#3fd6c8' },
  { label: '100', grant: { coins: 100 }, weight: 13, color: '#ff9b3d' },
  { label: 'refresh', grant: { boosters: { refresh: 1 } }, weight: 9, color: '#a77bff' },
  { label: '250', grant: { coins: 250 }, weight: 6, color: '#ef3e5b' },
  { label: 'bomb', grant: { boosters: { bomb: 1 } }, weight: 3, color: '#ffc531' },
];

export const MAX_AD_SPINS = 2;

/** Published odds (App Store guideline 3.1.1 asks for transparency on random rewards). */
export function wheelOdds(): Array<{ label: string; pct: number }> {
  const total = WHEEL.reduce((s, p) => s + p.weight, 0);
  return WHEEL.map((p) => ({ label: p.label, pct: Math.round((p.weight / total) * 1000) / 10 }));
}

export function freeSpinAvailable(today = todayKey()): boolean {
  return store.data.wheel.lastFree !== today;
}

export function adSpinsLeft(today = todayKey()): number {
  const w = store.data.wheel;
  return w.adDate === today ? Math.max(0, MAX_AD_SPINS - w.adSpins) : MAX_AD_SPINS;
}

/** Picks a prize index; caller animates the wheel and then calls grantWheel. */
export function rollWheel(rng: () => number = Math.random): number {
  const total = WHEEL.reduce((s, p) => s + p.weight, 0);
  let r = rng() * total;
  for (let i = 0; i < WHEEL.length; i++) {
    r -= WHEEL[i].weight;
    if (r < 0) return i;
  }
  return 0;
}

export function consumeSpin(kind: 'free' | 'ad', today = todayKey()): void {
  store.update((d) => {
    if (kind === 'free') d.wheel.lastFree = today;
    else {
      if (d.wheel.adDate !== today) {
        d.wheel.adDate = today;
        d.wheel.adSpins = 0;
      }
      d.wheel.adSpins++;
    }
  });
}

export function grantWheel(i: number): Grant {
  const prize = WHEEL[i];
  const mult = isVip() ? VIP_PERKS.wheelMultiplier : 1;
  const g: Grant = {};
  if (prize.grant.coins) g.coins = prize.grant.coins * mult;
  if (prize.grant.boosters) {
    g.boosters = {};
    for (const [k, v] of Object.entries(prize.grant.boosters)) g.boosters[k as BoosterId] = (v ?? 0) * mult;
  }
  applyGrant(g);
  return g;
}

// ───────────── quests ─────────────

export type QuestEvent =
  | { type: 'move'; stats: SessionStats; mode: string }
  | { type: 'game_end'; score: number; mode: string }
  | { type: 'level_won' }
  | { type: 'daily_won' }
  | { type: 'booster' };

interface QuestTemplate {
  id: string;
  targets: number[];
  rewards: number[];
}

/** Quest ids map to i18n keys `quest.<id>` with a {n} placeholder. */
const TEMPLATES: readonly QuestTemplate[] = [
  { id: 'lines', targets: [20, 35, 50], rewards: [60, 90, 120] },
  { id: 'combo', targets: [3, 4, 5], rewards: [70, 100, 140] },
  { id: 'levels', targets: [2, 3, 4], rewards: [80, 110, 150] },
  { id: 'score', targets: [1500, 3000, 5000], rewards: [60, 90, 130] },
  { id: 'gold', targets: [3, 5, 8], rewards: [70, 100, 130] },
  { id: 'pieces', targets: [50, 80, 120], rewards: [50, 80, 110] },
  { id: 'multi', targets: [4, 7, 10], rewards: [70, 100, 140] },
  { id: 'boosters', targets: [1, 2, 3], rewards: [60, 80, 110] },
  { id: 'daily', targets: [1], rewards: [100] },
];

export const QUEST_CHEST: Grant = { coins: 200, boosters: { hammer: 1, bomb: 1 } };

export function ensureQuests(today = todayKey()): QuestState[] {
  if (store.data.quests.date === today && store.data.quests.list.length) return store.data.quests.list;
  const rng = new Rng(hashSeed(`quests-${today}`));
  const pool = rng.shuffle([...TEMPLATES]);
  // Early players get easier tiers.
  const tierMax = store.data.level < 8 ? 0 : store.data.level < 25 ? 1 : 2;
  const list: QuestState[] = pool.slice(0, 3).map((t) => {
    const tier = Math.min(t.targets.length - 1, rng.int(0, tierMax));
    return { id: t.id, target: t.targets[tier], progress: 0, reward: t.rewards[tier], claimed: false };
  });
  store.update((d) => {
    d.quests = { date: today, list, chest: false };
  });
  return list;
}

// Per-game baselines so that cumulative stats translate into quest deltas.
let lastMoveStats: SessionStats | null = null;

export function resetQuestTracking(): void {
  lastMoveStats = null;
}

export function questEvent(e: QuestEvent): void {
  const list = ensureQuests();
  const bump = (id: string, by: number, absolute = false) => {
    const q = list.find((x) => x.id === id);
    if (!q || q.claimed) return;
    q.progress = Math.min(q.target, absolute ? Math.max(q.progress, by) : q.progress + by);
  };
  switch (e.type) {
    case 'move': {
      const prev = lastMoveStats ?? { pieces: 0, lines: 0, maxCombo: 0, pureLines: 0, boardClears: 0, gold: 0, multiClears: 0 };
      bump('lines', e.stats.lines - prev.lines);
      bump('pieces', e.stats.pieces - prev.pieces);
      bump('gold', e.stats.gold - prev.gold);
      bump('multi', e.stats.multiClears - prev.multiClears);
      bump('combo', e.stats.maxCombo, true);
      lastMoveStats = { ...e.stats };
      break;
    }
    case 'game_end':
      if (e.mode === 'classic') bump('score', e.score, true);
      lastMoveStats = null;
      break;
    case 'level_won':
      bump('levels', 1);
      break;
    case 'daily_won':
      bump('daily', 1);
      break;
    case 'booster':
      bump('boosters', 1);
      break;
  }
  store.update(() => {});
}

export function claimQuest(i: number): number {
  const q = store.data.quests.list[i];
  if (!q || q.claimed || q.progress < q.target) return 0;
  store.update((d) => {
    d.quests.list[i].claimed = true;
    d.coins += q.reward;
  });
  return q.reward;
}

export function chestReady(): boolean {
  const { list, chest } = store.data.quests;
  return !chest && list.length > 0 && list.every((q) => q.claimed);
}

export function claimChest(): Grant | null {
  if (!chestReady()) return null;
  applyGrant(QUEST_CHEST);
  store.update((d) => {
    d.quests.chest = true;
  });
  return QUEST_CHEST;
}

export function questsAttention(): number {
  const list = store.data.quests.list;
  return list.filter((q) => !q.claimed && q.progress >= q.target).length + (chestReady() ? 1 : 0);
}
