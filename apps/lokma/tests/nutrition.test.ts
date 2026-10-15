import { describe, expect, it } from 'vitest';
import {
  atwater, bmi, bmiClass, bmr, healthyRange, KCAL_FLOOR, macroTargets, minTargetKg, plan, proteinWeight, scale, sum, tdee,
  validateProfile, waterTarget,
} from '../src/core/nutrition';
import type { Profile } from '../src/core/types';

const NOW = new Date('2026-10-15T12:00:00Z');
const base: Profile = {
  sex: 'female', birthYear: 1996, heightCm: 165, weightKg: 72, targetKg: 62, activity: 'light', goal: 'lose',
  paceKg: 0.5, diet: 'balanced', fasting: 'none',
};

describe('energy', () => {
  it('Mifflin–St Jeor matches the published equations', () => {
    // 30-year-old woman, 72 kg, 165 cm: 10*72 + 6.25*165 - 5*30 - 161 = 1440.25
    expect(bmr(base, NOW)).toBeCloseTo(1440.25, 2);
    expect(bmr({ ...base, sex: 'male' }, NOW)).toBeCloseTo(1606.25, 2);
    expect(bmr({ ...base, sex: 'other' }, NOW)).toBeCloseTo(1523.25, 2);
    expect(tdee(base, NOW)).toBeCloseTo(1440.25 * 1.375, 2);
  });

  it('plans a 0.5 kg/week loss as a ~550 kcal deficit', () => {
    const r = plan(base, NOW);
    expect(r.tdee).toBe(1980);
    expect(r.targets.kcal).toBe(1430);
    expect(r.delta).toBeCloseTo(-550, -1);
    expect(r.weeklyKg).toBeCloseTo(-0.5, 1);
    expect(r.limited).toBe(false);
    expect(r.weeks).toBe(20);
  });

  it('never plans below the floor and flags the cap', () => {
    const small: Profile = { ...base, weightKg: 52, heightCm: 152, targetKg: 46, activity: 'sedentary', paceKg: 1, birthYear: 1966 };
    const r = plan(small, NOW);
    expect(r.targets.kcal).toBeGreaterThanOrEqual(KCAL_FLOOR.female);
    expect(r.limited).toBe(true);
  });

  it('caps the deficit at 1000 kcal and 30 % of TDEE', () => {
    const big: Profile = { ...base, sex: 'male', weightKg: 140, heightCm: 185, targetKg: 95, activity: 'active', paceKg: 1 };
    const r = plan(big, NOW);
    expect(-r.delta).toBeLessThanOrEqual(1005);
    expect(-r.delta / r.tdee).toBeLessThanOrEqual(0.301);
  });

  it('gains with a capped surplus and maintains at TDEE', () => {
    const gain = plan({ ...base, goal: 'gain', weightKg: 50, targetKg: 56, paceKg: 0.25 }, NOW);
    expect(gain.delta).toBeGreaterThan(200);
    expect(gain.delta).toBeLessThanOrEqual(505);
    expect(gain.weeks).toBeGreaterThan(0);
    const keep = plan({ ...base, goal: 'maintain', targetKg: 72 }, NOW);
    expect(Math.abs(keep.targets.kcal - keep.tdee)).toBeLessThanOrEqual(5);
    expect(keep.weeks).toBeNull();
  });
});

describe('macros', () => {
  it('splits energy so the macros add back up to the target', () => {
    for (const diet of ['balanced', 'high-protein', 'low-carb', 'vegetarian'] as const) {
      const m = macroTargets(1800, { diet, goal: 'lose', weightKg: 80, heightCm: 175 });
      const energy = m.p * 4 + m.c * 4 + m.f * 9;
      expect(Math.abs(energy - 1800)).toBeLessThan(40);
      expect(m.p * 4).toBeLessThanOrEqual(1800 * 0.35 + 4);
      expect(m.f * 9).toBeGreaterThanOrEqual(1800 * 0.2 - 9);
    }
  });

  it('bases protein on a reference weight for higher BMIs', () => {
    expect(proteinWeight(70, 175)).toBe(70);
    expect(proteinWeight(130, 175)).toBeLessThan(100);
  });

  it('keeps water within 1.5–3.5 L', () => {
    expect(waterTarget(40)).toBe(1500);
    expect(waterTarget(70)).toBe(2300);
    expect(waterTarget(150)).toBe(3500);
  });
});

describe('body metrics and validation', () => {
  it('computes BMI classes and healthy ranges', () => {
    expect(bmi(72, 165)).toBeCloseTo(26.4, 1);
    expect(bmiClass(17)).toBe('under');
    expect(bmiClass(22)).toBe('normal');
    expect(bmiClass(27)).toBe('over');
    expect(bmiClass(31)).toBe('obese');
    expect(healthyRange(165)).toEqual([50.5, 68]);
    expect(minTargetKg(165)).toBe(50.5);
  });

  it('rejects unsafe or inconsistent onboarding answers', () => {
    expect(validateProfile(base, NOW)).toEqual([]);
    expect(validateProfile({ ...base, targetKg: 45 }, NOW)).toContain('target-below-healthy');
    expect(validateProfile({ ...base, birthYear: 2010 }, NOW)).toContain('too-young-for-loss');
    expect(validateProfile({ ...base, birthYear: 2016 }, NOW)).toContain('too-young');
    expect(validateProfile({ ...base, targetKg: 80 }, NOW)).toContain('goal-mismatch');
    expect(validateProfile({ ...base, goal: 'maintain', birthYear: 2010 }, NOW)).toEqual([]);
  });
});

describe('nutrient arithmetic', () => {
  it('scales and sums nutrients', () => {
    const a = { kcal: 100, p: 5, c: 10, f: 4, fiber: 2 };
    expect(scale(a, 1.5)).toEqual({ kcal: 150, p: 7.5, c: 15, f: 6, fiber: 3 });
    const s = sum([a, a]);
    expect(s.kcal).toBe(200);
    expect(s.fiber).toBe(4);
  });

  it('computes Atwater energy with EU carbohydrate convention', () => {
    expect(atwater({ p: 10, c: 20, f: 5, fiber: 4 })).toBe(40 + 80 + 8 + 45);
  });
});
