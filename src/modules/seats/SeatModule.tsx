import { useEffect, useMemo, useState } from 'react';
import { useView } from '@/core/store/viewStore';
import { INNER, PITCH, PROFILE, innerPoint, upperRowD } from '@/world/stadium/geometry';
import { worldApi } from '@/world/worldApi';
import { Icon, Note, Section, Segmented, Slider } from '@/ui/primitives';
import { BLOCKS_PER_TIER, LOOK_LABEL, blockName, seatGeometry, seatMetrics, seatPose, type LookTarget, type SeatPick, type Tier } from './seatMath';

const TIER_RANGE: Record<Tier, [number, number]> = {
  lower: [PROFILE.lowerStart, PROFILE.crossAisle[0]],
  upper: [PROFILE.upperStart, upperRowD(PROFILE.upperRows)],
};

function blockPath(tier: Tier, b: number) {
  const [d0, d1] = TIER_RANGE[tier];
  const pts: string[] = [];
  const steps = 6;
  const gap = 0.0025;
  const s0 = b / BLOCKS_PER_TIER + gap;
  const s1 = (b + 1) / BLOCKS_PER_TIER - gap;
  for (let i = 0; i <= steps; i++) {
    const s = s0 + ((s1 - s0) * i) / steps;
    const f = innerPoint(s);
    pts.push(`${(f.x + f.nx * d0).toFixed(1)},${(f.z + f.nz * d0).toFixed(1)}`);
  }
  for (let i = steps; i >= 0; i--) {
    const s = s0 + ((s1 - s0) * i) / steps;
    const f = innerPoint(s);
    pts.push(`${(f.x + f.nx * d1).toFixed(1)},${(f.z + f.nz * d1).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

function SeatPlan({ a, b, picking, onPick, small }: { a: SeatPick | null; b: SeatPick | null; picking?: 'a' | 'b'; onPick?: (tier: Tier, block: number) => void; small?: boolean }) {
  const paths = useMemo(() => (['lower', 'upper'] as Tier[]).flatMap((tier) => Array.from({ length: BLOCKS_PER_TIER }, (_, i) => ({ tier, i, d: blockPath(tier, i) }))), []);
  const ext = INNER.hw + 52;
  const dot = (p: SeatPick | null, color: string, label: string) => {
    if (!p) return null;
    const g = seatGeometry(p);
    return (
      <g>
        <circle cx={g.x} cy={g.z} r={small ? 6 : 4.5} fill={color} stroke="#000" strokeWidth="1" />
        <text x={g.x} y={g.z + 2} textAnchor="middle" fontSize={small ? 7 : 5.5} fontWeight="800" fill="#111">
          {label}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox={`${-ext} ${-(INNER.hd + 52)} ${ext * 2} ${(INNER.hd + 52) * 2}`} className="w-full h-auto" role="img" aria-label="Konsept oturma planı">
      <rect x={-PITCH.length / 2} y={-PITCH.width / 2} width={PITCH.length} height={PITCH.width} fill="#1f6a31" stroke="#fff" strokeWidth="0.5" />
      <line x1="0" y1={-PITCH.width / 2} x2="0" y2={PITCH.width / 2} stroke="#fff" strokeWidth="0.5" />
      {paths.map((p) => {
        const isA = a?.tier === p.tier && a.block === p.i;
        const isB = b?.tier === p.tier && b.block === p.i;
        return (
          <path
            key={`${p.tier}${p.i}`}
            d={p.d}
            fill={isA ? '#d4213d' : isB ? '#5bb4ff' : p.tier === 'lower' ? '#3b3f49' : '#2c3038'}
            stroke="#0b0c10"
            strokeWidth="0.8"
            className={onPick ? 'cursor-pointer hover:opacity-80' : ''}
            role={onPick ? 'button' : undefined}
            tabIndex={onPick ? 0 : undefined}
            aria-label={onPick ? `${blockName({ tier: p.tier, block: p.i, row: 0.5 })} — koltuk ${picking === 'b' ? 'B' : 'A'} olarak seç` : undefined}
            onClick={() => onPick?.(p.tier, p.i)}
            onKeyDown={(e) => {
              if (onPick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onPick(p.tier, p.i);
              }
            }}
          />
        );
      })}
      {dot(a, '#ff6b7d', 'A')}
      {dot(b, '#8fd0ff', 'B')}
    </svg>
  );
}

export default function SeatModule() {
  const view2D = useView((s) => s.view2D);
  const [a, setA] = useState<SeatPick | null>({ tier: 'lower', block: 0, row: 0.5 });
  const [b, setB] = useState<SeatPick | null>(null);
  const [picking, setPicking] = useState<'a' | 'b'>('a');
  const [look, setLook] = useState<LookTarget>('center');
  const [shots, setShots] = useState<{ a: string | null; b: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  const active = picking === 'a' ? a : b;

  useEffect(() => {
    if (active) worldApi.flyTo(seatPose(active, look), { mode: 'seat', fade: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.tier, active?.block, active?.row, look, picking]);

  useEffect(() => () => worldApi.resetView(), []);

  const pick = (tier: Tier, block: number) => {
    const p = { tier, block, row: (picking === 'a' ? a : b)?.row ?? 0.5 };
    if (picking === 'a') setA(p);
    else setB(p);
    setShots(null);
  };

  const compare = async () => {
    if (!a || !b) return;
    setBusy(true);
    const imgA = await worldApi.capture({ pose: seatPose(a, look), width: 900, height: 560 });
    const imgB = await worldApi.capture({ pose: seatPose(b, look), width: 900, height: 560 });
    setShots({ a: imgA, b: imgB });
    setBusy(false);
  };

  const mA = a ? seatMetrics(a) : null;
  const mB = b ? seatMetrics(b) : null;
  const rows: { label: string; get: (m: NonNullable<typeof mA>) => string }[] = [
    { label: 'Sıra (konsept)', get: (m) => `${m.row} / ${m.rows}` },
    { label: 'Orta noktaya uzaklık', get: (m) => `≈ ${Math.round(m.toCenter)} m` },
    { label: 'En yakın kaleye uzaklık', get: (m) => `≈ ${Math.round(m.toNearestGoal)} m` },
    { label: 'Göz yüksekliği', get: (m) => `≈ ${m.eyeHeight.toFixed(1)} m` },
    { label: 'Orta noktaya bakış açısı', get: (m) => `≈ ${m.depression.toFixed(0)}° aşağı` },
    { label: 'C-değeri (yaklaşık)', get: (m) => `≈ ${Math.round(m.cValueMm)} mm` },
    { label: 'Çatı örtüsü', get: (m) => (m.covered ? 'Çatı altında (konsept)' : 'Kısmen açık (ön sıralar)') },
  ];

  return (
    <div>
      <Section title="Koltuk seçin" kicker="Seat Experience 360">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Segmented
            label="Seçilen koltuk"
            value={picking}
            onChange={(v) => setPicking(v)}
            options={[
              { value: 'a', label: 'Koltuk A' },
              { value: 'b', label: 'Koltuk B' },
            ]}
          />
          {b && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => (setB(null), setPicking('a'), setShots(null))}>
              B’yi temizle
            </button>
          )}
        </div>
        <div className="rounded-xl bg-surface-2 border border-line p-2">
          <SeatPlan a={a} b={b} picking={picking} onPick={pick} />
        </div>
        <p className="text-[11.5px] muted mt-1.5">
          {picking === 'a' ? 'Koltuk A' : 'Koltuk B'}: {active ? blockName(active) : 'plan üzerinde bir blok seçin'}
        </p>
        {active && (
          <Slider
            label="Sıra konumu"
            value={active.row}
            onChange={(v) => (picking === 'a' ? setA({ ...active, row: v }) : setB({ ...active, row: v }))}
            format={(v) => (v < 0.34 ? 'Ön sıralar' : v < 0.67 ? 'Orta sıralar' : 'Arka sıralar')}
          />
        )}
        <div className="mt-1">
          <span className="field-label">Bakış yönü</span>
          <Segmented label="Bakış yönü" value={look} onChange={setLook} options={(Object.keys(LOOK_LABEL) as LookTarget[]).map((k) => ({ value: k, label: LOOK_LABEL[k] }))} />
        </div>
        {view2D && (
          <div className="mt-2">
            <Note kind="warn">Koltuk görüşü 3D görünüm gerektirir; 2D modda yalnızca plan ve yaklaşık ölçüler gösterilir.</Note>
          </div>
        )}
      </Section>

      <Section title="Görüş karşılaştırması" kicker="İki koltuk">
        {mA || mB ? (
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Ölçüt</th>
                <th scope="col">A</th>
                <th scope="col">B</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="!font-normal">
                    {r.label}
                  </th>
                  <td>{mA ? r.get(mA) : '—'}</td>
                  <td>{mB ? r.get(mB) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <button type="button" className="btn btn-primary w-full mt-3" disabled={!a || !b || busy || view2D} onClick={compare}>
          <Icon name="Camera" size={15} /> {!b ? 'Karşılaştırma için Koltuk B seçin' : busy ? 'Görüşler oluşturuluyor…' : 'İki görüşü yan yana göster'}
        </button>
        {shots && (
          <div className="grid grid-cols-1 gap-2 mt-3">
            {(['a', 'b'] as const).map((k) => (
              <figure key={k} className="m-0">
                {shots[k] ? <img src={shots[k]!} alt={`Koltuk ${k.toUpperCase()} görüşü`} className="rounded-lg border border-line w-full" /> : <div className="muted text-[12px]">Görsel oluşturulamadı.</div>}
                <figcaption className="text-[11.5px] mt-1 flex items-center gap-2">
                  <strong>{k.toUpperCase()}</strong> {blockName((k === 'a' ? a : b)!)}
                  <span className="ml-auto w-20">
                    <SeatPlan a={k === 'a' ? a : null} b={k === 'b' ? b : null} small />
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Section>

      <Note kind="warn">
        Oturma planı ve sıralar konsept modelden üretilmiştir; gerçek blok numaraları, bilet kategorileri, fiyatlar veya kesin görüş kalitesi hakkında bilgi değildir. Ölçüler yaklaşıktır.
      </Note>
    </div>
  );
}
