/**
 * Mouse hover feedback for the selectable parts of the model. Raycasting the
 * whole stadium on every pointer move costs milliseconds per event, so the
 * probe casts a single ray only after the pointer has rested for a moment,
 * and never while dragging, on touch input or behind overlays.
 */
import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { LayerId } from '@/core/layers';
import { useView } from '@/core/store/viewStore';
import { layerRegistry, partRegistry } from './stadium/registry';

const REST_MS = 180;

function shown(o: THREE.Object3D) {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

/** Nearest selectable part or layer owning a hit mesh (both are groups named after their id). */
function ownerId(o: THREE.Object3D): string | null {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) {
    if (partRegistry.get(p.name) === p || layerRegistry.get(p.name as LayerId) === p) return p.name;
  }
  return null;
}

export function HoverProbe() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let timer = 0;
    const hideTip = () => {
      if (useView.getState().hover) useView.getState().set({ hover: null });
    };
    const clear = () => {
      window.clearTimeout(timer);
      hideTip();
      canvas.style.cursor = '';
    };
    const probe = (x: number, y: number) => {
      const v = useView.getState();
      if (v.module === 'home' || v.introPlaying || v.capturing || v.worldCovered > 0) return clear();
      const rect = canvas.getBoundingClientRect();
      ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const roots = [...layerRegistry.values()].filter((o): o is THREE.Object3D => !!o && shown(o));
      const hit = raycaster.intersectObjects(roots, true).find((h) => shown(h.object));
      const id = hit ? ownerId(hit.object) : null;
      canvas.style.cursor = id ? 'pointer' : '';
      v.set({ hover: id ? { id, x, y } : null });
    };
    const onMove = (e: PointerEvent) => {
      window.clearTimeout(timer);
      hideTip(); // the label shows only at rest instead of trailing the pointer
      if (e.pointerType !== 'mouse' || e.buttons) return;
      const { clientX: x, clientY: y } = e;
      timer = window.setTimeout(() => probe(x, y), REST_MS);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', clear);
    canvas.addEventListener('pointerdown', clear);
    return () => {
      clear();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', clear);
      canvas.removeEventListener('pointerdown', clear);
    };
  }, [gl, camera]);

  return null;
}
