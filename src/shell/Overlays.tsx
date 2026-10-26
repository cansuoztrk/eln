import { useEffect, useState } from 'react';
import { navigate } from '@/core/router';
import { useDesign } from '@/core/store/designStore';
import { useView, type EnvMode } from '@/core/store/viewStore';
import { componentInfo } from '@/content/components';
import { POIS } from '@/world/camera/pois';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Segmented } from '@/ui/primitives';

/** Bottom-left camera controls (Explorer / Walkthrough, POIs, env). */
export function CameraDock() {
  const mode = useView((s) => s.cameraMode);
  const poi = useView((s) => s.poi);
  const env = useView((s) => s.env);
  const view2D = useView((s) => s.view2D);
  const set = useView((s) => s.set);
  if (view2D) return null;
  const idx = POIS.findIndex((p) => p.id === poi);
  const go = (d: number) => {
    const next = POIS[(Math.max(0, idx) + d + POIS.length) % POIS.length];
    worldApi.flyToPoi(next.id);
  };
  return (
    <div className="no-print camera-dock fixed z-20 left-3 md:left-[calc(var(--rail-w)+20px)] bottom-3 flex flex-wrap items-center gap-1.5 glass rounded-2xl p-1.5 max-w-[calc(100vw-24px)]">
      <Segmented
        label="Kamera modu"
        value={mode === 'seat' ? 'walkthrough' : mode}
        onChange={(v) => {
          if (v === 'explorer') worldApi.resetView();
          else worldApi.flyToPoi(poi ?? 'main-entrance');
        }}
        options={[
          { value: 'explorer', label: 'Explorer', icon: 'Move' },
          { value: 'walkthrough', label: 'Walkthrough', icon: 'Footprints' },
        ]}
      />
      {mode !== 'explorer' && (
        <div className="flex items-center gap-1">
          <button type="button" className="btn btn-icon btn-sm" onClick={() => go(-1)} aria-label="Önceki gezinti noktası">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <span className="text-[12px] font-semibold px-1 min-w-[96px] text-center" aria-live="polite">
            {idx >= 0 ? POIS[idx].short : 'Koltuk görünümü'}
          </span>
          <button type="button" className="btn btn-icon btn-sm" onClick={() => go(1)} aria-label="Sonraki gezinti noktası">
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      )}
      <button type="button" className="btn btn-icon btn-sm" onClick={() => worldApi.resetView()} aria-label="Başlangıç görünümüne dön" title="Başlangıç görünümü (R)">
        <Icon name="House" size={15} />
      </button>
      <div className="flex gap-0.5" role="group" aria-label="Günün saati">
        {(
          [
            ['night', 'Moon', 'Gece'],
            ['dusk', 'Sunset', 'Alacakaranlık'],
            ['day', 'Sun', 'Gündüz'],
          ] as [EnvMode, string, string][]
        ).map(([id, icon, label]) => (
          <button key={id} type="button" className="btn btn-icon btn-sm btn-ghost" aria-pressed={env === id} onClick={() => set({ env: id })} aria-label={label} title={label}>
            <Icon name={icon} size={15} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Object Inspector card for the selected component. */
export function Inspector() {
  const selected = useView((s) => s.selected);
  const set = useView((s) => s.set);
  if (!selected) return null;
  const info = componentInfo(selected);
  return (
    <aside aria-label="Object Inspector" className="no-print inspector fixed z-30 glass rounded-2xl p-4 shadow-2xl w-[320px] max-w-[calc(100vw-24px)] left-3 md:left-[calc(var(--rail-w)+20px)] top-[calc(var(--top-h)+8px)] max-h-[60vh] scroll-y">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="kicker mb-1">Object Inspector</div>
          <h2 className="display text-[17px] font-semibold">{info.name}</h2>
        </div>
        <button type="button" className="btn btn-icon btn-sm" onClick={() => set({ selected: null })} aria-label="Inspector'ı kapat">
          <Icon name="X" size={15} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 my-2.5">
        {info.status.map((s) => (
          <Badge key={s} kind={s} />
        ))}
      </div>
      <p className="text-[13px] leading-relaxed text-[#dcd9d2]">{info.purpose}</p>
      {info.options.length > 0 && (
        <>
          <div className="field-label mt-3">Tasarım seçenekleri</div>
          <div className="flex flex-wrap gap-1.5">
            {info.options.map((o) => (
              <button key={o.label} type="button" className="chip" onClick={() => navigate(o.module)}>
                {o.label} <Icon name="ArrowRight" size={13} />
              </button>
            ))}
          </div>
        </>
      )}
      {info.notes.length > 0 && (
        <>
          <div className="field-label mt-3">Teknik değerlendirme notları</div>
          <ul className="list-dots">
            {info.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}

/** Banner shown while a temporary preview replaces the user's design. */
export function PreviewBanner() {
  const preview = useView((s) => s.preview);
  const label = useView((s) => s.previewLabel);
  const capturing = useView((s) => s.capturing);
  const setPreview = useView((s) => s.setPreview);
  const setDesign = useDesign((s) => s.setDesign);
  if (!preview || capturing || label === 'capture') return null;
  return (
    <div role="status" className="no-print fixed z-20 left-1/2 -translate-x-1/2 top-[calc(var(--top-h)+8px)] glass rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2 text-[12.5px] shadow-xl max-w-[calc(100vw-24px)]">
      <Icon name="Eye" size={14} className="text-gold" />
      <span className="truncate">
        Önizleme: <strong>{label}</strong>
      </span>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => {
          setDesign(preview, `Önizleme uygulandı: ${label}`);
          setPreview(null);
        }}
      >
        Uygula
      </button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPreview(null)}>
        Tasarıma dön
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useView((s) => s.toasts);
  const dismiss = useView((s) => s.dismissToast);
  return (
    <div className="no-print fixed z-[60] right-3 bottom-3 md:bottom-4 flex flex-col gap-2 w-[340px] max-w-[calc(100vw-24px)] toasts">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`glass rounded-xl px-3.5 py-2.5 text-[13px] flex gap-2.5 items-start shadow-2xl border-l-4 ${t.kind === 'error' ? 'border-l-aslan' : t.kind === 'warning' ? 'border-l-eng' : t.kind === 'success' ? 'border-l-verified' : 'border-l-sim'}`}
        >
          <span className="flex-1 leading-snug">{t.text}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Bildirimi kapat" className="text-faint hover:text-text">
            <Icon name="X" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Screen-reader live region for design changes and module events. */
export function LiveRegion() {
  const announcement = useView((s) => s.announcement);
  const lastChange = useDesign((s) => s.lastChange);
  const [text, setText] = useState('');
  useEffect(() => setText(announcement), [announcement]);
  useEffect(() => {
    if (lastChange) setText(lastChange);
  }, [lastChange]);
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {text}
    </div>
  );
}

export function CaptureOverlay() {
  const capturing = useView((s) => s.capturing);
  if (!capturing) return null;
  return (
    <div className="no-print fixed inset-0 z-[70] bg-ink/80 backdrop-blur-sm flex items-center justify-center" role="status" aria-live="polite">
      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
        <span className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin" aria-hidden="true" />
        <span className="text-[14px]">Konsept görseli oluşturuluyor…</span>
      </div>
    </div>
  );
}
