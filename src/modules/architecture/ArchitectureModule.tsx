import { useEffect } from 'react';
import { LAYER_IDS, LAYER_LABEL, type LayerId } from '@/core/layers';
import { useView } from '@/core/store/viewStore';
import { worldApi } from '@/world/worldApi';
import { Icon, Note, Section, Segmented, Toggle } from '@/ui/primitives';

const PRESETS: { label: string; layers: LayerId[] }[] = [
  { label: 'Tümü', layers: [...LAYER_IDS] },
  { label: 'Yalnızca kase', layers: ['pitch', 'lowerTier', 'upperTier', 'concourse', 'screens', 'lighting'] },
  { label: 'Kabuk', layers: ['facade', 'roof', 'structure', 'massing', 'solar', 'lighting'] },
  { label: 'Çevre', layers: ['surroundings', 'landscape', 'access', 'transit', 'massing', 'facade', 'roof'] },
];

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

      <Section
        title="Katmanlar"
        kicker="15 bağımsız katman"
        actions={
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="chip !min-h-[26px] !px-2 text-[11px]"
                onClick={() => LAYER_IDS.forEach((id) => setLayer(id, p.layers.includes(id)))}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      >
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

      <Section title="Object Inspector">
        <p className="text-[12.5px] muted leading-relaxed">
          3D modelde bir bileşene tıklayın: adı, amacı, tasarım seçenekleri ve teknik değerlendirme notları sol üstte açılır.
        </p>
      </Section>
    </div>
  );
}
