import { addPlacement, endPlacement } from "@/app/admin/actions";
import { AdminPage, Field, Panel, SubmitButton, Table, Td } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { formatDate } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Sponsorlu yerleşimler" };

export default async function AdminSponsored() {
  await requireStaff("ADMIN");
  const rows = await db.sponsoredPlacement.findMany({ orderBy: { startsAt: "desc" }, include: { product: { select: { title: true, slug: true } } } });
  const today = new Date().toISOString().slice(0, 10);
  return (
    <AdminPage title="Sponsorlu yerleşimler" description="Para karşılığı öne çıkarılan ürünler her yerde “Sponsorlu” olarak işaretlenir, doğal sıralamadan ayrı tutulur ve fırsat puanını etkilemez. Sponsorlu tıklamalar popülerlik hesabına katılmaz.">
      <Panel title="Yeni yerleşim">
        <ActionForm action={addPlacement} submitLabel="Ekle">
          <div className="grid gap-3 md:grid-cols-5">
            <Field label="Ürün slug">
              <input name="productSlug" required className="field font-mono" />
            </Field>
            <Field label="Sponsor">
              <input name="sponsorName" required className="field" />
            </Field>
            <Field label="Yer">
              <input name="slot" defaultValue="home" className="field font-mono" />
            </Field>
            <Field label="Başlangıç">
              <input name="startsAt" type="date" defaultValue={today} required className="field" />
            </Field>
            <Field label="Bitiş">
              <input name="endsAt" type="date" required className="field" />
            </Field>
          </div>
        </ActionForm>
      </Panel>
      <Table head={["Ürün", "Sponsor", "Yer", "Tarih", "Durum", ""]} empty={rows.length ? undefined : "Sponsorlu yerleşim yok."}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td>{r.product.title}</Td>
            <Td>{r.sponsorName}</Td>
            <Td className="font-mono text-[12px]">{r.slot}</Td>
            <Td className="text-[12px]">
              {formatDate(r.startsAt)} – {formatDate(r.endsAt)}
            </Td>
            <Td>{r.isActive && r.endsAt > new Date() ? "Aktif" : "Bitti"}</Td>
            <Td>
              {r.isActive ? (
                <form action={endPlacement.bind(null, r.id)}>
                  <SubmitButton variant="secondary">Sonlandır</SubmitButton>
                </form>
              ) : null}
            </Td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
