import { addCategoryMapping, deleteCategoryMapping, upsertCategory } from "@/app/admin/actions";
import { AdminPage, Field, Panel, SubmitButton, Table, Td } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { Icon } from "@/components/icons";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Kategoriler" };

type Cat = Awaited<ReturnType<typeof load>>[number];
async function load() {
  return db.category.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }], include: { _count: { select: { products: true } } } });
}

function CategoryForm({ c, parents }: { c?: Cat; parents: Cat[] }) {
  return (
    <ActionForm action={upsertCategory} submitLabel={c ? "Güncelle" : "Kategori ekle"}>
      {c ? <input type="hidden" name="categoryId" value={c.id} /> : null}
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Ad">
          <input name="name" defaultValue={c?.name} required className="field" />
        </Field>
        <Field label="Slug">
          <input name="slug" defaultValue={c?.slug} required pattern="[a-z0-9-]+" className="field font-mono" />
        </Field>
        <Field label="Üst kategori">
          <select name="parentId" defaultValue={c?.parentId ?? ""} className="field">
            <option value="">— (ana kategori)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="İkon anahtarı / sıra">
          <div className="flex gap-2">
            <input name="icon" defaultValue={c?.icon ?? ""} className="field font-mono" />
            <input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className="field w-20" />
          </div>
        </Field>
      </div>
      <Field label="Otomatik sınıflandırma anahtar kelimeleri (virgülle)">
        <input name="keywords" defaultValue={c?.keywords.join(", ")} className="field" />
      </Field>
      <Field label="Açıklama">
        <input name="description" defaultValue={c?.description ?? ""} className="field" />
      </Field>
      <Field label='Kategoriye özel filtreler (JSON dizi: [{"key":"Panel","label":"Panel","source":"spec"}])'>
        <textarea name="filterSchema" rows={3} defaultValue={JSON.stringify(c?.filterSchema ?? [])} className="field font-mono text-[12px]" />
      </Field>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="isActive" defaultChecked={c ? c.isActive : true} className="accent-[var(--brand)]" /> Aktif
      </label>
    </ActionForm>
  );
}

export default async function AdminCategories() {
  await requireStaff("ADMIN");
  const [cats, mappings] = await Promise.all([load(), db.categoryMapping.findMany({ include: { category: { select: { name: true } } }, orderBy: { priority: "desc" } })]);
  const parents = cats.filter((c) => !c.parentId);
  return (
    <AdminPage title="Kategoriler" description="Kategori ağacı yönetim panelinden genişletilebilir. Eşlemeler, kaynakların kategori yollarını platform kategorilerine bağlar (ör. “bilgisayar > mouse” → Oyuncu fareleri).">
      <Panel title="Yeni kategori">
        <CategoryForm parents={parents} />
      </Panel>
      <Panel title="Kategori ağacı">
        <div className="space-y-2">
          {parents.map((p) => (
            <details key={p.id} className="rounded-md border border-line">
              <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 font-medium">
                <Icon name={p.icon ?? "grid"} className="size-4 text-ink-3" /> {p.name}
                <span className="text-[12px] font-normal text-ink-3">· {cats.filter((c) => c.parentId === p.id).length} alt kategori</span>
              </summary>
              <div className="space-y-3 border-t border-line p-3">
                <details>
                  <summary className="cursor-pointer text-[12.5px] text-brand-ink">Ana kategoriyi düzenle</summary>
                  <div className="mt-3">
                    <CategoryForm c={p} parents={parents} />
                  </div>
                </details>
                {cats
                  .filter((c) => c.parentId === p.id)
                  .map((c) => (
                    <details key={c.id} className="rounded-md bg-surface-2 px-3 py-2">
                      <summary className="flex cursor-pointer items-center gap-2 text-[13px]">
                        <Icon name={c.icon ?? "spark"} className="size-4 text-ink-3" /> {c.name}
                        <span className="font-mono text-[11px] text-ink-3">
                          {c.slug} · {c._count.products} ürün {c.isActive ? "" : "· pasif"}
                        </span>
                      </summary>
                      <div className="mt-3">
                        <CategoryForm c={c} parents={parents} />
                      </div>
                    </details>
                  ))}
              </div>
            </details>
          ))}
        </div>
      </Panel>
      <Panel title="Kaynak kategori eşlemeleri">
        <ActionForm action={addCategoryMapping} submitLabel="Eşleme ekle" className="mb-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Kaynak yolunda geçen ifade">
              <input name="pattern" required placeholder="ör. oyuncu mouse" className="field" />
            </Field>
            <Field label="Platform kategorisi">
              <select name="categoryId" className="field">
                {cats
                  .filter((c) => c.parentId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Yalnızca kaynak (anahtar, isteğe bağlı)">
              <input name="dataSourceKey" placeholder="amazon-tr" className="field font-mono" />
            </Field>
            <Field label="Öncelik">
              <input name="priority" type="number" defaultValue={10} className="field" />
            </Field>
          </div>
        </ActionForm>
        <Table head={["İfade", "Kategori", "Kaynak", "Öncelik", ""]} empty={mappings.length ? undefined : "Eşleme yok."}>
          {mappings.map((m) => (
            <tr key={m.id}>
              <Td className="font-mono">{m.pattern}</Td>
              <Td>{m.category.name}</Td>
              <Td className="font-mono text-[12px]">{m.dataSourceKey ?? "tümü"}</Td>
              <Td>{m.priority}</Td>
              <Td>
                <form action={deleteCategoryMapping.bind(null, m.id)}>
                  <SubmitButton variant="danger">Sil</SubmitButton>
                </form>
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </AdminPage>
  );
}
