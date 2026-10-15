import { describe, expect, it } from 'vitest';
import * as E from '../src/core/economy';
import { DISTRICTS, districtDef, tourOf } from '../src/core/districts';

const mods = (over: Partial<E.Modifiers> = {}): E.Modifiers => ({ lale: 0, districts: 0, permanent: 1, temp: 1, ...over });

describe('costs', () => {
  it('costFor is the geometric sum of single purchases', () => {
    for (const i of [0, 1, 5, 9]) {
      let loop = 0;
      for (let k = 0; k < 37; k++) loop += E.BUSINESSES[i].cost * E.BUSINESSES[i].growth ** (12 + k);
      expect(E.costFor(i, 12, 37) / loop).toBeCloseTo(1, 9);
    }
  });

  it('maxAffordable is exact at the boundary', () => {
    for (const i of [0, 3, 9]) {
      for (const cash of [E.BUSINESSES[i].cost * 0.5, E.BUSINESSES[i].cost * 7.3, 1e15, 1e40]) {
        const n = E.maxAffordable(i, 20, cash);
        if (n > 0) expect(E.costFor(i, 20, n)).toBeLessThanOrEqual(cash);
        expect(E.costFor(i, 20, n + 1)).toBeGreaterThan(cash);
      }
    }
  });

  it('buy spends cash, refuses what is unaffordable or not open in this district', () => {
    const r = E.newRun(0);
    r.cash = 100;
    expect(E.buy(r, 0, 1)).toBe(true);
    expect(r.levels[0]).toBe(2);
    expect(r.cash).toBeCloseTo(100 - 4 * 1.07, 9);
    expect(E.buy(r, 1, 1)).toBe(true);
    expect(E.buy(r, 1, 100)).toBe(false);
    r.cash = 1e30;
    expect(E.buy(r, 6, 1)).toBe(false); // Midyeci opens in Kadıköy
    expect(E.buy(E.newRun(1), 6, 0)).toBe(false);
  });
});

describe('milestones and festivals', () => {
  it('speed doubles at 25, 50, 100, 200, 300, 400', () => {
    expect(E.speedMultiplier(24)).toBe(1);
    expect(E.speedMultiplier(25)).toBe(2);
    expect(E.speedMultiplier(99)).toBe(4);
    expect(E.speedMultiplier(400)).toBe(64);
    expect(E.speedMultiplier(5000)).toBe(64);
  });

  it('profit doubles every 100 levels from 500', () => {
    expect(E.profitMilestones(499)).toBe(0);
    expect(E.profitMilestones(500)).toBe(1);
    expect(E.profitMilestones(599)).toBe(1);
    expect(E.profitMilestones(600)).toBe(2);
  });

  it('next/prev milestone walk the whole ladder', () => {
    let lvl = 1;
    const seen: number[] = [];
    while (lvl < 900) {
      const n = E.nextMilestone(lvl);
      expect(n).toBeGreaterThan(lvl);
      expect(E.prevMilestone(n)).toBe(n);
      seen.push(n);
      lvl = n;
    }
    expect(seen.slice(0, 8)).toEqual([25, 50, 100, 200, 300, 400, 500, 600]);
    expect(E.prevMilestone(10)).toBe(0);
  });

  it('festivals only count the stands open in the district', () => {
    const levels = [30, 30, 30, 30, 30, 30, 0, 0, 0, 0];
    expect(E.festivalsReached(levels, 6)).toBe(1);
    expect(E.festivalsReached(levels, 7)).toBe(0);
    expect(E.nextFestival(levels, 6)).toBe(50);
  });
});

