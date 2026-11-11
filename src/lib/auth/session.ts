import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isBackendConfigured } from "@/lib/env";
import { createUserClient, type UserClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Role = "owner" | "partner";
export type Space = Tables<"private_spaces">;
export type Profile = Tables<"profiles">;

export type Session = {
  userId: string;
  email: string | null;
  role: Role;
  space: Space;
  profile: Profile;
  supabase: UserClient;
};

/**
 * The signed-in member, or null. Cached for the duration of one request so
 * layouts, pages and queries share a single lookup.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!isBackendConfigured()) return null;

  const supabase = await createUserClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const [membership, profile] = await Promise.all([
    supabase
      .from("space_members")
      .select("role, space:private_spaces(*)")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
  ]);

  if (!membership.data?.space || !profile.data) return null;

  return {
    userId,
    email: typeof claims.claims.email === "string" ? claims.claims.email : null,
    role: membership.data.role,
    space: membership.data.space,
    profile: profile.data,
    supabase,
  };
});

/** For pages inside the world: anyone who is not a member goes to /login. */
export async function requireMember(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** For the Studio: partners are sent home, strangers to /login. */
export async function requireOwner(): Promise<Session> {
  const session = await requireMember();
  if (session.role !== "owner") redirect("/");
  return session;
}

/** Names and places of the two people, from the viewer's point of view. */
export function people(session: Pick<Session, "space" | "role">) {
  const { space, role } = session;
  const owner = { name: space.owner_name, city: space.owner_city, timezone: space.owner_timezone };
  const partner = {
    name: space.partner_name,
    fullName: space.partner_full_name ?? space.partner_name,
    city: space.partner_city,
    timezone: space.partner_timezone,
  };
  return {
    owner,
    partner,
    me: role === "owner" ? owner : partner,
    other: role === "owner" ? partner : owner,
  };
}
