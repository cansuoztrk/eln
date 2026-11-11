"use server";

import { revalidatePath } from "next/cache";
import { SECTION_SCHEMAS, type SectionKey } from "@/content/sections";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { toJson } from "@/lib/supabase/json";

function isSectionKey(key: string): key is SectionKey {
  return key in SECTION_SCHEMAS;
}

/**
 * Saves the owner's edits. As a draft they stay in a table only the owner can
 * read; publishing copies them to the row both members see and clears the draft.
 */
export async function saveSectionAction(input: {
  key: string;
  data: unknown;
  publish: boolean;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "owner") return fail("Bu işlem için yetkin yok.");
  if (!isSectionKey(input.key)) return fail("Bilinmeyen bölüm.");

  const parsed = SECTION_SCHEMAS[input.key].safeParse(input.data);
  if (!parsed.success) return invalid(parsed.error);

  const row = {
    space_id: session.space.id,
    key: input.key,
    data: toJson(parsed.data),
    updated_by: session.userId,
  };

  if (input.publish) {
    const { error } = await session.supabase.from("content_sections").upsert(row, { onConflict: "space_id,key" });
    if (error) return fail(GENERIC_ERROR);
    await session.supabase
      .from("content_section_drafts")
      .delete()
      .eq("space_id", session.space.id)
      .eq("key", input.key);
    revalidatePath("/", "layout");
    return ok(undefined, "Yayımlandı.");
  }

  const { error } = await session.supabase
    .from("content_section_drafts")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "space_id,key" });
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/studio", "layout");
  return ok(undefined, "Taslak kaydedildi.");
}

/** Throws away unpublished edits and goes back to what is live. */
export async function discardSectionDraftAction(key: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "owner") return fail("Bu işlem için yetkin yok.");
  if (!isSectionKey(key)) return fail("Bilinmeyen bölüm.");

  const { error } = await session.supabase
    .from("content_section_drafts")
    .delete()
    .eq("space_id", session.space.id)
    .eq("key", key);
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/studio", "layout");
  return ok(undefined, "Taslak silindi.");
}
