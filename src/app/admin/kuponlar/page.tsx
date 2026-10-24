import { deactivateCoupon, upsertCoupon } from "@/app/admin/actions";
import { AdminPage, Field, Panel, StatusBadge, SubmitButton, Table, Td } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { CONDITION_LABELS } from "@/server/pricing/coupons";

export const metadata = { title: "Kuponlar" };

type CouponRow = Awaited<ReturnType<typeof db.coupon.findMany>>[number];

function CouponForm({ c, retailers }: { c?: CouponRow; retailers: { id: string; name: string }[] }) {
  return (
    <ActionForm action={upsertCoupon} submitLabel={c ? "Güncelle" : "Kupon ekle"}>
      {c ? <input type="hidden" name="couponId" value={c.id} /> : null}
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Mağaza">
          <select name="retailerId" defaultValue={c?.retailerId} className="field">
            {retailers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Başlık">
          <input name="title" defaultValue={c?.title} required className="field" />
        </Field>
        <Field label="Kod (varsa)">
          <input name="code" defaultValue={c?.code ?? ""} className="field font-mono" />
        </Field>
        <Field label="Koşul türü">
          <select name="conditionType" defaultValue={c?.conditionType ?? "COUPON_CODE"} className="field">
            {Object.entries(CONDITION_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="İndirim türü">
          <select name="discountType" defaultValue={c?.discountType ?? ""} className="field">
            <option value="">Belirtilmemiş</option>
            <option value="PERCENT">Yüzde</option>
            <option value="AMOUNT">Tutar (TL)</option>
          </select>
        </Field>
        <Field label="İndirim değeri" hint="Yüzde için 10 = %10; tutar için TL">
          <input name="discountValue" defaultValue={c?.discountValue ? (c.discountType === "PERCENT" ? c.discountValue / 100 : c.discountValue / 100) : ""} className="field" />
        </Field>
        <Field label="Minimum sepet (TL)">
          <input name="minBasket" defaultValue={c?.minBasketMinor ? c.minBasketMinor / 100 : ""} className="field" />
        </Field>
        <Field label="En fazla indirim (TL)">
          <input name="maxDiscount" defaultValue={c?.maxDiscountMinor ? c.maxDiscountMinor / 100 : ""} className="field" />
        </Field>
        <Field label="Geçerlilik başlangıcı">
          <input name="validFrom" type="date" defaultValue={c?.validFrom?.toISOString().slice(0, 10)} className="field" />
        </Field>
        <Field label="Geçerlilik bitişi">
          <input name="validUntil" type="date" defaultValue={c?.validUntil?.toISOString().slice(0, 10)} className="field" />
        </Field>
        <Field label="Kategoriler (slug, virgülle; boş = tümü)">
          <input name="categorySlugs" defaultValue={c?.categorySlugs.join(", ")} className="field font-mono" />
        </Field>
        <Field label="Diğer kampanyalarla birleşir mi?">
          <select name="stackable" defaultValue={c?.stackable === true ? "yes" : c?.stackable === false ? "no" : ""} className="field">
            <option value="">Doğrulanmadı</option>
            <option value="yes">Evet (doğrulandı)</option>
            <option value="no">Hayır</option>
          </select>
        </Field>
      </div>
      <Field label="Açıklama">
        <input name="description" defaultValue={c?.description ?? ""} className="field" />
      </Field>
      <Field label="Kullanım kısıtlamaları">
        <input name="restrictions" defaultValue={c?.restrictions ?? ""} className="field" />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Doğrulama durumu" hint="“Doğrulandı” yalnızca kupon gerçekten denendiyse seçilmeli; yalnızca doğrulanmış kuponlar fiyat hesabına girer.">
          <select name="verificationStatus" defaultValue={c?.verificationStatus ?? "UNVERIFIED"} className="field">
            <option value="UNVERIFIED">Doğrulanmadı</option>
            <option value="VERIFIED">Doğrulandı</option>
            <option value="FAILED">Çalışmıyor</option>
            <option value="EXPIRED">Süresi doldu</option>
          </select>
        </Field>
        <Field label="Kaynak adresi">
          <input name="sourceUrl" defaultValue={c?.sourceUrl ?? ""} className="field" />
        </Field>
      </div>
    </ActionForm>
  );
}

export default async function AdminCoupons() {
  await requireStaff("EDITOR");
  const [coupons, retailers] = await Promise.all([db.coupon.findMany({ orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }], take: 100, include: { retailer: { select: { name: true } } } }), db.retailer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  return (
    <AdminPage title="Kuponlar ve kampanyalar" description="Kupon yalnızca izin verilen kaynaktan veya editör tarafından eklenir. Koşullu indirimler (üyelik, ödeme yöntemi, cashback) fiyattan düşülmez; ayrı gösterilir.">
      <Panel title="Yeni kupon">
        <CouponForm retailers={retailers} />
      </Panel>
      <Table head={["Kupon", "Mağaza", "Koşul", "İndirim", "Geçerlilik", "Doğrulama", ""]} empty={coupons.length ? undefined : "Kupon yok."}>
        {coupons.map((c) => (
          <tr key={c.id} className={c.isActive ? "" : "opacity-60"}>
            <Td>
              <details>
                <summary className="cursor-pointer font-medium">
                  {c.title} {c.code ? <code className="ml-1 text-[12px]">{c.code}</code> : null}
                </summary>
                <div className="mt-3 w-[min(900px,80vw)]">
                  <CouponForm c={c} retailers={retailers} />
                </div>
              </details>
            </Td>
            <Td>{c.retailer.name}</Td>
            <Td className="text-[12px]">{CONDITION_LABELS[c.conditionType]}</Td>
            <Td className="tabular">{c.discountType === "PERCENT" ? `%${(c.discountValue ?? 0) / 100}` : c.discountType === "AMOUNT" ? formatMoney(c.discountValue, c.currency) : "—"}</Td>
            <Td className="text-[12px]">{c.validUntil ? formatDate(c.validUntil) : "—"}</Td>
            <Td>
              <StatusBadge status={c.verificationStatus} />
            </Td>
            <Td>
              {c.isActive ? (
                <form action={deactivateCoupon.bind(null, c.id)}>
                  <SubmitButton variant="secondary">Pasifleştir</SubmitButton>
                </form>
              ) : (
                <span className="text-[12px] text-ink-3">pasif</span>
              )}
            </Td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
