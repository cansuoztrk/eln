import type { Prisma } from "@/generated/prisma/client";
import type { Db } from "./db";

/** Yönetici değişikliklerini (önce/sonra) kayıt altına alır. */
export async function audit(
  db: Db | Prisma.TransactionClient,
  entry: { actorId: string | null; action: string; entityType: string; entityId?: string | null; before?: unknown; after?: unknown; reason?: string | null },
) {
  await db.adminAuditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: entry.before === undefined ? undefined : (JSON.parse(JSON.stringify(entry.before)) as Prisma.InputJsonValue),
      after: entry.after === undefined ? undefined : (JSON.parse(JSON.stringify(entry.after)) as Prisma.InputJsonValue),
      reason: entry.reason ?? null,
    },
  });
}
