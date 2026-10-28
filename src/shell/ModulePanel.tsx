import { Component, Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { MODULE_BY_ID, type ModuleId } from '@/core/modules';
import { navigate } from '@/core/router';
import { useView } from '@/core/store/viewStore';
import { Icon } from '@/ui/primitives';

const L = (f: () => Promise<{ default: ComponentType }>) => lazy(f);

export const MODULE_COMPONENTS: Partial<Record<ModuleId, ReturnType<typeof L>>> = {
  explore: L(() => import('@/modules/explore/ExploreModule')),
  architecture: L(() => import('@/modules/architecture/ArchitectureModule')),
  city: L(() => import('@/modules/city/CityModule')),
  design: L(() => import('@/modules/dna/DnaModule')),
  materials: L(() => import('@/modules/materials/MaterialModule')),
  lightshow: L(() => import('@/modules/lightshow/LightShowModule')),
  architect: L(() => import('@/modules/architect/ArchitectModule')),
  time: L(() => import('@/modules/timemachine/TimeMachineModule')),
  whatif: L(() => import('@/modules/whatif/WhatIfModule')),
  os: L(() => import('@/modules/os/StadiumOSModule')),
  crowd: L(() => import('@/modules/crowd/CrowdModule')),
  green: L(() => import('@/modules/green/GreenModule')),
  economy: L(() => import('@/modules/economy/EconomyModule')),
  roadmap: L(() => import('@/modules/roadmap/RoadmapModule')),
  matchday: L(() => import('@/modules/matchday/MatchdayModule')),
  seats: L(() => import('@/modules/seats/SeatModule')),
  journey: L(() => import('@/modules/journey/JourneyModule')),
  archive: L(() => import('@/modules/archive/ArchiveModule')),
  gallery: L(() => import('@/modules/gallery/GalleryModule')),
  share: L(() => import('@/modules/share/ShareModule')),
  about: L(() => import('@/modules/about/AboutModule')),
};

class ModuleBoundary extends Component<{ children: ReactNode; id: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { id: string }) {
    if (prev.id !== this.props.id && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error)
      return (
        <div role="alert" className="card">
          <div className="font-semibold mb-1">Bu modül yüklenirken bir hata oluştu.</div>
          <p className="text-[13px] muted mb-3">{this.state.error.message}</p>
          <button type="button" className="btn btn-sm" onClick={() => this.setState({ error: null })}>
            Tekrar dene
          </button>
        </div>
      );
    return this.props.children;
  }
}

export function ModulePanel({ module }: { module: ModuleId }) {
  const open = useView((s) => s.panelOpen);
  const set = useView((s) => s.set);
  const meta = MODULE_BY_ID[module];
  const Cmp = MODULE_COMPONENTS[module];
  if (!Cmp) return null;
  return (
    <aside
      id="panel"
      aria-label={meta.title}
      className={`no-print module-panel fixed z-20 glass flex flex-col shadow-2xl
        inset-x-0 bottom-0 rounded-t-2xl ${open ? 'h-[56vh]' : 'h-[58px]'}
        lg:inset-x-auto lg:right-3 lg:top-[calc(var(--top-h)+8px)] lg:bottom-3 lg:h-auto lg:w-[var(--panel-w)] lg:rounded-2xl`}
    >
      <header className="flex items-center gap-3 px-4 pt-3 pb-2.5 border-b border-line">
        <Icon name={meta.icon} size={20} className="text-gold shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="display text-[16px] font-semibold leading-tight truncate">{meta.title}</h2>
          <p className="text-[12px] muted truncate">{meta.subtitle}</p>
        </div>
        <button type="button" className="btn btn-icon btn-sm lg:hidden" onClick={() => set({ panelOpen: !open })} aria-expanded={open} aria-label={open ? 'Paneli küçült' : 'Paneli genişlet'}>
          <Icon name={open ? 'ChevronDown' : 'ChevronUp'} size={16} />
        </button>
      </header>
      <div className={`flex-1 scroll-y px-4 pt-3 pb-6 ${open ? '' : 'hidden lg:block'}`}>
        <ModuleBoundary id={module}>
          <Suspense fallback={<div className="muted text-[13px] py-6">Modül yükleniyor…</div>}>
            <Cmp />
          </Suspense>
        </ModuleBoundary>
      </div>
      <footer className={`px-4 py-2 border-t border-line text-[11px] leading-snug text-faint ${open ? '' : 'hidden lg:block'}`}>
        Konsept 3D model: yayımlanmış oranlara dayanır, gerçek stadyumun birebir ölçülü rölövesi değildir.{' '}
        {module !== 'about' && (
          <button type="button" className="underline hover:text-text" onClick={() => navigate('about')}>
            Kaynaklar ve varsayımlar
          </button>
        )}
      </footer>
    </aside>
  );
}
