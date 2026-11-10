import "server-only";
import { cache } from "react";
import { viewerToday } from "@/features/dates/queries";
import type { Session } from "@/lib/auth/session";
import { toISODate } from "@/lib/dates";

/**
 * Rooms that would greet Eln with nothing in them. A room that is only for
 * reading — photos, letters, the daily notes, capsules — is left out of her
 * menus until there is something inside, so she never walks into an empty
 * display. Arda always sees every room, because he is the one who fills them.
 *
 * Rooms she can simply use (journal, questions, dreams, voice…) always stay,
 * and her own ways to add a photo, a letter or a capsule are always listed on
 * her account page. This only shapes navigation; it records nothing.
 */
export const getHiddenRooms = cache(async (session: Session): Promise<string[]> => {
  if (session.role === "owner") return [];

  const { data } = await session.supabase
    .rpc("room_presence", { p_space: session.space.id, p_day: toISODate(viewerToday(session)) })
    .maybeSingle();
  // If the answer cannot be had, show everything rather than hide by mistake.
  if (!data) return [];

  const hidden: string[] = [];
  if (!data.gallery) hidden.push("/gallery");
  if (!data.letters) hidden.push("/letters");
  if (!data.reasons) hidden.push("/reasons");
  if (!data.capsules) hidden.push("/capsules");
  return hidden;
});
