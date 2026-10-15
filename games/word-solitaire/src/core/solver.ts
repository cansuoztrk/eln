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

/** Next move of a solution from the current position (hint booster). */
export function hint(state: State, rules: Rules = DEFAULT_RULES): Move | null {
  const r = solve(state, { maxNodes: 25_000, rules });
  return r.solved ? r.moves[0] ?? null : null;
}

/**
 * A "casual human" bot: always takes the first move by a simple preference
 * order with a little lookahead noise. Its move count estimates how many moves
 * a reasonable player needs, which sets the budget above the solver's optimum.
 */
export function greedyPlay(start: State, seed = 1, rules: Rules = DEFAULT_RULES, limit = 400): { won: boolean; moves: number } {
  let s: State = { ...start, movesLeft: limit, movesUsed: 0 };
  let rnd = seed >>> 0 || 1;
  const rand = () => {
    rnd ^= rnd << 13;
    rnd ^= rnd >>> 17;
    rnd ^= rnd << 5;
    return (rnd >>> 0) / 4294967296;
  };
  const seen = new Map<string, number>();
  while (!isWon(s) && s.movesLeft > 0) {
    const moves = legalMoves(s, rules);
    if (!moves.length) break;
    const scored = moves.map((m) => {
      const next = apply(s, m, rules).state;
      const loops = seen.get(stateKey(next)) ?? 0;
      return { m, score: moveRank(s, m) + loops * 4 + rand() * 1.5 };
    });
    scored.sort((a, b) => a.score - b.score);
    s = apply(s, scored[0].m, rules).state;
    const k = stateKey(s);
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  return { won: isWon(s), moves: s.movesUsed };
}
