import { useEffect, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { MATERIAL_TARGETS, setAt, type MaterialId, type MaterialTarget } from '@/core/model/design';
import { MATERIAL_BY_ID, materialsFor } from '@/core/model/materials';
import { MATERIAL_TARGET_LABEL } from '@/core/model/labels';
import { worldApi, type CameraPose } from '@/world/worldApi';
import { Icon, Note, Section, Segmented } from '@/ui/primitives';
import { Needs3D } from '@/shell/Needs3D';

const SHORT: Record<MaterialTarget, string> = { facade: 'Cephe', roof: 'Çatı', structure: 'Taşıyıcı', plinth: 'Kaide' };

const VIEWS: Record<MaterialTarget, CameraPose> = {
  facade: { pos: [120, 30, 210], target: [0, 22, 80] },
  roof: { pos: [170, 140, 200], target: [0, 40, 0] },
  structure: { pos: [150, 120, -180], target: [0, 40, 0] },
  plinth: { pos: [-150, 18, 200], target: [-40, 2, 100] },
};

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

      <Section title="Malzeme seçenekleri">
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
              <span
                className="block h-10 rounded-lg mb-2 border border-white/10"
                style={{
                  background:
                    m.visual.pattern === 'brushed'
                      ? `repeating-linear-gradient(0deg, ${m.visual.color}, ${m.visual.color} 2px, #ffffff22 3px)`
                      : m.visual.pattern === 'panel'
                        ? `linear-gradient(90deg, #0004 1px, transparent 1px) 0 0/50% 100%, linear-gradient(#0004 1px, transparent 1px) 0 0/100% 33%, ${m.visual.color}`
                        : m.visual.color,
                  opacity: m.visual.opacity < 1 ? 0.7 : 1,
                }}
                aria-hidden="true"
              />
              <span className="text-[12.5px] font-semibold leading-tight block">{m.name}</span>
            </button>
          ))}
        </div>
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
