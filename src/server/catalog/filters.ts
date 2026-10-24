/**
 * Ürün listesi filtrelerinin URL ↔ nesne dönüşümü. Tüm filtre durumu URL'de tutulur; böylece
 * filtrelenmiş bir liste bağlantı olarak paylaşılabilir. Girdi doğrulaması zod ile yapılır;
 * geçersiz değerler sessizce yok sayılır.
 */
import { z } from "zod";

import { LABEL_FILTERS, SORTS, type SortKey } from "@/lib/listing-constants";

export { LABEL_FILTERS, SORTS, type SortKey };

const list = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? [] : (Array.isArray(v) ? v : v.split(",")).map((s) => s.trim()).filter((s) => /^[a-z0-9\-_.]{1,80}$/i.test(s)).slice(0, 20)));

const money = z
  .string()
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const n = Number(v.replace(/[^\d.,]/g, "").replace(",", "."));
    return Number.isFinite(n) && n >= 0 && n < 10_000_000 ? Math.round(n * 100) : undefined;
  });

const intIn = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => {
      const n = v === undefined ? NaN : Number(v);
      return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
    });

export const filterSchema = z.object({
  q: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim().slice(0, 120) : undefined)),
  kategori: z.string().regex(/^[a-z0-9-]{1,80}$/).optional().catch(undefined),
  marka: list,
  magaza: list,
  min: money,
  max: money,
  indirim: intIn(1, 90),
  stok: z.enum(["1"]).optional().catch(undefined),
  kupon: z.enum(["1"]).optional().catch(undefined),
  taze: intIn(1, 168),
  etiket: z.enum(Object.keys(LABEL_FILTERS) as [keyof typeof LABEL_FILTERS, ...(keyof typeof LABEL_FILTERS)[]]).optional().catch(undefined),
  sirala: z.enum(Object.keys(SORTS) as [SortKey, ...SortKey[]]).optional().catch(undefined),
  sayfa: intIn(1, 500),
  // kategoriye özel nitelikler: n_<anahtar>=değer (ör. n_connectivity=kablosuz, n_Panel=IPS)
});

export type ProductFilters = z.infer<typeof filterSchema> & { attrs: Record<string, string> };

export function parseFilters(sp: Record<string, string | string[] | undefined>): ProductFilters {
  const parsed = filterSchema.safeParse(sp);
  const base = parsed.success ? parsed.data : filterSchema.parse({});
  const attrs: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (!k.startsWith("n_")) continue;
    const key = k.slice(2);
    const val = Array.isArray(v) ? v[0] : v;
    if (/^[\p{L}\p{N} _.-]{1,40}$/u.test(key) && val && val.length <= 80) attrs[key] = val;
  }
  return { ...base, attrs };
}

/** Filtreleri URL sorgu dizesine çevirir (değişiklik uygulanarak). */
export function filtersToQuery(f: Partial<ProductFilters>, patch: Record<string, string | string[] | null | undefined> = {}): string {
  const params = new URLSearchParams();
  const set = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return;
    params.set(k, Array.isArray(v) ? v.join(",") : String(v));
  };
  set("q", f.q);
  set("kategori", f.kategori);
  set("marka", f.marka);
  set("magaza", f.magaza);
  set("min", f.min !== undefined ? String(f.min / 100) : undefined);
  set("max", f.max !== undefined ? String(f.max / 100) : undefined);
  set("indirim", f.indirim);
  set("stok", f.stok);
  set("kupon", f.kupon);
  set("taze", f.taze);
  set("etiket", f.etiket);
  set("sirala", f.sirala);
  for (const [k, v] of Object.entries(f.attrs ?? {})) set(`n_${k}`, v);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) params.delete(k);
    else params.set(k, Array.isArray(v) ? v.join(",") : v);
  }
  if (!("sayfa" in patch)) params.delete("sayfa");
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function activeFilterCount(f: ProductFilters): number {
  return (
    f.marka.length +
    f.magaza.length +
    (f.min !== undefined ? 1 : 0) +
    (f.max !== undefined ? 1 : 0) +
    (f.indirim ? 1 : 0) +
    (f.stok ? 1 : 0) +
    (f.kupon ? 1 : 0) +
    (f.taze ? 1 : 0) +
    (f.etiket ? 1 : 0) +
    Object.keys(f.attrs).length
  );
}
