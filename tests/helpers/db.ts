import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { FACTS } from "@/content/facts";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Helpers for the database tests. They talk to a running Supabase (local by
 * default) through its public API, signed in as real users, so every
 * assertion passes through PostgREST and row level security exactly as the
 * app's requests do.
 *
 * The helpers only ever add what is missing and never change anyone's
 * password: sign-in for tests uses one-time links minted by the admin API.
 */

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

export type Client = SupabaseClient<Database>;
export const admin: Client = createClient<Database>(url, serviceKey, options);
export const anon: Client = createClient<Database>(url, anonKey, options);
export const TAG = "__rls__";

const STRANGER = "rls-stranger@example.test";

async function findUser(email: string) {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return data?.users.find((u) => u.email?.toLowerCase() === email) ?? null;
}

async function ensureUser(email: string) {
  const existing = await findUser(email);
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({ email, password: randomBytes(24).toString("base64url"), email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${email}: ${error?.message}`);
  return data.user;
}

/** A client signed in as the given user, without knowing or changing their password. */
export async function signInAs(email: string): Promise<Client> {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) throw new Error(`no sign-in link for ${email}: ${error?.message}`);
  const client: Client = createClient<Database>(url, anonKey, options);
  const verified = await client.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: "email" });
  if (verified.error || !verified.data.session) throw new Error(`could not sign in as ${email}: ${verified.error?.message}`);
  return client;
}

export type World = {
  spaceId: string;
  ownerId: string;
  partnerId: string;
  strangerId: string;
  owner: Client;
  partner: Client;
  stranger: Client;
};

/** Makes sure a space with an owner, a partner and an unrelated stranger exists, then signs in as each. */
export async function ensureWorld(): Promise<World> {
  let { data: space } = await admin.from("private_spaces").select("id").maybeSingle();
  if (!space) {
    const owner = await ensureUser("rls-owner@example.test");
    const created = await admin.rpc("bootstrap_space", { p_owner: owner.id, p_config: JSON.parse(JSON.stringify(FACTS)) });
    if (created.error) throw new Error(`bootstrap failed: ${created.error.message}`);
    space = { id: created.data };
  }

  const members = async () => (await admin.from("space_members").select("user_id, role").eq("space_id", space!.id)).data ?? [];
  let list = await members();
  if (!list.some((m) => m.role === "partner")) {
    const partner = await ensureUser("rls-partner@example.test");
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const ownerId = list.find((m) => m.role === "owner")!.user_id;
    await admin.from("space_invites").insert({
      space_id: space.id,
      token_hash: tokenHash,
      email: partner.email!,
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      created_by: ownerId,
    });
    const accepted = await admin.rpc("accept_invite", { p_token_hash: tokenHash, p_user: partner.id, p_profile: { city: "Bakü", timezone: "Asia/Baku" } });
    if (accepted.error) throw new Error(`accept_invite failed: ${accepted.error.message}`);
    list = await members();
  }

  const ownerId = list.find((m) => m.role === "owner")!.user_id;
  const partnerId = list.find((m) => m.role === "partner")!.user_id;
  const stranger = await ensureUser(STRANGER);
  const emailOf = async (id: string) => (await admin.auth.admin.getUserById(id)).data.user!.email!;

  return {
    spaceId: space.id,
    ownerId,
    partnerId,
    strangerId: stranger.id,
    owner: await signInAs(await emailOf(ownerId)),
    partner: await signInAs(await emailOf(partnerId)),
    stranger: await signInAs(STRANGER),
  };
}

/** Removes everything the tests created (rows are tagged in their title/body/key). */
export async function cleanup(spaceId: string) {
  const like = `${TAG}%`;
  await admin.from("answers").delete().like("body", like);
  await admin.from("questions").delete().like("prompt", like);
  await admin.from("time_capsules").delete().like("title", like);
  await admin.from("photos").delete().like("caption", like);
  await admin.from("media_assets").delete().like("original_filename", like);
  await admin.from("letters").delete().like("title", like);
  await admin.from("memories").delete().like("title", like);
  await admin.from("journal_entries").delete().like("title", like);
  await admin.from("daily_notes").delete().like("body", like);
  await admin.from("albums").delete().like("title", like);
  await admin.from("content_section_drafts").delete().eq("space_id", spaceId).like("key", "rls.%");
  await admin.from("space_invites").delete().like("email", "rls-%");
  await admin.from("audit_logs").delete().like("summary", like);
  await admin.from("content_versions").delete().like("snapshot->>title", like);
}

export const future = (days = 30) => new Date(Date.now() + days * 86_400_000).toISOString();
export const past = (days = 1) => new Date(Date.now() - days * 86_400_000).toISOString();
