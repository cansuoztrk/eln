import { z } from "zod";
import { tagList } from "@/features/gallery/schema";

export const entrySchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().max(160),
  body: z.string().trim().min(1, "Bir şeyler yaz.").max(40000),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seç."),
  tags: tagList,
  /** "private" entries never leave their author, even when published. */
  visibility: z.enum(["shared", "private"]),
  photoIds: z.array(z.uuid()).max(12),
  publish: z.boolean(),
});

export type EntryInput = z.input<typeof entrySchema>;
