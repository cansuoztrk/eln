import Link from "next/link";
import { AdminPage, Table, Td } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Denetim kaydı" };

export default async function AdminAudit(props: PageProps<"/admin/denetim">) {
  await requireStaff("ADMIN");
  const sp = await props.searchParams;
  const action = typeof sp.islem === "string" ? sp.islem : "";
  const rows = await db.adminAuditLog.findMany({ where: action ? { action: { startsWith: action } } : {}, orderBy: { createdAt: "desc" }, take: 200, include: { actor: { select: { email: true } } } });
  const groups = ["offer", "product", "match", "source", "job", "schedule", "scoring", "category", "coupon", "editorial", "route", "sponsored", "retailer", "user"];
  return (
    <AdminPage title="Denetim kaydı" description="Yönetim panelinde yapılan her değişiklik (önce/sonra değerleri ve gerekçesiyle) burada saklanır.">
      <nav className="flex flex-wrap gap-1.5 text-[12px]">
        <Link href="?" className={`rounded-full border px-2.5 py-1 ${!action ? "border-ink bg-ink text-bg" : "border-line"}`}>
          Tümü
        </Link>
        {groups.map((g) => (
          <Link key={g} href={`?islem=${g}`} className={`rounded-full border px-2.5 py-1 font-mono ${action === g ? "border-ink bg-ink text-bg" : "border-line"}`}>
            {g}
          </Link>
        ))}
      </nav>
      <Table head={["Zaman", "Kişi", "İşlem", "Kayıt", "Ayrıntı"]} empty={rows.length ? undefined : "Kayıt yok."}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="whitespace-nowrap text-[12px]">{formatDateTime(r.createdAt)}</Td>
            <Td className="text-[12.5px]">{r.actor?.email ?? "—"}</Td>
            <Td className="font-mono text-[12px]">{r.action}</Td>
            <Td className="font-mono text-[11.5px] text-ink-3">
              {r.entityType} {r.entityId}
            </Td>
            <Td>
              {r.reason ? <p className="text-[12.5px]">Neden: {r.reason}</p> : null}
              <details>
                <summary className="cursor-pointer text-[12px] text-brand-ink">önce / sonra</summary>
                <pre className="mt-1 max-w-[520px] overflow-x-auto rounded bg-surface-2 p-2 font-mono text-[11px]">{JSON.stringify({ before: r.before, after: r.after }, null, 2)}</pre>
              </details>
            </Td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
