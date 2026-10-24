import Link from "next/link";
import type { Facets } from "@/server/catalog/queries";
import { filtersToQuery, LABEL_FILTERS, type ProductFilters } from "@/server/catalog/filters";
import { DEAL_LABELS } from "@/lib/deal-labels";
import { AutoSubmitForm } from "./auto-submit";

function Group({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line py-4 first:pt-0">
      <summary className="flex cursor-pointer items-center justify-between text-[13px] font-semibold">
        {title}
        <span className="text-ink-3 transition-transform group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="mt-3 space-y-1.5">{children}</div>
    </details>
  );
}

function Check({ name, value, checked, label, count, type = "checkbox" }: { name: string; value: string; checked: boolean; label: string; count?: number; type?: "checkbox" | "radio" }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-[13.5px] text-ink-2 hover:bg-surface-2 hover:text-ink">
      <input type={type} name={name} value={value} defaultChecked={checked} className="size-4 shrink-0 accent-[var(--brand)]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined ? <span className="font-mono text-[11px] text-ink-3 tabular">{count}</span> : null}
    </label>
  );
}

/** Filtre paneli — tüm durum URL'dedir. */
export function FilterPanel({ action, f, facets, hideCategory = false, fixed = {} }: { action: string; f: ProductFilters; facets: Facets; hideCategory?: boolean; fixed?: Record<string, string> }) {
  const clearHref = `${action}${filtersToQuery({ q: f.q, kategori: hideCategory ? undefined : f.kategori, sirala: f.sirala, attrs: {} }, {})}`;
  return (
    <AutoSubmitForm action={action} className="text-ink">
      {f.q ? <input type="hidden" name="q" value={f.q} /> : null}
      {!hideCategory && f.kategori ? <input type="hidden" name="kategori" value={f.kategori} /> : null}
      {f.sirala ? <input type="hidden" name="sirala" value={f.sirala} /> : null}
      {Object.entries(fixed).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <Group title="Fiyat (kargo dâhil en iyi teklif)">
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">En düşük fiyat (TL)</span>
            <input name="min" inputMode="decimal" placeholder="En az ₺" defaultValue={f.min !== undefined ? f.min / 100 : ""} className="field h-9" />
          </label>
          <span className="text-ink-3">–</span>
          <label className="flex-1">
            <span className="sr-only">En yüksek fiyat (TL)</span>
            <input name="max" inputMode="decimal" placeholder="En çok ₺" defaultValue={f.max !== undefined ? f.max / 100 : ""} className="field h-9" />
          </label>
        </div>
      </Group>

      {facets.attributes.map((a) => (
        <Group key={a.key} title={a.label}>
          <Check type="radio" name={`n_${a.key}`} value="" checked={!f.attrs[a.key]} label="Tümü" />
          {a.options.map((o) => (
            <Check key={o.value} type="radio" name={`n_${a.key}`} value={o.value} checked={f.attrs[a.key] === o.value} label={o.label} count={o.count} />
          ))}
        </Group>
      ))}

      <Group title="Doğrulanmış indirim">
        <p className="mb-1 text-[11.5px] leading-snug text-ink-3">Mağaza liste fiyatı değil; kendi fiyat geçmişimize göre.</p>
        {[0, 5, 10, 20, 30].map((v) => (
          <Check key={v} type="radio" name="indirim" value={v ? String(v) : ""} checked={(f.indirim ?? 0) === v} label={v ? `En az %${v}` : "Fark etmez"} />
        ))}
      </Group>

      <Group title="Fırsat türü">
        <Check type="radio" name="etiket" value="" checked={!f.etiket} label="Tümü" />
        {Object.entries(LABEL_FILTERS).map(([slug, key]) => (
          <Check key={slug} type="radio" name="etiket" value={slug} checked={f.etiket === slug} label={DEAL_LABELS[key].text} />
        ))}
      </Group>

      {facets.brands.length ? (
        <Group title="Marka">
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <Check key={b.slug} name="marka" value={b.slug} checked={f.marka.includes(b.slug)} label={b.name} count={b.count} />
            ))}
          </div>
        </Group>
      ) : null}

      {facets.retailers.length ? (
        <Group title="Mağaza">
          {facets.retailers.map((r) => (
            <Check key={r.slug} name="magaza" value={r.slug} checked={f.magaza.includes(r.slug)} label={r.name} count={r.count} />
          ))}
        </Group>
      ) : null}

      <Group title="Durum">
        <Check name="stok" value="1" checked={Boolean(f.stok)} label="Yalnızca stokta olanlar" />
        <Check name="kupon" value="1" checked={Boolean(f.kupon)} label="Doğrulanmış kuponu olanlar" />
      </Group>

      <Group title="Son fiyat kontrolü">
        {[
          ["", "Fark etmez"],
          ["1", "Son 1 saat"],
          ["6", "Son 6 saat"],
          ["24", "Son 24 saat"],
        ].map(([v, l]) => (
          <Check key={v} type="radio" name="taze" value={v} checked={String(f.taze ?? "") === v} label={l} />
        ))}
      </Group>

      <div className="sticky bottom-0 flex gap-2 bg-surface pt-4 pb-1">
        <button type="submit" className="h-10 flex-1 rounded-md bg-brand text-[14px] font-semibold text-on-brand hover:bg-brand-ink">
          Uygula
        </button>
        <Link href={clearHref} className="grid h-10 place-items-center rounded-md border border-line px-4 text-[13.5px] text-ink-2 hover:text-ink">
          Temizle
        </Link>
      </div>
    </AutoSubmitForm>
  );
}
