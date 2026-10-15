import en, { type Key } from './en';
import tr from './tr';
import de from './de';
import es from './es';
import fr from './fr';
import pt from './pt';

export type { Key };

export const LANGS = [
  { id: 'tr', name: 'Türkçe' },
  { id: 'en', name: 'English' },
  { id: 'de', name: 'Deutsch' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
  { id: 'pt', name: 'Português' },
] as const;

const TABLES: Record<string, Partial<Record<Key, string>>> = { en, tr, de, es, fr, pt };

let lang = 'en';

export function detectLang(): string {
  const nav = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase();
  const code = nav.split('-')[0];
  return TABLES[code] ? code : 'en';
}

export function setLang(l: string | null): void {
  lang = l && TABLES[l] ? l : detectLang();
  document.documentElement.lang = lang;
}

export function currentLang(): string {
  return lang;
}

export function t(key: Key, params?: Record<string, string | number>): string {
  let s = TABLES[lang]?.[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

/** Locale-aware number formatting (1.500 in TR, 1,500 in EN). */
export function num(n: number): string {
  try {
    return new Intl.NumberFormat(lang).format(n);
  } catch {
    return String(n);
  }
}

export function duration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? t('time.h', { h, m }) : t('time.m', { m, s: String(s).padStart(2, '0') });
}
