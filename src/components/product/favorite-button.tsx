"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";

const KEY = "fr:favorites";

export function readLocalFavorites(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("fr:favorites"));
  } catch {
    /* gizli pencere vb. */
  }
}

/**
 * Favori düğmesi. Giriş yapmış kullanıcıda sunucuya kaydeder; anonim kullanıcıda tarayıcıda
 * saklar (hesap gerekmeden kullanılabilir) ve girişten sonra hesaba aktarılır.
 */
export function FavoriteButton({ productId, initial = false, loggedIn, className, size = "md" }: { productId: string; initial?: boolean; loggedIn: boolean; className?: string; size?: "sm" | "md" }) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (loggedIn) return;
    const sync = () => setFav(readLocalFavorites().includes(productId));
    sync();
    window.addEventListener("fr:favorites", sync);
    return () => window.removeEventListener("fr:favorites", sync);
  }, [loggedIn, productId]);

  function onClick() {
    if (!loggedIn) {
      const list = readLocalFavorites();
      const next = list.includes(productId) ? list.filter((x) => x !== productId) : [productId, ...list];
      writeLocalFavorites(next);
      setFav(next.includes(productId));
      return;
    }
    const optimistic = !fav;
    setFav(optimistic);
    start(async () => {
      const r = await toggleFavorite(productId);
      if (!r.ok) setFav(!optimistic);
      else if (typeof r.favorited === "boolean") setFav(r.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
      title={fav ? "Favorilerden çıkar" : loggedIn ? "Favorilere ekle" : "Favorilere ekle (bu tarayıcıda saklanır)"}
      className={cn(
        "grid place-items-center rounded-full border border-line bg-surface/90 backdrop-blur transition-colors hover:border-line-strong",
        size === "sm" ? "size-8" : "size-9",
        fav ? "text-bad" : "text-ink-3 hover:text-ink",
        className,
      )}
    >
      <Icon name={fav ? "heartFill" : "heart"} className={size === "sm" ? "size-4" : "size-[18px]"} />
    </button>
  );
}
