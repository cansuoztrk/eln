/**
 * localStorage wrapper. Storage can be unavailable (private mode, blocked
 * site data) or full; every access is guarded and failures are reported
 * instead of thrown.
 */
export type StorageResult = { ok: true } | { ok: false; reason: 'unavailable' | 'quota' | 'unknown' };

const PREFIX = 'aslan2035.';

export function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): StorageResult {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) return { ok: false, reason: 'quota' };
    if (typeof window === 'undefined' || !('localStorage' in window)) return { ok: false, reason: 'unavailable' };
    return { ok: false, reason: 'unknown' };
  }
}

export function removeKey(key: string) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function storageMessage(r: StorageResult): string | null {
  if (r.ok) return null;
  if (r.reason === 'quota') return 'Tarayıcı depolama alanı dolu. Arşivden eski kayıtları silerek yer açabilirsiniz.';
  if (r.reason === 'unavailable') return 'Tarayıcı depolaması kullanılamıyor (gizli pencere veya engellenmiş site verisi). Değişiklikler bu oturumla sınırlı kalır.';
  return 'Kayıt sırasında beklenmeyen bir depolama hatası oluştu.';
}
