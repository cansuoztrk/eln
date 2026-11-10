import "server-only";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import type { Session } from "@/lib/auth/session";
import { createAdminClient, MEDIA_BUCKET } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";
import { toJson } from "@/lib/supabase/json";
import { baseMime, extensionFor, rejectionReason, sniff, sniffMatches, type MediaKind } from "./rules";

/**
 * The media pipeline.
 *
 *   1. `beginUpload`   registers the file and hands the browser a one-time
 *                      signed URL; the bytes go straight to private storage.
 *   2. `finalizeUpload` reads the original back, verifies it really is what it
 *                      claims to be and — for photos — writes re-encoded,
 *                      metadata-free variants. The original is never touched.
 *   3. `signImages` / `signAudio` turn rows the viewer is allowed to see (RLS
 *                      already decided that) into short-lived URLs.
 *
 * Storage has no member-facing policies at all; only this module reaches it.
 */

export type MediaAsset = Tables<"media_assets">;

type Variant = { path: string; width: number; height: number };
type Variants = Partial<Record<"thumb" | "medium" | "large", Variant>>;

const VARIANT_SPECS = [
  { name: "thumb", width: 520, quality: 72 },
  { name: "medium", width: 1280, quality: 80 },
  { name: "large", width: 2400, quality: 82 },
] as const;

/** Signed URLs outlive a long reading session, but not a day. */
const SIGNED_URL_SECONDS = 6 * 60 * 60;

export type UploadTicket = { assetId: string; uploadUrl: string };

export async function beginUpload(
  session: Session,
  input: { kind: MediaKind; filename: string; mimeType: string; size: number },
): Promise<{ ok: true; ticket: UploadTicket } | { ok: false; error: string }> {
  const reason = rejectionReason(input.kind, { type: input.mimeType, size: input.size });
  if (reason) return { ok: false, error: reason };

  const extension = extensionFor(input.mimeType);
  if (!extension) return { ok: false, error: "Bu dosya türü desteklenmiyor." };

  const assetId = randomUUID();
  const folder = input.kind === "image" ? "originals" : "audio";
  const path = `${session.space.id}/${folder}/${assetId}/original.${extension}`;

  // Registered as the signed-in person, so RLS vouches for the membership.
  const { error } = await session.supabase.from("media_assets").insert({
    id: assetId,
    space_id: session.space.id,
    kind: input.kind,
    original_path: path,
    mime_type: baseMime(input.mimeType),
    byte_size: input.size,
    original_filename: input.filename.slice(0, 255),
  });
  if (error) return { ok: false, error: "Yükleme başlatılamadı." };

  const signed = await createAdminClient().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (signed.error || !signed.data) {
    await createAdminClient().from("media_assets").delete().eq("id", assetId);
    return { ok: false, error: "Yükleme başlatılamadı." };
  }

  return { ok: true, ticket: { assetId, uploadUrl: signed.data.signedUrl } };
}

export async function finalizeUpload(
  session: Session,
  assetId: string,
): Promise<{ ok: true; asset: MediaAsset } | { ok: false; error: string }> {
  const admin = createAdminClient();

  // Only the uploader may finalize their own pending upload.
  const { data: asset } = await session.supabase
    .from("media_assets")
    .select("*")
    .eq("id", assetId)
    .eq("uploaded_by", session.userId)
    .maybeSingle();
  if (!asset) return { ok: false, error: "Yükleme bulunamadı." };
  if (asset.state === "ready") return { ok: true, asset };

  const discard = async (message: string) => {
    await admin.storage.from(MEDIA_BUCKET).remove([asset.original_path]);
    await admin.from("media_assets").delete().eq("id", asset.id);
    return { ok: false as const, error: message };
  };

  const download = await admin.storage.from(MEDIA_BUCKET).download(asset.original_path);
  if (download.error || !download.data) return discard("Dosya sunucuya ulaşmadı. Tekrar dene.");

  const original = Buffer.from(await download.data.arrayBuffer());
  const kind = asset.kind as MediaKind;

  const reason = rejectionReason(kind, { type: asset.mime_type, size: original.byteLength });
  if (reason) return discard(reason);
  if (!sniffMatches(asset.mime_type, sniff(original.subarray(0, 16)))) {
    return discard("Dosyanın içeriği türüyle uyuşmuyor.");
  }

  const update: Partial<MediaAsset> = {
    state: "ready",
    byte_size: original.byteLength,
    checksum_sha256: createHash("sha256").update(original).digest("hex"),
  };

  if (kind === "image") {
    try {
      const processed = await processImage(original, session.space.id, asset.id);
      update.width = processed.width;
      update.height = processed.height;
      update.placeholder = processed.placeholder;
      update.variants = toJson(processed.variants);
    } catch {
      return discard("Bu fotoğraf işlenemedi. Dosya bozuk olabilir.");
    }
  }

  const { data: ready, error } = await admin
    .from("media_assets")
    .update(update)
    .eq("id", asset.id)
    .select("*")
    .single();
  if (error || !ready) return discard("Yükleme tamamlanamadı.");

  return { ok: true, asset: ready };
}

