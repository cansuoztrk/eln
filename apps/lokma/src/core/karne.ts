import { dayTotals, isLogged, isoWeekId } from './diary';
import type { DayLog, Targets } from './types';

/**
 * "Haftalık Karne": a weekly report card in the style of Turkish school
 * report cards. Every subject is graded 1–5 (Pekiyi = 5). Energy is graded on
 * staying NEAR the target: eating far below it never earns a better grade, and
 * repeated very-low days withhold certificates and trigger a caring note.
 */

export type SubjectId = 'consistency' | 'energy' | 'protein' | 'water' | 'fiber' | 'fasting';
export type Grade = 1 | 2 | 3 | 4 | 5;
export type Certificate = 'takdir' | 'tesekkur' | null;

export interface Subject {
  id: SubjectId;
  grade: Grade;
  /** 0..1 */
  score: number;
  hit: number;
  of: number;
}

export interface Karne {
  week: string;
  days: string[];
  loggedDays: number;
  subjects: Subject[];
  average: number;
  certificate: Certificate;
  strong: SubjectId | null;
  improve: SubjectId | null;
  lowEnergyDays: number;
  /** True once the week is over (or at least 7 days are in the past). */
  complete: boolean;
}

export interface FastRecord {
  start: number;
  end: number;
  goalH: number;
}

/** A day is "complete enough" to judge energy when it holds ≥ 2 meals or ≥ 50 % of the target. */
function judgeable(day: DayLog, target: number): boolean {
  const meals = new Set(day.entries.map((e) => e.meal)).size;
  return meals >= 2 || dayTotals(day).kcal >= target * 0.5;
}

function gradeOf(score: number): Grade {
  if (score >= 0.85) return 5;
  if (score >= 0.65) return 4;
  if (score >= 0.45) return 3;
  if (score >= 0.25) return 2;
  return 1;
}

export function consistencyGrade(logged: number): Grade {
  if (logged >= 6) return 5;
  if (logged === 5) return 4;
  if (logged === 4) return 3;
  if (logged === 3) return 2;
  return 1;
}

export function buildKarne(
  weekDays: string[],
  logs: Record<string, DayLog>,
  targets: Targets,
  opts: { today: string; fasts?: FastRecord[] } = { today: weekDays[weekDays.length - 1] },
): Karne {
  const days = weekDays.filter((k) => k <= opts.today);
  const logged = days.filter((k) => isLogged(logs[k]));
  const subjects: Subject[] = [];

  subjects.push({ id: 'consistency', grade: consistencyGrade(logged.length), score: logged.length / 7, hit: logged.length, of: 7 });

  const judged = logged.filter((k) => judgeable(logs[k], targets.kcal));
  let lowEnergyDays = 0;
  if (judged.length) {
    let energy = 0;
    let protein = 0;
    let fiber = 0;
    let fiberKnown = 0;
    let energyHits = 0;
    let proteinHits = 0;
    let fiberHits = 0;
    for (const k of judged) {
      const t = dayTotals(logs[k]);
      const ratio = t.kcal / targets.kcal;
      const off = Math.abs(ratio - 1);
      const e = off <= 0.1 ? 1 : off <= 0.2 ? 0.6 : off <= 0.3 ? 0.3 : 0;
      energy += e;
      if (e === 1) energyHits++;
      if (ratio < 0.7) lowEnergyDays++;
      const pr = t.p / Math.max(1, targets.p);
      protein += pr >= 0.9 ? 1 : pr >= 0.7 ? 0.5 : 0;
      if (pr >= 0.9) proteinHits++;
      const withFiber = logs[k].entries.filter((x) => x.fiber !== undefined).length;
      if (withFiber >= logs[k].entries.length / 2) {
        fiberKnown++;
        const fr = (t.fiber ?? 0) / Math.max(1, targets.fiber);
        fiber += fr >= 0.8 ? 1 : fr >= 0.5 ? 0.5 : 0;
        if (fr >= 0.8) fiberHits++;
      }
    }
    // Missing days count as zero so a single perfect day cannot earn Pekiyi.
    const of = Math.max(judged.length, Math.min(7, Math.max(4, days.length)));
    subjects.push({ id: 'energy', grade: gradeOf(energy / of), score: energy / of, hit: energyHits, of });
    subjects.push({ id: 'protein', grade: gradeOf(protein / of), score: protein / of, hit: proteinHits, of });
    if (fiberKnown >= Math.max(2, judged.length / 2)) {
      subjects.push({ id: 'fiber', grade: gradeOf(fiber / fiberKnown), score: fiber / fiberKnown, hit: fiberHits, of: fiberKnown });
    }
  }

  let water = 0;
  let waterHits = 0;
  for (const k of days) {
    const r = (logs[k]?.waterMl ?? 0) / Math.max(1, targets.waterMl);
    water += r >= 1 ? 1 : r >= 0.75 ? 0.6 : r >= 0.5 ? 0.3 : 0;
    if (r >= 1) waterHits++;
  }
  const waterOf = Math.max(4, days.length);
  subjects.push({ id: 'water', grade: gradeOf(water / waterOf), score: water / waterOf, hit: waterHits, of: waterOf });

  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];
  const fasts = (opts.fasts ?? []).filter((f) => {
    const k = localKey(f.start);
    return k >= first && k <= last;
  });
  if (fasts.length >= 2) {
    const done = fasts.filter((f) => (f.end - f.start) / 3_600_000 >= f.goalH * 0.95).length;
    subjects.push({ id: 'fasting', grade: gradeOf(done / fasts.length), score: done / fasts.length, hit: done, of: fasts.length });
  }

  const average = subjects.reduce((a, s) => a + s.grade, 0) / subjects.length;
  const consistency = subjects[0].grade;
  let certificate: Certificate = null;
  if (consistency >= 3 && lowEnergyDays < 2) {
    if (average >= 4.5) certificate = 'takdir';
    else if (average >= 3.5) certificate = 'tesekkur';
  }
  const ranked = [...subjects].sort((a, b) => b.score - a.score);
  const strong = ranked[0] && ranked[0].grade >= 4 ? ranked[0].id : null;
  const weakest = ranked[ranked.length - 1];
  const improve = weakest && weakest.grade <= 3 && weakest.id !== strong ? weakest.id : null;

  return {
    week: isoWeekId(first),
    days: weekDays,
    loggedDays: logged.length,
    subjects,
    average: Math.round(average * 10) / 10,
    certificate,
    strong,
    improve,
    lowEnergyDays,
    complete: opts.today > last,
  };
}

function localKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
