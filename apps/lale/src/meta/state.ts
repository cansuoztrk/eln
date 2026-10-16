import { Capacitor } from '@capacitor/core';
import { EXAMS, type ExamId, type YksField } from '../core/exams';
import type { Summary } from '../core/friends';
import type { MockResult, QuestionLog, Session } from '../core/records';
import { EMPTY_STREAK, type Streak } from '../core/streak';
import { DEFAULT_POMODORO, type Mode, type PomodoroSettings, type Running } from '../core/timer';

/**
 * Everything Lale knows lives on the device: no account, no server, no
 * analytics IDs. Native: Capacitor Preferences; web: localStorage.
 */
export interface Profile {
  exam: ExamId;
  field: YksField | null;
  /** User override of the exam date ('YYYY-MM-DDTHH:mm'), else the built-in estimate. */
  examDate: string | null;
}

export interface Friend {
  code: string;
  added: number;
  summary: Summary;
}

export type Theme = 'auto' | 'light' | 'dark';

export interface SaveData {
  v: number;
  onboarded: boolean;
  name: string;
  profiles: Profile[];
  active: number;
  goals: { minutes: number; questions: number };
  timer: { mode: Mode; minutes: number; subject: string; strict: boolean; pomodoro: PomodoroSettings };
  running: Running | null;
  sessions: Session[];
  questions: QuestionLog[];
  mocks: MockResult[];
  collected: Record<string, number>;
  garden: string;
  streak: Streak;
  friends: Friend[];
  premium: { owned: string[]; subscription: boolean; seasonUntil: number };
  settings: {
    sound: boolean;
    haptics: boolean;
    notifications: boolean;
    reminder: string;
    theme: Theme;
    lang: string | null;
    ambient: string | null;
    volume: number;
    awake: boolean;
  };
  stats: { opens: number; firstOpen: number; lastOpen: number };
  review: { asks: number; lastAsk: number };
  tips: string[];
}

const KEY = 'lale.save.v1';
/** Keep the save small: very old raw logs are summarised by the stats screens anyway. */
const MAX_SESSIONS = 5000;
const MAX_QUESTIONS = 5000;
const MAX_MOCKS = 600;

export function defaultSave(): SaveData {
  const now = Date.now();
  return {
    v: 1,
    onboarded: false,
    name: '',
    profiles: [{ exam: 'yks', field: 'say', examDate: null }],
    active: 0,
    goals: { minutes: 180, questions: 100 },
    timer: { mode: 'pomodoro', minutes: 25, subject: '', strict: false, pomodoro: { ...DEFAULT_POMODORO } },
    running: null,
    sessions: [],
    questions: [],
    mocks: [],
    collected: {},
    garden: 'gulhane',
    streak: { ...EMPTY_STREAK },
    friends: [],
    premium: { owned: [], subscription: false, seasonUntil: 0 },
    settings: { sound: true, haptics: true, notifications: false, reminder: '19:00', theme: 'auto', lang: null, ambient: null, volume: 0.6, awake: true },
    stats: { opens: 0, firstOpen: now, lastOpen: now },
    review: { asks: 0, lastAsk: 0 },
    tips: [],
  };
}

/** Deep-merges a saved blob over defaults so new fields get sane values. */
function merge<T>(base: T, saved: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(saved) ? saved : base) as T;
  if (base && typeof base === 'object') {
    const out = { ...(base as Record<string, unknown>) };
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
        out[k] = k in out ? merge(out[k], v) : v;
      }
    }
    return out as T;
  }
  return (saved === undefined || saved === null || typeof saved !== typeof base ? base : saved) as T;
}

