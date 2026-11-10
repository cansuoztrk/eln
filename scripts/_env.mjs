// Shared helpers for the backup / restore scripts. Plain Node, no dependencies
// beyond the ones the app already has.
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Loads KEY=value pairs from .env.local (if present) without overriding the real environment. */
export function loadEnv(file = ".env.local") {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || line.trim().startsWith("#")) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Eksik ortam değişkeni: ${name}`);
    process.exit(1);
  }
  return value;
}

/** Service-role client: reads everything, so these scripts stay on the owner's machine. */
export function adminClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const BUCKET = "media";

/**
 * Every table in `public`, parents before children, so a restore can insert
 * them in this order without breaking foreign keys.
 */
export const TABLES = [
  "private_spaces",
  "profiles",
  "space_members",
  "space_invites",
  "relationship_dates",
  "media_assets",
  "albums",
  "photos",
  "voice_memories",
  "memories",
  "memory_photos",
  "letters",
  "special_days",
  "special_day_editions",
  "time_capsules",
  "time_capsule_items",
  "journal_entries",
  "journal_entry_photos",
  "future_plans",
  "questions",
  "answers",
  "daily_notes",
  "daily_note_schedule",
  "distance_notes",
  "content_sections",
  "content_section_drafts",
  "theme_settings",
  "user_preferences",
  "content_versions",
  "audit_logs",
];

export function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? "");
}

export const flag = (name) => process.argv.includes(name);
