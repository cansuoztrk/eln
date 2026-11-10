"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { compareDates, occurrenceIn, startOfDayIn, todayIn } from "@/lib/dates";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import {
  dateSchema,
  editionSchema,
  newDaySchema,
  specialDaySchema,
  type DateInput,
  type EditionInput,
  type NewDayInput,
  type SpecialDayInput,
} from "./schema";

const SEEDED_KEYS = ["met", "together", "eln_birthday", "arda_birthday", "first_meeting"];

function refresh() {
  for (const path of ["/days", "/studio/days", "/", "/story", "/distance"]) revalidatePath(path);
  revalidatePath("/days/[slug]", "page");
}

async function owner() {
  const session = await getSession();
  return session && session.role === "owner" ? session : null;
}

/** Edits one of the relationship's dates — the single source every counter reads from. */
export async function saveDateAction(input: DateInput): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");

  const parsed = dateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;

  const { data: current } = await session.supabase
    .from("relationship_dates")
    .select("key, kind, happened")
    .eq("id", value.id)
    .maybeSingle();
  if (!current) return fail("Bu tarih bulunamadı.");

  // Only something still unplanned may have no date at all.
  if (current.kind !== "future" && value.day === null) {
    return fail("Bu tarihin günü ve ayı boş bırakılamaz.", { day: "Gün ve ay gerekli." });
  }

  const { error } = await session.supabase
    .from("relationship_dates")
    .update({
      label: value.label,
      day: value.day,
      month: value.month,
      year: value.year,
      note: value.note,
      // Clearing the date of the meeting also clears any claim that it happened.
      ...(current.kind === "future" && value.day === null ? { happened: false } : {}),
    })
    .eq("id", value.id);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, "Tarih kaydedildi.");
}

/**
 * Says that the first meeting really took place. Never automatic: it needs a
 * complete date that is today or earlier, and a person pressing the button.
 */
export async function setHappenedAction(id: string, happened: boolean): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");

  const { data: row } = await session.supabase
    .from("relationship_dates")
    .select("kind, day, month, year")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.kind !== "future") return fail("Bu tarih için geçerli değil.");

  if (happened) {
    if (row.day === null || row.month === null || row.year === null) {
      return fail("Önce buluşmanın tam tarihini (gün, ay, yıl) gir.");
    }
    const date = { year: row.year, month: row.month, day: row.day };
    if (compareDates(date, todayIn(session.profile.timezone, new Date())) > 0) {
      return fail("Henüz gelmemiş bir gün gerçekleşmiş olarak işaretlenemez.");
    }
  }

  const { error } = await session.supabase.from("relationship_dates").update({ happened }).eq("id", id);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, happened ? "Buluşma gerçekleşti olarak işaretlendi." : "İşaret kaldırıldı.");
}

function slugify(text: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u", ə: "e" };
  const base = text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîûə]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base.length >= 2 ? base : "ozel-gun";
}

/** Adds a new date of Arda's own together with its special-day page. */
export async function createDayAction(input: NewDayInput): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");

  const parsed = newDaySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;
  if (!value.recursYearly && value.year === null) {
    return fail("Yıllık tekrarlanmayan bir günün yılı da gerekli.", { year: "Yıl gerekli." });
  }

  const suffix = Date.now().toString(36).slice(-5);
  const slug = `${slugify(value.label)}-${suffix}`;

  const { data: date, error } = await session.supabase
    .from("relationship_dates")
    .insert({
      space_id: session.space.id,
      key: `custom_${suffix}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      label: value.label,
      kind: "custom",
      day: value.day,
      month: value.month,
      year: value.year,
      recurs_yearly: value.recursYearly,
      happened: true,
      sort_order: 100,
    })
    .select("id")
    .single();
  if (error || !date) return fail(GENERIC_ERROR);

  const { error: dayError } = await session.supabase.from("special_days").insert({
    space_id: session.space.id,
    slug,
    relationship_date_id: date.id,
    title: value.label,
    theme: "classic",
    status: "draft",
    sort_order: 100,
  });
  if (dayError) {
    await session.supabase.from("relationship_dates").delete().eq("id", date.id);
    return fail(GENERIC_ERROR);
  }

  refresh();
  return ok(undefined, "Yeni gün eklendi. Yayımlamadan önce sayfasını düzenleyebilirsin.");
}

/** Removes a date Arda added himself, with its page. The five original dates cannot be removed. */
export async function deleteCustomDateAction(id: string): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");

  const { data: row } = await session.supabase.from("relationship_dates").select("key, kind").eq("id", id).maybeSingle();
  if (!row || row.kind !== "custom" || SEEDED_KEYS.includes(row.key)) return fail("Bu tarih silinemez.");

  const { error } = await session.supabase.from("relationship_dates").delete().eq("id", id);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, "Gün silindi.");
}

export async function saveSpecialDayAction(input: SpecialDayInput): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");

  const parsed = specialDaySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;

  const { error } = await session.supabase
    .from("special_days")
    .update({
      title: value.title,
      subtitle: value.subtitle,
      intro: value.intro,
      theme: value.theme,
      cover_photo_id: value.coverPhotoId,
      show_countdown: value.showCountdown,
      status: value.publish ? "published" : "draft",
    })
    .eq("id", value.id);
  if (error) return fail(GENERIC_ERROR);

  refresh();
  return ok(undefined, value.publish ? "Sayfa yayında." : "Taslak kaydedildi.");
}

/** Creates or updates one year's edition of a special day. */
export async function saveEditionAction(input: EditionInput): Promise<ActionResult> {
  const session = await owner();
  if (!session) return fail("Bu işlem için yetkin yok.");

  const parsed = editionSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const value = parsed.data;

  let revealAt: string | null = null;
  if (value.revealOnDay) {
    const { data: day } = await session.supabase
      .from("special_days")
      .select("date:relationship_dates(month, day)")
      .eq("id", value.specialDayId)
      .maybeSingle();
    const month = day?.date?.month;
    const dayOfMonth = day?.date?.day;
    if (!month || !dayOfMonth) return fail("Bu günün tarihi belli olmadan gününde açılacak şekilde ayarlanamaz.");
    // The surprise opens when that day begins for the person it is for.
    revealAt = startOfDayIn(session.space.partner_timezone, occurrenceIn(value.year, { month, day: dayOfMonth })).toISOString();
  }

  const row = {
    year: value.year,
    title: value.title,
    note: value.note,
    cover_photo_id: value.coverPhotoId,
    letter_id: value.letterId,
    album_id: value.albumId,
    reveal_at: revealAt,
    status: value.publish ? ("published" as const) : ("draft" as const),
  };

  const { error } = value.id
    ? await session.supabase.from("special_day_editions").update(row).eq("id", value.id)
    : await session.supabase
        .from("special_day_editions")
        .insert({ ...row, space_id: session.space.id, special_day_id: value.specialDayId });
  if (error) {
    return fail(error.code === "23505" ? "Bu yıl için zaten bir baskı var." : GENERIC_ERROR, error.code === "23505" ? { year: "Bu yıl dolu." } : undefined);
  }

  refresh();
  return ok(undefined, value.publish ? "Baskı yayımlandı." : "Taslak kaydedildi.");
}
