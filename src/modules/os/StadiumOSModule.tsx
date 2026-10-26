import { useEffect, useMemo, useState } from 'react';
import { navigate } from '@/core/router';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import type { LayerId } from '@/core/layers';
import type { ModuleId } from '@/core/modules';
import type { DesignConfig } from '@/core/model/design';
import { worldApi, type CameraPose } from '@/world/worldApi';
import { BarList, LineChart } from '@/ui/charts';
import { Badge, Icon, Note, Section } from '@/ui/primitives';

type OsId = 'energy' | 'facility' | 'crowd' | 'access' | 'events' | 'environment' | 'fan';

interface OsModule {
  id: OsId;
  name: string;
  subtitle: string;
  icon: string;
  layers: LayerId[];
  pose: CameraPose;
  concepts: string[];
  link?: { label: string; module: ModuleId };
}

const MODULES: OsModule[] = [
  {
    id: 'energy',
    name: 'Energy Management',
    subtitle: 'Aydınlatma ve enerji yönetimi senaryoları',
    icon: 'Zap',
    layers: ['lighting', 'solar'],
    pose: { pos: [200, 150, 230], target: [0, 30, 0] },
    concepts: ['Maç öncesi / sırası / sonrası aydınlatma profilleri', 'Çatı GES üretiminin tüketimle ilişkisinin izlenmesi (gerçek veriye bağlanırsa)', 'Gösteri aydınlatması için enerji bütçesi kavramı'],
    link: { label: 'Green Stadium Engine', module: 'green' },
  },
  {
    id: 'facility',
    name: 'Facility Intelligence',
    subtitle: 'Bakım kavramları ve teknik tesis bölgeleri',
    icon: 'Wrench',
    layers: ['structure', 'concourse', 'massing'],
    pose: { pos: [-220, 110, -200], target: [0, 20, 0] },
    concepts: ['Bileşen bazlı bakım takvimi (dijital ikiz üzerinde)', 'Çatı, cephe ve ekran bakım erişim bölgeleri', 'Arıza kayıtlarının 3D konumla ilişkilendirilmesi'],
  },
  {
    id: 'crowd',
    name: 'Crowd Flow',
    subtitle: 'Konsept yoğunluk ve dolaşım haritaları',
    icon: 'Users',
    layers: ['transit', 'concourse'],
    pose: { pos: [40, 330, 330], target: [0, 0, 20] },
    concepts: ['Kapı bazlı geliş eğrileri', 'Dolaşım halkasında yoğunluk izleme kavramı', 'Alternatif güzergâh yönlendirmesi'],
    link: { label: 'Crowd Flow Simulator', module: 'crowd' },
  },
  {
    id: 'access',
    name: 'Access & Inclusion',
    subtitle: 'Erişilebilirlik güzergâhları ve hizmet noktaları',
    icon: 'Accessibility',
    layers: ['access', 'transit'],
    pose: { pos: [0, 480, 120], target: [0, 0, 0] },
    concepts: ['Erişilebilir indirme noktasından tribün platformuna kesintisiz rota', 'Hizmet noktaları ve yardım masaları', 'Duyusal açıdan sakin alan kavramı'],
    link: { label: 'Fan Journey Builder', module: 'journey' },
  },
  {
    id: 'events',
    name: 'Event Operations',
    subtitle: 'Etkinlik türlerinin mekânsal ihtiyaçları',
    icon: 'CalendarDays',
    layers: ['pitch', 'surroundings', 'concourse'],
    pose: { pos: [-160, 120, 260], target: [0, 10, 40] },
    concepts: ['Futbol, konser ve festival düzenleri', 'Saha koruma ve sahne konumları', 'Meydan ve etkinlik çimi kullanımı'],
    link: { label: 'Stadium City', module: 'city' },
  },
  {
    id: 'environment',
    name: 'Environmental Performance',
    subtitle: 'Enerji, su ve atık yönetimi senaryoları',
    icon: 'Leaf',
    layers: ['solar', 'landscape'],
    pose: { pos: [260, 220, -120], target: [0, 0, 0] },
    concepts: ['Yağmur suyu toplama ve sulama', 'Atık ayrıştırma noktaları', 'Saha bakımında kaynak optimizasyonu'],
    link: { label: 'Green Stadium Engine', module: 'green' },
  },
  {
    id: 'fan',
    name: 'Fan Experience',
    subtitle: 'Yön bulma, koltuk keşfi ve sosyal alanlar',
    icon: 'Heart',
    layers: ['surroundings', 'screens'],
    pose: { pos: [60, 40, 260], target: [0, 8, 150] },
    concepts: ['Kişisel maç günü planı', 'Koltuk görüşü önizlemesi', 'Sosyal alan ve buluşma noktaları'],
    link: { label: 'Seat Experience 360', module: 'seats' },
  },
];

