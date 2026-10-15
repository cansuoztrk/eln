/**
 * Word-association solitaire rules engine (pure, deterministic, serialisable).
 *
 * Board
 *  - slots:   category bases ("shelves"). A category card placed on an empty
 *             slot opens that category; matching word cards are then shelved
 *             on it. When every word of the category is shelved the slot
 *             clears and the category counts as complete.
 *  - columns: tableau piles; face-down cards below a face-up run. Only the
 *             top run is playable. Cards stack on a column only onto a card
 *             of the SAME category (word on word); any card or run may move to
 *             an empty column.
 *  - stock / waste: drawing turns the next stock card face up onto the waste;
 *             when the stock is empty the waste can be recycled.
 *
 * Moves (each costs one move from the level's budget, so grouping pays off):
 *  draw, recycle, and moving a run (1..n cards) to a slot or column.
 * Uncovering a face-down card is automatic and free. Undo is a true undo.
 */

export type CardKind = 'cat' | 'word';

export interface Card {
  id: number;
  kind: CardKind;
  /** Category index within the level. */
  cat: number;
  /** Word index inside the category (words only). */
  word: number;
}

export interface Column {
  down: number[];
  up: number[];
}

export interface Slot {
  cat: number;
  /** Word cards shelved so far. */
  count: number;
  /** Top word card id (for display / joker logic). */
  top: number | null;
}

export interface State {
  cards: Card[];
  /** Words per category (target counts). */
  sizes: number[];
  columns: Column[];
  stock: number[];
  waste: number[];
  slots: (Slot | null)[];
  done: number[];
  movesLeft: number;
  movesUsed: number;
  recycles: number;
}

export type Source = { from: 'waste' } | { from: 'col'; col: number; count: number };
export type Target = { to: 'slot'; slot: number } | { to: 'col'; col: number };

export type Move =
  | { type: 'draw' }
  | { type: 'recycle' }
  | { type: 'move'; src: Source; dst: Target };

export interface Rules {
  /** Free recycles before each recycle costs a move as usual. Infinity = unlimited recycling. */
  maxRecycles: number;
  /** Allow moving a category card onto an empty column. */
  catToEmptyColumn: boolean;
}

export const DEFAULT_RULES: Rules = { maxRecycles: Infinity, catToEmptyColumn: true };

// ───────────── helpers ─────────────

export function topRunLength(state: State, col: number): number {
  const up = state.columns[col].up;
  if (!up.length) return 0;
  const last = state.cards[up[up.length - 1]];
  if (last.kind === 'cat') return 1;
  let n = 1;
  for (let i = up.length - 2; i >= 0; i--) {
    const c = state.cards[up[i]];
    if (c.kind !== 'word' || c.cat !== last.cat) break;
    n++;
  }
  return n;
}

function sourceCards(state: State, src: Source): number[] {
  if (src.from === 'waste') return state.waste.length ? [state.waste[state.waste.length - 1]] : [];
  const up = state.columns[src.col].up;
  return up.slice(up.length - src.count);
}

export function isWon(state: State): boolean {
  return state.done.length === state.sizes.length;
}

export function isLost(state: State): boolean {
  return !isWon(state) && state.movesLeft <= 0;
}

export function remainingCards(state: State): number {
  let n = state.stock.length + state.waste.length;
  for (const c of state.columns) n += c.down.length + c.up.length;
  return n;
}

// ───────────── legality ─────────────

export function canMove(state: State, src: Source, dst: Target, rules: Rules = DEFAULT_RULES): boolean {
  const ids = sourceCards(state, src);
  if (!ids.length) return false;
  if (src.from === 'col') {
    if (src.count < 1 || src.count > topRunLength(state, src.col)) return false;
    if (dst.to === 'col' && dst.col === src.col) return false;
  }
  const head = state.cards[ids[0]];
  if (dst.to === 'slot') {
    if (dst.slot < 0 || dst.slot >= state.slots.length) return false;
    const slot = state.slots[dst.slot];
    if (!slot) return head.kind === 'cat' && ids.length === 1;
    return head.kind === 'word' && head.cat === slot.cat;
  }
  const col = state.columns[dst.col];
  if (!col) return false;
  if (!col.up.length && !col.down.length) {
    if (head.kind === 'cat') return rules.catToEmptyColumn && ids.length === 1;
    // Moving a whole column's only run onto another empty column is pointless.
    if (src.from === 'col' && src.count === state.columns[src.col].up.length && !state.columns[src.col].down.length) return false;
    return true;
  }
  const top = state.cards[col.up[col.up.length - 1]];
  return head.kind === 'word' && top.kind === 'word' && top.cat === head.cat;
}

