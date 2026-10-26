/**
 * Roof, conceptual structure and facade layers.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView } from '@/core/store/viewStore';
import { useClipping } from './clipping';
import { LayerGroup, Selectable } from './LayerGroup';
import { GATE_BREAKS, PROFILE, gateAt, ringSamples, ringWall, roofY, sweepProfile, withBreaks } from './geometry';
import { useConceptMaterial } from './materials';
import { applyInstances, radialMatrix } from './radial';

function roofSurface(d0: number, d1: number, lift: number, steps = 10, yFn: (d: number) => number = roofY) {
  const prof = [];
  for (let i = 0; i <= steps; i++) {
    const d = d0 + ((d1 - d0) * i) / steps;
    prof.push({ d, y: yFn(d) + lift });
  }
  return sweepProfile(prof, { samples: ringSamples(14, 16) });
}

/** Extended canopy height function (slopes down beyond the current roof edge). */
export function canopyY(d: number) {
  if (d <= PROFILE.roofOuterD) return roofY(d);
  const t = (d - PROFILE.roofOuterD) / 20;
  return roofY(PROFILE.roofOuterD) - 13 * t * t;
}
export const CANOPY_OUTER_D = PROFILE.roofOuterD + 20;

export function Roof() {
  const design = useEffectiveDesign();
  const clipping = useClipping();
  const form = design.roof.form;
  const top = useConceptMaterial(design.materials.roof, [60, 2], THREE.DoubleSide);
  const under = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#3b3e45', roughness: 0.7, side: THREE.DoubleSide, emissive: '#ffe8c4', emissiveIntensity: 0.08 });
    m.userData.baseEmissive = m.emissive.clone();
    m.userData.baseEmissiveIntensity = 0.08;
    return m;
  }, []);
  under.clippingPlanes = clipping;
  const structureMat = useConceptMaterial(design.materials.structure, [8, 1], THREE.DoubleSide);

  const geo = useMemo(() => {
    const extended = form === 'extended-canopy';
    const inner = extended ? PROFILE.roofInnerD - 3 : PROFILE.roofInnerD;
    const outer = extended ? CANOPY_OUTER_D : PROFILE.roofOuterD;
    const yFn = extended ? canopyY : roofY;
    return {
      top: roofSurface(inner, outer, PROFILE.roofThickness, extended ? 16 : 10, yFn),
      bottom: roofSurface(inner, outer, 0, extended ? 16 : 10, yFn),
      innerFascia: ringWall(inner, yFn(inner), yFn(inner) + PROFILE.roofThickness),
      outerFascia: ringWall(outer, yFn(outer), yFn(outer) + PROFILE.roofThickness),
      halo: form === 'halo' ? ringWall(PROFILE.roofInnerD - 2.5, PROFILE.roofInnerY + 4.5, PROFILE.roofInnerY + 6.2) : null,
    };
  }, [form]);
  useEffect(() => () => Object.values(geo).forEach((g) => g?.dispose()), [geo]);

  const strutRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (form !== 'halo') return;
    const mats: THREE.Matrix4[] = [];
    for (let i = 0; i < 48; i++) mats.push(radialMatrix(i / 48, PROFILE.roofInnerD - 1.2, PROFILE.roofInnerY + 3.3));
    applyInstances(strutRef.current, mats);
  }, [form]);

  return (
    <LayerGroup id="roof">
      <mesh geometry={geo.top} material={top} />
      <mesh geometry={geo.bottom} material={under} />
      <mesh geometry={geo.innerFascia} material={structureMat} />
      <mesh geometry={geo.outerFascia} material={structureMat} />
      {geo.halo && (
        <Selectable id="halo">
          <mesh geometry={geo.halo} material={structureMat} />
          <instancedMesh ref={strutRef} args={[undefined, undefined, 48]} material={structureMat}>
            <boxGeometry args={[0.35, 3.6, 2.6]} />
          </instancedMesh>
        </Selectable>
      )}
    </LayerGroup>
  );
}

