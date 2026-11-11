import "server-only";
import { authorNames } from "@/lib/auth/members";
import type { Session } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/database.types";
import type { EnvelopeStyle, Seal } from "./schema";

export type Letter = {
  id: string;
  title: string;
  body: string;
  category: string;
  writtenOn: string;
  fontStyle: "serif" | "hand";
  envelopeStyle: EnvelopeStyle;
  seal: Seal;
  unlockAt: string | null;
  status: "draft" | "published";
  authorId: string;
  authorName: string;
  mine: boolean;
  updatedAt: string;
};

/** A letter the reader may know exists, but not yet read. */
export type SealedLetter = {
  id: string;
  title: string;
  category: string;
  envelopeStyle: EnvelopeStyle;
  seal: Seal;
  unlockAt: string;
  authorName: string;
};

function toLetter(row: Tables<"letters">, session: Session, nameOf: (id: string) => string): Letter {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    writtenOn: row.written_on,
    fontStyle: row.font_style as Letter["fontStyle"],
    envelopeStyle: row.envelope_style as EnvelopeStyle,
    seal: row.seal as Seal,
    unlockAt: row.unlock_at,
    status: row.status,
    authorId: row.created_by,
    authorName: nameOf(row.created_by),
    mine: row.created_by === session.userId,
    updatedAt: row.updated_at,
  };
}

/**
 * Letters for the reading room: everything published that the viewer may open,
 * plus the envelopes that are still sealed for them. Row level security
 * already keeps drafts and locked bodies out; nothing is filtered by hand here
 * except the viewer's own drafts, which belong in the Studio / write page.
 */
export async function listLetters(session: Session): Promise<{ open: Letter[]; sealed: SealedLetter[] }> {
  const [rows, sealed, nameOf] = await Promise.all([
    session.supabase
      .from("letters")
      .select("*")
      .eq("space_id", session.space.id)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("written_on", { ascending: false })
      .order("created_at", { ascending: false }),
    session.supabase.rpc("sealed_letters", { p_space: session.space.id }),
    authorNames(session),
  ]);

  return {
    open: (rows.data ?? []).map((row) => toLetter(row, session, nameOf)),
    sealed: (sealed.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      envelopeStyle: row.envelope_style as EnvelopeStyle,
      seal: row.seal as Seal,
      unlockAt: row.unlock_at,
      authorName: nameOf(row.created_by),
    })),
  };
}

/** One letter, if the viewer may read it. Null otherwise — including while sealed. */
export async function getLetter(session: Session, id: string): Promise<Letter | null> {
  const [{ data }, nameOf] = await Promise.all([
    session.supabase.from("letters").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    authorNames(session),
  ]);
  return data ? toLetter(data, session, nameOf) : null;
}

/** Everything the viewer has written themselves, drafts included. */
export async function listMyLetters(session: Session): Promise<Letter[]> {
  const [{ data }, nameOf] = await Promise.all([
    session.supabase
      .from("letters")
      .select("*")
      .eq("space_id", session.space.id)
      .eq("created_by", session.userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    authorNames(session),
  ]);
  return (data ?? []).map((row) => toLetter(row, session, nameOf));
}
