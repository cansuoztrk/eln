import { addRoute, toggleRoute } from "@/app/admin/actions";
import { AdminPage, Field, Panel, SubmitButton, Table, Td } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { Freshness } from "@/components/price/freshness";
import { formatMoney } from "@/lib/money";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Uçuş rotaları" };

export default async function AdminRoutes() {
  await requireStaff("ADMIN");
  const [routes, stats] = await Promise.all([
    db.flightRoute.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
    db.flightOffer.groupBy({ by: ["routeId"], where: { isActive: true, routeId: { not: null } }, _count: true, _min: { priceMinor: true }, _max: { checkedAt: true } }),
  ]);
  return (
    <AdminPage title="İzlenen uçuş rotaları" description="Rota bazlı fırsat sayfaları bu listeden ve sağlayıcıdan gelen gerçek fiyatlardan oluşur. Etiketler keşif bölümlerini belirler: istanbul-cikisli, ankara-cikisli, izmir-cikisli, yurt-disi, hafta-sonu, direkt.">
      <Panel title="Rota ekle">
        <ActionForm action={addRoute} submitLabel="Ekle">
          <div className="grid gap-3 md:grid-cols-5">
            <Field label="Kalkış (IATA)">
              <input name="origin" required maxLength={3} className="field font-mono uppercase" placeholder="IST" />
            </Field>
            <Field label="Varış (IATA)">
              <input name="destination" required maxLength={3} className="field font-mono uppercase" placeholder="AYT" />
            </Field>
            <Field label="Etiketler (virgülle)">
              <input name="tags" className="field" placeholder="istanbul-cikisli, direkt" />
            </Field>
            <Field label="Kaç gün ileri">
              <input name="lookaheadDays" type="number" defaultValue={90} className="field" />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-[13px]">
              <input type="checkbox" name="isInternational" className="accent-[var(--brand)]" /> Yurt dışı
            </label>
          </div>
        </ActionForm>
      </Panel>
      <Table head={["Rota", "Etiketler", "Aktif teklif", "En düşük", "Son kontrol", ""]}>
        {routes.map((r) => {
          const s = stats.find((x) => x.routeId === r.id);
          return (
            <tr key={r.id} className={r.isActive ? "" : "opacity-60"}>
              <Td className="font-mono font-semibold">
                {r.origin} → {r.destination}
              </Td>
              <Td className="text-[12px]">{r.tags.join(", ")}</Td>
              <Td>{s?._count ?? 0}</Td>
              <Td className="tabular">{s?._min.priceMinor ? formatMoney(s._min.priceMinor) : "—"}</Td>
              <Td>
                <Freshness at={s?._max.checkedAt ?? null} windowMinutes={720} compact />
              </Td>
              <Td>
                <form action={toggleRoute.bind(null, r.id)}>
                  <SubmitButton variant="secondary">{r.isActive ? "Durdur" : "Etkinleştir"}</SubmitButton>
                </form>
              </Td>
            </tr>
          );
        })}
      </Table>
    </AdminPage>
  );
}
