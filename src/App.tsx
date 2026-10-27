import { Suspense, lazy, useEffect, useState } from 'react';
import { clearParams, useRoute } from '@/core/router';
import { useView } from '@/core/store/viewStore';
import { useDesign } from '@/core/store/designStore';
import { decodeDesign } from '@/core/model/sanitize';
import type { DesignConfig } from '@/core/model/design';
import { TopBar } from '@/shell/TopBar';
import { MobileMenu, ModuleRail } from '@/shell/Nav';
import { useCoverWorld } from '@/shell/useCoverWorld';
import { Hero } from '@/shell/Hero';
import { ModulePanel } from '@/shell/ModulePanel';
import { CameraDock, CaptureOverlay, Inspector, LiveRegion, PreviewBanner, Toasts } from '@/shell/Overlays';
import { audioEngine } from '@/modules/matchday/audio';
import { useArchive } from '@/core/store/archiveStore';

const StadiumCanvas = lazy(() => import('@/world/StadiumCanvas'));
const Plan2D = lazy(() => import('@/shell/Plan2D'));
const PresentationMode = lazy(() => import('@/modules/presentation/PresentationMode'));
const ReportView = lazy(() => import('@/modules/report/ReportView'));

function SharedDesignDialog({ config, warnings, onClose }: { config: DesignConfig; warnings: string[]; onClose: () => void }) {
  const setDesign = useDesign((s) => s.setDesign);
  const current = useDesign((s) => s.design);
  const save = useArchive((s) => s.save);
  const toast = useView((s) => s.toast);
  useCoverWorld(true);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="share-title" className="fixed inset-0 z-[80] bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-5 max-w-md w-full">
        <div className="kicker mb-1">Paylaşılan tasarım</div>
        <h2 id="share-title" className="display text-xl font-semibold mb-2">
          Bu bağlantı bir tasarım konfigürasyonu içeriyor
        </h2>
        <p className="text-[13.5px] muted mb-3">Yüklerseniz mevcut tasarımınız önce arşive “Paylaşım öncesi yedek” olarak kaydedilir; ardından paylaşılan konfigürasyon uygulanır.</p>
        {warnings.length > 0 && (
          <div className="text-[12px] text-eng mb-3">
            {warnings.length} alan geçersizdi ve varsayılan değerle değiştirildi.
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn" onClick={onClose}>
            Yükleme
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              save('Paylaşım öncesi yedek', current, null);
              setDesign(config, 'Paylaşılan tasarım yüklendi');
              toast('Paylaşılan tasarım yüklendi. Önceki tasarımınız arşivde.', 'success');
              onClose();
            }}
          >
            Tasarımı yükle
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const set = useView((s) => s.set);
  const view2D = useView((s) => s.view2D);
  const reduced = useView((s) => s.reducedMotion);
  const mobile = useView((s) => s.mobile);
  const panelOpen = useView((s) => s.panelOpen);
  const toast = useView((s) => s.toast);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shared, setShared] = useState<{ config: DesignConfig; warnings: string[] } | null>(null);
  const module = route.module;

  // route → view state
  useEffect(() => {
    set({ module, selected: null });
  }, [module, set]);

  // first visit plays the intro on the home screen
  useEffect(() => {
    const v = useView.getState();
    if (module === 'home' && !v.introSeen && !v.reducedMotion && !v.view2D) set({ introPlaying: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // shared design links: #/any?d=<base64url>
  useEffect(() => {
    const d = route.params.get('d');
    if (!d) return;
    try {
      const res = decodeDesign(d);
      setShared(res);
    } catch (e) {
      toast(`Paylaşım bağlantısı okunamadı: ${(e as Error).message}`, 'error');
    }
    clearParams();
  }, [route.params, toast]);

  // keep audio in sync with the atmosphere
  useEffect(
    () =>
      useView.subscribe((s, p) => {
        if (s.atmosphere !== p.atmosphere && s.soundOn) audioEngine.setMode(s.atmosphere);
        if (s.volume !== p.volume && s.soundOn) audioEngine.setVolume(s.volume);
      }),
    [],
  );

  const fullscreen = module === 'present' || module === 'report';
  const showPanel = module !== 'home' && !fullscreen;

  return (
    <div className={reduced ? 'reduce-motion' : ''}>
      <a className="skip-link" href={showPanel ? '#panel' : '#main-cta'}>
        İçeriğe atla
      </a>
      <div
        id="world-canvas"
        className={`world ${mobile && showPanel && panelOpen ? 'bottom-[56vh]!' : ''}`}
        tabIndex={view2D ? -1 : 0}
        role={view2D ? undefined : 'application'}
        aria-label="3D stadyum görünümü. Odaklanınca: ok tuşları döndürür, W A S D hareket ettirir, artı/eksi yakınlaştırır, R başlangıç görünümüne döner, N ve P gezinti noktaları arasında geçer."
      >
        <Suspense fallback={<div className="world-message">{view2D ? '2D plan yükleniyor…' : '3D dünya yükleniyor…'}</div>}>{view2D ? <Plan2D /> : <StadiumCanvas />}</Suspense>
      </div>
      <div id="world-fade" aria-hidden="true" />
      {!fullscreen && <TopBar onMenu={() => setMenuOpen(true)} />}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {module === 'home' && (
        <div id="main-cta">
          <Hero />
        </div>
      )}
      {showPanel && (
        <>
          <ModuleRail />
          <ModulePanel module={module} />
          <CameraDock />
          <Inspector />
          <PreviewBanner />
        </>
      )}
      {fullscreen && (
        <Suspense fallback={<div className="world-message">Yükleniyor…</div>}>{module === 'present' ? <PresentationMode /> : <ReportView />}</Suspense>
      )}
      <Toasts />
      <LiveRegion />
      <CaptureOverlay />
      {shared && <SharedDesignDialog config={shared.config} warnings={shared.warnings} onClose={() => setShared(null)} />}
    </div>
  );
}
