"use server";

import { revalidatePath } from "next/cache";
import { FACTS } from "@/content/facts";
import { getSession } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { fail, GENERIC_ERROR, invalid, ok, type ActionResult } from "@/lib/result";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { toJson } from "@/lib/supabase/json";
import { createUserClient } from "@/lib/supabase/server";
import { spaceExists } from "./queries";
import {
  acceptInviteSchema,
  createInviteSchema,
  loginSchema,
  setupSchema,
  type AcceptInviteInput,
  type CreateInviteInput,
  type LoginInput,
  type SetupInput,
} from "./schema";
import { hashToken, newInviteToken, safeNextPath, secretsMatch, siteOrigin } from "./tokens";

type Redirect = { redirectTo: string };

export async function loginAction(input: LoginInput): Promise<ActionResult<Redirect>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  if (!(await rateLimit("login", [parsed.data.email]))) return fail(RATE_LIMITED_MESSAGE);

  const supabase = await createUserClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // One message for every failure: never reveal whether an e-mail exists.
  if (error) return fail("E-posta ya da parola hatalı.");

  return ok({ redirectTo: safeNextPath(parsed.data.next) });
}

export async function logoutAction(): Promise<ActionResult<Redirect>> {
  const supabase = await createUserClient();
  await supabase.auth.signOut({ scope: "local" });
  return ok({ redirectTo: "/login" });
}

/**
 * One-time setup: creates the owner account, the space and the confirmed
 * facts. Refuses to run a second time — at the form, here, and again inside
 * the database function.
 */
export async function setupAction(input: SetupInput): Promise<ActionResult<Redirect>> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  if (!(await rateLimit("setup"))) return fail(RATE_LIMITED_MESSAGE);
  if (await spaceExists()) return fail("Kurulum zaten tamamlanmış.");

  if (!secretsMatch(parsed.data.secret, getEnv().SETUP_SECRET)) {
    return fail("Kurulum anahtarı hatalı.", { secret: "Bu anahtar eşleşmiyor." });
  }

  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    return fail("Hesap oluşturulamadı. Bu e-posta daha önce kullanılmış olabilir.");
  }

  const { error } = await admin.rpc("bootstrap_space", {
    p_owner: created.data.user.id,
    p_config: toJson(FACTS),
  });
  if (error) {
    // Leave nothing half-made behind.
    await admin.auth.admin.deleteUser(created.data.user.id);
    return fail(GENERIC_ERROR);
  }

  const supabase = await createUserClient();
  const signIn = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signIn.error) return ok({ redirectTo: "/login" });

  return ok({ redirectTo: "/studio" });
}

/** Creates a single-use invite link. The link is returned once and never stored. */
export async function createInviteAction(
  input: CreateInviteInput,
): Promise<ActionResult<{ link: string; expiresAt: string }>> {
  const session = await getSession();
  if (!session || session.role !== "owner") return fail("Bu işlem için yetkin yok.");

  const parsed = createInviteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimit("invite", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);

  if (parsed.data.email === session.email?.toLowerCase()) {
    return fail("Kendi e-postanı davet edemezsin.", { email: "Bu senin e-postan." });
  }

  const token = newInviteToken();
  const expiresAt = new Date(Date.now() + parsed.data.expiresInDays * 86_400_000).toISOString();

  // A new link replaces any that is still waiting.
  await session.supabase
    .from("space_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("space_id", session.space.id)
    .is("accepted_at", null)
    .is("revoked_at", null);

  const { error } = await session.supabase.from("space_invites").insert({
    space_id: session.space.id,
    token_hash: hashToken(token),
    email: parsed.data.email,
    display_name: parsed.data.displayName,
    expires_at: expiresAt,
  });
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/studio/invite");
  return ok({ link: `${await siteOrigin()}/invite/${token}`, expiresAt });
}

export async function revokeInviteAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "owner") return fail("Bu işlem için yetkin yok.");

  const { error } = await session.supabase
    .from("space_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("accepted_at", null);
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/studio/invite");
  return ok(undefined, "Davet iptal edildi.");
}

/**
 * Accepting an invite: the invited person chooses a password, an account is
 * created for the invited e-mail, and they are signed in. If that e-mail
 * already has an account (a fresh link sent after a forgotten password), the
 * password is replaced instead.
 */
export async function acceptInviteAction(input: AcceptInviteInput): Promise<ActionResult<Redirect>> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimit("invite"))) return fail(RATE_LIMITED_MESSAGE);

  const admin = createAdminClient();
  const tokenHash = hashToken(parsed.data.token);
  const stale = "Bu davet bağlantısı artık geçerli değil.";

  const { data: invite } = await admin
    .from("space_invites")
    .select("id, email, space_id, expires_at, accepted_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invite || invite.accepted_at || invite.revoked_at || new Date(invite.expires_at) <= new Date()) {
    return fail(stale);
  }

  let userId: string;
  let createdNow = false;

  const created = await admin.auth.admin.createUser({
    email: invite.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (created.data.user) {
    userId = created.data.user.id;
    createdNow = true;
  } else {
    // The e-mail already has an account: this link resets its password —
    // but only for the partner. An invite can never take over the owner.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === invite.email.toLowerCase());
    if (!existing) return fail(GENERIC_ERROR);

    const { data: member } = await admin
      .from("space_members")
      .select("role")
      .eq("space_id", invite.space_id)
      .eq("user_id", existing.id)
      .maybeSingle();
    if (member?.role === "owner") return fail(stale);

    const updated = await admin.auth.admin.updateUserById(existing.id, { password: parsed.data.password });
    if (updated.error) return fail(GENERIC_ERROR);
    userId = existing.id;
  }

  const { error } = await admin.rpc("accept_invite", {
    p_token_hash: tokenHash,
    p_user: userId,
    p_profile: {
      city: FACTS.partner.city,
      timezone: FACTS.partner.timezone,
      birthday: FACTS.partner.birthday,
    },
  });
  if (error) {
    if (createdNow) await admin.auth.admin.deleteUser(userId);
    return fail(stale);
  }

  const supabase = await createUserClient();
  const signIn = await supabase.auth.signInWithPassword({
    email: invite.email,
    password: parsed.data.password,
  });
  if (signIn.error) return ok({ redirectTo: "/login" });

  // Straight into the gift.
  return ok({ redirectTo: "/gift" });
}
