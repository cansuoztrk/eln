import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

/** Sağlık kontrolü: veritabanı erişimi ve worker'ın son heartbeat'i. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    const lastJob = await db.ingestionJob.findFirst({ where: { status: { in: ["SUCCEEDED", "RUNNING"] } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    return NextResponse.json({ ok: true, db: "ok", lastJobAt: lastJob?.createdAt ?? null });
  } catch (err) {
    // Ayrıntı yalnızca sunucu günlüğüne yazılır (bağlantı bilgisi dışarı sızmasın)
    console.error("[health] veritabanı erişilemiyor:", (err as Error).message);
    return NextResponse.json({ ok: false, db: "unreachable" }, { status: 503 });
  }
}
