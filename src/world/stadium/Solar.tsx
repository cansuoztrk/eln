import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useEffectiveDesign } from '@/core/store/effective';
import { useClipping } from './clipping';
import { LayerGroup, Selectable } from './LayerGroup';
import { PROFILE, ringSamples, roofY, sweepProfile } from './geometry';
import { ZONE_BY_ID } from '@/core/district';
import { solarTexture } from '../textures';

/** Panel bands (d ranges) on the roof: existing installation (representative placement). */
const BANDS: [number, number][] = [
  [15, 25],
  [27, 37],
  [39, 50],
];

/**
 * Solar layer. The existing rooftop installation is a verified fact
 * (see Kaynaklar); its placement on this concept model is representative.
 * The "extended" scenario adds carport and plaza canopies (concept).
 */
export function Solar() {
  const design = useEffectiveDesign();
  const clipping = useClipping();
  const panelMat = useMemo(() => {
    const t = solarTexture().clone();
    t.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({ map: t, metalness: 0.55, roughness: 0.28, emissive: '#0d1a33', emissiveIntensity: 0.35, side: THREE.DoubleSide });
    m.userData.baseEmissive = m.emissive.clone();
    m.userData.baseEmissiveIntensity = 0.35;
    return m;
  }, []);
  panelMat.clippingPlanes = clipping;
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8d939c', metalness: 0.7, roughness: 0.4 }), []);
  const canopyPanel = useMemo(() => {
    const t = solarTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(6, 4);
    return new THREE.MeshStandardMaterial({ map: t, metalness: 0.55, roughness: 0.3 });
  }, []);

  // continuous panel arrays following the roof slope; u tiles by arc length
  const bands = useMemo(
    () =>
      BANDS.map(([d0, d1]) => {
        const prof = [0, 0.5, 1].map((f) => {
          const d = d0 + (d1 - d0) * f;
          return { d, y: roofY(d) + PROFILE.roofThickness + 0.35 };
        });
        return sweepProfile(prof, { samples: ringSamples(16, 18), tile: 3.2 });
      }),
    [],
  );
  useEffect(() => () => bands.forEach((b) => b.dispose()), [bands]);

  const extended = design.green.solar === 'extended';
  const park = ZONE_BY_ID.parking;
  const plaza = ZONE_BY_ID.fanPlaza;
  return (
    <LayerGroup id="solar">
      <Selectable id="solarRoof">
        {bands.map((g, i) => (
          <mesh key={i} geometry={g} material={panelMat} />
        ))}
      </Selectable>
      {extended && (
        <Selectable id="solarCanopies">
          {Array.from({ length: 4 }, (_, i) => (
            <group key={i} position={[park.x - 45 + i * 30, 0, park.z]}>
              <mesh position={[0, 4.2, 0]} rotation-x={-0.12} material={canopyPanel}>
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
              <mesh position={[0, 6, 0]} rotation-z={0.08} material={canopyPanel}>
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
