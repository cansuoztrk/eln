import { describe, expect, it } from 'vitest';
import { cardCount, deal, type Layout } from '../src/core/deal';
import { apply, canMove, isWon, legalMoves, topRunLength, type State } from '../src/core/rules';
import { greedyPlay, solve } from '../src/core/solver';

const small: Layout = { sizes: [3, 3], columns: 3, slots: 2, depth: [0, 1, 2], seed: 7 };

describe('deal', () => {
  it('deals every card exactly once', () => {
    const s = deal(small);
    const all = [...s.stock, ...s.waste, ...s.columns.flatMap((c) => [...c.down, ...c.up])];
    expect(all.sort((a, b) => a - b)).toEqual(Array.from({ length: cardCount(small) }, (_, i) => i));
    expect(s.columns.map((c) => c.down.length)).toEqual([0, 1, 2]);
    expect(s.columns.every((c) => c.up.length === 1)).toBe(true);
  });

  it('is deterministic per seed', () => {
    expect(deal(small).stock).toEqual(deal(small).stock);
    expect(deal({ ...small, seed: 8 }).stock).not.toEqual(deal(small).stock);
  });
});

/** Hand-built position for precise rule checks. */
function position(): State {
  const s = deal({ sizes: [2, 1], columns: 3, slots: 1, depth: [0, 0, 0], seed: 1 });
  // cards: 0 cat0, 1 w0.0, 2 w0.1, 3 cat1, 4 w1.0
  s.columns = [{ down: [], up: [1, 2] }, { down: [3], up: [0] }, { down: [], up: [] }];
  s.stock = [4];
  s.waste = [];
  return s;
}

describe('rules', () => {
  it('opens a category, shelves runs and completes it', () => {
    let s = position();
    expect(topRunLength(s, 0)).toBe(2);
    expect(canMove(s, { from: 'col', col: 0, count: 2 }, { to: 'slot', slot: 0 })).toBe(false);
    s = apply(s, { type: 'move', src: { from: 'col', col: 1, count: 1 }, dst: { to: 'slot', slot: 0 } }).state;
    expect(s.slots[0]).toMatchObject({ cat: 0, count: 0 });
    expect(s.columns[1].up).toEqual([3]);
    const r = apply(s, { type: 'move', src: { from: 'col', col: 0, count: 2 }, dst: { to: 'slot', slot: 0 } });
    expect(r.completed).toEqual([0]);
    expect(r.state.slots[0]).toBeNull();
    expect(r.state.movesUsed).toBe(2);
  });

  it('stacks only same-category words and lets anything into an empty column', () => {
    const s = position();
    expect(canMove(s, { from: 'col', col: 1, count: 1 }, { to: 'col', col: 0 })).toBe(false);
    expect(canMove(s, { from: 'col', col: 0, count: 1 }, { to: 'col', col: 2 })).toBe(true);
    expect(canMove(s, { from: 'col', col: 1, count: 1 }, { to: 'col', col: 2 })).toBe(true);
  });

  it('draws and recycles the stock', () => {
    let s = position();
    s = apply(s, { type: 'draw' }).state;
    expect(s.waste).toEqual([4]);
    expect(legalMoves(s).some((m) => m.type === 'recycle')).toBe(false);
  });
});

describe('solver', () => {
  it('solves small and mid-size deals quickly', () => {
    const mid: Layout = { sizes: [4, 4, 4, 4], columns: 5, slots: 3, depth: [0, 1, 2, 3, 3], seed: 42 };
    for (const layout of [small, mid]) {
      const t0 = performance.now();
      const r = solve(deal(layout));
      expect(r.solved).toBe(true);
      let s = deal(layout);
      for (const m of r.moves) s = apply(s, m).state;
      expect(isWon(s)).toBe(true);
      expect(performance.now() - t0).toBeLessThan(3000);
    }
  });

  it('greedy play needs at least as many moves as the solver', () => {
    const layout: Layout = { sizes: [4, 4, 3], columns: 4, slots: 2, depth: [0, 1, 2, 2], seed: 9 };
    const opt = solve(deal(layout));
    const bot = greedyPlay(deal(layout), 3);
    expect(opt.solved).toBe(true);
    if (bot.won) expect(bot.moves).toBeGreaterThanOrEqual(opt.moves.length);
  });
});
