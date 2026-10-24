import Link from "next/link";
import { notFound } from "next/navigation";
import { retryJob } from "@/app/admin/actions";
import { AdminPage, Panel, StatusBadge, SubmitButton } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { jobLabel } from "@/server/jobs/registry";

export const metadata = { title: "Görev" };

export default async function AdminJob(props: PageProps<"/admin/gorevler/[id]">) {
  await requireStaff("ADMIN");
  const { id } = await props.params;
  const job = await db.ingestionJob.findUnique({ where: { id }, include: { dataSource: true, logs: { orderBy: { createdAt: "asc" }, take: 500 } } });
  if (!job) notFound();
  return (
    <AdminPage
      title={jobLabel(job.type)}
      description={
        <>
          {job.dataSource ? (
            <Link href={`/admin/kaynaklar/${job.dataSource.id}`} className="text-brand-ink underline">
              {job.dataSource.name}
            </Link>
          ) : (
            "Genel görev"
          )}{" "}
          · tetikleyen {job.trigger} · <code>{job.dedupeKey}</code>
        </>
      }
      actions={
        job.status === "FAILED" ? (
          <form action={retryJob.bind(null, job.id)}>
            <SubmitButton>Güvenli şekilde yeniden çalıştır</SubmitButton>
          </form>
        ) : null
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Panel>
          <p className="text-[12px] text-ink-3">Durum</p>
          <StatusBadge status={job.status} />
        </Panel>
        <Panel>
          <p className="text-[12px] text-ink-3">Deneme</p>
          <p className="font-mono">
            {job.attempt}/{job.maxAttempts}
          </p>
        </Panel>
        <Panel>
          <p className="text-[12px] text-ink-3">Başlangıç / bitiş</p>
          <p className="text-[12.5px]">
            {job.startedAt ? formatDateTime(job.startedAt) : "—"}
            <br />
            {job.finishedAt ? formatDateTime(job.finishedAt) : "—"}
          </p>
        </Panel>
        <Panel>
          <p className="text-[12px] text-ink-3">Süre</p>
          <p className="font-mono">{job.durationMs !== null ? `${(job.durationMs / 1000).toFixed(1)} sn` : "—"}</p>
        </Panel>
      </div>
      {job.error ? (
        <Panel title="Hata">
          <p className="font-mono text-[12.5px] text-bad-ink">{job.error}</p>
        </Panel>
      ) : null}
      <Panel title="İstatistikler">
        <pre className="overflow-x-auto rounded-md bg-surface-2 p-3 font-mono text-[12px]">{JSON.stringify(job.stats ?? {}, null, 2)}</pre>
      </Panel>
      <Panel title="Günlük">
        {job.logs.length ? (
          <ul className="space-y-1 font-mono text-[11.5px]">
            {job.logs.map((l) => (
              <li key={String(l.id)} className={l.level === "ERROR" ? "text-bad-ink" : l.level === "WARN" ? "text-warn-ink" : "text-ink-2"}>
                {formatDateTime(l.createdAt)} {l.level} {l.message}
                {l.context ? <span className="text-ink-3"> {JSON.stringify(l.context).slice(0, 300)}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-3">Günlük kaydı yok.</p>
        )}
      </Panel>
    </AdminPage>
  );
}
