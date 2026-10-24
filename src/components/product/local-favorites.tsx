"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductCardData } from "@/server/catalog/queries";
import { EmptyState } from "../ui/empty-state";
import { readLocalFavorites } from "./favorite-button";
import { ProductCard } from "./product-card";

/** Hesap olmadan tarayıcıda saklanan favoriler. */
export function LocalFavorites() {
  const [items, setItems] = useState<ProductCardData[] | null>(null);
  useEffect(() => {
    const load = () => {
      const ids = readLocalFavorites();
      if (ids.length === 0) return setItems([]);
      fetch(`/api/products?ids=${ids.join(",")}`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setItems)
        .catch(() => setItems([]));
    };
    load();
    window.addEventListener("fr:favorites", load);
    return () => window.removeEventListener("fr:favorites", load);
  }, []);
  if (items === null) return <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-80" />)}</div>;
  if (items.length === 0)
    return (
      <EmptyState icon="heart" title="Bu tarayıcıda kayıtlı favori yok">
        Ürün kartlarındaki kalp simgesiyle favori ekleyebilirsiniz.{" "}
        <Link href="/kayit" className="text-brand-ink underline">
          Hesap oluşturursanız
        </Link>{" "}
        favorileriniz tüm cihazlarınızda görünür ve fiyat alarmı kurabilirsiniz.
      </EmptyState>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} loggedIn={false} />
      ))}
    </div>
  );
}
