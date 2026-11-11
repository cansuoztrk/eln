import { describe, expect, it } from "vitest";
import {
  clockIn,
  countdownParts,
  daysBetween,
  daysInMonth,
  describeDate,
  elapsed,
  formatDate,
  formatDaysUntil,
  formatElapsed,
  formatWithPrecision,
  isValidDate,
  nextOccurrence,
  occurrenceIn,
  offsetMinutes,
  parseISODate,
  startOfDayIn,
  todayIn,
  toISODate,
  weekdayOf,
  zoneDifferenceMinutes,
} from "@/lib/dates";

const MET = { year: 2025, month: 12, day: 6 };
const TOGETHER = { year: 2026, month: 5, day: 21 };
const TODAY = { year: 2026, month: 11, day: 10 };

describe("calendar maths", () => {
  it("counts 166 days between meeting and becoming a couple", () => {
    expect(daysBetween(MET, TOGETHER)).toBe(166);
  });

  it("counts whole days and goes negative backwards", () => {
    expect(daysBetween(MET, TODAY)).toBe(339);
    expect(daysBetween(TOGETHER, TODAY)).toBe(173);
    expect(daysBetween(TODAY, MET)).toBe(-339);
    expect(daysBetween(MET, MET)).toBe(0);
  });

  it("knows leap years", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(isValidDate({ year: 2025, month: 2, day: 29 })).toBe(false);
    expect(isValidDate({ year: 2024, month: 2, day: 29 })).toBe(true);
    expect(isValidDate({ year: 2025, month: 13, day: 1 })).toBe(false);
  });

  it("counts elapsed time the way people do", () => {
    expect(elapsed(TOGETHER, TODAY)).toMatchObject({ years: 0, months: 5, days: 20, totalDays: 173 });
    expect(elapsed(MET, { year: 2026, month: 12, day: 6 })).toMatchObject({ years: 1, months: 0, days: 0 });
    expect(elapsed({ year: 2026, month: 1, day: 31 }, { year: 2026, month: 3, day: 1 })).toMatchObject({ months: 1, days: 1 });
  });

  it("round-trips ISO dates and rejects impossible ones", () => {
    expect(toISODate(MET)).toBe("2025-12-06");
    expect(parseISODate("2025-12-06")).toEqual(MET);
    expect(parseISODate("2025-12-06T10:00:00Z")).toEqual(MET);
    expect(parseISODate("2025-02-30")).toBeNull();
    expect(parseISODate("")).toBeNull();
    expect(parseISODate(null)).toBeNull();
  });
});

describe("time zones — independent of the machine running the code", () => {
  it("gives the right offsets for the two cities", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    const summer = new Date("2026-07-15T12:00:00Z");
    for (const instant of [winter, summer]) {
      expect(offsetMinutes("Europe/Istanbul", instant)).toBe(180);
      expect(offsetMinutes("Asia/Baku", instant)).toBe(240);
      expect(zoneDifferenceMinutes("Europe/Istanbul", "Asia/Baku", instant)).toBe(60);
    }
  });

  it("puts the two of them on different calendar days around midnight", () => {
    const instant = new Date("2026-11-09T20:30:00Z"); // 23:30 in Istanbul, 00:30 in Baku
    expect(todayIn("Europe/Istanbul", instant)).toEqual({ year: 2026, month: 11, day: 9 });
    expect(todayIn("Asia/Baku", instant)).toEqual({ year: 2026, month: 11, day: 10 });
    expect(clockIn("Europe/Istanbul", instant)).toMatchObject({ hour: 23, minute: 30 });
    expect(clockIn("Asia/Baku", instant)).toMatchObject({ hour: 0, minute: 30 });
  });

  it("finds the instant a day begins in a city", () => {
    expect(startOfDayIn("Asia/Baku", { year: 2027, month: 4, day: 23 }).toISOString()).toBe("2027-04-22T20:00:00.000Z");
    expect(startOfDayIn("Europe/Istanbul", { year: 2026, month: 12, day: 6 }).toISOString()).toBe("2026-12-05T21:00:00.000Z");
    // A zone with daylight saving, on the day the clocks change.
    expect(startOfDayIn("Europe/Berlin", { year: 2026, month: 3, day: 29 }).toISOString()).toBe("2026-03-28T23:00:00.000Z");
  });
});

