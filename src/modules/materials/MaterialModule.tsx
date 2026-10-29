import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { MATERIAL_TARGETS, setAt, type MaterialId, type MaterialTarget } from '@/core/model/design';
import { MATERIAL_BY_ID, materialsFor, type MaterialVisual } from '@/core/model/materials';
import { MATERIAL_TARGET_LABEL } from '@/core/model/labels';
import { worldApi, type CameraPose } from '@/world/worldApi';
import { VIEWS } from '@/world/camera/views';
import { Icon, Note, Section, Segmented } from '@/ui/primitives';
import { Needs3D } from '@/shell/Needs3D';

const SHORT: Record<MaterialTarget, string> = { facade: 'Cephe', roof: 'Çatı', structure: 'Taşıyıcı', plinth: 'Kaide' };
const ENV_NAME = { night: 'gece', dusk: 'alacakaranlık', day: 'gündüz' } as const;

/** Close views of each part for the rendered material samples. */
const CLOSEUPS: Record<MaterialTarget, CameraPose> = {
  facade: { pos: [40, 22, 165], target: [0, 14, 98] },
  roof: { pos: [50, 80, 120], target: [10, 44, 40] },
  structure: { pos: [-60, 70, -120], target: [-10, 46, -55] },
  plinth: { pos: [30, 22, -165], target: [0, 1, -100] },
};

/**
 * CSS stand-in for a material before rendered samples exist: the same base colour,
 * pattern family, metallic sheen and translucency the 3D material uses.
 */
function swatchStyle(v: MaterialVisual): CSSProperties {
  const layers: string[] = [];
  if (v.metalness > 0.5) layers.push(`linear-gradient(135deg, #ffffff${v.roughness < 0.45 ? '40' : '22'} 0%, transparent 45%, #00000030 100%)`);
  else if (v.roughness < 0.2) layers.push('linear-gradient(160deg, #ffffff55 0%, transparent 35%)');
  if (v.pattern === 'brushed') layers.push('repeating-linear-gradient(0deg, transparent 0 2px, #ffffff1f 2px 3px)');
  if (v.pattern === 'panel') layers.push('linear-gradient(90deg, #00000045 1px, transparent 1px) 0 0/50% 100%', 'linear-gradient(#00000045 1px, transparent 1px) 0 0/100% 33.4%');
  if (v.pattern === 'frit') layers.push('radial-gradient(circle, #ffffff70 1px, transparent 1.6px) 0 0/6px 6px');
  if (v.pattern === 'speckle') layers.push('radial-gradient(circle, #00000040 1px, transparent 1.7px) 0 0/5px 5px', 'radial-gradient(circle, #ffffff30 1px, transparent 1.7px) 2px 3px/7px 7px');
  if (v.pattern === 'noise') layers.push('radial-gradient(circle, #00000026 0.8px, transparent 1.2px) 0 0/3px 3px', 'radial-gradient(circle, #ffffff1a 0.8px, transparent 1.2px) 1px 2px/4px 4px');
  const alpha = Math.round(v.opacity * 255).toString(16).padStart(2, '0');
  layers.push(`linear-gradient(${v.color}${alpha}, ${v.color}${alpha})`);
  // translucent surfaces show what is behind them
  if (v.opacity < 1) layers.push('conic-gradient(#2a2d34 25%, #3d414a 0 50%, #2a2d34 0 75%, #3d414a 0) 0 0/10px 10px');
  return { background: layers.join(', ') };
}

