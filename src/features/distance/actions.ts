"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/security/rate-limit";
import { noteSchema, type NoteInput } from "./schema";

/** Leaves a short note or a line in the longing journal. Either of them may. */
export async function addNoteAction(input: NoteInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimit("write", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);

  const { error } = await session.supabase.from("distance_notes").insert({
    space_id: session.space.id,
    kind: parsed.data.kind,
    body: parsed.data.body,
  });
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/distance");
  return ok(undefined, parsed.data.kind === "note" ? "Not bırakıldı." : "Günlüğe eklendi.");
}
