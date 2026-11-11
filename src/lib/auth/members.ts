import "server-only";
import { cache } from "react";
import type { Role, Session } from "./session";

export type Member = { userId: string; role: Role; name: string };

/** The (at most two) people in the space, for "who wrote this". */
export const getMembers = cache(async (session: Session): Promise<Member[]> => {
  const { data } = await session.supabase
    .from("space_members")
    .select("user_id, role")
    .eq("space_id", session.space.id);

  return (data ?? []).map((row) => ({
    userId: row.user_id,
    role: row.role,
    name: row.role === "owner" ? session.space.owner_name : session.space.partner_name,
  }));
});

/** Resolves an author id to a display name. Falls back to a neutral label. */
export async function authorNames(session: Session): Promise<(userId: string) => string> {
  const members = await getMembers(session);
  const byId = new Map(members.map((m) => [m.userId, m.name]));
  return (userId) => byId.get(userId) ?? "—";
}

export async function roleOf(session: Session, userId: string): Promise<Role | null> {
  const members = await getMembers(session);
  return members.find((m) => m.userId === userId)?.role ?? null;
}
