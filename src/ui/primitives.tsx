/** Shared UI primitives (accessible controls and honesty badges). */
import { useId, type ReactNode } from 'react';
import { ICONS } from './icons';

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const Cmp = ICONS[name] ?? ICONS.Circle;
  return <Cmp size={size} className={className} aria-hidden="true" />;
}

export type BadgeKind = 'verified' | 'concept' | 'sim' | 'eng' | 'demo';
const BADGE_TEXT: Record<BadgeKind, string> = {
  verified: 'Doğrulanmış',
  concept: 'Konsept',
  sim: 'Simülasyon',
  eng: 'Mühendislik değerlendirmesi gerekir',
  demo: 'Demo',
};
const BADGE_TITLE: Record<BadgeKind, string> = {
  verified: 'Kaynağı belirtilmiş, mevcut yapıya ilişkin bilgi',
  concept: 'Önerilen tasarım; mevcut durumu göstermez',
  sim: 'Örnek/simüle veri; gerçek ölçüm değildir',
  eng: 'Uygulanabilirliği bağımsız mühendislik analizi gerektirir',
  demo: 'Sınırlı demo işlevi',
};

export function Badge({ kind, children }: { kind: BadgeKind; children?: ReactNode }) {
  return (
    <span className={`badge badge-${kind}`} title={BADGE_TITLE[kind]}>
      {children ?? BADGE_TEXT[kind]}
    </span>
  );
}

export function Section({ title, kicker, children, actions, badges }: { title: string; kicker?: string; children: ReactNode; actions?: ReactNode; badges?: ReactNode }) {
  return (
    <section className="mb-5">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div>
          {kicker && <div className="kicker mb-1">{kicker}</div>}
          <h3 className="display text-[15px] font-semibold text-text">{title}</h3>
        </div>
        {actions}
      </div>
      {badges && <div className="flex flex-wrap gap-1.5 mb-2.5">{badges}</div>}
      {children}
    </section>
  );
}

export function Toggle({ label, checked, onChange, description, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div>
        <label htmlFor={id} className="text-[13.5px] font-medium cursor-pointer">
          {label}
        </label>
        {description && <div className="text-[12px] muted leading-snug mt-0.5">{description}</div>}
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} className="switch mt-0.5" onClick={() => onChange(!checked)} />
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  format = (v) => `${Math.round(v * 100)}%`,
  hint,
  actions,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  hint?: ReactNode;
  /** small buttons next to the value (show in model, lock) */
  actions?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="py-1">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="field-label mb-0">
          {label}
        </label>
        <span className="flex items-center gap-1.5">
          <span className="text-[12px] tabular-nums muted">{format(value)}</span>
          {actions && <span className="flex items-center gap-0.5 [&>button]:mb-0">{actions}</span>}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={format(value)} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  locked,
  onToggleLock,
  hint,
  onShow,
  tag,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  locked?: boolean;
  onToggleLock?: () => void;
  /** what the current value does, read out with the field */
  hint?: ReactNode;
  /** frames the part of the model this field changes */
  onShow?: () => void;
  /** short marker next to the label, e.g. a value that differs from a preset */
  tag?: { text: string; title: string };
}) {
  const id = useId();
  return (
    <div className="py-1">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={id} className="field-label">
            {label}
          </label>
          {tag && (
            <span id={`${id}-tag`} className="field-tag" title={tag.title}>
              {tag.text}
              <span className="sr-only"> — {tag.title}</span>
            </span>
          )}
        </span>
        <span className="flex items-center gap-0.5">
          {onShow && <ShowButton onClick={onShow} label={label} />}
          {onToggleLock && <LockButton locked={!!locked} onClick={onToggleLock} label={label} />}
        </span>
      </div>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-describedby={[tag && `${id}-tag`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Small "show in model" action next to a field label. */
export function ShowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="text-faint hover:text-text p-1 mb-1" onClick={onClick} aria-label={`${label}: modelde göster`} title="Modelde göster">
      <Icon name="Focus" size={14} />
    </button>
  );
}

export function LockButton({ locked, onClick, label }: { locked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="text-faint hover:text-text p-1 -mr-1 mb-1"
      onClick={onClick}
      aria-pressed={locked}
      aria-label={locked ? `${label}: kilidi aç` : `${label}: kilitle (ön ayarlar değiştirmesin)`}
      title={locked ? 'Kilitli — ön ayarlar ve AI Architect bu seçimi değiştirmez' : 'Kilitle'}
    >
      <Icon name={locked ? 'Lock' : 'LockOpen'} size={14} className={locked ? 'text-gold' : ''} />
    </button>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  iconOnly = false,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (v: T) => void;
  /** show only the icons (labels stay for screen readers) where space is tight */
  iconOnly?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex p-1 rounded-xl bg-surface-2 border border-line gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          title={iconOnly ? o.label : undefined}
          className={`h-8 ${iconOnly && o.icon ? 'px-2.5' : 'px-3'} rounded-lg text-[12.5px] font-semibold flex items-center gap-1.5 transition ${value === o.value ? 'bg-aslan text-white' : 'text-muted hover:text-text'}`}
        >
          {o.icon && <Icon name={o.icon} size={14} />}
          {iconOnly && o.icon ? <span className="sr-only">{o.label}</span> : o.label}
        </button>
      ))}
    </div>
  );
}

export function Dots({ value, max = 5, label }: { value: number; max?: number; label: string }) {
  return (
    <span className="dot-scale" role="img" aria-label={`${label}: ${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < value ? 'on' : ''} />
      ))}
    </span>
  );
}

export function Note({ children, kind = 'info' }: { children: ReactNode; kind?: 'info' | 'warn' | 'eng' }) {
  const color = kind === 'warn' ? 'border-gold/40 bg-gold/5' : kind === 'eng' ? 'border-eng/40 bg-eng/5' : 'border-sim/30 bg-sim/5';
  return <div className={`rounded-xl border ${color} px-3 py-2.5 text-[12.5px] leading-relaxed text-[#dcd9d2]`}>{children}</div>;
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2.5 py-1">
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <label htmlFor={id} className="text-[13px]">
        {label}
        <span className="block text-[11px] muted tabular-nums uppercase">{value}</span>
      </label>
    </div>
  );
}

/** Download helper for real files (JSON, PNG, HTML, MD). */
export function downloadFile(name: string, data: Blob | string, mime = 'application/octet-stream') {
  const blob = typeof data === 'string' ? new Blob([data], { type: mime }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(head)?.[1] ?? 'image/png';
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
