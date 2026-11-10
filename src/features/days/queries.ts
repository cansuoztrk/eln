import "server-only";
import { listDates, viewerToday, type RelationshipDate } from "@/features/dates/queries";
import type { Session } from "@/lib/auth/session";
import { describeDate, type DateStatus } from "@/lib/dates";
import type { Tables } from "@/lib/supabase/database.types";

export type SpecialDayTheme =
  | "birthday-partner"
  | "birthday-owner"
  | "meeting"
  | "together"
  | "first-meeting"
  | "classic";

export type SpecialDay = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  theme: SpecialDayTheme;
  coverPhotoId: string | null;
  showCountdown: boolean;
  status: "draft" | "published";
  sortOrder: number;
  date: RelationshipDate;
  /** What may truthfully be said about the date today. */
  when: DateStatus;
};

function toDay(row: Tables<"special_days">, date: RelationshipDate, session: Session): SpecialDay {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    intro: row.intro,
    theme: row.theme as SpecialDayTheme,
    coverPhotoId: row.cover_photo_id,
    showCountdown: row.show_countdown,
    status: row.status,
    sortOrder: row.sort_order,
    date,
    when: describeDate(date, viewerToday(session)),
  };
}

/** Days until the next occurrence, or Infinity when there is nothing to count. */
export function daysAway(day: Pick<SpecialDay, "when">): number {
  if (day.when.kind === "recurring" || day.when.kind === "upcoming") return day.when.daysUntil;
  return Number.POSITIVE_INFINITY;
}

/**
 * Special days the viewer may see, soonest first. A day whose date has not
 * been set (the first meeting) is left out: there is nothing to celebrate or
 * count yet.
 */
export async function listSpecialDays(
  session: Session,
  options: { includeDrafts?: boolean; includeDateless?: boolean } = {},
): Promise<SpecialDay[]> {
  let query = session.supabase
    .from("special_days")
    .select("*")
    .eq("space_id", session.space.id)
    .is("deleted_at", null);
  if (!options.includeDrafts) query = query.eq("status", "published");

  const [{ data }, dates] = await Promise.all([query, listDates(session)]);
  const byId = new Map(dates.map((d) => [d.id, d]));

  return (data ?? [])
    .map((row) => {
      const date = byId.get(row.relationship_date_id);
      return date ? toDay(row, date, session) : null;
    })
    .filter((day): day is SpecialDay => day !== null)
    .filter((day) => options.includeDateless || day.when.kind !== "unknown")
    .sort((a, b) => daysAway(a) - daysAway(b) || a.sortOrder - b.sortOrder);
}

export async function getSpecialDay(session: Session, slug: string): Promise<SpecialDay | null> {
  const days = await listSpecialDays(session, { includeDrafts: session.role === "owner", includeDateless: true });
  return days.find((day) => day.slug === slug) ?? null;
}
