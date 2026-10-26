import { useState } from 'react';
import { navigate } from '@/core/router';
import type { ModuleId } from '@/core/modules';
import { Badge, Icon, Note, Section } from '@/ui/primitives';

interface Step {
  id: string;
  title: string;
  text: string;
  requires: string[];
  benefitsFrom: string[];
  independent: boolean;
  module: ModuleId;
  eng?: boolean;
}

export const ROADMAP: Step[] = [
  { id: 'R1', title: 'Dijital deneyim ve yönlendirme iyileştirmeleri', text: 'Yön bulma, dijital bilet sonrası rehberlik, erişilebilir rota bilgisi.', requires: [], benefitsFrom: [], independent: true, module: 'journey' },
  { id: 'R2', title: 'Aydınlatma ve dijital ekran konseptleri', text: 'Çatı ışık halkası, cephe aydınlatması, LED bant ve gösteri kapasitesi.', requires: [], benefitsFrom: ['R5'], independent: true, module: 'lightshow' },
  { id: 'R3', title: 'Taraftar hizmetlerinin geliştirilmesi', text: 'Kiosklar, hizmet noktaları, buluşma noktaları ve sosyal alan programı.', requires: [], benefitsFrom: ['R1'], independent: true, module: 'os' },
  { id: 'R4', title: 'Çevre alanlarının iyileştirilmesi', text: 'Taraftar meydanı, müze ve deneyim alanı, peyzaj ve etkinlik çimi.', requires: ['R3'], benefitsFrom: ['R5'], independent: false, module: 'city' },
  { id: 'R5', title: 'Enerji ve kaynak yönetimi çalışmaları', text: 'Mevcut GES ile tüketim ilişkisi, verimli aydınlatma, su ve atık yaklaşımları.', requires: [], benefitsFrom: [], independent: true, module: 'green' },
  { id: 'R6', title: 'Daha büyük mimari müdahalelerin araştırılması', text: 'Çatı formu eklentileri ve medya cephesi için yapısal ve mevzuat araştırmaları.', requires: ['R5'], benefitsFrom: ['R2'], independent: false, module: 'whatif', eng: true },
  { id: 'R7', title: 'Uzun vadeli dönüşüm seçenekleri', text: 'Araştırma sonuçlarına göre şekillenecek ASLAN 2035 vizyonu seçenekleri.', requires: ['R6'], benefitsFrom: ['R4'], independent: false, module: 'time', eng: true },
];

const POS: Record<string, [number, number]> = { R1: [0, 0], R5: [0, 1], R2: [0, 2], R3: [1, 0], R6: [1, 2], R4: [2, 0], R7: [2, 2] };

function Diagram({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const W = 360;
  const H = 230;
  const cx = (c: number) => 60 + c * 120;
  const cy = (r: number) => 34 + r * 80;
  const node = (id: string) => ({ x: cx(POS[id][0]), y: cy(POS[id][1]) });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="group" aria-label="Aşama bağımlılık diyagramı">
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#c9ccd2" />
        </marker>
      </defs>
      {ROADMAP.flatMap((s) => [
        ...s.requires.map((r) => ({ from: r, to: s.id, dashed: false })),
        ...s.benefitsFrom.map((r) => ({ from: r, to: s.id, dashed: true })),
      ]).map((e, i) => {
        const a = node(e.from);
        const b = node(e.to);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        const ox = (dx / len) * 30;
        const oy = (dy / len) * 22;
        return <line key={i} x1={a.x + ox} y1={a.y + oy} x2={b.x - ox} y2={b.y - oy} stroke="#c9ccd2" strokeWidth="1.4" strokeDasharray={e.dashed ? '4 3' : undefined} markerEnd="url(#arr)" opacity={0.8} />;
      })}
      {ROADMAP.map((s) => {
        const p = node(s.id);
        const on = selected === s.id;
        return (
          <g key={s.id} role="button" tabIndex={0} aria-pressed={on} aria-label={`${s.id}: ${s.title}`} className="cursor-pointer" onClick={() => onSelect(s.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(s.id))}>
            <rect x={p.x - 30} y={p.y - 20} width="60" height="40" rx="10" fill={on ? '#d4213d' : s.eng ? '#3a2a1c' : '#1f2330'} stroke={s.eng ? '#ff8a3d' : '#3a3e47'} strokeWidth="1.5" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#f3efe6">
              {s.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RoadmapModule() {
  const [selected, setSelected] = useState('R1');
  const s = ROADMAP.find((x) => x.id === selected)!;
  const title = (id: string) => ROADMAP.find((x) => x.id === id)!.title;
  return (
    <div>
      <Section title="Dönüşümü aşamalara ayır" kicker="The Project Roadmap">
        <p className="text-[12.5px] muted mb-2">Stadyumun tamamının bir anda yenilenmesi varsayılmaz. Düz oklar “gerektirir”, kesikli oklar “faydalanır” ilişkisini gösterir.</p>
        <div className="rounded-xl bg-surface-2 border border-line p-2">
          <Diagram selected={selected} onSelect={setSelected} />
        </div>
      </Section>
      <Section title={`${s.id} · ${s.title}`} badges={<>{s.independent ? <Badge kind="verified">Bağımsız başlayabilir</Badge> : <Badge kind="concept">Ön koşullu</Badge>}{s.eng && <Badge kind="eng" />}</>}>
        <p className="text-[13px] text-[#dcd9d2] leading-relaxed">{s.text}</p>
        <div className="mt-2 text-[12.5px]">
          <div className="field-label mb-0.5">Gerektirir</div>
          <p className="m-0">{s.requires.length ? s.requires.map((r) => `${r} — ${title(r)}`).join('; ') : 'Diğer aşamalara bağlı değildir.'}</p>
          <div className="field-label mb-0.5 mt-2">Faydalanır</div>
          <p className="m-0">{s.benefitsFrom.length ? s.benefitsFrom.map((r) => `${r} — ${title(r)}`).join('; ') : '—'}</p>
        </div>
        <button type="button" className="btn btn-sm mt-3" onClick={() => navigate(s.module)}>
          İlgili modül <Icon name="ArrowRight" size={14} />
        </button>
      </Section>
      <Section title="Tüm aşamalar">
        <ol className="flex flex-col gap-1.5">
          {ROADMAP.map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => setSelected(x.id)} aria-pressed={selected === x.id} className={`w-full text-left rounded-xl border px-3 py-2 text-[12.5px] ${selected === x.id ? 'border-aslan bg-aslan/10' : 'border-line bg-surface-2'}`}>
                <strong>{x.id}</strong> · {x.title}
              </button>
            </li>
          ))}
        </ol>
      </Section>
      <Note>Gerçek uygulama sırası teknik raporlar, bütçe, işletme gereksinimleri ve resmî onaylar doğrultusunda belirlenir.</Note>
    </div>
  );
}
