/**
 * Architectural section: poché caps drawn exactly on the cutting plane from
 * the analytic profile. This is an explanatory concept section, not a
 * verified structural drawing.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useView } from '@/core/store/viewStore';
import { INNER, sectionPolygons } from './geometry';

const COLORS: Record<string, string> = {
  lowerTier: '#b3122b',
  upperTier: '#b3122b',
  concourse: '#8f1022',
  concourse2: '#8f1022',
  roof: '#d9a336',
  facade: '#9aa3ad',
};

export function SectionCaps() {
  const section = useView((s) => s.section);
  const shapes = useMemo(() => {
    const polys = sectionPolygons();
    const half = section === 'short' ? INNER.hd : INNER.hw;
    return polys.flatMap((poly) =>
      [1, -1].map((side) => {
        const shape = new THREE.Shape(poly.pts.map((p) => new THREE.Vector2(side * (half + p.d), p.y)));
        const geo = new THREE.ShapeGeometry(shape);
        const edges = new THREE.EdgesGeometry(geo);
        return { id: `${poly.id}${side}`, label: poly.label, side, geo, edges, color: COLORS[poly.id] ?? '#999', anchor: poly.pts[Math.floor(poly.pts.length / 2)], half };
      }),
    );
  }, [section]);

  if (section === 'off') return null;
  const rot = section === 'short' ? Math.PI / 2 : 0;
  const offset = section === 'short' ? [-0.06, 0, 0] : [0, 0, -0.06];
  return (
    <group rotation-y={rot} position={offset as [number, number, number]}>
      {shapes.map((s) => (
        <group key={s.id}>
          <mesh geometry={s.geo}>
            <meshBasicMaterial color={s.color} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <lineSegments geometry={s.edges}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </lineSegments>
        </group>
      ))}
      {shapes
        .filter((s) => s.side === 1 && s.id !== 'concourse21')
        .map((s) => (
          <Html key={`l${s.id}`} position={[s.half + s.anchor.d, s.anchor.y + 3, 0]} center zIndexRange={[20, 0]}>
            <div className="section-label">{s.label}</div>
          </Html>
        ))}
      <Html position={[0, 62, 0]} center zIndexRange={[20, 0]}>
        <div className="section-label section-label--note">Kavramsal kesit — mühendislik çizimi değildir</div>
      </Html>
    </group>
  );
}
