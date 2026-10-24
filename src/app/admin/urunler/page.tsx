import Link from "next/link";
import { AdminPage, Table, Td } from "@/components/admin/ui";
import { Freshness } from "@/components/price/freshness";
import { TestDataBadge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { requireStaff } from "@/server/auth/guards";
import { searchProductIds } from "@/server/catalog/queries";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Ürünler" };

export default async function AdminProducts(props: PageProps<"/admin/urunler">) {
  await requireStaff("EDITOR");
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const filter = typeof sp.f === "string" ? sp.f : "";
  const page = Math.max(1, Number(sp.sayfa ?? 1) || 1);
  const where: Prisma.ProductWhereInput = {
    ...(q ? { id: { in: await searchProductIds(q, 300) } } : {}),
    ...(filter === "teklifsiz" ? { bestOfferId: null } : {}),
    ...(filter === "siniflandirilmamis" ? { category: { slug: "diger-firsatlar" } } : {}),
    ...(filter === "gorselsiz" ? { imageUrl: null } : {}),
    ...(filter === "pasif" ? { isActive: false } : {}),
    ...(filter === "gercek" ? { isTestData: false } : {}),
  };
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * 50, take: 50, include: { category: { select: { name: true } }, brand: { select: { name: true } } } }),
  ]);
  const filters = [
    ["", "Tümü"],
    ["teklifsiz", "Güncel teklifi yok"],
    ["siniflandirilmamis", "Sınıflandırılmamış"],
    ["gorselsiz", "Görselsiz"],
    ["pasif", "Pasif"],
    ["gercek", "Yalnızca gerçek veri"],
  ];
  return (
    <AdminPage title="Ürünler" description={`${total.toLocaleString("tr-TR")} kayıt. Düzenlemeler denetim kaydına yazılır.`}>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Ürün, marka, model, GTIN ara…" className="field h-9 max-w-sm" />
        <select name="f" defaultValue={filter} className="field h-9 w-auto">
          {filters.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button className="h-9 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-on-brand">Filtrele</button>
      </form>
      <Table head={["Ürün", "Kategori", "Teklif", "En iyi", "Puan", "Son doğrulama"]} empty={rows.length ? undefined : "Kayıt yok."}>
        {rows.map((p) => (
          <tr key={p.id}>
            <Td>
              <Link href={`/admin/urunler/${p.id}`} className="font-medium hover:text-brand-ink">
                {p.title}
              </Link>
              <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-ink-3">
                {p.brand?.name ?? "markasız"} {p.isTestData ? <TestDataBadge /> : null} {!p.isActive ? "· pasif" : ""}
              </span>
            </Td>
            <Td>{p.category.name}</Td>
            <Td className="tabular">
              {p.offerCount} / {p.retailerCount} mağaza
            </Td>
            <Td className="tabular">{p.bestTotalMinor ? formatMoney(p.bestTotalMinor, p.bestCurrency ?? "TRY") : "—"}</Td>
            <Td className="tabular">{p.dealScore !== null ? Math.round(p.dealScore) : "—"}</Td>
            <Td>
              <Freshness at={p.lastVerifiedAt} compact />
            </Td>
          </tr>
        ))}
      </Table>
      <div className="flex gap-2 text-[13px]">
        {page > 1 ? <Link href={`?q=${encodeURIComponent(q)}&f=${filter}&sayfa=${page - 1}`} className="text-brand-ink">← Önceki</Link> : null}
        {page * 50 < total ? <Link href={`?q=${encodeURIComponent(q)}&f=${filter}&sayfa=${page + 1}`} className="text-brand-ink">Sonraki →</Link> : null}
      </div>
    </AdminPage>
  );
}
