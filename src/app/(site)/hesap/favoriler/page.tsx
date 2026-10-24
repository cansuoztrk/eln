import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/server/auth/guards";
import { productCardsByIds } from "@/server/catalog/queries";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Favorilerim", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await requireUser("/hesap/favoriler");
  const favs = await db.userFavorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { productId: true } });
  const ids = favs.map((f) => f.productId);
  const cards = await productCardsByIds(ids);
  return (
    <section>
      <h2 className="mb-4 font-display text-[20px] font-[650]">Favorilerim</h2>
      {cards.length ? (
        <ProductGrid items={cards} loggedIn favoriteIds={ids} layout="sidebar" />
      ) : (
        <EmptyState icon="heart" title="Henüz favori yok">
          Ürün kartlarındaki kalp simgesiyle favori ekleyin. Fiyat değişimlerini buradan takip edebilirsiniz.
        </EmptyState>
      )}
    </section>
  );
}
