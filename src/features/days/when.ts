import { formatDate, formatDaysUntil, type PlainDate } from "@/lib/dates";
import type { SpecialDay } from "./queries";

/** What a special day's card may say about its date today — nothing more than is known. */
export function whenText(day: Pick<SpecialDay, "when">): {
  next: PlainDate | null;
  dateText: string;
  awayText: string;
  isToday: boolean;
  /** "1. yıl" — only for dates whose year is known. */
  ordinal: string | null;
} {
  const when = day.when;
  if (when.kind === "recurring") {
    return {
      next: when.next,
      dateText: formatDate(when.next),
      awayText: when.isToday ? "Bugün" : formatDaysUntil(when.daysUntil),
      isToday: when.isToday,
      ordinal: when.turns && when.turns >= 1 ? `${when.turns}. yıl` : null,
    };
  }
  if (when.kind === "upcoming") {
    return { next: when.date, dateText: formatDate(when.date), awayText: formatDaysUntil(when.daysUntil), isToday: when.daysUntil === 0, ordinal: null };
  }
  if (when.kind === "past") {
    return { next: null, dateText: formatDate(when.date), awayText: "", isToday: false, ordinal: null };
  }
  return { next: null, dateText: "Tarihi henüz belli değil", awayText: "", isToday: false, ordinal: null };
}
