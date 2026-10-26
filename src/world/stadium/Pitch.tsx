import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEffectiveDesign } from '@/core/store/effective';
import { PITCH } from './geometry';
import { pitchTexture } from '../textures';
import { runtime } from '../runtime';
import { useClipping } from './clipping';

const RUNOFF = 7.5;

export function Pitch() {
  const design = useEffectiveDesign();
  const clipping = useClipping();
  const mat = useMemo(() => {
    const tex = pitchTexture(RUNOFF);
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0, emissiveMap: tex, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.2 });
    m.userData.baseEmissive = m.emissive.clone();
    m.userData.baseEmissiveIntensity = 0.2;
    return m;
  }, []);
  mat.clippingPlanes = clipping;
  const surround = useMemo(() => new THREE.MeshStandardMaterial({ color: '#173d22', roughness: 1 }), []);
  surround.clippingPlanes = clipping;
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f4f4', emissive: '#ffffff', emissiveIntensity: 0.25 }), []);
  white.clippingPlanes = clipping;
  const irrigation = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#4fc3f7', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }),
    [],
  );

  useFrame(() => {
    // floodlit pitch: emissive follows the floodlight level
    const target = 0.08 + runtime.floods * 0.42;
    mat.userData.baseEmissiveIntensity = target;
    if (mat.emissiveIntensity !== target && mat.emissive.equals(mat.userData.baseEmissive)) mat.emissiveIntensity = target;
    irrigation.opacity = 0.12 + 0.06 * Math.sin(runtime.time * 1.2);
  });

  const L = PITCH.length + RUNOFF * 2;
  const W = PITCH.width + RUNOFF * 2;
  return (
    <group>
      {/* run-off ring between pitch and stands */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} material={surround}>
        <planeGeometry args={[124, 88]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} material={mat}>
        <planeGeometry args={[L, W]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (PITCH.length / 2 + 0.1), 0, 0]}>
          <mesh position={[0, 1.22, -3.66]} material={white}>
            <boxGeometry args={[0.12, 2.44, 0.12]} />
          </mesh>
          <mesh position={[0, 1.22, 3.66]} material={white}>
            <boxGeometry args={[0.12, 2.44, 0.12]} />
          </mesh>
          <mesh position={[0, 2.44, 0]} material={white}>
            <boxGeometry args={[0.12, 0.12, 7.44]} />
          </mesh>
          <mesh position={[side * 1.0, 1.2, 0]}>
            <boxGeometry args={[2, 2.4, 7.3]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {design.green.pitchCare && (
        <group position={[0, 0.06, 0]}>
          {[-36, -12, 12, 36].flatMap((x) =>
            [-18, 18].map((z) => (
              <mesh key={`${x}${z}`} rotation-x={-Math.PI / 2} position={[x, 0, z]} material={irrigation}>
                <ringGeometry args={[7.5, 11, 40]} />
              </mesh>
            )),
          )}
        </group>
      )}
    </group>
  );
}
