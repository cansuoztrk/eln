import { updateRetailerAffiliate } from "@/app/admin/actions";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { DAY } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Mağazalar ve satış ortaklığı" };

export default async function AdminRetailers() {
  await requireStaff("ADMIN");
  const [retailers, clicks] = await Promise.all([
    db.retailer.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { offers: true } } } }),
    db.clickEvent.groupBy({ by: ["retailerId", "isAffiliate"], where: { createdAt: { gte: new Date(Date.now() - 30 * DAY) } }, _count: true }),
  ]);
  return (
    <AdminPage title="Mağazalar ve satış ortaklığı" description="Satış ortaklığı yalnızca resmî programdan onay alındıktan sonra etkinleştirilmelidir. Komisyon parametresi yalnızca bağlantıda başka bir ortaklık parametresi yoksa eklenir; kaynağın kendi ortaklık bağlantısı (ör. Amazon Creators API) değiştirilmez.">
      <div className="grid gap-4 lg:grid-cols-2">
        {retailers.map((r) => {
          const c = clicks.filter((x) => x.retailerId === r.id);
          const total = c.reduce((a, x) => a + x._count, 0);
          const aff = c.filter((x) => x.isAffiliate).reduce((a, x) => a + x._count, 0);
          const cfg = (r.affiliateConfig ?? {}) as { param?: string; value?: string };
          return (
            <Panel key={r.id} title={r.name}>
              <p className="mb-3 text-[12.5px] text-ink-3">
                {r._count.offers} teklif · son 30 gün {total} tıklama ({aff} satış ortaklığı bağlantısı)
              </p>
              <ActionForm action={updateRetailerAffiliate} submitLabel="Kaydet">
                <input type="hidden" name="retailerId" value={r.id} />
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" name="affiliateEnabled" defaultChecked={r.affiliateEnabled} className="accent-[var(--brand)]" /> Satış ortaklığı etkin (onaylı program)
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Program adı">
                    <input name="affiliateProgram" defaultValue={r.affiliateProgram ?? ""} className="field" />
                  </Field>
                  <Field label="URL parametresi">
                    <input name="param" defaultValue={cfg.param ?? ""} placeholder="ör. tag" className="field font-mono" />
                  </Field>
                  <Field label="Değer (gizli değildir)">
                    <input name="value" defaultValue={cfg.value ?? ""} className="field font-mono" />
                  </Field>
                </div>
                <Field label="Kargo notu (mağaza politikası)">
                  <input name="shippingNote" defaultValue={r.shippingNote ?? ""} className="field" />
                </Field>
              </ActionForm>
            </Panel>
          );
        })}
      </div>
    </AdminPage>
  );
}
