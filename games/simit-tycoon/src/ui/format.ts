import { formatBig } from '../core/economy';
import { currentLang, t } from '../i18n';

/** Big money with the locale's decimal separator (1,23M in Turkish, 1.23M in English). */
export function money(n: number, decimals = 2): string {
  const s = formatBig(n, decimals);
  return currentLang() === 'en' ? s : s.replace('.', ',');
}

export function perSec(n: number): string {
  return t('hud.perSec', { v: money(n) });
}

/** Short cycle-time label: 0.5s, 12s, 3m, 2h. */
export function cycleLabel(sec: number): string {
  if (sec < 1) return `${(Math.round(sec * 100) / 100).toString().replace('.', currentLang() === 'en' ? '.' : ',')}s`;
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${Math.round((sec / 3600) * 10) / 10}h`.replace('.', currentLang() === 'en' ? '.' : ',');
}

/** "×12.3K" style multiplier label. */
export function times(n: number): string {
  return `×${n < 100 ? (Math.round(n * 10) / 10).toString().replace('.', currentLang() === 'en' ? '.' : ',') : money(n)}`;
}
