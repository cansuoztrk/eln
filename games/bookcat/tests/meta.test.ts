import { beforeEach, describe, expect, it } from 'vitest';
import de from '../src/i18n/de';
import en from '../src/i18n/en';
import es from '../src/i18n/es';
import tr from '../src/i18n/tr';
import { claimLogin, dailyDone, loginClaimable, recordDaily } from '../src/meta/daily';
import { recordWin } from '../src/meta/progress';
import { defaultSave, merge, sanitize, store, type SaveData, type SavedRun } from '../src/meta/state';
import { grantTransactions } from '../src/services/iap';

const load = (raw: unknown): SaveData => sanitize(merge(defaultSave(), JSON.parse(JSON.stringify(raw))));

const legacyRun = (key: string) => ({
  key,
  columns: [{ down: [3], up: [0] }, { down: [], up: [1, 2] }],
  stock: [4],
  waste: [],
  slots: [null],
  done: [],
  movesLeft: 12,
  movesUsed: 4,
  recycles: 0,
  extra: 10,
  boosted: true,
});

beforeEach(() => {
  store.data = defaultSave();
});

describe('save repair and migration', () => {
  it('repairs null or mistyped sections instead of throwing (and keeps progress)', () => {
    const d = load({ v: 1, level: 37, coins: 950, levelStars: { 1: 3, 2: 9 }, boosters: null, daily: null, settings: null, login: { last: '2026-10-01', day: 'x' }, quests: { date: 'x', list: null }, stats: { wins: null, firstOpen: 5 }, tutorial: { done: true, tips: null }, owned: 'no_ads' });
    expect(d.level).toBe(37);
    expect(d.coins).toBe(950);
    expect(d.levelStars).toEqual({ 1: 3 });
    expect(d.boosters).toEqual({ hint: 3, paw: 2 });
    expect(d.daily.results).toEqual({});
    expect(d.settings.sound).toBe(true);
    expect(d.login).toMatchObject({ last: '2026-10-01', day: 0 });
    expect(Array.isArray(d.quests.list)).toBe(true);
    expect(d.stats).toMatchObject({ wins: 0, firstOpen: 5 });
    expect(d.tutorial).toEqual({ done: true, tips: [] });
    expect(d.owned).toEqual([]);
  });

  it('moves a v1 run into the journey or daily slot and keeps it resumable', () => {
    const j = load({ v: 1, level: 16, coins: 300, run: legacyRun('L16') });
    expect(j.runs.journey).toMatchObject({ key: 'L16', sig: '', extra: 10, boosted: true, moveAds: 0, moveBuys: 0, movesUsed: 4 });
    expect(j.runs.daily).toBeNull();
    expect('run' in j).toBe(false);
    expect(j.v).toBe(2);
    expect([j.level, j.coins]).toEqual([16, 300]);
    const d = load({ v: 1, run: legacyRun('D2026-10-15') });
    expect(d.runs).toMatchObject({ journey: null, daily: { key: 'D2026-10-15' } });
    // A broken run is dropped, the rest of the save stays.
    const bad = load({ v: 1, level: 9, run: { ...legacyRun('L9'), columns: 'x' } });
    expect(bad.runs.journey).toBeNull();
    expect(bad.level).toBe(9);
  });

  it('starts the purchase ledger now for old saves, so earlier purchases are not granted again', () => {
    const before = Date.now();
    const d = load({ v: 1, stats: { firstOpen: 1000 } });
    expect(d.iap.granted).toEqual([]);
    expect(d.iap.since).toBeGreaterThanOrEqual(before);
    const kept = load({ ...defaultSave(1000), iap: { since: 1000, granted: ['a', 'a', 7] } });
    expect(kept.iap).toEqual({ since: 1000, granted: ['a'] });
  });

  it('round-trips a current save unchanged', () => {
    const run: SavedRun = { ...legacyRun('L3'), sig: 's', moveAds: 1, moveBuys: 2, credited: { words: 3, cats: [0] } };
    const save = { ...defaultSave(1), level: 3, runs: { journey: run, daily: null } };
    expect(load(save)).toEqual(save);
  });

  it('reset keeps paid entitlements, settings and the ledger', async () => {
    store.data.removeAds = true;
    store.data.owned = ['no_ads'];
    store.data.level = 50;
    store.data.settings.lang = 'de';
    store.data.iap.granted = ['t1'];
    await store.reset();
    expect(store.data).toMatchObject({ level: 1, removeAds: true, owned: ['no_ads'], settings: { lang: 'de' }, iap: { granted: ['t1'] } });
  });
});

