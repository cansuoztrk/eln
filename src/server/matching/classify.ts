/**
 * Kaynak kategorisini platform kategorisine eşler.
 * Sıra: (1) yönetici tanımlı CategoryMapping, (2) yol içinde birebir kategori slug'ı,
 * (3) kategori anahtar kelimeleri, (4) "diger-firsatlar" (yönetici incelemesi için).
 */

import { normalizeText } from "@/lib/text";
import type { Db } from "../db";

export const FALLBACK_CATEGORY_SLUG = "diger-firsatlar";

type CategoryRow = { id: string; slug: string; keywords: string[]; parentId: string | null };
type MappingRow = { pattern: string; categoryId: string; dataSourceKey: string | null; priority: number };

type Cache = { at: number; categories: CategoryRow[]; mappings: MappingRow[] };
let cache: Cache | null = null;

export function invalidateCategoryCache() {
  cache = null;
}

async function load(db: Db): Promise<Cache> {
  if (cache && Date.now() - cache.at < 60_000) return cache;
  const [categories, mappings] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, select: { id: true, slug: true, keywords: true, parentId: true } }),
    db.categoryMapping.findMany({ select: { pattern: true, categoryId: true, dataSourceKey: true, priority: true } }),
  ]);
  cache = { at: Date.now(), categories, mappings };
  return cache;
}

/** Saf sınıflandırıcı (test edilebilir). Yalnızca yaprak (alt) kategorilere atama yapar. */
export function classifyPure(
  input: { categoryPath: string | null; title: string; sourceKey: string },
  categories: CategoryRow[],
  mappings: MappingRow[],
): { categoryId: string | null; reason: string } {
  const leafIds = new Set(categories.filter((c) => !categories.some((x) => x.parentId === c.id)).map((c) => c.id));
  const path = normalizeText(input.categoryPath);
  const title = normalizeText(input.title);

  const applicable = mappings
    .filter((m) => m.dataSourceKey === null || m.dataSourceKey === input.sourceKey)
    .sort((a, b) => b.priority - a.priority || b.pattern.length - a.pattern.length);
  for (const m of applicable) {
    const p = normalizeText(m.pattern);
    if (p && (path.includes(p) || title.includes(p))) return { categoryId: m.categoryId, reason: `eşleme: ${m.pattern}` };
  }

  if (path) {
    const tokens = new Set(path.split(/[\s>/|]+/));
    const bySlug = categories.find((c) => leafIds.has(c.id) && tokens.has(c.slug));
    if (bySlug) return { categoryId: bySlug.id, reason: `slug: ${bySlug.slug}` };
  }

  let best: { id: string; score: number; slug: string } | null = null;
  const haystack = ` ${title} ${path} `;
  for (const c of categories) {
    if (!leafIds.has(c.id) || c.keywords.length === 0) continue;
    let score = 0;
    for (const kw of c.keywords) {
      const k = normalizeText(kw);
      if (!k) continue;
      if (haystack.includes(` ${k} `) || haystack.includes(` ${k}`)) score += k.includes(" ") ? 2 : 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { id: c.id, score, slug: c.slug };
  }
  if (best) return { categoryId: best.id, reason: `anahtar kelime: ${best.slug}` };

  const fallback = categories.find((c) => c.slug === FALLBACK_CATEGORY_SLUG);
  return { categoryId: fallback?.id ?? null, reason: "sınıflandırılamadı" };
}

export async function classifyListing(db: Db, input: { categoryPath: string | null; title: string; sourceKey: string }) {
  const { categories, mappings } = await load(db);
  return classifyPure(input, categories, mappings);
}
