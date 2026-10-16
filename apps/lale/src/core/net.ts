import { EXAMS, testById, type ExamId } from './exams';

/** One test (booklet) result: correct, wrong, blank. */
export interface Score {
  d: number;
  y: number;
  b: number;
}

/** Net = correct − wrong / penalty (no penalty when penalty is 0), never below 0 in the UI. */
export function net(s: Pick<Score, 'd' | 'y'>, penalty: number): number {
  const n = penalty > 0 ? s.d - s.y / penalty : s.d;
  return Math.round(n * 100) / 100;
}

export function examNet(exam: ExamId, s: Pick<Score, 'd' | 'y'>): number {
  return net(s, EXAMS[exam].penalty);
}

/** Validates a test score against its question count; returns an error key or null. */
export function validateScore(s: Score, questions: number): 'negative' | 'tooMany' | null {
  if ([s.d, s.y, s.b].some((v) => !Number.isFinite(v) || v < 0 || !Number.isInteger(v))) return 'negative';
  if (s.d + s.y + s.b > questions) return 'tooMany';
  return null;
}

/** Fills the blank count from the test size when the user typed only correct/wrong. */
export function withBlank(s: Pick<Score, 'd' | 'y'>, questions: number): Score {
  return { d: s.d, y: s.y, b: Math.max(0, questions - s.d - s.y) };
}

/** Total net of a mock exam (sum of its tests). */
export function mockNet(exam: ExamId, scores: Record<string, Score>): number {
  let total = 0;
  for (const s of Object.values(scores)) total += examNet(exam, s);
  return Math.round(total * 100) / 100;
}

/** Maximum net of a mock (all questions correct). */
export function mockMax(exam: ExamId, tests: string[]): number {
  return tests.reduce((a, id) => a + (testById(exam, id)?.questions ?? 0), 0);
}

/** Accuracy in % of attempted questions (blank ones excluded). */
export function accuracy(s: Pick<Score, 'd' | 'y'>): number {
  const tried = s.d + s.y;
  return tried ? Math.round((s.d / tried) * 100) : 0;
}
