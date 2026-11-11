import "server-only";
import type { Session } from "@/lib/auth/session";

export type QuestionCard = {
  id: string;
  prompt: string;
  category: string;
  together: boolean;
  mine: boolean;
  myAnswer: { id: string; body: string } | null;
  /** Null when there is none — or when it is still hidden by the "together" rule. */
  theirAnswer: string | null;
};

/**
 * Questions with the answers the viewer may read. For "together" questions
 * row level security withholds the other answer until the viewer has written
 * their own, so nothing here needs to hide it by hand.
 */
export async function listQuestions(session: Session): Promise<QuestionCard[]> {
  const [{ data: questions }, { data: answers }] = await Promise.all([
    session.supabase
      .from("questions")
      .select("id, prompt, category, together, created_by")
      .eq("space_id", session.space.id)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    session.supabase.from("answers").select("id, question_id, body, created_by").eq("space_id", session.space.id).is("deleted_at", null),
  ]);

  return (questions ?? []).map((q) => {
    const own = (answers ?? []).find((a) => a.question_id === q.id && a.created_by === session.userId);
    const other = (answers ?? []).find((a) => a.question_id === q.id && a.created_by !== session.userId);
    return {
      id: q.id,
      prompt: q.prompt,
      category: q.category,
      together: q.together,
      mine: q.created_by === session.userId,
      myAnswer: own ? { id: own.id, body: own.body } : null,
      theirAnswer: other?.body ?? null,
    };
  });
}
