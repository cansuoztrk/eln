import { NextResponse } from "next/server";
import { normalizeText } from "@/lib/text";
import { db } from "@/server/db";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 60) ?? "";
  const nq = normalizeText(q);
  if (nq.length < 2) return NextResponse.json([]);
  const code = q.toUpperCase();
  const rows = await db.airport.findMany({
    where: { OR: [{ iata: code }, { searchText: { contains: nq } }] },
    orderBy: [{ popularity: "desc" }],
    take: 12,
  });
  const sorted = rows.sort((a, b) => Number(b.iata === code) - Number(a.iata === code));
  return NextResponse.json(
    sorted.map((a) => ({ iata: a.iata, name: a.name, city: a.city, country: a.country, isCity: a.name.includes("tüm havalimanları") || (a.cityCode === null && rows.some((r) => r.cityCode === a.iata)) })),
    { headers: { "cache-control": "public, max-age=3600" } },
  );
}
