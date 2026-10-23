/**
 * Zamanlama planlayıcısı: JobSchedule tablosundaki zamanı gelmiş girdiler için kuyruğa görev
 * ekler. Planlayıcı hem sürekli çalışan worker içinden hem de HTTP cron uç noktasından
 * çağrılabilir; dedupeKey (zaman dilimi) sayesinde birden fazla planlayıcı aynı anda çalışsa
 * da aynı dilim için tek görev oluşur.
 */

import { MINUTE } from "@/lib/time";
import type { Db } from "../db";
import { enqueueJob } from "./queue";

export function slotKey(now: Date, intervalMinutes: number): string {
  const slot = Math.floor(now.getTime() / (intervalMinutes * MINUTE)) * intervalMinutes * MINUTE;
  return new Date(slot).toISOString().slice(0, 16);
}

export async function planDueJobs(db: Db, now = new Date()): Promise<{ enqueued: number; checked: number }> {
  const due = await db.jobSchedule.findMany({
    where: { isEnabled: true, nextRunAt: { lte: now } },
    include: { dataSource: { select: { isEnabled: true, status: true } } },
  });
  let enqueued = 0;
  for (const s of due) {
    const nextRunAt = new Date(now.getTime() + s.intervalMinutes * MINUTE);
    // İyimser kilit: yalnızca bu planlayıcı nextRunAt'i ilerletebildiyse görev ekler.
    const claimed = await db.jobSchedule.updateMany({ where: { id: s.id, nextRunAt: s.nextRunAt }, data: { nextRunAt, lastEnqueuedAt: now } });
    if (claimed.count === 0) continue;
    if (s.dataSource && (!s.dataSource.isEnabled || s.dataSource.status === "DISABLED")) continue;
    const id = await enqueueJob(db, {
      type: s.type,
      dataSourceId: s.dataSourceId,
      payload: (s.payload ?? {}) as Record<string, unknown>,
      dedupeKey: `${s.key}:${slotKey(now, s.intervalMinutes)}`,
      trigger: "SCHEDULE",
      priority: s.type.startsWith("emails.") ? 3 : 0,
    });
    if (id) enqueued++;
  }
  return { enqueued, checked: due.length };
}

export const GLOBAL_SCHEDULES: { key: string; type: string; intervalMinutes: number; description: string }[] = [
  { key: "offers.mark-stale", type: "offers.mark-stale", intervalMinutes: 15, description: "Tazelik penceresi aşılan teklifleri 'yeniden doğrulanıyor/eski' durumuna alır" },
  { key: "alerts.evaluate", type: "alerts.evaluate", intervalMinutes: 60, description: "Fiyat ve uçuş alarmlarının güvenlik ağı değerlendirmesi" },
  { key: "emails.send", type: "emails.send", intervalMinutes: 5, description: "Bekleyen e-postaları gönderir" },
  { key: "scores.recompute-all", type: "scores.recompute-all", intervalMinutes: 1440, description: "Tüm ürünlerin fırsat puanını ve istatistiklerini yeniden hesaplar" },
  { key: "maintenance.daily", type: "maintenance.daily", intervalMinutes: 1440, description: "Süresi dolan kuponlar, eski oturumlar, eski uçuş teklifleri ve günlük temizliği" },
  { key: "maintenance.weekly-report", type: "maintenance.weekly-report", intervalMinutes: 10080, description: "Veri kalitesi, tazelik ve kategori trend raporları" },
  { key: "digest.weekly", type: "digest.weekly", intervalMinutes: 10080, description: "Abone kullanıcılara haftalık doğrulanmış fırsat özeti" },
];

/** Veri kaynakları ve genel bakım görevleri için zamanlama kayıtlarını oluşturur/günceller. */
export async function ensureSchedules(db: Db): Promise<void> {
  for (const g of GLOBAL_SCHEDULES) {
    await db.jobSchedule.upsert({
      where: { key: g.key },
      create: { key: g.key, type: g.type, intervalMinutes: g.intervalMinutes, description: g.description },
      update: { description: g.description },
    });
  }
  const sources = await db.dataSource.findMany();
  for (const s of sources) {
    const defs =
      s.kind === "RETAIL"
        ? [
            { key: `retail.refresh:${s.key}`, type: "retail.refresh", interval: s.refreshIntervalMinutes, description: `${s.name}: fiyat ve stok kontrolü` },
            { key: `retail.full-sync:${s.key}`, type: "retail.full-sync", interval: s.fullSyncIntervalMinutes, description: `${s.name}: kapsamlı senkron ve yeni ürün keşfi` },
          ]
        : s.kind === "FLIGHT"
          ? [{ key: `flights.refresh-routes:${s.key}`, type: "flights.refresh-routes", interval: s.refreshIntervalMinutes, description: `${s.name}: rota fiyatlarını yenile` }]
          : [];
    for (const d of defs) {
      await db.jobSchedule.upsert({
        where: { key: d.key },
        create: { key: d.key, type: d.type, dataSourceId: s.id, intervalMinutes: d.interval, description: d.description },
        update: { intervalMinutes: d.interval, description: d.description, dataSourceId: s.id },
      });
    }
  }
}
