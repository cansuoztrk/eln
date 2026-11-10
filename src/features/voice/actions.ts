"use server";

import { revalidatePath } from "next/cache";
import { viewerToday } from "@/features/dates/queries";
import { getSession } from "@/lib/auth/session";
import { toISODate } from "@/lib/dates";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { toJson } from "@/lib/supabase/json";
import { voiceSchema, type VoiceInput } from "./schema";

/** Keeps a new recording, or renames / publishes an existing one. */
export async function saveVoiceAction(input: VoiceInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = voiceSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;
  const status = value.publish ? ("published" as const) : ("draft" as const);

  if (value.id) {
    const { error } = await session.supabase.from("voice_memories").update({ title: value.title, description: value.description, status }).eq("id", value.id);
    if (error) return fail(GENERIC_ERROR);
  } else {
    if (!value.assetId) return fail("Kayıt bulunamadı.");
    // The recording must be the caller's own, verified upload.
    const { data: asset } = await session.supabase
      .from("media_assets")
      .select("id")
      .eq("id", value.assetId)
      .eq("uploaded_by", session.userId)
      .eq("kind", "audio")
      .eq("state", "ready")
      .maybeSingle();
    if (!asset) return fail("Kayıt bulunamadı.");

    const { error } = await session.supabase.from("voice_memories").insert({
      space_id: session.space.id,
      asset_id: asset.id,
      title: value.title,
      description: value.description,
      recorded_on: toISODate(viewerToday(session)),
      duration_ms: value.durationMs ?? 0,
      waveform: toJson(value.waveform ?? []),
      status,
    });
    if (error) return fail(GENERIC_ERROR);
  }

  revalidatePath("/voice");
  return ok(undefined, value.publish ? "Ses kaydı paylaşıldı." : "Taslak olarak saklandı.");
}
