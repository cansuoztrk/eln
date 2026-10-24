import type { Metadata } from "next";
import { ProductListing } from "@/components/listing/product-listing";
import { PageHeader } from "@/components/ui/section";
import { parseFilters } from "@/server/catalog/filters";

export const metadata: Metadata = {
  title: "Ürün fırsatları",
  description: "Doğrulanmış fiyat geçmişine ve mağazalar arası karşılaştırmaya göre sıralanmış güncel ürün fırsatları.",
  alternates: { canonical: "/firsatlar" },
};

export default async function DealsPage(props: PageProps<"/firsatlar">) {
  const f = parseFilters(await props.searchParams);
  return (
    <>
      <PageHeader eyebrow="Fırsatlar" title="Ürün fırsatları" description="Yalnızca son kontrolde doğrulanmış teklifler. Sıralama varsayılan olarak fırsat puanına göredir; indirim sıralaması mağaza liste fiyatını değil, doğrulanmış fiyat geçmişini kullanır." />
      <div className="container-page py-8">
        <ProductListing basePath="/firsatlar" f={f} />
      </div>
    </>
  );
}
