/**
 * Date maths for ELNARE. Pure functions, no I/O, no implicit "now", no device
 * timezone. Every counter on the site goes through here so all pages agree.
 *
 * A PlainDate is a calendar day with no time and no zone — which is what an
 * anniversary or a birthday actually is.
 */

export type PlainDate = { year: number; month: number; day: number };
export type MonthDay = { month: number; day: number };

const MS_PER_DAY = 86_400_000;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
}

export function isValidDate({ year, month, day }: PlainDate): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

/** Days since the Unix epoch for a calendar day. Zone-free by construction. */
function ordinal({ year, month, day }: PlainDate): number {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function fromOrdinal(n: number): PlainDate {
  const d = new Date(n * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function addDays(date: PlainDate, days: number): PlainDate {
  return fromOrdinal(ordinal(date) + days);
}

/** Whole days from `a` to `b`. Negative when `b` is earlier. */
export function daysBetween(a: PlainDate, b: PlainDate): number {
  return ordinal(b) - ordinal(a);
}

export function compareDates(a: PlainDate, b: PlainDate): number {
  return ordinal(a) - ordinal(b);
}

export function toISODate({ year, month, day }: PlainDate): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseISODate(value: string | null | undefined): PlainDate | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isValidDate(date) ? date : null;
}

// ---------------------------------------------------------------------------
// Time zones
// ---------------------------------------------------------------------------

type ZonedParts = PlainDate & { hour: number; minute: number; second: number };

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function zonedParts(instant: Date, timeZone: string): ZonedParts {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatters.set(timeZone, formatter);
  }
  const out: Record<string, number> = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== "literal") out[part.type] = Number(part.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour,
    minute: out.minute,
    second: out.second,
  };
}

/** The calendar day it currently is in `timeZone`, wherever the device is. */
export function todayIn(timeZone: string, now: Date): PlainDate {
  const { year, month, day } = zonedParts(now, timeZone);
  return { year, month, day };
}

/** Wall-clock time in `timeZone`. */
export function clockIn(timeZone: string, now: Date) {
  const p = zonedParts(now, timeZone);
  return { ...p, minutesOfDay: p.hour * 60 + p.minute };
}

/** Offset from UTC in minutes (Istanbul → 180, Baku → 240). */
export function offsetMinutes(timeZone: string, instant: Date): number {
  const p = zonedParts(instant, timeZone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUTC - Math.floor(instant.getTime() / 1000) * 1000) / 60_000);
}

/** How many minutes `b` is ahead of `a` right now. */
export function zoneDifferenceMinutes(a: string, b: string, now: Date): number {
  return offsetMinutes(b, now) - offsetMinutes(a, now);
}

/** The instant at which `date` begins (00:00) in `timeZone`. */
export function startOfDayIn(timeZone: string, date: PlainDate): Date {
  const guess = Date.UTC(date.year, date.month - 1, date.day);
  let instant = new Date(guess - offsetMinutes(timeZone, new Date(guess)) * 60_000);
  // A second pass settles days on which the offset itself changes.
  instant = new Date(guess - offsetMinutes(timeZone, instant) * 60_000);
  return instant;
}

// ---------------------------------------------------------------------------
// Recurring days
// ---------------------------------------------------------------------------

/** 29 February is kept on the 28th in years that do not have one. */
export function occurrenceIn(year: number, { month, day }: MonthDay): PlainDate {
  return { year, month, day: Math.min(day, daysInMonth(year, month)) };
}

/** The next time a yearly day comes around, counting today itself. */
export function nextOccurrence(monthDay: MonthDay, today: PlainDate): PlainDate {
  const thisYear = occurrenceIn(today.year, monthDay);
  return compareDates(thisYear, today) >= 0 ? thisYear : occurrenceIn(today.year + 1, monthDay);
}

export function isSameMonthDay(monthDay: MonthDay, today: PlainDate): boolean {
  const occurrence = occurrenceIn(today.year, monthDay);
  return occurrence.month === today.month && occurrence.day === today.day;
}