describe('daily systems', () => {
  it('does not treat an earlier date as a new login day', () => {
    expect(claimLogin('2026-10-16')).not.toBeNull();
    expect(loginClaimable('2026-10-15')).toBe(-1);
    expect(claimLogin('2026-10-15')).toBeNull();
    expect(loginClaimable('2026-10-16')).toBe(-1);
    expect(loginClaimable('2026-10-17')).toBe(1);
    expect(loginClaimable('2026-10-19')).toBe(0);
  });

  it('records a Daily Shelf win under the puzzle date', () => {
    store.data.daily = { last: '2026-10-14', streak: 3, best: 3, results: {} };
    // Started on the 15th, won after midnight.
    expect(recordDaily(3, 20, '2026-10-15')).toBeGreaterThan(0);
    expect(store.data.daily).toMatchObject({ last: '2026-10-15', streak: 4 });
    expect(dailyDone('2026-10-16')).toBe(false);
    // The same or an older puzzle never pays again (clock set back).
    expect(recordDaily(3, 20, '2026-10-15')).toBe(0);
    expect(recordDaily(3, 20, '2026-10-13')).toBe(0);
  });

  it('recordWin uses the date in the daily key and clears only that run', () => {
    store.data.daily.last = '2026-10-14';
    store.data.runs = { journey: { ...legacyRun('L5'), sig: '', moveAds: 0, moveBuys: 0 }, daily: { ...legacyRun('D2026-10-15'), sig: '', moveAds: 0, moveBuys: 0 } };
    const o = recordWin({ key: 'D2026-10-15', level: 0, daily: true, stars: 2, movesLeft: 3, movesUsed: 20, kind: 'normal' });
    expect(o.coins).toBeGreaterThan(0);
    expect(store.data.daily.results['2026-10-15']).toEqual({ stars: 2, moves: 20 });
    expect(store.data.runs.daily).toBeNull();
    expect(store.data.runs.journey?.key).toBe('L5');
  });
});

describe('progress', () => {
  it('gives one book per chapter and none past the last chapter', () => {
    store.data.level = 300;
    expect(recordWin({ key: 'L300', level: 300, daily: false, stars: 3, movesLeft: 10, movesUsed: 30, kind: 'boss' }).book).toBe(29);
    store.data.level = 310;
    const o = recordWin({ key: 'L310', level: 310, daily: false, stars: 3, movesLeft: 10, movesUsed: 30, kind: 'boss' });
    expect(o.book).toBeNull();
    expect(store.data.books).toEqual([29]);
  });
});

describe('purchase ledger', () => {
  const tx = (id: string, product: string, at: number) => ({ transactionIdentifier: id, productIdentifier: product, purchaseDate: new Date(at).toISOString() });

  it('grants each transaction once, skips ones from before the ledger and repeats of once-only products', () => {
    const now = Date.now();
    store.data.iap.since = now - 1000;
    const coins = store.data.coins;
    expect(grantTransactions([tx('a', 'coins_600', now), tx('old', 'coins_600', now - 60_000), tx('b', 'unknown', now)])).toEqual(['coins_600']);
    expect(grantTransactions([tx('a', 'coins_600', now)])).toEqual([]);
    expect(store.data.coins).toBe(coins + 600);
    // The transaction a purchase call just returned is trusted whatever its date.
    expect(grantTransactions([tx('c', 'coins_600', now - 60_000)], 'c')).toEqual(['coins_600']);
    expect(grantTransactions([tx('n1', 'no_ads', now)])).toEqual(['no_ads']);
    expect(grantTransactions([tx('n2', 'no_ads', now)])).toEqual([]);
    expect(store.data.coins).toBe(coins + 600 + 600 + 1000);
    expect(store.data.iap.granted).toEqual(['a', 'c', 'n1', 'n2']);
  });
});

describe('i18n', () => {
  it('has the same keys and placeholders in every language', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    for (const [lang, table] of Object.entries({ en, de, es })) {
      expect(Object.keys(table).sort(), lang).toEqual(Object.keys(tr).sort());
      for (const [k, v] of Object.entries(tr)) expect(ph((table as Record<string, string>)[k]), `${lang} ${k}`).toBe(ph(v));
    }
  });
});
