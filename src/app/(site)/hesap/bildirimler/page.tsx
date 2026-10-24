import type { Metadata } from "next";
import Link from "next/link";
import { markAllNotificationsRead } from "@/app/actions/account";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/time";

export const metadata: Metadata = { title: "Bildirimler", robots: { index: false } };

const ICON: Record<string, string> = { PRICE_ALERT: "bell", FLIGHT_ALERT: "plane", DIGEST: "spark", SYSTEM: "info" };

export default async function NotificationsPage() {
  const user = await requireUser("/hesap/bildirimler");
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100, include: { emails: { select: { status: true } } } });
  const unread = items.filter((i) => !i.readAt).length;
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-[20px] font-[650]">Bildirimler</h2>
        {unread ? (
          <form action={markAllNotificationsRead}>
            <button className="text-[13px] font-medium text-brand-ink hover:underline">Tümünü okundu işaretle</button>
          </form>
        ) : null}
      </div>
      {items.length ? (
        <ul className="card divide-y divide-line">
          {items.map((n) => (
            <li key={n.id} className={cn("flex gap-3 p-4", !n.readAt && "bg-brand-soft/30")}>
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
                <Icon name={ICON[n.type] ?? "info"} className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {n.title}
                  {!n.readAt ? <span className="size-2 rounded-full bg-brand" aria-label="okunmamış" /> : null}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-[13px] text-ink-2">{n.body}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-ink-3">
                  <span>{formatRelative(n.createdAt)}</span>
                  {n.emails[0] ? <span>E-posta: {n.emails[0].status === "SENT" ? "gönderildi" : n.emails[0].status === "PENDING" ? "kuyrukta" : n.emails[0].status === "SKIPPED" ? "gönderilmedi (e-posta sağlayıcısı yapılandırılmamış)" : "başarısız"}</span> : null}
                  {n.link ? (
                    <Link href={n.link} className="font-medium text-brand-ink hover:underline">
                      Görüntüle
                    </Link>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="bell" title="Bildirim yok">
          Fiyat alarmlarınız tetiklendiğinde ve haftalık özet gönderildiğinde burada görünür.
        </EmptyState>
      )}
    </section>
  );
}
