import { setUserRole } from "@/app/admin/actions";
import { AdminPage, SubmitButton, Table, Td } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Kullanıcılar" };

export default async function AdminUsers(props: PageProps<"/admin/kullanicilar">) {
  const me = await requireStaff("ADMIN");
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const [users, total] = await Promise.all([
    db.user.findMany({ where: q ? { email: { contains: q } } : {}, orderBy: { createdAt: "desc" }, take: 100, include: { _count: { select: { priceAlerts: true, favorites: true } } } }),
    db.user.count(),
  ]);
  return (
    <AdminPage title="Kullanıcılar" description={`${total} kayıtlı kullanıcı. Kişisel veriler yalnızca gerektiği kadar gösterilir; rol değişiklikleri denetim kaydına yazılır ve kullanıcının oturumları kapatılır.`}>
      <form>
        <input name="q" defaultValue={q} placeholder="E-posta ara" className="field h-9 max-w-xs" />
      </form>
      <Table head={["E-posta", "Rol", "Alarm / favori", "Kayıt", "Son giriş", "Rol değiştir"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td>{u.email}</Td>
            <Td className="font-mono text-[12px]">{u.role}</Td>
            <Td>
              {u._count.priceAlerts} / {u._count.favorites}
            </Td>
            <Td className="text-[12px]">{formatDateTime(u.createdAt)}</Td>
            <Td className="text-[12px]">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</Td>
            <Td>
              {u.id === me.id ? (
                <span className="text-[12px] text-ink-3">siz</span>
              ) : (
                <div className="flex gap-1">
                  {(["USER", "EDITOR", "ADMIN"] as const)
                    .filter((r) => r !== u.role)
                    .map((r) => (
                      <form key={r} action={setUserRole.bind(null, u.id, r)}>
                        <SubmitButton variant="secondary">{r === "USER" ? "Kullanıcı" : r === "EDITOR" ? "Editör" : "Yönetici"}</SubmitButton>
                      </form>
                    ))}
                </div>
              )}
            </Td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
