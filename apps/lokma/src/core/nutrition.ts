import type { Activity, Diet, Nutrients, Profile, Sex, Targets } from './types';

/**
 * Energy and macro targets.
 *
 * - BMR: Mifflin–St Jeor (the most accurate predictive equation for healthy
 *   adults in comparative reviews). "other" uses the mean of both equations.
 * - TDEE = BMR × activity factor.
 * - Weight change: ~7700 kcal per kg, deficit capped at 1000 kcal/day and 30 %
 *   of TDEE, never below a sex-specific floor. We never reward or plan
 *   undereating; when a cap applies the result says so (`limited`).
 */

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const KCAL_PER_KG = 7700;
export const KCAL_FLOOR: Record<Sex, number> = { female: 1200, male: 1500, other: 1350 };
export const MAX_DEFICIT = 1000;
export const MAX_DEFICIT_SHARE = 0.3;
export const MAX_SURPLUS = 500;

export const PACE = {
  lose: { min: 0.25, max: 1, step: 0.25, default: 0.5 },
  gain: { min: 0.1, max: 0.5, step: 0.05, default: 0.25 },
} as const;

/** Users younger than this may not pick a weight-loss goal. */
export const MIN_AGE_WEIGHT_LOSS = 18;
/** Minimum age to use the app at all (store age rating + safety). */
export const MIN_AGE = 13;
export const BMI_MIN_TARGET = 18.5;

export const LIMITS = {
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 300 },
  birthYearSpan: 100,
} as const;

export function ageOf(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

export function bmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'birthYear'>, now = new Date()): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * ageOf(p.birthYear, now);
  const offset = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78;
  return base + offset;
}

