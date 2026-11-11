import "server-only";
import type { Session } from "@/lib/auth/session";
import { TRASHABLE, type TrashableTable } from "@/features/trash/registry";

type Counts = { published: number; draft: number };

async function count(session: Session, table: "photos" | "letters" | "memories" | "special_day_editions"): Promise<Counts> {
  const base = () =>
    session.supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("space_id", session.space.id)
      .eq("created_by", session.userId)
      .is("deleted_at", null);
  const [published, draft] = await Promise.all([base().eq("status", "published"), base().eq("status", "draft")]);
  return { published: published.count ?? 0, draft: draft.count ?? 0 };
}

/** What the Studio's front page needs to say how ready the world is. */
export async function getOverview(session: Session) {
  const [photos, letters, memories, editions, members, invites, drafts] = await Promise.all([
    count(session, "photos"),
    count(session, "letters"),
    count(session, "memories"),
    count(session, "special_day_editions"),
    session.supabase.from("space_members").select("role").eq("space_id", session.space.id),
    session.supabase
      .from("space_invites")
      .select("id, email, display_name, expires_at, accepted_at, revoked_at, created_at")
      .eq("space_id", session.space.id)
      .order("created_at", { ascending: false })
      .limit(10),
    session.supabase.from("content_section_drafts").select("key").eq("space_id", session.space.id),
  ]);

  return {
    photos,
    letters,
    memories,
    editions,
    partnerJoined: (members.data ?? []).some((m) => m.role === "partner"),
    invites: invites.data ?? [],
    sectionDrafts: (drafts.data ?? []).map((d) => d.key),
  };
}

export type TrashItem = { table: TrashableTable; label: string; id: string; title: string; deletedAt: string };

/**
 * Everything in the trash that the viewer is allowed to bring back. Row level
 * security decides what that is: their own items, plus — for the owner —
 * published items they tidied away.
 */
export async function listTrash(session: Session): Promise<TrashItem[]> {
  const tables = Object.keys(TRASHABLE) as TrashableTable[];
  const results = await Promise.all(
    tables.map(async (table) => {
      const titleColumn = TRASHABLE[table].title;
      const { data } = await session.supabase
        .from(table)
        .select("*")
        .eq("space_id", session.space.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(100);
      return (data ?? []).map((row) => {
        const record = row as unknown as Record<string, unknown>;
        const raw = String(record[titleColumn] ?? "").trim();
        return {
          table,
          label: TRASHABLE[table].label,
          id: String(record.id),
          title: raw ? (raw.length > 90 ? `${raw.slice(0, 90)}…` : raw) : "(başlıksız)",
          deletedAt: String(record.deleted_at),
        } satisfies TrashItem;
      });
    }),
  );
  return results.flat().sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}
