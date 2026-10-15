import type { Lang } from '../core/types';
import de from './de';
import en from './en';
import tr, { type Key } from './tr';

export type { Key };

export const LANGS: { id: Lang; name: string }[] = [
  { id: 'tr', name: 'Türkçe' },
  { id: 'en', name: 'English' },
  { id: 'de', name: 'Deutsch' },
];

const TABLES: Record<Lang, Record<Key, string>> = { tr, en, de };

let lang: Lang = 'tr';

export function detectLang(): Lang {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language ?? 'en'];
  for (const l of list) {
    const code = l.toLowerCase().split('-')[0];
    if (code === 'tr' || code === 'en' || code === 'de') return code;
  }
  return 'en';
}

export function setLang(l: Lang | null): void {
  lang = l && TABLES[l] ? l : detectLang();
  document.documentElement.lang = lang;
}

export function currentLang(): Lang {
  return lang;
}

/** Locale tag used for Intl formatting. */
export function locale(): string {
  return lang === 'tr' ? 'tr-TR' : lang === 'de' ? 'de-DE' : 'en-US';
}

function fill(s: string, params?: Record<string, string | number>): string {
  if (!params) return s;
  for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export function t(key: Key, params?: Record<string, string | number>): string {
  return fill(TABLES[lang][key] ?? tr[key] ?? key, params);
}

/** Plural-aware lookup: uses `${key}.one` for n === 1 when that key exists. */
export function tn(key: Key, n: number, params: Record<string, string | number> = {}): string {
  const one = `${key}.one` as Key;
  const table = TABLES[lang];
  const s = n === 1 && table[one] ? table[one] : table[key];
  return fill(s ?? key, { n: num(n), ...params });
}

/** Optional key (dynamic ids like `meal.${id}`); falls back to the id. */
export function tk(key: string, params?: Record<string, string | number>): string {
  const s = TABLES[lang][key as Key] ?? tr[key as Key];
  return s ? fill(s, params) : key;
}

export function num(n: number, digits = 0): string {
  try {
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);
  } catch {
    return String(Math.round(n * 10 ** digits) / 10 ** digits);
  }
}

export function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale(), opts).format(d);
  } catch {
    return d.toDateString();
  }
}

export function fmtTime(d: Date | number): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  return fmtDate(x, { hour: '2-digit', minute: '2-digit', hour12: lang === 'en' });
}

/** Hours and minutes, e.g. "16 sa 05 dk". */
export function hm(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return t('time.hm', { h, m: String(m).padStart(2, '0') });
}

/** Clock style h:mm:ss for running timers. */
export function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
