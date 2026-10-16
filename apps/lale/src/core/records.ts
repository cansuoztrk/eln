import type { Score } from './net';
import type { Mode } from './timer';
import { dayKey } from './streak';

/** A finished (or wilted) focus session. */
export interface Session {
  id: string;
  /** Start time (ms). */
  at: number;
  /** Focused seconds. */
  sec: number;
  subject: string;
  mode: Mode;
  /** Tulip variety planted (null below 10 minutes or when wilted). */
  tulip: string | null;
  wilted?: boolean;
  /** District where the tulip was planted. */
  garden?: string;
}

/** A batch of practice questions for one subject. */
export interface QuestionLog {
  id: string;
  at: number;
  subject: string;
  d: number;
  y: number;
  b: number;
  note?: string;
}

/** A mock exam (deneme) result. */
export interface MockResult {
  id: string;
  at: number;
  /** MockKind id, or 'branch:<testId>' for a single-test (branş) mock. */
  kind: string;
  name: string;
  scores: Record<string, Score>;
}

export function minutesOn(sessions: Session[], day: string): number {
  let s = 0;
  for (const x of sessions) if (!x.wilted && dayKey(x.at) === day) s += x.sec;
  return Math.floor(s / 60);
}

export function questionsOn(logs: QuestionLog[], day: string): number {
  let n = 0;
  for (const q of logs) if (dayKey(q.at) === day) n += q.d + q.y + q.b;
  return n;
}

/** Monday-first list of the 7 day keys of the week containing `date`. */
export function weekDays(date: Date): string[] {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)));
}

/** Last `days` day keys ending today, oldest first. */
export function lastDays(today: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i))));
}

export function dailyMinutes(sessions: Session[], days: string[]): number[] {
  const map = new Map<string, number>();
  for (const x of sessions) {
    if (x.wilted) continue;
    const k = dayKey(x.at);
    map.set(k, (map.get(k) ?? 0) + x.sec);
  }
  return days.map((d) => Math.floor((map.get(d) ?? 0) / 60));
}

export function dailyQuestions(logs: QuestionLog[], days: string[]): number[] {
  const map = new Map<string, number>();
  for (const q of logs) {
    const k = dayKey(q.at);
    map.set(k, (map.get(k) ?? 0) + q.d + q.y + q.b);
  }
  return days.map((d) => map.get(d) ?? 0);
}

/** Focus minutes per subject inside a set of days, largest first. */
export function subjectMinutes(sessions: Session[], days: Set<string>): { subject: string; minutes: number }[] {
  const map = new Map<string, number>();
  for (const x of sessions) {
    if (x.wilted || !days.has(dayKey(x.at))) continue;
    map.set(x.subject, (map.get(x.subject) ?? 0) + x.sec);
  }
  return [...map.entries()].map(([subject, sec]) => ({ subject, minutes: Math.floor(sec / 60) })).sort((a, b) => b.minutes - a.minutes);
}

/** Correct/wrong/blank per subject inside a set of days. */
export function subjectQuestions(logs: QuestionLog[], days: Set<string> | null): Map<string, Score> {
  const map = new Map<string, Score>();
  for (const q of logs) {
    if (days && !days.has(dayKey(q.at))) continue;
    const s = map.get(q.subject) ?? { d: 0, y: 0, b: 0 };
    s.d += q.d;
    s.y += q.y;
    s.b += q.b;
    map.set(q.subject, s);
  }
  return map;
}

/** Focus minutes by hour of day (0–23) over all sessions: "your best hours". */
export function hourHistogram(sessions: Session[]): number[] {
  const h = Array(24).fill(0);
  for (const x of sessions) if (!x.wilted) h[new Date(x.at).getHours()] += x.sec / 60;
  return h.map((m) => Math.round(m));
}

export function totalFocusSec(sessions: Session[]): number {
  return sessions.reduce((a, x) => a + (x.wilted ? 0 : x.sec), 0);
}

export function newId(prefix: string, now: number): string {
  return `${prefix}${now.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}
