import Link from "next/link";
import { notFound } from "next/navigation";
import { upsertEditorial } from "@/app/admin/actions";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { EDITORIAL_TYPE_LABEL } from "@/lib/editorial";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "İçerik düzenle" };

export default async function AdminEditorialEdit(props: PageProps<"/admin/icerik/[id]">) {
  await requireStaff("EDITOR");
  const { id } = await props.params;
  const sp = await props.searchParams;
  const isNew = id === "yeni";
  const c = isNew ? null : await db.editorialContent.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" }, include: { product: { select: { slug: true } } } } } });
  if (!isNew && !c) notFound();
  const itemLines = (c?.items ?? []).map((i) => `${i.product ? i.product.slug : `rota:${i.routeOrigin}-${i.routeDestination}`}${i.note ? ` | ${i.note}` : ""}`).join("\n");
  return (
    <AdminPage
      title={isNew ? "Yeni editoryal içerik" : (c?.title ?? "")}
      description={
        c?.status === "PUBLISHED" ? (
          <Link href={`/rehber/${c.slug}`} className="text-brand-ink underline">
            Yayındaki sayfayı görüntüle
          </Link>
        ) : (
          "Taslaklar sitede görünmez."
        )
      }
    >
      {sp.kaydedildi ? <p className="rounded-md bg-good-soft px-3 py-2 text-[13px] text-good-ink">Kaydedildi.</p> : null}
      <Panel>
        <ActionForm action={upsertEditorial} submitLabel="Kaydet">
          {c ? <input type="hidden" name="contentId" value={c.id} /> : null}
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Tür">
              <select name="type" defaultValue={c?.type ?? "GUIDE"} className="field">
                {Object.entries(EDITORIAL_TYPE_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Başlık">
              <input name="title" defaultValue={c?.title} required className="field" />
            </Field>
            <Field label="Slug">
              <input name="slug" defaultValue={c?.slug} required pattern="[a-z0-9-]+" className="field font-mono" />
            </Field>
          </div>
          <Field label="Özet">
            <textarea name="summary" rows={2} defaultValue={c?.summary} required className="field" />
          </Field>
          <Field label="Metin (sınırlı Markdown: ## başlık, - liste, **kalın**, [bağlantı](/yol))">
            <textarea name="body" rows={12} defaultValue={c?.body} className="field font-mono text-[12.5px]" />
          </Field>
          <Field label="Seçimler — her satır: ürün-slug | not   veya   rota:IST-AYT | not" hint="Kartlarda her zaman güncel doğrulanmış fiyat gösterilir; seçim anındaki fiyat değil.">
            <textarea name="items" rows={6} defaultValue={itemLines} className="field font-mono text-[12.5px]" />
          </Field>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Durum">
              <select name="status" defaultValue={c?.status ?? "DRAFT"} className="field">
                <option value="DRAFT">Taslak</option>
                <option value="PUBLISHED">Yayında</option>
                <option value="ARCHIVED">Arşiv</option>
              </select>
            </Field>
            <Field label="SEO başlığı">
              <input name="seoTitle" defaultValue={c?.seoTitle ?? ""} className="field" />
            </Field>
            <Field label="SEO açıklaması">
              <input name="seoDescription" defaultValue={c?.seoDescription ?? ""} className="field" />
            </Field>
          </div>
        </ActionForm>
      </Panel>
    </AdminPage>
  );
}
