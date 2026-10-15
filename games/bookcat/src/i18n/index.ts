import de from './de';
import en from './en';
import es from './es';
import tr, { type Key } from './tr';
import type { Lang } from '../content/types';

export type { Key };

export const LANG_LIST: { id: Lang; name: string }[] = [
  { id: 'tr', name: 'Türkçe' },
  { id: 'en', name: 'English' },
  { id: 'de', name: 'Deutsch' },
  { id: 'es', name: 'Español' },
];

const TABLES: Record<Lang, Record<Key, string>> = { tr, en, de, es };

let lang: Lang = 'en';

export function detectLang(): Lang {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language ?? 'en'];
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

/** Optional dynamic key (e.g. `product.${id}`); falls back to the given text. */
export function tk(key: string, fallback = key): string {
  return TABLES[lang][key as Key] ?? en[key as Key] ?? fallback;
}

export function num(n: number): string {
  try {
    return new Intl.NumberFormat(lang).format(n);
  } catch {
    return String(n);
  }
}

/** First letter upper-cased with the language's own rules (Turkish i → İ). */
export function cap(s: string): string {
  const loc = lang === 'tr' ? 'tr' : lang;
  return s ? s[0].toLocaleUpperCase(loc) + s.slice(1) : s;
}
