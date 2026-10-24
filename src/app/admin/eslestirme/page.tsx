import Link from "next/link";
import { reviewMatch } from "@/app/admin/actions";
import { AdminPage, Panel, SubmitButton } from "@/components/admin/ui";
import { formatMoney } from "@/lib/money";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Eşleştirme incelemesi" };

type Signals = { titleSimilarity: number; brandMatch: boolean | null; modelTokenOverlap: number | null; sharedModelTokens: string[]; conflictingModelTokens: boolean; attributeConflicts: string[] };

export default async function AdminMatches() {
  await requireStaff("EDITOR");
  const rows = await db.matchCandidate.findMany({
    where: { status: "PENDING" },
    orderBy: { confidence: "desc" },
    take: 50,
    include: {
      offer: { include: { retailer: true, variant: true, product: { select: { id: true, slug: true, title: true } } } },
      candidateProduct: { include: { offers: { where: { status: "ACTIVE" }, include: { retailer: true }, take: 3 }, brand: true } },
    },
  });
  return (
    <AdminPage title="Eşleştirme incelemesi" description="Başlık benzerliğine dayanan belirsiz eşleşmeler otomatik birleştirilmez. Onay: teklif aday ürüne taşınır (varyant nitelikleri korunur). Red: kayıt ayrı ürün olarak kalır.">
      {rows.length === 0 ? <p className="text-[13px] text-ink-3">İnceleme bekleyen eşleşme yok.</p> : null}
      <div className="space-y-3">
        {rows.map((m) => {
          const s = m.signals as Signals;
          return (
            <Panel key={m.id}>
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
                <div>
                  <p className="eyebrow mb-1">Yeni kayıt · {m.offer.retailer.name}</p>
                  <p className="font-medium">{m.offer.title}</p>
                  <p className="text-[12px] text-ink-3">
                    {formatMoney(m.offer.priceMinor, m.offer.currency)} · varyant {m.offer.variant.label} · şu an:{" "}
                    <Link href={`/admin/urunler/${m.offer.product.id}`} className="underline">
                      {m.offer.product.title}
                    </Link>
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-display text-[22px] font-[650]">{Math.round(m.confidence * 100)}%</p>
                  <p className="text-[11px] text-ink-3">güven</p>
                </div>
                <div>
                  <p className="eyebrow mb-1">Aday ürün</p>
                  <Link href={`/admin/urunler/${m.candidateProduct.id}`} className="font-medium hover:text-brand-ink">
                    {m.candidateProduct.title}
                  </Link>
                  <p className="text-[12px] text-ink-3">
                    {m.candidateProduct.brand?.name ?? "markasız"} · {m.candidateProduct.offers.map((o) => `${o.retailer.name} ${formatMoney(o.priceMinor, o.currency)}`).join(" · ") || "aktif teklif yok"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="font-mono text-[11.5px] text-ink-3">
                  başlık {s.titleSimilarity} · marka {s.brandMatch === null ? "?" : s.brandMatch ? "aynı" : "farklı"} · model kodu {s.modelTokenOverlap ?? "?"} [{s.sharedModelTokens.join(", ")}]
                  {s.conflictingModelTokens ? " · MODEL KODU ÇELİŞKİSİ" : ""}
                  {s.attributeConflicts.length ? ` · nitelik farkı: ${s.attributeConflicts.join(", ")}` : ""}
                </p>
                <div className="flex gap-2">
                  <form action={reviewMatch.bind(null, m.id, false)}>
                    <SubmitButton variant="secondary">Farklı ürün</SubmitButton>
                  </form>
                  <form action={reviewMatch.bind(null, m.id, true)}>
                    <SubmitButton>Aynı ürün — birleştir</SubmitButton>
                  </form>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </AdminPage>
  );
}
