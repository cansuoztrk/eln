import { useMemo, useState } from 'react';
import { useDesign, customizationCount } from '@/core/store/designStore';
import { DNA_PRESETS, type DnaPreset } from '@/core/model/dna';
import {
  CHOREOGRAPHIES,
  FACADE_LIGHTING,
  NIGHT_TINTS,
  PLAZA_CHARACTERS,
  ROOF_FORMS,
  ROOF_LIGHTS,
  SCREEN_LAYOUTS,
  VISUAL_LANGUAGES,
  applyPatch,
  diffDesigns,
  getAt,
} from '@/core/model/design';
import {
  CHOREO_LABEL,
  DNA_LABEL,
  FACADE_LIGHTING_LABEL,
  KEY_LABEL,
  LANGUAGE_LABEL,
  NIGHT_LABEL,
  PLAZA_LABEL,
  ROOF_FORM_LABEL,
  ROOF_LIGHT_LABEL,
  SCREEN_LABEL,
  prettyValue,
} from '@/core/model/labels';
import { evaluateRules } from '@/core/model/rules';
import { Badge, ColorField, Icon, LockButton, Section, Select, Slider } from '@/ui/primitives';
import { RuleList } from './RuleList';

function opts<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((v) => ({ value: v, label: labels[v] }));
}

export default function DnaModule() {
  const design = useDesign((s) => s.design);
  const locks = useDesign((s) => s.locks);
  const toggleLock = useDesign((s) => s.toggleLock);
  const setKey = useDesign((s) => s.setKey);
  const applyDna = useDesign((s) => s.applyDna);
  const [pending, setPending] = useState<DnaPreset | null>(null);
  const findings = useMemo(() => evaluateRules(design), [design]);
  const custom = customizationCount(design);

  const lockProps = (key: string) => ({ locked: locks.includes(key), onToggleLock: () => toggleLock(key) });
  const sel = <T extends string>(key: string, values: readonly T[], labels: Record<T, string>) => (
    <Select label={KEY_LABEL[key]} value={getAt(design, key) as T} options={opts(values, labels)} onChange={(v) => setKey(key, v, `${KEY_LABEL[key]}: ${labels[v]}`)} {...lockProps(key)} />
  );

  const requestDna = (p: DnaPreset) => {
    const next = applyPatch(design, p.patch, new Set(locks));
    const changes = diffDesigns(design, next).filter((c) => c.key !== 'dna');
    if (custom > 0 && changes.length > 0) setPending(p);
    else applyDna(p.id);
  };

  const pendingDiff = pending ? diffDesigns(design, applyPatch(design, pending.patch, new Set(locks))).filter((c) => c.key !== 'dna') : [];

  return (
    <div>
      <Section title="Stadium DNA" kicker="Tasarımın karakteri">
        <div className="text-[12.5px] muted mb-2.5">
          Aktif DNA: <strong className="text-text">{DNA_LABEL[design.dna]}</strong>
          {custom > 0 && <span> · {custom} özelleştirme</span>}
          {locks.length > 0 && <span> · {locks.length} kilitli seçim</span>}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {DNA_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => requestDna(p)}
              aria-pressed={design.dna === p.id}
              className={`text-left rounded-xl border p-3 transition ${design.dna === p.id ? 'border-aslan bg-aslan/10' : 'border-line bg-surface-2 hover:border-white/20'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="display font-semibold text-[14.5px]">{p.name}</span>
                {design.dna === p.id && <Icon name="Check" size={16} className="text-gold" />}
              </div>
              <div className="text-[12px] text-gold/90 mt-0.5">{p.tagline}</div>
              <div className="text-[12px] muted mt-1.5 leading-snug">{p.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {p.changes.map((c) => (
                  <span key={c} className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-white/5 border border-line">
                    {c}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {pending && (
        <div role="alertdialog" aria-labelledby="dna-confirm" className="card border-gold/50 mb-5">
          <div id="dna-confirm" className="font-semibold text-[14px] mb-1">
            {pending.name} uygulanırsa {pendingDiff.length} seçim değişecek
          </div>
          <p className="text-[12px] muted mb-2">Özelleştirdiğiniz seçimleri korumak için önce kilitleyin. Kilitli seçimler ({locks.length}) değişmez. İşlem geri alınabilir.</p>
          <ul className="list-dots mb-3 max-h-36 scroll-y">
            {pendingDiff.slice(0, 14).map((c) => (
              <li key={c.key}>
                {KEY_LABEL[c.key] ?? c.key}: {prettyValue(c.key, c.from)} → <strong>{prettyValue(c.key, c.to)}</strong>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                applyDna(pending.id);
                setPending(null);
              }}
            >
              Uygula
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setPending(null)}>
              İptal
            </button>
          </div>
        </div>
      )}

      <Section title="Uyum kontrolü" kicker="Çakışan tercihler" badges={findings.length === 0 ? <Badge kind="verified">Tutarlı</Badge> : undefined}>
        <RuleList findings={findings} />
      </Section>

      <Section title="Mimari parametreler" kicker="Birleştirilebilir seçimler">
        {sel('language', VISUAL_LANGUAGES, LANGUAGE_LABEL)}
        {sel('roof.form', ROOF_FORMS, ROOF_FORM_LABEL)}
        {sel('roof.light', ROOF_LIGHTS, ROOF_LIGHT_LABEL)}
        <div className="flex items-end gap-1">
          <div className="flex-1">
            <Slider label="Işık halkası yoğunluğu" value={design.roof.ring} onChange={(v) => setKey('roof.ring', v, `Halka yoğunluğu ${Math.round(v * 100)}%`)} />
          </div>
          <LockButton label="Işık halkası yoğunluğu" {...{ locked: locks.includes('roof.ring'), onClick: () => toggleLock('roof.ring') }} />
        </div>
        {sel('facade.lighting', FACADE_LIGHTING, FACADE_LIGHTING_LABEL)}
        {sel('screens.layout', SCREEN_LAYOUTS, SCREEN_LABEL)}
        {sel('seats.choreography', CHOREOGRAPHIES, CHOREO_LABEL)}
        {sel('palette.night', NIGHT_TINTS, NIGHT_LABEL)}
        {sel('plaza.character', PLAZA_CHARACTERS, PLAZA_LABEL)}
        {sel('plaza.social', ['current', 'expanded'] as const, { current: 'Mevcut ölçek', expanded: 'Genişletilmiş sosyal alan' })}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex items-center justify-between">
            <ColorField label="Ana mimari renk" value={design.palette.primary} onChange={(v) => setKey('palette.primary', v, 'Ana renk değişti')} />
            <LockButton label="Ana mimari renk" locked={locks.includes('palette.primary')} onClick={() => toggleLock('palette.primary')} />
          </div>
          <div className="flex items-center justify-between">
            <ColorField label="İkincil renk" value={design.palette.secondary} onChange={(v) => setKey('palette.secondary', v, 'İkincil renk değişti')} />
            <LockButton label="İkincil renk" locked={locks.includes('palette.secondary')} onClick={() => toggleLock('palette.secondary')} />
          </div>
        </div>
      </Section>
    </div>
  );
}
