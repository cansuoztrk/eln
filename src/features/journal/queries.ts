import "server-only";
import { getPhotos, type Photo } from "@/features/gallery/queries";
import { authorNames } from "@/lib/auth/members";
import type { Session } from "@/lib/auth/session";

export type Entry = {
  id: string;
  title: string;
  body: string;
  entryDate: string;
  tags: string[];
  visibility: "shared" | "private";
  status: "draft" | "published";
  authorName: string;
  authorRole: "owner" | "partner";
  mine: boolean;
  photos: Photo[];
};

/**
 * The journal as the viewer may read it: their own entries in every state,
 * and the other person's only once published and shared. Row level security
 * makes that cut; this function only shapes what came back.
 */
export async function listEntries(session: Session): Promise<Entry[]> {
  const [{ data }, nameOf] = await Promise.all([
    session.supabase
      .from("journal_entries")
      .select("*, journal_entry_photos(photo_id, sort_order)")
      .eq("space_id", session.space.id)
      .is("deleted_at", null)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300),
    authorNames(session),
  ]);
  const rows = data ?? [];
  const photos = await getPhotos(session, rows.flatMap((row) => row.journal_entry_photos.map((p) => p.photo_id)));

  return rows.map((row) => {
    const name = nameOf(row.created_by);
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      entryDate: row.entry_date,
      tags: row.tags,
      visibility: row.visibility as Entry["visibility"],
      status: row.status,
      authorName: name,
      authorRole: name === session.space.owner_name ? "owner" : "partner",
      mine: row.created_by === session.userId,
      photos: [...row.journal_entry_photos]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => photos.get(p.photo_id))
        .filter((p): p is Photo => Boolean(p)),
    };
  });
}
