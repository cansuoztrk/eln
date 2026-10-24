"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { evaluateFlightAlerts } from "@/server/alerts/flight-alerts";
import { parsePriceToMinor } from "@/lib/money";

export type FlightFormState = { ok?: boolean; error?: string; message?: string };

const iata = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);

export async function createFlightAlert(_: FlightFormState, fd: FormData): Promise<FlightFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Uçuş alarmı için giriş yapmalısınız." };
  const parsed = z
    .object({ origin: iata, destination: iata, departFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), departTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), target: z.string().min(1).max(20), directOnly: z.enum(["on"]).optional() })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Form geçersiz." };
  const from = new Date(`${parsed.data.departFrom}T00:00:00Z`);
  const to = new Date(`${parsed.data.departTo}T00:00:00Z`);
  if (to < from) return { error: "Tarih aralığı geçersiz." };
  if (to.getTime() - from.getTime() > 120 * 86400000) return { error: "Tarih aralığı en fazla 120 gün olabilir." };
  const targetMinor = parsePriceToMinor(parsed.data.target, "TRY");
  if (!targetMinor) return { error: "Geçerli bir hedef fiyat girin." };
  if ((await db.flightAlert.count({ where: { userId: user.id, isActive: true } })) >= 30) return { error: "En fazla 30 aktif uçuş alarmı kurabilirsiniz." };
  await db.flightAlert.create({
    data: { userId: user.id, origin: parsed.data.origin, destination: parsed.data.destination, departFrom: from, departTo: to, targetMinor, directOnly: Boolean(parsed.data.directOnly), oneWay: true },
  });
  await db.favoriteRoute.upsert({
    where: { userId_origin_destination: { userId: user.id, origin: parsed.data.origin, destination: parsed.data.destination } },
    create: { userId: user.id, origin: parsed.data.origin, destination: parsed.data.destination },
    update: {},
  });
  await evaluateFlightAlerts(db);
  refresh();
  return { ok: true, message: "Uçuş alarmı kuruldu. Rota fiyatları her güncellendiğinde kontrol edilecek." };
}

export async function toggleFlightAlert(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const a = await db.flightAlert.findUnique({ where: { id } });
  if (!a || a.userId !== user.id) return;
  await db.flightAlert.update({ where: { id }, data: { isActive: !a.isActive, state: "ARMED" } });
  refresh();
}

export async function deleteFlightAlert(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.flightAlert.deleteMany({ where: { id, userId: user.id } });
  refresh();
}

export async function toggleFavoriteRoute(origin: string, destination: string) {
  const user = await getCurrentUser();
  if (!user || !iata.safeParse(origin).success || !iata.safeParse(destination).success) return;
  const existing = await db.favoriteRoute.findUnique({ where: { userId_origin_destination: { userId: user.id, origin, destination } } });
  if (existing) await db.favoriteRoute.delete({ where: { id: existing.id } });
  else await db.favoriteRoute.create({ data: { userId: user.id, origin, destination } });
  refresh();
}
