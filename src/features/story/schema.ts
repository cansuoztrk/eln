import { z } from "zod";
import { tagList } from "@/features/gallery/schema";

/** Shelves for memories. Names only — what happened is for Arda to write. */
export const MEMORY_CATEGORIES = [
  { value: "milestone", label: "Dönüm noktası" },
  { value: "first", label: "İlkler" },
  { value: "moment", label: "Küçük anlar" },
  { value: "talk", label: "Konuşmalar" },
  { value: "surprise", label: "Sürprizler" },
  { value: "special", label: "Özel günler" },
  { value: "dream", label: "Hayaller" },
  { value: "other", label: "Diğer" },
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number]["value"];

export function memoryCategoryLabel(value: string): string {
  return MEMORY_CATEGORIES.find((c) => c.value === value)?.label ?? "Anı";
}

export const STAR_TONES = [
  { value: "blush", label: "Pudra", color: "#f3c9d1" },
  { value: "rose", label: "Gül", color: "#c98b96" },
  { value: "champagne", label: "Şampanya", color: "#ead9bb" },
  { value: "pearl", label: "İnci", color: "#fffdfa" },
  { value: "gold", label: "Altın", color: "#d9b97c" },
] as const;

export type StarTone = (typeof STAR_TONES)[number]["value"];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seç.");

export const memorySchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Anıya bir başlık ver.").max(160),
  /** Empty when the day is not known. Never guessed. */
  happenedOn: z.union([z.literal(""), isoDate]),
  datePrecision: z.enum(["day", "month", "year"]),
  summary: z.string().trim().max(400),
  description: z.string().max(20000),
  specialNote: z.string().trim().max(2000),
  category: z.enum(MEMORY_CATEGORIES.map((c) => c.value) as [MemoryCategory, ...MemoryCategory[]]),
  tags: tagList,
  photoIds: z.array(z.uuid()).max(40),
  starSize: z.number().int().min(1).max(5),
  starTone: z.enum(["blush", "rose", "champagne", "pearl", "gold"]),
  publish: z.boolean(),
});

export type MemoryInput = z.input<typeof memorySchema>;
