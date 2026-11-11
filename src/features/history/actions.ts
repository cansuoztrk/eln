"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/result";
import { isVersioned, VERSIONED } from "./registry";

/**
 * Brings the written content of an earlier version back. The current state is
 * itself kept as a new version first (by the database trigger), so restoring
 * can always be undone.
 */
export async function restoreVersionAction(table: string, versionId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (!isVersioned(table) || !z.uuid().safeParse(versionId).success) return fail("Geçersiz istek.");

  // Only the author can read a version at all.
  const { data: version } = await session.supabase
    .from("content_versions")
    .select("entity_id, entity_table, snapshot")
    .eq("id", versionId)
    .eq("entity_table", table)
    .maybeSingle();
  if (!version) return fail("Bu sürüm bulunamadı.");

  const snapshot = (version.snapshot ?? {}) as Record<string, unknown>;
  const values: Record<string, unknown> = {};
  for (const field of VERSIONED[table].fields) if (field in snapshot) values[field] = snapshot[field];

  const rows = session.supabase as unknown as {
    from(name: string): { update(v: Record<string, unknown>): { eq(c: string, v: string): { select(c: string): PromiseLike<{ data: unknown[] | null; error: unknown }> } } };
  };
  const { data, error } = await rows.from(table).update(values).eq("id", version.entity_id).select("id");
  if (error || !data?.length) return fail(GENERIC_ERROR);

  for (const path of VERSIONED[table].paths) revalidatePath(path, "layout");
  return ok(undefined, "Önceki sürüme dönüldü. Şimdiki hali de geçmişe eklendi.");
}
