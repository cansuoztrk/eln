import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductListing } from "@/components/listing/product-listing";
import { Icon } from "@/components/icons";
import { db } from "@/server/db";
import { parseFilters } from "@/server/catalog/filters";
import { looksNatural, parseNaturalQuery } from "@/server/catalog/nl-query";
import { normalizeText } from "@/lib/text";

export const metadata: Metadata = { title: "Arama", robots: { index: false, follow: true } };

export default async function SearchPage(props: PageProps<"/ara">) {
  const sp = await props.searchParams;
  const f = parseFilters(sp);
  if (!f.q) redirect("/firsatlar");

  // Doğal dil: "bütçem 1500 TL, kablosuz oyuncu faresi" → filtreler (yalnızca ilk aramada)
  let understood: string[] = [];
  if (looksNatural(f.q) && !sp.nl) {
    const categories = await db.category.findMany({ where: { isActive: true }, select: { id: true, slug: true, keywords: true, name: true, parentId: true } });
    const nl = parseNaturalQuery(f.q, categories);
    if (nl.kategori || nl.max !== undefined || nl.min !== undefined || Object.keys(nl.attrs).length) {
      const params = new URLSearchParams();
      if (nl.q) params.set("q", nl.q);
      if (nl.kategori) params.set("kategori", nl.kategori);
      if (nl.max !== undefined) params.set("max", String(nl.max / 100));
      if (nl.min !== undefined) params.set("min", String(nl.min / 100));
      for (const [k, v] of Object.entries(nl.attrs)) params.set(`n_${k}`, v);
      params.set("nl", f.q);
      redirect(nl.q ? `/ara?${params}` : `/firsatlar?${params}`);
    }
  }
  if (typeof sp.nl === "string") understood = [sp.nl];

  // Anonim popüler arama sayacı (kişisel veri içermez)
  const norm = normalizeText(f.q).slice(0, 80);
  if (norm.length >= 3) {
    await db.popularSearch.upsert({ where: { query: norm }, create: { query: norm }, update: { count: { increment: 1 }, lastSearchAt: new Date() } }).catch(() => {});
  }

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page py-7">
          <p className="eyebrow mb-1.5">Arama sonuçları</p>
          <h1 className="font-display text-[28px] font-[680] tracking-tight md:text-[34px]">“{f.q}”</h1>
          {understood.length ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-ink-2">
              <Icon name="spark" className="size-4 text-brand-ink" />
              “{understood[0]}” isteğinizi filtrelere çevirdik.
            </p>
          ) : null}
        </div>
      </div>
      <div className="container-page py-8">
        <ProductListing
          basePath="/ara"
          f={f}
          onlyCurrent={false}
          emptyHint={
            <>
              Bu aramayla eşleşen ürün bulunamadı. Model kodunu veya marka adını deneyin, ya da{" "}
              <Link href="/kategoriler" className="text-brand-ink underline">
                kategorilere göz atın
              </Link>
              .
            </>
          }
        />
      </div>
    </>
  );
}
