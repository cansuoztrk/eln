import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { envProblems, parseEnv } from "@/lib/env-check";

/** A legacy Supabase key: a JWT whose payload names its role. Signature is irrelevant here. */
const jwt = (role: string) =>
  ["eyJhbGciOiJIUzI1NiJ9", Buffer.from(JSON.stringify({ iss: "supabase", role })).toString("base64url"), "c2lnbmF0dXJlLW5vdC1jaGVja2Vk"].join(".");

const good = {
  SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_0123456789abcdefghij",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_0123456789abcdefghijklmn",
  APP_SECRET: "x".repeat(40),
  SETUP_SECRET: "y".repeat(20),
};
const keys = (source: Record<string, string | undefined>) => envProblems(source).map((p) => p.key);

describe("server settings", () => {
  it("accept a correct set, with the new keys or the legacy ones", () => {
    expect(envProblems(good)).toEqual([]);
    expect(envProblems({ ...good, SUPABASE_ANON_KEY: jwt("anon"), SUPABASE_SERVICE_ROLE_KEY: jwt("service_role") })).toEqual([]);
    expect(envProblems({ ...good, SUPABASE_URL: "http://127.0.0.1:54321" })).toEqual([]);
  });

  it("ignore the spaces and line breaks that come with copy and paste", () => {
    const pasted = Object.fromEntries(Object.entries(good).map(([k, v]) => [k, `  ${v}\n`]));
    const result = parseEnv(pasted);
    expect(result.success).toBe(true);
    expect(result.success && result.data.SUPABASE_URL).toBe(good.SUPABASE_URL);
  });

  it("say which setting is missing", () => {
    expect(envProblems({ ...good, SUPABASE_URL: undefined })).toEqual([{ key: "SUPABASE_URL", reason: "Tanımlanmamış ya da boş." }]);
    expect(keys({ ...good, APP_SECRET: "   " })).toEqual(["APP_SECRET"]);
  });

  it("catch the project address written wrongly — the mistake that stopped the first deploy", () => {
    for (const wrong of [
      "supabase.co/proje",
      "abcdefghijklmnopqrst",
      "https://supabase.com/dashboard/project/abcdefghijklmnopqrst",
      "postgresql://postgres:pw@db.abcdefghijklmnopqrst.supabase.co:5432/postgres",
      "https://abcdefghijklmnopqrst.supabase.co/rest/v1/",
    ]) {
      expect(keys({ ...good, SUPABASE_URL: wrong }), wrong).toEqual(["SUPABASE_URL"]);
    }
  });

  it("refuse the two keys swapped — a secret key in the anon slot would ignore row level security", () => {
    expect(keys({ ...good, SUPABASE_ANON_KEY: good.SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY: good.SUPABASE_ANON_KEY })).toEqual([
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
    expect(keys({ ...good, SUPABASE_ANON_KEY: jwt("service_role") })).toEqual(["SUPABASE_ANON_KEY"]);
    expect(keys({ ...good, SUPABASE_SERVICE_ROLE_KEY: jwt("anon") })).toEqual(["SUPABASE_SERVICE_ROLE_KEY"]);
  });

  it("never repeat a value back, only names and reasons", () => {
    const secret = "sb_secret_DO-NOT-ECHO-0123456789";
    const text = JSON.stringify(envProblems({ ...good, SUPABASE_ANON_KEY: secret, SUPABASE_URL: "nope" }));
    expect(text).not.toContain(secret);
    expect(text).not.toContain("nope");
  });
});

describe("the build never needs the database", () => {
  it("the queries a page can reach before any request-time API wait for a request first", () => {
    const source = readFileSync("src/features/auth/queries.ts", "utf8");
    const bodies = source.split(/export async function /).slice(1);
    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      const name = body.slice(0, body.indexOf("("));
      const firstStatement = body.slice(body.indexOf("{") + 1).trim().split("\n")[0];
      expect(firstStatement, name).toBe("await connection();");
    }
  });

  it("the proxy checks the settings with the same rules as the pages", () => {
    const proxy = readFileSync("src/proxy.ts", "utf8");
    expect(proxy).toContain('from "@/lib/env-check"');
    expect(proxy).not.toMatch(/process\.env\.SUPABASE_/);
  });
});
