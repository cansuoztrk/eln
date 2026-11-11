"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { memorySchema, type MemoryInput } from "./schema";

function refresh() {
  for (const path of ["/story", "/universe", "/studio/story", "/gallery", "/"]) revalidatePath(path);
}

/**
 * Creates or updates a memory and the ordered set of photos attached to it.
 * Publishing a memory also publishes the author's own attached photos that
 * are still drafts — otherwise the other person would see a memory with
 * missing pictures.
 */
export async function saveMemoryAction(input: MemoryInput): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");

  const parsed = memorySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;

  const row = {
    title: value.title,
    happened_on: value.happenedOn || null,
    date_precision: value.happenedOn ? value.datePrecision : "day",
    summary: value.summary,
    description: value.description,
    special_note: value.specialNote,
    category: value.category,
    tags: value.tags,
    album_id: value.albumId,
    voice_memory_id: value.voiceMemoryId,
    star_size: value.starSize,
    star_tone: value.starTone,
    status: value.publish ? ("published" as const) : ("draft" as const),
  };

  const { data, error } = value.id
    ? await session.supabase.from("memories").update(row).eq("id", value.id).select("id").maybeSingle()
    : await session.supabase
        .from("memories")
        .insert({ ...row, space_id: session.space.id })
        .select("id")
        .maybeSingle();
  if (error || !data) return fail(value.id ? "Bu anı kaydedilemedi." : GENERIC_ERROR);

  // Bring the photo set in line with the chosen order: write the new set first,
  // then remove what is no longer in it — so a failure never leaves the memory bare.
  if (value.photoIds.length > 0) {
    const { error: linkError } = await session.supabase.from("memory_photos").upsert(
      value.photoIds.map((photoId, index) => ({ memory_id: data.id, photo_id: photoId, space_id: session.space.id, sort_order: index })),
      { onConflict: "memory_id,photo_id" },
    );
    if (linkError) return fail("Anı kaydedildi ama fotoğrafları güncellenemedi.");
  }
  const stale = session.supabase.from("memory_photos").delete().eq("memory_id", data.id);
  const { error: clearError } = await (value.photoIds.length > 0 ? stale.not("photo_id", "in", `(${value.photoIds.join(",")})`) : stale);
  if (clearError) return fail("Anı kaydedildi ama eski fotoğrafları kaldırılamadı.");

  if (value.publish && value.photoIds.length > 0) {
    await session.supabase.from("photos").update({ status: "published" }).in("id", value.photoIds).eq("created_by", session.userId).eq("status", "draft");
  }

  refresh();
  return ok({ id: data.id }, value.publish ? "Anı yayımlandı." : "Taslak kaydedildi.");
}

/** Saves the order of memories that share a date (the order of `ids` becomes the order shown). */
export async function reorderMemoriesAction(ids: string[]): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (ids.length > 500) return fail("Geçersiz sıralama.");

  const results = await Promise.all(
    ids.map((id, index) => session.supabase.from("memories").update({ sort_order: index }).eq("id", id)),
  );
  if (results.some((r) => r.error)) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, "Sıra kaydedildi.");
}
