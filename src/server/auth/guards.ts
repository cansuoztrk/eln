import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./session";

export async function requireUser(returnTo = "/hesap"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/giris?sonra=${encodeURIComponent(returnTo)}`);
  return user;
}

/**
 * Yönetim paneli koruması. Yetkisiz kullanıcıya 404 döner (panelin varlığını açık etmemek için).
 * Hem sayfa düzeninde hem her sunucu eyleminde ayrıca çağrılır.
 */
export async function requireStaff(minRole: "EDITOR" | "ADMIN" = "EDITOR"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?sonra=/admin");
  const ok = minRole === "EDITOR" ? user.role === "EDITOR" || user.role === "ADMIN" : user.role === "ADMIN";
  if (!ok) notFound();
  return user;
}

export function isStaff(user: SessionUser | null): boolean {
  return Boolean(user && (user.role === "ADMIN" || user.role === "EDITOR"));
}
