"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { purgeAsset } from "@/lib/media/server";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/result";
import { isTrashable, TRASHABLE, type TrashableTable } from "./registry";

const idSchema = z.uuid();

function revalidate(table: TrashableTable) {
  for (const path of TRASHABLE[table].paths) revalidatePath(path);
  revalidatePath("/studio/trash");
  revalidatePath("/");
}

async function guard(table: string, id: string) {
  const session = await getSession();
  if (!session) return { error: "Oturumun kapanmış. Yeniden giriş yap." } as const;
  if (!isTrashable(table) || !idSchema.safeParse(id).success) return { error: "Geçersiz istek." } as const;
  return { session, table } as const;
}

/**
 * Moves something to the trash. It disappears from the site but can be
 * brought back. Row level security decides whether the person may do this.
 */
export async function trashAction(tableName: string, id: string): Promise<ActionResult> {
  const guarded = await guard(tableName, id);
  if ("error" in guarded) return fail(guarded.error ?? GENERIC_ERROR);
  const { session, table } = guarded;

  const { data, error } = await session.supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");
  if (error || !data?.length) return fail("Bu öğe çöp kutusuna taşınamadı.");

  revalidate(table);
  return ok(undefined, "Çöp kutusuna taşındı. İstersen geri alabilirsin.");
}

export async function restoreAction(tableName: string, id: string): Promise<ActionResult> {
  const guarded = await guard(tableName, id);
  if ("error" in guarded) return fail(guarded.error ?? GENERIC_ERROR);
  const { session, table } = guarded;

  const { data, error } = await session.supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select("id");
  if (error || !data?.length) return fail("Bu öğe geri alınamadı.");

  revalidate(table);
  return ok(undefined, "Geri alındı.");
}

/**
 * Deletes for good. Only possible from the trash. Files that belonged only to
 * the deleted item are removed from storage as well.
 */
export async function purgeAction(tableName: string, id: string): Promise<ActionResult> {
  const guarded = await guard(tableName, id);
  if ("error" in guarded) return fail(guarded.error ?? GENERIC_ERROR);
  const { session, table } = guarded;

  // Remember the file before the row that points at it is gone.
  let assetId: string | null = null;
  if (table === "photos" || table === "voice_memories") {
    const { data } = await session.supabase.from(table).select("asset_id").eq("id", id).maybeSingle();
    assetId = data?.asset_id ?? null;
  }

  const { data, error } = await session.supabase
    .from(table)
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select("id");
  if (error || !data?.length) return fail("Bu öğe kalıcı olarak silinemedi.");

  if (assetId) {
    // Only purge the file if nothing else still uses it and it is the caller's own upload.
    const [{ count: photoUses }, { count: voiceUses }, { data: asset }] = await Promise.all([
      session.supabase.from("photos").select("id", { count: "exact", head: true }).eq("asset_id", assetId),
      session.supabase.from("voice_memories").select("id", { count: "exact", head: true }).eq("asset_id", assetId),
      session.supabase
        .from("media_assets")
        .select("id, original_path, variants, uploaded_by")
        .eq("id", assetId)
        .maybeSingle(),
    ]);
    if (asset && asset.uploaded_by === session.userId && !photoUses && !voiceUses) {
      await purgeAsset(asset);
    }
  }

  revalidate(table);
  return ok(undefined, "Kalıcı olarak silindi.");
}
