import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/section";
import { db } from "@/server/db";
import { formatDate } from "@/lib/time";
import { EDITORIAL_TYPE_LABEL } from "@/lib/editorial";

export const metadata: Metadata = { title: "Rehberler ve editörün seçimleri", description: "Editörlerimizin hazırladığı alışveriş rehberleri, kategori karşılaştırmaları ve haftanın seçimleri.", alternates: { canonical: "/rehber" } };


export default async function GuidesPage() {
  const items = await db.editorialContent.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 50, include: { _count: { select: { items: true } } } });
  return (
    <>
      <PageHeader eyebrow="Editoryal" title="Rehberler ve editörün seçimleri" description="Bu bölümdeki içerikler editörler tarafından hazırlanır ve otomatik fırsatlardan ayrıdır. “Editörün seçimi” etiketi yalnızca bir editörün gerçekten seçtiği ürünlerde görünür." />
      <div className="container-page py-10">
        {items.length ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <li key={c.id}>
                <Link href={`/rehber/${c.slug}`} className="card flex h-full flex-col p-5 hover:border-line-strong">
                  <Badge tone="brand">{EDITORIAL_TYPE_LABEL[c.type]}</Badge>
                  <h2 className="mt-3 font-display text-[19px] font-[650] leading-snug">{c.title}</h2>
                  <p className="mt-2 flex-1 text-[13.5px] text-ink-2">{c.summary}</p>
                  <p className="mt-4 font-mono text-[11.5px] text-ink-3">
                    {c.publishedAt ? formatDate(c.publishedAt) : ""} · {c._count.items} seçim
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="book" title="Henüz yayımlanmış içerik yok">
            Editörler yönetim panelinden rehber ve seçki yayımladığında burada listelenir.
          </EmptyState>
        )}
      </div>
    </>
  );
}
