import { Capacitor } from '@capacitor/core';
import { emptyDay } from '../core/diary';
import type { DayLog, Food, Lang, Nutrients, Profile, Targets } from '../core/types';
import type { Outfit } from '../ui/tekir';

/**
 * Everything Lokma knows lives on the device (no account): profile, diary,
 * weights, fasting history and settings. Native: Capacitor Preferences
 * (survives WebView storage eviction); web: localStorage.
 */

export type FastPlanId = '12:12' | '14:10' | '16:8' | '18:6' | '20:4' | 'omad' | 'ramadan';

export interface FastRecord {
  start: number;
  end: number;
  plan: FastPlanId;
  goalH: number;
}

export interface RecipeItem extends Nutrients {
  name: string;
  foodId?: string;
  g: number;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  items: RecipeItem[];
  created: number;
}

export interface Reminders {
  meals: boolean;
  water: boolean;
  weighIn: boolean;
  fasting: boolean;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface SaveData {
  v: number;
  onboarded: boolean;
  /** How Tekir greets the user (optional). */
  name: string;
  profile: Profile | null;
  targets: Targets | null;
  /** Pro users can override the computed targets. */
  customTargets: boolean;
  days: Record<string, DayLog>;
  weights: { d: string; kg: number }[];
  favorites: string[];
  /** Most recent first; food ids or custom food ids. */
  recent: string[];
  customFoods: Food[];
  recipes: Recipe[];
  fasting: { plan: FastPlanId; start: number | null; history: FastRecord[] };
  ramadan: { city: string | null };
  /** Entitlement cache; the store/RevenueCat is the source of truth. */
  pro: { until: number; product: string | null };
  ai: { used: number; consent: number; bonus: number; lastBonusStreak: number };
  outfit: Outfit;
  karne: { seen: string[] };
  settings: {
    lang: Lang | null;
    theme: 'system' | 'light' | 'dark';
    units: 'metric' | 'imperial';
    haptics: boolean;
    sound: boolean;
    notifications: boolean;
    reminders: Reminders;
    waterGlassMl: number;
  };
  stats: { sessions: number; firstOpen: number; lastOpen: number; logs: number; aiScans: number; barcodes: number; bestStreak: number };
  review: { lastAsk: number; asks: number };
  paywall: { lastShown: number; shows: number; trialOffered: boolean };
}

export function defaultSave(now = Date.now()): SaveData {
  return {
    v: 1,
    onboarded: false,
    name: '',
    profile: null,
    targets: null,
    customTargets: false,
    days: {},
    weights: [],
    favorites: [],
    recent: [],
    customFoods: [],
    recipes: [],
    fasting: { plan: '16:8', start: null, history: [] },
    ramadan: { city: null },
    pro: { until: 0, product: null },
    ai: { used: 0, consent: 0, bonus: 0, lastBonusStreak: 0 },
    outfit: 'chef',
    karne: { seen: [] },
    settings: {
      lang: null,
      theme: 'system',
      units: 'metric',
      haptics: true,
      sound: true,
      notifications: true,
      reminders: { meals: true, water: true, weighIn: true, fasting: true, breakfast: '08:30', lunch: '12:30', dinner: '19:00' },
      waterGlassMl: 200,
    },
    stats: { sessions: 0, firstOpen: now, lastOpen: now, logs: 0, aiScans: 0, barcodes: 0, bestStreak: 0 },
    review: { lastAsk: 0, asks: 0 },
    paywall: { lastShown: 0, shows: 0, trialOffered: false },
  };
}

export const KEY = 'lokma.save.v1';

/** Deep-merges saved data onto defaults so new fields appear after updates. */
export function merge<T>(base: T, saved: unknown): T {
  if (saved === null || typeof saved !== 'object' || Array.isArray(saved)) return (saved ?? base) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v) ? merge(b, v) : v;
  }
  return out as T;
}

const finite = (x: unknown, fallback = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : fallback);
const nonNeg = (x: unknown) => Math.max(0, finite(x));

