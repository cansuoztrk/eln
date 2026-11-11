import "server-only";
import { getPhotos, type Photo } from "@/features/gallery/queries";
import { authorNames } from "@/lib/auth/members";
import type { Session } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/database.types";
import type { StarTone } from "./schema";

export type Memory = {
  id: string;
  title: string;
  /** ISO date, or null when the day is not known. */
  happenedOn: string | null;
  datePrecision: "day" | "month" | "year";
  summary: string;
  description: string;
  specialNote: string;
  category: string;
  tags: string[];
  albumId: string | null;
  voiceMemoryId: string | null;
  /** Set on the two seeded milestones: "met" / "together". */
  relationshipDateKey: string | null;
  starSize: number;
  starTone: StarTone;
  status: "draft" | "published";
  sortOrder: number;
  authorId: string;
  authorName: string;
  mine: boolean;
  photos: Photo[];
  cover: Photo | null;
};

type Row = Tables<"memories"> & { memory_photos: { photo_id: string; sort_order: number }[] };

const SELECT = "*, memory_photos(photo_id, sort_order)" as const;

async function toMemories(session: Session, rows: Row[], withPhotos: boolean): Promise<Memory[]> {
  const ordered = rows.map((row) => [...row.memory_photos].sort((a, b) => a.sort_order - b.sort_order).map((p) => p.photo_id));
  const [photoMap, nameOf] = await Promise.all([
    withPhotos ? getPhotos(session, ordered.flat()) : Promise.resolve(new Map<string, Photo>()),
    authorNames(session),
  ]);

  return rows.map((row, i) => {
    const photos = ordered[i].map((id) => photoMap.get(id)).filter((p): p is Photo => Boolean(p));
    return {
      id: row.id,
      title: row.title,
      happenedOn: row.happened_on,
      datePrecision: row.date_precision as Memory["datePrecision"],
      summary: row.summary,
      description: row.description,
      specialNote: row.special_note,
      category: row.category,
      tags: row.tags,
      albumId: row.album_id,
      voiceMemoryId: row.voice_memory_id,
      relationshipDateKey: row.relationship_date_key,
      starSize: row.star_size,
      starTone: row.star_tone as StarTone,
      status: row.status,
      sortOrder: row.sort_order,
      authorId: row.created_by,
      authorName: nameOf(row.created_by),
      mine: row.created_by === session.userId,
      photos,
      cover: photos[0] ?? null,
    };
  });
}

/**
 * Published memories in the order they happened; undated ones last.
 * Used by Our Story, the home page and the Memory Universe.
 */
export async function listMemories(session: Session, options: { withPhotos?: boolean } = {}): Promise<Memory[]> {
  const { data } = await session.supabase
    .from("memories")
    .select(SELECT)
    .eq("space_id", session.space.id)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("happened_on", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return toMemories(session, (data ?? []) as Row[], options.withPhotos ?? true);
}

/** One memory, if the viewer may see it (published, or their own draft). */
export async function getMemory(session: Session, id: string): Promise<Memory | null> {
  const { data } = await session.supabase.from("memories").select(SELECT).eq("id", id).is("deleted_at", null).maybeSingle();
  if (!data) return null;
  return (await toMemories(session, [data as Row], true))[0];
}

/** Everything the viewer may edit: their own (drafts included) and, for the owner, the partner's published ones. */
export async function listEditableMemories(session: Session): Promise<Memory[]> {
  const { data } = await session.supabase
    .from("memories")
    .select(SELECT)
    .eq("space_id", session.space.id)
    .is("deleted_at", null)
    .order("happened_on", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const memories = await toMemories(session, (data ?? []) as Row[], true);
  return session.role === "owner" ? memories : memories.filter((m) => m.mine);
}
