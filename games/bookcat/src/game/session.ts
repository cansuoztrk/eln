import { CATEGORIES, compatible, levelCategories, materialize, maxTier, warmLevels, type Lang, type PickedCategory } from '../content';
import { buildCards, deal } from '../core/deal';
import { categoryCount, levelDef, type LevelDef } from '../core/levels';
import { hashSeed, Rng } from '../core/rng';
import {
  apply, autoTarget, canMove, isLost, isWon, legalMoves, pawFetch, stars, type Move, type MoveResult, type Source, type State, type Target,
} from '../core/rules';
import { bestPlayout, hint } from '../core/solver';
import type { SavedRun } from '../meta/state';

/**
 * One play-through of a level: the rules state plus undo history, boosters
 * and move purchases. Undo is free (no coins, no ads) but does not refund the
 * moves already spent, so peeking at the stock is never free.
 */

export interface LevelSpec {
  /** 'L12' for journey level 12, 'D2026-10-15' for a daily puzzle. */
  key: string;
  n: number;
  daily: boolean;
  def: LevelDef;
  cats: PickedCategory[];
}

export function journeySpec(n: number, lang: Lang): LevelSpec {
  const def = levelDef(n);
  // Repeat avoidance reads the levels before n: compute them first, so a level
  // always gets the same shelves however (and after however many relaunches) it is reached.
  warmLevels(n - 1, categoryCount);
  const ids = levelCategories(n, def.sizes.length);
  return { key: `L${n}`, n, daily: false, def, cats: materialize(ids, def.sizes, lang, `level:${n}`, n < 30) };
}

/** Daily puzzle: same layout and shelves for everyone on a given date. */
export function dailySpec(date: string, lang: Lang): LevelSpec {
  const rng = new Rng(hashSeed(`bookcat:daily:${date}`));
  const sizes = Array.from({ length: 5 }, () => rng.int(4, 6));
  const pool = CATEGORIES.filter((c) => c.tier <= maxTier(80));
  const chosen: typeof pool = [];
  for (const c of rng.shuffle(pool.slice())) {
    if (chosen.length >= sizes.length) break;
    if (chosen.every((x) => compatible(x, c))) chosen.push(c);
  }
  const ids = chosen.map((c) => c.id);
  // Try a few seeds until the planner proves the deal, like journey calibration.
  for (let k = 0; k < 12; k++) {
    const seed = hashSeed(`bookcat:daily:${date}:${k}`);
    const def: LevelDef = { sizes, seed, columns: 5, slots: 4, depth: [0, 1, 2, 3, 3], moves: 0, par: 0, kind: 'normal' };
    const best = bestPlayout(deal(def), 16);
    if (!best) continue;
    const par = best.moves.length;
    return { key: `D${date}`, n: 0, daily: true, def: { ...def, par, moves: Math.round(par * 1.35) }, cats: materialize(ids, sizes, lang, `daily:${date}`, false) };
  }
  return journeySpec(45, lang);
}

/**
 * Fingerprint of everything the deal depends on. A saved run is only resumed
 * on the same layout: an app update that retunes a level must not merge old
 * card ids onto a different deal. (Words are not part of it: they only label
 * the cards, and stay valid across languages.)
 */
export function runSig(spec: LevelSpec): string {
  const d = spec.def;
  return [d.seed, d.sizes.join(','), d.columns, d.slots, d.depth.join(','), d.lead ? 1 : 0].join('|');
}

/**
 * True when a saved run can be resumed on this level: same key and layout
 * signature (old saves without one are checked by content alone), and its
 * cards are exactly the level's cards — each on the table once, or shelved
 * on an open shelf or a finished category.
 */
