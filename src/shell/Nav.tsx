import { useEffect, useRef } from 'react';
import { navigate } from '@/core/router';
import { GROUPS, MODULES, type ModuleId } from '@/core/modules';
import { useView } from '@/core/store/viewStore';
import { Icon } from '@/ui/primitives';
import { useCoverWorld } from './useCoverWorld';

/** Desktop navigation rail grouped by the four core systems. */
export function ModuleRail() {
  const module = useView((s) => s.module);
  return (
    <nav aria-label="Modüller" className="no-print hidden lg:flex fixed left-3 top-[calc(var(--top-h)+8px)] bottom-3 z-20 w-[var(--rail-w)] flex-col glass rounded-2xl py-2 scroll-y">
      {GROUPS.map((g) => (
        <div key={g.id} className="flex flex-col items-center gap-0.5 pb-1.5 mb-1.5 border-b border-line last:border-0">
          <div className="text-[8.5px] font-extrabold tracking-[0.12em] uppercase text-faint text-center px-1 leading-tight mb-0.5" aria-hidden="true">
            {g.short}
          </div>
          {MODULES.filter((m) => m.group === g.id).map((m) => (
            <RailButton key={m.id} id={m.id} icon={m.icon} title={m.title} subtitle={m.subtitle} active={module === m.id} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function RailButton({ id, icon, title, subtitle, active }: { id: ModuleId; icon: string; title: string; subtitle: string; active: boolean }) {
  return (
    <button
      type="button"
      onClick={() => navigate(id)}
      aria-current={active ? 'page' : undefined}
      className={`group relative w-12 h-10 rounded-xl flex items-center justify-center transition ${active ? 'bg-aslan text-white' : 'text-muted hover:text-text hover:bg-white/5'}`}
      aria-label={`${title} — ${subtitle}`}
    >
      <Icon name={icon} size={19} />
      <span className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-surface-2 border border-line px-2.5 py-1.5 text-[12px] font-semibold text-text opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition shadow-xl z-50">
        {title}
        <span className="block text-[11px] font-normal muted">{subtitle}</span>
      </span>
    </button>
  );
}

/** Full-screen module menu for phones. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const module = useView((s) => s.module);
  const ref = useRef<HTMLDivElement>(null);
  useCoverWorld(open);
  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Modül menüsü" className="no-print fixed inset-0 z-50 bg-ink/95 backdrop-blur-md scroll-y p-4 pb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="display font-bold text-lg">
          ASLAN 2035 <span className="text-gold">Ω</span>
        </div>
        <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Menüyü kapat">
          <Icon name="X" />
        </button>
      </div>
      <button
        type="button"
        className="btn w-full mb-4 justify-start"
        onClick={() => {
          navigate('home');
          onClose();
        }}
      >
        <Icon name="House" size={16} /> Ana sayfa
      </button>
      {GROUPS.map((g) => (
        <div key={g.id} className="mb-4">
          <div className="kicker mb-2">{g.title}</div>
          <div className="grid grid-cols-1 gap-1.5">
            {MODULES.filter((m) => m.group === g.id).map((m) => (
              <button
                key={m.id}
                type="button"
                aria-current={module === m.id ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left border ${module === m.id ? 'border-aslan bg-aslan/15' : 'border-line bg-surface-2'}`}
                onClick={() => {
                  navigate(m.id);
                  onClose();
                }}
              >
                <Icon name={m.icon} size={18} className="text-gold" />
                <span>
                  <span className="block text-[14px] font-semibold">{m.title}</span>
                  <span className="block text-[12px] muted">{m.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
