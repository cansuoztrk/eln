import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useEffectiveDesign } from '@/core/store/effective';
import { useClipping } from './clipping';
import { LayerGroup } from './LayerGroup';
import { GATE_BREAKS, PROFILE, TUNNEL_BREAKS, bowlPoint, gateAt, inTunnel, ringBand, ringSamples, ringWall, withBreaks } from './geometry';
import { useConceptMaterial } from './materials';

export function Massing() {
  const design = useEffectiveDesign();
  const clipping = useClipping();
  const plinthMat = useConceptMaterial(design.materials.plinth, [40, 1], THREE.DoubleSide);
  const wallMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#55585e', roughness: 0.92, side: THREE.DoubleSide });
    m.userData.baseEmissive = m.emissive.clone();
    m.userData.baseEmissiveIntensity = 0;
    return m;
  }, []);
  wallMat.clippingPlanes = clipping;

  const geo = useMemo(
    () => ({
      lowerBack: ringWall(PROFILE.crossAisle[0], 0, PROFILE.midSlabY, { samples: withBreaks(ringSamples(), TUNNEL_BREAKS), skip: inTunnel }),
      envelope: ringWall(PROFILE.backD, 0, PROFILE.midSlabY, { samples: withBreaks(ringSamples(), GATE_BREAKS), skip: (s) => gateAt(s) !== null }),
      envelopeUpper: ringWall(PROFILE.backD, PROFILE.midSlabY, PROFILE.upperBaseY + 2),
      plinthTop: ringBand(PROFILE.facadeD - 1, PROFILE.facadeD + 12, 1.2),
      plinthEdge: ringWall(PROFILE.facadeD + 12, 0, 1.2),
    }),
    [],
  );
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const cores = useMemo(() => [0.125, 0.375, 0.625, 0.875].map((s) => bowlPoint(s, PROFILE.facadeD - 2.5, 0)), []);

  return (
    <LayerGroup id="massing">
      <mesh geometry={geo.lowerBack} material={wallMat} />
      <mesh geometry={geo.envelope} material={wallMat} />
      <mesh geometry={geo.envelopeUpper} material={wallMat} />
      <mesh geometry={geo.plinthTop} material={plinthMat} />
      <mesh geometry={geo.plinthEdge} material={plinthMat} />
      {cores.map((p, i) => (
        <mesh key={i} position={[p.x, PROFILE.facadeTop / 2, p.z]} material={wallMat}>
          <cylinderGeometry args={[2.2, 2.2, PROFILE.facadeTop, 16, 1]} />
        </mesh>
      ))}
    </LayerGroup>
  );
}