export function runFits(run: SavedRun, spec: LevelSpec): boolean {
  if (run.key !== spec.key) return false;
  if (run.sig && run.sig !== runSig(spec)) return false;
  const def = spec.def;
  const cards = buildCards(def.sizes);
  const cats = def.sizes.length;
  const int = (x: unknown, max = Infinity): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < max;
  if (![run.movesLeft, run.movesUsed, run.recycles, run.extra].every((x) => int(x))) return false;
  if (!Array.isArray(run.columns) || run.columns.length !== def.columns) return false;
  if (!Array.isArray(run.slots) || run.slots.length !== def.slots) return false;
  const onTable = new Set<number>();
  const take = (ids: unknown) => Array.isArray(ids) && ids.every((id) => int(id, cards.length) && !onTable.has(id) && !!onTable.add(id));
  if (!run.columns.every((c) => c && take(c.down) && take(c.up)) || !take(run.stock) || !take(run.waste)) return false;
  if (!Array.isArray(run.done) || !run.done.every((c) => int(c, cats)) || new Set(run.done).size !== run.done.length) return false;
  const done = new Set(run.done);
  const open = new Map<number, { count: number; top: number | null }>();
  for (const sl of run.slots) {
    if (sl === null) continue;
    if (!sl || !int(sl.cat, cats) || done.has(sl.cat) || open.has(sl.cat) || !int(sl.count, def.sizes[sl.cat])) return false;
    open.set(sl.cat, sl);
  }
  const shelved = new Map<number, number>();
  for (const c of cards) {
    if (onTable.has(c.id)) {
      // Finished categories and open shelf labels have left the table.
      if (done.has(c.cat) || (open.has(c.cat) && c.kind === 'cat')) return false;
      continue;
    }
    if (!done.has(c.cat) && !open.has(c.cat)) return false;
    if (c.kind === 'word') shelved.set(c.cat, (shelved.get(c.cat) ?? 0) + 1);
  }
  for (const [cat, sl] of open) {
    if ((shelved.get(cat) ?? 0) !== sl.count) return false;
    if (sl.count === 0 ? sl.top !== null : !(int(sl.top, cards.length) && !onTable.has(sl.top) && cards[sl.top].kind === 'word' && cards[sl.top].cat === cat)) return false;
  }
  return true;
}

/** Words on shelves: those of open shelves plus every word of a finished category. */
function shelvedWords(s: State): number {
  return s.slots.reduce((a, x) => a + (x ? x.count : 0), 0) + s.done.reduce((a, c) => a + s.sizes[c], 0);
}

export type SessionEvent =
  | { type: 'move'; result: MoveResult; move: Move }
  | { type: 'undo' }
  | { type: 'paw'; result: MoveResult; slot: number }
  | { type: 'moves'; added: number }
  | { type: 'win' }
  | { type: 'lose' };

export class Session {
  state: State;
  readonly spec: LevelSpec;
  /** Undo history; `paw` marks a state change made by the (paid) Paw booster. */
  private history: { state: State; paw: boolean }[] = [];
  /** Moves bought or earned during this run. */
  extra = 0;
  /** True once extra moves were added (ad or coins): the level then ends with one star. */
  boosted = false;
  /** +10 moves taken this run by rewarded video (per-level cap) and for coins (price steps). */
  moveAds = 0;
  moveBuys = 0;
  pawsUsed = 0;
  hintsUsed = 0;
  /** True when the run continues a saved one. */
  readonly resumed: boolean;
  private credited: { words: number; cats: number[] };
  private listeners = new Set<(e: SessionEvent) => void>();

  constructor(spec: LevelSpec, saved?: SavedRun | null) {
    this.spec = spec;
    const fresh = deal(spec.def, spec.def.moves);
    if (saved && runFits(saved, spec)) {
      this.state = {
        ...fresh,
        columns: saved.columns.map((c) => ({ down: c.down.slice(), up: c.up.slice() })),
        stock: saved.stock.slice(),
        waste: saved.waste.slice(),
        slots: saved.slots.map((x) => (x ? { cat: x.cat, count: x.count, top: x.top } : null)),
        done: saved.done.slice(),
        movesLeft: saved.movesLeft,
        movesUsed: saved.movesUsed,
        recycles: saved.recycles,
      };
      this.extra = saved.extra;
      this.boosted = saved.boosted;
      this.moveAds = saved.moveAds ?? 0;
      this.moveBuys = saved.moveBuys ?? 0;
      this.credited = saved.credited
        ? { words: saved.credited.words, cats: saved.credited.cats.slice() }
        : { words: shelvedWords(this.state), cats: this.state.done.slice() };
      this.resumed = true;
    } else {
      this.state = fresh;
      this.credited = { words: 0, cats: [] };
      this.resumed = false;
    }
  }

