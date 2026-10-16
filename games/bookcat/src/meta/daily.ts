import { hashSeed, Rng } from '../core/rng';
import type { Grant } from './catalog';
import { applyGrant, DAILY_REWARD } from './economy';
import { store, type QuestState } from './state';

/**
 * Daily retention systems:
 *  - 7-day login gift calendar (resets if a day is missed)
 *  - Daily Shelf ("Günün Rafı"): the same puzzle for everyone, with a streak
 *    and a shareable result
 *  - 3 daily quests + a bonus chest
 */

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00`);
  const db = new Date(`${b}T12:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

// ───────────── login calendar ─────────────

export const LOGIN_REWARDS: readonly Grant[] = [
  { coins: 40 },
  { coins: 60 },
  { coins: 80, boosters: { hint: 1 } },
  { coins: 100 },
  { coins: 120, boosters: { paw: 1 } },
  { coins: 150, boosters: { hint: 1 } },
  { coins: 300, boosters: { hint: 2, paw: 1 } },
];

/**
 * Calendar day index (0..6) claimable today, or -1 if already claimed. A date
 * before the last claim (time-zone change, clock set back) is not a new day.
 */
export function loginClaimable(today = todayKey()): number {
  const { last, day } = store.data.login;
  if (last === today) return -1;
  if (!last) return 0;
  const diff = dayDiff(last, today);
  if (diff <= 0) return -1;
  return diff > 1 ? 0 : (day + 1) % 7;
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

// ───────────── Daily Shelf ─────────────

export function dailyDone(today = todayKey()): boolean {
  return store.data.daily.last === today;
}

/**
 * Records a Daily Shelf win for the puzzle of `today` (its date, not the date
 * of the win); returns the coins earned (base + streak bonus). Only a puzzle
 * newer than the last one recorded pays, so setting the clock back pays nothing.
 */
export function recordDaily(stars: number, moves: number, today = todayKey()): number {
  const last = store.data.daily.last;
  if (last && dayDiff(last, today) <= 0) return 0;
  let coins = DAILY_REWARD;
  store.update((d) => {
    const consecutive = d.daily.last && dayDiff(d.daily.last, today) === 1;
    d.daily.streak = consecutive ? d.daily.streak + 1 : 1;
    d.daily.best = Math.max(d.daily.best, d.daily.streak);
    d.daily.last = today;
    d.daily.results[today] = { stars, moves };
    // Keep the last 60 results only.
    const keys = Object.keys(d.daily.results).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete d.daily.results[k];
    coins += Math.min(50, (d.daily.streak - 1) * 10);
    d.coins += coins;
  });
  questEvent({ type: 'daily' });
  return coins;
}

/** Current streak, counting yesterday's win as still alive today. */
export function dailyStreak(today = todayKey()): number {
  const { last, streak } = store.data.daily;
  if (!last) return 0;
  return dayDiff(last, today) <= 1 ? streak : 0;
}

export function shareStars(stars: number): string {
  return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
}

// ───────────── quests ─────────────

export type QuestEvent =
  | { type: 'win'; stars: number }
  | { type: 'shelve'; n: number }
  | { type: 'category' }
  | { type: 'daily' }
  | { type: 'hint' };

interface QuestTemplate {
  id: 'win' | 'shelve' | 'categories' | 'stars3' | 'daily' | 'hint';
  targets: number[];
  rewards: number[];
}

/** Quest ids map to i18n keys `quest.<id>` with an {n} placeholder. */
const TEMPLATES: readonly QuestTemplate[] = [
  { id: 'win', targets: [2, 3, 5], rewards: [60, 90, 140] },
  { id: 'shelve', targets: [30, 60, 100], rewards: [50, 80, 120] },
  { id: 'categories', targets: [6, 10, 15], rewards: [60, 90, 130] },
  { id: 'stars3', targets: [1, 2, 3], rewards: [70, 100, 140] },
  { id: 'daily', targets: [1], rewards: [100] },
  { id: 'hint', targets: [1, 2], rewards: [40, 60] },
];

export const QUEST_CHEST: Grant = { coins: 150, boosters: { hint: 1, paw: 1 } };

export function ensureQuests(today = todayKey()): QuestState[] {
  if (store.data.quests.date === today && store.data.quests.list.length) return store.data.quests.list;
  const rng = new Rng(hashSeed(`bookcat-quests-${today}`));
  const pool = rng.shuffle([...TEMPLATES]);
  const tierMax = store.data.level < 10 ? 0 : store.data.level < 30 ? 1 : 2;
  const list: QuestState[] = pool.slice(0, 3).map((q) => {
    const tier = Math.min(q.targets.length - 1, rng.int(0, tierMax));
    return { id: q.id, target: q.targets[tier], progress: 0, reward: q.rewards[tier], claimed: false };
  });
  store.update((d) => {
    d.quests = { date: today, list, chest: false };
  });
  return list;
}

export function questEvent(e: QuestEvent): void {
  const list = ensureQuests();
  const bump = (id: string, by: number) => {
    const q = list.find((x) => x.id === id);
    if (q && !q.claimed) q.progress = Math.min(q.target, q.progress + by);
  };
  if (e.type === 'win') {
    bump('win', 1);
    if (e.stars === 3) bump('stars3', 1);
  } else if (e.type === 'shelve') bump('shelve', e.n);
  else if (e.type === 'category') bump('categories', 1);
  else if (e.type === 'daily') bump('daily', 1);
  else if (e.type === 'hint') bump('hint', 1);
  store.quiet(() => {});
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
