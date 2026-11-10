import "server-only";
import { cache } from "react";
import type { Session } from "@/lib/auth/session";
import { resolvePreferences, type Preferences } from "./schema";

/** One person's own choices — theme, bow, sticker board. Never visible to the other. */
export const getPreferences = cache(async (session: Session): Promise<Preferences> => {
  const { data } = await session.supabase.from("user_preferences").select("data").eq("user_id", session.userId).maybeSingle();
  return resolvePreferences(data?.data);
});
