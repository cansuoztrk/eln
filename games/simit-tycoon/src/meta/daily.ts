import { N } from '../core/economy';
import { hashSeed, Rng } from '../core/rng';
import { CLUB_PERKS, FREE_GOLD_ADS_PER_DAY, FREE_GOLD_PER_AD, type Grant } from './catalog';
import { isClub, type Game } from './game';
import { store, type QuestState } from './state';

/**
 * Daily retention systems:
 *  - 7-day login calendar (the streak resets when a day is missed)
 *  - 3 daily quests + a bonus chest
 *  - free gold from rewarded ads (3 per day)
 *  - Kedi Kulübü daily gold
 */

export function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00`);
  const db = new Date(`${b}T12:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

// ───────────── login calendar ─────────────

export const LOGIN_REWARDS: readonly Grant[] = [{ gold: 10 }, { gold: 15 }, { boostHours: 2 }, { gold: 25 }, { warpHours: 1 }, { gold: 35 }, { gold: 75, warpHours: 4 }];

/** Calendar day index (0..6) claimable today, or -1 if already claimed. */
export function loginClaimable(today = todayKey()): number {
  const { last, day } = store.data.login;
  if (last === today) return -1;
  if (!last || dayDiff(last, today) > 1) return 0;
  return (day + 1) % 7;
}

export function claimLogin(game: Game, today = todayKey()): Grant | null {
  const idx = loginClaimable(today);
  if (idx < 0) return null;
  const grant = LOGIN_REWARDS[idx];
  store.update((d) => {
    const consecutive = d.login.last && dayDiff(d.login.last, today) === 1;
    d.login.streak = consecutive ? d.login.streak + 1 : 1;
    d.login.day = idx;
    d.login.last = today;
  });
  game.applyGrant(grant);
  return grant;
}

// ───────────── club daily gold ─────────────

export function clubGiftClaimable(today = todayKey()): boolean {
  return isClub() && store.data.vipLastDaily !== today;
}

export function claimClubGift(game: Game, today = todayKey()): number {
  if (!clubGiftClaimable(today)) return 0;
  store.update((d) => {
    d.vipLastDaily = today;
  });
  game.addGold(CLUB_PERKS.dailyGold);
  return CLUB_PERKS.dailyGold;
}

// ───────────── free gold (rewarded ads) ─────────────

export function freeGoldLeft(today = todayKey()): number {
  const f = store.data.freeGold;
  return f.date === today ? Math.max(0, FREE_GOLD_ADS_PER_DAY - f.n) : FREE_GOLD_ADS_PER_DAY;
}

export function grantFreeGold(game: Game, today = todayKey()): number {
  if (freeGoldLeft(today) <= 0) return 0;
  store.update((d) => {
    if (d.freeGold.date !== today) d.freeGold = { date: today, n: 0 };
    d.freeGold.n++;
  });
  game.addGold(FREE_GOLD_PER_AD);
  return FREE_GOLD_PER_AD;
}

// ───────────── quests ─────────────

export type QuestId = 'tap' | 'buy' | 'hire' | 'recipe' | 'seagull' | 'ferry' | 'boost' | 'milestone';

const POOL: ReadonlyArray<{ id: QuestId; target: number; reward: number }> = [
  { id: 'tap', target: 150, reward: 10 },
  { id: 'buy', target: 100, reward: 10 },
  { id: 'hire', target: 2, reward: 15 },
  { id: 'recipe', target: 3, reward: 15 },
  { id: 'seagull', target: 3, reward: 10 },
  { id: 'ferry', target: 2, reward: 10 },
  { id: 'boost', target: 1, reward: 10 },
  { id: 'milestone', target: 5, reward: 15 },
];

export const QUEST_CHEST: Grant = { gold: 25, warpHours: 1 };

/** Rolls today's 3 quests (deterministic per day, adapted to what is possible). */
export function ensureQuests(today = todayKey()): QuestState[] {
  const q = store.data.quests;
  if (q.date === today && q.list.length) return q.list;
  const rng = new Rng(hashSeed(`quests-${today}`));
  const r = store.data.run;
  let unhired = 0;
  for (let i = 0; i < r.stands; i++) if (!r.managers[i]) unhired++;
  const pool = POOL.filter((p) => !(p.id === 'hire' && unhired < 2 && r.stands === N));
  const list = rng
    .shuffle(pool.slice())
    .slice(0, 3)
    .map((p) => ({ id: p.id, target: p.target, progress: 0, reward: p.reward, claimed: false }));
  store.update((d) => {
    d.quests = { date: today, list, chest: false };
  });
  return list;
}

export function questProgress(id: QuestId, n = 1, today = todayKey()): void {
  const list = ensureQuests(today);
  let changed = false;
  for (const q of list) {
    if (q.id === id && !q.claimed && q.progress < q.target) {
      q.progress = Math.min(q.target, q.progress + n);
      changed = true;
    }
  }
  if (changed) store.update(() => {});
}

export function claimQuest(game: Game, index: number): number {
  const q = store.data.quests.list[index];
  if (!q || q.claimed || q.progress < q.target) return 0;
  store.update(() => {
    q.claimed = true;
  });
  game.addGold(q.reward);
  return q.reward;
}

export function chestReady(): boolean {
  const q = store.data.quests;
  return !q.chest && q.list.length > 0 && q.list.every((x) => x.claimed);
}

export function claimChest(game: Game): Grant | null {
  if (!chestReady()) return null;
  store.update((d) => {
    d.quests.chest = true;
  });
  game.applyGrant(QUEST_CHEST);
  return QUEST_CHEST;
}

/** Quests ready to claim (for the badge on the quest button). */
export function questsClaimable(): number {
  const list = store.data.quests.list;
  return list.filter((q) => !q.claimed && q.progress >= q.target).length + (chestReady() ? 1 : 0);
}

/** Connects game events to quest progress. */
export function wireQuests(game: Game): void {
  game.on((e) => {
    switch (e.type) {
      case 'tap':
        questProgress('tap');
        break;
      case 'buy':
        questProgress('buy', e.count);
        break;
      case 'hire':
        questProgress('hire');
        break;
      case 'recipe':
        questProgress('recipe');
        break;
      case 'seagull':
        questProgress('seagull');
        break;
      case 'rush':
        if (e.on) questProgress('ferry');
        break;
      case 'boost':
        questProgress('boost');
        break;
      case 'milestone':
        questProgress('milestone', e.count);
        break;
    }
  });
}
