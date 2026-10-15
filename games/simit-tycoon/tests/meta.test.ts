import { beforeEach, describe, expect, it } from 'vitest';
import * as E from '../src/core/economy';
import { achievementList, achievementsClaimable, claimAchievement } from '../src/meta/achievements';
import { BOOST_MAX_HOURS, OFFLINE_CAPS_H, PRODUCTS } from '../src/meta/catalog';
import { chestReady, claimChest, claimLogin, claimQuest, ensureQuests, freeGoldLeft, grantFreeGold, loginClaimable, questProgress } from '../src/meta/daily';
import { Game, offlineCapHours, permanentMultiplier } from '../src/meta/game';
import { defaultSave, merge, sanitize, store } from '../src/meta/state';

let game: Game;
beforeEach(() => {
  store.data = defaultSave();
  game = new Game();
});

describe('game actions', () => {
  it('tap, buy and hire emit events and update stats', () => {
    const events: string[] = [];
    game.on((e) => events.push(e.type));
    expect(game.tap(0)).toBe(true);
    game.run.cash = 2000;
    expect(game.buy(0)).toBe(1);
    expect(game.hire(0)).toBe(true);
    expect(events).toEqual(['tap', 'buy', 'hire']);
    expect(store.data.stats.taps).toBe(1);
    expect(store.data.achievements.best[0]).toBe(2);
  });

  it('buy modes: next milestone and max', () => {
    game.run.cash = 1e6;
    game.setBuyMode('next');
    expect(game.buyQuote(0).count).toBe(24);
    game.setBuyMode('max');
    const q = game.buyQuote(0);
    expect(q.cost).toBeLessThanOrEqual(game.run.cash);
    expect(game.buy(0)).toBe(q.count);
  });

  it('crossing milestones and festivals is reported once', () => {
    const got: Array<{ type: string; level?: number; count?: number }> = [];
    game.on((e) => got.push(e as never));
    game.run.levels = [1, 25, 25, 25, 25, 25, 0, 0, 0, 0];
    game.run.cash = 1e9;
    game.setBuyMode('next');
    game.buy(0);
    expect(got.find((e) => e.type === 'milestone')).toMatchObject({ level: 25, count: 1 });
    expect(got.find((e) => e.type === 'festival')).toMatchObject({ level: 25 });
  });

  it('moving needs the goal, grants tulips + a badge and resets the run', () => {
    expect(game.move()).toBeNull();
    store.data.lifetime = E.districtGoal(0);
    game.run.earnedRun = E.districtGoal(0);
    game.run.cash = 123;
    const gain = game.moveGain();
    const res = game.move();
    expect(res?.district).toBe(1);
    expect(res!.lale).toBeGreaterThan(0);
    expect(store.data.lale).toBe(res!.lale);
    expect(game.run.cash).toBe(0);
    expect(game.run.stands).toBe(7);
    expect(gain).toBeGreaterThan(2);
    expect(game.pendingLale()).toBe(0);
  });
});

describe('boosts and bonuses', () => {
  it('ad boosts stack to 8 hours, purchased boosts are not capped', () => {
    const now = Date.now();
    for (let k = 0; k < 6; k++) game.addBoost(2, true, now);
    expect(store.data.boostUntil - now).toBe(BOOST_MAX_HOURS * 3_600_000);
    expect(game.canAddBoost(now)).toBe(false);
    game.addBoost(24, false, now);
    expect(store.data.boostUntil - now).toBe((BOOST_MAX_HOURS + 24) * 3_600_000);
    expect(game.tempMultiplier(now)).toBe(2);
  });

  it('rush hour triples income for 30 s', () => {
    const now = Date.now();
    game.startRush(now);
    expect(game.tempMultiplier(now + 1000)).toBe(3);
    expect(game.tempMultiplier(now + 31_000)).toBe(1);
  });

  it('time warps pay idle income; seagulls pay potential income or gold', () => {
    expect(game.warpValue(1)).toBe(0);
    game.run.levels[0] = 10;
    game.run.managers[0] = true;
    const perSec = game.idleIncome();
    expect(game.timeWarp(2)).toBeCloseTo(perSec * 7200, 6);
    const gold = store.data.gold;
    expect(game.seagull(true).gold).toBe(5);
    expect(store.data.gold).toBe(gold + 5);
    expect(game.seagull(false).cash).toBeGreaterThan(0);
  });

  it('permanent multipliers: ×2 and ×3 stack, the club doubles', () => {
    expect(permanentMultiplier()).toBe(1);
    store.data.owned.push('mult_x2', 'mult_x3');
    expect(permanentMultiplier()).toBe(6);
    store.data.vipUntil = Date.now() + 1000;
    expect(permanentMultiplier()).toBe(12);
    expect(offlineCapHours()).toBe(24);
  });
});

