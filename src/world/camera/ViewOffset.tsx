/**
 * Moves the picture's centre into the part of the screen the interface leaves
 * free: between the module rail and the side panel on wide screens, beside the
 * home text on landscape screens and above it on portrait ones. Eased, instant
 * with reduced motion; image captures render without it (see Renderer).
 */
import { useRef } from 'react';
import type * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useView } from '@/core/store/viewStore';

/** left inset of the module rail: 12 px margin + 68 px rail */
const RAIL = 80;
const PANEL_MARGIN = 12;
let panelWidth = 0;

function target(width: number, height: number): [number, number] {
  const v = useView.getState();
  if (v.introPlaying || v.module === 'present' || v.module === 'report') return [0, 0];
  if (v.module === 'home') return width >= height ? [-width * 0.1, 0] : [0, height * 0.26];
  if (v.mobile) return [0, 0]; // compact layout: the canvas already ends above the bottom sheet
  panelWidth ||= parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--panel-w')) || 420;
  return [(panelWidth + PANEL_MARGIN - RAIL) / 2, 0];
}

export function ViewOffset() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const cur = useRef({ x: 0, y: 0 });
  useFrame((_, dt) => {
    const [tx, ty] = target(size.width, size.height);
    const c = cur.current;
    const k = useView.getState().reducedMotion ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 5);
    c.x += (tx - c.x) * k;
    c.y += (ty - c.y) * k;
    if (Math.abs(c.x) < 0.5 && Math.abs(c.y) < 0.5) {
      if (camera.view?.enabled) camera.clearViewOffset();
      return;
    }
    const view = camera.view;
    if (view?.enabled && view.fullWidth === size.width && view.fullHeight === size.height && Math.abs(view.offsetX - c.x) < 0.25 && Math.abs(view.offsetY - c.y) < 0.25) return;
    camera.setViewOffset(size.width, size.height, c.x, c.y, size.width, size.height);
  });
  return null;
}
