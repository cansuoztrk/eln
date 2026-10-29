/**
 * Alternative 2D plan view. Reflects the same design state as the 3D
 * world (palette, layers, district, routes) for devices without WebGL or
 * for users who prefer a flat, low-motion view.
 */
import { useMemo, type MouseEvent } from 'react';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView } from '@/core/store/viewStore';
import { MEETING_POINTS, ZONES, type ZoneId } from '@/core/district';
import { MATERIAL_BY_ID } from '@/core/model/materials';
import { GATES, INNER, PITCH, PROFILE, bowlPoint, innerPoint } from '@/world/stadium/geometry';
import { FIN_INNER_OFFSET, finLayout } from '@/world/stadium/finStyles';
import { PATHS } from '@/world/stadium/District';
import { LAYER_LABEL } from '@/core/layers';

function ring(d: number) {
  const hw = INNER.hw + d;
  const hd = INNER.hd + d;
  return { x: -hw, y: -hd, width: hw * 2, height: hd * 2, rx: INNER.r + d };
}

/** Facade fins in plan: each a short line along its depth, turned by its louvre angle (same data as the 3D facade). */
function planFins(language: Parameters<typeof finLayout>[0]) {
  return finLayout(language, 220).map((f) => {
    const p = innerPoint(f.s);
    const d = PROFILE.facadeD + FIN_INNER_OFFSET + f.depth / 2;
    const cx = p.x + p.nx * d;
    const cz = p.z + p.nz * d;
    // depth axis: the outward normal turned about the vertical by the fin's yaw
    const dx = Math.sin(f.yaw) * p.nz + Math.cos(f.yaw) * p.nx;
    const dz = -Math.sin(f.yaw) * p.nx + Math.cos(f.yaw) * p.nz;
    const h = f.depth / 2;
    return { x1: cx - dx * h, y1: cz - dz * h, x2: cx + dx * h, y2: cz + dz * h, w: f.width };
  });
}

/** Object Inspector entry opened by each district zone of the plan. */
const ZONE_PART: Record<ZoneId, string> = {
  fanPlaza: 'fanPlaza',
  entryPlaza: 'surroundings',
  social: 'social',
  museum: 'museum',
  eventLawn: 'eventLawn',
  greenPark: 'greenPark',
  transitHub: 'transitHub',
  dropoff: 'transit',
  parking: 'surroundings',
  meeting: 'surroundings',
};

/** Plan ring (distance from the bowl's inner edge) outlined when a bowl or envelope part is selected. */
const SELECTED_RING: Record<string, number> = {
  pitch: -1,
  screens: 1,
  ledRibbon: 1,
  endScreens: 1,
  perimeterBoards: 1,
  lowerTier: PROFILE.crossAisle[0],
  concourse: PROFILE.crossAisle[1],
  skyboxes: PROFILE.crossAisle[1],
  kiosks: PROFILE.crossAisle[1],
  tunnel: PROFILE.crossAisle[1],
  upperTier: PROFILE.backD,
  facade: PROFILE.facadeD,
  mediaFacade: PROFILE.facadeD,
  massing: PROFILE.facadeD + 12,
  roof: PROFILE.roofOuterD,
  halo: PROFILE.roofOuterD,
  structure: PROFILE.roofOuterD,
  compressionRing: PROFILE.roofInnerD,
  lighting: PROFILE.roofInnerD,
  lightRing: PROFILE.roofInnerD,
  floodlights: PROFILE.roofInnerD,
  solar: 33,
  solarRoof: 33,
};
const GOLD = '#f2b631';

