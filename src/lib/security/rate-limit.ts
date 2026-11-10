import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { getEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rate limiting for sign-in, setup and invite attempts.
 *
 * Privacy: the limiter never stores an IP address or an e-mail. Each key is an
 * HMAC of (action + identifier) salted with APP_SECRET, kept for at most an
 * hour, and used for nothing but counting attempts.
 */
function keyFor(action: string, identifier: string): string {
  return createHmac("sha256", getEnv().APP_SECRET).update(`${action}|${identifier}`).digest("hex");
}

async function clientAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export type RateLimitRule = { max: number; windowSeconds: number };

export const LIMITS = {
  login: { max: 8, windowSeconds: 15 * 60 },
  setup: { max: 5, windowSeconds: 30 * 60 },
  invite: { max: 10, windowSeconds: 30 * 60 },
  write: { max: 120, windowSeconds: 60 },
  upload: { max: 60, windowSeconds: 10 * 60 },
  export: { max: 6, windowSeconds: 30 * 60 },
} satisfies Record<string, RateLimitRule>;

/**
 * Returns true when the attempt is allowed. `identifiers` are extra scopes
 * (an e-mail, a user id) each limited on its own alongside the caller's address.
 * Fails open if the limiter itself is unavailable, so a hiccup never locks
 * the two of them out of their own site.
 */
export async function rateLimit(
  action: keyof typeof LIMITS,
  identifiers: string[] = [],
): Promise<boolean> {
  const rule = LIMITS[action];
  const admin = createAdminClient();
  const scopes = [`ip:${await clientAddress()}`, ...identifiers.map((id) => `id:${id.toLowerCase()}`)];

  const results = await Promise.all(
    scopes.map((scope) =>
      admin.rpc("check_rate_limit", {
        p_key: keyFor(action, scope),
        p_max: rule.max,
        p_window_seconds: rule.windowSeconds,
      }),
    ),
  );

  return results.every(({ data, error }) => (error ? true : data === true));
}

export const RATE_LIMITED_MESSAGE = "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
