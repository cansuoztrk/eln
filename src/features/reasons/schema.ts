import { z } from "zod";

/** Shelves for the little notes. The sentences themselves are only ever Arda's. */
export const NOTE_CATEGORIES = [
  { value: "valued", label: "Neden değerlisin" },
  { value: "traces", label: "Bende bıraktığın izler" },
  { value: "details", label: "Sevdiğim küçük detaylar" },
  { value: "dreams", label: "Birlikte hayal ettiklerim" },
  { value: "thought", label: "Günlük düşünceler" },
  { value: "thanks", label: "Teşekkürlerim" },
  { value: "missing", label: "Özlediğim anlar" },
] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number]["value"];

export function noteCategoryLabel(value: string): string {
  return NOTE_CATEGORIES.find((c) => c.value === value)?.label ?? "Not";
}

const category = z.enum(NOTE_CATEGORIES.map((c) => c.value) as [NoteCategory, ...NoteCategory[]]);

export const NOTE_MAX = 600;
export const GOAL = 365;

export const noteSchema = z.object({
  id: z.uuid().optional(),
  body: z.string().trim().min(1, "Bir not yaz.").max(NOTE_MAX, `En fazla ${NOTE_MAX} karakter.`),
  category,
  publish: z.boolean(),
});

/** Several notes at once: one per line, exactly as written. */
export const bulkSchema = z.object({
  lines: z.string().max(40000),
  category,
});

export const settingsSchema = z.object({
  mode: z.enum(["sequential", "random"]),
  /** Empty → not started yet. */
  startedOn: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
});

export type NoteInput = z.input<typeof noteSchema>;