/** `date` moved forward by whole months; a day that does not exist is kept on the month's last day. */
function addMonths(date: PlainDate, months: number): PlainDate {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/**
 * Calendar difference, the way people count: "5 ay 20 gün".
 * Whole months first, then the days left over. `from` must not be after `to`.
 */
export function elapsed(from: PlainDate, to: PlainDate) {
  let months = (to.year - from.year) * 12 + (to.month - from.month);
  if (compareDates(addMonths(from, months), to) > 0) months -= 1;
  months = Math.max(0, months);
  const days = Math.max(0, daysBetween(addMonths(from, months), to));
  return { years: Math.floor(months / 12), months: months % 12, days, totalDays: daysBetween(from, to) };
}

// ---------------------------------------------------------------------------
// Relationship dates
// ---------------------------------------------------------------------------

/** The shape stored in `relationship_dates`. Any part may be unknown. */
export type KnownDate = {
  month: number | null;
  day: number | null;
  year: number | null;
  recursYearly?: boolean;
  happened?: boolean;
};

export function hasMonthDay(d: KnownDate): d is KnownDate & MonthDay {
  return d.month !== null && d.day !== null;
}

export function fullDate(d: KnownDate): PlainDate | null {
  if (d.month === null || d.day === null || d.year === null) return null;
  return { year: d.year, month: d.month, day: d.day };
}

export type DateStatus =
  /** No date at all (e.g. the first meeting, still unplanned). Nothing to count. */
  | { kind: "unknown" }
  /** A one-off date that is still ahead. */
  | { kind: "upcoming"; date: PlainDate; daysUntil: number }
  /** A day that repeats every year. `turns` is known only when the year is. */
  | {
      kind: "recurring";
      next: PlainDate;
      daysUntil: number;
      isToday: boolean;
      /** Days since the original date, when it has a year and is in the past. */
      daysSince: number | null;
      /** Which anniversary `next` will be (1 = first), when the year is known. */
      turns: number | null;
      origin: PlainDate | null;
    }
  /** A one-off date that has passed. */
  | { kind: "past"; date: PlainDate; daysSince: number };

/**
 * Everything a page may say about a date — and nothing it may not.
 * No year → no "how long". No date → no countdown.
 */
export function describeDate(d: KnownDate, today: PlainDate): DateStatus {
  if (!hasMonthDay(d)) return { kind: "unknown" };

  const origin = fullDate(d);
  const recurring = d.recursYearly ?? true;

  if (!recurring) {
    if (!origin) return { kind: "unknown" };
    const diff = daysBetween(today, origin);
    return diff >= 0
      ? { kind: "upcoming", date: origin, daysUntil: diff }
      : { kind: "past", date: origin, daysSince: -diff };
  }

  // A yearly day whose first occurrence is still ahead counts down to that first one.
  if (origin && compareDates(origin, today) > 0) {
    return {
      kind: "recurring",
      next: origin,
      daysUntil: daysBetween(today, origin),
      isToday: false,
      daysSince: null,
      turns: 0,
      origin,
    };
  }

  const next = nextOccurrence(d, today);
  return {
    kind: "recurring",
    next,
    daysUntil: daysBetween(today, next),
    isToday: isSameMonthDay(d, today),
    daysSince: origin ? daysBetween(origin, today) : null,
    turns: origin ? next.year - origin.year : null,
    origin,
  };
}

// ---------------------------------------------------------------------------
// Formatting (Turkish)
// ---------------------------------------------------------------------------

export const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

const WEEKDAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;

export function weekdayOf(date: PlainDate): string {
  return WEEKDAYS_TR[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()];
}

/** "6 Aralık 2025" — or "6 Aralık" when the year is unknown. */
export function formatDate(date: { year?: number | null; month: number; day: number }): string {
  const base = `${date.day} ${MONTHS_TR[date.month - 1]}`;
  return date.year ? `${base} ${date.year}` : base;
}

export function formatMonthYear(date: PlainDate): string {
  return `${MONTHS_TR[date.month - 1]} ${date.year}`;
}

/** Respects how precisely a memory's date is known. */
export function formatWithPrecision(date: PlainDate, precision: "day" | "month" | "year"): string {
  if (precision === "year") return String(date.year);
  if (precision === "month") return formatMonthYear(date);
  return formatDate(date);
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "bugün", "yarın", "27 gün sonra". */
export function formatDaysUntil(days: number): string {
  if (days === 0) return "bugün";
  if (days === 1) return "yarın";
  return `${days} gün sonra`;
}

/** "5 ay 19 gün", skipping empty parts. */
export function formatElapsed(parts: { years: number; months: number; days: number }): string {
  const out: string[] = [];
  if (parts.years > 0) out.push(`${parts.years} yıl`);
  if (parts.months > 0) out.push(`${parts.months} ay`);
  if (parts.days > 0 || out.length === 0) out.push(`${parts.days} gün`);
  return out.join(" ");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}

/** Splits the time left until `target` for a live countdown. Never negative. */
export function countdownParts(target: Date, now: Date) {
  const total = Math.max(0, target.getTime() - now.getTime());
  const seconds = Math.floor(total / 1000);
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: total === 0,
  };
}
