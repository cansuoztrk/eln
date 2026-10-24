import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { tick } from "@/server/jobs/runner";

/**
 * Platform zamanlayıcıları (ör. Vercel Cron, GitHub Actions, sistem cron'u) için uç nokta.
 * Authorization: Bearer <CRON_SECRET>. Planlayıcıyı çalıştırır ve süre bütçesi içinde kuyruktaki
 * görevleri işler. Sürekli çalışan worker kullanılıyorsa bu uç nokta gerekmez.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const budgetMs = Math.min(Number(new URL(req.url).searchParams.get("budget") ?? 45_000), 280_000);
  const result = await tick(db, { workerId: `cron-http:${process.pid}`, budgetMs });
  return NextResponse.json({ ok: true, planned: result.planned, reaped: result.reaped, ran: result.outcomes });
}

export const GET = handle;
export const POST = handle;