export default function Plan2D() {
  const d = useEffectiveDesign();
  const layers = useView((s) => s.layers);
  const selected = useView((s) => s.selected);
  const webgl = useView((s) => s.webgl);
  const set = useView((s) => s.set);
  // a click on a plan element opens the same Object Inspector as the 3D model
  const pick = (id: string) => (e: MouseEvent) => {
    e.stopPropagation();
    set({ selected: id });
  };
  const paths = useMemo(
    () => ({
      transit: [PATHS.transitToE(), PATHS.transitToD(), PATHS.dropoffToF(), PATHS.plazaToA()],
      access: [PATHS.accessDropoffToG(), PATHS.accessTransitToC(), PATHS.accessPlazaToA()],
    }),
    [],
  );
  const pts = (list: { x: number; z: number }[]) => list.map((p) => `${p.x.toFixed(1)},${p.z.toFixed(1)}`).join(' ');
  const choreo = d.seats.choreography;
  const lowerFill = choreo === 'none' ? '#3a3d44' : d.palette.primary;
  const upperFill = choreo === 'none' ? '#33363d' : choreo === 'halves' || choreo === 'stripes' ? d.palette.secondary : d.palette.primary;
  const facadeColor = MATERIAL_BY_ID[d.materials.facade].visual.color;
  const fins = useMemo(() => planFins(d.language), [d.language]);
  // roof light in plan: a thin rim, a wide band (halo, segmented, crown), dashed when segmented, plus the outer edge for the crown
  const roofLight = d.roof.light;
  const ringW = roofLight === 'subtle-rim' ? 0.8 + d.roof.ring * 1.5 : 2 + d.roof.ring * 4;
  return (
    <div className="absolute inset-0 bg-[#0a0c11] flex items-center justify-center">
      <svg viewBox="-330 -300 660 620" className="w-full h-full max-h-full" role="img" aria-label="Stadyum ve çevresinin 2D konsept planı">
        <title>2D konsept planı</title>
        <rect x="-330" y="-300" width="660" height="620" fill="#0d1016" onClick={() => set({ selected: null })} />
        {layers.surroundings &&
          ZONES.filter((z) => z.enabled(d)).map((z) => (
            <g key={z.id} className="plan-part" onClick={pick(ZONE_PART[z.id])}>
              <rect
                x={z.x - z.w / 2}
                y={z.z - z.d / 2}
                width={z.w}
                height={z.d}
                rx="6"
                fill={z.color}
                fillOpacity="0.16"
                stroke={selected === ZONE_PART[z.id] || selected === 'surroundings' ? GOLD : z.color}
                strokeOpacity={selected === ZONE_PART[z.id] || selected === 'surroundings' ? 1 : 0.6}
                strokeWidth={selected === ZONE_PART[z.id] || selected === 'surroundings' ? 2 : 1}
              />
              <text x={z.x} y={z.z + 3} textAnchor="middle" fontSize="8" fill="#e8e4da" fontWeight="600">
                {z.name}
              </text>
            </g>
          ))}
        {layers.transit &&
          paths.transit.map((p, i) => (
            <polyline key={i} className="plan-part" onClick={pick('transit')} points={pts(p)} fill="none" stroke={selected === 'transit' ? GOLD : d.green.transitLink && i < 2 ? '#3fbf8a' : '#8a94a3'} strokeWidth="3" strokeDasharray="6 4" opacity="0.8" />
          ))}
        {layers.access &&
          d.access.routes &&
          paths.access.map((p, i) => <polyline key={i} className="plan-part" onClick={pick('accessRoutes')} points={pts(p)} fill="none" stroke={selected === 'access' || selected === 'accessRoutes' ? GOLD : '#4ea3ff'} strokeWidth="3" />)}
        {layers.massing && <rect {...ring(PROFILE.facadeD + 12)} className="plan-part" onClick={pick('massing')} fill="#22252c" stroke="#3a3e47" />}
        {layers.facade && (
          <g className="plan-part" data-part="facade" onClick={pick('facade')}>
            {/* wide transparent hit area, the skin line and the fins of the chosen visual language */}
            <rect {...ring(PROFILE.facadeD + 1)} fill="none" stroke="transparent" strokeWidth="7" />
            <rect {...ring(PROFILE.facadeD)} fill="none" stroke={facadeColor} strokeOpacity="0.55" strokeWidth="1" />
            {fins.map((f, i) => (
              <line key={i} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke={facadeColor} strokeWidth={Math.max(0.6, f.w)} />
            ))}
          </g>
        )}
        {layers.facade && d.facade.lighting !== 'static' && <rect {...ring(PROFILE.facadeD + 3)} fill="none" stroke={d.palette.primary} strokeWidth="1.5" opacity="0.9" pointerEvents="none" />}
        {layers.upperTier && <rect {...ring(PROFILE.backD)} className="plan-part" onClick={pick('upperTier')} fill={upperFill} opacity="0.55" />}
        {layers.concourse && <rect {...ring(PROFILE.crossAisle[1])} className="plan-part" onClick={pick('concourse')} fill="#2a2d35" />}
        {layers.lowerTier && <rect {...ring(PROFILE.crossAisle[0])} className="plan-part" onClick={pick('lowerTier')} fill={lowerFill} opacity="0.75" />}
        {layers.pitch && (
          <g className="plan-part" onClick={pick('pitch')}>
            <rect {...ring(-1)} fill="#173d22" />
            <rect x={-PITCH.length / 2} y={-PITCH.width / 2} width={PITCH.length} height={PITCH.width} fill="#2a7a39" stroke="#fff" strokeWidth="0.6" />
            <line x1="0" y1={-PITCH.width / 2} x2="0" y2={PITCH.width / 2} stroke="#fff" strokeWidth="0.6" />
            <circle r="9.15" fill="none" stroke="#fff" strokeWidth="0.6" />
          </g>
        )}
        {layers.roof && <rect {...ring(PROFILE.roofOuterD)} className="plan-part" onClick={pick('roof')} fill="none" stroke="#e9e2d0" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 3" />}
        {layers.roof && <rect {...ring(PROFILE.roofInnerD)} className="plan-part" onClick={pick('roof')} fill="none" stroke="#e9e2d0" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 3" />}
        {layers.lighting && roofLight !== 'none' && (
          <rect {...ring(PROFILE.roofInnerD)} className="plan-part" onClick={pick('lightRing')} fill="none" stroke={d.palette.secondary} strokeWidth={ringW} strokeDasharray={roofLight === 'segmented' ? '22 4.5' : undefined} opacity="0.9" />
        )}
        {layers.lighting && roofLight === 'full-crown' && <rect {...ring(PROFILE.roofOuterD)} className="plan-part" onClick={pick('lightRing')} fill="none" stroke={d.palette.secondary} strokeWidth={1.2 + d.roof.ring * 1.5} opacity="0.85" />}
        {layers.solar && <rect {...ring(33)} className="plan-part" onClick={pick('solarRoof')} fill="none" stroke="#2b4a8a" strokeWidth="30" opacity="0.35" />}
        {selected && SELECTED_RING[selected] !== undefined && <rect {...ring(SELECTED_RING[selected])} fill="none" stroke={GOLD} strokeWidth="2.5" pointerEvents="none" />}
        {layers.transit &&
          GATES.map((g) => {
            const p = bowlPoint(g.s, PROFILE.facadeD + 8, 0);
            return (
              <g key={g.id} className="plan-part" onClick={pick('gates')}>
                <circle cx={p.x} cy={p.z} r="6" fill="#c8102e" stroke={selected === 'gates' || selected === 'transit' ? GOLD : 'none'} strokeWidth="2" />
                <text x={p.x} y={p.z + 3} textAnchor="middle" fontSize="7" fill="#fff" fontWeight="800">
                  {g.id}
                </text>
              </g>
            );
          })}
        {d.district.meetingPoints &&
          MEETING_POINTS.map((m) => (
            <g key={m.id}>
              <circle cx={m.x} cy={m.z} r="5" fill="#f2b631" />
              <text x={m.x} y={m.z + 2.5} textAnchor="middle" fontSize="5.5" fill="#111" fontWeight="800">
                {m.id}
              </text>
            </g>
          ))}
        <text x="-320" y="300" fontSize="8" fill="#8a909c">
          Şematik konsept planı — gerçek parsel, yol ağı veya ölçülmüş bir plan değildir. Kuzey yukarıda varsayılmıştır.
        </text>
      </svg>
      <div className="absolute left-3 bottom-3 lg:left-[calc(var(--rail-w)+20px)] glass rounded-xl p-2 text-[11px] max-w-[260px] no-print">
        <div className="font-semibold mb-1">2D görünüm</div>
        {webgl ? (
          <>
            <p className="muted leading-snug">Katmanlar ve tasarım seçimleri burada da uygulanır; bir bölgeye tıklayarak inceleyebilirsiniz. Koltuk görüşü ve görsel yakalama 3D görünüm gerektirir.</p>
            <button type="button" className="btn btn-sm mt-2" onClick={() => set({ view2D: false })}>
              3D görünüme geç
            </button>
          </>
        ) : (
          <p className="muted leading-snug">Bu cihazda WebGL kullanılamadığı için 3D görünüm açılamıyor. Katmanlar ve tasarım seçimleri bu planda gösterilir; bir bölgeye tıklayarak inceleyebilirsiniz.</p>
        )}
        <span className="sr-only">Görünen katmanlar: {Object.entries(layers).filter(([, v]) => v).map(([k]) => LAYER_LABEL[k as keyof typeof LAYER_LABEL]).join(', ')}</span>
      </div>
    </div>
  );
}
