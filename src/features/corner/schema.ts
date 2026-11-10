import { z } from "zod";

export const THEMES = [
  { value: "blush", label: "Pudra", swatch: ["#f9e3e6", "#9c5565"] },
  { value: "rose", label: "Gül", swatch: ["#f6dbe1", "#8e4a5e"] },
  { value: "champagne", label: "Şampanya", swatch: ["#f6eedd", "#8a6a3c"] },
  { value: "pearl", label: "İnci", swatch: ["#f6efe8", "#7b6259"] },
] as const;

export type ThemeName = (typeof THEMES)[number]["value"];

/** The bow collection: fill and knot colours, all from the palette. */
export const BOWS = [
  { name: "Pudra", fill: "#f3c9d1", knot: "#c98b96" },
  { name: "Gül kurusu", fill: "#c98b96", knot: "#9c5565" },
  { name: "Şampanya", fill: "#ead9bb", knot: "#b8996a" },
  { name: "İnci", fill: "#fffdfa", knot: "#e8d5c7" },
  { name: "Nude", fill: "#e8d5c7", knot: "#b98a78" },
  { name: "Mürdüm", fill: "#9c5565", knot: "#5b3a47" },
  { name: "Rose gold", fill: "#dcb3a4", knot: "#b98a78" },
  { name: "Gece", fill: "#5b3a47", knot: "#241a1e" },
] as const;

export const STICKER_TYPES = ["bow", "heart", "sparkle", "kitten"] as const;
export type StickerType = (typeof STICKER_TYPES)[number];
export const MAX_STICKERS = 30;

const sticker = z.object({
  id: z.string().min(1).max(24),
  type: z.enum(STICKER_TYPES),
  /** Position of the sticker's centre, in percent of the board. */
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  rotate: z.number().min(-45).max(45),
  tone: z.number().int().min(0).max(BOWS.length - 1),
});

export type Sticker = z.infer<typeof sticker>;

export const preferencesSchema = z.object({
  theme: z.enum(["blush", "rose", "champagne", "pearl"]),
  bow: z.number().int().min(0).max(BOWS.length - 1),
  stickers: z.array(sticker).max(MAX_STICKERS),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = { theme: "blush", bow: 0, stickers: [] };

export function resolvePreferences(stored: unknown): Preferences {
  const merged = { ...DEFAULT_PREFERENCES, ...(stored && typeof stored === "object" ? stored : {}) };
  const parsed = preferencesSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_PREFERENCES;
}
