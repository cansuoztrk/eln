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

/**
 * Opening title sequence over the first-visit camera flight. It mounts with
 * the flight's first frame and its CSS timing matches the 7.5 s flight:
 * place line, title, slogan, then the letterbox bars retract.
 */
function IntroTitles({ onSkip }: { onSkip: () => void }) {
  // bars hold still while the 3D world loads; titles and bar retraction start with the flight
  const flying = useView((s) => s.introFlying);
  return (
    <div className="no-print fixed inset-0 z-10 pointer-events-none">
      <div className={`intro-bar intro-bar--top ${flying ? 'intro-bar--run' : ''}`} aria-hidden="true" />
      <div className={`intro-bar intro-bar--bottom ${flying ? 'intro-bar--run' : ''}`} aria-hidden="true" />
      <h1 className="sr-only">ASLAN 2035 OMEGA</h1>
      {flying && (
        <div className="absolute inset-x-0 bottom-[19vh] px-6 text-center" aria-hidden="true">
          <p className="intro-line kicker" style={{ animationDelay: '0.5s' }}>
            RAMS Park · Seyrantepe · İstanbul
          </p>
          <p className="intro-line intro-line--long hero-title mt-2" style={{ animationDelay: '2.3s' }}>
            ASLAN 2035 <span className="hero-omega">OMEGA</span>
          </p>
          <p className="intro-line display mt-3 text-[clamp(16px,2vw,24px)] text-text/90" style={{ animationDelay: '4.3s' }}>
            Bir Efsaneyi İzleme. Geleceğini Tasarla.
          </p>
        </div>
      )}
      {/* focused on mount so keyboard users can skip at once */}
      <button type="button" autoFocus className="pointer-events-auto btn glass absolute right-4 bottom-4 md:right-8 md:bottom-8" onClick={onSkip}>
        <Icon name="SkipForward" size={16} /> Açılışı atla
      </button>
    </div>
  );
}

export function Hero() {
  const introPlaying = useView((s) => s.introPlaying);
  const set = useView((s) => s.set);
  if (introPlaying) return <IntroTitles onSkip={() => set({ introPlaying: false, introFlying: false, introSeen: true })} />;
  return (
    <div className="no-print fixed inset-0 z-10 pointer-events-none flex flex-col justify-end lg:justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(7,8,12,0.78),transparent_62%)]" aria-hidden="true" />
      {/* phones: the text sits low over the model, so shade the lower part for legibility */}
      <div className="absolute inset-x-0 bottom-0 h-[78%] lg:hidden bg-gradient-to-t from-ink via-ink/85 to-transparent" aria-hidden="true" />
      <div className="relative px-5 md:px-10 lg:px-[7vw] pb-8 lg:pb-0 max-w-[1100px]">
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
        <div className="fade-up mt-6 lg:mt-7 grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:gap-2.5 pointer-events-auto" style={{ animationDelay: '1.4s' }}>
          {CTAS.map((c, i) => (
            <button
              key={c.label}
              type="button"
              onClick={c.go}
              className={`btn ${i === 0 ? 'btn-primary col-span-2' : i === 1 ? 'btn-gold' : 'glass'} min-h-12 h-auto py-2 lg:h-12 lg:py-0 px-3 lg:px-4 rounded-xl !justify-start lg:!justify-center`}
              aria-label={`${c.label} — ${c.tr}`}
            >
              <Icon name={c.icon} size={17} />
              <span className="text-left leading-tight">
                <span className="block text-[12.5px] font-extrabold tracking-[0.06em]">{c.label}</span>
                <span className="block text-[11px] font-medium opacity-75">{c.tr}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="fade-up mt-6 text-[11.5px] text-faint max-w-[620px] leading-relaxed pointer-events-auto" style={{ animationDelay: '1.6s' }}>
          Bu platform Galatasaray SK tarafından onaylanmış resmî bir dönüşüm projesi değildir. 3D model yayımlanmış oranlara dayanan yaklaşık bir konsept modeldir; birebir ölçülü değildir. Doğrulanmış bilgiler, öneriler ve simülasyonlar etiketlerle ayrılır.{' '}
          <button type="button" className="underline hover:text-text" onClick={() => navigate('about')}>
            Kaynaklar ve varsayımlar
          </button>
        </p>
      </div>
    </div>
  );
}
