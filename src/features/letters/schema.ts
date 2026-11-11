import { z } from "zod";

/** The shelves letters are kept on. Only names — every word inside is Arda's. */
export const LETTER_CATEGORIES = [
  { value: "say", label: "Sana söylemek istediklerim" },
  { value: "thanks", label: "Teşekkür etmek istediklerim" },
  { value: "missing", label: "Seni özlediğimde" },
  { value: "dreams", label: "Birlikte hayal ettiklerim" },
  { value: "beside", label: "Bir gün yanımda olduğunda" },
  { value: "unsaid", label: "Bazen anlatamadıklarım" },
  { value: "future", label: "Gelecekteki Eln'e" },
  { value: "special", label: "Özel günlerin için" },
  { value: "open", label: "Mektup" },
] as const;

export type LetterCategory = (typeof LETTER_CATEGORIES)[number]["value"];

export function categoryLabel(value: string): string {
  return LETTER_CATEGORIES.find((c) => c.value === value)?.label ?? "Mektup";
}

export const ENVELOPE_STYLES = [
  { value: "blush", label: "Pudra" },
  { value: "rose", label: "Gül kurusu" },
  { value: "ivory", label: "Fildişi" },
  { value: "champagne", label: "Şampanya" },
  { value: "nude", label: "Nude" },
] as const;

export const SEALS = [
  { value: "heart", label: "Kalp" },
  { value: "bow", label: "Fiyonk" },
  { value: "star", label: "Yıldız" },
  { value: "cat", label: "Kedi" },
  { value: "moon", label: "Ay" },
] as const;

export type EnvelopeStyle = (typeof ENVELOPE_STYLES)[number]["value"];
export type Seal = (typeof SEALS)[number]["value"];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seç.");

export const letterSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Mektuba bir başlık ver.").max(160),
  body: z.string().max(60000, "Mektup çok uzun."),
  category: z.enum(LETTER_CATEGORIES.map((c) => c.value) as [LetterCategory, ...LetterCategory[]]),
  writtenOn: isoDate,
  fontStyle: z.enum(["serif", "hand"]),
  envelopeStyle: z.enum(["blush", "rose", "ivory", "champagne", "nude"]),
  seal: z.enum(["heart", "bow", "star", "cat", "moon"]),
  /** A calendar day; the letter opens at the start of that day for its reader. Empty = not sealed. */
  unlockOn: z.union([z.literal(""), isoDate]),
  publish: z.boolean(),
});

export type LetterInput = z.input<typeof letterSchema>;