export default function MaterialModule() {
  const design = useDesign((s) => s.design);
  const setKey = useDesign((s) => s.setKey);
  const setPreview = useView((s) => s.setPreview);
  const view2D = useView((s) => s.view2D);
  const [target, setTarget] = useState<MaterialTarget>('facade');
  const current = design.materials[target];
  const [focus, setFocus] = useState<MaterialId>(current);
  const [a, setA] = useState<MaterialId>(current);
  const [b, setB] = useState<MaterialId>(materialsFor(target).find((m) => m.id !== current)?.id ?? current);
  const [shots, setShots] = useState<{ a: string | null; b: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const env = useView((s) => s.env);
  // rendered samples, by the rest of the design (any other change makes them stale), time of day and material
  const [samples, setSamples] = useState<Record<string, string>>({});
  const [sampling, setSampling] = useState<number | null>(null);
  const context = useMemo(() => {
    const s = JSON.stringify(setAt(design, `materials.${target}`, '-'));
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return `${target}|${h}`;
  }, [design, target]);
  const sampleKey = (m: MaterialId) => `${context}|${env}|${m}`;
  const options = materialsFor(target);
  const info = MATERIAL_BY_ID[focus];

  useEffect(() => {
    setFocus(design.materials[target]);
    setA(design.materials[target]);
    setB(materialsFor(target).find((m) => m.id !== design.materials[target])?.id ?? design.materials[target]);
    setShots(null);
    worldApi.flyTo(VIEWS[target], { mode: 'explorer' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => () => useView.getState().setPreview(null), []);

  const previewOf = (m: MaterialId) => setAt(design, `materials.${target}`, m);

  const renderSamples = async () => {
    const out: Record<string, string> = {};
    for (let i = 0; i < options.length; i++) {
      setSampling(i);
      const url = await worldApi.capture({ preview: previewOf(options[i].id), pose: CLOSEUPS[target], width: 320, height: 200, quality: 0.8 });
      if (url) out[sampleKey(options[i].id)] = url;
    }
    setSamples((s) => ({ ...s, ...out }));
    setSampling(null);
  };
  const haveSamples = options.every((m) => samples[sampleKey(m.id)]);

  const compare = async () => {
    setBusy(true);
    const pose = worldApi.getPose() ?? VIEWS[target];
    const imgA = await worldApi.capture({ preview: previewOf(a), pose, width: 960, height: 600 });
    const imgB = await worldApi.capture({ preview: previewOf(b), pose, width: 960, height: 600 });
    setShots({ a: imgA, b: imgB });
    setBusy(false);
  };

  return (
    <div>
      <Section title="Bileşen" kicker="Material Lab">
        <Segmented label="Bileşen" value={target} onChange={setTarget} options={MATERIAL_TARGETS.map((t) => ({ value: t, label: SHORT[t] }))} />
        <p className="text-[12px] muted mt-2">{MATERIAL_TARGET_LABEL[target]} — modeldeki ilgili parça anında değişir.</p>
      </Section>

      <Section
        title="Malzeme seçenekleri"
        actions={
          view2D ? undefined : (
            <button type="button" className="btn btn-sm" onClick={renderSamples} disabled={sampling !== null || busy}>
              <Icon name="Camera" size={14} /> {sampling !== null ? `Örnek ${sampling + 1}/${options.length}` : haveSamples ? 'Örnekleri yenile' : 'Modelden örnekle'}
            </button>
          )
        }
      >
        <div className="grid grid-cols-2 gap-2">
          {options.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={current === m.id}
              onClick={() => {
                setFocus(m.id);
                setKey(`materials.${target}`, m.id, `${MATERIAL_TARGET_LABEL[target]}: ${m.name}`);
              }}
              onMouseEnter={() => setFocus(m.id)}
              onFocus={() => setFocus(m.id)}
              className={`text-left rounded-xl border p-2.5 transition ${current === m.id ? 'border-aslan bg-aslan/10' : 'border-line bg-surface-2 hover:border-white/20'}`}
            >
              {samples[sampleKey(m.id)] ? (
                <img src={samples[sampleKey(m.id)]} alt="" className="block w-full aspect-[16/10] object-cover rounded-lg mb-2 border border-white/10" />
              ) : (
                <span className="block h-10 rounded-lg mb-2 border border-white/10" style={swatchStyle(m.visual)} aria-hidden="true" />
              )}
              <span className="text-[12.5px] font-semibold leading-tight block">{m.name}</span>
            </button>
          ))}
        </div>
        <p className="field-hint">
          {haveSamples
            ? `Örnekler modelin kendisinden, ${ENV_NAME[env]} ışığında ve aynı yakın açıdan alındı.`
            : 'Renk kutuları yaklaşık gösterimdir. “Modelden örnekle” her seçeneği bu parçanın üzerinde, aynı yakın açıdan işleyerek gösterir.'}
        </p>
      </Section>

      <Section title={info.name} kicker="Malzeme kartı">
        <dl className="text-[12.5px] leading-relaxed">
          <dt className="field-label mb-0.5">Görsel karakter</dt>
          <dd className="mb-2 text-[#dcd9d2]">{info.character}</dd>
          <dt className="field-label mb-0.5">Konseptteki kullanım amacı</dt>
          <dd className="mb-2 text-[#dcd9d2]">{info.purpose}</dd>
          <dt className="field-label mb-0.5">Muhtemel avantajlar</dt>
          <dd className="mb-2">
            <ul className="list-dots">
              {info.advantages.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </dd>
          <dt className="field-label mb-0.5">Maliyet ve bakım değerlendirmesinde incelenmesi gerekenler</dt>
          <dd>
            <ul className="list-dots">
              {info.review.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </dd>
        </dl>
      </Section>

      <Section title="A / B karşılaştırma" kicker="Aynı model, iki alternatif">
        <div className="grid grid-cols-2 gap-2 mb-2">
          {(['a', 'b'] as const).map((slot) => (
            <div key={slot}>
              <label className="field-label" htmlFor={`mat-${slot}`}>
                Alternatif {slot.toUpperCase()}
              </label>
              <select id={`mat-${slot}`} className="select" value={slot === 'a' ? a : b} onChange={(e) => (slot === 'a' ? setA : setB)(e.target.value as MaterialId)}>
                {options.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="btn btn-sm" onClick={() => setPreview(previewOf(a), `Malzeme A: ${MATERIAL_BY_ID[a].name}`)}>
            A’yı göster
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setPreview(previewOf(b), `Malzeme B: ${MATERIAL_BY_ID[b].name}`)}>
            B’yi göster
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={compare} disabled={busy || view2D}>
            <Icon name="Camera" size={14} /> Yan yana görsel
          </button>
        </div>
        <Needs3D what="Yan yana görsel" />
        {shots && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {(['a', 'b'] as const).map((slot) => (
              <figure key={slot} className="m-0">
                {shots[slot] ? <img src={shots[slot]!} alt={`Alternatif ${slot.toUpperCase()}: ${MATERIAL_BY_ID[slot === 'a' ? a : b].name}`} className="rounded-lg border border-line w-full" /> : <div className="muted text-[12px]">Görsel oluşturulamadı</div>}
                <figcaption className="text-[11.5px] mt-1">
                  <strong>{slot.toUpperCase()}</strong> · {MATERIAL_BY_ID[slot === 'a' ? a : b].name}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Section>

      <Note kind="warn">
        Malzemeler görsel konsept düzeyindedir. Kesin fiyat, yangın dayanımı, taşıyıcılık veya enerji performansı bilgisi verilmez; bunlar doğrulanmış teknik veri ve uzman değerlendirmesi gerektirir.
      </Note>
    </div>
  );
}
