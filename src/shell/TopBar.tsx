import { useEffect, useRef, useState } from 'react';
import { navigate } from '@/core/router';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { MODULE_BY_ID } from '@/core/modules';
import type { Quality } from '@/core/quality';
import { Icon } from '@/ui/primitives';
import { audioEngine } from '@/modules/matchday/audio';

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const module = useView((s) => s.module);
  const view2D = useView((s) => s.view2D);
  const webgl = useView((s) => s.webgl);
  const quality = useView((s) => s.quality);
  const qualityAuto = useView((s) => s.qualityAuto);
  const reduced = useView((s) => s.reducedMotion);
  const soundOn = useView((s) => s.soundOn);
  const set = useView((s) => s.set);
  const toast = useView((s) => s.toast);
  const canUndo = useDesign((s) => s.past.length > 0);
  const canRedo = useDesign((s) => s.future.length > 0);
  const undo = useDesign((s) => s.undo);
  const redo = useDesign((s) => s.redo);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const title = module === 'home' ? '' : MODULE_BY_ID[module].title;

  // the settings popover closes on Escape (focus returns to its button) and on a click outside it
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setSettingsOpen(false);
      settingsRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [settingsOpen]);

  const toggleSound = async () => {
    if (soundOn) {
      audioEngine.stop();
      set({ soundOn: false });
    } else {
      const ok = await audioEngine.start(useView.getState().atmosphere, useView.getState().volume);
      if (ok) set({ soundOn: true });
      else toast('Bu tarayıcı Web Audio desteklemiyor; ses kullanılamıyor.', 'error');
    }
  };

  return (
    <header className="no-print fixed top-0 inset-x-0 z-30 h-[var(--top-h)] flex items-center gap-2 px-3 md:px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 min-w-0">
        <button type="button" className="btn btn-icon btn-ghost md:hidden glass" onClick={onMenu} aria-label="Modül menüsünü aç">
          <Icon name="Menu" />
        </button>
        <button type="button" onClick={() => navigate('home')} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/5" aria-label="ASLAN 2035 OMEGA ana sayfa">
          <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
            <ellipse cx="32" cy="34" rx="22" ry="15" fill="none" stroke="#f2b631" strokeWidth="4" />
            <ellipse cx="32" cy="34" rx="12" ry="7" fill="#d4213d" />
            <path d="M10 30 Q32 8 54 30" fill="none" stroke="#f2b631" strokeWidth="3" />
          </svg>
          <span className="display font-bold tracking-tight text-[15px] whitespace-nowrap">
            ASLAN 2035 <span className="text-gold">Ω</span>
          </span>
        </button>
        {title && <span className="hidden lg:inline text-[13px] muted truncate">/ {title}</span>}
        <span className="hidden xl:inline-flex badge badge-concept ml-1" title="Kulüp tarafından onaylanmış resmî bir proje değildir">
          Bağımsız konsept
        </span>
      </div>
      <div className="flex-1" />
      <div className="pointer-events-auto flex items-center gap-1.5 glass rounded-xl p-1">
        <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={undo} disabled={!canUndo} aria-label="Geri al" title="Geri al (tasarım)">
          <Icon name="Undo2" size={16} />
        </button>
        <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={redo} disabled={!canRedo} aria-label="Yinele" title="Yinele">
          <Icon name="Redo2" size={16} />
        </button>
        <span className="w-px h-5 bg-line mx-0.5" />
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          aria-pressed={view2D}
          onClick={() => {
            if (!webgl && view2D) {
              toast('Bu cihazda WebGL kullanılamıyor; yalnızca 2D görünüm mevcut.', 'warning');
              return;
            }
            set({ view2D: !view2D });
          }}
          title="Alternatif 2D plan görünümü"
        >
          <Icon name={view2D ? 'Box' : 'Grid2x2'} size={15} />
          <span className="hidden sm:inline">{view2D ? '3D' : '2D'}</span>
        </button>
        <button type="button" className="btn btn-icon btn-sm btn-ghost" aria-pressed={soundOn} onClick={toggleSound} aria-label={soundOn ? 'Sesi kapat' : 'Sesi aç'} title={soundOn ? 'Sesi kapat' : 'Sesi aç (özgün sentezlenmiş ses)'}>
          <Icon name={soundOn ? 'Volume2' : 'VolumeX'} size={16} />
        </button>
        <div className="relative" ref={settingsRef}>
          <button type="button" className="btn btn-icon btn-sm btn-ghost" aria-expanded={settingsOpen} aria-haspopup="dialog" onClick={() => setSettingsOpen((v) => !v)} aria-label="Görünüm ayarları">
            <Icon name="Settings" size={16} />
          </button>
          {settingsOpen && (
            <div role="dialog" aria-label="Görünüm ayarları" className="absolute right-0 top-11 w-72 glass rounded-2xl p-3 shadow-2xl">
              <div className="kicker mb-2">Performans</div>
              <div className="flex gap-1 mb-2" role="group" aria-label="Görsel kalite">
                {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                  <button key={q} type="button" className="chip flex-1 justify-center" aria-pressed={quality === q && !qualityAuto} onClick={() => set({ quality: q, qualityAuto: false })}>
                    {q === 'low' ? 'Düşük' : q === 'medium' ? 'Orta' : 'Yüksek'}
                  </button>
                ))}
              </div>
              <button type="button" className="chip w-full justify-center mb-3" aria-pressed={qualityAuto} onClick={() => set({ qualityAuto: !qualityAuto })}>
                Otomatik kalite {qualityAuto ? `(${quality === 'low' ? 'düşük' : quality === 'medium' ? 'orta' : 'yüksek'})` : ''}
              </button>
              <div className="kicker mb-2">Erişilebilirlik</div>
              <button type="button" className="chip w-full justify-center mb-2" aria-pressed={reduced} onClick={() => set({ reducedMotion: !reduced })}>
                <Icon name="Accessibility" size={14} /> Azaltılmış hareket
              </button>
              <p className="text-[11.5px] muted leading-snug">
                Azaltılmış harekette kamera geçişleri anlık olur, ışık animasyonları ve otomatik dönüş durur. Klavye: 3D görünüme odaklanıp ok tuşları, W/A/S/D, R (başlangıç), N/P (gezinti noktaları).
              </p>
              <button type="button" className="btn btn-sm w-full mt-3" onClick={() => setSettingsOpen(false)}>
                Kapat
              </button>
            </div>
          )}
        </div>
        <button type="button" className="btn btn-sm btn-gold hidden sm:inline-flex" onClick={() => navigate('present')}>
          <Icon name="Presentation" size={15} /> Sunum
        </button>
      </div>
    </header>
  );
}
