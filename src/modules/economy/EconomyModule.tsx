import { useEffect, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { derivePhaseConfig } from '@/core/model/phases';
import { worldApi } from '@/world/worldApi';
import { Badge, Dots, Icon, Note, Section } from '@/ui/primitives';

interface Scenario {
  id: 'A' | 'B' | 'C';
  name: string;
  scope: string;
  benefit: string[];
  dependencies: string[];
  construction: number;
  operations: string;
  risk: number;
  data: string[];
  phase: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'A',
    name: 'Incremental Modernization',
    scope: 'Daha sınırlı müdahaleler: aydınlatma, dijital ekranlar, yön bulma ve erişilebilir rotalar. Yapısal değişiklik yok.',
    benefit: ['Kısa sürede görünür atmosfer etkisi', 'Daha anlaşılır giriş ve yön bulma'],
    dependencies: ['Elektrik altyapısı kapasitesi', 'Mevcut montaj noktaları', 'Operasyon ekipleriyle süreç tasarımı'],
    construction: 2,
    operations: 'Sezon arası çalışma pencereleriyle sınırlı kesinti.',
    risk: 2,
    data: ['Mevcut elektrik yük verisi', 'Kapı ve dolaşım gözlemleri', 'Taraftar araştırması'],
    phase: 2,
  },
  {
    id: 'B',
    name: 'Major Transformation',
    scope: 'Daha kapsamlı yenilikler: çevre alanları, müze ve deneyim alanı, sosyal yaşam bölgeleri, peyzaj ve yeşil sistemler.',
    benefit: ['Maç öncesi/sonrası yaşam alanı', 'Maç olmayan günlerde ziyaret nedeni', 'Sürdürülebilirlik görünürlüğü'],
    dependencies: ['İmar ve parsel durumu', 'Kurum onayları', 'Finansman modeli', 'Etaplama'],
    construction: 4,
    operations: 'Çevre inşaatı sırasında maç günü erişim planı gerekir.',
    risk: 3,
    data: ['Parsel ve mülkiyet bilgisi', 'Ulaşım ve yaya sayımları', 'İşletme ve gelir modeli varsayımları'],
    phase: 3,
  },
  {
    id: 'C',
    name: 'Long-Term Vision',
    scope: 'Daha uzun süreli ve yüksek kapsamlı dönüşüm araştırmaları: çatı formu eklentileri, medya cephesi, genişletilmiş GES.',
    benefit: ['İkonik bir gece kimliği', 'Bütünleşik maç günü ekosistemi'],
    dependencies: ['Statik ve rüzgâr analizleri', 'Yangın/tahliye mühendisliği', 'Uzun vadeli finansman', 'Resmî onaylar'],
    construction: 5,
    operations: 'Uzun süreli ve etaplı inşaat; kapasite kısıtları olası.',
    risk: 5,
    data: ['Taşıyıcı sistem rölövesi ve kapasite analizi', 'Detaylı maliyet modeli (varsayımlar, tarih, belirsizlik aralıkları)', 'Paydaş görüşleri'],
    phase: 4,
  },
];

export default function EconomyModule() {
  const design = useDesign((s) => s.design);
  const setPreview = useView((s) => s.setPreview);
  const [selected, setSelected] = useState<Scenario['id']>('A');
  const sc = SCENARIOS.find((s) => s.id === selected)!;

  useEffect(() => {
    setPreview(sc.phase >= 4 ? null : derivePhaseConfig(design, sc.phase), `Senaryo ${sc.id}: ${sc.name}`);
    worldApi.flyTo({ pos: [250, 140, 300], target: [0, 15, 30] }, { mode: 'explorer' });
  }, [sc, design, setPreview]);

  useEffect(() => () => useView.getState().setPreview(null), []);

  return (
    <div>
      <Section title="Dönüşüm yaklaşımları" kicker="The Scenario Economy" badges={<Badge kind="concept">Karar destek konsepti</Badge>}>
        <div className="flex flex-col gap-1.5">
          {SCENARIOS.map((s) => (
            <button key={s.id} type="button" aria-pressed={selected === s.id} onClick={() => setSelected(s.id)} className={`text-left rounded-xl border px-3 py-2.5 ${selected === s.id ? 'border-aslan bg-aslan/10' : 'border-line bg-surface-2 hover:border-white/20'}`}>
              <span className="text-[13.5px] font-semibold">
                Scenario {s.id} — {s.name}
              </span>
              <span className="flex gap-4 mt-1 text-[11px] muted">
                <span className="flex items-center gap-1.5">
                  Yapım karmaşıklığı <Dots value={s.construction} label="Yapım karmaşıklığı" />
                </span>
                <span className="flex items-center gap-1.5">
                  Risk <Dots value={s.risk} label="Tahmini risk" />
                </span>
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11.5px] muted mt-2">Seçilen senaryo, tasarımınızdan türetilen ilgili aşamayla 3D modelde önizlenir.</p>
      </Section>

      <Section title={`Scenario ${sc.id} — ${sc.name}`} kicker="Değerlendirme" badges={sc.id === 'C' ? <Badge kind="eng" /> : undefined}>
        <dl className="text-[12.5px] flex flex-col gap-2.5">
          <Row label="Proje kapsamı">{sc.scope}</Row>
          <Row label="Beklenen kullanıcı faydası">
            <ul className="list-dots">
              {sc.benefit.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Row>
          <Row label="Teknik bağımlılıklar">
            <ul className="list-dots">
              {sc.dependencies.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Row>
          <Row label="Yapım karmaşıklığı (kavramsal)">
            <Dots value={sc.construction} label="Yapım karmaşıklığı" />
          </Row>
          <Row label="Operasyonel etkiler">{sc.operations}</Row>
          <Row label="Tahmini risk düzeyi (kavramsal)">
            <Dots value={sc.risk} label="Risk" />
          </Row>
          <Row label="Ek veri gereksinimleri">
            <ul className="list-dots">
              {sc.data.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Row>
        </dl>
      </Section>

      <Section title="Yan yana">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Ölçüt</th>
              {SCENARIOS.map((s) => (
                <th key={s.id} scope="col">
                  {s.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="!font-normal">Yapım karmaşıklığı</th>
              {SCENARIOS.map((s) => (
                <td key={s.id}>
                  <Dots value={s.construction} label={`${s.id} yapım`} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="!font-normal">Risk</th>
              {SCENARIOS.map((s) => (
                <td key={s.id}>
                  <Dots value={s.risk} label={`${s.id} risk`} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="!font-normal">Maliyet</th>
              {SCENARIOS.map((s) => (
                <td key={s.id} className="muted">
                  Tahmin yok
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Section>

      <Note kind="warn">
        <Icon name="Info" size={13} className="inline mr-1" />
        Doğrulanmış teklif veya dayanak olmadığı için kesin para değeri üretilmez. İleride maliyet modeli eklenirse tahminlerin varsayımları, tarihleri ve belirsizlik aralıkları açıklanmalıdır. Bu modül bir fizibilite raporunun yerini almaz; hangi soruların araştırılması gerektiğini gösterir.
      </Note>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="field-label mb-0.5">{label}</dt>
      <dd className="text-[#dcd9d2] m-0">{children}</dd>
    </div>
  );
}
