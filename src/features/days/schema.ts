import { z } from "zod";
import { daysInMonth } from "@/lib/dates";

export const THEMES = [
  { value: "birthday-partner", label: "Eln'in doğum günü" },
  { value: "birthday-owner", label: "Arda'nın doğum günü" },
  { value: "meeting", label: "Tanışma" },
  { value: "together", label: "Birliktelik" },
  { value: "first-meeting", label: "İlk buluşma" },
  { value: "classic", label: "Sade" },
] as const;

const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().min(min).max(max).nullable());

/** A date may lack a year — or, for something still unplanned, be empty altogether. */
export const dateSchema = z
  .object({
    id: z.uuid(),
    label: z.string().trim().min(1, "Bir ad yaz.").max(120),
    day: optionalInt(1, 31),
    month: optionalInt(1, 12),
    year: optionalInt(1900, 2200),
    note: z.string().trim().max(2000),
  })
  .superRefine((value, ctx) => {
    if ((value.day === null) !== (value.month === null)) {
      ctx.addIssue({ code: "custom", path: ["day"], message: "Gün ve ay birlikte girilmeli." });
      return;
    }
    if (value.year !== null && value.month === null) {
      ctx.addIssue({ code: "custom", path: ["year"], message: "Yıl için önce gün ve ay gerekli." });
      return;
    }
    if (value.day !== null && value.month !== null) {
      // 2000 is a leap year, so 29 February stays possible when the year is unknown.
      if (value.day > daysInMonth(value.year ?? 2000, value.month)) {
        ctx.addIssue({ code: "custom", path: ["day"], message: "Bu ayda böyle bir gün yok." });
      }
    }
  });

export const newDaySchema = z
  .object({
    label: z.string().trim().min(1, "Bir ad yaz.").max(120),
    day: z.coerce.number().int().min(1).max(31),
    month: z.coerce.number().int().min(1).max(12),
    year: optionalInt(1900, 2200),
    recursYearly: z.boolean(),
  })
  .refine((v) => v.day <= daysInMonth(v.year ?? 2000, v.month), { path: ["day"], message: "Bu ayda böyle bir gün yok." });

export const specialDaySchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Bir başlık yaz.").max(120),
  subtitle: z.string().trim().max(240),
  intro: z.string().trim().max(4000),
  theme: z.enum(["birthday-partner", "birthday-owner", "meeting", "together", "first-meeting", "classic"]),
  coverPhotoId: z.uuid().nullable(),
  showCountdown: z.boolean(),
  publish: z.boolean(),
});

export const editionSchema = z.object({
  id: z.uuid().optional(),
  specialDayId: z.uuid(),
  year: z.coerce.number().int().min(1900).max(2200),
  title: z.string().trim().max(160),
  note: z.string().max(20000),
  coverPhotoId: z.uuid().nullable(),
  letterId: z.uuid().nullable(),
  albumId: z.uuid().nullable(),
  /** Keep it from the other person until the day itself begins where they live. */
  revealOnDay: z.boolean(),
  publish: z.boolean(),
});

export type DateInput = z.input<typeof dateSchema>;
export type NewDayInput = z.input<typeof newDaySchema>;
export type SpecialDayInput = z.input<typeof specialDaySchema>;
export type EditionInput = z.input<typeof editionSchema>;
