import type { Food, Lang } from './types';

/**
 * Offline food search tuned for Turkish: diacritic- and case-insensitive
 * (İ/ı/ş/ğ/ü/ö/ç, German umlauts), prefix-friendly, typo-tolerant, and
 * biased towards the user's language, favourites and recent foods.
 */

const FOLD: Record<string, string> = {
  ı: 'i', i̇: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u', ä: 'a', ß: 'ss', é: 'e', è: 'e', ê: 'e', á: 'a', à: 'a', ñ: 'n',
};

export function norm(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/i̇/g, 'i')
    .replace(/[ışğüöçâîûäßéèêáàñ]/g, (ch) => FOLD[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Indexed {
  food: Food;
  names: Record<Lang, string>;
  aliases: string[];
  words: string[];
}

export interface SearchIndex {
  items: Indexed[];
}

export function buildIndex(foods: readonly Food[]): SearchIndex {
  return {
    items: foods.map((food) => {
      const names = { tr: norm(food.tr), en: norm(food.en), de: norm(food.de) };
      const aliases = (food.aliases ?? []).map(norm);
      const words = [...new Set([names.tr, names.en, names.de, ...aliases].join(' ').split(' ').filter(Boolean))];
      return { food, names, aliases, words };
    }),
  };
}

/** Damerau–Levenshtein distance with an early exit above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

function tokenScore(token: string, item: Indexed): number {
  let best = 0;
  for (const w of item.words) {
    if (w === token) return 30;
    if (w.startsWith(token)) best = Math.max(best, 22 + Math.min(6, token.length));
    else if (token.length >= 3 && w.includes(token)) best = Math.max(best, 12);
    else if (token.length >= 4) {
      const max = token.length >= 7 ? 2 : 1;
      const prefix = w.slice(0, token.length + 1);
      const dist = Math.min(editDistance(token, w, max), editDistance(token, prefix, max));
      if (dist <= max) best = Math.max(best, 14 - dist * 4);
    }
  }
  return best;
}

export interface SearchOptions {
  lang: Lang;
  limit?: number;
  /** Food ids to boost (favourites first, then recent). */
  favorites?: readonly string[];
  recent?: readonly string[];
}

export function search(index: SearchIndex, query: string, opts: SearchOptions): Food[] {
  const q = norm(query);
  if (!q) return [];
  const tokens = q.split(' ');
  const fav = new Set(opts.favorites ?? []);
  const recent = new Map((opts.recent ?? []).map((id, i) => [id, i]));
  const scored: { food: Food; score: number }[] = [];
  for (const item of index.items) {
    let score = 0;
    let all = true;
    for (const t of tokens) {
      const s = tokenScore(t, item);
      if (s === 0) {
        all = false;
        break;
      }
      score += s;
    }
    if (!all) continue;
    const own = item.names[opts.lang];
    const any = [item.names.tr, item.names.en, item.names.de, ...item.aliases];
    if (any.includes(q)) score += 60;
    if (own === q) score += 20;
    else if (own.startsWith(q)) score += 25;
    else if (any.some((n) => n.startsWith(q))) score += 15;
    // Shorter names are usually the generic dish people mean ("çay" vs "çaylı kek").
    score -= Math.min(10, own.length / 6);
    if (fav.has(item.food.id)) score += 18;
    const r = recent.get(item.food.id);
    if (r !== undefined) score += Math.max(4, 14 - r);
    scored.push({ food: item.food, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, opts.limit ?? 30).map((s) => s.food);
}
