import "server-only";
import { viewerToday } from "@/features/dates/queries";
import type { Session } from "@/lib/auth/session";
import { toISODate } from "@/lib/dates";

export type DailyNote = { id: string; body: string; category: string; status: "draft" | "published"; sortOrder: number; timesShown: number };
export type ScheduledNote = { day: string; body: string; category: string };

/**
 * The note for today and the ones from earlier days.
 *
 * Before reading, every calendar day up to today is given its note — whoever
 * is asking and whenever — so this list is a calendar, not a record of visits.
 */
export async function getReasons(session: Session): Promise<{ today: ScheduledNote | null; archive: ScheduledNote[]; started: boolean }> {
  const today = toISODate(viewerToday(session));
  if (session.space.reasons_started_on) {
    await session.supabase.rpc("ensure_daily_notes", { p_space: session.space.id, p_day: today });
  }

  const { data } = await session.supabase
    .from("daily_note_schedule")
    .select("day, note:daily_notes(body, category, deleted_at)")
    .eq("space_id", session.space.id)
    .lte("day", today)
    .order("day", { ascending: false })
    .limit(800);

  const notes: ScheduledNote[] = (data ?? [])
    .filter((row) => row.note && !row.note.deleted_at)
    .map((row) => ({ day: row.day, body: row.note!.body, category: row.note!.category }));

  return {
    started: Boolean(session.space.reasons_started_on),
    today: notes.find((n) => n.day === today) ?? null,
    archive: notes.filter((n) => n.day !== today),
  };
}

/** Every note, for the Studio. */
export async function listAllNotes(session: Session): Promise<DailyNote[]> {
  const [{ data: notes }, { data: schedule }] = await Promise.all([
    session.supabase
      .from("daily_notes")
      .select("id, body, category, status, sort_order")
      .eq("space_id", session.space.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    session.supabase.from("daily_note_schedule").select("note_id").eq("space_id", session.space.id),
  ]);
  const shown = new Map<string, number>();
  for (const row of schedule ?? []) shown.set(row.note_id, (shown.get(row.note_id) ?? 0) + 1);

  return (notes ?? []).map((n) => ({
    id: n.id,
    body: n.body,
    category: n.category,
    status: n.status,
    sortOrder: n.sort_order,
    timesShown: shown.get(n.id) ?? 0,
  }));
}
