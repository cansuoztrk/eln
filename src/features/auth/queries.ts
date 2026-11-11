import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "./tokens";

/** Has the one-time setup been completed? */
export async function spaceExists(): Promise<boolean> {
  const { count, error } = await createAdminClient()
    .from("private_spaces")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error("Could not reach the database.");
  return (count ?? 0) > 0;
}

export type InvitePreview =
  | { valid: true; displayName: string; ownerName: string }
  | { valid: false };

/** What the invite page may show before the person has chosen a password. */
export async function previewInvite(token: string): Promise<InvitePreview> {
  if (token.length < 20 || token.length > 200) return { valid: false };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("space_invites")
    .select("display_name, expires_at, accepted_at, revoked_at, space:private_spaces(owner_name)")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!invite || invite.accepted_at || invite.revoked_at || new Date(invite.expires_at) <= new Date()) {
    return { valid: false };
  }
  return { valid: true, displayName: invite.display_name, ownerName: invite.space?.owner_name ?? "" };
}
