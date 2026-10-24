import Link from "next/link";
import { notFound } from "next/navigation";
import { runSourceNow, testSource, updateSource } from "@/app/admin/actions";
import { AdminPage, Field, MiniBars, Panel, StatusBadge, SubmitButton, Table, Td } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { daysAgo, formatDateTime, formatShortDate } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { getFlightAdapter, getRetailAdapter } from "@/server/integrations/registry";
import { toSourceRecord } from "@/server/ingestion/retail";
import { jobLabel } from "@/server/jobs/registry";
import { secretFromEnvSafe } from "@/server/secrets";

export const metadata = { title: "Veri kaynağı" };

export default async function AdminSource(props: PageProps<"/admin/kaynaklar/[id]">) {
  await requireStaff("ADMIN");
  const { id } = await props.params;
  const s = await db.dataSource.findUnique({ where: { id }, include: { retailer: true } });
  if (!s) notFound();
  const adapter = s.kind === "FLIGHT" ? getFlightAdapter(s.adapter) : getRetailAdapter(s.adapter);
  const check = adapter?.checkConfiguration(toSourceRecord(s), secretFromEnvSafe);
  const [jobs, logs, usage] = await Promise.all([
    db.ingestionJob.findMany({ where: { dataSourceId: s.id }, orderBy: { createdAt: "desc" }, take: 15 }),
    db.ingestionLog.findMany({ where: { dataSourceId: s.id, level: { in: ["WARN", "ERROR"] } }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.apiUsage.findMany({ where: { dataSourceId: s.id, day: { gte: daysAgo(14) } }, orderBy: { day: "asc" } }),
  ]);
  return (
    <AdminPage
      title={s.name}
      description={
        <>
          Adaptör <code>{s.adapter}</code> · anahtar <code>{s.key}</code>
          {adapter ? (
            <>
              {" "}
              ·{" "}
              <a href={adapter.docsUrl} target="_blank" rel="noopener" className="text-brand-ink underline">
                resmî dokümantasyon
              </a>
            </>
          ) : null}
        </>
      }
      actions={
        <>
          {s.kind === "FLIGHT" ? (
            <form action={runSourceNow.bind(null, s.id, "flights.refresh-routes")}>
              <SubmitButton>Rotaları şimdi yenile</SubmitButton>
            </form>
          ) : (
            <>
              <form action={runSourceNow.bind(null, s.id, "retail.refresh")}>
                <SubmitButton>Fiyat kontrolü çalıştır</SubmitButton>
              </form>
              <form action={runSourceNow.bind(null, s.id, "retail.full-sync")}>
                <SubmitButton variant="secondary">Kapsamlı senkron</SubmitButton>
              </form>
            </>
          )}
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Bağlantı durumu">
          <div className="flex items-center gap-3">
            <StatusBadge status={s.isEnabled ? s.status : "DISABLED"} />
            <span className="text-[13px] text-ink-2">{check?.message}</span>
          </div>
          {check?.missing.length ? (
            <p className="mt-2 text-[12.5px] text-warn-ink">
              Eksik ortam değişkenleri: <code>{check.missing.join(", ")}</code>
            </p>
          ) : null}
          {adapter ? <p className="mt-3 text-[12.5px] text-ink-2">{adapter.description}</p> : null}
          {s.notes ? <p className="mt-2 text-[12.5px] text-ink-3">{s.notes}</p> : null}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[12.5px]">
            <div>
              <dt className="text-ink-3">Son çalışma</dt>
              <dd>{s.lastRunAt ? formatDateTime(s.lastRunAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Son başarılı</dt>
              <dd>{s.lastSuccessAt ? formatDateTime(s.lastSuccessAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Son görülen / güncellenen kayıt</dt>
              <dd>
                {s.lastItemsSeen ?? "—"} / {s.lastItemsUpdated ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-3">Son hata</dt>
              <dd className="text-bad-ink">{s.lastError ?? "—"}</dd>
            </div>
          </dl>
          <ActionForm action={testSource} submitLabel="Yapılandırmayı kontrol et" className="mt-4">
            <input type="hidden" name="sourceId" value={s.id} />
          </ActionForm>
        </Panel>
        <Panel title="API kullanımı (14 gün)">
          {usage.length ? (
            <MiniBars
              data={usage.map((u) => ({ label: formatShortDate(u.day), values: [u.requests, u.errors + u.rateLimited] }))}
              series={[
                { name: "İstek", color: "var(--series-1)" },
                { name: "Hata + 429", color: "var(--series-2)" },
              ]}
            />
          ) : (
            <p className="text-[13px] text-ink-3">Henüz istek kaydı yok.</p>
          )}
        </Panel>
      </div>

      <Panel title="Ayarlar">
        <ActionForm action={updateSource} submitLabel="Ayarları kaydet">
          <input type="hidden" name="sourceId" value={s.id} />
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Field label="Fiyat kontrolü (dk)">
              <input name="refreshIntervalMinutes" type="number" defaultValue={s.refreshIntervalMinutes} className="field" />
            </Field>
            <Field label="Kapsamlı senkron (dk)">
              <input name="fullSyncIntervalMinutes" type="number" defaultValue={s.fullSyncIntervalMinutes} className="field" />
            </Field>
            <Field label="Tazelik penceresi (dk)" hint="Bu süreden eski fiyat aktif gösterilmez">
              <input name="freshnessWindowMinutes" type="number" defaultValue={s.freshnessWindowMinutes} className="field" />
            </Field>
            <Field label="Dakika başına istek">
              <input name="rateLimitPerMinute" type="number" defaultValue={s.rateLimitPerMinute} className="field" />
            </Field>
            <Field label="Günlük kota (boş = yok)">
              <input name="dailyQuota" type="number" defaultValue={s.dailyQuota ?? ""} className="field" />
            </Field>
            <Field label="Kaynak durdurma eşiği" hint="Ardışık hata sayısı">
              <input name="maxConsecutiveFailures" type="number" defaultValue={s.maxConsecutiveFailures} className="field" />
            </Field>
          </div>
          <Field label="Yapılandırma (JSON — gizli değer YAZMAYIN; yalnızca ortam değişkeni adları)">
            <textarea name="config" rows={8} defaultValue={JSON.stringify(s.config, null, 2)} className="field font-mono text-[12px]" />
          </Field>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="isEnabled" defaultChecked={s.isEnabled} className="accent-[var(--brand)]" /> Kaynak etkin
          </label>
        </ActionForm>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Son görevler">
          <Table head={["Görev", "Durum", "Süre", "Zaman"]}>
            {jobs.map((j) => (
              <tr key={j.id}>
                <Td>
                  <Link href={`/admin/gorevler/${j.id}`} className="hover:text-brand-ink">
                    {jobLabel(j.type)}
                  </Link>
                  <span className="block text-[11px] text-ink-3">{j.trigger}</span>
                </Td>
                <Td>
                  <StatusBadge status={j.status} />
                </Td>
                <Td className="font-mono text-[12px]">{j.durationMs !== null ? `${(j.durationMs / 1000).toFixed(1)} sn` : "—"}</Td>
                <Td className="text-[12px]">{formatDateTime(j.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Uyarı ve hata günlüğü">
          {logs.length ? (
            <ul className="space-y-1.5 font-mono text-[11.5px]">
              {logs.map((l) => (
                <li key={String(l.id)} className={l.level === "ERROR" ? "text-bad-ink" : "text-warn-ink"}>
                  {formatDateTime(l.createdAt)} {l.level} {l.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-3">Uyarı yok.</p>
          )}
        </Panel>
      </div>
    </AdminPage>
  );
}
