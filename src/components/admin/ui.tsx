import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Badge, type Tone } from "../ui/badge";

export function AdminPage({ title, description, actions, children }: { title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-[680] tracking-tight">{title}</h1>
          {description ? <p className="mt-1 max-w-3xl text-[13px] text-ink-2">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("card p-4", className)}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone, href }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "good" | "warn" | "bad"; href?: string }) {
  const body = (
    <>
      <p className="text-[12px] text-ink-3">{label}</p>
      <p className={cn("mt-1 font-display text-[26px] font-[650] leading-none", tone === "bad" && "text-bad-ink", tone === "warn" && "text-warn-ink", tone === "good" && "text-good-ink")}>{value}</p>
      {hint ? <p className="mt-1.5 text-[11.5px] text-ink-3">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 hover:border-line-strong">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full text-[13px]">
        <thead className="border-b border-line bg-surface-2 text-left text-[11.5px] text-ink-3">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty ? <p className="p-6 text-center text-[13px] text-ink-3">{empty}</p> : null}
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-top", className)}>{children}</td>;
}

const STATUS_TONE: Record<string, [string, Tone]> = {
  CONNECTED: ["Bağlı", "positive"],
  TEST_ONLY: ["Test", "warning"],
  DEGRADED: ["Sorunlu", "danger"],
  AWAITING_CREDENTIALS: ["Anahtar bekliyor", "neutral"],
  AWAITING_INTEGRATION: ["Entegrasyon bekliyor", "neutral"],
  DISABLED: ["Kapalı", "outline"],
  QUEUED: ["Kuyrukta", "neutral"],
  RUNNING: ["Çalışıyor", "brand"],
  SUCCEEDED: ["Başarılı", "positive"],
  FAILED: ["Başarısız", "danger"],
  CANCELLED: ["İptal", "outline"],
  ACTIVE: ["Aktif", "positive"],
  REVALIDATING: ["Doğrulanıyor", "warning"],
  STALE: ["Eski", "warning"],
  OUT_OF_STOCK: ["Stok yok", "neutral"],
  EXPIRED: ["Kalktı", "outline"],
  PENDING: ["Bekliyor", "warning"],
  APPROVED: ["Onaylandı", "positive"],
  REJECTED: ["Reddedildi", "outline"],
  DRAFT: ["Taslak", "neutral"],
  PUBLISHED: ["Yayında", "positive"],
  ARCHIVED: ["Arşiv", "outline"],
  VERIFIED: ["Doğrulandı", "positive"],
  UNVERIFIED: ["Doğrulanmadı", "neutral"],
};

export function StatusBadge({ status }: { status: string }) {
  const [label, tone] = STATUS_TONE[status] ?? [status, "neutral" as Tone];
  return <Badge tone={tone}>{label}</Badge>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block text-[13px]">
      <span className="mb-1 block font-medium text-ink-2">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-ink-3">{hint}</span> : null}
    </label>
  );
}

export function SubmitButton({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "danger" | "secondary" }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-semibold",
        variant === "primary" && "bg-brand text-on-brand hover:bg-brand-ink",
        variant === "danger" && "bg-bad-soft text-bad-ink hover:bg-bad hover:text-white",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

/** Basit sütun grafiği (sunucu tarafı SVG): ≤24 px çubuk, tek eksen, yerel ipucu (title). */
export function MiniBars({ data, series, height = 140, format = (v: number) => v.toLocaleString("tr-TR") }: { data: { label: string; values: number[] }[]; series: { name: string; color: string }[]; height?: number; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  const w = 560;
  const m = { l: 34, r: 8, t: 8, b: 22 };
  const innerH = height - m.t - m.b;
  const band = (w - m.l - m.r) / Math.max(1, data.length);
  const barW = Math.min(24, (band - 10) / series.length - 2);
  const ticks = [0, Math.round(max / 2), max];
  return (
    <div>
      {series.length > 1 ? (
        <ul className="mb-2 flex gap-4 text-[12px] text-ink-2">
          {series.map((s) => (
            <li key={s.name} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      ) : null}
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="Sütun grafiği">
        {ticks.map((t) => {
          const y = m.t + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line x1={m.l} x2={w - m.r} y1={y} y2={y} stroke="var(--grid)" />
              <text x={m.l - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--font-mono)">
                {format(t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x0 = m.l + i * band + (band - (barW + 2) * series.length) / 2;
          return (
            <g key={d.label}>
              {d.values.map((v, si) => {
                const h = (v / max) * innerH;
                const x = x0 + si * (barW + 2);
                const y = m.t + innerH - h;
                const r = Math.min(4, h / 2, barW / 2);
                return (
                  <path key={si} d={`M${x},${m.t + innerH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${m.t + innerH} Z`} fill={series[si].color}>
                    <title>{`${d.label} · ${series[si].name}: ${format(v)}`}</title>
                  </path>
                );
              })}
              <text x={m.l + i * band + band / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--font-mono)">
                {d.label}
              </text>
            </g>
          );
        })}
        <line x1={m.l} x2={w - m.r} y1={m.t + innerH} y2={m.t + innerH} stroke="var(--axis)" />
      </svg>
    </div>
  );
}
