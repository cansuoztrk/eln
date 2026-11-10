import "server-only";
import { cache } from "react";
import type { Session } from "@/lib/auth/session";
import { describeDate, todayIn, type DateStatus, type KnownDate, type PlainDate } from "@/lib/dates";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * The relationship's dates, read from the one table that owns them. Every
 * page that shows a date or a counter goes through here — never through a
 * constant in a component.
 */

export type RelationshipDate = KnownDate & {
  id: string;
  key: string;
  label: string;
  kind: "milestone" | "birthday" | "future" | "custom";
  person: "owner" | "partner" | null;
  recursYearly: boolean;
  happened: boolean;
  note: string;
  sortOrder: number;
};

function toDate(row: Tables<"relationship_dates">): RelationshipDate {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    kind: row.kind as RelationshipDate["kind"],
    person: row.person,
    month: row.month,
    day: row.day,
    year: row.year,
    recursYearly: row.recurs_yearly,
    happened: row.happened,
    note: row.note,
    sortOrder: row.sort_order,
  };
}

/** All dates for the space, in their set order. One query per request. */
export const listDates = cache(async (session: Session): Promise<RelationshipDate[]> => {
  const { data } = await session.supabase
    .from("relationship_dates")
    .select("*")
    .eq("space_id", session.space.id)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(toDate);
});

export async function getDate(session: Session, key: string): Promise<RelationshipDate | null> {
  return (await listDates(session)).find((d) => d.key === key) ?? null;
}

/** "Today" for the person looking at the page — their city, not their device. */
export function viewerToday(session: Session, now: Date = new Date()): PlainDate {
  return todayIn(viewerTimezone(session), now);
}

/** The viewer's timezone: the one set for their city in the space, not their device's. */
export function viewerTimezone(session: Session): string {
  return session.role === "owner" ? session.space.owner_timezone : session.space.partner_timezone;
}

/** A date together with what may truthfully be said about it today. */
export async function getDateStatus(
  session: Session,
  key: string,
  now: Date = new Date(),
): Promise<{ date: RelationshipDate; status: DateStatus } | null> {
  const date = await getDate(session, key);
  if (!date) return null;
  return { date, status: describeDate(date, viewerToday(session, now)) };
}

/** The timezone a date "belongs" to: a birthday follows its person, anything else the viewer. */
export function timezoneFor(session: Session, date: Pick<RelationshipDate, "person">): string {
  if (date.person === "owner") return session.space.owner_timezone;
  if (date.person === "partner") return session.space.partner_timezone;
  return viewerTimezone(session);
}
