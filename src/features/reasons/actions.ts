"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { bulkSchema, NOTE_MAX, noteSchema, settingsSchema, type NoteInput } from "./schema";

function refresh() {
  for (const path of ["/reasons", "/studio/reasons", "/"]) revalidatePath(path);
}

async function owner() {
  const session = await getSession();
  return session && session.role === "owner" ? session : null;
}

async function nextOrder(session: NonNullable<Awaited<ReturnType<typeof owner>>>): Promise<number> {
  const { data } = await session.supabase
    .from("daily_notes")
    .select("sort_order")
    .eq("space_id", session.space.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

export async function saveNoteAction(input: NoteInput): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;
  const row = { body: value.body, category: value.category, status: value.publish ? ("published" as const) : ("draft" as const) };

  const { error } = value.id
    ? await session.supabase.from("daily_notes").update(row).eq("id", value.id)
    : await session.supabase.from("daily_notes").insert({ ...row, space_id: session.space.id, sort_order: await nextOrder(session) });
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, value.publish ? "Not koleksiyona eklendi." : "Taslak kaydedildi.");
}

/** Adds several notes at once — one per line — as drafts, to be read over before publishing. */
export async function addNotesAction(input: { lines: string; category: string }): Promise<ActionResult<{ added: number }>> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const lines = parsed.data.lines
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return fail("Eklenecek bir satır yok.", { lines: "Her satıra bir not yaz." });
  if (lines.length > 400) return fail("Bir seferde en fazla 400 not eklenebilir.");
  const tooLong = lines.findIndex((line) => line.length > NOTE_MAX);
  if (tooLong !== -1) return fail(`${tooLong + 1}. satır çok uzun (en fazla ${NOTE_MAX} karakter).`);

  const start = await nextOrder(session);
  const { error } = await session.supabase.from("daily_notes").insert(
    lines.map((body, index) => ({ space_id: session.space.id, body, category: parsed.data.category, status: "draft" as const, sort_order: start + index })),
  );
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok({ added: lines.length }, `${lines.length} not taslak olarak eklendi.`);
}

export async function publishNotesAction(ids: string[], publish: boolean): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");
  if (ids.length === 0 || ids.length > 500) return fail("Geçersiz seçim.");

  const { error } = await session.supabase.from("daily_notes").update({ status: publish ? "published" : "draft" }).in("id", ids);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, publish ? "Yayımlandı." : "Taslağa alındı.");
}

/** How the note of the day is chosen, and from which day the calendar runs. */
export async function saveReasonsSettingsAction(input: { mode: string; startedOn: string }): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { error } = await session.supabase
    .from("private_spaces")
    .update({ reasons_mode: parsed.data.mode, reasons_started_on: parsed.data.startedOn || null })
    .eq("id", session.space.id);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, "Ayarlar kaydedildi.");
}
