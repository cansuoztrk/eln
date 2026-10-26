import { useEffect, useMemo, useState } from 'react';
import { useRoute } from '@/core/router';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { PHASES, derivePhaseConfig } from '@/core/model/phases';
import { worldApi } from '@/world/worldApi';
import { Badge, Dots, Icon, Note, Section } from '@/ui/primitives';

const PHASE_VIEWS = [
  { pos: [260, 120, 320], target: [0, 15, 0] },
  { pos: [210, 70, 250], target: [0, 25, 0] },
  { pos: [-220, 60, 260], target: [0, 5, 60] },
  { pos: [40, 120, 380], target: [0, 5, 120] },
  { pos: [330, 170, 330], target: [0, 20, 20] },
] as const;

export default function TimeMachineModule() {
  const route = useRoute();
  const design = useDesign((s) => s.design);
  const setPreview = useView((s) => s.setPreview);
  const reduced = useView((s) => s.reducedMotion);
  const initial = Number(route.params.get('phase') ?? 0);
  const [phase, setPhase] = useState(Number.isFinite(initial) ? Math.min(4, Math.max(0, initial)) : 0);
  const [playing, setPlaying] = useState(false);
  const info = PHASES[phase];
  const config = useMemo(() => derivePhaseConfig(design, phase), [design, phase]);

  useEffect(() => {
    setPreview(phase === 4 ? null : config, `${info.horizon} — ${info.title}`);
  }, [config, phase, info, setPreview]);

  useEffect(() => {
    const v = PHASE_VIEWS[phase];
    worldApi.flyTo({ pos: [...v.pos], target: [...v.target] }, { mode: 'explorer' });
  }, [phase]);

  useEffect(() => () => useView.getState().setPreview(null), []);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (phase >= 4) setPlaying(false);
      else setPhase(phase + 1);
    }, reduced ? 3500 : 5000);
    return () => clearTimeout(t);
  }, [playing, phase, reduced]);

  return (
    <div>
      <Section title="Zaman çizgisi" kicker="The Time Machine">
        <div className="flex items-center gap-2 mb-2">
          <button type="button" className="btn btn-sm" onClick={() => (phase >= 4 ? (setPhase(0), setPlaying(true)) : setPlaying(!playing))} aria-pressed={playing}>
            <Icon name={playing ? 'Pause' : 'Play'} size={14} /> {playing ? 'Durdur' : 'Oynat'}
          </button>
          <span className="text-[12px] muted">Aşamalar sizin tasarımınızdan türetilir.</span>
        </div>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={phase}
          onChange={(e) => {
            setPlaying(false);
            setPhase(Number(e.target.value));
          }}
          aria-label="Dönüşüm aşaması"
          aria-valuetext={`${info.horizon}: ${info.title}`}
        />
        <ol className="grid grid-cols-5 gap-1 mt-1">
          {PHASES.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setPhase(p.index);
                }}
                aria-current={phase === p.index ? 'step' : undefined}
                className={`w-full text-[10.5px] leading-tight rounded-lg px-1 py-1.5 border ${phase === p.index ? 'border-aslan bg-aslan/15 text-text' : 'border-line text-muted'}`}
              >
                {p.horizon}
              </button>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={info.title} kicker={info.horizon} badges={<>{phase === 0 ? <Badge kind="verified">Referans (yaklaşık)</Badge> : <Badge kind="concept" />}{info.engineering && <Badge kind="eng" />}</>}>
        <p className="text-[13px] leading-relaxed text-[#dcd9d2] mb-3">{info.summary}</p>
        <div className="grid gap-3">
          <Block title="Önerilen değişiklik" items={info.changes} />
          <Block title="Taraftara faydası" items={info.fanBenefit} />
          <Block title="Teknik bağımlılıklar" items={info.dependencies.length ? info.dependencies : ['—']} />
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="field-label mb-0">Proje karmaşıklığı</span>
            <Dots value={info.complexity} label="Karmaşıklık" />
          </div>
          <Block title="Önemli riskler" items={info.risks} />
          <Block title="Sonraki aşamaya geçiş şartları" items={info.gate} />
        </div>
      </Section>

      <Note kind={info.engineering ? 'eng' : 'info'}>
        {info.engineering
          ? 'Yapısal değişiklikler bu projenin kesin işleri olarak sunulmaz; ayrı ve mühendislik değerlendirmesi gerektiren senaryolardır.'
          : 'Gerçek uygulama sırası teknik raporlar, bütçe, işletme gereksinimleri ve resmî onaylar doğrultusunda belirlenir.'}
      </Note>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="field-label mb-1">{title}</div>
      <ul className="list-dots">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
