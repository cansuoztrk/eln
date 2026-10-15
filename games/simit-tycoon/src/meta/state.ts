import { Capacitor } from '@capacitor/core';
import { newRun, type BuyMode, type RunState } from '../core/economy';

/**
 * Persistent player profile. Saved every few seconds while playing and when
 * the app goes to the background. On device: Capacitor Preferences (survives
 * WebView storage eviction); on the web: localStorage.
 */
export interface QuestState {
  id: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
}

export interface SaveData {
  v: number;
  run: RunState;
  /** Current district index = districts completed so far. */
  district: number;
  lale: number;
  /** Tulips ever granted (pending = totalLale(lifetime) − laleEarned). */
  laleEarned: number;
  lifetime: number;
  gold: number;
  buyMode: BuyMode;
  /** ×2 boost end (ms). */
  boostUntil: number;
  /** Last time the game simulated (ms), for offline earnings. */
  lastSeen: number;
  /** Offline cap upgrade level (index into OFFLINE_CAPS_H). */
  offlineLevel: number;
  owned: string[];
  vipUntil: number;
  vipLastDaily: string;
  starterOfferUntil: number;
  settings: { sound: boolean; music: boolean; haptics: boolean; lang: string | null; notifications: boolean };
  login: { last: string; streak: number; day: number };
  quests: { date: string; list: QuestState[]; chest: boolean };
  freeGold: { date: string; n: number };
  achievements: {
    /** Best level ever reached per stand. */
    best: number[];
    /** Best festival ever reached (count). */
    festivals: number;
    claimed: string[];
  };
  stats: {
    taps: number;
    buys: number;
    hires: number;
    recipes: number;
    seagulls: number;
    ferries: number;
    boosts: number;
    warps: number;
    sessions: number;
    firstOpen: number;
    lastOpen: number;
    adsWatched: number;
    purchases: number;
    playSeconds: number;
  };
  tutorial: { step: number; done: boolean; tips: string[] };
  review: { lastAsk: number; asks: number };
}

export function defaultSave(now = Date.now()): SaveData {
  return {
    v: 1,
    run: newRun(0),
    district: 0,
    lale: 0,
    laleEarned: 0,
    lifetime: 0,
    gold: 25,
    buyMode: 1,
    boostUntil: 0,
    lastSeen: now,
    offlineLevel: 0,
    owned: [],
    vipUntil: 0,
    vipLastDaily: '',
    starterOfferUntil: 0,
    settings: { sound: true, music: true, haptics: true, lang: null, notifications: true },
    login: { last: '', streak: 0, day: 0 },
    quests: { date: '', list: [], chest: false },
    freeGold: { date: '', n: 0 },
    achievements: { best: Array<number>(10).fill(0), festivals: 0, claimed: [] },
    stats: { taps: 0, buys: 0, hires: 0, recipes: 0, seagulls: 0, ferries: 0, boosts: 0, warps: 0, sessions: 0, firstOpen: now, lastOpen: now, adsWatched: 0, purchases: 0, playSeconds: 0 },
    tutorial: { step: 0, done: false, tips: [] },
    review: { lastAsk: 0, asks: 0 },
  };
}

const KEY = 'simittycoon.save.v1';

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

/** Repairs anything a corrupted or tampered save could break. */
export function sanitize(d: SaveData): SaveData {
  const finite = (x: unknown, fallback = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : fallback);
  d.gold = Math.max(0, Math.floor(finite(d.gold)));
  d.lale = Math.max(0, finite(d.lale));
  d.laleEarned = Math.max(d.lale, finite(d.laleEarned));
  d.lifetime = Math.max(0, finite(d.lifetime));
  d.district = Math.max(0, Math.floor(finite(d.district)));
  const r = d.run;
  const fresh = newRun(d.district);
  if (!r || !Array.isArray(r.levels) || r.levels.length !== fresh.levels.length) d.run = fresh;
  else {
    r.cash = Math.max(0, finite(r.cash));
    r.earnedRun = Math.max(0, finite(r.earnedRun));
    r.stands = fresh.stands;
    r.levels = r.levels.map((l) => Math.max(0, Math.floor(finite(l))));
    r.levels[0] = Math.max(1, r.levels[0]);
    r.progress = (Array.isArray(r.progress) ? r.progress : fresh.progress).map((p) => Math.min(0.999, Math.max(0, finite(p))));
    r.managers = Array.isArray(r.managers) && r.managers.length === fresh.managers.length ? r.managers.map(Boolean) : fresh.managers;
    r.running = Array.isArray(r.running) && r.running.length === fresh.running.length ? r.running.map(Boolean) : fresh.running;
    r.upgrades = Array.isArray(r.upgrades) ? r.upgrades.filter((u) => typeof u === 'string') : [];
  }
  if (![1, 10, 100, 'next', 'max'].includes(d.buyMode as never)) d.buyMode = 1;
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

  /** Persist soon without notifying (hot path: the economy tick). */
  touch(): void {
    this.scheduleSave(2000);
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
      // Storage can be unavailable (private mode); the game keeps working in memory.
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(): void {
    for (const fn of this.listeners) fn();
  }

  reset(): void {
    this.data = defaultSave();
    this.emit();
    void this.flush();
  }
}

export const store = new Store();
