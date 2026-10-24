import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Badge, TestDataBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { formatDate, formatRelative } from "@/lib/time";
import { db } from "@/server/db";
import { CONDITION_LABELS } from "@/server/pricing/coupons";
import { includeTestData } from "@/server/visibility";

export const metadata: Metadata = {
  title: "Kuponlar ve kampanyalar",
  description: "Mağaza kuponları ve kampanyalar; koşulları (üyelik, ödeme yöntemi, minimum sepet, cashback) açıkça ayrılmış ve doğrulama durumu belirtilmiş.",
  alternates: { canonical: "/kuponlar" },
};

const TYPES = Object.entries(CONDITION_LABELS) as [keyof typeof CONDITION_LABELS, string][];

export default async function CouponsPage(props: PageProps<"/kuponlar">) {
  const sp = await props.searchParams;
  const type = typeof sp.tur === "string" && sp.tur in CONDITION_LABELS ? (sp.tur as keyof typeof CONDITION_LABELS) : null;
  const now = new Date();
  const coupons = await db.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      ...(type ? { conditionType: type } : {}),
      ...(includeTestData() ? {} : { OR: [{ dataSourceId: null }, { dataSource: { isTestData: false } }] }),
    },
    include: { retailer: true, dataSource: { select: { isTestData: true } } },
    orderBy: [{ verificationStatus: "asc" }, { validUntil: { sort: "asc", nulls: "last" } }],
  });

  return (
    <>
      <PageHeader
        eyebrow="Kuponlar"
        title="Kuponlar ve kampanyalar"
        description="Her kuponun koşulu ayrı gösterilir. “Doğrulandı” yalnızca kupon gerçekten test edildiyse yazar; doğrulanmamış kuponlar ürün fiyatlarından düşülmez ve kuponlar birlikte uygulanabileceği doğrulanmadıkça toplanmaz."
      />
      <div className="container-page py-8">
        <nav aria-label="Kupon türleri" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link href="/kuponlar" className={cn("inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px]", !type ? "border-ink bg-ink text-bg" : "border-line hover:border-line-strong")}>
            Tümü
          </Link>
          {TYPES.map(([k, label]) => (
            <Link key={k} href={`/kuponlar?tur=${k}`} className={cn("inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px]", type === k ? "border-ink bg-ink text-bg" : "border-line hover:border-line-strong")}>
              {label}
            </Link>
          ))}
        </nav>
        {coupons.length ? (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {coupons.map((c) => (
              <li key={c.id} className="card flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] text-ink-3">{c.retailer.name}</p>
                    <p className="mt-0.5 font-semibold">{c.title}</p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-ink">
                    <Icon name="ticket" className="size-[18px]" />
                  </span>
                </div>
                {c.description ? <p className="mt-2 text-[13px] text-ink-2">{c.description}</p> : null}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="outline">{CONDITION_LABELS[c.conditionType]}</Badge>
                  {c.verificationStatus === "VERIFIED" ? <Badge tone="positive">Doğrulandı</Badge> : <Badge tone="neutral">Doğrulanmadı</Badge>}
                  {c.stackable === null ? <Badge tone="neutral">Birleştirme koşulu bilinmiyor</Badge> : null}
                  {c.dataSource?.isTestData ? <TestDataBadge /> : null}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
                  {c.minBasketMinor ? (
                    <div>
                      <dt className="text-ink-3">Minimum sepet</dt>
                      <dd>{formatMoney(c.minBasketMinor, c.currency)}</dd>
                    </div>
                  ) : null}
                  {c.maxDiscountMinor ? (
                    <div>
                      <dt className="text-ink-3">En fazla indirim</dt>
                      <dd>{formatMoney(c.maxDiscountMinor, c.currency)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-ink-3">Geçerlilik</dt>
                    <dd>{c.validUntil ? `${formatDate(c.validUntil)} tarihine kadar` : "Bitiş tarihi bildirilmedi"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Son kontrol</dt>
                    <dd>{c.lastCheckedAt ? formatRelative(c.lastCheckedAt) : "Bilinmiyor"}</dd>
                  </div>
                </dl>
                {c.restrictions ? <p className="mt-2 text-[12px] text-ink-3">Kısıtlamalar: {c.restrictions}</p> : null}
                <div className="mt-auto pt-4">
                  {c.code ? (
                    <code className="block rounded-md border border-dashed border-line-strong bg-surface-2 px-3 py-2 text-center font-mono text-[14px] font-semibold tracking-wider">{c.code}</code>
                  ) : (
                    <p className="text-[12.5px] text-ink-3">Kod gerekmez; koşul sağlandığında mağazada uygulanır.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="ticket" title="Şu an listelenecek kupon yok">
            Kuponlar yalnızca izin verilen kaynaklardan veya editör tarafından eklenir; süresi dolanlar otomatik olarak kaldırılır.
          </EmptyState>
        )}
      </div>
    </>
  );
}
