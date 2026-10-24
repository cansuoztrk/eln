import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/section";
import { db } from "@/server/db";
import { visibilityWhere } from "@/server/catalog/queries";

export const metadata: Metadata = { title: "Kategoriler", description: "Tüm ürün kategorileri ve güncel teklif sayıları.", alternates: { canonical: "/kategoriler" } };

export default async function CategoriesPage() {
  const [parents, counts] = await Promise.all([
    db.category.findMany({ where: { parentId: null, isActive: true }, orderBy: { sortOrder: "asc" }, include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } }),
    db.product.groupBy({ by: ["categoryId"], where: { ...visibilityWhere(), bestOfferId: { not: null } }, _count: true }),
  ]);
  const countOf = new Map(counts.map((c) => [c.categoryId, c._count]));
  return (
    <>
      <PageHeader eyebrow="Keşfet" title="Kategoriler" description="Her kategori kendi filtreleri ve karşılaştırma ölçütleriyle. Sayılar, son kontrolde doğrulanmış teklifi olan ürünleri gösterir." />
      <div className="container-page grid gap-6 py-10 md:grid-cols-2">
        {parents.map((p) => (
          <section key={p.slug} className="card p-5">
            <Link href={`/kategori/${p.slug}`} className="mb-4 flex items-center gap-3 hover:text-brand-ink">
              <span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand-ink">
                <Icon name={p.icon ?? "grid"} className="size-5" />
              </span>
              <span>
                <span className="block font-display text-[18px] font-[650]">{p.name}</span>
                <span className="block text-[12.5px] text-ink-3">{p.description}</span>
              </span>
            </Link>
            <ul className="grid gap-1 sm:grid-cols-2">
              {p.children.map((c) => (
                <li key={c.slug}>
                  <Link href={`/kategori/${c.slug}`} className="flex items-center gap-2.5 rounded-md px-2 py-2 text-[13.5px] hover:bg-surface-2">
                    <Icon name={c.icon ?? "spark"} className="size-4 text-ink-3" />
                    <span className="flex-1">{c.name}</span>
                    <span className="font-mono text-[11px] text-ink-3 tabular">{countOf.get(c.id) ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
