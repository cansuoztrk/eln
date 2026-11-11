"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/security/rate-limit";
import { entrySchema, type EntryInput } from "./schema";

/** Creates or updates one's own journal entry and its photos. */
export async function saveEntryAction(input: EntryInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimit("write", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);
  const value = parsed.data;

  const row = {
    title: value.title,
    body: value.body,
    entry_date: value.entryDate,
    tags: value.tags,
    visibility: value.visibility,
    status: value.publish ? ("published" as const) : ("draft" as const),
  };
  const { data, error } = value.id
    ? await session.supabase.from("journal_entries").update(row).eq("id", value.id).select("id").maybeSingle()
    : await session.supabase.from("journal_entries").insert({ ...row, space_id: session.space.id }).select("id").maybeSingle();
  if (error || !data) return fail(GENERIC_ERROR);

  if (value.photoIds.length > 0) {
    const { error: linkError } = await session.supabase
      .from("journal_entry_photos")
      .upsert(value.photoIds.map((photoId, index) => ({ entry_id: data.id, photo_id: photoId, space_id: session.space.id, sort_order: index })), { onConflict: "entry_id,photo_id" });
    if (linkError) return fail("Kayıt saklandı ama fotoğrafları eklenemedi.");
    // A shared, published entry needs its own photos to be visible too.
    if (value.publish && value.visibility === "shared") {
      await session.supabase.from("photos").update({ status: "published" }).in("id", value.photoIds).eq("created_by", session.userId).eq("status", "draft");
    }
  }
  const stale = session.supabase.from("journal_entry_photos").delete().eq("entry_id", data.id);
  await (value.photoIds.length > 0 ? stale.not("photo_id", "in", `(${value.photoIds.join(",")})`) : stale);

  revalidatePath("/journal");
  return ok(undefined, !value.publish ? "Taslak kaydedildi." : value.visibility === "private" ? "Yalnızca senin için kaydedildi." : "Günlüğe eklendi.");
}