describe("recurring days", () => {
  it("finds the next occurrence, counting today", () => {
    expect(nextOccurrence({ month: 12, day: 6 }, TODAY)).toEqual({ year: 2026, month: 12, day: 6 });
    expect(nextOccurrence({ month: 11, day: 7 }, TODAY)).toEqual({ year: 2027, month: 11, day: 7 });
    expect(nextOccurrence({ month: 11, day: 10 }, TODAY)).toEqual(TODAY);
  });

  it("keeps 29 February on the 28th in ordinary years", () => {
    expect(occurrenceIn(2027, { month: 2, day: 29 })).toEqual({ year: 2027, month: 2, day: 28 });
    expect(occurrenceIn(2028, { month: 2, day: 29 })).toEqual({ year: 2028, month: 2, day: 29 });
  });
});

describe("describeDate — say only what is known", () => {
  it("says nothing countable about a date that has not been set", () => {
    expect(describeDate({ month: null, day: null, year: null, recursYearly: false, happened: false }, TODAY)).toEqual({ kind: "unknown" });
    expect(describeDate({ month: null, day: null, year: null }, TODAY)).toEqual({ kind: "unknown" });
  });

  it("never derives an age or a duration from a birthday without a year", () => {
    const status = describeDate({ month: 4, day: 23, year: null }, TODAY);
    expect(status).toMatchObject({ kind: "recurring", daysUntil: 164, isToday: false, daysSince: null, turns: null, origin: null });
    if (status.kind === "recurring") expect(status.next).toEqual({ year: 2027, month: 4, day: 23 });
  });

  it("counts anniversaries only when the year is known", () => {
    const met = describeDate({ ...MET, recursYearly: true }, TODAY);
    expect(met).toMatchObject({ kind: "recurring", daysUntil: 26, turns: 1, daysSince: 339, isToday: false });
    const together = describeDate({ ...TOGETHER, recursYearly: true }, TODAY);
    expect(together).toMatchObject({ kind: "recurring", daysUntil: 192, turns: 1, daysSince: 173 });
  });

  it("recognises the day itself", () => {
    expect(describeDate({ month: 11, day: 7, year: null }, { year: 2026, month: 11, day: 7 })).toMatchObject({ isToday: true, daysUntil: 0 });
  });

  it("treats a one-off date as upcoming or past, never recurring", () => {
    expect(describeDate({ month: 3, day: 14, year: 2027, recursYearly: false }, TODAY)).toMatchObject({ kind: "upcoming", daysUntil: 124 });
    expect(describeDate({ month: 3, day: 14, year: 2026, recursYearly: false }, TODAY)).toMatchObject({ kind: "past", daysSince: 241 });
    // A one-off date with no year cannot be placed at all.
    expect(describeDate({ month: 3, day: 14, year: null, recursYearly: false }, TODAY)).toEqual({ kind: "unknown" });
  });

  it("counts down to a yearly day whose very first occurrence is still ahead", () => {
    expect(describeDate({ month: 3, day: 14, year: 2027, recursYearly: true }, TODAY)).toMatchObject({ kind: "recurring", daysUntil: 124, turns: 0, daysSince: null });
  });
});

describe("Turkish formatting", () => {
  it("writes dates with and without a year", () => {
    expect(formatDate(MET)).toBe("6 Aralık 2025");
    expect(formatDate({ month: 4, day: 23 })).toBe("23 Nisan");
    expect(formatDate({ month: 11, day: 7, year: null })).toBe("7 Kasım");
    expect(weekdayOf(MET)).toBe("Cumartesi");
    expect(weekdayOf(TOGETHER)).toBe("Perşembe");
  });

  it("respects how precisely a memory's date is known", () => {
    expect(formatWithPrecision(MET, "day")).toBe("6 Aralık 2025");
    expect(formatWithPrecision(MET, "month")).toBe("Aralık 2025");
    expect(formatWithPrecision(MET, "year")).toBe("2025");
  });

  it("phrases distances in days", () => {
    expect(formatDaysUntil(0)).toBe("bugün");
    expect(formatDaysUntil(1)).toBe("yarın");
    expect(formatDaysUntil(26)).toBe("26 gün sonra");
    expect(formatElapsed({ years: 0, months: 5, days: 20 })).toBe("5 ay 20 gün");
    expect(formatElapsed({ years: 1, months: 0, days: 0 })).toBe("1 yıl");
    expect(formatElapsed({ years: 0, months: 0, days: 0 })).toBe("0 gün");
  });

  it("splits a countdown and never goes below zero", () => {
    const now = new Date("2026-11-10T00:00:00Z");
    expect(countdownParts(new Date("2026-11-11T01:02:03Z"), now)).toEqual({ days: 1, hours: 1, minutes: 2, seconds: 3, done: false });
    expect(countdownParts(new Date("2026-11-09T00:00:00Z"), now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
  });
});
