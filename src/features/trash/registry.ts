/**
 * Every table whose rows can be moved to the trash and brought back.
 * `title` is the column used to name an item in the trash list.
 */
export const TRASHABLE = {
  photos: { label: "Fotoğraf", title: "caption", paths: ["/gallery", "/studio/photos"] },
  albums: { label: "Albüm", title: "title", paths: ["/gallery", "/studio/photos"] },
  memories: { label: "Anı", title: "title", paths: ["/story", "/universe", "/studio/story"] },
  letters: { label: "Mektup", title: "title", paths: ["/letters", "/studio/letters"] },
  voice_memories: { label: "Ses kaydı", title: "title", paths: ["/voice"] },
  time_capsules: { label: "Zaman kapsülü", title: "title", paths: ["/capsules", "/studio/capsules"] },
  journal_entries: { label: "Günlük kaydı", title: "title", paths: ["/journal"] },
  future_plans: { label: "Hayal", title: "title", paths: ["/future"] },
  questions: { label: "Soru", title: "prompt", paths: ["/questions"] },
  answers: { label: "Cevap", title: "body", paths: ["/questions"] },
  daily_notes: { label: "365 notu", title: "body", paths: ["/reasons", "/studio/reasons"] },
  distance_notes: { label: "Not", title: "body", paths: ["/distance"] },
  special_day_editions: { label: "Özel gün baskısı", title: "title", paths: ["/days", "/studio/days"] },
} as const;

export type TrashableTable = keyof typeof TRASHABLE;

export function isTrashable(table: string): table is TrashableTable {
  return table in TRASHABLE;
}
