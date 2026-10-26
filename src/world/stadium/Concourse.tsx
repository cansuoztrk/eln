import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useClipping } from './clipping';
import { LayerGroup, Selectable } from './LayerGroup';
import {
  INNER,
  PROFILE,
  TUNNEL_HALF_WIDTH,
  bowlPoint,
  innerPoint,
  ringBand,
  ringSamples,
  ringWall,
  VOM_BREAKS,
  vomitoryAt,
  withBreaks,
} from './geometry';

const CONCOURSE_D0 = PROFILE.crossAisle[0];
const CONCOURSE_D1 = PROFILE.backD;

function useMat(params: THREE.MeshStandardMaterialParameters) {
  const clipping = useClipping();
  const m = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...params });
    mat.userData.baseEmissive = mat.emissive.clone();
    mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  m.clippingPlanes = clipping;
  return m;
}

/** Instanced helper placing boxes along the ring at offset d. */
function RingInstances({
  count,
  d,
  y,
  size,
  material,
  phase = 0,
  skip,
}: {
  count: number;
  d: number;
  y: number;
  size: [number, number, number];
  material: THREE.Material;
  phase?: number;
  skip?: (s: number) => boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < count; i++) {
      const s = (i + phase) / count;
      if (!skip?.(s)) list.push(s);
    }
    return list;
  }, [count, phase, skip]);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3(1, 1, 1);
    items.forEach((s, i) => {
      const f = innerPoint(s);
      bowlPoint(s, d, y, p);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(f.nx, f.nz));
      m.compose(p, q, sc);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, d, y]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} material={material}>
      <boxGeometry args={size} />
    </instancedMesh>
  );
}

function Tunnel() {
  const wall = useMat({ color: '#2a2d33', roughness: 0.7 });
  const light = useMat({ color: '#ffffff', emissive: '#fff1d6', emissiveIntensity: 2.2 });
  const accent = useMat({ color: '#c8102e', emissive: '#c8102e', emissiveIntensity: 1.4 });
  const z0 = -INNER.hd; // pitch edge on the north side
  const len = CONCOURSE_D0 + 1;
  const zc = z0 - len / 2;
  const w = TUNNEL_HALF_WIDTH * 2;
  return (
    <Selectable id="tunnel">
      <group>
        {/* side walls */}
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * TUNNEL_HALF_WIDTH, 2.5, zc]} material={wall}>
            <boxGeometry args={[0.4, 5, len]} />
          </mesh>
        ))}
        <mesh position={[0, 3.6, zc]} material={wall}>
          <boxGeometry args={[w, 0.3, len]} />
        </mesh>
        {/* cover platform above the opening */}
        <mesh position={[0, 4.85, z0 - 5.4]} material={wall}>
          <boxGeometry args={[w + 0.4, 0.3, 7.8]} />
        </mesh>
        <mesh position={[0, 4.2, z0 - 1.6]} material={wall}>
          <boxGeometry args={[w + 0.4, 1.2, 0.3]} />
        </mesh>
        <mesh position={[0, 0.01, zc]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[w, len]} />
          <meshStandardMaterial color="#3a3d44" roughness={0.6} />
        </mesh>
        {/* ceiling light strips */}
        {[-2, 2].map((x) => (
          <mesh key={x} position={[x, 3.42, zc]} material={light}>
            <boxGeometry args={[0.25, 0.05, len - 2]} />
          </mesh>
        ))}
        <mesh position={[0, 4.2, z0 - 1.42]} material={accent}>
          <boxGeometry args={[w * 0.8, 0.25, 0.05]} />
        </mesh>
        {/* end wall */}
        <mesh position={[0, 1.8, z0 - len]} material={wall}>
          <boxGeometry args={[w, 3.6, 0.3]} />
        </mesh>
      </group>
    </Selectable>
  );
}

export function Concourse() {
  const slab = useMat({ color: '#6b6e74', roughness: 0.85 });
  const floor = useMat({ color: '#4a4d54', roughness: 0.55, metalness: 0.1 });
  const glass = useMat({ color: '#9fc4dc', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.32, emissive: '#ffd9a0', emissiveIntensity: 0.25, depthWrite: false });
  const lightPanel = useMat({ color: '#ffffff', emissive: '#fff4de', emissiveIntensity: 0.7 });
  const column = useMat({ color: '#8a8d93', roughness: 0.6 });
  const kiosk = useMat({ color: '#1d2027', emissive: '#f2b631', emissiveIntensity: 0.55, roughness: 0.4 });
  const sign = useMat({ color: '#c8102e', emissive: '#d4213d', emissiveIntensity: 1.6 });

  const geo = useMemo(
    () => ({
      floor: ringBand(CONCOURSE_D0, CONCOURSE_D1, 0.02),
      groundSlab: ringBand(CONCOURSE_D0, CONCOURSE_D1, PROFILE.groundSlabY),
      groundSlabUnder: ringBand(CONCOURSE_D0, CONCOURSE_D1, PROFILE.groundSlabY - 0.4),
      midSlab: ringBand(CONCOURSE_D0, CONCOURSE_D1, PROFILE.midSlabY),
      midSlabUnder: ringBand(CONCOURSE_D0, CONCOURSE_D1, PROFILE.midSlabY - 0.5),
      skybox: ringWall(PROFILE.crossAisle[1], PROFILE.midSlabY, PROFILE.upperBaseY - 1.2, { samples: withBreaks(ringSamples(), VOM_BREAKS), skip: vomitoryAt }),
      lightsLow: ringBand(35.8, 36.4, PROFILE.groundSlabY - 0.42),
      lightsMid: ringBand(35.8, 36.4, PROFILE.midSlabY - 0.52),
    }),
    [],
  );
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  return (
    <LayerGroup id="concourse">
      <mesh geometry={geo.floor} material={floor} />
      <mesh geometry={geo.groundSlab} material={slab} />
      <mesh geometry={geo.groundSlabUnder} material={slab} />
      <mesh geometry={geo.midSlab} material={floor} />
      <mesh geometry={geo.midSlabUnder} material={slab} />
      <Selectable id="skyboxes">
        <mesh geometry={geo.skybox} material={glass} />
      </Selectable>
      <mesh geometry={geo.lightsLow} material={lightPanel} />
      <mesh geometry={geo.lightsMid} material={lightPanel} />
      <RingInstances count={64} d={30} y={PROFILE.groundSlabY / 2} size={[0.8, PROFILE.groundSlabY, 0.8]} material={column} />
      <RingInstances count={64} d={30} y={(PROFILE.groundSlabY + PROFILE.midSlabY) / 2} size={[0.7, PROFILE.midSlabY - PROFILE.groundSlabY, 0.7]} material={column} />
      <RingInstances count={64} d={44} y={PROFILE.groundSlabY / 2} size={[0.8, PROFILE.groundSlabY, 0.8]} material={column} phase={0.5} />
      <Selectable id="kiosks">
        <RingInstances count={40} d={CONCOURSE_D0 + 1.4} y={1.3} size={[5.5, 2.6, 2.2]} material={kiosk} phase={0.25} skip={(s) => Math.abs(((s + 0.5) % 1) - 0.5) < 0.012} />
        <RingInstances count={40} d={CONCOURSE_D0 + 0.35} y={2.9} size={[4.5, 0.5, 0.08]} material={sign} phase={0.25} skip={(s) => Math.abs(((s + 0.5) % 1) - 0.5) < 0.012} />
      </Selectable>
      <Tunnel />
    </LayerGroup>
  );
}
