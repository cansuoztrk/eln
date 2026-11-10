import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seç.");

/** Tags are short, lower-case words. "#" and stray spaces are cleaned up. */
export const tagList = z
  .array(z.string())
  .max(20, "En fazla 20 etiket.")
  .transform((tags) => [
    ...new Set(
      tags
        .map((tag) => tag.trim().replace(/^#+/, "").toLocaleLowerCase("tr-TR").slice(0, 40))
        .filter(Boolean),
    ),
  ]);

/** "bir, iki  , #üç" → ["bir", "iki", "üç"] */
export function parseTags(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export const createPhotoSchema = z.object({
  assetId: z.uuid(),
  albumId: z.uuid().nullable().optional(),
  publish: z.boolean().optional(),
  showInGallery: z.boolean().optional(),
});

export const photoSchema = z.object({
  id: z.uuid(),
  caption: z.string().trim().max(1000),
  altText: z.string().trim().max(300),
  takenOn: z.union([z.literal(""), isoDate]),
  tags: tagList,
  albumId: z.uuid().nullable(),
  isFavorite: z.boolean(),
  showInGallery: z.boolean(),
  displayStyle: z.enum(["editorial", "polaroid"]),
  publish: z.boolean(),
});

export const albumSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Albüme bir ad ver.").max(120),
  description: z.string().trim().max(2000),
  coverPhotoId: z.uuid().nullable(),
  publish: z.boolean(),
});

export type CreatePhotoInput = z.input<typeof createPhotoSchema>;
export type PhotoInput = z.input<typeof photoSchema>;
export type AlbumInput = z.input<typeof albumSchema>;