describe('income', () => {
  it('a manual stand runs one cycle per tap', () => {
    const r = E.newRun();
    expect(E.step(r, mods(), 5).earned).toBe(0);
    expect(E.tap(r, 0)).toBe(true);
    expect(E.tap(r, 0)).toBe(false);
    const res = E.step(r, mods(), 5);
    expect(res.earned).toBe(1);
    expect(res.completed).toEqual([0]);
    expect(r.running[0]).toBe(false);
  });

  it('a managed stand loops, summing many cycles in one step', () => {
    const r = E.newRun();
    r.levels[0] = 30; // speed ×2 → 0.5 s cycles
    r.managers[0] = true;
    const res = E.step(r, mods(), 10.25);
    expect(res.earned).toBeCloseTo(30 * 20, 6); // no festival: the other stands are closed
    expect(r.progress[0]).toBeCloseTo(0.5, 9);
  });

  it('global multipliers stack: tulips, badges, permanent, temporary', () => {
    expect(E.globalMultiplier(mods({ lale: 50 }))).toBeCloseTo(2, 9);
    expect(E.globalMultiplier(mods({ districts: 3 }))).toBe(E.TUNING.districtMult ** 3);
    expect(E.globalMultiplier(mods({ lale: 50, permanent: 6, temp: 2 }))).toBeCloseTo(24, 9);
  });

  it('recipes multiply their stand, festival recipes everything', () => {
    const r = E.newRun();
    r.levels = [10, 10, 0, 0, 0, 0, 0, 0, 0, 0];
    const before = E.businessMultipliers(r);
    r.upgrades.push('u0_0', 'u0_all');
    const after = E.businessMultipliers(r);
    expect(after[0] / before[0]).toBe(9);
    expect(after[1] / before[1]).toBe(3);
  });

  it('offline earnings count managed stands only, boost time counts double', () => {
    const r = E.newRun();
    r.levels[0] = 10;
    r.levels[1] = 10;
    r.managers[0] = true;
    const perSec = E.businessIncome(r, 0, mods());
    expect(E.offlineEarnings(r, mods(), 100)).toBeCloseTo(perSec * 100, 6);
    expect(E.offlineEarnings(r, mods({ temp: 6 }), 100, 40)).toBeCloseTo(perSec * 140, 6);
    expect(E.offlineEarnings(r, mods(), 0)).toBe(0);
  });
});

describe('recipes list', () => {
  it('is sorted, unique and needs the stand to be open', () => {
    const ids = new Set(E.UPGRADES.map((u) => u.id));
    expect(ids.size).toBe(E.UPGRADES.length);
    for (let k = 1; k < E.UPGRADES.length; k++) expect(E.UPGRADES[k].cost).toBeGreaterThanOrEqual(E.UPGRADES[k - 1].cost);
    const r = E.newRun();
    r.cash = 1e40;
    expect(E.buyUpgrade(r, 'u0_3')).toBe(false); // Balık Ekmek not open yet
    expect(E.buyUpgrade(r, 'u0_0')).toBe(true);
    expect(E.buyUpgrade(r, 'u0_0')).toBe(false);
  });
});

describe('districts and tulips', () => {
  it('opens one new stand per district until all ten are open', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(E.standsIn)).toEqual([6, 7, 8, 9, 10, 10, 10]);
    expect(E.newRun(2).stands).toBe(8);
  });

  it('goals grow every district and stay finite for years of play', () => {
    let prev = 0;
    for (let d = 0; d < 120; d++) {
      const g = E.districtGoal(d);
      expect(Number.isFinite(g)).toBe(true);
      expect(g).toBeGreaterThan(prev);
      prev = g;
    }
  });

  it('tulips grow with lifetime earnings and invert', () => {
    expect(E.totalLale(0)).toBe(0);
    expect(E.totalLale(1e9)).toBeGreaterThan(0);
    for (const l of [10, 1000, 1e6]) expect(E.totalLale(E.earningsForLale(l) * 1.0001)).toBeGreaterThanOrEqual(l);
    expect(E.totalLale(1e20)).toBeGreaterThan(E.totalLale(1e19));
  });

  it('the Istanbul tour loops with stars', () => {
    expect(DISTRICTS).toHaveLength(8);
    expect(districtDef(0).id).toBe('karakoy');
    expect(districtDef(8).id).toBe('karakoy');
    expect(districtDef(15).id).toBe('adalar');
    expect(tourOf(7)).toBe(1);
    expect(tourOf(8)).toBe(2);
  });
});

describe('formatBig', () => {
  it('formats the whole range', () => {
    expect(E.formatBig(0)).toBe('0');
    expect(E.formatBig(7.25)).toBe('7.3');
    expect(E.formatBig(999)).toBe('999');
    expect(E.formatBig(1000)).toBe('1.00K');
    expect(E.formatBig(12_345)).toBe('12.3K');
    expect(E.formatBig(999_996)).toBe('1.00M');
    expect(E.formatBig(99_960)).toBe('100K');
    expect(E.formatBig(2.5e12)).toBe('2.50T');
    expect(E.formatBig(1.5e36)).toBe('1.50aa');
    expect(E.formatBig(3e39)).toBe('3.00ab');
    expect(E.formatBig(-2000)).toBe('-2.00K');
    expect(E.formatBig(Infinity)).toBe('∞');
  });
});
