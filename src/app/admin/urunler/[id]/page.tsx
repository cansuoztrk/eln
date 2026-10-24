import Link from "next/link";
import { notFound } from "next/navigation";
import { moveOffer, setOfferDisabled, setOfferFlag, updateProduct } from "@/app/admin/actions";
import { AdminPage, Field, Panel, StatusBadge, SubmitButton, Table, Td } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { Freshness } from "@/components/price/freshness";
import { TestDataBadge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Ürün" };

export default async function AdminProduct(props: PageProps<"/admin/urunler/[id]">) {
  await requireStaff("EDITOR");
  const { id } = await props.params;
  const p = await db.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      variants: true,
      offers: { include: { retailer: true, dataSource: { select: { name: true, isTestData: true } }, variant: { select: { label: true } }, _count: { select: { snapshots: true } } }, orderBy: { priceMinor: "asc" } },
    },
  });
  if (!p) notFound();
  const [categories, history] = await Promise.all([
    db.category.findMany({ where: { parentId: { not: null } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.adminAuditLog.findMany({ where: { OR: [{ entityType: "Product", entityId: p.id }, { entityType: "Offer", entityId: { in: p.offers.map((o) => o.id) } }] }, orderBy: { createdAt: "desc" }, take: 30, include: { actor: { select: { email: true } } } }),
  ]);
  return (
    <AdminPage
      title={p.title}
      description={
        <>
          <Link href={`/urun/${p.slug}`} className="text-brand-ink underline">
            Sitede görüntüle
          </Link>{" "}
          · {p.isTestData ? <TestDataBadge /> : "gerçek veri"} · slug: <code>{p.slug}</code>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Ürün bilgileri">
          <ActionForm action={updateProduct} submitLabel="Kaydet">
            <input type="hidden" name="productId" value={p.id} />
            <Field label="Başlık">
              <input name="title" defaultValue={p.title} required className="field" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kategori">
                <select name="categoryId" defaultValue={p.categoryId} className="field">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marka">
                <input name="brandName" defaultValue={p.brand?.name ?? ""} className="field" />
              </Field>
              <Field label="Model">
                <input name="modelNumber" defaultValue={p.modelNumber ?? ""} className="field" />
              </Field>
              <Field label="Etiketler (virgülle)">
                <input name="tags" defaultValue={p.tags.join(", ")} className="field" />
              </Field>
            </div>
            <Field label="Görsel adresi (https)" hint="Görseli kaynağın verdiği adres olmalıdır; telifli görsel yüklemeyin.">
              <input name="imageUrl" defaultValue={p.imageUrl ?? ""} className="field" />
            </Field>
            <Field label="Değişiklik nedeni">
              <input name="reason" placeholder="Ör. yanlış kategori düzeltildi" className="field" />
            </Field>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="isActive" defaultChecked={p.isActive} className="accent-[var(--brand)]" /> Aktif (sitede görünür)
            </label>
          </ActionForm>
          <div className="mt-5 border-t border-line pt-4 text-[12.5px]">
            <p className="mb-1 font-semibold">Varyantlar</p>
            <ul className="space-y-1">
              {p.variants.map((v) => (
                <li key={v.id} className="font-mono text-ink-2">
                  {v.label} · {v.variantKey} {v.gtin ? `· GTIN ${v.gtin}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel title="Teklifler ve ürün–satıcı ilişkileri">
          <Table head={["Mağaza / kaynak", "Fiyat", "Durum", "Eşleşme", "İşlemler"]}>
            {p.offers.map((o) => (
              <tr key={o.id}>
                <Td>
                  <p className="font-medium">{o.retailer.name}</p>
                  <p className="text-[11.5px] text-ink-3">
                    {o.dataSource.name} · {o.variant.label} · {o._count.snapshots} kayıt
                  </p>
                  <a href={o.url} target="_blank" rel="noopener nofollow" className="text-[11.5px] text-brand-ink underline">
                    kaynak adresi
                  </a>
                </Td>
                <Td className="tabular">
                  {formatMoney(o.priceMinor, o.currency)}
                  <span className="block text-[11.5px] text-ink-3">{o.shippingMinor === null ? "kargo ?" : `kargo ${formatMoney(o.shippingMinor, o.currency)}`}</span>
                </Td>
                <Td>
                  <StatusBadge status={o.status} />
                  {o.flaggedSuspicious ? <p className="mt-1 text-[11.5px] text-warn-ink">Şüpheli: {o.suspiciousReason}</p> : null}
                  {o.disabledByAdmin ? <p className="mt-1 text-[11.5px] text-ink-3">Kapatma nedeni: {o.disabledReason ?? "—"}</p> : null}
                  <Freshness at={o.lastSuccessAt} compact />
                </Td>
                <Td className="text-[12px]">
                  {o.matchMethod}
                  <span className="block font-mono text-ink-3">{Math.round(o.matchConfidence * 100)}%</span>
                </Td>
                <Td>
                  <div className="space-y-1.5">
                    <form action={setOfferDisabled.bind(null, o.id, !o.disabledByAdmin)} className="flex gap-1">
                      <input name="reason" placeholder="neden" className="field h-8 w-28 text-[12px]" />
                      <SubmitButton variant="secondary">{o.disabledByAdmin ? "Etkinleştir" : "Devre dışı"}</SubmitButton>
                    </form>
                    <form action={setOfferFlag.bind(null, o.id, !o.flaggedSuspicious)} className="flex gap-1">
                      <input name="reason" placeholder="neden" className="field h-8 w-28 text-[12px]" />
                      <SubmitButton variant={o.flaggedSuspicious ? "secondary" : "danger"}>{o.flaggedSuspicious ? "İşareti kaldır" : "Şüpheli"}</SubmitButton>
                    </form>
                    <details>
                      <summary className="cursor-pointer text-[12px] text-brand-ink">Başka ürüne taşı</summary>
                      <ActionForm action={moveOffer} submitLabel="Taşı" className="mt-2">
                        <input type="hidden" name="offerId" value={o.id} />
                        <input name="targetSlug" placeholder="hedef ürün slug" className="field h-8 text-[12px]" required />
                        <input name="reason" placeholder="neden" className="field h-8 text-[12px]" />
                      </ActionForm>
                    </details>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      <Panel title="Değişiklik geçmişi">
        {history.length ? (
          <ul className="space-y-2 text-[12.5px]">
            {history.map((h) => (
              <li key={h.id} className="rounded-md bg-surface-2 px-3 py-2">
                <span className="font-mono">{h.action}</span> · {h.actor?.email ?? "sistem"} · {formatDateTime(h.createdAt)}
                {h.reason ? <span className="block text-ink-2">Neden: {h.reason}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-3">Elle yapılmış değişiklik yok.</p>
        )}
      </Panel>
    </AdminPage>
  );
}
