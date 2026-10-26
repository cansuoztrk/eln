/**
 * Lighting layer: roof light ring(s), crown, floodlights and the facade
 * light wash material. All light ribbons share the uniforms driven by the
 * LightingDirector, so one light show controls the whole building.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEffectiveDesign } from '@/core/store/effective';
import { useClipping } from './clipping';
import { LayerGroup, Selectable } from './LayerGroup';
import { PROFILE, ringWall, roofY, sweepProfile } from './geometry';
import { createLightMaterial } from './lightMaterial';
import { applyInstances, radialMatrix } from './radial';
import { runtime } from '../runtime';
import { CANOPY_OUTER_D, canopyY } from './Envelope';

function useLightMat(opts: Parameters<typeof createLightMaterial>[0], deps: unknown[]) {
  const clipping = useClipping();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(() => createLightMaterial(opts), deps);
  useEffect(() => () => m.dispose(), [m]);
  m.clippingPlanes = clipping;
  return m;
}

/** Facade wash / media facade material (used by the facade layer's skin). */
export function useFacadeSkinMaterial(media: THREE.Texture) {
  const design = useEffectiveDesign();
  const mode = design.facade.lighting;
  const mat = useLightMat({ vertical: true, gain: 0.5, media, mediaRepeat: [6, 1] }, [media]);
  useFrame(() => {
    const u = mat.uniforms;
    if (mode === 'static') {
      u.uProfileOverride.value = 0;
      u.uGain.value = 0.28;
      u.uMediaMix.value = 0;
    } else if (mode === 'dynamic') {
      u.uProfileOverride.value = -1;
      u.uGain.value = 0.45;
      u.uMediaMix.value = 0;
    } else {
      u.uProfileOverride.value = -1;
      u.uGain.value = 0.5;
      u.uMediaMix.value = 0.7;
      u.uMediaOffset.value.x = (runtime.time * 0.01) % 1;
    }
  });
  return mat;
}

export function Lighting() {
  const design = useEffectiveDesign();
  const style = design.roof.light;
  const form = design.roof.form;
  const extended = form === 'extended-canopy';

  const innerD = (extended ? PROFILE.roofInnerD - 3 : PROFILE.roofInnerD) - 0.12;
  const yFn = extended ? canopyY : roofY;
  const outerD = (extended ? CANOPY_OUTER_D : PROFILE.roofOuterD) + 0.12;

  const ringMat = useLightMat({ gain: 1.6, segmentGap: style === 'segmented' }, [style]);
  const crownMat = useLightMat({ gain: 1.2, offset: 0.25 }, []);
  const haloMat = useLightMat({ gain: 2.2, offset: 0.1 }, []);
  const facadeCrownMat = useLightMat({ gain: 1.0, offset: 0.5 }, []);

  const geo = useMemo(() => {
    const ringH = style === 'subtle-rim' ? 0.35 : 1.0;
    const y0 = yFn(innerD + 0.12);
    return {
      ring: ringWall(innerD, y0 + (PROFILE.roofThickness - ringH) / 2, y0 + (PROFILE.roofThickness + ringH) / 2),
      crown: ringWall(outerD, yFn(outerD - 0.12) + 0.2, yFn(outerD - 0.12) + PROFILE.roofThickness - 0.2),
      halo: ringWall(PROFILE.roofInnerD - 2.62, PROFILE.roofInnerY + 4.7, PROFILE.roofInnerY + 6.0),
      facadeCrown: sweepProfile([
        { d: PROFILE.facadeD + 2.2, y: PROFILE.facadeTop + 0.45 },
        { d: PROFILE.facadeD + 2.2, y: PROFILE.facadeTop + 1.05 },
      ]),
    };
  }, [style, innerD, outerD, yFn]);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  // floodlights under the roof edge
  const floodRef = useRef<THREE.InstancedMesh>(null);
  const floodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff3dc', emissiveIntensity: 3, toneMapped: false }), []);
  const clipping = useClipping();
  floodMat.clippingPlanes = clipping;
  useLayoutEffect(() => {
    const mats: THREE.Matrix4[] = [];
    const n = 96;
    for (let i = 0; i < n; i++) mats.push(radialMatrix((i + 0.5) / n, PROFILE.roofInnerD + 2.5, roofY(PROFILE.roofInnerD + 2.5) - 0.5, new THREE.Vector3(1, 1, 1), -0.5));
    applyInstances(floodRef.current, mats);
  }, []);
  useFrame(() => {
    floodMat.emissive.set(design.green.efficientLighting ? '#eef4ff' : '#ffe6bd');
    floodMat.emissiveIntensity = 0.2 + runtime.floods * 1.6 * runtime.reveal;
  });

  const showRing = style !== 'none';
  const showCrown = style === 'full-crown';
  return (
    <LayerGroup id="lighting">
      {showRing && (
        <Selectable id="lightRing">
          <mesh geometry={geo.ring} material={ringMat} />
        </Selectable>
      )}
      {showCrown && <mesh geometry={geo.crown} material={crownMat} />}
      {form === 'halo' && showRing && <mesh geometry={geo.halo} material={haloMat} />}
      {design.facade.lighting !== 'static' && <mesh geometry={geo.facadeCrown} material={facadeCrownMat} />}
      <Selectable id="floodlights">
        <instancedMesh ref={floodRef} args={[undefined, undefined, 96]} material={floodMat}>
          <boxGeometry args={[1.6, 0.5, 0.9]} />
        </instancedMesh>
      </Selectable>
    </LayerGroup>
  );
}
