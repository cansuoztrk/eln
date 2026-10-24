import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/brand";
import { db } from "@/server/db";

export const revalidate = 3600;

/**
 * Yalnızca değer taşıyan sayfalar: güncel teklifi olan gerçek ürünler, ürünü olan kategoriler,
 * izlenen rotalar ve yayımlanmış içerik. Test verisi ve boş sayfalar dışarıda bırakılır.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["/", "/firsatlar", "/kategoriler", "/karsilastir", "/kuponlar", "/ucak-bileti", "/populer", "/rehber", "/nasil-calisir", "/veri-kaynaklari"];
  try {
    const [products, categories, routes, content] = await Promise.all([
      db.product.findMany({ where: { isActive: true, isTestData: false, bestOfferId: { not: null } }, select: { slug: true, lastVerifiedAt: true }, take: 45000 }),
      db.category.findMany({ where: { isActive: true, products: { some: { isActive: true, isTestData: false, bestOfferId: { not: null } } } }, select: { slug: true, updatedAt: true } }),
      db.flightRoute.findMany({ where: { isActive: true, offers: { some: { isActive: true, dataSource: { isTestData: false } } } }, select: { origin: true, destination: true, updatedAt: true } }),
      db.editorialContent.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticPaths.map((p) => ({ url: siteUrl(p), changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.6 })),
      ...categories.map((c) => ({ url: siteUrl(`/kategori/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
      ...products.map((p) => ({ url: siteUrl(`/urun/${p.slug}`), lastModified: p.lastVerifiedAt ?? undefined, changeFrequency: "hourly" as const, priority: 0.8 })),
      ...routes.map((r) => ({ url: siteUrl(`/ucak-bileti/rota/${r.origin}-${r.destination}`), lastModified: r.updatedAt, changeFrequency: "daily" as const, priority: 0.5 })),
      ...content.map((c) => ({ url: siteUrl(`/rehber/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
    ];
  } catch {
    // Derleme sırasında veritabanı yoksa yalnızca statik sayfalar
    return staticPaths.map((p) => ({ url: siteUrl(p) }));
  }
}
