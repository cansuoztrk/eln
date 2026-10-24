"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { verifyPassword } from "@/server/auth/password";
import { destroySession, getCurrentUser } from "@/server/auth/session";

export type FormState = { ok?: boolean; error?: string; message?: string };

async function me() {
  const u = await getCurrentUser();
  if (!u) throw new Error("Oturum gerekli");
  return u;
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const u = await me();
  const name = z.string().trim().max(80).safeParse(fd.get("name") ?? "");
  if (!name.success) return { error: "Ad en fazla 80 karakter olabilir." };
  await db.user.update({ where: { id: u.id }, data: { name: name.data || null } });
  refresh();
  return { ok: true, message: "Profil güncellendi." };
}

export async function updatePreferences(_: FormState, fd: FormData): Promise<FormState> {
  const u = await me();
  const digest = fd.get("digestOptIn") === "on";
  const current = await db.user.findUnique({ where: { id: u.id }, select: { digestOptIn: true } });
  await db.user.update({
    where: { id: u.id },
    data: {
      emailAlertsEnabled: fd.get("emailAlertsEnabled") === "on",
      digestOptIn: digest,
      ...(digest && !current?.digestOptIn ? { digestOptInAt: new Date() } : {}),
    },
  });
  refresh();
  return { ok: true, message: "Bildirim tercihleri kaydedildi." };
}

export async function updateInterests(_: FormState, fd: FormData): Promise<FormState> {
  const u = await me();
  const ids = z.array(z.string().max(40)).max(40).safeParse(fd.getAll("category"));
  if (!ids.success) return { error: "Geçersiz seçim." };
  const valid = await db.category.findMany({ where: { id: { in: ids.data } }, select: { id: true } });
  await db.$transaction([
    db.userInterest.deleteMany({ where: { userId: u.id } }),
    db.userInterest.createMany({ data: valid.map((c) => ({ userId: u.id, categoryId: c.id })) }),
  ]);
  refresh();
  return { ok: true, message: "İlgi alanlarınız kaydedildi; akışınız buna göre şekillenir." };
}

export async function markAllNotificationsRead() {
  const u = await me();
  await db.notification.updateMany({ where: { userId: u.id, readAt: null }, data: { readAt: new Date() } });
  refresh();
}

export async function saveSearch(_: FormState, fd: FormData): Promise<FormState> {
  const u = await me();
  const parsed = z.object({ name: z.string().trim().min(1).max(80), query: z.string().max(1000), kind: z.enum(["PRODUCT", "FLIGHT"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Arama kaydedilemedi." };
  if (!parsed.data.query.startsWith("/")) return { error: "Geçersiz arama." };
  if ((await db.savedSearch.count({ where: { userId: u.id } })) >= 50) return { error: "En fazla 50 arama kaydedebilirsiniz." };
  await db.savedSearch.create({ data: { userId: u.id, ...parsed.data } });
  refresh();
  return { ok: true, message: "Arama kaydedildi." };
}

export async function deleteSavedSearch(id: string) {
  const u = await me();
  await db.savedSearch.deleteMany({ where: { id, userId: u.id } });
  refresh();
}

export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const u = await me();
  const full = await db.user.findUnique({ where: { id: u.id } });
  if (!full || !(await verifyPassword(String(fd.get("password") ?? ""), full.passwordHash))) return { error: "Parola hatalı." };
  if (fd.get("confirm") !== "SİL") return { error: "Onay için büyük harflerle SİL yazın." };
  // İlişkili tüm kişisel veriler (oturum, favori, alarm, bildirim...) cascade ile silinir.
  // E-posta kuyruğu kullanıcıya bağlı olmadığı için adrese göre ayrıca silinir.
  await db.$transaction([db.emailOutbox.deleteMany({ where: { toEmail: full.email } }), db.user.delete({ where: { id: u.id } })]);
  await destroySession();
  redirect("/?hesap=silindi");
}
