import { describe, expect, it } from 'vitest';
import {
  addDays, bestStreak, dayKey, dayTotals, emptyDay, entryFromFood, isoWeekId, mealForTime, mealTotals, streak, weekOf,
} from '../src/core/diary';
import { buildKarne } from '../src/core/karne';
import { buildIndex, editDistance, norm, search } from '../src/core/search';
import type { DayLog, Entry, Food, Targets } from '../src/core/types';

const food = (id: string, tr: string, en: string, de: string, kcal: number, extra: Partial<Food> = {}): Food => ({
  id, tr, en, de, cat: 'soup', per100: { kcal, p: kcal / 20, c: kcal / 10, f: kcal / 40 }, portions: [{ unit: 'kase', g: 250 }], src: 'test', ...extra,
});

const FOODS: Food[] = [
  food('mercimek-corbasi', 'Mercimek çorbası', 'Lentil soup', 'Linsensuppe', 60),
  food('iskembe-corbasi', 'İşkembe çorbası', 'Tripe soup', 'Kuttelsuppe', 75),
  food('cay', 'Çay', 'Turkish tea', 'Türkischer Tee', 1, { cat: 'drink', liquid: true, portions: [{ unit: 'cay-bardagi', g: 100 }] }),
  food('caylı-kek'.replace('ı', 'i'), 'Çaylı kek', 'Tea cake', 'Teekuchen', 380, { cat: 'dessert' }),
  food('su-boregi', 'Su böreği', 'Water börek', 'Wasser-Börek', 240, { cat: 'bakery', aliases: ['su borek'] }),
  food('sutlac', 'Sütlaç', 'Rice pudding', 'Milchreis', 120, { cat: 'dessert' }),
  food('kunefe', 'Künefe', 'Künefe', 'Künefe', 330, { cat: 'dessert' }),
];
const index = buildIndex(FOODS);

describe('search', () => {
  it('folds Turkish and German characters', () => {
    expect(norm('İŞKEMBE Çorbası')).toBe('iskembe corbasi');
    expect(norm('Türkischer Tee')).toBe('turkischer tee');
    expect(norm('Straße')).toBe('strasse');
    expect(norm('ICE')).toBe('ice');
  });

  it('finds foods without diacritics, by prefix and in any language', () => {
    expect(search(index, 'mercimek', { lang: 'tr' })[0].id).toBe('mercimek-corbasi');
    expect(search(index, 'iskembe', { lang: 'tr' })[0].id).toBe('iskembe-corbasi');
    expect(search(index, 'sutl', { lang: 'tr' })[0].id).toBe('sutlac');
    expect(search(index, 'lentil', { lang: 'en' })[0].id).toBe('mercimek-corbasi');
    expect(search(index, 'linsen', { lang: 'de' })[0].id).toBe('mercimek-corbasi');
    expect(search(index, 'su borek', { lang: 'tr' })[0].id).toBe('su-boregi');
  });

  it('prefers the generic dish and tolerates typos', () => {
    expect(search(index, 'çay', { lang: 'tr' })[0].id).toBe('cay');
    expect(search(index, 'mercimk', { lang: 'tr' })[0].id).toBe('mercimek-corbasi');
    expect(search(index, 'kunafe', { lang: 'tr' })[0].id).toBe('kunefe');
    expect(search(index, 'zzzz', { lang: 'tr' })).toEqual([]);
  });

  it('boosts favourites and recent foods', () => {
    const plain = search(index, 'corba', { lang: 'tr' }).map((f) => f.id);
    const boosted = search(index, 'corba', { lang: 'tr', favorites: [plain[plain.length - 1]] }).map((f) => f.id);
    expect(boosted[0]).toBe(plain[plain.length - 1]);
  });

  it('computes Damerau–Levenshtein distances', () => {
    expect(editDistance('kunefe', 'kunafe')).toBe(1);
    expect(editDistance('corba', 'cobra')).toBe(1);
    expect(editDistance('abc', 'xyz', 2)).toBe(3);
  });
});

