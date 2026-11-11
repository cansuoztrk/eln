import "server-only";
import { envProblems, parseEnv, REQUIRED_ENV_KEYS, type Env, type EnvProblem } from "./env-check";

/**
 * Server-only environment. None of these are ever exposed to the browser:
 * the browser never talks to Supabase directly. The rules live in
 * `env-check.ts`, shared with the proxy.
 */

export { REQUIRED_ENV_KEYS, type Env, type EnvProblem };

let cached: Env | null = null;

/** True when every variable the backend needs is present and well-formed. */
export function isBackendConfigured(): boolean {
  return cached !== null || parseEnv().success;
}

/** What is wrong, by variable name and reason — never by value. */
export function envIssues(): EnvProblem[] {
  return envProblems();
}

/** Names (never values) of the variables that are missing or malformed. */
export function missingEnvKeys(): string[] {
  return envProblems().map((problem) => problem.key);
}

export function getEnv(): Env {
  if (cached) return cached;
  const result = parseEnv();
  if (!result.success) {
    throw new Error(`Backend is not configured. Missing or invalid: ${missingEnvKeys().join(", ")}`);
  }
  cached = result.data;
  return cached;
}
