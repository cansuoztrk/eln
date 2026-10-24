import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";

/** KVKK: kişisel verilerin makine tarafından okunabilir kopyası. */
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  const data = await db.user.findUnique({
    where: { id: u.id },
    select: {
      email: true,
      name: true,
      role: true,
      createdAt: true,
      kvkkAcceptedAt: true,
      emailAlertsEnabled: true,
      digestOptIn: true,
      digestOptInAt: true,
      lastLoginAt: true,
      favorites: { select: { createdAt: true, product: { select: { title: true, slug: true } } } },
      priceAlerts: { select: { targetMinor: true, currency: true, isActive: true, createdAt: true, product: { select: { title: true } } } },
      flightAlerts: { select: { origin: true, destination: true, departFrom: true, departTo: true, targetMinor: true, currency: true, isActive: true } },
      favoriteRoutes: { select: { origin: true, destination: true } },
      savedSearches: { select: { name: true, query: true, createdAt: true } },
      interests: { select: { category: { select: { name: true } } } },
      recentlyViewed: { select: { viewedAt: true, product: { select: { title: true } } } },
      notifications: { select: { title: true, body: true, createdAt: true, readAt: true } },
      sessions: { select: { createdAt: true, lastSeenAt: true, userAgent: true } },
    },
  });
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="firsatradar-verilerim.json"`, "cache-control": "no-store" },
  });
}
