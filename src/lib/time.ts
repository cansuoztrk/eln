import { market } from "@/config/market";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const dateTimeFmt = new Intl.DateTimeFormat(market.locale, {
  timeZone: market.timeZone,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat(market.locale, {
  timeZone: market.timeZone,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFmt = new Intl.DateTimeFormat(market.locale, {
  timeZone: market.timeZone,
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat(market.locale, {
  timeZone: market.timeZone,
  hour: "2-digit",
  minute: "2-digit",
});

const weekdayFmt = new Intl.DateTimeFormat(market.locale, { timeZone: market.timeZone, weekday: "short" });

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d);
}

export function formatDateTime(d: Date | string | number): string {
  return dateTimeFmt.format(toDate(d));
}
export function formatDate(d: Date | string | number): string {
  return dateFmt.format(toDate(d));
}
export function formatShortDate(d: Date | string | number): string {
  return shortDateFmt.format(toDate(d));
}
export function formatTime(d: Date | string | number): string {
  return timeFmt.format(toDate(d));
}
export function formatWeekday(d: Date | string | number): string {
  return weekdayFmt.format(toDate(d));
}

/**
 * "5 dakika önce" gibi göreli zaman. YALNIZCA gerçek bir zaman damgasıyla çağrılmalıdır;
 * zaman damgası yoksa çağıran taraf "bilinmiyor" göstermelidir.
 */
export function formatRelative(d: Date | string | number, now: Date = new Date()): string {
  const diff = now.getTime() - toDate(d).getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const wrap = (s: string) => (future ? `${s} sonra` : `${s} önce`);
  if (abs < MINUTE) return future ? "birazdan" : "az önce";
  if (abs < HOUR) return wrap(`${Math.round(abs / MINUTE)} dakika`);
  if (abs < DAY) return wrap(`${Math.round(abs / HOUR)} saat`);
  if (abs < 30 * DAY) return wrap(`${Math.round(abs / DAY)} gün`);
  return formatDate(d);
}

/** Kısa göreli zaman: "15 dk önce", "3 sa önce", "2 gün önce". */
export function formatRelativeShort(d: Date | string | number, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - toDate(d).getTime());
  if (diff < MINUTE) return "az önce";
  if (diff < HOUR) return `${Math.round(diff / MINUTE)} dk önce`;
  if (diff < DAY) return `${Math.round(diff / HOUR)} sa önce`;
  if (diff < 30 * DAY) return `${Math.round(diff / DAY)} gün önce`;
  return formatShortDate(d);
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} dk`;
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`;
}

/** Türkiye saatine göre takvim günü (YYYY-MM-DD). */
export function localDayKey(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: market.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts;
}

/** ISO hafta anahtarı, ör. "2026-W43". */
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / DAY + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY);
}

/** "YYYY-MM-DD" → UTC gece yarısı Date. Geçersizse null. */
export function parseDateOnly(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}
