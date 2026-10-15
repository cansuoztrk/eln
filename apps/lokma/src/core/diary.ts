import { scale, sum } from './nutrition';
import type { DayLog, Entry, Food, MealKey, Nutrients, Portion } from './types';
import { MEALS } from './types';

/** Calories per sugar cube (~5 g sucrose). */
export const SUGAR_CUBE_KCAL = 20;
export const SUGAR_CUBE_G = 5;
/** A Turkish tea glass (ince belli) holds ~100 ml; plain tea is ~1 kcal. */
export const TEA_GLASS_ML = 100;
/** Default water glass (su bardağı). */
export const WATER_GLASS_ML = 200;

// ───────────── dates ─────────────

/** Local calendar day key, YYYY-MM-DD. */
export function dayKey(d: Date | number = new Date()): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Monday-based week: the 7 day keys of the week containing `key`. */
export function weekOf(key: string): string[] {
  const d = parseDay(key);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  const monday = addDays(key, -dow);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** ISO-8601 week id like 2026-W42 (used to remember which karne was seen). */
export function isoWeekId(key: string): string {
  const d = parseDay(key);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ───────────── day logs ─────────────

export function emptyDay(): DayLog {
  return { entries: [], waterMl: 0, tea: 0, teaSugar: 0 };
}

export function entryNutrients(e: Entry): Nutrients {
  return { kcal: e.kcal, p: e.p, c: e.c, f: e.f, fiber: e.fiber, sugar: e.sugar, sodium: e.sodium };
}

/** Tea sugar counts as food energy (pure sucrose). */
export function teaNutrients(day: DayLog): Nutrients {
  return {
    kcal: day.teaSugar * SUGAR_CUBE_KCAL + day.tea,
    p: 0,
    c: day.teaSugar * SUGAR_CUBE_G,
    f: 0,
    sugar: day.teaSugar * SUGAR_CUBE_G,
  };
}

export function dayTotals(day: DayLog | undefined): Nutrients {
  if (!day) return sum([]);
  return sum([...day.entries.map(entryNutrients), teaNutrients(day)]);
}

export function mealTotals(day: DayLog | undefined): Record<MealKey, Nutrients> {
  const out = {} as Record<MealKey, Nutrients>;
  for (const m of MEALS) out[m] = sum((day?.entries ?? []).filter((e) => e.meal === m).map(entryNutrients));
  return out;
}

/** A day "counts" for streaks when anything was logged (food, water or tea). */
export function isLogged(day: DayLog | undefined): boolean {
  return !!day && (day.entries.length > 0 || day.waterMl > 0 || day.tea > 0);
}

/**
 * Current streak in days ending today (or yesterday, so the streak is not
 * "lost" in the morning before the first log).
 */
export function streak(days: Record<string, DayLog>, today: string): number {
  let cursor = isLogged(days[today]) ? today : addDays(today, -1);
  let n = 0;
  while (isLogged(days[cursor])) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function bestStreak(days: Record<string, DayLog>): number {
  const keys = Object.keys(days).filter((k) => isLogged(days[k])).sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const k of keys) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

/** Suggested meal for "now" (used as the default when adding food). */
export function mealForTime(d: Date = new Date()): MealKey {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 4 && h < 11) return 'breakfast';
  if (h >= 11 && h < 15.5) return 'lunch';
  if (h >= 17.5 && h < 22.5) return 'dinner';
  return 'snack';
}

// ───────────── entries from foods ─────────────

export function portionGrams(food: Food, unit: Portion['unit'] | 'g' | 'ml', qty: number): number {
  if (unit === 'g' || unit === 'ml') return qty;
  const p = food.portions.find((x) => x.unit === unit);
  return (p ? p.g : 100) * qty;
}

let idSeq = 0;
export function newId(now = Date.now()): string {
  idSeq = (idSeq + 1) % 1_000_000;
  return `${now.toString(36)}${idSeq.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function entryFromFood(
  food: Food,
  opts: { meal: MealKey; unit: Portion['unit'] | 'g' | 'ml'; qty: number; name: string; now?: number; source?: Entry['source'] },
): Entry {
  const g = portionGrams(food, opts.unit, opts.qty);
  const n = scale(food.per100, g / 100);
  return {
    id: newId(opts.now),
    meal: opts.meal,
    t: opts.now ?? Date.now(),
    name: opts.name,
    foodId: food.id,
    source: opts.source ?? 'db',
    qty: opts.qty,
    unit: opts.unit,
    g: Math.round(g),
    ...roundNutrients(n),
  };
}

export function roundNutrients(n: Nutrients): Nutrients {
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const out: Nutrients = { kcal: Math.round(n.kcal), p: r1(n.p), c: r1(n.c), f: r1(n.f) };
  if (n.fiber !== undefined) out.fiber = r1(n.fiber);
  if (n.sugar !== undefined) out.sugar = r1(n.sugar);
  if (n.sodium !== undefined) out.sodium = Math.round(n.sodium);
  return out;
}

// ───────────── portion scale ("anne porsiyonu") ─────────────

/** Human portion sizes, from a bird's portion to a Turkish mum's. */
export const PORTION_SCALE = [
  { id: 'bird', factor: 0.5 },
  { id: 'small', factor: 0.75 },
  { id: 'normal', factor: 1 },
  { id: 'big', factor: 1.5 },
  { id: 'mum', factor: 2 },
] as const;
export type PortionScaleId = (typeof PORTION_SCALE)[number]['id'];
