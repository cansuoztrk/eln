/**
 * Görev tipleri → işleyiciler. Her işleyici idempotenttir: aynı görev iki kez çalışsa bile
 * çift kayıt (snapshot, bildirim, e-posta) oluşmaz.
 */

import { MINUTE } from "@/lib/time";
import type { Db } from "../db";
import { evaluateFlightAlerts } from "../alerts/flight-alerts";
import { evaluatePriceAlerts } from "../alerts/price-alerts";
import { refreshFlightRoutes } from "../ingestion/flights";
import { syncRetailSource } from "../ingestion/retail";
import { sendPendingEmails } from "../notifications/mailer";
import { productsNeedingStatusRefresh, recomputeProducts } from "../pricing/recompute";
import type { JobContext } from "./context";
import { runDailyMaintenance, runWeeklyDigest, runWeeklyReport } from "./maintenance";

export type JobHandler = { label: string; timeoutMs: number; run: (db: Db, ctx: JobContext, payload: Record<string, unknown>) => Promise<unknown> };

function requireSource(ctx: JobContext): string {
  if (!ctx.dataSourceId) throw new Error("Bu görev bir veri kaynağı gerektirir");
  return ctx.dataSourceId;
}

export const jobHandlers: Record<string, JobHandler> = {
  "retail.refresh": {
    label: "Fiyat ve stok kontrolü",
    timeoutMs: 20 * MINUTE,
    run: (db, ctx) => syncRetailSource(db, requireSource(ctx), "refresh", ctx),
  },
  "retail.full-sync": {
    label: "Kapsamlı senkron",
    timeoutMs: 60 * MINUTE,
    run: (db, ctx) => syncRetailSource(db, requireSource(ctx), "full", ctx),
  },
  "flights.refresh-routes": {
    label: "Uçuş rotalarını yenile",
    timeoutMs: 30 * MINUTE,
    run: (db, ctx) => refreshFlightRoutes(db, requireSource(ctx), ctx),
  },
  "offers.mark-stale": {
    label: "Veri tazeliği kontrolü",
    timeoutMs: 10 * MINUTE,
    run: async (db, ctx) => {
      const ids = await productsNeedingStatusRefresh(db, ctx.now);
      const r = await recomputeProducts(db, ids, ctx.now);
      return { productsChecked: ids.length, ...r };
    },
  },
  "scores.recompute-all": {
    label: "Tüm fırsat puanlarını yeniden hesapla",
    timeoutMs: 60 * MINUTE,
    run: async (db, ctx) => {
      let cursor: string | undefined;
      let total = 0;
      for (;;) {
        const page = await db.product.findMany({ where: { isActive: true }, select: { id: true }, orderBy: { id: "asc" }, take: 500, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
        if (page.length === 0) break;
        await recomputeProducts(db, page.map((p) => p.id), ctx.now);
        total += page.length;
        cursor = page[page.length - 1].id;
        if (ctx.signal?.aborted) break;
      }
      const alerts = await evaluatePriceAlerts(db, "all", ctx.now);
      return { products: total, alertsTriggered: alerts.triggered };
    },
  },
  "alerts.evaluate": {
    label: "Alarmları değerlendir",
    timeoutMs: 15 * MINUTE,
    run: async (db, ctx) => {
      const p = await evaluatePriceAlerts(db, "all", ctx.now);
      const f = await evaluateFlightAlerts(db, ctx.now);
      return { price: p, flight: f };
    },
  },
  "emails.send": {
    label: "E-postaları gönder",
    timeoutMs: 5 * MINUTE,
    run: (db, ctx) => sendPendingEmails(db, 100, ctx.now),
  },
  "maintenance.daily": { label: "Günlük bakım", timeoutMs: 15 * MINUTE, run: (db, ctx) => runDailyMaintenance(db, ctx) },
  "maintenance.weekly-report": { label: "Haftalık raporlar", timeoutMs: 30 * MINUTE, run: (db, ctx) => runWeeklyReport(db, ctx) },
  "digest.weekly": { label: "Haftalık özet e-postası", timeoutMs: 30 * MINUTE, run: (db, ctx) => runWeeklyDigest(db, ctx) },
};

export function jobLabel(type: string): string {
  return jobHandlers[type]?.label ?? type;
}
