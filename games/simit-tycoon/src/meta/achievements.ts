import { BUSINESSES, formatBig } from '../core/economy';
import type { Game } from './game';
import { store } from './state';

/**
 * Achievements ("Başarımlar"): a steady drip of gold for things players do
 * anyway. Each category shows its next goal; finished ones wait to be claimed.
 */
export type AchievementKind = 'stand' | 'festival' | 'district' | 'lifetime' | 'hires' | 'seagulls' | 'ferries' | 'taps';

export interface Achievement {
  id: string;
  kind: AchievementKind;
  /** Stand index for stand achievements. */
  stand?: number;
  target: number;
  value: number;
  reward: number;
  /** Pre-formatted target for the label (big numbers). */
  label: string;
}

const STAND_LEVELS = [25, 50, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000];
const STAND_GOLD = [2, 3, 5, 5, 8, 10, 10, 15, 20, 25, 30];
const COUNTERS: Record<'hires' | 'seagulls' | 'ferries' | 'taps', number[]> = {
  hires: [1, 10, 50, 100, 250, 500],
  seagulls: [5, 25, 100, 250, 500, 1000],
  ferries: [5, 25, 100, 250, 500],
  taps: [100, 1000, 5000, 20000, 50000],
};

function all(): Achievement[] {
  const d = store.data;
  const out: Achievement[] = [];
  BUSINESSES.forEach((_, i) => {
    STAND_LEVELS.forEach((lvl, k) => out.push({ id: `st${i}_${lvl}`, kind: 'stand', stand: i, target: lvl, value: d.achievements.best[i] ?? 0, reward: STAND_GOLD[k], label: String(lvl) }));
  });
  for (let k = 1; k <= 12; k++) out.push({ id: `fest${k}`, kind: 'festival', target: k, value: d.achievements.festivals, reward: 10 + 2 * k, label: String(k) });
  for (let k = 1; k <= 64; k++) out.push({ id: `dist${k}`, kind: 'district', target: k, value: d.district, reward: 20 + 5 * Math.min(k, 16), label: String(k) });
  for (let k = 1; k <= 100; k++) {
    const target = 1000 ** k;
    if (!Number.isFinite(target)) break;
    out.push({ id: `life${k}`, kind: 'lifetime', target, value: d.lifetime, reward: Math.min(50, 5 * k), label: formatBig(target) });
  }
  for (const kind of ['hires', 'seagulls', 'ferries', 'taps'] as const) {
    COUNTERS[kind].forEach((target, k) => out.push({ id: `${kind}${target}`, kind, target, value: d.stats[kind], reward: 5 + 5 * k, label: String(target) }));
  }
  return out;
}

export function isDone(a: Achievement): boolean {
  return a.value >= a.target;
}

/** Claimable ones first, then the next goal of every category / stand. */
export function achievementList(): Achievement[] {
  const claimed = new Set(store.data.achievements.claimed);
  const list = all();
  const ready = list.filter((a) => isDone(a) && !claimed.has(a.id));
  const next: Achievement[] = [];
  const seen = new Set<string>();
  for (const a of list) {
    if (isDone(a)) continue;
    const key = a.kind === 'stand' ? `stand${a.stand}` : a.kind;
    if (seen.has(key)) continue;
    // Stands not unlocked in this district yet stay hidden until reached once.
    if (a.kind === 'stand' && (store.data.achievements.best[a.stand!] ?? 0) === 0) continue;
    seen.add(key);
    next.push(a);
  }
  return [...ready, ...next];
}

export function achievementsClaimable(): number {
  const claimed = new Set(store.data.achievements.claimed);
  return all().filter((a) => isDone(a) && !claimed.has(a.id)).length;
}

export function claimAchievement(game: Game, id: string): number {
  const a = all().find((x) => x.id === id);
  if (!a || !isDone(a) || store.data.achievements.claimed.includes(id)) return 0;
  store.update((d) => {
    d.achievements.claimed.push(id);
  });
  game.addGold(a.reward);
  return a.reward;
}

export function claimAllAchievements(game: Game): number {
  let total = 0;
  for (const a of achievementList()) if (isDone(a)) total += claimAchievement(game, a.id);
  return total;
}
