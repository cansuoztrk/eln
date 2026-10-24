"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { siteUrl } from "@/config/brand";
import { HOUR } from "@/lib/time";
import { db } from "@/server/db";
import { hashPassword, passwordProblems, verifyPassword } from "@/server/auth/password";
import { createSession, destroyAllSessions, destroySession, getCurrentUser } from "@/server/auth/session";
import { hashToken, newToken } from "@/server/auth/tokens";
import { renderEmail } from "@/server/notifications/service";
import { clientIp, rateLimit } from "@/server/rate-limit";

export type AuthState = { error?: string; ok?: boolean; message?: string; fields?: Record<string, string> };

function safeReturn(to: unknown): string {
  const s = typeof to === "string" ? to : "";
  // Açık yönlendirme açığını önle: yalnızca site içi yollar
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/hesap";
}

async function limited(key: string, limit: number, windowMs: number) {
  const h = await headers();
  return !rateLimit(`${key}:${clientIp(h)}`, limit, windowMs).ok;
}

const email = z.string().trim().toLowerCase().email("Geçerli bir e-posta girin.").max(200);

export async function register(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await limited("register", 5, HOUR)) return { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." };
  const parsed = z
    .object({ email, password: z.string(), name: z.string().trim().max(80).optional(), kvkk: z.literal("on", { message: "Aydınlatma metnini onaylamanız gerekir." }), digest: z.string().optional() })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz.", fields: { email: String(fd.get("email") ?? "") } };
  const problem = passwordProblems(parsed.data.password);
  if (problem) return { error: problem, fields: { email: parsed.data.email } };
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "Bu e-posta ile bir hesap zaten var. Giriş yapmayı deneyin.", fields: { email: parsed.data.email } };
  const user = await db.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      name: parsed.data.name || null,
      kvkkAcceptedAt: new Date(),
      digestOptIn: parsed.data.digest === "on",
      digestOptInAt: parsed.data.digest === "on" ? new Date() : null,
    },
  });
  await createSession(user.id);
  redirect(safeReturn(fd.get("sonra")));
}

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await limited("login", 10, 15 * 60_000)) return { error: "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin." };
  const parsed = z.object({ email, password: z.string().min(1).max(200) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "E-posta veya parola hatalı.", fields: { email: String(fd.get("email") ?? "") } };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Kullanıcının varlığını sızdırmamak için aynı hata mesajı ve sabit maliyetli doğrulama
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : await verifyPassword(parsed.data.password, "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAA");
  if (!user || !ok) return { error: "E-posta veya parola hatalı.", fields: { email: parsed.data.email } };
  await createSession(user.id);
  redirect(safeReturn(fd.get("sonra")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await limited("reset", 5, HOUR)) return { error: "Çok fazla istek. Daha sonra tekrar deneyin." };
  const parsed = email.safeParse(fd.get("email"));
  const generic: AuthState = { ok: true, message: "Bu e-posta ile bir hesap varsa, parola sıfırlama bağlantısı gönderildi." };
  if (!parsed.success) return generic;
  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (!user) return generic;
  const token = newToken();
  await db.userToken.create({ data: { type: "RESET_PASSWORD", tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + HOUR) } });
  const link = siteUrl(`/sifre-sifirla?token=${token}`);
  await db.emailOutbox.create({
    data: {
      toEmail: user.email,
      subject: "Parola sıfırlama",
      text: `Parolanızı sıfırlamak için bağlantı (1 saat geçerli): ${link}\nBu isteği siz yapmadıysanız bu e-postayı yok sayın.`,
      html: renderEmail("Parola sıfırlama", `Parolanızı sıfırlamak için aşağıdaki bağlantıyı kullanın. Bağlantı 1 saat geçerlidir.\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`, `/sifre-sifirla?token=${token}`, " "),
      kind: "RESET_PASSWORD",
    },
  });
  if (process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST) console.info(`[geliştirme] Parola sıfırlama bağlantısı: ${link}`);
  return generic;
}

export async function resetPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  const problem = passwordProblems(password);
  if (problem) return { error: problem };
  const row = await db.userToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.type !== "RESET_PASSWORD" || row.usedAt || row.expiresAt < new Date()) return { error: "Bağlantı geçersiz veya süresi dolmuş." };
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.userToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  await destroyAllSessions(row.userId);
  await createSession(row.userId);
  redirect("/hesap?parola=guncellendi");
}

export async function changePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Oturum gerekli." };
  const full = await db.user.findUnique({ where: { id: user.id } });
  if (!full || !(await verifyPassword(String(fd.get("current") ?? ""), full.passwordHash))) return { error: "Mevcut parola hatalı." };
  const next = String(fd.get("password") ?? "");
  const problem = passwordProblems(next);
  if (problem) return { error: problem };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  await destroyAllSessions(user.id);
  await createSession(user.id);
  return { ok: true, message: "Parola güncellendi; diğer cihazlardaki oturumlar kapatıldı." };
}
