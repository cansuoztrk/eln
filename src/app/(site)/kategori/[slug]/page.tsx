import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProductListing } from "@/components/listing/product-listing";
import { db } from "@/server/db";
import { parseFilters } from "@/server/catalog/filters";
import { cn } from "@/lib/cn";

async function load(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: { parent: { include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } }, children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export async function generateMetadata(props: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = await load(slug);
  if (!c) return {};
  return {
    title: c.seoTitle ?? `${c.name} fırsatları ve fiyat karşılaştırma`,
    description: c.seoDescription ?? `${c.name} kategorisinde mağazalar arası fiyat karşılaştırması, doğrulanmış fiyat geçmişi ve güncel fırsatlar.`,
    alternates: { canonical: `/kategori/${c.slug}` },
  };
}

export default async function CategoryPage(props: PageProps<"/kategori/[slug]">) {
  const { slug } = await props.params;
  const category = await load(slug);
  if (!category || !category.isActive) notFound();
  const sp = await props.searchParams;
  const f = { ...parseFilters(sp), kategori: category.slug };
  const siblings = category.parent ? category.parent.children : category.children;
  const parent = category.parent;

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page py-7 md:py-9">
          <nav aria-label="Konum" className="mb-3 flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Link href="/kategoriler" className="hover:text-ink">
              Kategoriler
            </Link>
            {parent ? (
              <>
                <Icon name="chevronRight" className="size-3.5" />
                <Link href={`/kategori/${parent.slug}`} className="hover:text-ink">
                  {parent.name}
                </Link>
              </>
            ) : null}
          </nav>
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-ink">
              <Icon name={category.icon ?? "grid"} className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-[28px] font-[680] tracking-tight md:text-[34px]">{category.name}</h1>
              {category.description ? <p className="mt-0.5 text-[14px] text-ink-2">{category.description}</p> : null}
            </div>
          </div>
          {siblings.length ? (
            <ul className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {parent ? (
                <li>
                  <Link href={`/kategori/${parent.slug}`} className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-line px-3.5 text-[13px] text-ink-2 hover:border-line-strong hover:text-ink">
                    Tümü
                  </Link>
                </li>
              ) : null}
              {siblings
                .filter((s) => s.slug !== "diger-firsatlar")
                .map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/kategori/${s.slug}`}
                      aria-current={s.slug === category.slug ? "page" : undefined}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px]",
                        s.slug === category.slug ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-line-strong hover:text-ink",
                      )}
                    >
                      <Icon name={s.icon ?? "spark"} className="size-3.5" />
                      {s.name}
                    </Link>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="container-page py-8">
        <ProductListing basePath={`/kategori/${category.slug}`} f={f} hideCategoryFilter facetCategory={category.slug} />
      </div>
    </>
  );
}
