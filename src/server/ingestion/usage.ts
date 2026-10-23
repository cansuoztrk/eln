import type { Db } from "../db";
import type { UsageCounter } from "../integrations/http";

export function utcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function recordUsage(db: Db, dataSourceId: string, usage: UsageCounter, now = new Date()) {
  if (usage.requests === 0 && usage.errors === 0) return;
  const day = utcDay(now);
  await db.apiUsage.upsert({
    where: { dataSourceId_day: { dataSourceId, day } },
    create: { dataSourceId, day, requests: usage.requests, errors: usage.errors, rateLimited: usage.rateLimited },
    update: { requests: { increment: usage.requests }, errors: { increment: usage.errors }, rateLimited: { increment: usage.rateLimited } },
  });
}

export async function usageToday(db: Db, dataSourceId: string, now = new Date()): Promise<number> {
  const row = await db.apiUsage.findUnique({ where: { dataSourceId_day: { dataSourceId, day: utcDay(now) } } });
  return row?.requests ?? 0;
}
