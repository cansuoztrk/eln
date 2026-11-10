/**
 * What may be brought back from an earlier version, per table. Only the
 * written content — never status, dates of sealing, authorship or ids.
 */
export const VERSIONED = {
  letters: { label: "mektup", fields: ["title", "body", "category", "font_style", "envelope_style", "seal"], preview: "body", paths: ["/letters", "/studio/letters"] },
  memories: { label: "anı", fields: ["title", "summary", "description", "special_note", "category", "tags"], preview: "description", paths: ["/story", "/studio/story"] },
  journal_entries: { label: "günlük kaydı", fields: ["title", "body", "tags"], preview: "body", paths: ["/journal"] },
} as const;

export type VersionedTable = keyof typeof VERSIONED;

export function isVersioned(table: string): table is VersionedTable {
  return table in VERSIONED;
}
