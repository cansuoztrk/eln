import { apply, DEFAULT_RULES, isWon, legalMoves, stateKey, type Move, type Rules, type State } from './rules';

/**
 * Omniscient solver (it knows the face-down cards) used offline to prove that
 * every level is solvable within its move budget and to measure difficulty,
 * and in-game for the hint booster.
 *
 * Weighted A*: f = g + w·h with an admissible-ish heuristic (every unfinished
 * category needs at least one move to open and one to shelve its words, and
 * every buried card needs uncovering). Node expansion is capped; the best
 * solution found is returned, which is an upper bound on the optimum — so a
 * budget built from it is always achievable.
 */

export interface SolveResult {
  solved: boolean;
  moves: Move[];
  expanded: number;
}

export function heuristic(s: State): number {
  let h = 0;
  const open = new Set(s.slots.filter(Boolean).map((x) => x!.cat));
  for (let cat = 0; cat < s.sizes.length; cat++) {
    if (s.done.includes(cat)) continue;
    if (!open.has(cat)) h += 1;
    h += 1;
  }
  // Stock cards must at least be drawn once.
  h += Math.ceil(s.stock.length / 2);
  return h;
}

/** Orders moves so that greedy progress (shelving, opening) is tried first. */
function moveRank(s: State, m: Move): number {
  if (m.type === 'draw') return 3;
  if (m.type === 'recycle') return 6;
  if (m.dst.to === 'slot') return s.slots[m.dst.slot] ? 0 : 1;
  const col = s.columns[m.dst.col];
  return col.up.length || col.down.length ? 2 : 5;
}

class Heap<T> {
  private a: { k: number; v: T }[] = [];
  get size(): number {
    return this.a.length;
  }
  push(k: number, v: T): void {
    const a = this.a;
    a.push({ k, v });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].k <= a[i].k) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): T | undefined {
    const a = this.a;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].k < a[m].k) m = l;
        if (r < a.length && a[r].k < a[m].k) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top.v;
  }
}

interface Node {
  state: State;
  g: number;
  parent: Node | null;
  move: Move | null;
}

export function solve(start: State, opts: { maxNodes?: number; weight?: number; rules?: Rules } = {}): SolveResult {
  const { maxNodes = 60_000, weight = 3, rules = DEFAULT_RULES } = opts;
  const root: State = { ...start, movesLeft: Number.MAX_SAFE_INTEGER, movesUsed: 0 };
  const best = new Map<string, number>();
  const heap = new Heap<Node>();
  heap.push(weight * heuristic(root), { state: root, g: 0, parent: null, move: null });
  best.set(stateKey(root), 0);
  let expanded = 0;
  while (heap.size && expanded < maxNodes) {
    const node = heap.pop()!;
    if (isWon(node.state)) return { solved: true, moves: path(node), expanded };
    const key = stateKey(node.state);
    if ((best.get(key) ?? Infinity) < node.g) continue;
    expanded++;
    const moves = legalMoves(node.state, rules).sort((a, b) => moveRank(node.state, a) - moveRank(node.state, b));
    for (const m of moves) {
      const next = apply(node.state, m, rules).state;
      const g = node.g + 1;
      const k = stateKey(next);
      if ((best.get(k) ?? Infinity) <= g) continue;
      best.set(k, g);
      heap.push(g + weight * heuristic(next) + moveRank(node.state, m) * 0.01, { state: next, g, parent: node, move: m });
    }
  }
  return { solved: false, moves: [], expanded };
}

function path(node: Node): Move[] {
  const out: Move[] = [];
  for (let n: Node | null = node; n && n.move; n = n.parent) out.push(n.move);
  return out.reverse();
}

/**
 * Next move of a winning line from the current position (hint booster):
 * planner playouts first (fast on any size), exact search for small boards.
 */
export function hint(state: State, rules: Rules = DEFAULT_RULES): Move | null {
  const budget = Math.max(1, state.movesLeft);
  const p = bestPlayout(state, 12, rules, budget);
  if (p) return p.moves[0] ?? null;
  if (state.cards.length <= 26) {
    const r = solve(state, { maxNodes: 20_000, rules });
    if (r.solved && r.moves.length <= budget) return r.moves[0] ?? null;
  }
  const any = playout(state, 1, rules, budget);
  return any.moves[0] ?? null;
}

/**
 * Planner bot: a greedy player with one-ply evaluation, loop avoidance and a
 * little noise. It is fast (linear in moves), so it calibrates big levels
 * where exhaustive search is too slow. A winning playout is a constructive
 * proof that the level is solvable within that many moves.
 */
function scoreMove(s: State, m: Move, next: State, revealed: number, completed: number): number {
  if (m.type === 'draw') return 1;
  if (m.type === 'recycle') return 4;
  let score = 0;
  const moved = m.src.from === 'waste' ? 1 : m.src.count;
  if (m.dst.to === 'slot') {
    score = s.slots[m.dst.slot] ? -10 - moved : -6;
  } else {
    const col = s.columns[m.dst.col];
    const empty = !col.up.length && !col.down.length;
    const source = m.src.from === 'col' ? s.columns[m.src.col] : null;
    const emptiesSource = !!source && source.up.length === moved && !source.down.length;
    if (empty) score = s.slots.some((x) => !x) && s.cards[(m.src.from === 'waste' ? s.waste[s.waste.length - 1] : source!.up[source!.up.length - moved])].kind === 'cat' ? 6 : 3;
    else score = m.src.from === 'waste' ? -2 : 2;
    if (emptiesSource && !empty) score -= 2;
  }
  return score - revealed * 4 - completed * 15 + (next.done.length > s.done.length ? -5 : 0);
}

export interface Playout {
  won: boolean;
  moves: Move[];
}

export function playout(start: State, seed = 1, rules: Rules = DEFAULT_RULES, limit = 400): Playout {
  let s: State = { ...start, movesLeft: limit, movesUsed: 0 };
  let rnd = (seed * 2654435761) >>> 0 || 1;
  const rand = () => {
    rnd ^= rnd << 13;
    rnd ^= rnd >>> 17;
    rnd ^= rnd << 5;
    return (rnd >>> 0) / 4294967296;
  };
  const seen = new Map<string, number>();
  const line: Move[] = [];
  while (!isWon(s) && s.movesLeft > 0) {
    const moves = legalMoves(s, rules);
    if (!moves.length) break;
    let best: { m: Move; next: State; score: number } | null = null;
    for (const m of moves) {
      const r = apply(s, m, rules);
      const loops = seen.get(stateKey(r.state)) ?? 0;
      const score = scoreMove(s, m, r.state, r.revealed.length, r.completed.length) + loops * 6 + rand() * 2;
      if (!best || score < best.score) best = { m, next: r.state, score };
    }
    s = best!.next;
    line.push(best!.m);
    const k = stateKey(s);
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  return { won: isWon(s), moves: line };
}

export function greedyPlay(start: State, seed = 1, rules: Rules = DEFAULT_RULES, limit = 400): { won: boolean; moves: number } {
  const p = playout(start, seed, rules, limit);
  return { won: p.won, moves: p.moves.length };
}

/** Shortest winning playout over several seeds (null if none wins). */
export function bestPlayout(start: State, runs = 16, rules: Rules = DEFAULT_RULES, limit = 400): Playout | null {
  let best: Playout | null = null;
  for (let i = 1; i <= runs; i++) {
    const p = playout(start, i, rules, limit);
    if (p.won && (!best || p.moves.length < best.moves.length)) best = p;
  }
  return best;
}
