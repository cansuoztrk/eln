import "server-only";
import { authorNames } from "@/lib/auth/members";
import type { Session } from "@/lib/auth/session";
import { ASSET_COLUMNS, signImages, type SignedImage } from "@/lib/media/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Photos are always real uploads. This module turns `photos` rows (already
 * filtered by row level security) into view models with signed image URLs.
 * It is the one place other features go when they need a photograph.
 */

export type Photo = {
  id: string;
  caption: string;
  altText: string;
  takenOn: string | null;
  tags: string[];
  isFavorite: boolean;
  showInGallery: boolean;
  displayStyle: "editorial" | "polaroid";
  albumId: string | null;
  status: "draft" | "published";
  sortOrder: number;
  authorId: string;
  authorName: string;
  mine: boolean;
  createdAt: string;
  image: SignedImage;
};

export type Album = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "published";
  sortOrder: number;
  coverPhotoId: string | null;
  cover: SignedImage | null;
  photoCount: number;
};

const PHOTO_SELECT = `*, asset:media_assets(${ASSET_COLUMNS})` as const;

type PhotoRow = Tables<"photos"> & {
  asset: Pick<Tables<"media_assets">, "id" | "variants" | "width" | "height" | "placeholder" | "original_path"> | null;
};

/** Signs and shapes rows. Rows whose file is not ready or not visible are dropped. */
export async function toPhotos(session: Session, rows: PhotoRow[]): Promise<Photo[]> {
  const [signed, nameOf] = await Promise.all([signImages(rows.map((row) => row.asset)), authorNames(session)]);
  const out: Photo[] = [];
  for (const row of rows) {
    const image = row.asset ? signed.get(row.asset.id) : undefined;
    if (!image) continue;
    out.push({
      id: row.id,
      caption: row.caption,
      altText: row.alt_text,
      takenOn: row.taken_on,
      tags: row.tags,
      isFavorite: row.is_favorite,
      showInGallery: row.show_in_gallery,
      displayStyle: row.display_style as Photo["displayStyle"],
      albumId: row.album_id,
      status: row.status,
      sortOrder: row.sort_order,
      authorId: row.created_by,
      authorName: nameOf(row.created_by),
      mine: row.created_by === session.userId,
      createdAt: row.created_at,
      image,
    });
  }
  return out;
}

/** What the gallery shows: published photos that are meant to be in it. */
export async function listGalleryPhotos(
  session: Session,
  filter: { albumId?: string; tag?: string; favorites?: boolean } = {},
): Promise<Photo[]> {
  let query = session.supabase
    .from("photos")
    .select(PHOTO_SELECT)
    .eq("space_id", session.space.id)
    .eq("status", "published")
    .eq("show_in_gallery", true)
    .is("deleted_at", null);

  if (filter.albumId) query = query.eq("album_id", filter.albumId);
  if (filter.tag) query = query.contains("tags", [filter.tag]);
  if (filter.favorites) query = query.eq("is_favorite", true);

  const { data } = await query
    .order("sort_order", { ascending: true })
    .order("taken_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(400);
  return toPhotos(session, (data ?? []) as PhotoRow[]);
}

/**
 * Every photo the viewer may manage or reuse: their own in any state, and —
 * for the owner — published photos from the partner. Powers the Studio
 * library and the photo picker.
 */
export async function listLibrary(session: Session): Promise<Photo[]> {
  const { data } = await session.supabase
    .from("photos")
    .select(PHOTO_SELECT)
    .eq("space_id", session.space.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(600);
  return toPhotos(session, (data ?? []) as PhotoRow[]);
}

/** Specific photos by id, in the order asked for. Missing or hidden ones are skipped. */
export async function getPhotos(session: Session, ids: (string | null | undefined)[]): Promise<Map<string, Photo>> {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (wanted.length === 0) return new Map();
  const { data } = await session.supabase.from("photos").select(PHOTO_SELECT).in("id", wanted).is("deleted_at", null);
  const photos = await toPhotos(session, (data ?? []) as PhotoRow[]);
  return new Map(photos.map((photo) => [photo.id, photo]));
}

export async function getPhoto(session: Session, id: string | null | undefined): Promise<Photo | null> {
  if (!id) return null;
  return (await getPhotos(session, [id])).get(id) ?? null;
}

/** Albums with a cover and a count of the photos the viewer can see in them. */
export async function listAlbums(session: Session, options: { includeDrafts?: boolean } = {}): Promise<Album[]> {
  let query = session.supabase
    .from("albums")
    .select("*")
    .eq("space_id", session.space.id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (!options.includeDrafts) query = query.eq("status", "published");

  const { data: albums } = await query;
  if (!albums?.length) return [];

  const { data: members } = await session.supabase
    .from("photos")
    .select("id, album_id, status")
    .in(
      "album_id",
      albums.map((a) => a.id),
    )
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const counted = (members ?? []).filter((p) => options.includeDrafts || p.status === "published");
  const firstByAlbum = new Map<string, string>();
  const countByAlbum = new Map<string, number>();
  for (const photo of counted) {
    if (!photo.album_id) continue;
    if (!firstByAlbum.has(photo.album_id)) firstByAlbum.set(photo.album_id, photo.id);
    countByAlbum.set(photo.album_id, (countByAlbum.get(photo.album_id) ?? 0) + 1);
  }

  const coverIds = albums.map((a) => a.cover_photo_id ?? firstByAlbum.get(a.id));
  const covers = await getPhotos(session, coverIds);

  return albums.map((album) => {
    const coverId = album.cover_photo_id ?? firstByAlbum.get(album.id) ?? null;
    return {
      id: album.id,
      title: album.title,
      description: album.description,
      status: album.status,
      sortOrder: album.sort_order,
      coverPhotoId: album.cover_photo_id,
      cover: coverId ? (covers.get(coverId)?.image ?? null) : null,
      photoCount: countByAlbum.get(album.id) ?? 0,
    };
  });
}

/** Which published memories each photo belongs to — for "seen in" links in the lightbox. */
export async function listPhotoMemories(
  session: Session,
  photoIds: string[],
): Promise<Record<string, { id: string; title: string }[]>> {
  if (photoIds.length === 0) return {};
  const { data } = await session.supabase
    .from("memory_photos")
    .select("photo_id, memory:memories(id, title, status, deleted_at)")
    .in("photo_id", photoIds);
  const out: Record<string, { id: string; title: string }[]> = {};
  for (const row of data ?? []) {
    const memory = row.memory;
    if (!memory || memory.status !== "published" || memory.deleted_at) continue;
    (out[row.photo_id] ??= []).push({ id: memory.id, title: memory.title });
  }
  return out;
}
