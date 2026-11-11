import "server-only";
import { cache } from "react";
import { resolveSection, type SectionData, type SectionKey } from "@/content/sections";
import type { Session } from "@/lib/auth/session";

/** All published site copy for the space, fetched once per request. */
const loadSections = cache(async (session: Session) => {
  const { data } = await session.supabase
    .from("content_sections")
    .select("key, data")
    .eq("space_id", session.space.id);
  return new Map((data ?? []).map((row) => [row.key, row.data]));
});

/** The published version of a section — what both of them see. */
export async function getSection<K extends SectionKey>(session: Session, key: K): Promise<SectionData<K>> {
  const sections = await loadSections(session);
  return resolveSection(key, sections.get(key));
}

/**
 * The owner's working copy: the draft if there is one, otherwise what is
 * published. `hasDraft` tells the Studio whether there are unpublished edits.
 */
export async function getSectionDraft<K extends SectionKey>(
  session: Session,
  key: K,
): Promise<{ data: SectionData<K>; hasDraft: boolean; published: SectionData<K> }> {
  const [published, draft] = await Promise.all([
    getSection(session, key),
    session.supabase
      .from("content_section_drafts")
      .select("data")
      .eq("space_id", session.space.id)
      .eq("key", key)
      .maybeSingle(),
  ]);
  return {
    published,
    hasDraft: Boolean(draft.data),
    data: draft.data ? resolveSection(key, draft.data.data) : published,
  };
}
