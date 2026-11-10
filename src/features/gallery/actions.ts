"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { listLibrary, type Photo } from "./queries";
import { albumSchema, createPhotoSchema, photoSchema, type AlbumInput, type CreatePhotoInput, type PhotoInput } from "./schema";

function refresh() {
  revalidatePath("/gallery");
  revalidatePath("/studio/photos");
  revalidatePath("/");
}

/**
 * Wraps a freshly uploaded file in a photo. It starts as a draft unless the
 * caller says otherwise, so nothing appears on the site by accident.
 */
export async function createPhotoAction(input: CreatePhotoInput): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");

  const parsed = createPhotoSchema.safeParse(input);
  if (!parsed.success) return fail("Fotoğraf eklenemedi.");

  // The asset must be the caller's own, finished upload.
  const { data: asset } = await session.supabase
    .from("media_assets")
    .select("id")
    .eq("id", parsed.data.assetId)
    .eq("uploaded_by", session.userId)
    .eq("kind", "image")
    .eq("state", "ready")
    .maybeSingle();
  if (!asset) return fail("Yüklenen dosya bulunamadı.");

  const { data, error } = await session.supabase
    .from("photos")
    .insert({
      space_id: session.space.id,
      asset_id: asset.id,
      album_id: parsed.data.albumId ?? null,
      status: parsed.data.publish ? "published" : "draft",
      show_in_gallery: parsed.data.showInGallery ?? true,
    })
    .select("id")
    .single();
  if (error || !data) return fail(GENERIC_ERROR);

  refresh();
  return ok({ id: data.id });
}

export async function updatePhotoAction(input: PhotoInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");

  const parsed = photoSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;

  const { data, error } = await session.supabase
    .from("photos")
    .update({
      caption: value.caption,
      alt_text: value.altText,
      taken_on: value.takenOn || null,
      tags: value.tags,
      album_id: value.albumId,
      is_favorite: value.isFavorite,
      show_in_gallery: value.showInGallery,
      display_style: value.displayStyle,
      status: value.publish ? "published" : "draft",
    })
    .eq("id", value.id)
    .select("id");
  if (error || !data?.length) return fail("Bu fotoğraf güncellenemedi.");

  refresh();
  return ok(undefined, value.publish ? "Fotoğraf yayında." : "Taslak kaydedildi.");
}

/** Publishes or unpublishes several photos at once. */
export async function setPhotosStatusAction(ids: string[], publish: boolean): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (ids.length === 0 || ids.length > 200) return fail("Geçersiz seçim.");

  const { error } = await session.supabase
    .from("photos")
    .update({ status: publish ? "published" : "draft" })
    .in("id", ids)
    .eq("created_by", session.userId);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, publish ? "Seçilenler yayımlandı." : "Seçilenler taslağa alındı.");
}

/** Saves a new order for photos (the order of `ids` becomes the order shown). */
export async function reorderPhotosAction(ids: string[]): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (ids.length > 600) return fail("Geçersiz sıralama.");

  const results = await Promise.all(
    ids.map((id, index) => session.supabase.from("photos").update({ sort_order: index }).eq("id", id)),
  );
  if (results.some((r) => r.error)) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, "Sıra kaydedildi.");
}

export async function saveAlbumAction(input: AlbumInput): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || session.role !== "owner") return fail("Bu işlem için yetkin yok.");

  const parsed = albumSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;

  const row = {
    title: value.title,
    description: value.description,
    cover_photo_id: value.coverPhotoId,
    status: value.publish ? ("published" as const) : ("draft" as const),
  };

  const { data, error } = value.id
    ? await session.supabase.from("albums").update(row).eq("id", value.id).select("id").maybeSingle()
    : await session.supabase
        .from("albums")
        .insert({ ...row, space_id: session.space.id })
        .select("id")
        .maybeSingle();
  if (error || !data) return fail(GENERIC_ERROR);

  refresh();
  return ok({ id: data.id }, "Albüm kaydedildi.");
}

/** The viewer's photo library, for the picker dialog. */
export async function loadLibraryAction(): Promise<ActionResult<Photo[]>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  return ok(await listLibrary(session));
}

const MAX_BULK = 200;

/** Moves several of the caller's photos into an album, or out of any album. */
export async function movePhotosToAlbumAction(ids: string[], albumId: string | null): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (ids.length === 0 || ids.length > MAX_BULK) return fail("Geçersiz seçim.");

  const { error } = await session.supabase.from("photos").update({ album_id: albumId }).in("id", ids);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, albumId ? "Albüme taşındı." : "Albümden çıkarıldı.");
}

/** Moves several photos to the trash at once. They can be restored from there. */
export async function trashPhotosAction(ids: string[]): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (ids.length === 0 || ids.length > MAX_BULK) return fail("Geçersiz seçim.");

  const { error } = await session.supabase
    .from("photos")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids)
    .is("deleted_at", null);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  revalidatePath("/studio/trash");
  return ok(undefined, "Çöp kutusuna taşındı. İstersen geri alabilirsin.");
}

export async function reorderAlbumsAction(ids: string[]): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "owner") return fail("Bu işlem için yetkin yok.");
  if (ids.length > MAX_BULK) return fail("Geçersiz sıralama.");

  const results = await Promise.all(
    ids.map((id, index) => session.supabase.from("albums").update({ sort_order: index }).eq("id", id)),
  );
  if (results.some((r) => r.error)) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, "Albüm sırası kaydedildi.");
}