describe('offline earnings', () => {
  it('are capped by the till and credited once', () => {
    game.run.levels[0] = 50;
    game.run.managers[0] = true;
    const now = Date.now();
    store.data.lastSeen = now - 10 * 3_600_000;
    const r = game.offlineReport(now);
    expect(r.capped).toBe(true);
    expect(r.counted).toBe(OFFLINE_CAPS_H[0] * 3600);
    const cash = game.claimOffline(r, 2, now);
    expect(cash).toBeCloseTo(r.earnings * 2, 6);
    expect(game.offlineReport(now).earnings).toBe(0);
  });

  it('ignore clocks set back in time', () => {
    store.data.lastSeen = Date.now() + 3_600_000;
    expect(game.offlineReport().away).toBe(0);
  });

  it('count boost time twice', () => {
    game.run.levels[0] = 50;
    game.run.managers[0] = true;
    const now = Date.now();
    store.data.lastSeen = now - 3_600_000;
    const plain = game.offlineReport(now).earnings;
    store.data.boostUntil = now - 1_800_000;
    expect(game.offlineReport(now).earnings).toBeCloseTo(plain * 1.5, 6);
  });
});

describe('daily systems', () => {
  it('login calendar continues on consecutive days and resets after a gap', () => {
    expect(loginClaimable('2026-10-01')).toBe(0);
    claimLogin(game, '2026-10-01');
    expect(loginClaimable('2026-10-01')).toBe(-1);
    expect(loginClaimable('2026-10-02')).toBe(1);
    claimLogin(game, '2026-10-02');
    expect(store.data.login.streak).toBe(2);
    expect(loginClaimable('2026-10-05')).toBe(0);
  });

  it('quests are deterministic per day, track progress and pay out', () => {
    const a = ensureQuests('2026-10-10').map((q) => q.id);
    store.data.quests.date = '';
    expect(ensureQuests('2026-10-10').map((q) => q.id)).toEqual(a);
    const list = store.data.quests.list;
    for (const q of list) questProgress(q.id as never, q.target, '2026-10-10');
    const gold = store.data.gold;
    for (let k = 0; k < 3; k++) expect(claimQuest(game, k)).toBeGreaterThan(0);
    expect(store.data.gold).toBeGreaterThan(gold);
    expect(chestReady()).toBe(true);
    expect(claimChest(game)).not.toBeNull();
    expect(claimChest(game)).toBeNull();
  });

  it('free gold is limited per day', () => {
    expect(freeGoldLeft('2026-10-10')).toBe(3);
    for (let k = 0; k < 4; k++) grantFreeGold(game, '2026-10-10');
    expect(freeGoldLeft('2026-10-10')).toBe(0);
    expect(freeGoldLeft('2026-10-11')).toBe(3);
  });
});

describe('achievements', () => {
  it('pay gold once', () => {
    store.data.achievements.best[0] = 120;
    expect(achievementsClaimable()).toBe(3);
    const first = achievementList()[0];
    const gold = store.data.gold;
    expect(claimAchievement(game, first.id)).toBe(first.reward);
    expect(claimAchievement(game, first.id)).toBe(0);
    expect(store.data.gold).toBe(gold + first.reward);
  });
});

describe('save data', () => {
  it('merges new fields and repairs corrupted values', () => {
    const saved = { gold: -5, lale: 'x', run: { cash: Number.NaN, levels: [3, -1, 2.7, 0, 0, 0, 0, 0, 0, 0], managers: [true], progress: [5] }, buyMode: 7 };
    const d = sanitize(merge(defaultSave(), JSON.parse(JSON.stringify(saved))));
    expect(d.gold).toBe(0);
    expect(d.lale).toBe(0);
    expect(d.run.cash).toBe(0);
    expect(d.run.levels.slice(0, 3)).toEqual([3, 0, 2]);
    expect(d.run.managers).toHaveLength(10);
    expect(d.buyMode).toBe(1);
    expect(d.settings.sound).toBe(true);
  });
});

describe('catalog', () => {
  it('every product has a USD and a hand-set Turkish price', () => {
    for (const p of PRODUCTS) {
      expect(p.usd).toBeGreaterThan(0);
      expect(p.try).toBeGreaterThan(0);
      expect(String(p.try)).toMatch(/\.99$/);
    }
  });
});