export function tdee(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'birthYear' | 'activity'>, now = new Date()): number {
  return bmr(p, now) * ACTIVITY_FACTOR[p.activity];
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export type BmiClass = 'under' | 'normal' | 'over' | 'obese';
export function bmiClass(value: number): BmiClass {
  if (value < 18.5) return 'under';
  if (value < 25) return 'normal';
  if (value < 30) return 'over';
  return 'obese';
}

/** Healthy weight range for a height (BMI 18.5–24.9), rounded to 0.5 kg. */
export function healthyRange(heightCm: number): [number, number] {
  const m2 = (heightCm / 100) ** 2;
  const r = (v: number) => Math.round(v * 2) / 2;
  return [r(18.5 * m2), r(24.9 * m2)];
}

export interface Plan {
  bmr: number;
  tdee: number;
  targets: Targets;
  /** Daily kcal difference vs TDEE (negative = deficit). */
  delta: number;
  /** Effective weekly change in kg after safety caps (signed). */
  weeklyKg: number;
  /** True when a safety cap reduced the requested pace. */
  limited: boolean;
  /** Estimated weeks to reach the target weight (null when maintaining). */
  weeks: number | null;
}

const round10 = (v: number) => Math.round(v / 10) * 10;
const round50 = (v: number) => Math.round(v / 50) * 50;

/** Reference body weight for protein targets: excess weight above BMI 27 counts 25 %. */
export function proteinWeight(weightKg: number, heightCm: number): number {
  const cap = 27 * (heightCm / 100) ** 2;
  return weightKg <= cap ? weightKg : cap + (weightKg - cap) * 0.25;
}

const PROTEIN_G_PER_KG: Record<Diet, { base: number; lose: number }> = {
  balanced: { base: 1.2, lose: 1.4 },
  'high-protein': { base: 1.8, lose: 2 },
  'low-carb': { base: 1.5, lose: 1.6 },
  vegetarian: { base: 1.1, lose: 1.3 },
};

export function waterTarget(weightKg: number): number {
  return round50(Math.min(3500, Math.max(1500, weightKg * 33)));
}

export function macroTargets(kcal: number, profile: Pick<Profile, 'diet' | 'goal' | 'weightKg' | 'heightCm'>): Omit<Targets, 'waterMl'> {
  const ref = proteinWeight(profile.weightKg, profile.heightCm);
  const perKg = PROTEIN_G_PER_KG[profile.diet][profile.goal === 'lose' ? 'lose' : 'base'];
  // Protein between 0.8 g/kg (RDA) and 35 % of energy.
  let p = Math.max(0.8 * ref, perKg * ref);
  p = Math.min(p, (kcal * 0.35) / 4);
  let f: number;
  let c: number;
  if (profile.diet === 'low-carb') {
    c = (kcal * 0.25) / 4;
    f = Math.max((kcal * 0.2) / 9, (kcal - p * 4 - c * 4) / 9);
  } else {
    f = (kcal * 0.3) / 9;
    c = Math.max(0, (kcal - p * 4 - f * 9) / 4);
  }
  return {
    kcal,
    p: Math.round(p),
    c: Math.round(c),
    f: Math.round(f),
    fiber: Math.round((kcal / 1000) * 14),
  };
}

export function plan(profile: Profile, now = new Date()): Plan {
  const b = bmr(profile, now);
  const t = tdee(profile, now);
  const floor = KCAL_FLOOR[profile.sex];
  let delta = 0;
  let limited = false;

  if (profile.goal === 'lose' && profile.targetKg < profile.weightKg) {
    const pace = clamp(profile.paceKg, PACE.lose.min, PACE.lose.max);
    const wanted = (pace * KCAL_PER_KG) / 7;
    const cap = Math.min(MAX_DEFICIT, t * MAX_DEFICIT_SHARE, Math.max(0, t - floor));
    delta = -Math.min(wanted, cap);
    limited = wanted - cap > 1 || pace !== profile.paceKg;
  } else if (profile.goal === 'gain' && profile.targetKg > profile.weightKg) {
    const pace = clamp(profile.paceKg, PACE.gain.min, PACE.gain.max);
    const wanted = (pace * KCAL_PER_KG) / 7;
    delta = Math.min(wanted, MAX_SURPLUS);
    limited = wanted > MAX_SURPLUS || pace !== profile.paceKg;
  }

  const kcal = round10(Math.max(floor, t + delta));
  delta = kcal - t;
  const weeklyKg = profile.goal === 'lose' || profile.goal === 'gain' ? (delta * 7) / KCAL_PER_KG : 0;
  const diff = profile.targetKg - profile.weightKg;
  const weeks = weeklyKg !== 0 && Math.sign(diff) === Math.sign(weeklyKg) ? Math.ceil(Math.abs(diff / weeklyKg)) : null;

  return {
    bmr: Math.round(b),
    tdee: Math.round(t),
    targets: { ...macroTargets(kcal, profile), waterMl: waterTarget(profile.weightKg) },
    delta: Math.round(delta),
    weeklyKg: Math.round(weeklyKg * 100) / 100,
    limited,
    weeks,
  };
}

export type ProfileIssue =
  | 'too-young'
  | 'too-young-for-loss'
  | 'height-range'
  | 'weight-range'
  | 'target-range'
  | 'target-below-healthy'
  | 'goal-mismatch';

/** Validates onboarding answers; the UI shows a friendly message per issue. */
export function validateProfile(p: Profile, now = new Date()): ProfileIssue[] {
  const issues: ProfileIssue[] = [];
  const age = ageOf(p.birthYear, now);
  if (age < MIN_AGE) issues.push('too-young');
  else if (p.goal === 'lose' && age < MIN_AGE_WEIGHT_LOSS) issues.push('too-young-for-loss');
  if (p.heightCm < LIMITS.heightCm.min || p.heightCm > LIMITS.heightCm.max) issues.push('height-range');
  if (p.weightKg < LIMITS.weightKg.min || p.weightKg > LIMITS.weightKg.max) issues.push('weight-range');
  if (p.targetKg < LIMITS.weightKg.min || p.targetKg > LIMITS.weightKg.max) issues.push('target-range');
  if (p.goal === 'lose' && bmi(p.targetKg, p.heightCm) < BMI_MIN_TARGET) issues.push('target-below-healthy');
  if ((p.goal === 'lose' && p.targetKg >= p.weightKg) || (p.goal === 'gain' && p.targetKg <= p.weightKg)) issues.push('goal-mismatch');
  return issues;
}

/** Lowest target weight we accept for weight loss (BMI 18.5), rounded up to 0.5 kg. */
export function minTargetKg(heightCm: number): number {
  return Math.ceil(BMI_MIN_TARGET * (heightCm / 100) ** 2 * 2) / 2;
}

// ───────────── nutrient arithmetic ─────────────

export function scale(n: Nutrients, factor: number): Nutrients {
  const out: Nutrients = { kcal: n.kcal * factor, p: n.p * factor, c: n.c * factor, f: n.f * factor };
  if (n.fiber !== undefined) out.fiber = n.fiber * factor;
  if (n.sugar !== undefined) out.sugar = n.sugar * factor;
  if (n.sodium !== undefined) out.sodium = n.sodium * factor;
  return out;
}

export function sum(list: readonly Nutrients[]): Nutrients {
  const out: Nutrients = { kcal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, sodium: 0 };
  for (const n of list) {
    out.kcal += n.kcal;
    out.p += n.p;
    out.c += n.c;
    out.f += n.f;
    out.fiber! += n.fiber ?? 0;
    out.sugar! += n.sugar ?? 0;
    out.sodium! += n.sodium ?? 0;
  }
  return out;
}

/**
 * Energy from macros (Atwater 4/4/9, fibre 2 kcal/g). Lokma follows the EU /
 * Turkish label convention: `c` is available carbohydrate and EXCLUDES fibre.
 */
export function atwater(n: Pick<Nutrients, 'p' | 'c' | 'f' | 'fiber'>): number {
  return 4 * n.p + 4 * n.c + 2 * (n.fiber ?? 0) + 9 * n.f;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
