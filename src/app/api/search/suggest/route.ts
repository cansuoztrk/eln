import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeText } from "@/lib/text";
import { db } from "@/server/db";
import { searchProductIds, visibilityWhere } from "@/server/catalog/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";

export async function GET(req: Request) {
  const h = await headers();
  const rl = rateLimit(`suggest:${clientIp(h)}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Çok fazla istek" }, { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } });
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const nq = normalizeText(q);
  if (nq.length < 2) return NextResponse.json({ products: [], categories: [], brands: [] });

  const ids = (await searchProductIds(q, 30)).slice(0, 30);
  const [products, categories, brands] = await Promise.all([
    db.product.findMany({
      where: { AND: [visibilityWhere(), { id: { in: ids } }] },
      select: { id: true, slug: true, title: true, bestTotalMinor: true, bestCurrency: true, isTestData: true, brand: { select: { name: true } }, category: { select: { icon: true } } },
    }),
    db.category.findMany({ where: { isActive: true, OR: [{ name: { contains: q, mode: "insensitive" } }, { keywords: { has: nq } }, { slug: { contains: nq.replace(/\s+/g, "-") } }] }, select: { slug: true, name: true, icon: true }, take: 4 }),
    db.brand.findMany({ where: { OR: [{ name: { startsWith: q, mode: "insensitive" } }, { aliases: { has: nq } }] }, select: { slug: true, name: true }, take: 3 }),
  ]);
  const pos = new Map(ids.map((id, i) => [id, i]));
  return NextResponse.json(
    {
      products: products
        .sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0))
        .slice(0, 6)
        .map((p) => ({ slug: p.slug, title: p.title, brand: p.brand?.name ?? null, priceMinor: p.bestTotalMinor, currency: p.bestCurrency, icon: p.category.icon, isTestData: p.isTestData })),
      categories,
      brands,
    },
    { headers: { "cache-control": "private, max-age=30" } },
  );
}
