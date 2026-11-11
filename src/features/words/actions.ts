"use server";

import { revalidatePath } from "next/cache";
import { WRITTEN_DAYS, WRITTEN_LETTERS, WRITTEN_MEMORIES, WRITTEN_NOTES } from "@/content/writing";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/result";

/**
 * The ready writing, handed to Arda. Each action only ever adds what is not
 * there yet and fills what is still empty — it never replaces a word he wrote.
 *
 * Letters arrive as drafts: Eln sees none until he has read it and chosen to
 * publish. The 365 notes arrive published, as he asked (2026-11-10); a note is
 * still shown only on its own day, and only once the calendar has a first day.
 */

async function owner() {
  const session = await getSession();
  return session && session.role === "owner" ? session : null;
}

const DENIED = "Bu işlem için yetkin yok.";

/** Adds the letters that are not in the Studio yet, as drafts. */
export async function addWrittenLettersAction(): Promise<ActionResult<{ added: number }>> {
  const session = await owner();
  if (!session) return fail(DENIED);

  const { data: existing } = await session.supabase.from("letters").select("title").eq("space_id", session.space.id).eq("created_by", session.userId);
  const have = new Set((existing ?? []).map((row) => row.title));
  const fresh = WRITTEN_LETTERS.filter((letter) => !have.has(letter.title));
  if (fresh.length === 0) return ok({ added: 0 }, "Bu mektupların hepsi zaten taslaklarında.");

  const { error } = await session.supabase.from("letters").insert(
    fresh.map((letter, index) => ({
      space_id: session.space.id,
      title: letter.title,
      body: letter.body,
      category: letter.category,
      envelope_style: letter.envelopeStyle,
      seal: letter.seal,
      status: "draft" as const,
      sort_order: index,
    })),
  );
  if (error) return fail(GENERIC_ERROR);

  for (const path of ["/studio/letters", "/studio/words", "/studio"]) revalidatePath(path);
  return ok({ added: fresh.length }, `${fresh.length} mektup taslak olarak eklendi.`);
}

/** Adds the notes that are not in the collection yet — published, one shelf after another in turn. */
export async function addWrittenNotesAction(): Promise<ActionResult<{ added: number }>> {
  const session = await owner();
  if (!session) return fail(DENIED);

  const { data: existing } = await session.supabase.from("daily_notes").select("body, sort_order").eq("space_id", session.space.id);
  const have = new Set((existing ?? []).map((row) => row.body));
  const fresh = WRITTEN_NOTES.filter((note) => !have.has(note.body));
  if (fresh.length === 0) return ok({ added: 0 }, "Bu notların hepsi zaten koleksiyonda.");

  const start = Math.max(-1, ...(existing ?? []).map((row) => row.sort_order)) + 1;
  const { error } = await session.supabase.from("daily_notes").insert(
    fresh.map((note, index) => ({ space_id: session.space.id, body: note.body, category: note.category, status: "published" as const, sort_order: start + index })),
  );
  if (error) return fail(GENERIC_ERROR);

  for (const path of ["/reasons", "/", "/studio/reasons", "/studio/words", "/studio"]) revalidatePath(path);
  return ok(
    { added: fresh.length },
    session.space.reasons_started_on
      ? `${fresh.length} not yayında. Her biri kendi gününde görünecek.`
      : `${fresh.length} not yayında. Takvimi başlatmak için 365 Not sayfasından ilk günü seç.`,
  );
}

/** Fills the two milestone memories and the special days — only where nothing has been written. */
export async function fillWrittenPagesAction(): Promise<ActionResult<{ filled: number }>> {
  const session = await owner();
  if (!session) return fail(DENIED);
  const space = session.space.id;

  const [memories, days] = await Promise.all([
    session.supabase.from("memories").select("id, relationship_date_key, summary, description, special_note").eq("space_id", space).in("relationship_date_key", Object.keys(WRITTEN_MEMORIES)),
    session.supabase.from("special_days").select("id, slug, subtitle, intro").eq("space_id", space).in("slug", Object.keys(WRITTEN_DAYS)),
  ]);

  let filled = 0;
  for (const row of memories.data ?? []) {
    const words = WRITTEN_MEMORIES[row.relationship_date_key as keyof typeof WRITTEN_MEMORIES];
    if (!words || row.summary || row.description) continue;
    const { error } = await session.supabase
      .from("memories")
      .update({ summary: words.summary, description: words.description, special_note: row.special_note || words.specialNote })
      .eq("id", row.id);
    if (error) return fail(GENERIC_ERROR);
    filled++;
  }
  for (const row of days.data ?? []) {
    const words = WRITTEN_DAYS[row.slug];
    if (!words || row.subtitle || row.intro) continue;
    const { error } = await session.supabase.from("special_days").update({ subtitle: words.subtitle, intro: words.intro }).eq("id", row.id);
    if (error) return fail(GENERIC_ERROR);
    filled++;
  }

  if (filled === 0) return ok({ filled: 0 }, "Doldurulacak boş bir sayfa kalmamış; yazdıklarına dokunulmadı.");
  for (const path of ["/story", "/days", "/universe", "/studio/story", "/studio/days", "/studio/words"]) revalidatePath(path);
  return ok({ filled }, `${filled} sayfa dolduruldu. İstediğin zaman değiştirebilirsin.`);
}