describe('diary', () => {
  it('handles local day keys and Monday-based weeks', () => {
    expect(dayKey(new Date(2026, 9, 5, 23, 30))).toBe('2026-10-05');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(weekOf('2026-10-15')).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
    expect(isoWeekId('2026-10-15')).toBe('2026-W42');
    expect(isoWeekId('2027-01-01')).toBe('2026-W53');
  });

  it('builds entries from foods and portions', () => {
    const e = entryFromFood(FOODS[0], { meal: 'lunch', unit: 'kase', qty: 1.5, name: 'Mercimek çorbası', now: 1 });
    expect(e.g).toBe(375);
    expect(e.kcal).toBe(225);
    expect(e.p).toBeCloseTo(11.3, 1);
    const g = entryFromFood(FOODS[0], { meal: 'lunch', unit: 'g', qty: 50, name: 'x', now: 1 });
    expect(g.kcal).toBe(30);
  });

  it('totals days including sugar in tea', () => {
    const day: DayLog = { ...emptyDay(), tea: 3, teaSugar: 4 };
    day.entries.push(entryFromFood(FOODS[0], { meal: 'dinner', unit: 'kase', qty: 1, name: 'm', now: 1 }));
    const t = dayTotals(day);
    expect(t.kcal).toBe(150 + 80 + 3);
    expect(t.c).toBeCloseTo(15 + 20, 5);
    expect(mealTotals(day).dinner.kcal).toBe(150);
    expect(mealTotals(day).breakfast.kcal).toBe(0);
  });

  it('counts streaks without breaking them before the first log of the day', () => {
    const logs: Record<string, DayLog> = {};
    for (const k of ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']) logs[k] = { ...emptyDay(), waterMl: 200 };
    expect(streak(logs, '2026-10-15')).toBe(5);
    logs['2026-10-15'] = { ...emptyDay(), tea: 1 };
    expect(streak(logs, '2026-10-15')).toBe(6);
    expect(streak(logs, '2026-10-17')).toBe(0);
    logs['2026-10-01'] = { ...emptyDay(), waterMl: 200 };
    expect(bestStreak(logs)).toBe(6);
  });

  it('suggests a meal for the time of day', () => {
    expect(mealForTime(new Date(2026, 0, 1, 8))).toBe('breakfast');
    expect(mealForTime(new Date(2026, 0, 1, 13))).toBe('lunch');
    expect(mealForTime(new Date(2026, 0, 1, 16))).toBe('snack');
    expect(mealForTime(new Date(2026, 0, 1, 20))).toBe('dinner');
    expect(mealForTime(new Date(2026, 0, 1, 2))).toBe('snack');
  });
});

describe('karne', () => {
  const targets: Targets = { kcal: 2000, p: 100, c: 220, f: 67, fiber: 28, waterMl: 2000 };
  const week = weekOf('2026-10-12');
  const entry = (meal: Entry['meal'], kcal: number, p: number, fiber?: number): Entry => ({
    id: Math.random().toString(36), meal, t: 0, name: 'x', source: 'quick', qty: 1, unit: 'g', g: 100, kcal, p, c: 0, f: 0, fiber,
  });
  const day = (kcal: number, p: number, water: number, fiber?: number): DayLog => ({
    ...emptyDay(), waterMl: water, entries: [entry('breakfast', kcal / 2, p / 2, fiber === undefined ? undefined : fiber / 2), entry('dinner', kcal / 2, p / 2, fiber === undefined ? undefined : fiber / 2)],
  });

  it('awards a Takdir certificate for a near-perfect week', () => {
    const logs: Record<string, DayLog> = {};
    for (const k of week) logs[k] = day(2000, 110, 2200, 30);
    const k = buildKarne(week, logs, targets, { today: '2026-10-19' });
    expect(k.complete).toBe(true);
    expect(k.subjects.every((s) => s.grade === 5)).toBe(true);
    expect(k.certificate).toBe('takdir');
    expect(k.week).toBe('2026-W42');
  });

  it('never rewards undereating', () => {
    const logs: Record<string, DayLog> = {};
    for (const k of week) logs[k] = day(1000, 110, 2200, 30);
    const k = buildKarne(week, logs, targets, { today: '2026-10-19' });
    expect(k.subjects.find((s) => s.id === 'energy')!.grade).toBe(1);
    expect(k.lowEnergyDays).toBe(7);
    expect(k.certificate).toBeNull();
  });

  it('grades consistency and points to what to improve', () => {
    const logs: Record<string, DayLog> = {};
    for (const k of week.slice(0, 4)) logs[k] = day(2050, 105, 600);
    const k = buildKarne(week, logs, targets, { today: '2026-10-19' });
    expect(k.subjects[0]).toMatchObject({ id: 'consistency', grade: 3, hit: 4 });
    expect(k.improve).toBe('water');
    expect(k.subjects.some((s) => s.id === 'fiber')).toBe(false);
  });

  it('grades fasting when at least two fasts happened that week', () => {
    const logs: Record<string, DayLog> = {};
    for (const k of week) logs[k] = day(2000, 100, 2000);
    const at = (k: string, h: number) => new Date(`${k}T${String(h).padStart(2, '0')}:00:00`).getTime();
    const fasts = [
      { start: at('2026-10-12', 4), end: at('2026-10-12', 20), goalH: 16 },
      { start: at('2026-10-13', 4), end: at('2026-10-13', 10), goalH: 16 },
    ];
    const k = buildKarne(week, logs, targets, { today: '2026-10-19', fasts });
    expect(k.subjects.find((s) => s.id === 'fasting')).toMatchObject({ hit: 1, of: 2 });
  });
});
