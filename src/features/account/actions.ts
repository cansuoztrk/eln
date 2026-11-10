"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { purgeAsset } from "@/lib/media/server";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserClient } from "@/lib/supabase/server";

const profileSchema = z.object({ displayName: z.string().trim().min(1, "Bir ad yaz.").max(60) });

export async function updateProfileAction(input: z.input<typeof profileSchema>): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { error } = await session.supabase.from("profiles").update({ display_name: parsed.data.displayName }).eq("id", session.userId);
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/", "layout");
  return ok(undefined, "Kaydedildi.");
}

const passwordSchema = z
  .object({ password: z.string().min(10, "Parola en az 10 karakter olmalı.").max(128), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Parolalar aynı değil." });

export async function changePasswordAction(input: z.input<typeof passwordSchema>): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimit("login", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);

  const supabase = await createUserClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail("Parola değiştirilemedi. Farklı bir parola dene.");
  return ok(undefined, "Parolan değişti.");
}

const deleteSchema = z.object({ confirmation: z.string() });

/**
 * Deletes the caller's account for good, together with everything they added:
 * their writing, their photos and the files behind them. For the partner this
 * removes only her side; what Arda wrote for her remains his.
 *
 * The owner's account is the space itself, so deleting it deletes everything.
 * Both require typing an exact phrase.
 */
export async function deleteAccountAction(input: z.input<typeof deleteSchema>): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = deleteSchema.safeParse(input);
  const phrase = session.role === "owner" ? "HER ŞEYİ SİL" : "HESABIMI SİL";
  if (!parsed.success || parsed.data.confirmation.trim() !== phrase) {
    return fail("Onay ifadesi eşleşmiyor.", { confirmation: `Tam olarak şunu yaz: ${phrase}` });
  }
  if (!(await rateLimit("export", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);

  const admin = createAdminClient();

  // Files first: once the rows are gone nothing would point at them any more.
  const filter = session.role === "owner" ? admin.from("media_assets").select("id, original_path, variants").eq("space_id", session.space.id) : admin.from("media_assets").select("id, original_path, variants").eq("uploaded_by", session.userId);
  const { data: assets } = await filter;
  for (const asset of assets ?? []) await purgeAsset(asset);

  if (session.role === "owner") {
    // The space and both memberships go with the owner. The partner's own account is removed too.
    const { data: members } = await admin.from("space_members").select("user_id").eq("space_id", session.space.id);
    for (const member of members ?? []) {
      if (member.user_id !== session.userId) await admin.auth.admin.deleteUser(member.user_id);
    }
  }

  const supabase = await createUserClient();
  await supabase.auth.signOut({ scope: "local" });
  const { error } = await admin.auth.admin.deleteUser(session.userId);
  if (error) return fail(GENERIC_ERROR);

  return ok({ redirectTo: "/login" });
}
