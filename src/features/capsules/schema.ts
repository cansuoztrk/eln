import { z } from "zod";

export const COVER_STYLES = [
  { value: "rose", label: "Gül kurusu" },
  { value: "blush", label: "Pudra" },
  { value: "champagne", label: "Şampanya" },
  { value: "ivory", label: "Fildişi" },
  { value: "nude", label: "Nude" },
] as const;

export type CoverStyle = (typeof COVER_STYLES)[number]["value"];

export const capsuleSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Kapsüle bir ad ver.").max(160),
  message: z.string().max(60000),
  note: z.string().trim().max(2000),
  videoUrl: z.union([z.literal(""), z.url("Geçerli bir bağlantı yapıştır.").startsWith("https://", "Bağlantı https:// ile başlamalı.").max(500)]),
  coverStyle: z.enum(["rose", "blush", "champagne", "ivory", "nude"]),
  /** The day it opens — at the start of that day where its reader lives. */
  unlockOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Açılacağı günü seç."),
  /** Photos and recordings uploaded for this capsule. */
  assetIds: z.array(z.uuid()).max(24),
  publish: z.boolean(),
});

export type CapsuleInput = z.input<typeof capsuleSchema>;
