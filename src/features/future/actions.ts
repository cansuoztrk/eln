"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { viewerToday } from "@/features/dates/queries";
import { getSession } from "@/lib/auth/session";
import { toISODate } from "@/lib/dates";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/security/rate-limit";
import { planSchema, type PlanInput } from "./schema";

const refresh = () => ["/future", "/universe", "/"].forEach((path) => revalidatePath(path));

export async function savePlanAction(input: PlanInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimit("write", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);
  const value = parsed.data;
  const row = { title: value.title, description: value.description, category: value.category, target_date: value.targetDate || null };

  const { error } = value.id
    ? await session.supabase.from("future_plans").update(row).eq("id", value.id)
    : await session.supabase.from("future_plans").insert({ ...row, space_id: session.space.id });
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, value.id ? "Kaydedildi." : "Listeye eklendi.");
}

/** Moves a plan between "dream" and "planned". Marking it done has its own, deliberate action. */
export async function setPlanStateAction(id: string, state: "dream" | "planned"): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (!z.uuid().safeParse(id).success) return fail("Geçersiz istek.");

  const { error } = await session.supabase.from("future_plans").update({ state, completed_on: null }).eq("id", id);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, state === "planned" ? "Planlandı olarak işaretlendi." : "Hayallere geri alındı.");
}

/**
 * Says that something really happened. Only ever called from a confirmation
 * dialog a person has just agreed to — nothing on the site marks a plan as
 * done by itself. If asked, a draft memory is started for the day, for its
 * author to write.
 */
export async function completePlanAction(input: { id: string; confirmed: boolean; asMemory: boolean }): Promise<ActionResult<{ memoryId: string | null }>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (!z.uuid().safeParse(input.id).success || input.confirmed !== true) return fail("Onay gerekli.");

  const today = toISODate(viewerToday(session));
  const { data: plan } = await session.supabase.from("future_plans").select("id, title, memory_id").eq("id", input.id).maybeSingle();
  if (!plan) return fail("Bu hayal bulunamadı.");

  let memoryId = plan.memory_id;
  if (input.asMemory && !memoryId) {
    const { data: memory } = await session.supabase
      .from("memories")
      .insert({ space_id: session.space.id, title: plan.title, happened_on: today, category: "dream", status: "draft" })
      .select("id")
      .single();
    memoryId = memory?.id ?? null;
  }

  const { error } = await session.supabase.from("future_plans").update({ state: "done", completed_on: today, memory_id: memoryId }).eq("id", input.id);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  revalidatePath("/story");
  return ok({ memoryId }, "Gerçekleşti olarak işaretlendi.");
}
