import Link from "next/link";
import type { ProductFilters } from "@/server/catalog/filters";
import { activeFilterCount, filtersToQuery, LABEL_FILTERS } from "@/server/catalog/filters";
import { facetsFor, listProducts } from "@/server/catalog/queries";
import { getCurrentUser } from "@/server/auth/session";
import { getFavoriteIds } from "@/server/catalog/user";
import { DEAL_LABELS } from "@/lib/deal-labels";
import { formatMoney } from "@/lib/money";
import { Icon } from "../icons";
import { ProductGrid } from "../product/product-card";
import { EmptyState } from "../ui/empty-state";
import { FilterDrawer } from "./filter-drawer";
import { FilterPanel } from "./filter-panel";
import { Pagination } from "./pagination";
import { SortSelect } from "./sort-select";
import { SaveSearchButton } from "../account/save-search-button";

/**
 * Ortak ürün listesi: fırsatlar, kategori, arama ve mağaza sayfaları bunu kullanır.
 * `fixed`: sayfanın kendisinin belirlediği ve filtre panelinde değiştirilemeyen parametreler.
 */
export async function ProductListing({
  basePath,
  f,
  fixed = {},
  facetCategory,
  hideCategoryFilter = false,
  onlyCurrent,
  emptyHint,
}: {
  basePath: string;
  f: ProductFilters;
  fixed?: Record<string, string>;
  facetCategory?: string;
  hideCategoryFilter?: boolean;
  onlyCurrent?: boolean;
  emptyHint?: React.ReactNode;
}) {
  const [result, facets, user] = await Promise.all([listProducts(f, { onlyCurrent }), facetsFor(facetCategory ?? f.kategori), getCurrentUser()]);
  const favs = user ? await getFavoriteIds(user.id) : [];
  const count = activeFilterCount(f);
  const qs = (patch: Record<string, string | string[] | null>) => {
    const s = filtersToQuery(hideCategoryFilter ? { ...f, kategori: undefined } : f, patch);
    const params = new URLSearchParams(s.replace(/^\?/, ""));
    for (const k of Object.keys(fixed)) params.delete(k);
    const out = params.toString();
    return `${basePath}${out ? `?${out}` : ""}`;
  };

  const chips: { label: string; href: string }[] = [];
  for (const m of f.marka) chips.push({ label: facets.brands.find((b) => b.slug === m)?.name ?? m, href: qs({ marka: f.marka.filter((x) => x !== m) }) });
  for (const m of f.magaza) chips.push({ label: facets.retailers.find((b) => b.slug === m)?.name ?? m, href: qs({ magaza: f.magaza.filter((x) => x !== m) }) });
  if (f.min !== undefined) chips.push({ label: `En az ${formatMoney(f.min)}`, href: qs({ min: null }) });
  if (f.max !== undefined) chips.push({ label: `En çok ${formatMoney(f.max)}`, href: qs({ max: null }) });
  if (f.indirim) chips.push({ label: `İndirim ≥ %${f.indirim}`, href: qs({ indirim: null }) });
  if (f.stok) chips.push({ label: "Stokta", href: qs({ stok: null }) });
  if (f.kupon) chips.push({ label: "Kuponlu", href: qs({ kupon: null }) });
  if (f.taze) chips.push({ label: `Son ${f.taze} saatte kontrol`, href: qs({ taze: null }) });
  if (f.etiket) chips.push({ label: DEAL_LABELS[LABEL_FILTERS[f.etiket]].text, href: qs({ etiket: null }) });
  for (const [k, v] of Object.entries(f.attrs)) chips.push({ label: `${facets.attributes.find((a) => a.key === k)?.label ?? k}: ${v}`, href: qs({ [`n_${k}`]: null }) });

  const panel = <FilterPanel action={basePath} f={f} facets={facets} hideCategory={hideCategoryFilter} fixed={fixed} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block" aria-label="Filtreler">
        <div className="sticky top-[132px] max-h-[calc(100dvh-150px)] overflow-y-auto pr-2 [scrollbar-width:thin]">{panel}</div>
      </aside>
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-ink-2" aria-live="polite">
            <strong className="font-semibold text-ink tabular">{result.total.toLocaleString("tr-TR")}</strong> ürün
            {f.q ? (
              <>
                {" "}
                · “<span className="text-ink">{f.q}</span>”
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <FilterDrawer count={count}>{panel}</FilterDrawer>
            {user ? <SaveSearchButton kind="PRODUCT" query={qs({})} defaultName={f.q ? `“${f.q}” araması` : basePath === "/firsatlar" ? "Fırsatlar listesi" : "Kayıtlı liste"} /> : null}
            <SortSelect value={f.sirala ?? (f.q ? "ilgili" : "avantaj")} hasQuery={Boolean(f.q)} />
          </div>
        </div>
        {chips.length ? (
          <ul className="mb-5 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <li key={c.label}>
                <Link href={c.href} scroll={false} className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-surface pl-3 pr-2 text-[12.5px] hover:border-line-strong">
                  {c.label}
                  <Icon name="x" className="size-3.5 text-ink-3" />
                  <span className="sr-only">filtresini kaldır</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={qs(Object.fromEntries(["marka", "magaza", "min", "max", "indirim", "stok", "kupon", "taze", "etiket", ...Object.keys(f.attrs).map((k) => `n_${k}`)].map((k) => [k, null])))} className="inline-flex h-7 items-center px-2 text-[12.5px] font-medium text-brand-ink hover:underline">
                Tümünü temizle
              </Link>
            </li>
          </ul>
        ) : null}

        {result.items.length ? (
          <>
            <ProductGrid items={result.items} loggedIn={Boolean(user)} favoriteIds={favs} layout="sidebar" priorityCount={3} />
            <Pagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => qs({ sayfa: p > 1 ? String(p) : null })} />
          </>
        ) : (
          <EmptyState icon="search" title={count || f.q ? "Bu filtrelerle eşleşen güncel teklif yok" : "Henüz doğrulanmış güncel teklif yok"}>
            {emptyHint ??
              (count || f.q ? (
                "Filtreleri gevşetmeyi veya farklı bir arama yapmayı deneyin. Yalnızca son kontrolde doğrulanmış teklifler listelenir."
              ) : (
                <>
                  Teklifler yalnızca bağlı veri kaynaklarından gelir; tahmini veya örnek fiyat gösterilmez.{" "}
                  <Link href="/veri-kaynaklari" className="text-brand-ink underline">
                    Veri kaynaklarının durumu
                  </Link>
                </>
              ))}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
