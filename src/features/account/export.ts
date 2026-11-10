import "server-only";
import type { Session } from "@/lib/auth/session";

/** Tables holding things a person wrote or uploaded, and the column that says who. */
const OWN = [
  ["media_assets", "uploaded_by"],
  ["photos", "created_by"],
  ["memories", "created_by"],
  ["letters", "created_by"],
  ["voice_memories", "created_by"],
  ["time_capsules", "created_by"],
  ["journal_entries", "created_by"],
  ["future_plans", "created_by"],
  ["questions", "created_by"],
  ["answers", "created_by"],
  ["distance_notes", "created_by"],
] as const;

/** Site-level content. Only the owner writes these, so only the owner's export carries them. */
const SITE = ["relationship_dates", "special_days", "special_day_editions", "albums", "daily_notes", "content_sections", "theme_settings"] as const;

/**
 * Everything that belongs to the person asking, as plain data. Read through
 * their own session, so it can never contain the other person's drafts or
 * sealed writing.
 */
export async function collectExport(session: Session) {
  // Tables are picked by name here, so the client is viewed through a plain, untyped lens.
  const rows = session.supabase as unknown as {
    from(table: string): { select(columns: string): { eq(column: string, value: string): PromiseLike<{ data: Record<string, unknown>[] | null }> } };
  };

  const own = await Promise.all(
    OWN.map(async ([table, column]) => {
      const { data } = await rows.from(table).select("*").eq(column, session.userId);
      return [table, data ?? []] as const;
    }),
  );
  const site =
    session.role === "owner"
      ? await Promise.all(
          SITE.map(async (table) => {
            const { data } = await rows.from(table).select("*").eq("space_id", session.space.id);
            return [table, data ?? []] as const;
          }),
        )
      : [];

  const [{ data: preferences }, { data: links }] = await Promise.all([
    session.supabase.from("user_preferences").select("*").eq("user_id", session.userId),
    session.supabase.from("memory_photos").select("*").eq("space_id", session.space.id),
  ]);
  const myMemories = new Set((own.find(([t]) => t === "memories")?.[1] ?? []).map((m) => (m as { id: string }).id));

  return {
    exportedAt: new Date().toISOString(),
    about: "ELNARE — Beyond Distance · kişisel veri dışa aktarımı",
    person: { name: session.profile.display_name, email: session.email, role: session.role },
    profile: session.profile,
    preferences: preferences ?? [],
    ...Object.fromEntries(own),
    memory_photos: (links ?? []).filter((link) => myMemories.has(link.memory_id)),
    ...Object.fromEntries(site),
  };
}
