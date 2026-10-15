import { addDays, dayKey, entryFromFood, newId, streak } from '../core/diary';
import { plan } from '../core/nutrition';
import { buildIndex, search, type SearchIndex } from '../core/search';
import type { Entry, Food, MealKey, Portion, Profile } from '../core/types';
import { FOOD_BY_ID, FOODS } from '../data/foods';
import { currentLang } from '../i18n';
import { CONFIG } from '../config';
import { ensureDay, store, type FastPlanId } from './state';

/**
 * All state mutations go through here so the rules (recent list, streak
 * bookkeeping, stats) live in one place and screens stay declarative.
 */

// ───────────── foods ─────────────

export function foodName(food: Pick<Food, 'tr' | 'en' | 'de'>): string {
  return food[currentLang()] || food.tr;
}

export function findFood(id: string | undefined): Food | null {
  if (!id) return null;
  return FOOD_BY_ID.get(id) ?? store.data.customFoods.find((f) => f.id === id) ?? null;
}

let index: SearchIndex | null = null;
let indexCustomCount = -1;

function searchIndex(): SearchIndex {
  const custom = store.data.customFoods;
  if (!index || indexCustomCount !== custom.length) {
    index = buildIndex([...custom, ...FOODS]);
    indexCustomCount = custom.length;
  }
  return index;
}

export function searchFoods(query: string, limit = 40): Food[] {
  const d = store.data;
  return search(searchIndex(), query, { lang: currentLang(), limit, favorites: d.favorites, recent: d.recent });
}

/** Staples shown before the user types (mix of breakfast, mains and drinks). */
export const POPULAR = [
  'simit', 'beyaz-peynir', 'haslanmis-yumurta', 'menemen', 'mercimek-corbasi', 'pirinc-pilavi', 'kuru-fasulye', 'tavuk-izgara',
  'lahmacun', 'manti', 'coban-salata', 'ayran', 'cay', 'turk-kahvesi', 'yogurt', 'elma', 'muz', 'baklava',
];

export function popularFoods(): Food[] {
  return POPULAR.map((id) => FOOD_BY_ID.get(id)).filter((f): f is Food => !!f);
}

export function recentFoods(limit = 12): Food[] {
  return store.data.recent.map((id) => findFood(id)).filter((f): f is Food => !!f).slice(0, limit);
}

export function favoriteFoods(): Food[] {
  return store.data.favorites.map((id) => findFood(id)).filter((f): f is Food => !!f);
}

export function isFavorite(id: string): boolean {
  return store.data.favorites.includes(id);
}

export function toggleFavorite(id: string): boolean {
  let now = false;
  store.update((d) => {
    const i = d.favorites.indexOf(id);
    if (i >= 0) d.favorites.splice(i, 1);
    else {
      d.favorites.unshift(id);
      now = true;
    }
  });
  return now;
}

export function saveCustomFood(food: Food): void {
  store.update((d) => {
    const i = d.customFoods.findIndex((f) => f.id === food.id);
    if (i >= 0) d.customFoods[i] = food;
    else d.customFoods.unshift(food);
    d.customFoods = d.customFoods.slice(0, 300);
  });
}

// ───────────── diary ─────────────

function touchRecent(ids: string[]): void {
  const d = store.data;
  for (const id of ids.reverse()) {
    const i = d.recent.indexOf(id);
    if (i >= 0) d.recent.splice(i, 1);
    d.recent.unshift(id);
  }
  d.recent = d.recent.slice(0, 40);
}

export function addEntries(day: string, entries: Entry[]): void {
  if (!entries.length) return;
  store.update((d) => {
    const log = ensureDay(d, day);
    log.entries.push(...entries);
    touchRecent(entries.map((e) => e.foodId).filter((x): x is string => !!x));
    d.stats.logs += entries.length;
    d.stats.bestStreak = Math.max(d.stats.bestStreak, streak(d.days, dayKey()));
  });
}

export function addFood(day: string, food: Food, meal: MealKey, unit: Portion['unit'] | 'g' | 'ml', qty: number, source: Entry['source'] = 'db'): Entry {
  const e = entryFromFood(food, { meal, unit, qty, name: foodName(food), source });
  addEntries(day, [e]);
  return e;
}

export function updateEntry(day: string, id: string, patch: Partial<Entry>): void {
  store.update((d) => {
    const log = ensureDay(d, day);
    const i = log.entries.findIndex((e) => e.id === id);
    if (i >= 0) log.entries[i] = { ...log.entries[i], ...patch };
  });
}

export function removeEntry(day: string, id: string): Entry | null {
  let removed: Entry | null = null;
  store.update((d) => {
    const log = ensureDay(d, day);
    const i = log.entries.findIndex((e) => e.id === id);
    if (i >= 0) removed = log.entries.splice(i, 1)[0];
  });
  return removed;
}

