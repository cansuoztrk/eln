import { useEffect } from 'react';
import { LAYER_IDS, LAYER_LABEL, LAYER_PARTS, LAYER_ZONES, type LayerId } from '@/core/layers';
import { useView } from '@/core/store/viewStore';
import { componentInfo } from '@/content/components';
import { worldApi } from '@/world/worldApi';
import { Icon, Note, Section, Segmented, Toggle } from '@/ui/primitives';

const PRESETS: { label: string; layers: LayerId[] }[] = [
  { label: 'Tümü', layers: [...LAYER_IDS] },
  { label: 'Yalnızca kase', layers: ['pitch', 'lowerTier', 'upperTier', 'concourse', 'screens', 'lighting'] },
  { label: 'Kabuk', layers: ['facade', 'roof', 'structure', 'massing', 'solar', 'lighting'] },
  { label: 'Çevre', layers: ['surroundings', 'landscape', 'access', 'transit', 'massing', 'facade', 'roof'] },
];

/** Selects a layer or part from the list: highlight, Object Inspector and a camera that frames it. */
function pick(id: string) {
  const v = useView.getState();
  const name = componentInfo(id).name;
  v.set({ selected: id });
  if (v.view2D) return v.announce(`${name} seçildi.`);
  const framed = worldApi.fitObject(id);
  v.announce(framed ? `${name} seçildi ve görünüme alındı.` : `${name} seçildi; mevcut görünümde modelde yer almıyor.`);
}

function PartButton({ id, part }: { id: string; part?: boolean }) {
  const pressed = useView((s) => s.selected === id);
  const name = componentInfo(id).name;
  return part ? (
    <button type="button" className="chip !min-h-[26px] !px-2.5 text-[11.5px]" aria-pressed={pressed} onClick={() => pick(id)}>
      {name}
    </button>
  ) : (
    <button type="button" className="tree-item" aria-pressed={pressed} onClick={() => pick(id)}>
      {name}
    </button>
  );
}

export default function ArchitectureModule() {
  const layers = useView((s) => s.layers);
  const setLayer = useView((s) => s.setLayer);
  const exploded = useView((s) => s.exploded);
  const section = useView((s) => s.section);
  const focus = useView((s) => s.focusLayer);
  const set = useView((s) => s.set);

  useEffect(
    () => () => {
      // leaving the module restores the full model
      useView.getState().set({ exploded: false, section: 'off', focusLayer: null });
    },
    [],
  );

  const focusLayer = (id: LayerId) => {
    if (!focus) worldApi.saveView();
    set({ focusLayer: id });
    worldApi.fitLayer(id);
  };

  return (
    <div>
      <Section title="Exploded Architecture" kicker="Master Digital Twin">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn"
            aria-pressed={exploded}
            onClick={() => {
              const next = !exploded;
              set({ exploded: next, section: 'off' });
              if (next) worldApi.flyTo({ pos: [330, 190, 360], target: [0, 45, 0] }, { mode: 'explorer' });
              else set({ focusLayer: null });
            }}
          >
            <Icon name="Layers" size={16} /> {exploded ? 'Katmanları birleştir' : 'Katmanları ayır'}
          </button>
          {focus && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                set({ focusLayer: null });
                worldApi.restoreView();
              }}
            >
              <Icon name="RotateCcw" size={16} /> Önceki görünüme dön
            </button>
          )}
        </div>
        <p className="text-[12.5px] muted mt-2 leading-relaxed">
          Katmanlar aynı koordinat sisteminde dikey olarak ayrılır; cephe dışarı doğru açılır. 3D etiketlere veya aşağıdaki “incele” düğmelerine tıklayarak tek bir katmanı büyütebilirsiniz.
        </p>
      </Section>

      <Section title="Architectural Section" kicker="Kavramsal kesit">
        <Segmented
          label="Kesit"
          value={section}
          onChange={(v) => {
            set({ section: v, exploded: false, focusLayer: null });
            if (v === 'long') worldApi.flyTo({ pos: [20, 60, -300], target: [0, 20, 0] }, { mode: 'explorer' });
            if (v === 'short') worldApi.flyTo({ pos: [-300, 60, 20], target: [0, 20, 0] }, { mode: 'explorer' });
          }}
          options={[
            { value: 'off', label: 'Kapalı' },
            { value: 'long', label: 'Uzun eksen' },
            { value: 'short', label: 'Kısa eksen' },
          ]}
        />
        <div className="mt-2.5">
          <Note kind="warn">Kesit, tribünler ile saha seviyesinin ilişkisini anlatmak için analitik profilden üretilir. Doğrulanmış bir yapı kesiti veya mühendislik çizimi değildir.</Note>
        </div>
      </Section>

      <Section title="Katmanlar" kicker="15 bağımsız katman">
        <div className="flex flex-wrap gap-1.5 mb-2" role="group" aria-label="Katman ön ayarları">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="chip !min-h-[28px] !px-2.5 text-[11.5px]" onClick={() => LAYER_IDS.forEach((id) => setLayer(id, p.layers.includes(id)))}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="divide-y divide-line">
          {LAYER_IDS.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <div className="flex-1">
                <Toggle label={LAYER_LABEL[id]} checked={layers[id]} onChange={(v) => setLayer(id, v)} />
              </div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => focusLayer(id)} disabled={!layers[id]} aria-label={`${LAYER_LABEL[id]} katmanını incele`}>
                <Icon name="Focus" size={14} /> incele
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Bölgeler ve bileşenler" kicker="Object Inspector">
        <p className="text-[12.5px] muted leading-relaxed mb-2.5">
          Bir bölge veya bileşen seçin: modelde vurgulanır, kamera ona odaklanır, adı, amacı ve teknik notları sol üstte açılır. 3D modele doğrudan tıklayarak da seçebilirsiniz.
        </p>
        <div className="flex flex-col gap-3">
          {LAYER_ZONES.map((zone) => (
            <div key={zone.title} role="group" aria-label={zone.title}>
              <div className="field-label !mb-1">{zone.title}</div>
              <ul>
                {zone.layers.map((layer) => (
                  <li key={layer} className={layers[layer] ? '' : 'opacity-60'}>
                    <PartButton id={layer} />
                    {LAYER_PARTS[layer].length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-3 pt-0.5 pb-2">
                        {LAYER_PARTS[layer].map((p) => (
                          <PartButton key={p} id={p} part />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
