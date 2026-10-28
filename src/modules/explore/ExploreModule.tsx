import { useEffect } from 'react';
import { useRoute } from '@/core/router';
import { useView } from '@/core/store/viewStore';
import { POIS, POI_BY_ID } from '@/world/camera/pois';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section, Segmented } from '@/ui/primitives';
import { Needs3D } from '@/shell/Needs3D';

export default function ExploreModule() {
  const route = useRoute();
  const mode = useView((s) => s.cameraMode);
  const poi = useView((s) => s.poi);

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
        <Needs3D what="Gezinti noktaları" />
      </Section>

      <Section title="Gezinti noktaları" kicker="Walkthrough">
        {/* the walk as a route: numbered stops on a line; only the current stop shows its description */}
        <ol>
          {POIS.map((p, i) => {
            const here = poi === p.id;
            return (
              <li key={p.id} className="relative pl-9">
                {i < POIS.length - 1 && <span aria-hidden="true" className="absolute left-[13px] top-8 -bottom-1 w-px bg-line" />}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-[5px] w-[27px] h-[27px] rounded-full border text-[11px] font-bold flex items-center justify-center ${here ? 'bg-aslan border-aslan text-white' : 'bg-surface-2 border-line'}`}
                >
                  {i + 1}
                </span>
                <button type="button" className="tree-item !items-start !py-2" aria-current={here ? 'true' : undefined} onClick={() => worldApi.flyToPoi(p.id)}>
                  <span className="sr-only">{i + 1}. </span>
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      {p.name}
                      {p.concept && <Badge kind="concept">İç mekân konsept</Badge>}
                    </span>
                    {here && <span className="block text-[12px] font-normal muted leading-snug mt-1">{p.description}</span>}
                  </span>
                </button>
              </li>
            );
          })}
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
        İç mekân geometrisi gerçek planlara dayanmaz; dolaşım, tribün girişi ve tünel konsept seviyesinde oluşturulmuştur.
      </Note>
    </div>
  );
}