export function restoreEntry(day: string, e: Entry): void {
  store.update((d) => {
    ensureDay(d, day).entries.push(e);
  });
}

/** Copies yesterday's entries of a meal to `day`. */
export function copyMealFromYesterday(day: string, meal: MealKey): number {
  const prev = store.data.days[addDays(day, -1)];
  const src = prev?.entries.filter((e) => e.meal === meal) ?? [];
  const now = Date.now();
  addEntries(day, src.map((e) => ({ ...e, id: newId(now), t: now })));
  return src.length;
}

export function addWater(day: string, glasses: number): void {
  store.update((d) => {
    const log = ensureDay(d, day);
    log.waterMl = Math.max(0, log.waterMl + glasses * d.settings.waterGlassMl);
    d.stats.bestStreak = Math.max(d.stats.bestStreak, streak(d.days, dayKey()));
  });
}

export function addTea(day: string, glasses: number, sugar = 0): void {
  store.update((d) => {
    const log = ensureDay(d, day);
    log.tea = Math.max(0, log.tea + glasses);
    log.teaSugar = Math.max(0, log.teaSugar + sugar);
  });
}

export function logWeight(day: string, kg: number): void {
  store.update((d) => {
    ensureDay(d, day).weightKg = kg;
    const i = d.weights.findIndex((w) => w.d === day);
    if (i >= 0) d.weights[i].kg = kg;
    else d.weights.push({ d: day, kg });
    d.weights.sort((a, b) => a.d.localeCompare(b.d));
    // Keep the plan in sync with the latest weight (targets follow the body).
    if (d.profile && day === d.weights[d.weights.length - 1].d) {
      d.profile.weightKg = kg;
      if (!d.customTargets) d.targets = plan(d.profile).targets;
    }
  });
}

export function currentStreak(): number {
  return streak(store.data.days, dayKey());
}

// ───────────── profile ─────────────

export function applyProfile(p: Profile, name?: string): void {
  store.update((d) => {
    d.profile = p;
    if (!d.customTargets) d.targets = plan(p).targets;
    if (name !== undefined) d.name = name;
    const today = dayKey();
    if (!d.weights.some((w) => w.d === today)) d.weights.push({ d: today, kg: p.weightKg });
    d.weights.sort((a, b) => a.d.localeCompare(b.d));
    d.onboarded = true;
    if (p.fasting === 'ramadan') d.fasting.plan = 'ramadan';
    else if (p.fasting === 'intermittent') d.fasting.plan = '16:8';
  });
}

// ───────────── Pro & AI quota ─────────────

export function isPro(now = Date.now()): boolean {
  return store.data.pro.until > now;
}

export function aiLeft(): number {
  const d = store.data;
  return Math.max(0, CONFIG.freeAiScans + d.ai.bonus - d.ai.used);
}

export function canUseAi(): boolean {
  return isPro() || aiLeft() > 0;
}

export function countAiUse(): void {
  store.update((d) => {
    d.stats.aiScans++;
    if (!isPro()) d.ai.used++;
  });
}

/** Every completed 7-day streak gives non-Pro users one extra free analysis. */
export function grantStreakBonus(): boolean {
  const s = currentStreak();
  const d = store.data;
  if (isPro() || s < 7 || s % 7 !== 0 || d.ai.lastBonusStreak === s) return false;
  store.update((x) => {
    x.ai.bonus++;
    x.ai.lastBonusStreak = s;
  });
  return true;
}

// ───────────── fasting ─────────────

export const FAST_HOURS: Record<FastPlanId, number> = { '12:12': 12, '14:10': 14, '16:8': 16, '18:6': 18, '20:4': 20, omad: 23, ramadan: 14 };

/** Free users get the classic plans; longer ones are Pro. */
export const FREE_PLANS: FastPlanId[] = ['12:12', '14:10', '16:8', 'ramadan'];

export function startFast(planId: FastPlanId, at = Date.now()): void {
  store.update((d) => {
    d.fasting.plan = planId;
    d.fasting.start = at;
  });
}

export function endFast(at = Date.now(), goalH?: number): { hours: number; done: boolean } {
  const d = store.data;
  if (d.fasting.start === null) return { hours: 0, done: false };
  const start = d.fasting.start;
  const goal = goalH ?? FAST_HOURS[d.fasting.plan];
  const hours = (at - start) / 3_600_000;
  store.update((x) => {
    x.fasting.history.push({ start, end: at, plan: x.fasting.plan, goalH: goal });
    x.fasting.start = null;
  });
  return { hours, done: hours >= goal * 0.95 };
}
