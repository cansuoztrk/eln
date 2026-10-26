import { useEffect, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { SOLAR_LABEL } from '@/core/model/labels';
import type { DesignConfig } from '@/core/model/design';
import { worldApi, type CameraPose } from '@/world/worldApi';
import { LineChart } from '@/ui/charts';
import { Badge, Icon, Note, Section, Segmented, Toggle } from '@/ui/primitives';

type GreenKey = 'rainwater' | 'efficientLighting' | 'pitchCare' | 'landscape' | 'waste' | 'transitLink';

const SYSTEMS: { key: GreenKey; name: string; text: string; impact: 'Düşük' | 'Orta' | 'Yüksek'; pose: CameraPose }[] = [
  { key: 'efficientLighting', name: 'Verimli aydınlatma', text: 'Projektörler için verimli armatür ve senaryo bazlı aydınlatma kavramı. Modelde projektör ışık rengi değişir.', impact: 'Orta', pose: { pos: [-30, 30, 20], target: [30, 40, -40] } },
  { key: 'rainwater', name: 'Yağmur suyu yönetimi', text: 'Meydan çevresinde biyo-hendekler ve depolama tankları kavramı.', impact: 'Orta', pose: { pos: [-60, 90, 300], target: [0, 0, 170] } },
  { key: 'pitchCare', name: 'Saha bakımında kaynak optimizasyonu', text: 'Bölgesel sulama ve sensörlerle izleme kavramı (sahadaki halkalar).', impact: 'Düşük', pose: { pos: [0, 70, 60], target: [0, 0, 0] } },
  { key: 'landscape', name: 'Peyzaj ve gölgelendirme', text: 'Ağaçlar, çim alanlar ve gölgelikler; ısı adası etkisini azaltma kavramı.', impact: 'Orta', pose: { pos: [280, 70, 60], target: [170, 0, -40] } },
  { key: 'waste', name: 'Atık azaltma yaklaşımı', text: 'Meydan ve bağlantılarda ayrıştırma istasyonları.', impact: 'Düşük', pose: { pos: [70, 30, 190], target: [0, 0, 140] } },
  { key: 'transitLink', name: 'Toplu taşımayla bağlantı', text: 'Raylı sistem bağlantısından kapılara vurgulu yürüyüş rotası (şematik).', impact: 'Yüksek', pose: { pos: [220, 120, -260], target: [80, 0, -120] } },
];

const HOURS = ['-6s', '-5s', '-4s', '-3s', '-2s', '-1s', 'Başlama', '+1s', '+2s', '+3s'];

/** Illustrative, unitless consumption index — explicitly not a measurement. */
function indexSeries(d: Pick<DesignConfig, 'green' | 'show'>) {
  const base = [18, 20, 24, 32, 48, 70, 94, 92, 58, 24];
  const lighting = d.green.efficientLighting ? 0.8 : 1;
  return base.map((v, i) => {
    const lightShare = i >= 4 && i <= 8 ? 0.55 : 0.25;
    return Math.round(v * (1 - lightShare + lightShare * lighting) * (d.show.active ? 1.04 : 1));
  });
}

export default function GreenModule() {
  const design = useDesign((s) => s.design);
  const patch = useDesign((s) => s.patch);
  const [snap, setSnap] = useState<{ name: string; green: DesignConfig['green'] } | null>(null);

  useEffect(() => {
    worldApi.flyTo({ pos: [240, 210, 260], target: [0, 10, 20] }, { mode: 'explorer' });
  }, []);

  const toggle = (key: GreenKey, v: boolean) => patch({ green: { [key]: v } }, `${SYSTEMS.find((s) => s.key === key)!.name}: ${v ? 'açık' : 'kapalı'}`, { respectLocks: false });
  const active = SYSTEMS.filter((s) => design.green[s.key]).length;

  const series = [{ name: 'Bu senaryo', values: indexSeries(design) }];
  if (snap) series.unshift({ name: snap.name, values: indexSeries({ green: snap.green, show: design.show }) });

  return (
    <div>
      <Section title="Güneş enerjisi" kicker="The Green Stadium Engine" badges={<Badge kind="verified">Mevcut çatı GES’i</Badge>}>
        <p className="text-[12.5px] leading-relaxed text-[#dcd9d2] mb-2">
          Stadyumun çatısında 2022’den bu yana yaklaşık 4,2–4,3 MW kurulu güce sahip, 10.000’den fazla panelli bir güneş enerjisi santrali bulunmaktadır (Enerjisa, StadiumDB, Wikipedia). Modeldeki panel yerleşimi temsilidir.
        </p>
        <Segmented
          label="GES senaryosu"
          value={design.green.solar}
          onChange={(v) => {
            patch({ green: { solar: v } }, `GES: ${SOLAR_LABEL[v]}`, { respectLocks: false });
            worldApi.flyTo(v === 'extended' ? { pos: [120, 160, -330], target: [0, 10, -150] } : { pos: [90, 280, -300], target: [0, 30, -40] }, { mode: 'explorer' });
          }}
          options={[
            { value: 'existing', label: 'Mevcut (temsili)' },
            { value: 'extended', label: 'Genişletilmiş konsept' },
          ]}
        />
        {design.green.solar === 'extended' && (
          <div className="mt-2">
            <Note kind="eng">Otopark ve meydan kanopileri konsepttir; taşıyıcı sistem, imar uygunluğu ve şebeke bağlantısı ayrıca incelenmelidir.</Note>
          </div>
        )}
      </Section>

      <Section title="Çevresel sistemler" kicker={`${active} / ${SYSTEMS.length} etkin`}>
        <div className="flex flex-col gap-1.5">
          {SYSTEMS.map((s) => (
            <div key={s.key} className="card card-tight !py-2">
              <Toggle label={s.name} description={s.text} checked={design.green[s.key]} onChange={(v) => toggle(s.key, v)} />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] muted">Kavramsal etki göstergesi: {s.impact}</span>
                <button type="button" className="btn btn-sm btn-ghost !min-h-[26px]" onClick={() => worldApi.flyTo(s.pose, { mode: 'explorer' })}>
                  <Icon name="Eye" size={13} /> 3D’de bak
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Enerji tüketimini anlamaya yönelik simülasyon" badges={<Badge kind="sim">Birimsiz örnek endeks</Badge>}>
        <div className="flex gap-1.5 mb-2">
          <button type="button" className="btn btn-sm" onClick={() => setSnap({ name: 'Kaydedilen senaryo', green: structuredClone(design.green) })}>
            <Icon name="Save" size={14} /> Karşılaştırma için kaydet
          </button>
          {snap && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSnap(null)}>
              Karşılaştırmayı kaldır
            </button>
          )}
        </div>
        <LineChart title="Maç günü tüketim profili (örnek endeks, 0–100)" x={HOURS} series={series} />
        {snap && (
          <table className="tbl mt-3">
            <thead>
              <tr>
                <th scope="col">Sistem</th>
                <th scope="col">Kaydedilen</th>
                <th scope="col">Şimdiki</th>
              </tr>
            </thead>
            <tbody>
              {SYSTEMS.map((s) => (
                <tr key={s.key}>
                  <th scope="row" className="!font-normal">
                    {s.name}
                  </th>
                  <td>{snap.green[s.key] ? 'Açık' : '—'}</td>
                  <td>{design.green[s.key] ? 'Açık' : '—'}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="!font-normal">GES</th>
                <td>{SOLAR_LABEL[snap.green.solar]}</td>
                <td>{SOLAR_LABEL[design.green.solar]}</td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="text-[11.5px] muted mt-2 leading-snug">
          Varsayımlar: maç saatlerinde aydınlatmanın toplam tüketimdeki payı kavramsal olarak daha yüksek kabul edilmiş; verimli aydınlatma bu payı göreli olarak azaltır. Gerçek tüketim, üretim veya maliyet verisi kullanılmamıştır; değerler ölçülmüş sonuç değildir.
        </p>
      </Section>
    </div>
  );
}
