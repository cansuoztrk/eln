import { deal, type Layout } from './deal';
import { hashSeed } from './rng';
import { bestPlayout, playout, solve } from './solver';

/**
 * Journey level design. A level is an abstract layout (category sizes,
 * columns, shelves, buried cards) plus a move budget. Budgets come from the
 * solver's best solution and a casual-player bot, with generous slack early
 * and a sawtooth later (every 5th level tighter, every 10th a "boss"), so
 * EVERY level is winnable without ads or purchases.
 *
 * Calibrated levels are precomputed by `npm run calibrate` into
 * level-tuning.json; levels beyond the table are generated on the fly with
 * the same rules.
 */

export interface LevelDef extends Layout {
  /** Move budget. */
  moves: number;
  /** Best solution found by the solver. */
  par: number;
  kind: 'normal' | 'hard' | 'boss';
}

export type LevelKind = LevelDef['kind'];

type Tuned = [number[], number, number, number[], number, number, number];

let table: Tuned[] | null = null;

/** Registers the precomputed table (sizes, columns, slots, depth, seed, moves, par). */
export function useTable(rows: Tuned[]): void {
  table = rows;
}

export const TUNED_LEVELS = (): number => table?.length ?? 0;

/** Level definition for journey level n (1-based): table first, generated beyond it. */
export function levelDef(n: number): LevelDef {
  const row = table?.[n - 1];
  if (row) {
    const [sizes, columns, slots, depth, seed, moves, par] = row;
    return { sizes, columns, slots, depth, seed, moves, par, kind: levelKind(n), lead: isOnboarding(n) };
  }
  return calibrate(n, { runs: 12 });
}

export function toRow(l: LevelDef): Tuned {
  return [l.sizes, l.columns, l.slots, l.depth, l.seed, l.moves, l.par];
}

export function levelKind(n: number): LevelKind {
  if (n >= 10 && n % 10 === 0) return 'boss';
  if (n >= 7 && n % 5 === 0) return 'hard';
  return 'normal';
}

function band(n: number): { cats: [number, number]; words: [number, number]; columns: number; slots: number; maxDepth: number } {
  if (n <= 1) return { cats: [2, 2], words: [3, 3], columns: 3, slots: 2, maxDepth: 1 };
  if (n <= 3) return { cats: [3, 3], words: [3, 3], columns: 3, slots: 2, maxDepth: 1 };
  if (n <= 6) return { cats: [3, 3], words: [4, 4], columns: 4, slots: 3, maxDepth: 2 };
  if (n <= 15) return { cats: [4, 4], words: [4, 5], columns: 4, slots: 3, maxDepth: 2 };
  if (n <= 30) return { cats: [4, 5], words: [4, 5], columns: 5, slots: 3, maxDepth: 3 };
  if (n <= 60) return { cats: [5, 5], words: [5, 6], columns: 5, slots: 4, maxDepth: 3 };
  if (n <= 120) return { cats: [5, 6], words: [5, 6], columns: 5, slots: 4, maxDepth: 4 };
  return { cats: [6, 6], words: [5, 7], columns: 5, slots: 4, maxDepth: 4 };
}

/** Deterministic layout for journey level `n` (attempt `k` varies the seed). */
export function layoutFor(n: number, k = 0): Layout {
  const seed = hashSeed(`bookcat:level:${n}:${k}`);
  let r = seed;
  const rand = () => {
    r ^= r << 13;
    r ^= r >>> 17;
    r ^= r << 5;
    return (r >>> 0) / 4294967296;
  };
  const b = band(n);
  const kind = levelKind(n);
  const cats = b.cats[0] + Math.floor(rand() * (b.cats[1] - b.cats[0] + 1)) + (kind === 'boss' && n > 20 ? 1 : 0);
  const sizes = Array.from({ length: Math.min(7, cats) }, () => b.words[0] + Math.floor(rand() * (b.words[1] - b.words[0] + 1)));
  const depth = Array.from({ length: b.columns }, (_, i) => Math.min(b.maxDepth, Math.round((i * b.maxDepth) / Math.max(1, b.columns - 1))));
  return { sizes, columns: b.columns, slots: b.slots, depth, seed, lead: isOnboarding(n) };
}

/** The first levels open with a playable category card (see Layout.lead). */
export function isOnboarding(n: number): boolean {
  return n <= 3;
}

/** Budget multiplier over the best winning playout found. */
export function slack(n: number, kind: LevelKind): number {
  const t = Math.min(1, Math.max(0, (n - 1) / 150));
  let f = 1.65 - 0.37 * t;
  if (kind === 'hard') f -= 0.07;
  else if (kind === 'boss') f -= 0.12;
  return f;
}

/**
 * Builds a calibrated level. Small layouts get an exact solver pass for a
 * tight `par`; every layout must be won by the planner bot, whose best line
 * proves solvability and anchors the budget.
 */
export function calibrate(n: number, opts: { runs?: number } = {}): LevelDef {
  const kind = levelKind(n);
  for (let k = 0; k < 16; k++) {
    const layout = layoutFor(n, k);
    const start = deal(layout);
    const best = bestPlayout(start, opts.runs ?? 24);
    if (!best) continue;
    let par = best.moves.length;
    if (start.cards.length <= 22) {
      const exact = solve(start, { maxNodes: 30_000 });
      if (exact.solved) par = Math.min(par, exact.moves.length);
    }
    const wins = Array.from({ length: 8 }, (_, i) => playout(start, 100 + i)).filter((p) => p.won).length;
    // Layouts the casual bot rarely wins are kept only for hard/boss levels.
    if (kind === 'normal' && wins < 3) continue;
    const moves = Math.max(par + 3, Math.round(best.moves.length * slack(n, kind)));
    return { ...layout, moves, par, kind };
  }
  throw new Error(`level ${n}: no solvable layout`);
}
