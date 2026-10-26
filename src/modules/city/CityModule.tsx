import { useEffect, useMemo, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { MEETING_POINTS, ZONES, ZONE_BY_ID, type ZoneId } from '@/core/district';
import { INNER, PROFILE } from '@/world/stadium/geometry';
import { PATHS } from '@/world/stadium/District';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section, Toggle } from '@/ui/primitives';
import type { DesignPatch } from '@/core/model/design';

const ENABLE_PATCH: Partial<Record<ZoneId, DesignPatch>> = {
  fanPlaza: { district: { fanZone: true } },
  social: { plaza: { social: 'expanded' } },
  museum: { district: { museum: true } },
  eventLawn: { district: { eventLawn: true } },
  greenPark: { green: { landscape: true } },
  transitHub: { district: { transitHub: true } },
};

function ring(d: number) {
  const hw = INNER.hw + d;
  const hd = INNER.hd + d;
  return { x: -hw, y: -hd, width: hw * 2, height: hd * 2, rx: INNER.r + d };
}

export default function CityModule() {
  const design = useDesign((s) => s.design);
  const patch = useDesign((s) => s.patch);
  const layers = useView((s) => s.layers);
  const setLayer = useView((s) => s.setLayer);
  const [zone, setZone] = useState<ZoneId | null>(null);
  const paths = useMemo(
    () => ({
      walk: [PATHS.transitToE(), PATHS.transitToD(), PATHS.dropoffToF(), PATHS.plazaToA()],
      access: [PATHS.accessDropoffToG(), PATHS.accessTransitToC(), PATHS.accessPlazaToA()],
    }),
    [],
  );
  const pts = (list: { x: number; z: number }[]) => list.map((p) => `${p.x.toFixed(0)},${p.z.toFixed(0)}`).join(' ');

  useEffect(() => {
    worldApi.flyTo({ pos: [0, 560, 120], target: [0, 0, 10] }, { mode: 'explorer' });
  }, []);

  const select = (id: ZoneId) => {
    setZone(id);
    const z = ZONE_BY_ID[id];
    worldApi.flyTo(z.camera, { mode: 'explorer' });
  };

  const z = zone ? ZONE_BY_ID[zone] : null;
  const enabled = z ? z.enabled(design) : false;

  return (
    <div>
      <Section title="Konsept master plan" kicker="The Stadium City" badges={<Badge kind="concept">Şematik yerleşim</Badge>}>
        <div className="rounded-xl bg-surface-2 border border-line p-1.5">
          <svg viewBox="-300 -260 600 520" className="w-full h-auto" role="group" aria-label="Stadyum çevresi konsept haritası">
            <rect x="-300" y="-260" width="600" height="520" fill="#0d1016" />
            {paths.walk.map((p, i) => (
              <polyline key={i} points={pts(p)} fill="none" stroke={design.green.transitLink && i < 2 ? '#3fbf8a' : '#6d7684'} strokeWidth="3" strokeDasharray="6 4" />
            ))}
            {design.access.routes && paths.access.map((p, i) => <polyline key={i} points={pts(p)} fill="none" stroke="#4ea3ff" strokeWidth="3" />)}
            <rect {...ring(PROFILE.facadeD + 12)} fill="#22252c" />
            <rect {...ring(PROFILE.facadeD)} fill="#3a3e47" stroke="#c9a04a" strokeWidth="2" />
            <rect {...ring(0)} fill="#1f6a31" />
            {ZONES.map((zz) => {
              const on = zz.enabled(design);
              return (
                <g
                  key={zz.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${zz.name}${on ? '' : ' (bu tasarımda kapalı)'}`}
                  aria-pressed={zone === zz.id}
                  className="cursor-pointer"
                  onClick={() => select(zz.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), select(zz.id))}
                >
                  <rect x={zz.x - zz.w / 2} y={zz.z - zz.d / 2} width={zz.w} height={zz.d} rx="6" fill={zz.color} fillOpacity={on ? 0.28 : 0.06} stroke={zz.color} strokeWidth={zone === zz.id ? 3 : 1.2} strokeDasharray={on ? undefined : '4 3'} />
                  <text x={zz.x} y={zz.z + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill={on ? '#f3efe6' : '#7c838f'}>
                    {zz.name.split(' (')[0]}
                  </text>
                </g>
              );
            })}
            {design.district.meetingPoints &&
              MEETING_POINTS.map((m) => (
                <g key={m.id}>
                  <circle cx={m.x} cy={m.z} r="6" fill="#f2b631" />
                  <text x={m.x} y={m.z + 2.5} textAnchor="middle" fontSize="6" fontWeight="800" fill="#111">
                    {m.id}
                  </text>
                </g>
              ))}
          </svg>
        </div>
        <p className="text-[11.5px] muted mt-1.5">Bir alana tıklayın: kamera oraya geçer ve konsept açıklaması açılır.</p>
      </Section>

      {z && (
        <Section title={z.name} kicker="Seçili alan" badges={<>{enabled ? <Badge kind="concept" /> : <Badge kind="sim">Bu tasarımda kapalı</Badge>}</>}>
          <p className="text-[13px] leading-relaxed text-[#dcd9d2]">{z.description}</p>
          <ul className="list-dots mt-2">
            {z.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          {!enabled && ENABLE_PATCH[z.id] && (
            <button type="button" className="btn btn-sm btn-primary mt-3" onClick={() => patch(ENABLE_PATCH[z.id]!, `${z.name} etkinleştirildi`, { respectLocks: false })}>
              <Icon name="Plus" size={14} /> Bu alanı tasarıma ekle
            </button>
          )}
        </Section>
      )}

      <Section title="Bağlantılar ve rotalar">
        <Toggle label="Yaya ve toplu taşıma bağlantıları" checked={layers.transit} onChange={(v) => setLayer('transit', v)} />
        <Toggle label="Toplu taşıma bağlantısını vurgula" checked={design.green.transitLink} onChange={(v) => patch({ green: { transitLink: v } }, v ? 'Toplu taşıma bağlantısı vurgulandı' : 'Toplu taşıma vurgusu kapatıldı', { respectLocks: false })} />
        <Toggle label="Erişilebilir rotalar" checked={design.access.routes} onChange={(v) => patch({ access: { routes: v } }, v ? 'Erişilebilir rotalar açıldı' : 'Erişilebilir rotalar kapatıldı', { respectLocks: false })} />
        <Toggle label="Örnek buluşma noktaları" checked={design.district.meetingPoints} onChange={(v) => patch({ district: { meetingPoints: v } }, 'Buluşma noktaları', { respectLocks: false })} />
      </Section>

      <Note kind="warn">
        Bu harita şematiktir: gerçek parsel sınırlarını, yol ağını veya istasyon konumunu göstermez. Gerçek ulaşım bağlantısı olarak yalnızca kaynaklarda belirtilen Seyrantepe (M2) istasyonu anılır; çizilen yollar yer tutucu konsept bağlantılardır.
      </Note>
    </div>
  );
}