export function legalMoves(state: State, rules: Rules = DEFAULT_RULES): Move[] {
  if (isWon(state) || state.movesLeft <= 0) return [];
  const out: Move[] = [];
  if (state.stock.length) out.push({ type: 'draw' });
  else if (state.waste.length > 1 && state.recycles < rules.maxRecycles) out.push({ type: 'recycle' });
  const sources: Source[] = [];
  if (state.waste.length) sources.push({ from: 'waste' });
  state.columns.forEach((_, col) => {
    const run = topRunLength(state, col);
    for (let count = run; count >= 1; count--) sources.push({ from: 'col', col, count });
  });
  for (const src of sources) {
    for (let slot = 0; slot < state.slots.length; slot++) {
      const dst: Target = { to: 'slot', slot };
      if (canMove(state, src, dst, rules)) out.push({ type: 'move', src, dst });
    }
    for (let col = 0; col < state.columns.length; col++) {
      const dst: Target = { to: 'col', col };
      if (canMove(state, src, dst, rules)) out.push({ type: 'move', src, dst });
    }
  }
  return out;
}

// ───────────── applying moves ─────────────

export function clone(state: State): State {
  return {
    cards: state.cards,
    sizes: state.sizes,
    columns: state.columns.map((c) => ({ down: c.down.slice(), up: c.up.slice() })),
    stock: state.stock.slice(),
    waste: state.waste.slice(),
    slots: state.slots.map((s) => (s ? { ...s } : null)),
    done: state.done.slice(),
    movesLeft: state.movesLeft,
    movesUsed: state.movesUsed,
    recycles: state.recycles,
  };
}

export interface MoveResult {
  state: State;
  /** Categories completed by this move. */
  completed: number[];
  /** Columns whose face-down card was revealed. */
  revealed: number[];
}

/** Applies a legal move and returns a NEW state (the input is not mutated). */
export function apply(state: State, move: Move, rules: Rules = DEFAULT_RULES): MoveResult {
  const s = clone(state);
  const completed: number[] = [];
  const revealed: number[] = [];
  s.movesLeft--;
  s.movesUsed++;
  if (move.type === 'draw') {
    const id = s.stock.pop();
    if (id !== undefined) s.waste.push(id);
    return { state: s, completed, revealed };
  }
  if (move.type === 'recycle') {
    s.stock = s.waste.reverse();
    s.waste = [];
    s.recycles++;
    return { state: s, completed, revealed };
  }
  if (!canMove(state, move.src, move.dst, rules)) throw new Error('illegal move');
  let ids: number[];
  if (move.src.from === 'waste') ids = [s.waste.pop()!];
  else {
    const col = s.columns[move.src.col];
    ids = col.up.splice(col.up.length - move.src.count, move.src.count);
    if (!col.up.length && col.down.length) {
      col.up.push(col.down.pop()!);
      revealed.push(move.src.col);
    }
  }
  if (move.dst.to === 'col') {
    s.columns[move.dst.col].up.push(...ids);
  } else {
    const i = move.dst.slot;
    const head = s.cards[ids[0]];
    if (!s.slots[i]) {
      s.slots[i] = { cat: head.cat, count: 0, top: null };
    } else {
      const slot = s.slots[i]!;
      slot.count += ids.length;
      slot.top = ids[ids.length - 1];
      if (slot.count >= s.sizes[slot.cat]) {
        s.done.push(slot.cat);
        completed.push(slot.cat);
        s.slots[i] = null;
      }
    }
  }
  return { state: s, completed, revealed };
}

/** Stable key for search memoisation (ignores move counters). */
export function stateKey(s: State): string {
  const cols = s.columns.map((c) => `${c.down.join(',')}:${c.up.join(',')}`).sort().join('|');
  const slots = s.slots.map((x) => (x ? `${x.cat}.${x.count}` : '_')).sort().join(',');
  return `${cols}#${s.stock.join(',')}#${s.waste.join(',')}#${slots}#${s.done.length}`;
}
