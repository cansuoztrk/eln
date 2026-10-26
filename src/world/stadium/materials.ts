import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { MaterialId } from '@/core/model/design';
import { MATERIAL_BY_ID } from '@/core/model/materials';
import { patternTexture } from '../textures';
import { useClipping } from './clipping';

/** Build a MeshStandardMaterial for a Material Lab id. */
export function buildConceptMaterial(id: MaterialId, repeat: [number, number] = [4, 4], side: THREE.Side = THREE.FrontSide) {
  const v = MATERIAL_BY_ID[id].visual;
  const m = new THREE.MeshStandardMaterial({
    color: v.color,
    metalness: v.metalness,
    roughness: v.roughness,
    transparent: v.opacity < 1,
    opacity: v.opacity,
    side,
    depthWrite: v.opacity >= 0.7,
  });
  if (v.pattern !== 'none') {
    const tex = patternTexture(v.pattern).clone();
    tex.needsUpdate = true;
    tex.repeat.set(repeat[0], repeat[1]);
    m.roughnessMap = tex;
    m.bumpMap = tex;
    m.bumpScale = v.pattern === 'panel' ? 0.6 : 0.25;
  }
  if (v.emissiveBoost > 0) {
    m.emissive = new THREE.Color(v.color);
    m.emissiveIntensity = v.emissiveBoost;
  }
  m.userData.baseEmissive = m.emissive.clone();
  m.userData.baseEmissiveIntensity = m.emissiveIntensity;
  return m;
}

/** Hook: memoised concept material with section clipping applied. */
export function useConceptMaterial(id: MaterialId, repeat: [number, number] = [4, 4], side: THREE.Side = THREE.FrontSide) {
  const clipping = useClipping();
  const mat = useMemo(() => buildConceptMaterial(id, repeat, side), [id, repeat[0], repeat[1], side]);
  useEffect(() => () => mat.dispose(), [mat]);
  mat.clippingPlanes = clipping;
  return mat;
}

/** Plain material helper with clipping. */
export function useBasicStandard(params: THREE.MeshStandardMaterialParameters, deps: unknown[] = []) {
  const clipping = useClipping();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial(params);
    m.userData.baseEmissive = m.emissive.clone();
    m.userData.baseEmissiveIntensity = m.emissiveIntensity;
    return m;
  }, deps);
  useEffect(() => () => mat.dispose(), [mat]);
  mat.clippingPlanes = clipping;
  return mat;
}
