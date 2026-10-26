/**
 * Alternative 2D plan view. Reflects the same design state as the 3D
 * world (palette, layers, district, routes) for devices without WebGL or
 * for users who prefer a flat, low-motion view.
 */
import { useMemo } from 'react';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView } from '@/core/store/viewStore';
import { MEETING_POINTS, ZONES } from '@/core/district';
import { MATERIAL_BY_ID } from '@/core/model/materials';
import { GATES, INNER, PITCH, PROFILE, bowlPoint } from '@/world/stadium/geometry';
import { PATHS } from '@/world/stadium/District';
import { LAYER_LABEL } from '@/core/layers';

function ring(d: number) {
  const hw = INNER.hw + d;
  const hd = INNER.hd + d;
  return { x: -hw, y: -hd, width: hw * 2, height: hd * 2, rx: INNER.r + d };
}

export default function Plan2D() {
  const d = useEffectiveDesign();
  const layers = useView((s) => s.layers);
  const set = useView((s) => s.set);
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
  const ringW = 1 + d.roof.ring * 4;
  return (
    <div className="absolute inset-0 bg-[#0a0c11] flex items-center justify-center">
      <svg viewBox="-330 -300 660 620" className="w-full h-full max-h-full" role="img" aria-label="Stadyum ve çevresinin 2D konsept planı">
        <title>2D konsept planı</title>
        <rect x="-330" y="-300" width="660" height="620" fill="#0d1016" />
        {layers.surroundings &&
          ZONES.filter((z) => z.enabled(d)).map((z) => (
            <g key={z.id}>
              <rect x={z.x - z.w / 2} y={z.z - z.d / 2} width={z.w} height={z.d} rx="6" fill={z.color} opacity="0.16" stroke={z.color} strokeOpacity="0.6" />
              <text x={z.x} y={z.z + 3} textAnchor="middle" fontSize="8" fill="#e8e4da" fontWeight="600">
                {z.name}
              </text>
            </g>
          ))}
        {layers.transit && paths.transit.map((p, i) => <polyline key={i} points={pts(p)} fill="none" stroke={d.green.transitLink && i < 2 ? '#3fbf8a' : '#8a94a3'} strokeWidth="3" strokeDasharray="6 4" opacity="0.8" />)}
        {layers.access && d.access.routes && paths.access.map((p, i) => <polyline key={i} points={pts(p)} fill="none" stroke="#4ea3ff" strokeWidth="3" />)}
        {layers.massing && <rect {...ring(PROFILE.facadeD + 12)} fill="#22252c" stroke="#3a3e47" />}
        {layers.facade && <rect {...ring(PROFILE.facadeD)} fill="none" stroke={facadeColor} strokeWidth="5" />}
        {layers.facade && d.facade.lighting !== 'static' && <rect {...ring(PROFILE.facadeD + 3)} fill="none" stroke={d.palette.primary} strokeWidth="1.5" opacity="0.9" />}
        {layers.upperTier && <rect {...ring(PROFILE.backD)} fill={upperFill} opacity="0.55" />}
        {layers.concourse && <rect {...ring(PROFILE.crossAisle[1])} fill="#2a2d35" />}
        {layers.lowerTier && <rect {...ring(PROFILE.crossAisle[0])} fill={lowerFill} opacity="0.75" />}
        {layers.pitch && (
          <g>
            <rect {...ring(-1)} fill="#173d22" />
            <rect x={-PITCH.length / 2} y={-PITCH.width / 2} width={PITCH.length} height={PITCH.width} fill="#2a7a39" stroke="#fff" strokeWidth="0.6" />
            <line x1="0" y1={-PITCH.width / 2} x2="0" y2={PITCH.width / 2} stroke="#fff" strokeWidth="0.6" />
            <circle r="9.15" fill="none" stroke="#fff" strokeWidth="0.6" />
          </g>
        )}
        {layers.roof && <rect {...ring(PROFILE.roofOuterD)} fill="none" stroke="#e9e2d0" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 3" />}
        {layers.roof && <rect {...ring(PROFILE.roofInnerD)} fill="none" stroke="#e9e2d0" strokeOpacity="0.45" strokeDasharray="3 3" />}
        {layers.lighting && d.roof.light !== 'none' && <rect {...ring(PROFILE.roofInnerD)} fill="none" stroke={d.palette.secondary} strokeWidth={ringW} opacity="0.9" />}
        {layers.solar && <rect {...ring(33)} fill="none" stroke="#2b4a8a" strokeWidth="30" opacity="0.35" />}
        {layers.transit &&
          GATES.map((g) => {
            const p = bowlPoint(g.s, PROFILE.facadeD + 8, 0);
            return (
              <g key={g.id}>
                <circle cx={p.x} cy={p.z} r="6" fill="#c8102e" />
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
      <div className="absolute left-3 bottom-3 md:left-[calc(var(--rail-w)+20px)] glass rounded-xl p-2 text-[11px] max-w-[260px] no-print">
        <div className="font-semibold mb-1">2D görünüm</div>
        <p className="muted leading-snug">
          Katmanlar ve tasarım seçimleri burada da uygulanır. Koltuk görüşü ve görsel yakalama 3D görünüm gerektirir.
        </p>
        <button type="button" className="btn btn-sm mt-2" onClick={() => set({ view2D: false })} disabled={!useView.getState().webgl}>
          3D görünüme geç
        </button>
        <span className="sr-only">Görünen katmanlar: {Object.entries(layers).filter(([, v]) => v).map(([k]) => LAYER_LABEL[k as keyof typeof LAYER_LABEL]).join(', ')}</span>
      </div>
    </div>
  );
}
