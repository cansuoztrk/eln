import "server-only";
import type { Session } from "@/lib/auth/session";
import { VERSIONED, type VersionedTable } from "./registry";

export type Version = { id: string; savedAt: string; title: string; preview: string };

/**
 * Earlier versions of something the viewer wrote, newest first. Row level
 * security returns history only to its author, so this is empty for anyone else.
 */
export async function listVersions(session: Session, table: VersionedTable, entityId: string): Promise<Version[]> {
  const { data } = await session.supabase
    .from("content_versions")
    .select("id, created_at, snapshot")
    .eq("entity_table", table)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((row) => {
    const snapshot = (row.snapshot ?? {}) as Record<string, unknown>;
    const text = String(snapshot[VERSIONED[table].preview] ?? "").trim();
    return {
      id: row.id,
      savedAt: row.created_at,
      title: String(snapshot.title ?? ""),
      preview: text.length > 220 ? `${text.slice(0, 220)}…` : text,
    };
  });
}
