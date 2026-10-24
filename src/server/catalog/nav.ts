import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "../db";

export const getNavCategories = unstable_cache(
  async () => {
    const parents = await db.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, icon: true, description: true, children: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, icon: true } } },
    });
    return parents.map((p) => ({ ...p, children: p.children.filter((c) => c.slug !== "diger-firsatlar") }));
  },
  ["nav-categories"],
  { revalidate: 300, tags: ["categories"] },
);

const DEFAULT_POPULAR = ["oyuncu faresi", "mekanik klavye", "144 hz monitör", "nvme ssd", "kablosuz kulaklık", "robot süpürge"];

/** Popüler aramalar: anonim, normalize sorgu sayımlarından; yeterli veri yoksa sabit öneriler. */
export const getPopularSearches = unstable_cache(
  async () => {
    const rows = await db.popularSearch.findMany({ where: { count: { gte: 3 } }, orderBy: { count: "desc" }, take: 8 });
    return rows.length >= 4 ? rows.map((r) => r.query) : DEFAULT_POPULAR;
  },
  ["popular-searches"],
  { revalidate: 600 },
);
