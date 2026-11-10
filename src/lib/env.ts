import "server-only";
import { z } from "zod";

/**
 * Server-only environment. None of these are ever exposed to the browser:
 * the browser never talks to Supabase directly.
 */
const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  /** Salts rate-limit keys. Any long random string. */
  APP_SECRET: z.string().min(32),
  /** Required once, on /setup, to create the owner account. */
  SETUP_SECRET: z.string().min(12),
  /** Public origin of the site, used when building invite links. */
  SITE_URL: z.url().optional(),
});

export type Env = z.infer<typeof schema>;

export const REQUIRED_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_SECRET",
  "SETUP_SECRET",
] as const;

let cached: Env | null = null;

function read(): z.ZodSafeParseResult<Env> {
  return schema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    APP_SECRET: process.env.APP_SECRET,
    SETUP_SECRET: process.env.SETUP_SECRET,
    SITE_URL: process.env.SITE_URL || undefined,
  });
}

/** True when every variable the backend needs is present and well-formed. */
export function isBackendConfigured(): boolean {
  return cached !== null || read().success;
}

/** Names (never values) of the variables that are missing or malformed. */
export function missingEnvKeys(): string[] {
  const result = read();
  if (result.success) return [];
  return [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
}

export function getEnv(): Env {
  if (cached) return cached;
  const result = read();
  if (!result.success) {
    throw new Error(`Backend is not configured. Missing or invalid: ${missingEnvKeys().join(", ")}`);
  }
  cached = result.data;
  return cached;
}