const finite = (n: unknown, d = 0) => (typeof n === 'number' && Number.isFinite(n) ? n : d);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Repairs anything a corrupted or hand-edited save could contain. */
export function sanitize(d: SaveData): SaveData {
  d.profiles = d.profiles.filter((p) => p && p.exam in EXAMS).map((p) => ({ exam: p.exam, field: p.exam === 'yks' && ['say', 'ea', 'soz', 'dil'].includes(p.field as string) ? p.field : null, examDate: typeof p.examDate === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.examDate) ? p.examDate : null }));
  if (!d.profiles.length) d.profiles = defaultSave().profiles;
  d.active = clamp(Math.floor(finite(d.active)), 0, d.profiles.length - 1);
  d.goals.minutes = clamp(Math.round(finite(d.goals.minutes, 180)), 15, 960);
  d.goals.questions = clamp(Math.round(finite(d.goals.questions, 100)), 0, 2000);
  d.timer.minutes = clamp(Math.round(finite(d.timer.minutes, 25)), 5, 180);
  const p = d.timer.pomodoro;
  p.focus = clamp(Math.round(finite(p.focus, 25)), 10, 90);
  p.short = clamp(Math.round(finite(p.short, 5)), 1, 30);
  p.long = clamp(Math.round(finite(p.long, 15)), 5, 60);
  p.every = clamp(Math.round(finite(p.every, 4)), 2, 8);
  if (!['pomodoro', 'timer', 'stopwatch'].includes(d.timer.mode)) d.timer.mode = 'pomodoro';
  if (d.running && (typeof d.running.startedAt !== 'number' || !Number.isFinite(d.running.startedAt))) d.running = null;
  const okNum = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  d.sessions = d.sessions.filter((s) => s && okNum(s.at) && okNum(s.sec) && typeof s.subject === 'string').slice(-MAX_SESSIONS);
  d.questions = d.questions.filter((q) => q && okNum(q.at) && okNum(q.d) && okNum(q.y) && okNum(q.b)).slice(-MAX_QUESTIONS);
  d.mocks = d.mocks.filter((m) => m && okNum(m.at) && m.scores && typeof m.scores === 'object').slice(-MAX_MOCKS);
  for (const [k, v] of Object.entries(d.collected)) if (!okNum(v)) delete d.collected[k];
  d.friends = d.friends.filter((f) => f && typeof f.code === 'string' && f.summary).slice(-100);
  d.streak.count = Math.max(0, Math.floor(finite(d.streak.count)));
  d.streak.bulbs = clamp(Math.floor(finite(d.streak.bulbs)), 0, 2);
  d.settings.volume = clamp(finite(d.settings.volume, 0.6), 0, 1);
  if (!['auto', 'light', 'dark'].includes(d.settings.theme)) d.settings.theme = 'auto';
  if (!/^\d{2}:\d{2}$/.test(d.settings.reminder)) d.settings.reminder = '19:00';
  d.name = String(d.name ?? '').slice(0, 14);
  return d;
}

type Listener = () => void;

class Store {
  data: SaveData = defaultSave();
  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  async load(): Promise<void> {
    let raw: string | null = null;
    try {
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        raw = (await Preferences.get({ key: KEY })).value;
      } else {
        raw = localStorage.getItem(KEY);
      }
    } catch {
      raw = null;
    }
    if (raw) this.data = parseSave(raw) ?? defaultSave();
  }

  update(fn: (d: SaveData) => void): void {
    fn(this.data);
    this.emit();
    this.scheduleSave();
  }

  /** Persist without re-rendering (timer ticks). */
  quiet(fn: (d: SaveData) => void): void {
    fn(this.data);
    this.scheduleSave(800);
  }

  private scheduleSave(ms = 250): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flush();
    }, ms);
  }

  async flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const raw = JSON.stringify(this.data);
    try {
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: KEY, value: raw });
      } else {
        localStorage.setItem(KEY, raw);
      }
    } catch {
      // Storage may be unavailable (private mode); keep working in memory.
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(): void {
    for (const fn of [...this.listeners]) fn();
  }

  /** Replaces all data (import / reset). */
  async replace(d: SaveData): Promise<void> {
    this.data = d;
    await this.flush();
    this.emit();
  }
}

export function parseSave(raw: string): SaveData | null {
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    return sanitize(merge(defaultSave(), obj));
  } catch {
    return null;
  }
}

export const store = new Store();

export function profile(): Profile {
  return store.data.profiles[store.data.active];
}

/** Active Lale Bahçıvan entitlement (subscription, lifetime or an unexpired season pass). */
export function isPremium(now = Date.now()): boolean {
  const p = store.data.premium;
  return p.subscription || p.owned.includes('lale_lifetime') || p.seasonUntil > now;
}
