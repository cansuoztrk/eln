import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { EXPLODE_FACADE_SCALE, EXPLODE_OFFSET, type LayerId } from '@/core/layers';
import { useView } from '@/core/store/viewStore';
import { runtime } from '../runtime';
import { layerRegistry } from './registry';

const HIGHLIGHT = new THREE.Color('#ffd166');

function forEachStandard(root: THREE.Object3D, fn: (m: THREE.MeshStandardMaterial) => void) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) fn(m as THREE.MeshStandardMaterial);
  });
}

/** Pulsing emissive highlight on every standard material below `ref`. */
function useHighlight(ref: RefObject<THREE.Object3D | null>, active: boolean) {
  const touched = useRef(false);
  useFrame(() => {
    const g = ref.current;
    if (!g || (!active && !touched.current)) return;
    const pulse = 0.3 + 0.22 * Math.sin(runtime.time * 3);
    forEachStandard(g, (sm) => {
      if (active) {
        sm.emissive.copy(HIGHLIGHT);
        sm.emissiveIntensity = pulse;
      } else {
        const baseE = sm.userData.baseEmissive as THREE.Color | undefined;
        if (baseE) sm.emissive.copy(baseE);
        sm.emissiveIntensity = (sm.userData.baseEmissiveIntensity as number | undefined) ?? 0;
      }
    });
    touched.current = active;
  });
}

function useSelectHandler(id: string) {
  const set = useView((s) => s.set);
  return (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return;
    e.stopPropagation();
    set({ selected: id });
  };
}

/**
 * Wraps one layer of the digital twin: visibility, exploded offset,
 * selection (Object Inspector), highlight (Stadium OS) and focus dimming.
 */
export function LayerGroup({ id, children, selectId, radialExplode }: { id: LayerId; children: ReactNode; selectId?: string; radialExplode?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const visible = useView((s) => s.layers[id]);
  const highlighted = useView((s) => s.highlight.includes(id) || s.selected === (selectId ?? id));
  const dimmed = useView((s) => s.focusLayer !== null && s.focusLayer !== id);
  const onClick = useSelectHandler(selectId ?? id);
  useHighlight(ref, highlighted);

  useEffect(() => {
    const obj = ref.current;
    layerRegistry.set(id, obj);
    return () => {
      if (layerRegistry.get(id) === obj) layerRegistry.delete(id);
    };
  }, [id]);

  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    forEachStandard(g, (sm) => {
      if (sm.userData.dimBase === undefined) sm.userData.dimBase = { opacity: sm.opacity, transparent: sm.transparent, depthWrite: sm.depthWrite };
      const base = sm.userData.dimBase as { opacity: number; transparent: boolean; depthWrite: boolean };
      const transparent = dimmed ? true : base.transparent;
      if (sm.transparent !== transparent) {
        sm.transparent = transparent;
        sm.needsUpdate = true;
      }
      sm.opacity = dimmed ? base.opacity * 0.12 : base.opacity;
      sm.depthWrite = dimmed ? false : base.depthWrite;
    });
  });

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const e = runtime.explode;
    g.position.y = EXPLODE_OFFSET[id] * e;
    if (radialExplode) {
      const s = 1 + EXPLODE_FACADE_SCALE * e;
      g.scale.set(s, 1, s);
    }
  });

  return (
    <group ref={ref} visible={visible} onClick={onClick} name={id}>
      {children}
    </group>
  );
}

/** A selectable sub-component inside a layer (e.g. tunnel, gates, museum). */
export function Selectable({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const highlighted = useView((s) => s.selected === id);
  const onClick = useSelectHandler(id);
  useHighlight(ref, highlighted);
  return (
    <group ref={ref} onClick={onClick} name={id}>
      {children}
    </group>
  );
}
