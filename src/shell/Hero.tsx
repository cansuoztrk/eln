import { navigate } from '@/core/router';
import { useView } from '@/core/store/viewStore';
import { Icon } from '@/ui/primitives';

const CTAS = [
  { label: 'ENTER THE STADIUM', tr: 'Stadyuma gir', icon: 'Footprints', go: () => navigate('explore', { poi: 'main-entrance' }) },
  { label: 'START DESIGNING', tr: 'Tasarlamaya başla', icon: 'Dna', go: () => navigate('design') },
  { label: 'EXPLORE THE MASTERPLAN', tr: 'Master planı keşfet', icon: 'Map', go: () => navigate('city') },
  { label: 'ENTER MATCHDAY MODE', tr: 'Maç günü moduna gir', icon: 'Flame', go: () => navigate('matchday', { mode: 'prematch' }) },
  { label: 'VIEW THE FUTURE', tr: 'Geleceği gör', icon: 'History', go: () => navigate('time', { phase: '4' }) },
] as const;

export function Hero() {
  const introPlaying = useView((s) => s.introPlaying);
  const set = useView((s) => s.set);
  return (
    <div className="no-print fixed inset-0 z-10 pointer-events-none flex flex-col justify-end md:justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(7,8,12,0.78),transparent_62%)]" aria-hidden="true" />
      <div className="relative px-5 md:px-[7vw] pb-8 md:pb-0 max-w-[1100px]">
        <div className="kicker fade-up mb-3" style={{ animationDelay: '0.2s' }}>
          RAMS Park · Seyrantepe · İstanbul — bağımsız konsept platformu
        </div>
        <h1 className="hero-title fade-up" style={{ animationDelay: '0.5s' }}>
          ASLAN 2035
          <br />
          <span className="hero-omega">OMEGA</span>
        </h1>
        <p className="display fade-up mt-4 text-[clamp(18px,2.2vw,26px)] text-text/90" style={{ animationDelay: '0.9s' }}>
          The Next Evolution of RAMS PARK.
        </p>
        <p className="fade-up mt-2 text-[14.5px] muted max-w-[560px] leading-relaxed" style={{ animationDelay: '1.1s' }}>
          <span className="text-text font-semibold">Bir Efsaneyi İzleme. Geleceğini Tasarla.</span> — Don’t Just Witness a Legend. Design Its Future.
        </p>
        <div className="fade-up mt-7 flex flex-wrap gap-2.5 pointer-events-auto" style={{ animationDelay: '1.4s' }}>
          {CTAS.map((c, i) => (
            <button key={c.label} type="button" onClick={c.go} className={`btn ${i === 0 ? 'btn-primary' : i === 1 ? 'btn-gold' : 'glass'} h-12 px-4 rounded-xl`} aria-label={`${c.label} — ${c.tr}`}>
              <Icon name={c.icon} size={17} />
              <span className="text-left leading-tight">
                <span className="block text-[12.5px] font-extrabold tracking-[0.06em]">{c.label}</span>
                <span className="block text-[11px] font-medium opacity-75">{c.tr}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="fade-up mt-6 text-[11.5px] text-faint max-w-[620px] leading-relaxed pointer-events-auto" style={{ animationDelay: '1.6s' }}>
          Bu platform Galatasaray SK tarafından onaylanmış resmî bir dönüşüm projesi değildir. Mevcut yapıya ilişkin doğrulanmış bilgiler, öneriler ve simülasyonlar etiketlerle ayrılır.{' '}
          <button type="button" className="underline hover:text-text" onClick={() => navigate('about')}>
            Kaynaklar ve varsayımlar
          </button>
        </p>
      </div>
      {introPlaying && (
        <button type="button" className="pointer-events-auto btn glass absolute right-4 bottom-4 md:right-8 md:bottom-8" onClick={() => set({ introPlaying: false, introSeen: true })}>
          <Icon name="SkipForward" size={16} /> Açılışı atla
        </button>
      )}
    </div>
  );
}
