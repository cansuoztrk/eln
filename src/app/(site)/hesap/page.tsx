import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section";
import { requireUser } from "@/server/auth/guards";
import { productCardsByIds, productCardsWhere } from "@/server/catalog/queries";
import { getFavoriteIds } from "@/server/catalog/user";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false } };

export default async function AccountHome() {
  const user = await requireUser("/hesap");
  const [interests, recent, alertCount, unread, favs] = await Promise.all([
    db.userInterest.findMany({ where: { userId: user.id }, select: { categoryId: true } }),
    db.recentlyViewed.findMany({ where: { userId: user.id }, orderBy: { viewedAt: "desc" }, take: 4, select: { productId: true } }),
    db.priceAlert.count({ where: { userId: user.id, isActive: true } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    getFavoriteIds(user.id),
  ]);
  // Kişisel akış: ilgi alanları → yoksa favori/görüntülenen ürünlerin kategorileri. Rastgele değil, puana göre sıralı.
  let categoryIds = interests.map((i) => i.categoryId);
  if (categoryIds.length === 0) {
    const seed = await db.product.findMany({ where: { id: { in: [...favs, ...recent.map((r) => r.productId)] } }, select: { categoryId: true } });
    categoryIds = [...new Set(seed.map((s) => s.categoryId))];
  }
  const [feed, recentCards] = await Promise.all([
    categoryIds.length ? productCardsWhere({ categoryId: { in: categoryIds }, bestOfferId: { not: null } }, [{ dealScore: { sort: "desc", nulls: "last" } }], 8) : Promise.resolve([]),
    productCardsByIds(recent.map((r) => r.productId)),
  ]);

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["/hesap/favoriler", "Favori", favs.length],
          ["/hesap/alarmlar", "Aktif alarm", alertCount],
          ["/hesap/bildirimler", "Okunmamış bildirim", unread],
        ].map(([href, label, n]) => (
          <Link key={href as string} href={href as string} className="card p-4 hover:border-line-strong">
            <p className="text-[12.5px] text-ink-3">{label}</p>
            <p className="font-display text-[26px] font-[680] tabular">{n}</p>
          </Link>
        ))}
      </div>
      <section>
        <SectionHeader title="Sizin için fırsatlar" description={interests.length ? "İlgi alanlarınızdaki en yüksek puanlı güncel teklifler." : "Favori ve incelediğiniz ürünlerin kategorilerine göre. İlgi alanlarınızı Ayarlar'dan seçebilirsiniz."} href="/hesap/ayarlar#ilgi" linkLabel="İlgi alanlarını düzenle" />
        {feed.length ? (
          <ProductGrid items={feed} loggedIn favoriteIds={favs} layout="sidebar" />
        ) : (
          <EmptyState title="Akışınız henüz boş">İlgi alanı seçin veya ürünleri favorilere ekleyin; size uygun fırsatları burada sıralayalım.</EmptyState>
        )}
      </section>
      {recentCards.length ? (
        <section>
          <SectionHeader title="Son görüntülenenler" />
          <ProductGrid items={recentCards} loggedIn favoriteIds={favs} layout="sidebar" />
        </section>
      ) : null}
    </div>
  );
}
