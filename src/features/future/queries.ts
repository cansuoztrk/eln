import "server-only";
import { authorNames } from "@/lib/auth/members";
import type { Session } from "@/lib/auth/session";
import type { PlanState } from "./schema";

export type Plan = {
  id: string;
  title: string;
  description: string;
  category: string;
  state: PlanState;
  targetDate: string | null;
  completedOn: string | null;
  memoryId: string | null;
  authorName: string;
  mine: boolean;
};

/** The shared list of things they want to do together. */
export async function listPlans(session: Session): Promise<Plan[]> {
  const [{ data }, nameOf] = await Promise.all([
    session.supabase
      .from("future_plans")
      .select("*")
      .eq("space_id", session.space.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    authorNames(session),
  ]);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    state: row.state as PlanState,
    targetDate: row.target_date,
    completedOn: row.completed_on,
    memoryId: row.memory_id,
    authorName: nameOf(row.created_by),
    mine: row.created_by === session.userId,
  }));
}
