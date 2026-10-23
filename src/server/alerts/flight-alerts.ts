/**
 * Uçuş alarmları: rota + tarih aralığı + hedef fiyat. Yalnızca süresi dolmamış, son 24 saatte
 * kontrol edilmiş tekliflerle değerlendirilir. Tetikleme kuralları fiyat alarmlarıyla aynıdır
 * (decideAlert): aynı düşüş için tekrar bildirim yok, histerezisle yeniden kurulur.
 */

import { formatMoney } from "@/lib/money";
import { DAY, formatShortDate } from "@/lib/time";
import type { Db } from "../db";
import { createNotification } from "../notifications/service";
import { includeTestData } from "../visibility";
import { decideAlert } from "./price-alerts";

export async function evaluateFlightAlerts(db: Db, now = new Date()): Promise<{ evaluated: number; triggered: number }> {
  const alerts = await db.flightAlert.findMany({ where: { isActive: true, departTo: { gte: new Date(now.getTime() - DAY) } }, include: { user: { select: { email: true, emailAlertsEnabled: true } } } });
  let triggered = 0;
  for (const a of alerts) {
    const best = await db.flightOffer.findFirst({
      where: {
        isActive: true,
        expiresAt: { gt: now },
        checkedAt: { gte: new Date(now.getTime() - DAY) },
        currency: a.currency,
        oneWay: a.oneWay,
        OR: [{ origin: a.origin }, { originAirport: a.origin }],
        AND: [{ OR: [{ destination: a.destination }, { destinationAirport: a.destination }] }],
        departAt: { gte: a.departFrom, lt: new Date(a.departTo.getTime() + DAY) },
        ...(a.directOnly ? { stops: 0 } : {}),
        ...(includeTestData() ? {} : { dataSource: { isTestData: false } }),
      },
      orderBy: { priceMinor: "asc" },
      select: { id: true, priceMinor: true, departAt: true, priceKind: true },
    });
    const decision = decideAlert(a, best?.priceMinor ?? null, now);
    if (decision.action === "TRIGGER" && best) {
      const count = a.triggerCount + 1;
      const price = formatMoney(best.priceMinor, a.currency);
      const created = await db.$transaction(async (tx) => {
        const u = await tx.flightAlert.updateMany({
          where: { id: a.id, triggerCount: a.triggerCount },
          data: { state: "TRIGGERED", triggerCount: count, lastTriggeredAt: now, lastTriggeredMinor: best.priceMinor, lastEvaluatedAt: now },
        });
        if (u.count === 0) return false;
        return createNotification(tx, {
          userId: a.userId,
          type: "FLIGHT_ALERT",
          title: `${a.origin} → ${a.destination} hedef fiyatınızın altında`,
          body: `${formatShortDate(best.departAt)} kalkışlı uçuş ${price}${best.priceKind === "CACHED_INDICATIVE" ? " (gösterge fiyat; son 48 saatte bulunmuş, satış sayfasında değişebilir)" : ""}. Hedefiniz: ${formatMoney(a.targetMinor, a.currency)}.`,
          link: `/ucak-bileti/ara?from=${a.origin}&to=${a.destination}&depart=${best.departAt.toISOString().slice(0, 10)}`,
          data: { flightAlertId: a.id, flightOfferId: best.id },
          dedupeKey: `flight-alert:${a.id}:${count}`,
          email: a.user.emailAlertsEnabled ? { to: a.user.email, subject: `Uçuş alarmı: ${a.origin} → ${a.destination} ${price}` } : null,
        });
      });
      if (created) triggered++;
    } else if (decision.action === "REARM") {
      await db.flightAlert.update({ where: { id: a.id }, data: { state: "ARMED", lastEvaluatedAt: now } });
    } else {
      await db.flightAlert.update({ where: { id: a.id }, data: { lastEvaluatedAt: now } });
    }
  }
  return { evaluated: alerts.length, triggered };
}
