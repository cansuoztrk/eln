import type { MemoryDraft } from "./components/memory-editor";
import type { Memory } from "./queries";
import { MEMORY_CATEGORIES, type MemoryCategory } from "./schema";

/** A blank memory, or an existing one, in the shape the editor works with. */
export function toDraft(memory?: Memory | null): MemoryDraft {
  if (!memory) {
    return {
      title: "",
      happenedOn: "",
      datePrecision: "day",
      summary: "",
      description: "",
      specialNote: "",
      category: "moment",
      tags: "",
      starSize: 2,
      starTone: "blush",
      status: "draft",
    };
  }
  const known = MEMORY_CATEGORIES.some((c) => c.value === memory.category);
  return {
    id: memory.id,
    title: memory.title,
    happenedOn: memory.happenedOn ?? "",
    datePrecision: memory.datePrecision,
    summary: memory.summary,
    description: memory.description,
    specialNote: memory.specialNote,
    category: (known ? memory.category : "other") as MemoryCategory,
    tags: memory.tags.join(", "),
    starSize: memory.starSize,
    starTone: memory.starTone,
    status: memory.status,
  };
}
