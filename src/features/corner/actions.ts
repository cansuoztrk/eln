"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/result";
import { toJson } from "@/lib/supabase/json";
import { preferencesSchema, type Preferences } from "./schema";

/** Saves the caller's own preferences. */
export async function savePreferencesAction(input: Preferences): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return fail("Bu seçim kaydedilemedi.");

  const { error } = await session.supabase
    .from("user_preferences")
    .upsert({ user_id: session.userId, space_id: session.space.id, data: toJson(parsed.data), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/", "layout");
  return ok();
}
