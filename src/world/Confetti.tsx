import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useView } from '@/core/store/viewStore';
import { useEffectiveDesign } from '@/core/store/effective';

const COUNT = 900;

/** Slow-falling paper confetti for the championship atmosphere (disabled with reduced motion). */
export function Confetti() {
  const atmosphere = useView((s) => s.atmosphere);
  const reduced = useView((s) => s.reducedMotion);
  const palette = useEffectiveDesign().palette;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < COUNT; i++)
      arr.push({
        x: (Math.random() - 0.5) * 150,
        y: Math.random() * 60,
        z: (Math.random() - 0.5) * 110,
        vy: 1.2 + Math.random() * 1.6,
        spin: Math.random() * 3,
        phase: Math.random() * 6.28,
      });
    return arr;
  }, []);
  const colorsSet = useRef('');
  const active = atmosphere === 'championship' && !reduced;

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh || !active) return;
    const key = palette.primary + palette.secondary;
    if (colorsSet.current !== key) {
      const a = new THREE.Color(palette.primary);
      const b = new THREE.Color(palette.secondary);
      for (let i = 0; i < COUNT; i++) mesh.setColorAt(i, i % 2 ? a : b);
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      colorsSet.current = key;
    }
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const t = state.clock.elapsedTime;
    data.forEach((p, i) => {
      p.y -= p.vy * Math.min(0.05, dt);
      if (p.y < 0) p.y = 55 + Math.random() * 8;
      e.set(t * p.spin + p.phase, t * p.spin * 0.7, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x + Math.sin(t + p.phase) * 1.5, p.y, p.z), q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[0.6, 0.35]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}
