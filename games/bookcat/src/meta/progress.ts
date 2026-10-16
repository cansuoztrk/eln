import { CHAPTER_REWARD, chapterOf, CHAPTERS, endsChapter } from './chapters';
import { recordDaily } from './daily';
import { winCoins } from './economy';
import { store } from './state';

/**
 * Applies the outcome of a finished level to the save. Kept separate from the
 * UI so the rules (stars only improve, coins per win, chapter books) are
 * testable and identical for every screen that can end a level.
 */
export interface WinOutcome {
  coins: number;
  stars: 1 | 2 | 3;
  firstClear: boolean;
  /** Index of the rare book unlocked by finishing a chapter, or null. */
  book: number | null;
  bookCoins: number;
}

export function recordWin(opts: { key: string; level: number; daily: boolean; stars: 1 | 2 | 3; movesLeft: number; movesUsed: number; kind: 'normal' | 'hard' | 'boss' }): WinOutcome {
  if (opts.daily) {
    // Recorded under the puzzle's date ('D2026-10-15'), not the date of the
    // win: a puzzle started before midnight keeps the streak and leaves today's open.
    const coins = recordDaily(opts.stars, opts.movesUsed, opts.key.slice(1));
    store.update((d) => {
      d.stats.wins++;
      if (d.runs.daily?.key === opts.key) d.runs.daily = null;
    });
    return { coins, stars: opts.stars, firstClear: coins > 0, book: null, bookCoins: 0 };
  }
  const prev = store.data.levelStars[String(opts.level)] ?? 0;
  const firstClear = prev === 0;
  // Replaying an old level pays a quarter so farming stays unattractive.
  const coins = firstClear ? winCoins(opts.movesLeft, opts.kind, false) : Math.ceil(winCoins(opts.movesLeft, opts.kind, false) / 4);
  let book: number | null = null;
  let bookCoins = 0;
  store.update((d) => {
    d.stats.wins++;
    d.coins += coins;
    if (opts.stars > prev) {
      d.levelStars[String(opts.level)] = opts.stars;
      d.totalStars += opts.stars - prev;
    }
    if (opts.level >= d.level) d.level = opts.level + 1;
    if (d.runs.journey?.key === opts.key) d.runs.journey = null;
    if (firstClear && endsChapter(opts.level)) {
      const idx = chapterOf(opts.level);
      // One rare book per chapter; past the last chapter the names cycle but there is no new book.
      if (idx < CHAPTERS.length && !d.books.includes(idx)) {
        d.books.push(idx);
        book = idx;
        bookCoins = CHAPTER_REWARD;
        d.coins += CHAPTER_REWARD;
      }
    }
  });
  return { coins, stars: opts.stars, firstClear, book, bookCoins };
}

export function recordLoss(): void {
  store.update((d) => {
    d.stats.losses++;
  });
}
