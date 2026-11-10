import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import type { Database } from "./database.types";

export type UserClient = SupabaseClient<Database>;

/**
 * Session cookies are HttpOnly: no script on the page can read the tokens,
 * because nothing in the browser ever needs them.
 */
export const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 400,
};

/**
 * A Supabase client that acts as the signed-in person. Every query goes
 * through row level security.
 */
export async function createUserClient(): Promise<UserClient> {
  const env = getEnv();
  const store = await cookies();

  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, { ...options, ...SESSION_COOKIE_OPTIONS, maxAge: options.maxAge });
          }
        } catch {
          // Server Components cannot write cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
