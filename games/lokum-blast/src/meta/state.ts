import { Capacitor } from '@capacitor/core';

/**
 * Persistent player profile. Everything the player owns or has achieved lives
 * here and is saved after every meaningful change. On device we use
 * Capacitor Preferences (survives WebView storage eviction), on the web
 * localStorage.
 */
export type BoosterId = 'undo' | 'hammer' | 'refresh' | 'bomb';
export const BOOSTERS: readonly BoosterId[] = ['undo', 'hammer', 'refresh', 'bomb'];

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
  lives: number;
  livesTs: number;
  unlimitedLivesUntil: number;
  level: number;
  stars: number;
  totalStars: number;
  levelStars: Record<string, number>;
  best: number;
  boosters: Record<BoosterId, number>;
  themes: string[];
  theme: string;
  removeAds: boolean;
  vipUntil: number;
  vipLastDaily: string;
  owned: string[];
  starterOfferUntil: number;
  settings: { sound: boolean; music: boolean; haptics: boolean; lang: string | null; notifications: boolean };
  login: { last: string; streak: number; day: number };
  daily: { lastWin: string; streak: number };
  wheel: { lastFree: string; adDate: string; adSpins: number };
  gifts: { date: string; n: number };
  quests: { date: string; list: QuestState[]; chest: boolean };
  bazaar: { district: number; done: number[] };
  stats: {
    games: number;
    lines: number;
    bestCombo: number;
    levelsWon: number;
    sessions: number;
    firstOpen: number;
    lastOpen: number;
    adsWatched: number;
    purchases: number;
  };
  tutorial: { classic: boolean; journey: boolean; boosters: boolean };
  ads: { lastInterstitial: number; sinceInterstitial: number };
  classicSave: unknown | null;
}

export function defaultSave(now = Date.now()): SaveData {
  return {
    v: 1,
    coins: 300,
    lives: 5,
    livesTs: now,
    unlimitedLivesUntil: 0,
    level: 1,
    stars: 0,
    totalStars: 0,
    levelStars: {},
    best: 0,
    boosters: { undo: 2, hammer: 2, refresh: 1, bomb: 1 },
    themes: ['lokum'],
    theme: 'lokum',
    removeAds: false,
    vipUntil: 0,
    vipLastDaily: '',
    owned: [],
    starterOfferUntil: 0,
    settings: { sound: true, music: true, haptics: true, lang: null, notifications: true },
    login: { last: '', streak: 0, day: 0 },
    daily: { lastWin: '', streak: 0 },
    wheel: { lastFree: '', adDate: '', adSpins: 0 },
    gifts: { date: '', n: 0 },
    quests: { date: '', list: [], chest: false },
    bazaar: { district: 0, done: [] },
    stats: { games: 0, lines: 0, bestCombo: 0, levelsWon: 0, sessions: 0, firstOpen: now, lastOpen: now, adsWatched: 0, purchases: 0 },
    tutorial: { classic: false, journey: false, boosters: false },
    ads: { lastInterstitial: 0, sinceInterstitial: 0 },
    classicSave: null,
  };
}

const KEY = 'lokumblast.save.v1';

/** Deep-merges saved data onto defaults so new fields appear after updates. */
function merge<T>(base: T, saved: unknown): T {
  if (saved === null || typeof saved !== 'object' || Array.isArray(saved)) return (saved ?? base) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v) ? merge(b, v) : v;
  }
  return out as T;
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
        this.data = merge(defaultSave(), JSON.parse(raw));
      } catch {
        this.data = defaultSave();
      }
    }
  }

  /** Mutate + persist + notify. */
  update(fn: (d: SaveData) => void): void {
    fn(this.data);
    this.emit();
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flush();
    }, 250);
  }

  async flush(): Promise<void> {
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
