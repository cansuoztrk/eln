import "server-only";
import { authorNames } from "@/lib/auth/members";
import type { Session } from "@/lib/auth/session";
import type { NoteKind } from "./schema";

export type DistanceNote = {
  id: string;
  kind: NoteKind;
  body: string;
  createdAt: string;
  authorName: string;
  authorRole: "owner" | "partner";
  mine: boolean;
};

/** Short notes of one kind, newest first. */
export async function listNotes(session: Session, kind: NoteKind): Promise<DistanceNote[]> {
  const [{ data }, nameOf] = await Promise.all([
    session.supabase
      .from("distance_notes")
      .select("id, kind, body, created_at, created_by")
      .eq("space_id", session.space.id)
      .eq("kind", kind)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    authorNames(session),
  ]);

  return (data ?? []).map((row) => {
    const name = nameOf(row.created_by);
    return {
      id: row.id,
      kind: row.kind as NoteKind,
      body: row.body,
      createdAt: row.created_at,
      authorName: name,
      authorRole: name === session.space.owner_name ? "owner" : "partner",
      mine: row.created_by === session.userId,
    };
  });
}
