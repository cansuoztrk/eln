import { describe, expect, it } from 'vitest';
import { Board, Kind, SIZE } from '../src/core/board';
import { canPlaceAll, dealTray, classicDealOptions } from '../src/core/dealer';
import { SHAPE_BY_ID, SHAPES } from '../src/core/pieces';
import { Rng } from '../src/core/rng';
import { comboMultiplier, ComboTracker, linePoints, scoreMove } from '../src/core/scoring';
import { Session } from '../src/core/session';
import { makeDaily, makeLevel, starsFor } from '../src/core/levels';

describe('pieces', () => {
  it('have unique ids and normalized cells', () => {
    const ids = new Set(SHAPES.map((s) => s.id));
    expect(ids.size).toBe(SHAPES.length);
    for (const s of SHAPES) {
      expect(Math.min(...s.cells.map(([r]) => r))).toBe(0);
      expect(Math.min(...s.cells.map(([, c]) => c))).toBe(0);
      expect(s.cells.length).toBeGreaterThan(0);
    }
  });
});

describe('board', () => {
  it('places pieces and detects collisions / bounds', () => {
    const b = new Board();
    const o2 = SHAPE_BY_ID.o2;
    expect(b.canPlace(o2, 0, 0)).toBe(true);
    b.place(o2, 0, 0, 1);
    expect(b.filledCount()).toBe(4);
    expect(b.canPlace(o2, 1, 1)).toBe(false);
    expect(b.canPlace(o2, 7, 7)).toBe(false);
    expect(b.canPlace(o2, 6, 6)).toBe(true);
  });

  it('clears full rows and columns together', () => {
    const b = new Board();
    for (let c = 0; c < SIZE; c++) b.set(Board.idx(2, c), 0);
    for (let r = 0; r < SIZE; r++) b.set(Board.idx(r, 5), 3);
    const { rows, cols } = b.fullLines();
    expect(rows).toEqual([2]);
    expect(cols).toEqual([5]);
    const res = b.clearLines(rows, cols);
    expect(res.removed.length).toBe(15);
    expect(b.isEmpty()).toBe(true);
  });

  it('detects pure flavor lines', () => {
    const b = new Board();
    for (let c = 0; c < SIZE; c++) b.set(Board.idx(0, c), 4);
    const res = b.clearLines([0], []);
    expect(res.pureLines).toBe(1);
  });

  it('crates survive a hit when hp > 1', () => {
    const b = new Board();
    for (let c = 0; c < SIZE; c++) b.set(Board.idx(0, c), 1);
    b.set(Board.idx(0, 3), 2, Kind.Crate, 2);
    const res = b.clearLines([0], []);
    expect(res.cratesHit).toEqual([3]);
    expect(b.isFilled(3)).toBe(true);
    expect(b.hp[3]).toBe(1);
    const res2 = b.clearLines([0], []);
    expect(res2.cratesBroken).toBe(1);
  });

  it('previews lines that a placement would complete', () => {
    const b = new Board();
    for (let c = 0; c < 6; c++) b.set(Board.idx(7, c), 0);
    const p = b.previewLines(SHAPE_BY_ID.i2h, 7, 6);
    expect(p.rows).toEqual([7]);
    expect(p.cols).toEqual([]);
  });
});

describe('scoring', () => {
  it('rewards multi-line clears progressively', () => {
    expect(linePoints(1)).toBe(80);
    expect(linePoints(2)).toBe(240);
    expect(linePoints(3)).toBe(480);
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(3)).toBe(2);
    expect(comboMultiplier(99)).toBe(5);
  });

  it('combo survives up to two dry moves', () => {
    const t = new ComboTracker();
    expect(t.register(true)).toBe(1);
    expect(t.register(false)).toBe(1);
    expect(t.register(false)).toBe(1);
    expect(t.register(true)).toBe(2);
    t.register(false);
    t.register(false);
    expect(t.register(false)).toBe(0);
    expect(t.register(true)).toBe(1);
  });

  it('scores a move', () => {
    const s = scoreMove({ cellsPlaced: 4, lines: 2, pureLines: 0, combo: 2, boardCleared: false });
    expect(s.total).toBe(4 + 360);
  });
});

describe('dealer', () => {
  it('always deals 3 pieces and something fits on an empty board', () => {
    const rng = new Rng(42);
    const b = new Board();
    for (let i = 0; i < 50; i++) {
      const tray = dealTray(b, rng, classicDealOptions(i * 500, [0, 1, 2, 3, 4, 5, 6]));
      expect(tray.length).toBe(3);
      expect(canPlaceAll(b, tray.map((p) => p.shape))).toBe(true);
    }
  });
});

describe('session', () => {
  it('undo restores the exact previous state', () => {
    const s = new Session('classic', null, 7);
    const before = s.board.serialize();
    const piece = s.tray[0]!;
    const [r, c] = s.board.fitPositions(piece.shape)[0];
    s.place(0, r, c);
    expect(s.score).toBeGreaterThan(0);
    s.undo();
    expect(s.board.serialize()).toEqual(before);
    expect(s.score).toBe(0);
    expect(s.tray[0]).toBe(piece);
  });

  it('revive frees space and deals fitting pieces', () => {
    const s = new Session('classic', null, 3);
    for (let i = 0; i < SIZE * SIZE; i++) if ((i + Math.floor(i / SIZE)) % 3 !== 0) s.board.set(i, 1);
    s.revive();
    expect(s.board.filledCount()).toBeLessThan(43);
    expect(s.stuck()).toBe(false);
  });
});