export function Structure() {
  const design = useEffectiveDesign();
  const quality = useView((s) => s.quality);
  const mat = useConceptMaterial(design.materials.structure, [1, 6], THREE.DoubleSide);
  const extended = design.roof.form === 'extended-canopy';
  const trussRef = useRef<THREE.InstancedMesh>(null);
  const colRef = useRef<THREE.InstancedMesh>(null);
  const count = quality === 'low' ? 40 : 64;

  useLayoutEffect(() => {
    const trusses: THREE.Matrix4[] = [];
    const inner = PROFILE.roofInnerD;
    const outer = extended ? CANOPY_OUTER_D : PROFILE.roofOuterD;
    const yFn = extended ? canopyY : roofY;
    const len = outer - inner;
    const midD = (inner + outer) / 2;
    const slope = Math.atan2(yFn(outer) - yFn(inner), len);
    for (let i = 0; i < count; i++) {
      const s = i / count;
      trusses.push(radialMatrix(s, midD, yFn(midD) + PROFILE.roofThickness + 1.6, new THREE.Vector3(1, 1, len), -slope));
    }
    applyInstances(trussRef.current, trusses);
    const cols: THREE.Matrix4[] = [];
    const colCount = 48;
    for (let i = 0; i < colCount; i++) {
      const s = (i + 0.5) / colCount;
      cols.push(radialMatrix(s, PROFILE.facadeD - 1.8, roofY(PROFILE.facadeD - 1.8) / 2));
    }
    applyInstances(colRef.current, cols);
  }, [count, extended]);

  const ringGeo = useMemo(() => ringWall(PROFILE.roofInnerD + 0.6, PROFILE.roofInnerY + PROFILE.roofThickness, PROFILE.roofInnerY + PROFILE.roofThickness + 2.6), []);
  useEffect(() => () => ringGeo.dispose(), [ringGeo]);

  return (
    <LayerGroup id="structure">
      <instancedMesh ref={trussRef} args={[undefined, undefined, 64]} material={mat}>
        <boxGeometry args={[0.45, 3.2, 1]} />
      </instancedMesh>
      <instancedMesh ref={colRef} args={[undefined, undefined, 48]} material={mat}>
        <cylinderGeometry args={[0.7, 0.9, roofY(PROFILE.facadeD - 1.8), 10]} />
      </instancedMesh>
      <Selectable id="compressionRing">
        <mesh geometry={ringGeo} material={mat} />
      </Selectable>
    </LayerGroup>
  );
}

const FIN_D = PROFILE.facadeD + 0.9;

export function Facade({ skinMaterial }: { skinMaterial: THREE.Material }) {
  const design = useEffectiveDesign();
  const quality = useView((s) => s.quality);
  const fin = useConceptMaterial(design.materials.facade, [1, 8], THREE.DoubleSide);
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = quality === 'low' ? 140 : 220;

  useLayoutEffect(() => {
    const mats: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const s = (i + 0.5) / count;
      const atGate = gateAt(s) !== null;
      const y0 = atGate ? 8 : 1.2;
      const h = PROFILE.facadeTop - y0;
      mats.push(radialMatrix(s, FIN_D, y0 + h / 2, new THREE.Vector3(1, h, 1), 0.045));
    }
    applyInstances(ref.current, mats);
  }, [count]);

  const geo = useMemo(
    () => ({
      skinLow: ringWall(PROFILE.facadeD - 0.6, 1.2, 8, { samples: withBreaks(ringSamples(), GATE_BREAKS), skip: (s) => gateAt(s) !== null }),
      skinHigh: ringWall(PROFILE.facadeD - 0.6, 8, PROFILE.facadeTop),
      cap: sweepProfile([
        { d: PROFILE.facadeD - 0.8, y: PROFILE.facadeTop },
        { d: FIN_D + 2.4, y: PROFILE.facadeTop + 0.4 },
      ]),
    }),
    [],
  );
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  return (
    <LayerGroup id="facade" radialExplode>
      <mesh geometry={geo.skinLow} material={skinMaterial} />
      <mesh geometry={geo.skinHigh} material={skinMaterial} />
      <instancedMesh ref={ref} args={[undefined, undefined, 220]} material={fin}>
        <boxGeometry args={[0.55, 1, 2.6]} />
      </instancedMesh>
      <mesh geometry={geo.cap} material={fin} />
    </LayerGroup>
  );
}
