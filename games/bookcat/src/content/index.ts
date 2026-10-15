import { hashSeed, Rng } from '../core/rng';
import { CORE } from './core';
import { EVERYDAY } from './everyday';
import { EXPERT } from './expert';
import { WORLD } from './world';
import type { Category, Lang } from './types';
import { LANGS } from './types';

export type { Category, Lang };
export { LANGS };

export const CATEGORIES: readonly Category[] = [...CORE, ...EVERYDAY, ...WORLD, ...EXPERT];
export const CATEGORY_BY_ID: ReadonlyMap<string, Category> = new Map(CATEGORIES.map((c) => [c.id, c]));

/** Normalised word for conflict checks (case/diacritics-insensitive). */
export function normWord(w: string, lang: Lang): string {
  return w
    .toLocaleLowerCase(lang === 'tr' ? 'tr' : lang)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

/** True when two categories may share a level (no exclusion tag, no shared word in any language). */
export function compatible(a: Category, b: Category): boolean {
  if (a.id === b.id) return false;
  if (a.excl?.some((t) => b.excl?.includes(t))) return false;
  for (const lang of LANGS) {
    const set = new Set(a.words[lang].map((w) => normWord(w, lang)));
    if (b.words[lang].some((w) => set.has(normWord(w, lang)))) return false;
  }
  return true;
}

/** Highest category tier allowed for a journey level. */
export function maxTier(n: number): number {
  if (n <= 12) return 1;
  if (n <= 35) return 2;
  if (n <= 80) return 3;
  if (n <= 160) return 4;
  return 5;
}

export interface PickedCategory {
  id: string;
  name: string;
  words: string[];
}

/**
 * Chooses the categories of journey level `n` (language independent, so the
 * same level shows the same shelves in every language) and avoids repeating
 * categories used in the previous levels.
 */
const memo = new Map<number, string[]>();

export function levelCategories(n: number, count: number, pool: readonly Category[] = CATEGORIES): string[] {
  const cached = memo.get(n);
  if (cached && cached.length === count) return cached;
  const recent = new Set<string>();
  for (let k = Math.max(1, n - 6); k < n; k++) for (const id of memo.get(k) ?? []) recent.add(id);
  const rng = new Rng(hashSeed(`bookcat:cats:${n}`));
  const tier = maxTier(n);
  const eligible = pool.filter((c) => c.tier <= tier && (c.pack !== 'istanbul' || n > 20));
  const order = rng.shuffle(eligible.slice());
  // Prefer fresh categories, then fall back to recently used ones.
  order.sort((a, b) => Number(recent.has(a.id)) - Number(recent.has(b.id)));
  const chosen: Category[] = [];
  for (const c of order) {
    if (chosen.length >= count) break;
    if (chosen.every((x) => compatible(x, c))) chosen.push(c);
  }
  if (chosen.length < count) {
    for (const c of rng.shuffle(pool.slice())) {
      if (chosen.length >= count) break;
      if (chosen.every((x) => compatible(x, c))) chosen.push(c);
    }
  }
  const ids = chosen.map((c) => c.id);
  memo.set(n, ids);
  return ids;
}

/** Picks `size` words of a category for a level, deterministic per level and language. */
export function pickWords(c: Category, lang: Lang, size: number, seed: string, easy: boolean): string[] {
  const list = c.words[lang];
  const pool = easy ? list.slice(0, Math.max(size, 8)) : list.slice();
  const rng = new Rng(hashSeed(`${seed}:${c.id}`));
  return rng.shuffle(pool.slice()).slice(0, size);
}

export function materialize(ids: string[], sizes: number[], lang: Lang, seed: string, easy: boolean): PickedCategory[] {
  return ids.map((id, i) => {
    const c = CATEGORY_BY_ID.get(id)!;
    return { id, name: c.name[lang], words: pickWords(c, lang, sizes[i], seed, easy) };
  });
}

/** Ensures level n's categories are computed after all earlier levels (repeat avoidance). */
export function warmLevels(upTo: number, sizesOf: (n: number) => number): void {
  for (let n = 1; n <= upTo; n++) if (!memo.has(n)) levelCategories(n, sizesOf(n));
}
