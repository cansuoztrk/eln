import "server-only";
import { authorNames } from "@/lib/auth/members";
import type { Session } from "@/lib/auth/session";
import { ASSET_COLUMNS, signAudio, signImages, type SignedImage } from "@/lib/media/server";
import type { CoverStyle } from "./schema";

export type Capsule = {
  id: string;
  title: string;
  message: string;
  note: string;
  videoUrl: string | null;
  coverStyle: CoverStyle;
  unlockAt: string;
  status: "draft" | "published";
  authorName: string;
  mine: boolean;
  /** True once its day has come. Its author can always look inside. */
  open: boolean;
  images: { assetId: string; image: SignedImage }[];
  audio: { assetId: string; url: string }[];
};

export type SealedCapsule = { id: string; title: string; coverStyle: CoverStyle; unlockAt: string; authorName: string };

const SELECT = `*, time_capsule_items(asset_id, sort_order, asset:media_assets(kind, ${ASSET_COLUMNS}))` as const;

/**
 * Capsules the viewer may open — their own, and the other's once the day has
 * come — plus the ones still sealed for them, of which only the name and the
 * date are known. The files inside a sealed capsule are just as unreachable
 * as its words.
 */
export async function listCapsules(session: Session): Promise<{ capsules: Capsule[]; sealed: SealedCapsule[] }> {
  const [{ data }, sealed, nameOf] = await Promise.all([
    session.supabase.from("time_capsules").select(SELECT).eq("space_id", session.space.id).is("deleted_at", null).order("unlock_at", { ascending: true }),
    session.supabase.rpc("sealed_capsules", { p_space: session.space.id }),
    authorNames(session),
  ]);
  const rows = data ?? [];
  const assets = rows.flatMap((row) => row.time_capsule_items.map((item) => item.asset)).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const [images, audio] = await Promise.all([signImages(assets.filter((a) => a.kind === "image")), signAudio(assets.filter((a) => a.kind === "audio"))]);
  const now = Date.now();

  return {
    capsules: rows.map((row) => {
      const items = [...row.time_capsule_items].sort((a, b) => a.sort_order - b.sort_order);
      return {
        id: row.id,
        title: row.title,
        message: row.message,
        note: row.note,
        videoUrl: row.video_url,
        coverStyle: row.cover_style as CoverStyle,
        unlockAt: row.unlock_at,
        status: row.status,
        authorName: nameOf(row.created_by),
        mine: row.created_by === session.userId,
        open: new Date(row.unlock_at).getTime() <= now,
        images: items.flatMap((item) => (images.has(item.asset_id) ? [{ assetId: item.asset_id, image: images.get(item.asset_id)! }] : [])),
        audio: items.flatMap((item) => (audio.has(item.asset_id) ? [{ assetId: item.asset_id, url: audio.get(item.asset_id)! }] : [])),
      };
    }),
    sealed: (sealed.data ?? []).map((row) => ({ id: row.id, title: row.title, coverStyle: row.cover_style as CoverStyle, unlockAt: row.unlock_at, authorName: nameOf(row.created_by) })),
  };
}

export async function getCapsule(session: Session, id: string): Promise<Capsule | null> {
  return (await listCapsules(session)).capsules.find((c) => c.id === id) ?? null;
}
