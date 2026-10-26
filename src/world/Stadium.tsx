import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useView } from '@/core/store/viewStore';
import { runtime } from './runtime';
import { Pitch } from './stadium/Pitch';
import { LowerTier, UpperTier } from './stadium/Tiers';
import { Concourse } from './stadium/Concourse';
import { Massing } from './stadium/Massing';
import { Facade, Roof, Structure } from './stadium/Envelope';
import { Lighting, useFacadeSkinMaterial } from './stadium/Lighting';
import { Screens, useLedTextures } from './stadium/Screens';
import { Solar } from './stadium/Solar';
import { AccessRoutes, Ground, Landscape, Surroundings, Transit } from './stadium/District';
import { LayerGroup } from './stadium/LayerGroup';
import { SectionCaps } from './stadium/SectionCaps';
import { ExplodedLabels } from './stadium/ExplodedLabels';
import { CrowdAgents } from './CrowdAgents';
import { Confetti } from './Confetti';

/** Drives exploded animation and the home-screen pointer parallax. */
function Animator({ root }: { root: React.RefObject<THREE.Group | null> }) {
  useFrame((state, dt) => {
    const v = useView.getState();
    const target = v.exploded ? 1 : 0;
    runtime.explode = v.reducedMotion ? target : runtime.explode + (target - runtime.explode) * (1 - Math.exp(-dt * 3));
    if (Math.abs(runtime.explode - target) < 0.001) runtime.explode = target;
    const g = root.current;
    if (g) {
      const home = v.module === 'home' && !v.reducedMotion && !v.capturing;
      const tx = home ? state.pointer.x * 0.018 : 0;
      const tz = home ? -state.pointer.y * 0.008 : 0;
      g.rotation.y += (tx - g.rotation.y) * (1 - Math.exp(-dt * 2));
      g.rotation.x += (tz - g.rotation.x) * (1 - Math.exp(-dt * 2));
    }
  });
  return null;
}

export function Stadium() {
  const root = useRef<THREE.Group>(null);
  const led = useLedTextures();
  const skin = useFacadeSkinMaterial(led.facade);
  return (
    <group ref={root}>
      <Animator root={root} />
      <Ground />
      <LayerGroup id="pitch">
        <Pitch />
      </LayerGroup>
      <LowerTier />
      <UpperTier />
      <Concourse />
      <Massing />
      <Roof />
      <Structure />
      <Facade skinMaterial={skin} />
      <Lighting />
      <Screens led={led} />
      <Solar />
      <Surroundings />
      <Landscape />
      <AccessRoutes />
      <Transit />
      <SectionCaps />
      <ExplodedLabels />
      <CrowdAgents />
      <Confetti />
    </group>
  );
}
