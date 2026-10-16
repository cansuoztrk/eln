import { Capacitor } from '@capacitor/core';
import { CHAPTERS } from './chapters';

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
  /** Fingerprint of the level layout (see runSig); '' for saves made before it existed. */
  sig: string;
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
  /** Rewarded videos and coin purchases of +10 moves in this run (per-level cap and price steps). */
  moveAds: number;
  moveBuys: number;
  /** Shelving progress already counted for quests and stats, so undo + redo never counts twice. */
  credited?: { words: number; cats: number[] };
}

/** Journey and Daily Shelf keep separate runs, so playing one never wipes the other. */
export type RunSlot = 'journey' | 'daily';

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
  runs: Record<RunSlot, SavedRun | null>;
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
  /**
   * Store transactions already granted (ledger), so a purchase is delivered
   * exactly once even if the app dies mid-purchase or the payment clears
   * later. Transactions older than `since` belong to an earlier install (or
   * to a save from before the ledger) and are never granted again.
   */
  iap: { since: number; granted: string[] };
}

export function defaultSave(now = Date.now()): SaveData {
  return {
    v: 2,
    coins: 200,
    level: 1,
    levelStars: {},
    totalStars: 0,
    boosters: { hint: 3, paw: 2 },
    removeAds: false,
    owned: [],
    starterOfferUntil: 0,
    books: [],
    runs: { journey: null, daily: null },
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
    iap: { since: now, granted: [] },
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
const count = (x: unknown) => Math.max(0, Math.floor(finite(x)));
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const isInt = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0;
const intList = (x: unknown): x is number[] => Array.isArray(x) && x.every(isInt);

/**
 * Puts the defaults back wherever a save holds null or a value of the wrong
 * type (a corrupt or hand-edited save must never throw), keeping every valid
 * field and every extra key. Nullable defaults (runs, settings.lang) are
 * checked by sanitize itself.
 */
function repair(def: unknown, val: unknown): unknown {
  if (def === null) return val;
  if (Array.isArray(def)) return Array.isArray(val) ? val : def;
  if (isObj(def)) {
    if (!isObj(val)) return def;
    const out: Record<string, unknown> = { ...val };
    for (const [k, dv] of Object.entries(def)) out[k] = repair(dv, out[k]);
    return out;
  }
  if (typeof def === 'number') return typeof val === 'number' && Number.isFinite(val) ? val : def;
  return typeof val === typeof def ? val : def;
}

/** Shape check of a saved run; whether it fits its level is checked when the level opens (runFits). */
function cleanRun(r: unknown, prefix: 'L' | 'D'): SavedRun | null {
  if (!isObj(r) || typeof r.key !== 'string' || !r.key.startsWith(prefix)) return null;
  const cols = r.columns;
  if (!Array.isArray(cols) || !cols.every((c) => isObj(c) && intList(c.down) && intList(c.up))) return null;
  if (!intList(r.stock) || !intList(r.waste) || !intList(r.done)) return null;
  const slotOk = (x: unknown) => x === null || (isObj(x) && isInt(x.cat) && isInt(x.count) && (x.top === null || isInt(x.top)));
  if (!Array.isArray(r.slots) || !r.slots.every(slotOk)) return null;
  if (![r.movesLeft, r.movesUsed, r.recycles].every(isInt)) return null;
  const credited = isObj(r.credited) && isInt(r.credited.words) && intList(r.credited.cats) ? { words: r.credited.words, cats: r.credited.cats } : undefined;
  return {
    key: r.key,
    sig: typeof r.sig === 'string' ? r.sig : '',
    columns: cols as SavedRun['columns'],
    stock: r.stock,
    waste: r.waste,
    slots: r.slots as SavedRun['slots'],
    done: r.done,
    movesLeft: r.movesLeft as number,
    movesUsed: r.movesUsed as number,
    recycles: r.recycles as number,
    extra: count(r.extra),
    boosted: r.boosted === true,
    moveAds: count(r.moveAds),
    moveBuys: count(r.moveBuys),
    ...(credited ? { credited } : {}),
  };
}

/**
 * Repairs anything a corrupted save could break and migrates older formats:
 *  - v1 kept one `run` for both modes: it moves to runs.journey (L…) or
 *    runs.daily (D…), without a layout signature (checked when it is resumed)
 *    and with no +moves bought or watched yet;
 *  - saves without the purchase ledger get one starting now (see SaveData.iap).
 */
export function sanitize(input: SaveData): SaveData {
  const def = defaultSave();
  if (!isObj(input)) return def;
  const legacy = input as unknown as Record<string, unknown>;
  const d = repair(def, input) as SaveData;
  d.coins = count(d.coins);
  d.level = Math.max(1, Math.floor(finite(d.level, 1)));
  for (const b of BOOSTERS) d.boosters[b] = count(d.boosters[b]);
  for (const [k, v] of Object.entries(d.levelStars)) {
    const s = Math.floor(finite(v));
    if (s < 1 || s > 3) delete d.levelStars[k];
    else d.levelStars[k] = s;
  }
  d.totalStars = Object.values(d.levelStars).reduce((a, b) => a + b, 0);
  d.books = [...new Set(d.books.filter((b) => isInt(b) && b < CHAPTERS.length))];
  d.owned = [...new Set(d.owned.filter((x) => typeof x === 'string'))];
  if (typeof d.settings.lang !== 'string') d.settings.lang = null;
  d.login.day = isInt(d.login.day) && d.login.day < 7 ? d.login.day : 0;
  d.login.streak = count(d.login.streak);
  for (const [k, v] of Object.entries(d.daily.results)) {
    if (!isObj(v) || !Number.isFinite(v.stars) || !Number.isFinite(v.moves)) delete d.daily.results[k];
  }
  const questOk = (q: unknown) => isObj(q) && typeof q.id === 'string' && [q.target, q.progress, q.reward].every((x) => Number.isFinite(x)) && typeof q.claimed === 'boolean';
  if (!d.quests.list.every(questOk)) d.quests = def.quests;
  d.tutorial.tips = d.tutorial.tips.filter((x) => typeof x === 'string');
  // Runs: v1 had a single slot shared by journey and daily.
  const old = legacy.run;
  if (isObj(old) && typeof old.key === 'string') {
    if (old.key.startsWith('L') && !d.runs.journey) d.runs.journey = old as unknown as SavedRun;
    else if (old.key.startsWith('D') && !d.runs.daily) d.runs.daily = old as unknown as SavedRun;
  }
  delete (d as unknown as Record<string, unknown>).run;
  d.runs = { journey: cleanRun(d.runs.journey, 'L'), daily: cleanRun(d.runs.daily, 'D') };
  d.iap.granted = [...new Set(d.iap.granted.filter((x) => typeof x === 'string' && x.length > 0))];
  d.v = def.v;
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
        // Beyond repair: keep the raw text for support before the next save replaces it.
        this.data = defaultSave();
        await this.write(`${KEY}.bad`, raw);
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
    await this.write(KEY, JSON.stringify(this.data));
  }

  private async write(key: string, raw: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key, value: raw });
      } else {
        localStorage.setItem(key, raw);
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

  /** "Reset progress": starts over but keeps what was paid for, the settings and the purchase ledger. */
  async reset(): Promise<void> {
    const old = this.data;
    this.data = { ...defaultSave(), removeAds: old.removeAds, owned: [...old.owned], settings: { ...old.settings }, iap: { since: old.iap.since, granted: [...old.iap.granted] } };
    await this.flush();
    this.emit();
  }
}

export const store = new Store();
