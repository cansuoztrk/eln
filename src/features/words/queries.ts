import "server-only";
import { WRITTEN_DAYS, WRITTEN_LETTERS, WRITTEN_MEMORIES, WRITTEN_NOTES } from "@/content/writing";
import type { Session } from "@/lib/auth/session";

export type WordsStatus = {
  letters: { total: number; added: number };
  notes: { total: number; added: number };
  memories: { total: number; empty: number };
  days: { total: number; empty: number };
};

/** How much of the ready writing is already in the Studio, so nothing is ever added twice. */
export async function getWordsStatus(session: Session): Promise<WordsStatus> {
  const space = session.space.id;
  const [letters, notes, memories, days] = await Promise.all([
    session.supabase.from("letters").select("title").eq("space_id", space).eq("created_by", session.userId),
    session.supabase.from("daily_notes").select("body").eq("space_id", space),
    session.supabase.from("memories").select("relationship_date_key, summary, description").eq("space_id", space).in("relationship_date_key", Object.keys(WRITTEN_MEMORIES)),
    session.supabase.from("special_days").select("slug, subtitle, intro").eq("space_id", space).in("slug", Object.keys(WRITTEN_DAYS)),
  ]);

  const titles = new Set((letters.data ?? []).map((row) => row.title));
  const bodies = new Set((notes.data ?? []).map((row) => row.body));

  return {
    letters: { total: WRITTEN_LETTERS.length, added: WRITTEN_LETTERS.filter((letter) => titles.has(letter.title)).length },
    notes: { total: WRITTEN_NOTES.length, added: WRITTEN_NOTES.filter((note) => bodies.has(note.body)).length },
    memories: { total: (memories.data ?? []).length, empty: (memories.data ?? []).filter((row) => !row.summary && !row.description).length },
    days: { total: (days.data ?? []).length, empty: (days.data ?? []).filter((row) => !row.subtitle && !row.intro).length },
  };
}
