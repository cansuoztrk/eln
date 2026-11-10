"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/security/rate-limit";
import { answerSchema, questionSchema, STARTER_QUESTIONS } from "./schema";

export async function addQuestionAction(input: { prompt: string; category: string; together: boolean }): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimit("write", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);

  const { error } = await session.supabase.from("questions").insert({ space_id: session.space.id, ...parsed.data });
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/questions");
  return ok(undefined, "Soru eklendi.");
}

/** Adds the starter questions that are not in the list yet. */
export async function addStarterQuestionsAction(): Promise<ActionResult<{ added: number }>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");

  const { data: existing } = await session.supabase.from("questions").select("prompt").eq("space_id", session.space.id).is("deleted_at", null);
  const have = new Set((existing ?? []).map((q) => q.prompt));
  const fresh = STARTER_QUESTIONS.filter((q) => !have.has(q.prompt));
  if (fresh.length === 0) return ok({ added: 0 }, "Başlangıç sorularının hepsi zaten listede.");

  const { error } = await session.supabase
    .from("questions")
    .insert(fresh.map((q, index) => ({ space_id: session.space.id, prompt: q.prompt, category: q.category, together: q.together ?? false, sort_order: index })));
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/questions");
  return ok({ added: fresh.length }, `${fresh.length} soru eklendi.`);
}

/** Writes or rewrites one's own answer to a question. One answer each. */
export async function saveAnswerAction(input: { questionId: string; body: string }): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimit("write", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);

  const { data: existing } = await session.supabase
    .from("answers")
    .select("id")
    .eq("question_id", parsed.data.questionId)
    .eq("created_by", session.userId)
    .maybeSingle();

  const { error } = existing
    ? await session.supabase.from("answers").update({ body: parsed.data.body, deleted_at: null, status: "published" }).eq("id", existing.id)
    : await session.supabase.from("answers").insert({ space_id: session.space.id, question_id: parsed.data.questionId, body: parsed.data.body });
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/questions");
  return ok(undefined, "Cevabın kaydedildi.");
}
