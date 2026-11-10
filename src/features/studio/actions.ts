"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const name = z.string().trim().min(1, "Boş bırakılamaz.").max(60);
const timeZone = z.string().trim().refine(isTimeZone, "Geçerli bir saat dilimi değil (ör. Europe/Istanbul).");

const settingsSchema = z.object({
  ownerName: name,
  partnerName: name,
  partnerFullName: z.string().trim().max(60),
  ownerCity: name,
  partnerCity: name,
  ownerTimezone: timeZone,
  partnerTimezone: timeZone,
});

export type SpaceSettingsInput = z.input<typeof settingsSchema>;

/**
 * The names, cities and time zones the whole site speaks with. Clocks, "today"
 * and every countdown follow the time zones set here — never a device's.
 */
export async function saveSpaceSettingsAction(input: SpaceSettingsInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "owner") return fail("Bu işlem için yetkin yok.");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const { error } = await session.supabase
    .from("private_spaces")
    .update({
      owner_name: v.ownerName,
      partner_name: v.partnerName,
      partner_full_name: v.partnerFullName || null,
      owner_city: v.ownerCity,
      partner_city: v.partnerCity,
      owner_timezone: v.ownerTimezone,
      partner_timezone: v.partnerTimezone,
    })
    .eq("id", session.space.id);
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/", "layout");
  return ok(undefined, "Ayarlar kaydedildi.");
}
