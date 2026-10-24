import Link from "next/link";
import { AdminPage, StatusBadge, Table, Td } from "@/components/admin/ui";
import { EDITORIAL_TYPE_LABEL } from "@/lib/editorial";
import { formatDateTime } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Editoryal içerik" };

export default async function AdminEditorial() {
  await requireStaff("EDITOR");
  const items = await db.editorialContent.findMany({ orderBy: { updatedAt: "desc" }, include: { author: { select: { email: true } }, _count: { select: { items: true } } } });
  return (
    <AdminPage
      title="Editoryal içerik"
      description="Günün/haftanın seçimleri, rehberler ve karşılaştırmalar. Editoryal içerik otomatik fırsatlardan ayrı gösterilir; “Editörün seçimi” etiketi yalnızca buradan seçilen ürünlerde görünür."
      actions={
        <Link href="/admin/icerik/yeni" className="inline-flex h-9 items-center rounded-md bg-brand px-3.5 text-[13px] font-semibold text-on-brand">
          Yeni içerik
        </Link>
      }
    >
      <Table head={["Başlık", "Tür", "Durum", "Seçim", "Yazar", "Güncelleme"]} empty={items.length ? undefined : "Henüz içerik yok."}>
        {items.map((c) => (
          <tr key={c.id}>
            <Td>
              <Link href={`/admin/icerik/${c.id}`} className="font-medium hover:text-brand-ink">
                {c.title}
              </Link>
              <span className="block font-mono text-[11px] text-ink-3">/rehber/{c.slug}</span>
            </Td>
            <Td className="text-[12.5px]">{EDITORIAL_TYPE_LABEL[c.type]}</Td>
            <Td>
              <StatusBadge status={c.status} />
            </Td>
            <Td>{c._count.items}</Td>
            <Td className="text-[12px]">{c.author?.email ?? "—"}</Td>
            <Td className="text-[12px]">{formatDateTime(c.updatedAt)}</Td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
