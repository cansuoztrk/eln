import type { Json } from "./database.types";

/** Marks a plain, serialisable value as fit for a non-null jsonb column. */
export function toJson(value: unknown): NonNullable<Json> {
  return value as NonNullable<Json>;
}