describe('levels', () => {
  it('are deterministic', () => {
    expect(makeLevel(25).board.serialize()).toEqual(makeLevel(25).board.serialize());
    expect(makeDaily('2026-10-15').goals).toEqual(makeDaily('2026-10-15').goals);
  });

  it('never start with a full line and always have goals', () => {
    for (let id = 1; id <= 300; id++) {
      const l = makeLevel(id);
      const { rows, cols } = l.board.fullLines();
      expect(rows.length + cols.length).toBe(0);
      expect(l.goals.length).toBeGreaterThan(0);
      for (const g of l.goals) expect(g.count).toBeGreaterThan(0);
      expect(l.moves).toBeGreaterThanOrEqual(10);
    }
  });

  it('stars scale with moves left', () => {
    expect(starsFor(10, 20)).toBe(3);
    expect(starsFor(3, 20)).toBe(2);
    expect(starsFor(0, 20)).toBe(1);
  });
});

describe('classic save', () => {
  it('round-trips an in-progress game', () => {
    const s = new Session('classic', null, 11);
    for (let k = 0; k < 4; k++) {
      const slot = s.tray.findIndex((p) => p && s.board.anyFit(p.shape));
      const [r, c] = s.board.fitPositions(s.tray[slot]!.shape)[0];
      s.place(slot, r, c);
    }
    const save = JSON.parse(JSON.stringify(s.serialize()));
    const r = Session.restore(save);
    expect(r.board.serialize()).toEqual(s.board.serialize());
    expect(r.score).toBe(s.score);
    expect(r.tray.map((p) => p?.shape.id)).toEqual(s.tray.map((p) => p?.shape.id));
  });
});

describe('i18n tables', async () => {
  const en = (await import('../src/i18n/en')).default;
  const tables = {
    tr: (await import('../src/i18n/tr')).default,
    de: (await import('../src/i18n/de')).default,
    es: (await import('../src/i18n/es')).default,
    fr: (await import('../src/i18n/fr')).default,
    pt: (await import('../src/i18n/pt')).default,
  } as Record<string, Record<string, string>>;
  it('every language covers every key and keeps placeholders', () => {
    for (const [lang, table] of Object.entries(tables)) {
      for (const [key, value] of Object.entries(en)) {
        if (key === 'app.title' || key === 'goal.flavor') continue;
        expect(table[key], `${lang}:${key}`).toBeTypeOf('string');
        const ph = (value.match(/\{\w+\}/g) ?? []).sort();
        const got = (table[key].match(/\{\w+\}/g) ?? []).sort();
        expect(got, `${lang}:${key} placeholders`).toEqual(ph);
      }
    }
  });
});

describe('bazaar pass', async () => {
  const pass = await import('../src/meta/pass');
  const { store } = await import('../src/meta/state');
  it('aligns seasons to the epoch and resets on a new season', () => {
    const t0 = pass.PASS_EPOCH + 5 * 86_400_000;
    expect(pass.seasonIndex(t0)).toBe(0);
    expect(pass.seasonEndsAt(t0)).toBe(pass.PASS_EPOCH + 28 * 86_400_000);
    expect(pass.seasonIndex(pass.PASS_EPOCH + 28 * 86_400_000)).toBe(1);
    store.data.pass = { season: 0, points: 900, premium: true, claimedFree: [1], claimedPremium: [] };
    pass.ensureSeason(pass.PASS_EPOCH + 30 * 86_400_000);
    expect(store.data.pass.season).toBe(1);
    expect(store.data.pass.points).toBe(0);
    expect(store.data.pass.premium).toBe(false);
  });
  it('unlocks tiers by points and gates premium claims', () => {
    pass.ensureSeason();
    store.data.pass.points = 0;
    store.data.pass.premium = false;
    store.data.pass.claimedFree = [];
    store.data.pass.claimedPremium = [];
    pass.addPassPoints(250);
    expect(pass.unlockedTiers()).toBe(2);
    expect(pass.canClaim('free', 2)).toBe(true);
    expect(pass.canClaim('free', 3)).toBe(false);
    expect(pass.canClaim('premium', 1)).toBe(false);
    const coins = store.data.coins;
    expect(pass.claimTier('free', 1)).not.toBeNull();
    expect(store.data.coins).toBeGreaterThan(coins);
    expect(pass.claimTier('free', 1)).toBeNull();
    pass.unlockPremium();
    expect(pass.canClaim('premium', 2)).toBe(true);
    const all = pass.claimAll();
    expect(all).not.toBeNull();
    expect(pass.claimableCount()).toBe(0);
  });
  it('caps points at the last tier and classic points per game', () => {
    pass.addPassPoints(99999);
    expect(pass.passPoints()).toBe(pass.TIERS * pass.POINTS_PER_TIER);
    expect(pass.classicPassPoints(100000)).toBe(pass.PASS_POINTS.classicCap);
    expect(pass.classicPassPoints(1000)).toBe(5);
  });
});
