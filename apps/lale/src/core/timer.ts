/**
 * Focus timer driven purely by timestamps, so no time is ever lost when the
 * app is backgrounded, the screen locks or the WebView is killed: the running
 * session is persisted and re-derived from `Date.now()` on resume.
 *
 * Modes:
 *  - pomodoro:  focus blocks with short breaks (long break every 4th)
 *  - timer:     a single countdown of any length
 *  - stopwatch: counts up until the student stops (kronometre)
 *
 * Strict mode ("Sıkı mod"): leaving the app for longer than the grace period
 * wilts the tulip, as a gentle accountability device. Off by default.
 */
export type Mode = 'pomodoro' | 'timer' | 'stopwatch';
export type Phase = 'focus' | 'break';

export interface Running {
  id: string;
  mode: Mode;
  phase: Phase;
  subject: string;
  /** Planned seconds for countdown phases; 0 for the stopwatch. */
  planned: number;
  startedAt: number;
  pausedAt: number | null;
  pausedTotal: number;
  strict: boolean;
  /** When the app went to the background (strict mode bookkeeping). */
  leftAt: number | null;
  /** Completed focus blocks in the current pomodoro cycle. */
  cycle: number;
}

export interface PomodoroSettings {
  focus: number;
  short: number;
  long: number;
  /** Focus blocks before a long break. */
  every: number;
}

export const DEFAULT_POMODORO: PomodoroSettings = { focus: 25, short: 5, long: 15, every: 4 };
/** Seconds the app may be in the background in strict mode before the tulip wilts. */
export const STRICT_GRACE_SEC = 10;
/** Shortest focus that counts as study time / plants a tulip. */
export const MIN_LOG_SEC = 60;
export const MIN_TULIP_SEC = 10 * 60;
/** A forgotten stopwatch stops counting after four hours. */
export const MAX_STOPWATCH_SEC = 4 * 3600;

export function start(opts: { mode: Mode; subject: string; minutes: number; strict: boolean; now: number; id: string; cycle?: number; phase?: Phase }): Running {
  return {
    id: opts.id,
    mode: opts.mode,
    phase: opts.phase ?? 'focus',
    subject: opts.subject,
    planned: opts.mode === 'stopwatch' && (opts.phase ?? 'focus') === 'focus' ? 0 : Math.round(opts.minutes * 60),
    startedAt: opts.now,
    pausedAt: null,
    pausedTotal: 0,
    strict: opts.strict,
    leftAt: null,
    cycle: opts.cycle ?? 0,
  };
}

export function elapsed(r: Running, now: number): number {
  const end = r.pausedAt ?? now;
  return Math.max(0, Math.floor((end - r.startedAt - r.pausedTotal) / 1000));
}

export function remaining(r: Running, now: number): number {
  return r.planned ? Math.max(0, r.planned - elapsed(r, now)) : 0;
}

/** 0..1 progress of a countdown; for the stopwatch, progress toward the next tulip tier. */
export function progress(r: Running, now: number): number {
  if (r.planned) return Math.min(1, elapsed(r, now) / r.planned);
  return Math.min(1, elapsed(r, now) / (90 * 60));
}

export function isDone(r: Running, now: number): boolean {
  return r.planned > 0 && remaining(r, now) === 0;
}

export function pause(r: Running, now: number): Running {
  return r.pausedAt ? r : { ...r, pausedAt: now };
}

export function resume(r: Running, now: number): Running {
  if (!r.pausedAt) return r;
  return { ...r, pausedTotal: r.pausedTotal + (now - r.pausedAt), pausedAt: null };
}

/** The app went to the background. */
export function leave(r: Running, now: number): Running {
  return r.leftAt ? r : { ...r, leftAt: now };
}

/**
 * The app came back. Returns `wilted: true` when strict mode was broken
 * (only focus phases can wilt, and paused sessions never do).
 */
export function comeBack(r: Running, now: number): { running: Running; wilted: boolean } {
  const away = r.leftAt ? (now - r.leftAt) / 1000 : 0;
  const finishedWhileAway = r.planned > 0 && r.leftAt !== null && r.startedAt + r.pausedTotal + r.planned * 1000 <= r.leftAt + STRICT_GRACE_SEC * 1000;
  const wilted = r.strict && r.phase === 'focus' && !r.pausedAt && away > STRICT_GRACE_SEC && !finishedWhileAway;
  return { running: { ...r, leftAt: null }, wilted };
}

/** What follows a finished phase in pomodoro mode. */
export function nextPomodoro(r: Running, p: PomodoroSettings): { phase: Phase; minutes: number; cycle: number } {
  if (r.phase === 'focus') {
    const cycle = r.cycle + 1;
    return cycle % p.every === 0 ? { phase: 'break', minutes: p.long, cycle } : { phase: 'break', minutes: p.short, cycle };
  }
  return { phase: 'focus', minutes: p.focus, cycle: r.cycle };
}

/** Expected end time of a countdown phase (for the completion notification). */
export function endsAt(r: Running): number | null {
  if (!r.planned || r.pausedAt) return null;
  return r.startedAt + r.pausedTotal + r.planned * 1000;
}

/** mm:ss or h:mm:ss */
export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
}
