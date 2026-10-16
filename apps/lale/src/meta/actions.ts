import { EXAMS, nextExamDate, parseLocal, subjectsFor, type Subject } from '../core/exams';
import { encode, isoWeek, type Summary } from '../core/friends';
import { DISTRICTS, districtUnlocked, pickVariety, VARIETY_BY_ID, type Variety } from '../core/garden';
import { minutesOn, newId, questionsOn, totalFocusSec, weekDays, type MockResult, type Session } from '../core/records';
import { currentStreak, dayKey, isActive, markActive } from '../core/streak';
import { elapsed, MAX_STOPWATCH_SEC, MIN_LOG_SEC, MIN_TULIP_SEC, type Running } from '../core/timer';
import type { Score } from '../core/net';
import { isPremium, profile, store } from './state';

export interface FinishResult {
  session: Session | null;
  variety: Variety | null;
  wilted: boolean;
  bulbEarned: boolean;
  unlocked: string[];
  goalReached: boolean;
}

export function subjects(): Subject[] {
  const p = profile();
  return subjectsFor(p.exam, p.field);
}

export function subjectName(id: string, lang: keyof Subject['name']): string {
  for (const e of Object.values(EXAMS)) {
    const s = e.subjects.find((x) => x.id === id);
    if (s) return s.name[lang];
  }
  return id;
}

export function subjectHue(id: string): number {
  for (const e of Object.values(EXAMS)) {
    const s = e.subjects.find((x) => x.id === id);
    if (s) return s.hue;
  }
  return 48;
}

export function focusHours(): number {
  return totalFocusSec(store.data.sessions) / 3600;
}

function unlockedIds(hours: number, premium: boolean): Set<string> {
  return new Set(DISTRICTS.filter((d) => districtUnlocked(d, hours, premium)).map((d) => d.id));
}

/** Updates the streak if today just became an active day. */
function touchStreak(d: typeof store.data, now: number): boolean {
  const today = dayKey(now);
  if (!isActive(minutesOn(d.sessions, today), questionsOn(d.questions, today))) return false;
  const r = markActive(d.streak, today);
  d.streak = r.streak;
  return r.earned;
}

/**
 * Ends a focus phase. Sessions under a minute are discarded; 10+ minutes
 * plant a tulip in the current garden unless the session wilted.
 */
export function finishFocus(r: Running, now: number, wilted = false, noTulip = false): FinishResult {
  // A countdown never counts past its planned length (the app may reopen hours later).
  const sec = Math.min(elapsed(r, now), r.planned || MAX_STOPWATCH_SEC);
  const result: FinishResult = { session: null, variety: null, wilted, bulbEarned: false, unlocked: [], goalReached: false };
  if (r.phase !== 'focus' || sec < MIN_LOG_SEC) {
    store.update((d) => {
      d.running = null;
    });
    return result;
  }
  const premium = isPremium(now);
  const hoursBefore = focusHours();
  const before = unlockedIds(hoursBefore, premium);
  const today = dayKey(now);
  const goal = store.data.goals.minutes;
  const minutesBefore = minutesOn(store.data.sessions, today);
  const variety = !wilted && !noTulip && sec >= MIN_TULIP_SEC ? pickVariety(sec / 60, r.id, premium, store.data.collected) : null;
  const session: Session = { id: r.id, at: r.startedAt, sec, subject: r.subject, mode: r.mode, tulip: variety?.id ?? null, garden: store.data.garden, ...(wilted ? { wilted: true } : {}) };
  store.update((d) => {
    d.sessions.push(session);
    if (variety) d.collected[variety.id] = (d.collected[variety.id] ?? 0) + 1;
    d.running = null;
    result.bulbEarned = touchStreak(d, now);
  });
  const after = unlockedIds(focusHours(), premium);
  result.unlocked = [...after].filter((id) => !before.has(id));
  result.session = session;
  result.variety = variety;
  result.goalReached = !wilted && minutesBefore < goal && minutesBefore + sec / 60 >= goal;
  return result;
}

export function addQuestions(subject: string, s: Score, now = Date.now()): boolean {
  let earned = false;
  store.update((d) => {
    d.questions.push({ id: newId('q', now), at: now, subject, d: s.d, y: s.y, b: s.b });
    earned = touchStreak(d, now);
  });
  return earned;
}

export function addMock(kind: string, name: string, scores: Record<string, Score>, at: number): MockResult {
  const m: MockResult = { id: newId('m', Date.now()), at, kind, name, scores };
  store.update((d) => {
    d.mocks.push(m);
    d.mocks.sort((a, b) => a.at - b.at);
  });
  return m;
}

export function removeRecord(kind: 'sessions' | 'questions' | 'mocks', id: string): void {
  store.update((d) => {
    const list = d[kind] as { id: string }[];
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list.splice(i, 1);
    if (kind === 'sessions') {
      // Keep the collection in sync with what is actually planted.
      const counts: Record<string, number> = {};
      for (const s of d.sessions) if (s.tulip) counts[s.tulip] = (counts[s.tulip] ?? 0) + 1;
      d.collected = counts;
    }
  });
}

/** Exam the countdown points to: user override, else the next built-in estimate. */
export function examTarget(now = new Date()): { at: Date; estimated: boolean; custom: boolean } | null {
  const p = profile();
  if (p.examDate) {
    const at = parseLocal(p.examDate);
    if (at.getTime() > now.getTime()) return { at, estimated: false, custom: true };
  }
  const next = nextExamDate(p.exam, p.field, now);
  return next ? { at: parseLocal(next.at), estimated: next.estimated, custom: false } : null;
}

/** Whole days left until the exam day (0 on the day itself). */
export function daysLeft(now = new Date()): number | null {
  const target = examTarget(now);
  if (!target) return null;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(target.at.getFullYear(), target.at.getMonth(), target.at.getDate()).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function streakNow(now = Date.now()): number {
  return currentStreak(store.data.streak, dayKey(now));
}

/** This week's summary for the study code (Monday–Sunday). */
export function weekSummary(now = new Date()): Summary {
  const days = new Set(weekDays(now));
  const d = store.data;
  let sec = 0;
  let tulips = 0;
  for (const s of d.sessions) {
    if (s.wilted || !days.has(dayKey(s.at))) continue;
    sec += s.sec;
    if (s.tulip) tulips++;
  }
  let questions = 0;
  for (const q of d.questions) if (days.has(dayKey(q.at))) questions += q.d + q.y + q.b;
  const { year, week } = isoWeek(now);
  return { name: d.name || 'Tekir', exam: profile().exam, year, week, minutes: Math.floor(sec / 60), questions, streak: streakNow(now.getTime()), tulips };
}

export function myCode(now = new Date()): string {
  return encode(weekSummary(now));
}

export function varietyName(id: string, lang: 'tr' | 'en' | 'de' | 'es'): string {
  return VARIETY_BY_ID.get(id)?.name[lang] ?? id;
}