  on(fn: (e: SessionEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: SessionEvent): void {
    for (const fn of [...this.listeners]) fn(e);
  }

  get budget(): number {
    return this.spec.def.moves + this.extra;
  }

  get won(): boolean {
    return isWon(this.state);
  }

  get lost(): boolean {
    return isLost(this.state);
  }

  get canUndo(): boolean {
    return this.history.length > 0 && !this.won;
  }

  stars(): 1 | 2 | 3 {
    return stars(this.state, this.spec.def.moves, this.boosted);
  }

  move(m: Move): MoveResult | null {
    if (this.won || this.state.movesLeft <= 0) return null;
    if (m.type === 'move' && !canMove(this.state, m.src, m.dst)) return null;
    if (m.type === 'draw' && !this.state.stock.length) return null;
    if (m.type === 'recycle' && (this.state.stock.length || this.state.waste.length < 2)) return null;
    const result = apply(this.state, m);
    this.history.push({ state: this.state, paw: false });
    if (this.history.length > 200) this.history.shift();
    this.state = result.state;
    this.emit({ type: 'move', result, move: m });
    this.checkEnd();
    return result;
  }

  /** Tap-to-play: moves the tapped card (or run) to its most useful destination. */
  tap(src: Source): MoveResult | null {
    const dst = autoTarget(this.state, src);
    return dst ? this.move({ type: 'move', src, dst }) : null;
  }

  drop(src: Source, dst: Target): MoveResult | null {
    return this.move({ type: 'move', src, dst });
  }

  /** Draws from the stock, or recycles the waste when the stock is empty. */
  deck(): MoveResult | null {
    if (this.state.stock.length) return this.move({ type: 'draw' });
    return this.move({ type: 'recycle' });
  }

  /** Steps back one move or Paw. Returns what was undone ('paw' so the booster can be refunded), or false. */
  undo(): 'move' | 'paw' | false {
    if (this.won || !this.history.length) return false;
    const prev = this.history.pop()!;
    this.state = { ...prev.state, movesLeft: this.state.movesLeft, movesUsed: this.state.movesUsed };
    if (prev.paw) this.pawsUsed = Math.max(0, this.pawsUsed - 1);
    this.emit({ type: 'undo' });
    return prev.paw ? 'paw' : 'move';
  }

  hint(): Move | null {
    const m = hint(this.state);
    if (m) this.hintsUsed++;
    return m;
  }

  /** Uses Tekir's paw on a shelf (the fullest open one, i.e. fewest words missing, if not given). */
  paw(slot?: number): MoveResult | null {
    const open = this.state.slots.map((s, i) => ({ s, i })).filter((x) => x.s);
    if (!open.length) return null;
    const target = slot ?? open.sort((a, b) => this.remaining(a.i) - this.remaining(b.i))[0].i;
    const result = pawFetch(this.state, target);
    if (!result) return null;
    this.history.push({ state: this.state, paw: true });
    if (this.history.length > 200) this.history.shift();
    this.state = result.state;
    this.pawsUsed++;
    this.emit({ type: 'paw', result, slot: target });
    this.checkEnd();
    return result;
  }

  private remaining(slot: number): number {
    const s = this.state.slots[slot];
    return s ? this.state.sizes[s.cat] - s.count : 0;
  }

  addMoves(n: number, bought = true): void {
    this.state = { ...this.state, movesLeft: this.state.movesLeft + n };
    this.extra += n;
    if (bought) this.boosted = true;
    this.emit({ type: 'moves', added: n });
  }

  /** True when no legal move exists even with moves left (should not happen: recycling is always possible). */
  get stuck(): boolean {
    return !this.won && this.state.movesLeft > 0 && legalMoves(this.state).length === 0;
  }

  private checkEnd(): void {
    if (this.won) this.emit({ type: 'win' });
    else if (this.lost) this.emit({ type: 'lose' });
  }

  /**
   * Shelving progress not yet counted for quests and stats: words above the
   * run's high-water mark and categories finished for the first time. Undo
   * followed by the same move therefore never counts twice.
   */
  creditProgress(): { words: number; cats: number[] } {
    const total = shelvedWords(this.state);
    const words = Math.max(0, total - this.credited.words);
    this.credited.words = Math.max(this.credited.words, total);
    const cats = this.state.done.filter((c) => !this.credited.cats.includes(c));
    this.credited.cats.push(...cats);
    return { words, cats };
  }

  snapshot(): SavedRun {
    const s = this.state;
    return {
      key: this.spec.key, sig: runSig(this.spec), columns: s.columns, stock: s.stock, waste: s.waste, slots: s.slots, done: s.done, movesLeft: s.movesLeft,
      movesUsed: s.movesUsed, recycles: s.recycles, extra: this.extra, boosted: this.boosted, moveAds: this.moveAds, moveBuys: this.moveBuys,
      credited: { words: this.credited.words, cats: this.credited.cats.slice() },
    };
  }
}