/** Deterministic pseudo-random sample data (clearly labelled as simulation). */
function noise(seed: number, i: number) {
  const x = Math.sin(seed * 91.7 + i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const HOURS = ['-6s', '-5s', '-4s', '-3s', '-2s', '-1s', 'Başlama', '+1s', '+2s', '+3s'];

function energySeries(d: DesignConfig) {
  const base = [12, 14, 18, 26, 42, 68, 92, 90, 55, 20];
  const factor = d.green.efficientLighting ? 0.78 : 1;
  const show = d.show.active ? 1.06 : 1;
  return [
    { name: 'Referans profil', values: base.map((v, i) => Math.min(100, v + noise(1, i) * 4)) },
    { name: 'Bu tasarım', values: base.map((v, i) => Math.min(100, v * factor * show + noise(2, i) * 4)) },
  ];
}

function arrivalSeries() {
  const base = [2, 4, 8, 15, 32, 58, 22, 3, 8, 30];
  return [{ name: 'Geliş yoğunluğu', values: base.map((v, i) => v + noise(3, i) * 5) }];
}

export default function StadiumOSModule() {
  const design = useDesign((s) => s.design);
  const set = useView((s) => s.set);
  const [active, setActive] = useState<OsId>('energy');
  const mod = MODULES.find((m) => m.id === active)!;

  useEffect(() => {
    set({ highlight: mod.layers });
    worldApi.flyTo(mod.pose, { mode: 'explorer' });
  }, [mod, set]);

  useEffect(() => () => useView.getState().set({ highlight: [] }), []);

  const energy = useMemo(() => energySeries(design), [design]);
  const arrivals = useMemo(() => arrivalSeries(), []);

  return (
    <div>
      <Section title="Kontrol merkezi konsepti" kicker="The Stadium OS" badges={<Badge kind="sim" />}>
        <div className="grid grid-cols-2 gap-1.5">
          {MODULES.map((m) => (
            <button key={m.id} type="button" onClick={() => setActive(m.id)} aria-pressed={active === m.id} className={`text-left rounded-xl border px-2.5 py-2 ${active === m.id ? 'border-aslan bg-aslan/12' : 'border-line bg-surface-2 hover:border-white/20'}`}>
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                <Icon name={m.icon} size={14} className="text-gold" /> {m.name}
              </span>
              <span className="block text-[11px] muted leading-snug mt-0.5">{m.subtitle}</span>
            </button>
          ))}
        </div>
        <p className="text-[11.5px] muted mt-2">Seçilen modülün ilgili katmanları 3D modelde sarı vurgu ile gösterilir.</p>
      </Section>

      <Section title={mod.name} kicker="Modül" badges={<Badge kind="sim">Simülasyon — gerçek ölçüm değildir</Badge>}>
        <ul className="list-dots mb-3">
          {mod.concepts.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {active === 'energy' && <LineChart title="Aydınlatma yükü — birimsiz örnek endeks (0–100)" x={HOURS} series={energy} />}
        {active === 'crowd' && <LineChart title="Kapılara geliş — birimsiz örnek endeks" x={HOURS} series={arrivals} />}
        {active === 'facility' && (
          <BarList
            title="Örnek bakım iş yükü dağılımı (simüle, birimsiz)"
            items={[
              { label: 'Çatı ve taşıyıcı', value: 30 + noise(4, 1) * 20 },
              { label: 'Cephe', value: 20 + noise(4, 2) * 20 },
              { label: 'LED ekranlar', value: design.screens.layout === 'standard' ? 15 : 34 + noise(4, 3) * 10 },
              { label: 'Aydınlatma', value: 25 + noise(4, 4) * 15 },
              { label: 'Saha', value: 28 + noise(4, 5) * 12 },
            ]}
          />
        )}
        {active === 'access' && (
          <div className="text-[12.5px] flex flex-col gap-2">
            <div className="card card-tight flex justify-between">
              <span>Erişilebilir rotalar</span>
              <strong>{design.access.routes ? 'Tasarımda açık' : 'Tasarımda kapalı'}</strong>
            </div>
            <div className="card card-tight flex justify-between">
              <span>Hizmet noktaları</span>
              <strong>{design.access.servicePoints ? '4 örnek nokta' : 'Kapalı'}</strong>
            </div>
            {!design.access.routes && (
              <button type="button" className="btn btn-sm btn-primary self-start" onClick={() => useDesign.getState().patch({ access: { routes: true, servicePoints: true } }, 'Erişilebilir rotalar açıldı', { respectLocks: false })}>
                Rotaları ve hizmet noktalarını göster
              </button>
            )}
          </div>
        )}
        {active === 'events' && (
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Etkinlik</th>
                <th scope="col">Mekânsal ihtiyaç (kavramsal)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className="!font-normal">Futbol</th>
                <td>Saha, tüm tribünler, meydan ön toplanma</td>
              </tr>
              <tr>
                <th scope="row" className="!font-normal">Konser</th>
                <td>Saha koruma örtüsü, sahne (kale arkası), ek çıkış planı</td>
              </tr>
              <tr>
                <th scope="row" className="!font-normal">Festival</th>
                <td>Etkinlik çimi, sosyal alan pavyonları, meydan ekranı</td>
              </tr>
              <tr>
                <th scope="row" className="!font-normal">Stadyum turu</th>
                <td>Müze, tünel, saha kenarı, tribün girişi</td>
              </tr>
            </tbody>
          </table>
        )}
        {active === 'environment' && (
          <BarList
            title="Etkinleştirilmiş çevresel sistemler (bu tasarım)"
            max={1}
            items={[
              { label: 'Yağmur suyu', value: design.green.rainwater ? 1 : 0 },
              { label: 'Atık azaltma', value: design.green.waste ? 1 : 0 },
              { label: 'Saha bakımı', value: design.green.pitchCare ? 1 : 0 },
              { label: 'Peyzaj/gölge', value: design.green.landscape ? 1 : 0 },
              { label: 'Toplu taşıma', value: design.green.transitLink ? 1 : 0 },
            ]}
          />
        )}
        {active === 'fan' && (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="chip" onClick={() => navigate('seats')}>
              Koltuk görüşü
            </button>
            <button type="button" className="chip" onClick={() => navigate('journey')}>
              Maç günü planı
            </button>
            <button type="button" className="chip" onClick={() => navigate('city')}>
              Sosyal alanlar
            </button>
          </div>
        )}
        {mod.link && (
          <button type="button" className="btn btn-sm mt-3" onClick={() => navigate(mod.link!.module)}>
            {mod.link.label} <Icon name="ArrowRight" size={14} />
          </button>
        )}
      </Section>

      <Note kind="warn">
        Stadium OS bir konsept arayüzdür. Gerçek bir veri kaynağına bağlı değildir; canlı ölçüm, gerçek zamanlı kontrol veya resmî bir stadyum yönetim paneli değildir. Grafiklerdeki değerler birimsiz örnek endekslerdir.
      </Note>
    </div>
  );
}
