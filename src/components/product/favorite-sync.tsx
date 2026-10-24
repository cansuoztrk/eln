"use client";

import { useEffect } from "react";
import { mergeLocalFavorites } from "@/app/actions/favorites";
import { readLocalFavorites } from "./favorite-button";

/** Girişten sonra tarayıcıdaki anonim favorileri bir kez hesaba aktarır ve yereli temizler. */
export function FavoriteSync() {
  useEffect(() => {
    const ids = readLocalFavorites();
    if (ids.length === 0) return;
    mergeLocalFavorites(ids)
      .then(() => {
        try {
          localStorage.removeItem("fr:favorites");
        } catch {}
      })
      .catch(() => {});
  }, []);
  return null;
}
