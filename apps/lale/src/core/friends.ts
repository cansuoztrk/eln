/**
 * "Çalışma Kodu": a weekly study summary friends exchange by message, so a
 * class leaderboard works with no accounts and no server. The code carries
 * a checksum keyed with an app salt: not cryptographic security (the salt
 * ships in the app), but enough to stop casual hand-edited numbers.
 */
export interface Summary {
  name: string;
  exam: string;
  /** ISO week: year and week number. */
  year: number;
  week: number;
  minutes: number;
  questions: number;
  streak: number;
  tulips: number;
}

const EXAMS = ['yks', 'lgs', 'kpss', 'ales', 'dgs', 'yds', 'msu', 'other'];
const SALT = 'tekir-lale-2027';
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32
const VERSION = 1;
export const MAX_NAME = 14;

/** ISO-8601 week of a date. */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function fnv(bytes: Uint8Array): number {
  let h = 2166136261;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function checksum(payload: Uint8Array): number {
  const salt = new TextEncoder().encode(SALT);
  const all = new Uint8Array(salt.length + payload.length);
  all.set(salt);
  all.set(payload, salt.length);
  return fnv(all);
}

function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function fromBase32(s: string): Uint8Array | null {
  const clean = s.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) return null;
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

const clampInt = (n: number, max: number) => Math.max(0, Math.min(max, Math.floor(n)));

export function encode(s: Summary): string {
  const name = new TextEncoder().encode([...s.name.trim()].slice(0, MAX_NAME).join(''));
  const buf = new Uint8Array(15 + name.length);
  const dv = new DataView(buf.buffer);
  dv.setUint8(0, VERSION);
  dv.setUint8(1, Math.max(0, EXAMS.indexOf(s.exam)));
  dv.setUint16(2, clampInt(s.year, 65535));
  dv.setUint8(4, clampInt(s.week, 53));
  dv.setUint16(5, clampInt(s.minutes, 65535));
  dv.setUint16(7, clampInt(s.questions, 65535));
  dv.setUint16(9, clampInt(s.streak, 65535));
  dv.setUint16(11, clampInt(s.tulips, 65535));
  dv.setUint8(13, name.length);
  dv.setUint8(14, 0);
  buf.set(name, 15);
  const sum = checksum(buf);
  const full = new Uint8Array(buf.length + 4);
  full.set(buf);
  new DataView(full.buffer).setUint32(buf.length, sum);
  const body = toBase32(full);
  return 'LALE-' + (body.match(/.{1,4}/g) ?? []).join('-');
}

export function decode(code: string): Summary | null {
  const raw = code.trim().replace(/^LALE[-\s]*/i, '');
  const bytes = fromBase32(raw);
  if (!bytes || bytes.length < 19) return null;
  const dv = new DataView(bytes.buffer);
  if (dv.getUint8(0) !== VERSION) return null;
  const nameLen = dv.getUint8(13);
  const payloadLen = 15 + nameLen;
  if (bytes.length < payloadLen + 4) return null;
  const payload = bytes.slice(0, payloadLen);
  if (dv.getUint32(payloadLen) !== checksum(payload)) return null;
  const week = dv.getUint8(4);
  if (week < 1 || week > 53) return null;
  let name: string;
  try {
    name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(15, payloadLen));
  } catch {
    return null;
  }
  return {
    name,
    exam: EXAMS[dv.getUint8(1)] ?? 'other',
    year: dv.getUint16(2),
    week,
    minutes: dv.getUint16(5),
    questions: dv.getUint16(7),
    streak: dv.getUint16(9),
    tulips: dv.getUint16(11),
  };
}

/** Finds a code inside a pasted message ("Lale çalışma kodum: LALE-…"). */
export function extractCode(text: string): string | null {
  const m = text.match(/LALE(?:-[0-9A-Za-z]{1,4})+/i);
  return m ? m[0] : null;
}
