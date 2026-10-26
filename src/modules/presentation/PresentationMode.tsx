import { useCallback, useEffect, useState } from 'react';
import { navigate } from '@/core/router';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon } from '@/ui/primitives';
import { SLIDES } from './slides';

export default function PresentationMode() {
  const design = useDesign((s) => s.design);
  const set = useView((s) => s.set);
  const setPreview = useView((s) => s.setPreview);
  const reduced = useView((s) => s.reducedMotion);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(false);
  const [fs, setFs] = useState(false);
  const slide = SLIDES[i];

  // apply slide state to the shared world
  useEffect(() => {
    const cfg = slide.config?.(design) ?? null;
    setPreview(cfg, `Sunum: ${slide.title}`);
    set({ section: slide.section ?? 'off', exploded: false, env: slide.env ?? 'night', selected: null, highlight: [] });
    const t = setTimeout(() => worldApi.flyTo(slide.pose, { mode: 'explorer' }), worldApi.ready ? 0 : 900);
    return () => clearTimeout(t);
  }, [slide, design, set, setPreview]);

  // restore on exit
  useEffect(
    () => () => {
      useView.getState().setPreview(null);
      useView.getState().set({ section: 'off', env: 'night' });
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    },
    [],
  );

  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(SLIDES.length - 1, x + d))), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
      if (e.key === 'Escape' && !document.fullscreenElement) navigate('home');
      if (e.key === 'Home') setI(0);
      if (e.key === 'End') setI(SLIDES.length - 1);
    };
    const onFs = () => setFs(!!document.fullscreenElement);
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [go]);

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => (i >= SLIDES.length - 1 ? setAuto(false) : go(1)), reduced ? 9000 : 8000);
    return () => clearTimeout(t);
  }, [auto, i, go, reduced]);

  const toggleFs = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      useView.getState().toast('Tam ekran bu tarayıcıda kullanılamıyor.', 'warning');
    }
  };

  return (
    <div className="no-print fixed inset-0 z-40 pointer-events-none" role="region" aria-roledescription="sunum" aria-label="ASLAN 2035 OMEGA sunumu">
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-ink via-ink/70 to-transparent" aria-hidden="true" />
      <div className="absolute top-4 right-4 flex gap-1.5 pointer-events-auto">
        <button type="button" className="btn btn-sm glass" onClick={() => setAuto(!auto)} aria-pressed={auto}>
          <Icon name={auto ? 'Pause' : 'Play'} size={14} /> {auto ? 'Otomatik durdur' : 'Otomatik oynat'}
        </button>
        <button type="button" className="btn btn-sm glass" onClick={toggleFs} aria-pressed={fs}>
          <Icon name={fs ? 'Minimize' : 'Expand'} size={14} /> {fs ? 'Tam ekrandan çık' : 'Tam ekran'}
        </button>
        <button type="button" className="btn btn-sm glass" onClick={() => navigate('home')}>
          <Icon name="X" size={14} /> Sunumu kapat
        </button>
      </div>
      <div className="absolute left-5 md:left-12 bottom-24 md:bottom-28 max-w-[760px] pr-5" aria-live="polite">
        <div className="kicker mb-2">{slide.kicker}</div>
        <h2 className="display font-bold text-[clamp(28px,4.4vw,58px)] leading-[1.02] tracking-tight">{slide.title}</h2>
        <p className="mt-3 text-[clamp(14px,1.35vw,18px)] text-text/85 leading-relaxed max-w-[640px]">{slide.text}</p>
        {slide.points && (
          <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[14px] text-text/90">
            {slide.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-gold">—</span>
                {p}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {slide.badges.map((b) => (
            <Badge key={b} kind={b} />
          ))}
        </div>
        {slide.uncertainty && <p className="mt-2 text-[12.5px] text-faint max-w-[620px]">{slide.uncertainty}</p>}
      </div>
      <div className="absolute inset-x-5 md:inset-x-12 bottom-6 flex items-center gap-3 pointer-events-auto">
        <button type="button" className="btn btn-icon glass" onClick={() => go(-1)} disabled={i === 0} aria-label="Önceki slayt">
          <Icon name="ChevronLeft" />
        </button>
        <div className="flex-1 flex gap-1" role="tablist" aria-label="Slaytlar">
          {SLIDES.map((s, k) => (
            <button key={s.id} type="button" role="tab" aria-selected={k === i} aria-label={`${k + 1}. ${s.title}`} onClick={() => setI(k)} className={`h-1.5 flex-1 rounded-full transition ${k <= i ? 'bg-gold' : 'bg-white/20'}`} />
          ))}
        </div>
        <span className="text-[12px] tabular-nums muted w-12 text-right">
          {i + 1}/{SLIDES.length}
        </span>
        <button type="button" className="btn btn-icon glass" onClick={() => go(1)} disabled={i === SLIDES.length - 1} aria-label="Sonraki slayt">
          <Icon name="ChevronRight" />
        </button>
      </div>
    </div>
  );
}
