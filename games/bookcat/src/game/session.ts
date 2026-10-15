import { CATEGORIES, compatible, levelCategories, materialize, maxTier, type Lang, type PickedCategory } from '../content';
import { deal } from '../core/deal';
import { levelDef, type LevelDef } from '../core/levels';
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
  private history: State[] = [];
  /** Moves bought or earned during this run. */
  extra = 0;
  /** True once extra moves were added (ad or coins): the level then ends with one star. */
  boosted = false;
  pawsUsed = 0;
  hintsUsed = 0;
  private listeners = new Set<(e: SessionEvent) => void>();

  constructor(spec: LevelSpec, saved?: SavedRun | null) {
    this.spec = spec;
    const fresh = deal(spec.def, spec.def.moves);
    if (saved && saved.key === spec.key) {
      this.state = { ...fresh, columns: saved.columns, stock: saved.stock, waste: saved.waste, slots: saved.slots, done: saved.done, movesLeft: saved.movesLeft, movesUsed: saved.movesUsed, recycles: saved.recycles };
      this.extra = saved.extra;
      this.boosted = saved.boosted;
    } else {
      this.state = fresh;
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
    this.history.push(this.state);
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

  undo(): boolean {
    const prev = this.history.pop();
    if (!prev || this.won) return false;
    this.state = { ...prev, movesLeft: this.state.movesLeft, movesUsed: this.state.movesUsed };
    this.emit({ type: 'undo' });
    return true;
  }

  hint(): Move | null {
    const m = hint(this.state);
    if (m) this.hintsUsed++;
    return m;
  }

  /** Uses Tekir's paw on a shelf (the fullest open one if not given). */
  paw(slot?: number): MoveResult | null {
    const open = this.state.slots.map((s, i) => ({ s, i })).filter((x) => x.s);
    if (!open.length) return null;
    const target = slot ?? open.sort((a, b) => this.remaining(b.i) - this.remaining(a.i))[0].i;
    const result = pawFetch(this.state, target);
    if (!result) return null;
    this.history.push(this.state);
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

  snapshot(): SavedRun {
    const s = this.state;
    return {
      key: this.spec.key, columns: s.columns, stock: s.stock, waste: s.waste, slots: s.slots, done: s.done, movesLeft: s.movesLeft,
      movesUsed: s.movesUsed, recycles: s.recycles, extra: this.extra, boosted: this.boosted,
    };
  }
}
