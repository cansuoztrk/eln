import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useView } from '@/core/store/viewStore';
import { crowdSim } from '@/core/sim/crowd';

const MAX = 3000;

/** Projects the 2D crowd simulation into the 3D world as small markers. */
export function CrowdAgents() {
  const on = useView((s) => s.crowdIn3D);
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd166', toneMapped: false }), []);
  const queueColor = useMemo(() => new THREE.Color('#ff4d5e'), []);
  const walkColor = useMemo(() => new THREE.Color('#ffd166'), []);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh || !on) return;
    const m = new THREE.Matrix4();
    let n = 0;
    for (const a of crowdSim.agents) {
      if (a.state !== 'walking' && a.state !== 'queue') continue;
      if (n >= MAX) break;
      m.makeTranslation(a.x, 1.1, a.z);
      mesh.setMatrixAt(n, m);
      mesh.setColorAt(n, a.state === 'queue' ? queueColor : walkColor);
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  if (!on) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX]} material={mat} frustumCulled={false}>
      <capsuleGeometry args={[0.9, 1.2, 2, 6]} />
    </instancedMesh>
  );
}
