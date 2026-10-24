import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeader } from "@/components/ui/section";
import { DAY } from "@/lib/time";
import { getCurrentUser } from "@/server/auth/session";
import { productCardsByIds, productCardsWhere } from "@/server/catalog/queries";
import { getFavoriteIds } from "@/server/catalog/user";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Popüler fırsatlar",
  description: "Son 7 günde en çok ilgi gören ve en çok takip edilen ürünler. Popülerlik fırsat kalitesinin tek ölçütü değildir.",
  alternates: { canonical: "/populer" },
};

export default async function PopularPage() {
  const since = new Date(Date.now() - 7 * DAY);
  const [user, popular, tracked, categoryClicks] = await Promise.all([
    getCurrentUser(),
    productCardsWhere({ bestOfferId: { not: null }, popularity: { gt: 0 } }, [{ popularity: "desc" }], 12),
    db.priceAlert.groupBy({ by: ["productId"], where: { isActive: true }, _count: true, orderBy: { _count: { productId: "desc" } }, take: 8 }),
    db.clickEvent.groupBy({ by: ["categoryId"], where: { createdAt: { gte: since }, categoryId: { not: null }, isSponsored: false }, _count: true, orderBy: { _count: { categoryId: "desc" } }, take: 8 }),
  ]);
  const favs = user ? await getFavoriteIds(user.id) : [];
  const trackedCards = await productCardsByIds(tracked.map((t) => t.productId));
  const cats = await db.category.findMany({ where: { id: { in: categoryClicks.map((c) => c.categoryId!) } }, select: { id: true, slug: true, name: true, icon: true } });

  return (
    <>
      <PageHeader eyebrow="Popüler" title="Popüler fırsatlar" description="Kullanıcıların son 7 günde en çok tıkladığı ve favorilediği ürünler. Tıklama sayısı tek başına fırsat kalitesi değildir; fırsat puanına ayrıca bakın. Sponsorlu tıklamalar sayılmaz." />
      <div className="container-page space-y-14 py-10">
        <section>
          <SectionHeader title="En çok ilgi görenler" />
          {popular.length ? (
            <ProductGrid items={popular} loggedIn={Boolean(user)} favoriteIds={favs} />
          ) : (
            <EmptyState icon="trendDown" title="Henüz yeterli etkileşim verisi yok">
              Popülerlik yalnızca gerçek ve anonim tıklama/favori verilerinden hesaplanır. Veri biriktikçe bu liste oluşur.
            </EmptyState>
          )}
        </section>
        {trackedCards.length ? (
          <section>
            <SectionHeader title="En çok fiyat alarmı kurulanlar" description="Kullanıcıların hedef fiyat beklediği ürünler." />
            <ProductGrid items={trackedCards} loggedIn={Boolean(user)} favoriteIds={favs} />
          </section>
        ) : null}
        {cats.length ? (
          <section>
            <SectionHeader title="Son 7 günde en çok ilgi gören kategoriler" />
            <ol className="grid gap-2 md:grid-cols-2">
              {categoryClicks.map((c, i) => {
                const cat = cats.find((x) => x.id === c.categoryId);
                if (!cat) return null;
                return (
                  <li key={cat.id}>
                    <Link href={`/kategori/${cat.slug}`} className="card flex items-center gap-3 p-3.5 hover:border-line-strong">
                      <span className="w-6 font-mono text-[13px] text-ink-3">{i + 1}</span>
                      <Icon name={cat.icon ?? "grid"} className="size-5 text-ink-3" />
                      <span className="flex-1 font-medium">{cat.name}</span>
                      <span className="font-mono text-[12px] text-ink-3">{c._count} tıklama</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}
      </div>
    </>
  );
}
