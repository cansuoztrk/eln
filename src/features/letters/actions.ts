"use server";

import { revalidatePath } from "next/cache";
import { getSession, people } from "@/lib/auth/session";
import { parseISODate, startOfDayIn } from "@/lib/dates";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { letterSchema, type LetterInput } from "./schema";

/**
 * Creates or updates a letter. A letter belongs to whoever wrote it: row level
 * security rejects any attempt to change someone else's.
 */
export async function saveLetterAction(input: LetterInput): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");

  const parsed = letterSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;

  if (value.publish && value.body.trim().length === 0) {
    return fail("Boş bir mektup yayımlanamaz.", { body: "Önce bir şeyler yaz." });
  }

  // A sealed letter opens at the start of the chosen day where its reader lives.
  let unlockAt: string | null = null;
  if (value.unlockOn) {
    const day = parseISODate(value.unlockOn);
    if (!day) return fail("Açılma tarihi geçersiz.", { unlockOn: "Geçerli bir tarih seç." });
    unlockAt = startOfDayIn(people(session).other.timezone, day).toISOString();
  }

  const row = {
    title: value.title,
    body: value.body,
    category: value.category,
    written_on: value.writtenOn,
    font_style: value.fontStyle,
    envelope_style: value.envelopeStyle,
    seal: value.seal,
    unlock_at: unlockAt,
    status: value.publish ? ("published" as const) : ("draft" as const),
  };

  const query = value.id
    ? session.supabase.from("letters").update(row).eq("id", value.id).select("id").maybeSingle()
    : session.supabase
        .from("letters")
        .insert({ ...row, space_id: session.space.id })
        .select("id")
        .maybeSingle();

  const { data, error } = await query;
  if (error || !data) return fail(value.id ? "Bu mektup kaydedilemedi." : GENERIC_ERROR);

  revalidatePath("/letters");
  revalidatePath("/studio/letters");
  revalidatePath("/");
  return ok({ id: data.id }, value.publish ? "Mektup yayımlandı." : "Taslak kaydedildi.");
}
