import { z } from "zod";

export const NOTE_MAX = 600;

export const noteSchema = z.object({
  kind: z.enum(["note", "longing"]),
  body: z.string().trim().min(1, "Bir şeyler yaz.").max(NOTE_MAX, `En fazla ${NOTE_MAX} karakter.`),
});

export type NoteInput = z.input<typeof noteSchema>;
export type NoteKind = "note" | "longing";
