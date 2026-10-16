import de from './de';
import en from './en';
import es from './es';
import tr, { type Key } from './tr';
import type { Lang } from '../core/exams';

export type { Key, Lang };

export const LANG_LIST: { id: Lang; name: string }[] = [
  { id: 'tr', name: 'Türkçe' },
  { id: 'en', name: 'English' },
  { id: 'de', name: 'Deutsch' },
  { id: 'es', name: 'Español' },
];

const TABLES: Record<Lang, Record<Key, string>> = { tr, en, de, es };

let lang: Lang = 'tr';

export function detectLang(): Lang {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language ?? 'tr'];
  for (const l of list) {
    const code = l.toLowerCase().split('-')[0];
    if (code === 'tr' || code === 'en' || code === 'de' || code === 'es') return code;
  }
  return 'en';
}

export function setLang(l: string | null): void {
  lang = l && l in TABLES ? (l as Lang) : detectLang();
  document.documentElement.lang = lang;
}

export function currentLang(): Lang {
  return lang;
}

export function t(key: Key, params?: Record<string, string | number>): string {
  let s = TABLES[lang][key] ?? en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Plural-aware lookup: uses `<key>.one` when n is 1 and the variant exists. */
export function tp(key: Key, n: number, params: Record<string, string | number> = {}): string {
  const one = `${key}.one` as Key;
  return t(n === 1 && one in TABLES[lang] ? one : key, { n: num(n), ...params });
}

/** Dynamic key with fallback. */
export function tk(key: string, fallback = key): string {
  return TABLES[lang][key as Key] ?? en[key as Key] ?? fallback;
}

export function num(n: number, digits = 0): string {
  try {
    return new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);
  } catch {
    return String(n);
  }
}

/** "1 sa 25 dk" / "45 dk" */
export function dur(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return t('common.min', { n: m });
  if (m % 60 === 0) return t('common.h', { h: m / 60 });
  return t('common.hm', { h: Math.floor(m / 60), m: m % 60 });
}

export function dateFmt(d: Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  try {
    return new Intl.DateTimeFormat(lang, opts).format(d);
  } catch {
    return d.toDateString();
  }
}

export function cap(s: string): string {
  const loc = lang === 'tr' ? 'tr' : lang;
  return s ? s[0].toLocaleUpperCase(loc) + s.slice(1) : s;
}

/** Percentage in the language's own style ("%45" in Turkish, "45%" in English). */
export function pct(v: number): string {
  try {
    return new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 }).format(v / 100);
  } catch {
    return `${Math.round(v)}%`;
  }
}
