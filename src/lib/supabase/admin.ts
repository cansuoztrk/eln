import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import type { Database } from "./database.types";

export type AdminClient = SupabaseClient<Database>;

let client: AdminClient | null = null;

/**
 * Service-role client. It bypasses row level security, so it is used only for:
 * setup, invite acceptance, storage (upload / signing), export and account
 * deletion. Never import this from a feature's `queries.ts`.
 */
export function createAdminClient(): AdminClient {
  if (client) return client;
  const env = getEnv();
  client = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

export const MEDIA_BUCKET = "media";
