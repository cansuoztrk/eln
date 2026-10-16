/**
 * Daily streak with forgiving "bulb" freezes (lale soğanı). A day counts when
 * the student focused at least ACTIVE_MINUTES or solved ACTIVE_QUESTIONS.
 * Every 7th streak day earns a bulb (max 2); a bulb silently covers one missed
 * day so a single sick day does not destroy months of work.
 */
export const ACTIVE_MINUTES = 20;
export const ACTIVE_QUESTIONS = 20;
export const MAX_BULBS = 2;

export interface Streak {
  count: number;
  best: number;
  /** Last active day (YYYY-MM-DD). */
  last: string;
  bulbs: number;
}

export const EMPTY_STREAK: Streak = { count: 0, best: 0, last: '', bulbs: 0 };

export function dayKey(t: number | Date): string {
  const d = typeof t === 'number' ? new Date(t) : t;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayDiff(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const da = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86_400_000);
}

export function isActive(minutes: number, questions: number): boolean {
  return minutes >= ACTIVE_MINUTES || questions >= ACTIVE_QUESTIONS;
}

/** Registers that `today` became an active day. Returns the new streak and whether a bulb was earned or used. */
export function markActive(s: Streak, today: string): { streak: Streak; earned: boolean; used: number } {
  if (s.last === today) return { streak: s, earned: false, used: 0 };
  let count: number;
  let bulbs = s.bulbs;
  let used = 0;
  if (!s.last) count = 1;
  else {
    const gap = dayDiff(s.last, today) - 1;
    if (gap <= 0) count = s.count + 1;
    else if (gap <= bulbs) {
      bulbs -= gap;
      used = gap;
      count = s.count + 1;
    } else count = 1;
  }
  const earned = count % 7 === 0 && bulbs < MAX_BULBS;
  if (earned) bulbs++;
  return { streak: { count, best: Math.max(s.best, count), last: today, bulbs }, earned, used };
}

/** Streak to show today: alive if the last active day is today/yesterday or the gap is coverable by bulbs. */
export function currentStreak(s: Streak, today: string): number {
  if (!s.last) return 0;
  const gap = dayDiff(s.last, today) - 1;
  if (gap <= 0) return s.count;
  return gap <= s.bulbs ? s.count : 0;
}

/** True when today is not active yet and the streak would break at midnight. */
export function atRisk(s: Streak, today: string): boolean {
  if (!s.last || s.last === today) return false;
  const gap = dayDiff(s.last, today);
  return gap === 1 ? s.bulbs === 0 && s.count > 0 : false;
}
