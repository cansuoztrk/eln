import "server-only";
import { cache } from "react";
import { viewerToday } from "@/features/dates/queries";
import type { Session } from "@/lib/auth/session";
import { toISODate } from "@/lib/dates";

/**
 * Rooms that would greet Eln with nothing in them. A reading room — photos,
 * letters, notes, capsules, recordings — is left out of her menus until there
 * is something inside, so she never walks into an empty display. Arda always
 * sees every room, because he is the one who fills them.
 *
 * Rooms she can write in herself (journal, questions, dreams…) always stay.
 * This only shapes navigation; it records nothing.
 */
export const getHiddenRooms = cache(async (session: Session): Promise<string[]> => {
  if (session.role === "owner") return [];

  const db = session.supabase;
  const space = session.space.id;
  const head = { count: "exact" as const, head: true };
  const today = toISODate(viewerToday(session));

  // Give every day up to today its note first, so the count below is honest.
  if (session.space.reasons_started_on) await db.rpc("ensure_daily_notes", { p_space: space, p_day: today });

  const [photos, letters, sealedLetters, notes, capsules, sealedCapsules, voices] = await Promise.all([
    db.from("photos").select("id", head).eq("space_id", space).eq("status", "published").eq("show_in_gallery", true).is("deleted_at", null),
    db.from("letters").select("id", head).eq("space_id", space).eq("status", "published").is("deleted_at", null),
    db.rpc("sealed_letters", { p_space: space }),
    db.from("daily_note_schedule").select("day", head).eq("space_id", space).lte("day", today),
    db.from("time_capsules").select("id", head).eq("space_id", space).is("deleted_at", null),
    db.rpc("sealed_capsules", { p_space: space }),
    db.from("voice_memories").select("id", head).eq("space_id", space).is("deleted_at", null),
  ]);

  const hidden: string[] = [];
  if (!photos.count) hidden.push("/gallery");
  if (!letters.count && !sealedLetters.data?.length) hidden.push("/letters");
  if (!notes.count) hidden.push("/reasons");
  if (!capsules.count && !sealedCapsules.data?.length) hidden.push("/capsules");
  if (!voices.count) hidden.push("/voice");
  return hidden;
});
