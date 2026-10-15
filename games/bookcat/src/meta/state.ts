import { Capacitor } from '@capacitor/core';

/**
 * Persistent player profile. Saved shortly after every change and when the
 * app goes to the background. Native: Capacitor Preferences (survives WebView
 * storage eviction); web: localStorage.
 */
export type BoosterId = 'hint' | 'paw';
export const BOOSTERS: readonly BoosterId[] = ['hint', 'paw'];

/** Minimal snapshot of an unfinished level so the player can resume. */
export interface SavedRun {
  key: string;
  columns: { down: number[]; up: number[] }[];
  stock: number[];
  waste: number[];
  slots: ({ cat: number; count: number; top: number | null } | null)[];
  done: number[];
  movesLeft: number;
  movesUsed: number;
  recycles: number;
  extra: number;
  boosted: boolean;
}

export interface QuestState {
  id: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
}

export interface SaveData {
  v: number;
  coins: number;
  /** Next journey level to play (1-based). */
  level: number;
  levelStars: Record<string, number>;
  totalStars: number;
  boosters: Record<BoosterId, number>;
  removeAds: boolean;
  owned: string[];
  starterOfferUntil: number;
  /** Rare books collected (one per finished chapter). */
  books: number[];
  run: SavedRun | null;
  settings: { sound: boolean; music: boolean; haptics: boolean; lang: string | null; notifications: boolean; bigText: boolean };
  login: { last: string; streak: number; day: number };
  daily: { last: string; streak: number; best: number; results: Record<string, { stars: number; moves: number }> };
  quests: { date: string; list: QuestState[]; chest: boolean };
  freeHints: { date: string; n: number };
  stats: {
    wins: number;
    losses: number;
    moves: number;
    shelved: number;
    categories: number;
    sessions: number;
    firstOpen: number;
    lastOpen: number;
    adsWatched: number;
    purchases: number;
    hintsUsed: number;
    pawsUsed: number;
  };
  tutorial: { done: boolean; tips: string[] };
  ads: { lastInterstitial: number; sinceInterstitial: number };
  review: { lastAsk: number; asks: number };
}

export function defaultSave(now = Date.now()): SaveData {
  return {
    v: 1,
    coins: 200,
    level: 1,
    levelStars: {},
    totalStars: 0,
    boosters: { hint: 3, paw: 2 },
    removeAds: false,
    owned: [],
    starterOfferUntil: 0,
    books: [],
    run: null,
    settings: { sound: true, music: true, haptics: true, lang: null, notifications: true, bigText: false },
    login: { last: '', streak: 0, day: 0 },
    daily: { last: '', streak: 0, best: 0, results: {} },
    quests: { date: '', list: [], chest: false },
    freeHints: { date: '', n: 0 },
    stats: {
      wins: 0, losses: 0, moves: 0, shelved: 0, categories: 0, sessions: 0, firstOpen: now, lastOpen: now, adsWatched: 0, purchases: 0,
      hintsUsed: 0, pawsUsed: 0,
    },
    tutorial: { done: false, tips: [] },
    ads: { lastInterstitial: 0, sinceInterstitial: 0 },
    review: { lastAsk: 0, asks: 0 },
  };
}

export const KEY = 'bookcat.save.v1';

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

/** Repairs anything a corrupted save could break. */
export function sanitize(d: SaveData): SaveData {
  d.coins = Math.max(0, Math.floor(finite(d.coins)));
  d.level = Math.max(1, Math.floor(finite(d.level, 1)));
  for (const b of ['hint', 'paw'] as const) d.boosters[b] = Math.max(0, Math.floor(finite(d.boosters[b])));
  if (!d.levelStars || typeof d.levelStars !== 'object' || Array.isArray(d.levelStars)) d.levelStars = {};
  for (const [k, v] of Object.entries(d.levelStars)) {
    const s = Math.floor(finite(v));
    if (s < 1 || s > 3) delete d.levelStars[k];
    else d.levelStars[k] = s;
  }
  d.totalStars = Object.values(d.levelStars).reduce((a, b) => a + b, 0);
  d.books = Array.isArray(d.books) ? [...new Set(d.books.filter((b) => Number.isInteger(b) && b >= 0))] : [];
  if (d.run && (typeof d.run.key !== 'string' || !Array.isArray(d.run.columns))) d.run = null;
  if (!d.daily.results || typeof d.daily.results !== 'object') d.daily.results = {};
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

  /** Persist without notifying (hot path: every move). */
  quiet(fn: (d: SaveData) => void): void {
    fn(this.data);
    this.scheduleSave(600);
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
    for (const fn of [...this.listeners]) fn();
  }

  async reset(): Promise<void> {
    this.data = defaultSave();
    await this.flush();
    this.emit();
  }
}

export const store = new Store();
