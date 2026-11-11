import { z } from "zod";

/**
 * Validation of the server's settings, kept free of "server-only" so the proxy
 * can use exactly the same rules as the pages. Values are only ever checked,
 * never shown: problems are reported by variable name and reason.
 *
 * The rules also catch the mistakes that are easy to make while copying keys
 * out of the Supabase dashboard: the dashboard's own address instead of the
 * project's, a database connection string, and the two keys swapped. A
 * swapped secret key would be dangerous, not just broken: it ignores row level
 * security, so drafts and sealed letters would stop being private.
 */

export const REQUIRED_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_SECRET",
  "SETUP_SECRET",
] as const;

export type EnvKey = (typeof REQUIRED_ENV_KEYS)[number] | "SITE_URL";
export type EnvProblem = { key: EnvKey; reason: string };

/** The role a legacy JWT key carries ("anon" / "service_role"), or null for any other value. */
function jwtRole(value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json?.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

const isSecretKey = (value: string) => value.startsWith("sb_secret_") || jwtRole(value) === "service_role";
const isPublishableKey = (value: string) => value.startsWith("sb_publishable_") || jwtRole(value) === "anon";

const projectUrl = z.string().superRefine((value, ctx) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    ctx.addIssue({ code: "custom", message: "Geçerli bir adres değil. https://PROJE-ID.supabase.co biçiminde olmalı." });
    return;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    ctx.addIssue({ code: "custom", message: "https:// ile başlamalı (veritabanı bağlantı satırı değil, proje adresi)." });
  } else if (url.hostname === "supabase.com" || url.hostname.endsWith(".supabase.com")) {
    ctx.addIssue({ code: "custom", message: "Bu, Supabase panelinin adresi. Projenin adresi https://PROJE-ID.supabase.co biçimindedir." });
  } else if (url.pathname !== "/" && url.pathname !== "") {
    ctx.addIssue({ code: "custom", message: "Sonunda ek yol olmamalı; yalnızca https://PROJE-ID.supabase.co yaz." });
  }
});

const schema = z.object({
  SUPABASE_URL: projectUrl,
  SUPABASE_ANON_KEY: z
    .string()
    .min(20, "Çok kısa; Publishable key'in tamamını kopyala.")
    .refine((v) => !isSecretKey(v), "Buraya Secret key yazılmış. Bu alana Publishable key (sb_publishable_…) gelir."),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, "Çok kısa; Secret key'in tamamını kopyala.")
    .refine((v) => !isPublishableKey(v), "Buraya Publishable key yazılmış. Bu alana Secret key (sb_secret_…) gelir."),
  /** Salts rate-limit keys. Any long random string. */
  APP_SECRET: z.string().min(32, "En az 32 karakter olmalı."),
  /** Required once, on /setup, to create the owner account. */
  SETUP_SECRET: z.string().min(12, "En az 12 karakter olmalı."),
  /** Public origin of the site, used when building invite links. Optional. */
  SITE_URL: z.url("Geçerli bir adres değil (https://… ile başlamalı).").optional(),
});

export type Env = z.infer<typeof schema>;

type Source = Record<string, string | undefined>;

/** Reads the settings, ignoring the stray spaces and line breaks that come with copy and paste. */
function collect(source: Source) {
  const value = (key: string) => {
    const raw = source[key]?.trim();
    return raw ? raw : undefined;
  };
  return {
    SUPABASE_URL: value("SUPABASE_URL"),
    SUPABASE_ANON_KEY: value("SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: value("SUPABASE_SERVICE_ROLE_KEY"),
    APP_SECRET: value("APP_SECRET"),
    SETUP_SECRET: value("SETUP_SECRET"),
    SITE_URL: value("SITE_URL"),
  };
}

export function parseEnv(source: Source = process.env) {
  return schema.safeParse(collect(source));
}

/** What is wrong with the settings, by name and reason — never by value. Empty when all is well. */
export function envProblems(source: Source = process.env): EnvProblem[] {
  const result = parseEnv(source);
  if (result.success) return [];
  const seen = new Set<string>();
  const problems: EnvProblem[] = [];
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]) as EnvKey;
    if (seen.has(key)) continue;
    seen.add(key);
    const given = collect(source)[key as keyof ReturnType<typeof collect>];
    problems.push({ key, reason: given === undefined ? "Tanımlanmamış ya da boş." : issue.message });
  }
  return problems;
}
