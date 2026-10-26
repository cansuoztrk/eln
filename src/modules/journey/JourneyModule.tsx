import { useEffect, useMemo, useRef, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { INNER, PROFILE } from '@/world/stadium/geometry';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section, downloadFile } from '@/ui/primitives';
import { PERSONAS, STOPS, planToMarkdown, resolvePlan, type PlanItem } from './journey';

function flyToStop(id: string) {
  const s = STOPS[id];
  if (!s) return;
  if (s.poi) worldApi.flyToPoi(s.poi);
  else if (s.pose) worldApi.flyTo(s.pose, { mode: 'explorer', fade: useView.getState().cameraMode !== 'explorer' });
}

export default function JourneyModule() {
  const design = useDesign((s) => s.design);
  const patch = useDesign((s) => s.patch);
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [items, setItems] = useState<PlanItem[]>(PERSONAS[0].plan);
  const [playing, setPlaying] = useState(-1);
  const [addStop, setAddStop] = useState('fanPlaza');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plan = useMemo(() => resolvePlan(items, design), [items, design]);
  const p = PERSONAS.find((x) => x.id === persona)!;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (playing < 0) return;
    const visible = plan.filter((x) => x.available);
    if (playing >= visible.length) {
      setPlaying(-1);
      return;
    }
    flyToStop(visible[playing].stop);
    timer.current = setTimeout(() => setPlaying((i) => i + 1), useView.getState().reducedMotion ? 3500 : 4500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, plan]);

  const choose = (id: string) => {
    setPersona(id);
    setItems(PERSONAS.find((x) => x.id === id)!.plan);
    setPlaying(-1);
  };
  const move = (i: number, d: number) => {
    const next = [...items];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const missing = plan.filter((x) => !x.available);
  const needsAccess = persona === 'access' && !design.access.routes;
  const pts = plan.filter((x) => x.available && x.stopInfo).map((x) => `${x.stopInfo.x.toFixed(0)},${x.stopInfo.z.toFixed(0)}`).join(' ');

  return (
    <div>
      <Section title="Kim için plan?" kicker="The Fan Journey Builder">
        <div className="flex flex-col gap-1.5">
          {PERSONAS.map((x) => (
            <button key={x.id} type="button" aria-pressed={persona === x.id} onClick={() => choose(x.id)} className={`text-left rounded-xl border px-3 py-2 flex items-start gap-2.5 ${persona === x.id ? 'border-aslan bg-aslan/10' : 'border-line bg-surface-2 hover:border-white/20'}`}>
              <Icon name={x.icon} size={16} className="text-gold mt-0.5" />
              <span>
                <span className="text-[13px] font-semibold block">{x.name}</span>
                <span className="text-[11.5px] muted">{x.intro}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      {needsAccess && (
        <div className="mb-4">
          <Note kind="warn">
            Bu tasarımda erişilebilir rotalar ve hizmet noktaları kapalı; plan bu yüzden eksik kalıyor.{' '}
            <button type="button" className="underline font-semibold" onClick={() => patch({ access: { routes: true, servicePoints: true } }, 'Erişilebilir rotalar açıldı', { respectLocks: false })}>
              Tasarımda aç
            </button>
          </Note>
        </div>
      )}

      <Section title={`Plan: ${p.name}`} kicker="Örnek güzergâh" badges={<Badge kind="concept">Doğrulanmamış örnek rota</Badge>}>
        <div className="rounded-xl bg-surface-2 border border-line p-1.5 mb-2">
          <svg viewBox="-300 -260 600 520" className="w-full h-auto" role="img" aria-label="Plan rotası haritası">
            <rect x="-300" y="-260" width="600" height="520" fill="#0d1016" />
            <rect x={-(INNER.hw + PROFILE.facadeD)} y={-(INNER.hd + PROFILE.facadeD)} width={(INNER.hw + PROFILE.facadeD) * 2} height={(INNER.hd + PROFILE.facadeD) * 2} rx={INNER.r + PROFILE.facadeD} fill="#2a2d35" />
            <rect x={-INNER.hw} y={-INNER.hd} width={INNER.hw * 2} height={INNER.hd * 2} rx={INNER.r} fill="#1f6a31" />
            <polyline points={pts} fill="none" stroke="#f2b631" strokeWidth="3" strokeLinejoin="round" />
            {plan
              .filter((x) => x.available && x.stopInfo)
              .map((x, i) => (
                <g key={`${x.stop}${i}`}>
                  <circle cx={x.stopInfo.x} cy={x.stopInfo.z} r="9" fill={playing === i ? '#d4213d' : '#f2b631'} stroke="#0d1016" strokeWidth="2" />
                  <text x={x.stopInfo.x} y={x.stopInfo.z + 3.5} textAnchor="middle" fontSize="9" fontWeight="800" fill="#111">
                    {i + 1}
                  </text>
                </g>
              ))}
          </svg>
        </div>
        <ol className="flex flex-col gap-1.5">
          {plan.map((it, i) => (
            <li key={`${it.stop}-${i}`} className={`card card-tight !py-2 ${it.available ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-2">
                <span className="w-5 text-[11px] muted tabular-nums pt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{it.stopInfo?.name ?? it.stop}</div>
                  <div className="text-[11.5px] text-gold">{it.time}</div>
                  <input
                    className="input !min-h-[28px] !text-[12px] mt-1"
                    value={it.note}
                    aria-label={`${i + 1}. durak notu`}
                    onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                  />
                  {!it.available && <div className="text-[11px] text-eng mt-1">{it.stopInfo?.unavailableNote ?? 'Bu tasarımda yok'}</div>}
                </div>
                <div className="flex flex-col gap-0.5">
                  <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={() => flyToStop(it.stop)} disabled={!it.available} aria-label={`${it.stopInfo?.name} noktasını 3D'de göster`}>
                    <Icon name="Eye" size={13} />
                  </button>
                  <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı">
                    <Icon name="ArrowUp" size={13} />
                  </button>
                  <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={() => move(i, 1)} disabled={i === plan.length - 1} aria-label="Aşağı taşı">
                    <Icon name="ArrowDown" size={13} />
                  </button>
                  <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Duraktan çıkar">
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex gap-1.5 mt-2">
          <select className="select !min-h-[32px] flex-1" value={addStop} onChange={(e) => setAddStop(e.target.value)} aria-label="Eklenecek durak">
            {Object.values(STOPS).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.available(design) ? '' : ' (bu tasarımda yok)'}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-sm" onClick={() => setItems([...items, { stop: addStop, time: 'Serbest zaman', note: '' }])}>
            <Icon name="Plus" size={14} /> Ekle
          </button>
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setPlaying(playing >= 0 ? -1 : 0)}>
            <Icon name={playing >= 0 ? 'Square' : 'Play'} size={14} /> {playing >= 0 ? 'Turu durdur' : 'Rotayı 3D’de oynat'}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => downloadFile(`mac-gunu-plani-${persona}.md`, planToMarkdown(`Maç günü planı — ${p.name}`, plan), 'text/markdown')}>
            <Icon name="Download" size={14} /> Planı indir (.md)
          </button>
        </div>
        {missing.length > 0 && <p className="text-[11.5px] text-eng mt-2">{missing.length} durak bu tasarımda bulunmadığı için turda atlanır.</p>}
      </Section>

      <Note kind="warn">Bu planlar örnek güzergâhlardır. Rotaların, kapıların ve sürelerin mevcut koşullarda kullanılabilir olduğu doğrulanmamıştır; gerçek maç günü bilgisi için resmî kaynaklar esas alınmalıdır.</Note>
    </div>
  );
}
