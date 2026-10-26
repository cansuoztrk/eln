import { useEffect, useState } from 'react';
import { navigate, useRoute } from '@/core/router';
import { useView, type AtmosphereId } from '@/core/store/viewStore';
import { worldApi, type CameraPose } from '@/world/worldApi';
import { Badge, Icon, Note, Section, Slider } from '@/ui/primitives';
import { ATMOSPHERE_INFO, audioEngine } from './audio';

const ORDER: AtmosphereId[] = ['silent', 'ambient', 'prematch', 'kickoff', 'goal', 'championship'];
const OCCUPANCY: Record<AtmosphereId, number> = { silent: 0, ambient: 0.25, prematch: 0.72, kickoff: 0.97, goal: 1, championship: 1 };
const POSES: Record<AtmosphereId, CameraPose> = {
  silent: { pos: [260, 120, 320], target: [0, 15, 0] },
  ambient: { pos: [-230, 90, 260], target: [0, 15, 0] },
  prematch: { pos: [60, 30, 230], target: [0, 10, 150] },
  kickoff: { pos: [0, 30, 70], target: [0, 4, 0] },
  goal: { pos: [-70, 24, 40], target: [30, 8, -20] },
  championship: { pos: [190, 95, 230], target: [0, 20, 0] },
};
const ICON: Record<AtmosphereId, string> = { silent: 'Moon', ambient: 'Music', prematch: 'Users', kickoff: 'Clock', goal: 'Flame', championship: 'Star' };

export function applyAtmosphere(id: AtmosphereId, fly = true) {
  useView.getState().set({ atmosphere: id, occupancy: OCCUPANCY[id] });
  if (fly) worldApi.flyTo(POSES[id], { mode: 'explorer' });
}

export default function MatchdayModule() {
  const route = useRoute();
  const atmosphere = useView((s) => s.atmosphere);
  const soundOn = useView((s) => s.soundOn);
  const volume = useView((s) => s.volume);
  const set = useView((s) => s.set);
  const toast = useView((s) => s.toast);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    const m = route.params.get('mode') as AtmosphereId | null;
    if (m && ORDER.includes(m)) setTimeout(() => applyAtmosphere(m), worldApi.ready ? 0 : 900);
  }, [route.params]);

  useEffect(() => {
    if (!auto) return;
    const idx = ORDER.indexOf(atmosphere);
    const t = setTimeout(() => {
      if (idx >= ORDER.length - 1) setAuto(false);
      else applyAtmosphere(ORDER[idx + 1]);
    }, 9000);
    return () => clearTimeout(t);
  }, [auto, atmosphere]);

  const enableSound = async () => {
    if (soundOn) {
      audioEngine.stop();
      set({ soundOn: false });
      return;
    }
    const ok = await audioEngine.start(atmosphere, volume);
    if (ok) set({ soundOn: true });
    else toast('Bu tarayıcıda Web Audio kullanılamıyor; ses oynatılamıyor.', 'error');
  };

  return (
    <div>
      <Section title="Atmosfer seçin" kicker="Sound & Atmosphere Studio">
        <div className="grid grid-cols-2 gap-2">
          {ORDER.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={atmosphere === id}
              onClick={() => {
                setAuto(false);
                applyAtmosphere(id);
              }}
              className={`text-left rounded-xl border p-2.5 ${atmosphere === id ? 'border-aslan bg-aslan/12' : 'border-line bg-surface-2 hover:border-white/20'}`}
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <Icon name={ICON[id]} size={15} className="text-gold" /> {ATMOSPHERE_INFO[id].name}
              </span>
              <span className="block text-[11.5px] muted mt-1 leading-snug">{ATMOSPHERE_INFO[id].description}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-sm mt-2.5" aria-pressed={auto} onClick={() => (auto ? setAuto(false) : (applyAtmosphere('ambient'), setAuto(true)))}>
          <Icon name={auto ? 'Pause' : 'Play'} size={14} /> {auto ? 'Maç günü akışını durdur' : 'Maç günü akışını oynat'}
        </button>
      </Section>

      <Section title="Ses" kicker="Başlangıçta kapalı" badges={<Badge kind="concept">Özgün sentez ses</Badge>}>
        <button type="button" className={`btn w-full ${soundOn ? '' : 'btn-gold'}`} onClick={enableSound} aria-pressed={soundOn}>
          <Icon name={soundOn ? 'VolumeX' : 'Volume2'} size={16} /> {soundOn ? 'Sesi kapat' : 'Sesi aç'}
        </button>
        <Slider label="Ses seviyesi" value={volume} onChange={(v) => set({ volume: v })} />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="btn btn-sm" disabled={!soundOn} onClick={() => audioEngine.trigger('whistle')}>
            Düdük
          </button>
          <button type="button" className="btn btn-sm" disabled={!soundOn} onClick={() => audioEngine.trigger('roar')}>
            Kalabalık dalgası
          </button>
          <button type="button" className="btn btn-sm" disabled={!soundOn} onClick={() => audioEngine.trigger('horn')}>
            Korna
          </button>
        </div>
        <p className="text-[11.5px] muted mt-2 leading-snug">
          Tüm sesler tarayıcıda gürültü, osilatör ve filtrelerle gerçek zamanlı üretilir. Kulüp tezahüratı, marş veya yayın kaydı kullanılmaz.
        </p>
      </Section>

      <Section title="Fan Universe bağlantıları">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="chip" onClick={() => navigate('seats')}>
            <Icon name="Armchair" size={14} /> Koltuktan izle
          </button>
          <button type="button" className="chip" onClick={() => navigate('journey')}>
            <Icon name="Navigation" size={14} /> Maç günü planı
          </button>
          <button type="button" className="chip" onClick={() => navigate('lightshow')}>
            <Icon name="Sparkles" size={14} /> Işık gösterisi
          </button>
        </div>
      </Section>

      <Note>Tribün doluluğu, koreografi ve maç bilgileri görsel örnektir; gerçek bir maç veya bilet verisi kullanılmaz.</Note>
    </div>
  );
}
