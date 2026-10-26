import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView } from '@/core/store/viewStore';
import { useClipping } from './clipping';
import { LayerGroup, Selectable } from './LayerGroup';
import { PROFILE, perimeterAt, roofY } from './geometry';
import { applyInstances, radialMatrix } from './radial';
import { ZONE_BY_ID } from '@/core/district';

/**
 * Solar layer. The existing rooftop installation is a verified fact
 * (see Kaynaklar); its placement on this concept model is representative.
 * The "extended" scenario adds carport and plaza canopies (concept).
 */
export function Solar() {
  const design = useEffectiveDesign();
  const quality = useView((s) => s.quality);
  const clipping = useClipping();
  const panelMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#1b2a4a', metalness: 0.6, roughness: 0.25, emissive: '#0d1a33', emissiveIntensity: 0.3 });
    m.userData.baseEmissive = m.emissive.clone();
    m.userData.baseEmissiveIntensity = 0.3;
    return m;
  }, []);
  panelMat.clippingPlanes = clipping;
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8d939c', metalness: 0.7, roughness: 0.4 }), []);

  const roofRef = useRef<THREE.InstancedMesh>(null);
  const roofCount = useMemo(() => {
    const rows = quality === 'low' ? 5 : 8;
    let n = 0;
    for (let r = 0; r < rows; r++) {
      const d = 16 + (r * 34) / rows;
      n += Math.floor((perimeterAt(d) * 0.82) / 7);
    }
    return n;
  }, [quality]);

  useLayoutEffect(() => {
    const mats: THREE.Matrix4[] = [];
    const rows = quality === 'low' ? 5 : 8;
    for (let r = 0; r < rows; r++) {
      const d = 16 + (r * 34) / rows;
      const n = Math.floor((perimeterAt(d) * 0.82) / 7);
      const slope = Math.atan2(roofY(d + 1) - roofY(d - 1), 2);
      for (let i = 0; i < n; i++) {
        const s = (i + 0.5 + (r % 2) * 0.5) / n;
        mats.push(radialMatrix(s, d, roofY(d) + PROFILE.roofThickness + 0.3, new THREE.Vector3(1, 1, 1), -slope - 0.08));
      }
    }
    applyInstances(roofRef.current, mats);
  }, [roofCount, quality]);

  const extended = design.green.solar === 'extended';
  const park = ZONE_BY_ID.parking;
  const plaza = ZONE_BY_ID.fanPlaza;
  return (
    <LayerGroup id="solar">
      <Selectable id="solarRoof">
        <instancedMesh ref={roofRef} args={[undefined, undefined, roofCount]} material={panelMat}>
          <boxGeometry args={[6.2, 0.12, 3.6]} />
        </instancedMesh>
      </Selectable>
      {extended && (
        <Selectable id="solarCanopies">
          {Array.from({ length: 4 }, (_, i) => (
            <group key={i} position={[park.x - 45 + i * 30, 0, park.z]}>
              <mesh position={[0, 4.2, 0]} rotation-x={-0.12} material={panelMat}>
                <boxGeometry args={[26, 0.25, 40]} />
              </mesh>
              {[-10, 10].map((x) => (
                <mesh key={x} position={[x, 2, 0]} material={frameMat}>
                  <cylinderGeometry args={[0.35, 0.35, 4, 8]} />
                </mesh>
              ))}
            </group>
          ))}
          {[-40, 40].map((x) => (
            <group key={x} position={[plaza.x + x, 0, plaza.z + 18]}>
              <mesh position={[0, 6, 0]} rotation-z={0.08} material={panelMat}>
                <boxGeometry args={[30, 0.25, 12]} />
              </mesh>
              <mesh position={[0, 3, 0]} material={frameMat}>
                <cylinderGeometry args={[0.45, 0.45, 6, 8]} />
              </mesh>
            </group>
          ))}
        </Selectable>
      )}
    </LayerGroup>
  );
}
