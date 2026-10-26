import { useEffect } from 'react';
import { useRoute } from '@/core/router';
import { useView } from '@/core/store/viewStore';
import { POIS, POI_BY_ID } from '@/world/camera/pois';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section, Segmented } from '@/ui/primitives';

export default function ExploreModule() {
  const route = useRoute();
  const mode = useView((s) => s.cameraMode);
  const poi = useView((s) => s.poi);
  const view2D = useView((s) => s.view2D);

  useEffect(() => {
    const target = route.params.get('poi');
    if (!target || !POI_BY_ID[target]) return;
    worldApi.flyToPoi(target);
  }, [route.params]);

  const current = poi ? POI_BY_ID[poi] : null;
  return (
    <div>
      <Section title="Gezinme biçimi" kicker="The Walkable Stadium">
        <Segmented
          label="Gezinme biçimi"
          value={mode === 'explorer' ? 'explorer' : 'walkthrough'}
          onChange={(v) => (v === 'explorer' ? worldApi.resetView() : worldApi.flyToPoi(poi ?? 'entry-plaza'))}
          options={[
            { value: 'explorer', label: 'Explorer Mode', icon: 'Move' },
            { value: 'walkthrough', label: 'Walkthrough Mode', icon: 'Footprints' },
          ]}
        />
        <p className="text-[12.5px] muted mt-2.5 leading-relaxed">
          {mode === 'explorer'
            ? 'Fareyle sürükleyerek döndürün, tekerlekle yakınlaştırın, sağ tıkla kaydırın. Kamera zemin altına inemez ve sahne sınırları dışına çıkamaz.'
            : 'Sürükleyerek etrafa bakın. 3D görünüme odaklanıp W/A/S/D ile noktanın güvenli yürüme yarıçapı içinde hareket edin. İç ve dış mekân arasında geçişler kararma ile yapılır; kamera duvarlardan geçmez.'}
        </p>
        {view2D && <Note kind="warn">Gezinti noktaları 3D görünüm gerektirir. Üst menüden 3D’ye geçebilirsiniz.</Note>}
      </Section>

      <Section title="Gezinti noktaları" kicker="Walkthrough">
        <ol className="grid grid-cols-1 gap-1.5">
          {POIS.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                aria-current={poi === p.id ? 'true' : undefined}
                onClick={() => worldApi.flyToPoi(p.id)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 flex gap-3 items-start transition ${poi === p.id ? 'border-aslan bg-aslan/12' : 'border-line bg-surface-2 hover:border-white/20'}`}
              >
                <span className="w-6 h-6 shrink-0 rounded-full bg-surface-3 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1">
                  <span className="text-[13.5px] font-semibold flex items-center gap-2">
                    {p.name}
                    {p.concept && <Badge kind="concept">İç mekân konsept</Badge>}
                  </span>
                  <span className="block text-[12px] muted leading-snug mt-0.5">{p.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Section>

      {current && (
        <Section title={`Şu an: ${current.name}`}>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="btn btn-sm" onClick={() => worldApi.flyToPoi(current.id)}>
              <Icon name="RotateCcw" size={14} /> Noktanın başına dön
            </button>
            <button type="button" className="btn btn-sm" onClick={() => worldApi.resetView()}>
              <Icon name="House" size={14} /> Başlangıç görünümü
            </button>
          </div>
        </Section>
      )}

      <Note>
        İç mekân geometrisi gerçek planlara dayanmaz; dolaşım, tribün girişi ve tünel konsept seviyesinde oluşturulmuştur. Model, fiziksel yapının birebir kopyası değildir.
      </Note>
    </div>
  );
}
