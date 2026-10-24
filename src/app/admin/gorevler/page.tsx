import Link from "next/link";
import { cancelJob, retryJob, runScheduleNow, updateSchedule } from "@/app/admin/actions";
import { AdminPage, Panel, StatusBadge, SubmitButton, Table, Td } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { formatDateTime, formatRelative } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { jobLabel } from "@/server/jobs/registry";

export const metadata = { title: "Görevler ve zamanlama" };

export default async function AdminJobs(props: PageProps<"/admin/gorevler">) {
  await requireStaff("ADMIN");
  const sp = await props.searchParams;
  const status = typeof sp.durum === "string" && ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"].includes(sp.durum) ? (sp.durum as "FAILED") : undefined;
  const [jobs, schedules] = await Promise.all([
    db.ingestionJob.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 80, include: { dataSource: { select: { name: true } } } }),
    db.jobSchedule.findMany({ orderBy: [{ dataSourceId: "asc" }, { key: "asc" }], include: { dataSource: { select: { name: true, isEnabled: true, status: true } } } }),
  ]);
  return (
    <AdminPage title="Görevler ve zamanlama" description="Görevler sunucu tarafında (worker veya HTTP cron) çalışır; tarayıcıya bağlı değildir. Aynı kaynak için aynı anda tek görev çalışır; başarısız görevler üstel geri çekilmeyle sınırlı sayıda yeniden denenir.">
      <Panel title="Zamanlamalar">
        <Table head={["Görev", "Kaynak", "Sıklık (dk)", "Sonraki çalışma", "İşlem"]}>
          {schedules.map((s) => (
            <tr key={s.id}>
              <Td>
                <p className="font-medium">{jobLabel(s.type)}</p>
                <p className="text-[11.5px] text-ink-3">{s.description}</p>
              </Td>
              <Td className="text-[12.5px]">{s.dataSource?.name ?? "Genel"}</Td>
              <Td>
                <ActionForm action={updateSchedule} submitLabel="Kaydet" className="flex flex-wrap items-center gap-2 space-y-0">
                  <input type="hidden" name="scheduleId" value={s.id} />
                  <input name="intervalMinutes" type="number" defaultValue={s.intervalMinutes} className="field h-8 w-24" aria-label="Sıklık (dakika)" />
                  <label className="flex items-center gap-1 text-[12px]">
                    <input type="checkbox" name="isEnabled" defaultChecked={s.isEnabled} className="accent-[var(--brand)]" /> açık
                  </label>
                </ActionForm>
              </Td>
              <Td className="text-[12px]">{s.isEnabled ? formatRelative(s.nextRunAt) : "kapalı"}</Td>
              <Td>
                <form action={runScheduleNow.bind(null, s.id)}>
                  <SubmitButton variant="secondary">Şimdi</SubmitButton>
                </form>
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel
        title="Görev geçmişi"
        actions={
          <div className="flex gap-1.5 text-[12px]">
            {["", "FAILED", "RUNNING", "QUEUED", "SUCCEEDED"].map((s) => (
              <Link key={s} href={s ? `?durum=${s}` : "?"} className={`rounded-full border px-2.5 py-1 ${(status ?? "") === s ? "border-ink bg-ink text-bg" : "border-line"}`}>
                {s ? <StatusBadge status={s} /> : "Tümü"}
              </Link>
            ))}
          </div>
        }
      >
        <Table head={["Görev", "Kaynak", "Durum", "Deneme", "Süre", "Oluşturulma", "Hata", ""]} empty={jobs.length ? undefined : "Görev yok."}>
          {jobs.map((j) => (
            <tr key={j.id}>
              <Td>
                <Link href={`/admin/gorevler/${j.id}`} className="font-medium hover:text-brand-ink">
                  {jobLabel(j.type)}
                </Link>
                <span className="block font-mono text-[11px] text-ink-3">{j.trigger}</span>
              </Td>
              <Td className="text-[12.5px]">{j.dataSource?.name ?? "—"}</Td>
              <Td>
                <StatusBadge status={j.status} />
              </Td>
              <Td className="font-mono text-[12px]">
                {j.attempt}/{j.maxAttempts}
              </Td>
              <Td className="font-mono text-[12px]">{j.durationMs !== null ? `${(j.durationMs / 1000).toFixed(1)} sn` : "—"}</Td>
              <Td className="text-[12px]">{formatDateTime(j.createdAt)}</Td>
              <Td className="max-w-[260px]">
                <span className="line-clamp-2 text-[12px] text-bad-ink">{j.error ?? ""}</span>
              </Td>
              <Td>
                {j.status === "FAILED" || j.status === "CANCELLED" ? (
                  <form action={retryJob.bind(null, j.id)}>
                    <SubmitButton variant="secondary">Yeniden çalıştır</SubmitButton>
                  </form>
                ) : j.status === "QUEUED" ? (
                  <form action={cancelJob.bind(null, j.id)}>
                    <SubmitButton variant="secondary">İptal</SubmitButton>
                  </form>
                ) : null}
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </AdminPage>
  );
}