/** Repairs anything a corrupted save (or a bad import) could break. */
export function sanitize(d: SaveData): SaveData {
  if (!d.days || typeof d.days !== 'object' || Array.isArray(d.days)) d.days = {};
  for (const [k, day] of Object.entries(d.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !day || typeof day !== 'object') {
      delete d.days[k];
      continue;
    }
    const clean = { ...emptyDay(), ...day } as DayLog;
    clean.waterMl = nonNeg(clean.waterMl);
    clean.tea = Math.floor(nonNeg(clean.tea));
    clean.teaSugar = Math.floor(nonNeg(clean.teaSugar));
    clean.entries = (Array.isArray(clean.entries) ? clean.entries : [])
      .filter((e) => e && typeof e === 'object' && typeof e.name === 'string')
      .map((e) => ({ ...e, kcal: nonNeg(e.kcal), p: nonNeg(e.p), c: nonNeg(e.c), f: nonNeg(e.f), g: nonNeg(e.g), qty: nonNeg(e.qty) || 1 }));
    if (clean.weightKg !== undefined && !(finite(clean.weightKg) > 0)) delete clean.weightKg;
    d.days[k] = clean;
  }
  d.weights = (Array.isArray(d.weights) ? d.weights : []).filter((w) => w && typeof w.d === 'string' && finite(w.kg) > 0);
  for (const k of ['favorites', 'recent'] as const) d[k] = (Array.isArray(d[k]) ? d[k] : []).filter((x) => typeof x === 'string');
  d.recent = d.recent.slice(0, 40);
  d.customFoods = Array.isArray(d.customFoods) ? d.customFoods.filter((f) => f && typeof f.id === 'string' && f.per100) : [];
  d.recipes = Array.isArray(d.recipes) ? d.recipes.filter((r) => r && typeof r.id === 'string' && Array.isArray(r.items)) : [];
  if (!d.fasting || !Array.isArray(d.fasting.history)) d.fasting = defaultSave().fasting;
  d.fasting.history = d.fasting.history.filter((f) => finite(f.start) > 0 && finite(f.end) >= finite(f.start)).slice(-400);
  if (d.fasting.start !== null && !(finite(d.fasting.start) > 0)) d.fasting.start = null;
  d.name = typeof d.name === 'string' ? d.name.slice(0, 40) : '';
  d.ai.used = Math.floor(nonNeg(d.ai.used));
  d.ai.bonus = Math.floor(nonNeg(d.ai.bonus));
  d.pro.until = nonNeg(d.pro.until);
  if (d.targets) {
    for (const k of ['kcal', 'p', 'c', 'f', 'fiber', 'waterMl'] as const) d.targets[k] = nonNeg(d.targets[k]);
    if (d.targets.kcal < 800) d.targets = null;
  }
  if (d.onboarded && (!d.profile || !d.targets)) d.onboarded = false;
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
    if (raw) {
      try {
        this.data = sanitize(merge(defaultSave(), JSON.parse(raw)));
      } catch {
        this.data = defaultSave();
      }
    }
  }

  /** Mutate + notify + persist soon. */
  update(fn: (d: SaveData) => void): void {
    fn(this.data);
    this.emit();
    this.scheduleSave();
  }

  private scheduleSave(ms = 300): void {
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
      // Storage can be unavailable (private mode); the app keeps working in memory.
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of [...this.listeners]) fn();
  }

  async reset(): Promise<void> {
    this.data = defaultSave();
    await this.flush();
    this.emit();
  }

  /** Replaces all data (import / restore). */
  async replace(next: unknown): Promise<boolean> {
    try {
      this.data = sanitize(merge(defaultSave(), next));
      await this.flush();
      this.emit();
      return true;
    } catch {
      return false;
    }
  }
}

export const store = new Store();

export function day(key: string): DayLog {
  return store.data.days[key] ?? emptyDay();
}

/** Mutates (creating if needed) the log for a day inside a store.update. */
export function ensureDay(d: SaveData, key: string): DayLog {
  if (!d.days[key]) d.days[key] = emptyDay();
  return d.days[key];
}
