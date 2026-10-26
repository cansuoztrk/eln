import { useEffect, useMemo, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { diffDesigns, SHOW_PRESET_IDS } from '@/core/model/design';
import { KEY_LABEL, prettyValue } from '@/core/model/labels';
import { SHOW_BY_ID } from '@/core/model/lightshow';
import { evaluateRules } from '@/core/model/rules';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section } from '@/ui/primitives';
import { LEVER_LABELS, LEVER_LIMITS, QUESTIONS, applyLevers, leversFromDesign, type Levers, type Question } from './scenarios';

const SLOT_NAMES = ['A', 'B', 'C'];

export default function WhatIfModule() {
  const design = useDesign((s) => s.design);
  const setDesign = useDesign((s) => s.setDesign);
  const setPreview = useView((s) => s.setPreview);
  const view2D = useView((s) => s.view2D);
  const [question, setQuestion] = useState<Question>(QUESTIONS[0]);
  const base = useMemo(() => leversFromDesign(design), [design]);
  const [slots, setSlots] = useState<{ name: string; levers: Levers }[]>(() => QUESTIONS[0].slots.map((s, i) => ({ name: QUESTIONS[0].names[i], levers: { ...leversFromDesign(design), ...s } })));
  const [shots, setShots] = useState<(string | null)[] | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = (q: Question) => {
    setQuestion(q);
    setSlots(q.slots.map((s, i) => ({ name: q.names[i], levers: { ...base, ...s } })));
    setShots(null);
    worldApi.flyTo(q.pose, { mode: 'explorer' });
  };

  useEffect(() => {
    worldApi.flyTo(QUESTIONS[0].pose, { mode: 'explorer' });
    return () => useView.getState().setPreview(null);
  }, []);

  const configs = slots.map((s) => applyLevers(design, s.levers));

  const compare = async () => {
    setBusy(true);
    const out: (string | null)[] = [];
    for (const cfg of configs) out.push(await worldApi.capture({ preview: cfg, pose: question.pose, width: 800, height: 500 }));
    setShots(out);
    setBusy(false);
  };

  const update = (i: number, patch: Partial<Levers>) => {
    setSlots(slots.map((s, j) => (j === i ? { ...s, levers: { ...s.levers, ...patch } } : s)));
    setShots(null);
  };

  return (
    <div>
      <Section title="Bir soru seçin" kicker="The What-If Engine">
        <div className="flex flex-col gap-1.5">
          {QUESTIONS.map((q) => (
            <button key={q.id} type="button" onClick={() => pick(q)} aria-pressed={question.id === q.id} className={`text-left text-[12.5px] leading-snug rounded-xl border px-3 py-2 ${question.id === q.id ? 'border-aslan bg-aslan/10' : 'border-line bg-surface-2 hover:border-white/20'}`}>
              {q.text}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Senaryolar"
        kicker={`${slots.length} alternatif — aynı model`}
        actions={
          slots.length < 3 ? (
            <button type="button" className="btn btn-sm" onClick={() => setSlots([...slots, { name: `Senaryo ${SLOT_NAMES[slots.length]}`, levers: { ...base } }])}>
              <Icon name="Plus" size={14} /> Ekle
            </button>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-2.5">
          {slots.map((s, i) => {
            const findings = evaluateRules(configs[i]).filter((f) => f.severity !== 'info');
            return (
              <div key={i} className="card card-tight">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-aslan text-white text-[12px] font-bold flex items-center justify-center">{SLOT_NAMES[i]}</span>
                  <input className="input !min-h-[30px] flex-1" value={s.name} onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label={`Senaryo ${SLOT_NAMES[i]} adı`} />
                  {slots.length > 2 && (
                    <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={() => setSlots(slots.filter((_, j) => j !== i))} aria-label={`Senaryo ${SLOT_NAMES[i]} kaldır`}>
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                  <LeverSelect label="Çatı" value={s.levers.roof} options={LEVER_LABELS.roof} onChange={(v) => update(i, { roof: v })} />
                  <LeverSelect label="Sosyal alan" value={s.levers.social} options={LEVER_LABELS.social} onChange={(v) => update(i, { social: v })} />
                  <LeverSelect label="Ekranlar" value={s.levers.screens} options={LEVER_LABELS.screens} onChange={(v) => update(i, { screens: v })} />
                  <LeverSelect label="GES" value={s.levers.solar} options={LEVER_LABELS.solar} onChange={(v) => update(i, { solar: v })} />
                  <LeverSelect label="Erişilebilir rota" value={s.levers.access ? 'on' : 'off'} options={{ off: 'Kapalı', on: 'Açık' }} onChange={(v) => update(i, { access: v === 'on' })} />
                  <LeverSelect
                    label="Maç gecesi ışığı"
                    value={s.levers.night}
                    options={{ none: 'Mimari ışık', ...Object.fromEntries(SHOW_PRESET_IDS.map((id) => [id, SHOW_BY_ID[id].name])) } as Record<string, string>}
                    onChange={(v) => update(i, { night: v as Levers['night'] })}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {findings.map((f) => (
                    <Badge key={f.id} kind={f.severity === 'engineering' ? 'eng' : 'concept'}>
                      {f.severity === 'engineering' ? 'Mühendislik' : 'Çakışma'}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button type="button" className="btn btn-sm" onClick={() => setPreview(configs[i], `What-If ${SLOT_NAMES[i]}: ${s.name}`)}>
                    <Icon name="Eye" size={14} /> 3D’de göster
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDesign(configs[i], `What-If uygulandı: ${s.name}`)}>
                    Tasarıma uygula
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="btn btn-primary w-full mt-3" onClick={compare} disabled={busy || view2D}>
          <Icon name="GitCompare" size={16} /> {busy ? 'Görseller oluşturuluyor…' : 'Yan yana karşılaştır'}
        </button>
      </Section>

      {shots && (
        <Section title="Karşılaştırma" kicker="Tasarım farkları ve açıklamalar">
          <div className="flex flex-col gap-3">
            {slots.map((s, i) => {
              const diffs = diffDesigns(design, configs[i]).filter((d) => !d.key.startsWith('show.') || d.key === 'show.active' || d.key === 'show.preset');
              return (
                <figure key={i} className="m-0 card card-tight">
                  {shots[i] ? <img src={shots[i]!} alt={`Senaryo ${SLOT_NAMES[i]} görseli: ${s.name}`} className="rounded-lg w-full border border-line" /> : <div className="muted text-[12px]">Görsel oluşturulamadı.</div>}
                  <figcaption className="mt-2">
                    <div className="text-[13px] font-semibold">
                      {SLOT_NAMES[i]} · {s.name}
                    </div>
                    {diffs.length === 0 ? (
                      <div className="text-[12px] muted">Mevcut tasarımınızla aynı.</div>
                    ) : (
                      <ul className="list-dots mt-1">
                        {diffs.slice(0, 8).map((d) => (
                          <li key={d.key}>
                            {KEY_LABEL[d.key] ?? d.key}: {prettyValue(d.key, d.from)} → <strong>{prettyValue(d.key, d.to)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Bu karşılaştırma neyi gösterir, neyi göstermez?">
        <ul className="list-dots">
          {(Object.keys(LEVER_LIMITS) as (keyof Levers)[]).map((k) => (
            <li key={k}>{LEVER_LIMITS[k]}</li>
          ))}
        </ul>
        <div className="mt-2.5">
          <Note kind="eng">Bu bir sanal görsel simülasyondur, mühendislik analizi değildir. Fiziksel dünyadaki sonuçlar yalnızca bir konsept seçiminden çıkarılamayacak kadar karmaşıktır.</Note>
        </div>
      </Section>
    </div>
  );
}

function LeverSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<string, string>; onChange: (v: T) => void }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px] muted">{label}</span>
      <select className="select !min-h-[30px] !text-[12px] !px-2" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
