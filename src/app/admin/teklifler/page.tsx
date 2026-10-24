import Link from "next/link";
import { setOfferDisabled, setOfferFlag } from "@/app/admin/actions";
import { AdminPage, StatusBadge, SubmitButton, Table, Td } from "@/components/admin/ui";
import { Freshness } from "@/components/price/freshness";
import { formatMoney } from "@/lib/money";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Teklifler" };

export default async function AdminOffers(props: PageProps<"/admin/teklifler">) {
  await requireStaff("EDITOR");
  const sp = await props.searchParams;
  const view = typeof sp.durum === "string" ? sp.durum : "supheli";
  const where: Prisma.OfferWhereInput =
    view === "eski" ? { status: { in: ["REVALIDATING", "STALE"] } } : view === "kapali" ? { disabledByAdmin: true } : view === "sponsorlu" ? { isSponsored: true } : { flaggedSuspicious: true };
  const rows = await db.offer.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100, include: { product: { select: { id: true, title: true } }, retailer: { select: { name: true } }, dataSource: { select: { name: true } } } });
  const tabs = [
    ["supheli", "Şüpheli fiyatlar"],
    ["eski", "Güncellenemeyenler"],
    ["kapali", "Devre dışı"],
    ["sponsorlu", "Sponsorlu"],
  ];
  return (
    <AdminPage title="Teklifler" description="Şüpheli fiyatlar fırsat listelerinden otomatik çıkarılır. Aynı fiyat 6 saat sonra tekrar doğrulanırsa otomatik işaret kalkar; yönetici işareti elle kaldırılana kadar kalır.">
      <nav className="flex gap-2">
        {tabs.map(([k, l]) => (
          <Link key={k} href={`?durum=${k}`} className={`rounded-full border px-3 py-1.5 text-[13px] ${view === k ? "border-ink bg-ink text-bg" : "border-line"}`}>
            {l}
          </Link>
        ))}
      </nav>
      <Table head={["Ürün", "Mağaza", "Fiyat", "Durum", "Neden", "İşlem"]} empty={rows.length ? undefined : "Bu görünümde kayıt yok."}>
        {rows.map((o) => (
          <tr key={o.id}>
            <Td>
              <Link href={`/admin/urunler/${o.product.id}`} className="font-medium hover:text-brand-ink">
                {o.product.title}
              </Link>
            </Td>
            <Td>
              {o.retailer.name}
              <span className="block text-[11.5px] text-ink-3">{o.dataSource.name}</span>
            </Td>
            <Td className="tabular">
              {formatMoney(o.priceMinor, o.currency)}
              {o.previousPriceMinor ? <span className="block text-[11.5px] text-ink-3">önceki {formatMoney(o.previousPriceMinor, o.currency)}</span> : null}
            </Td>
            <Td>
              <StatusBadge status={o.status} />
              <Freshness at={o.lastSuccessAt} compact />
            </Td>
            <Td className="max-w-[320px] text-[12px] text-ink-2">{o.suspiciousReason ?? o.disabledReason ?? "—"}</Td>
            <Td>
              {o.flaggedSuspicious ? (
                <form action={setOfferFlag.bind(null, o.id, false)}>
                  <input type="hidden" name="reason" value="İncelendi, fiyat doğru" />
                  <SubmitButton variant="secondary">Doğru, işareti kaldır</SubmitButton>
                </form>
              ) : null}
              {o.disabledByAdmin ? (
                <form action={setOfferDisabled.bind(null, o.id, false)}>
                  <SubmitButton variant="secondary">Etkinleştir</SubmitButton>
                </form>
              ) : null}
            </Td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
