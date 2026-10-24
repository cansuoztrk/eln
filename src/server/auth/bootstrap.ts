import type { Db } from "../db";
import { hashPassword, passwordProblems } from "./password";

export type BootstrapResult = "created" | "exists" | "skipped" | "conflict";

/**
 * İlk yönetici hesabını ortam değişkenlerinden oluşturur (ADMIN_EMAIL + ADMIN_PASSWORD).
 * Sunucuda terminal erişimi olmayan kurulumlar (ör. Vercel) içindir; her dağıtımda çalışır ama
 * yalnızca hesap yoksa bir şey yapar. Var olan hesabın parolasını veya rolünü asla değiştirmez:
 * aynı e-postayla önceden açılmış normal bir hesap yönetici yapılmaz ("conflict").
 */
export async function ensureBootstrapAdmin(db: Db, emailRaw: string | undefined, password: string | undefined): Promise<BootstrapResult> {
  const email = (emailRaw ?? "").trim().toLowerCase();
  if (!email || !password) return "skipped";
  if (!email.includes("@")) throw new Error("ADMIN_EMAIL geçerli bir e-posta adresi değil.");
  const existing = await db.user.findUnique({ where: { email }, select: { role: true } });
  if (existing) return existing.role === "ADMIN" ? "exists" : "conflict";
  const problem = passwordProblems(password);
  if (problem) throw new Error(`ADMIN_PASSWORD uygun değil: ${problem}`);
  await db.user.create({ data: { email, passwordHash: await hashPassword(password), role: "ADMIN", kvkkAcceptedAt: new Date() } });
  return "created";
}
