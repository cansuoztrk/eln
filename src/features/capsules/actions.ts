"use server";

import { revalidatePath } from "next/cache";
import { getSession, people } from "@/lib/auth/session";
import { parseISODate, startOfDayIn } from "@/lib/dates";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { capsuleSchema, type CapsuleInput } from "./schema";

/**
 * Creates or updates a time capsule. From the moment it is published until
 * its day comes, the other person can learn only its name and its date.
 */
export async function saveCapsuleAction(input: CapsuleInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = capsuleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;

  const day = parseISODate(value.unlockOn);
  if (!day) return fail("Açılma tarihi geçersiz.", { unlockOn: "Geçerli bir gün seç." });
  const unlockAt = startOfDayIn(people(session).other.timezone, day);
  if (value.publish && !value.id && unlockAt.getTime() <= Date.now()) {
    return fail("Kapsülün açılacağı gün gelecekte olmalı.", { unlockOn: "Gelecekte bir gün seç." });
  }
  if (value.publish && value.message.trim().length === 0 && value.assetIds.length === 0 && !value.videoUrl) {
    return fail("Boş bir kapsül yayımlanamaz.", { message: "İçine bir şey koy." });
  }

  const row = {
    title: value.title,
    message: value.message,
    note: value.note,
    video_url: value.videoUrl || null,
    cover_style: value.coverStyle,
    unlock_at: unlockAt.toISOString(),
    status: value.publish ? ("published" as const) : ("draft" as const),
  };
  const { data, error } = value.id
    ? await session.supabase.from("time_capsules").update(row).eq("id", value.id).select("id").maybeSingle()
    : await session.supabase.from("time_capsules").insert({ ...row, space_id: session.space.id }).select("id").maybeSingle();
  if (error || !data) return fail(GENERIC_ERROR);

  // Replace the capsule's files. Row level security only accepts the author's own uploads.
  await session.supabase.from("time_capsule_items").delete().eq("capsule_id", data.id);
  if (value.assetIds.length > 0) {
    const { error: itemError } = await session.supabase
      .from("time_capsule_items")
      .insert(value.assetIds.map((assetId, index) => ({ capsule_id: data.id, asset_id: assetId, space_id: session.space.id, sort_order: index })));
    if (itemError) return fail("Kapsül kaydedildi ama dosyaları eklenemedi.");
  }

  revalidatePath("/capsules");
  revalidatePath("/studio/capsules");
  return ok(undefined, value.publish ? "Kapsül mühürlendi." : "Taslak kaydedildi.");
}