/**
 * Builds the variants the site actually serves. `rotate()` bakes in the
 * camera orientation; re-encoding drops EXIF, GPS and every other tag.
 */
async function processImage(original: Buffer, spaceId: string, assetId: string) {
  const admin = createAdminClient();
  const base = sharp(original, { failOn: "error", limitInputPixels: 80_000_000 }).rotate();
  const meta = await base.metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const width = (swap ? meta.height : meta.width) ?? 0;
  const height = (swap ? meta.width : meta.height) ?? 0;
  if (!width || !height) throw new Error("unreadable image");

  const variants: Variants = {};
  for (const spec of VARIANT_SPECS) {
    const { data, info } = await base
      .clone()
      .resize({ width: spec.width, withoutEnlargement: true })
      .webp({ quality: spec.quality, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    const path = `${spaceId}/variants/${assetId}/${spec.name}.webp`;
    const upload = await admin.storage
      .from(MEDIA_BUCKET)
      .upload(path, data, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (upload.error) throw upload.error;
    variants[spec.name] = { path, width: info.width, height: info.height };
  }

  const tiny = await base.clone().resize({ width: 20 }).blur(1.2).webp({ quality: 40 }).toBuffer();
  return {
    width,
    height,
    variants,
    placeholder: `data:image/webp;base64,${tiny.toString("base64")}`,
  };
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export type SignedImage = {
  assetId: string;
  width: number;
  height: number;
  placeholder: string | null;
  thumb: string;
  medium: string;
  large: string;
};

type AssetForSigning = Pick<MediaAsset, "id" | "variants" | "width" | "height" | "placeholder" | "original_path">;

/**
 * Signs every variant of the given image assets in a single round trip.
 * Callers pass rows they fetched through RLS — that query is the permission
 * check; this function only turns paths into URLs.
 */
export async function signImages(assets: (AssetForSigning | null | undefined)[]): Promise<Map<string, SignedImage>> {
  const out = new Map<string, SignedImage>();
  const wanted: { assetId: string; name: keyof Variants; path: string }[] = [];

  for (const asset of assets) {
    if (!asset) continue;
    const variants = (asset.variants ?? {}) as Variants;
    for (const name of ["thumb", "medium", "large"] as const) {
      const variant = variants[name];
      if (variant?.path) wanted.push({ assetId: asset.id, name, path: variant.path });
    }
  }
  if (wanted.length === 0) return out;

  const { data } = await createAdminClient()
    .storage.from(MEDIA_BUCKET)
    .createSignedUrls(
      wanted.map((w) => w.path),
      SIGNED_URL_SECONDS,
    );
  const urlByPath = new Map((data ?? []).map((row) => [row.path, row.signedUrl]));

  for (const asset of assets) {
    if (!asset) continue;
    const variants = (asset.variants ?? {}) as Variants;
    const url = (name: keyof Variants) => {
      const path = variants[name]?.path;
      return path ? (urlByPath.get(path) ?? "") : "";
    };
    const medium = url("medium") || url("large") || url("thumb");
    if (!medium) continue;
    out.set(asset.id, {
      assetId: asset.id,
      width: asset.width ?? variants.large?.width ?? 0,
      height: asset.height ?? variants.large?.height ?? 0,
      placeholder: asset.placeholder,
      thumb: url("thumb") || medium,
      medium,
      large: url("large") || medium,
    });
  }
  return out;
}

/** Signs original audio files. Same contract as `signImages`. */
export async function signAudio(
  assets: (Pick<MediaAsset, "id" | "original_path"> | null | undefined)[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const list = assets.filter((a): a is Pick<MediaAsset, "id" | "original_path"> => Boolean(a));
  if (list.length === 0) return out;

  const { data } = await createAdminClient()
    .storage.from(MEDIA_BUCKET)
    .createSignedUrls(
      list.map((a) => a.original_path),
      SIGNED_URL_SECONDS,
    );
  const urlByPath = new Map((data ?? []).map((row) => [row.path, row.signedUrl]));
  for (const asset of list) {
    const url = urlByPath.get(asset.original_path);
    if (url) out.set(asset.id, url);
  }
  return out;
}

/** Removes an asset's files and its row. For permanent deletion only. */
export async function purgeAsset(asset: Pick<MediaAsset, "id" | "original_path" | "variants">) {
  const admin = createAdminClient();
  const variants = (asset.variants ?? {}) as Variants;
  const paths = [asset.original_path, ...Object.values(variants).map((v) => v?.path)].filter(
    (p): p is string => Boolean(p),
  );
  await admin.storage.from(MEDIA_BUCKET).remove(paths);
  await admin.from("media_assets").delete().eq("id", asset.id);
}

/** Columns every query needs in order to sign an image later. */
export const ASSET_COLUMNS = "id, variants, width, height, placeholder, original_path" as const;
