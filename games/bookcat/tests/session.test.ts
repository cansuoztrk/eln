import { describe, expect, it } from 'vitest';
import table from '../src/core/level-tuning.json';
import { deal } from '../src/core/deal';
import { categoryCount, levelDef, useTable } from '../src/core/levels';
import { legalMoves, type State } from '../src/core/rules';
import { hint } from '../src/core/solver';
import { runFits, runSig, Session, type LevelSpec } from '../src/game/session';

useTable(table as never);

function spec(n: number): LevelSpec {
  return { key: `L${n}`, n, daily: false, def: levelDef(n), cats: [] };
}

/** Two open shelves: category 0 (3 words) still empty, category 1 (2 words) one word short. */
function twoShelves(): Session {
  const sp: LevelSpec = { key: 'L0', n: 0, daily: false, def: { sizes: [3, 2], columns: 3, slots: 2, depth: [0, 0, 0], seed: 1, moves: 30, par: 0, kind: 'normal' }, cats: [] };
  const session = new Session(sp);
  // cards: 0 cat0, 1-3 words of 0, 4 cat1, 5-6 words of 1
  const s: State = { ...deal(sp.def, 30), columns: [{ down: [], up: [1, 2] }, { down: [], up: [3] }, { down: [], up: [6] }], stock: [], waste: [] };
  s.slots = [{ cat: 0, count: 0, top: null }, { cat: 1, count: 1, top: 5 }];
  session.state = s;
  return session;
}

describe('session', () => {
  it('sends the paw to the fullest open shelf', () => {
    const session = twoShelves();
    const r = session.paw();
    expect(r?.completed).toEqual([1]);
  });

  it('undo reports a paw so the booster can be refunded', () => {
    const session = twoShelves();
    session.paw();
    expect(session.pawsUsed).toBe(1);
    expect(session.undo()).toBe('paw');
    expect(session.pawsUsed).toBe(0);
    expect(session.state.slots[1]).toMatchObject({ count: 1 });
    session.move({ type: 'move', src: { from: 'col', col: 0, count: 2 }, dst: { to: 'slot', slot: 0 } });
    expect(session.undo()).toBe('move');
    expect(session.undo()).toBe(false);
  });

  it('credits shelving progress once, however often it is undone and replayed', () => {
    const session = twoShelves();
    session.creditProgress(); // the hand-built position already has one word shelved
    const move = { type: 'move', src: { from: 'col', col: 2, count: 1 }, dst: { to: 'slot', slot: 1 } } as const;
    session.move(move);
    expect(session.creditProgress()).toEqual({ words: 1, cats: [1] });
    for (let i = 0; i < 3; i++) {
      session.undo();
      expect(session.creditProgress()).toEqual({ words: 0, cats: [] });
      session.move(move);
      expect(session.creditProgress()).toEqual({ words: 0, cats: [] });
    }
  });
});

describe('saved runs', () => {
  it('resumes its own snapshot, with the move counters', () => {
    const sp = spec(12);
    const a = new Session(sp);
    for (let i = 0; i < 6; i++) a.move(hint(a.state) ?? legalMoves(a.state)[0]);
    a.moveBuys = 2;
    a.moveAds = 1;
    const run = JSON.parse(JSON.stringify(a.snapshot()));
    expect(run.sig).toBe(runSig(sp));
    expect(runFits(run, sp)).toBe(true);
    const b = new Session(sp, run);
    expect(b.resumed).toBe(true);
    expect(b.state.movesUsed).toBe(6);
    expect([b.moveBuys, b.moveAds]).toEqual([2, 1]);
  });

  it('drops a run made for a different layout or with broken card ids', () => {
    const sp = spec(12);
    const a = new Session(sp);
    a.move(hint(a.state) ?? legalMoves(a.state)[0]);
    const run = () => JSON.parse(JSON.stringify(a.snapshot()));
    expect(runFits({ ...run(), sig: 'other' }, sp)).toBe(false);
    // A save from before signatures is checked by its content: valid here...
    expect(runFits({ ...run(), sig: '' }, sp)).toBe(true);
    // ...but not on a retuned level with one more word (a card id is missing).
    const retuned: LevelSpec = { ...sp, def: { ...sp.def, sizes: [...sp.def.sizes.slice(0, -1), sp.def.sizes[sp.def.sizes.length - 1] + 1] } };
    expect(runFits({ ...run(), sig: '' }, retuned)).toBe(false);
    const dup = run();
    dup.stock = [...dup.stock, dup.stock[0] ?? dup.columns[0].up[0]];
    expect(runFits(dup, sp)).toBe(false);
    const extra = run();
    extra.stock = [...extra.stock, 999];
    expect(runFits(extra, sp)).toBe(false);
    expect(new Session(sp, { ...run(), sig: 'other' }).resumed).toBe(false);
  });
});

describe('levels', () => {
  it('knows a level’s category count without calibrating it', () => {
    for (const n of [1, 150, 300, 301, 305, 310]) expect(categoryCount(n), `level ${n}`).toBe(levelDef(n).sizes.length);
  });
});
