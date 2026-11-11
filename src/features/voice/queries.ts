import "server-only";
import { authorNames } from "@/lib/auth/members";
import type { Session } from "@/lib/auth/session";
import { signAudio } from "@/lib/media/server";

export type Voice = {
  id: string;
  title: string;
  description: string;
  recordedOn: string;
  durationMs: number;
  waveform: number[];
  status: "draft" | "published";
  authorName: string;
  authorRole: "owner" | "partner";
  mine: boolean;
  /** A short-lived signed URL to the recording. */
  url: string;
};

/** Voice memories the viewer may hear: their own, and the other's once published. */
export async function listVoices(session: Session): Promise<Voice[]> {
  const [{ data }, nameOf] = await Promise.all([
    session.supabase
      .from("voice_memories")
      .select("*, asset:media_assets(id, original_path)")
      .eq("space_id", session.space.id)
      .is("deleted_at", null)
      .order("recorded_on", { ascending: false })
      .order("created_at", { ascending: false }),
    authorNames(session),
  ]);
  const rows = data ?? [];
  const urls = await signAudio(rows.map((row) => row.asset));

  return rows
    .filter((row) => row.asset && urls.has(row.asset.id))
    .map((row) => {
      const name = nameOf(row.created_by);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        recordedOn: row.recorded_on,
        durationMs: row.duration_ms,
        waveform: Array.isArray(row.waveform) ? (row.waveform as number[]) : [],
        status: row.status,
        authorName: name,
        authorRole: name === session.space.owner_name ? ("owner" as const) : ("partner" as const),
        mine: row.created_by === session.userId,
        url: urls.get(row.asset!.id)!,
      };
    });
}

/** The viewer's own recordings, as choices for attaching one to a memory. */
export async function listMyVoiceOptions(session: Session): Promise<{ id: string; title: string }[]> {
  const { data } = await session.supabase
    .from("voice_memories")
    .select("id, title")
    .eq("space_id", session.space.id)
    .eq("created_by", session.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}
