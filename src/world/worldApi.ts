/**
 * Imperative bridge between UI modules and the 3D world. The world
 * components install the real implementations when they mount; when the
 * 3D view is not available (2D mode, no WebGL) calls resolve harmlessly.
 */
import type * as THREE from 'three';
import type { DesignConfig } from '@/core/model/design';
import type { LayerId } from '@/core/layers';
import type { CameraMode } from '@/core/store/viewStore';

export type Vec3 = [number, number, number];

export interface CameraPose {
  pos: Vec3;
  target: Vec3;
  /** optional vertical field of view */
  fov?: number;
}

export interface CaptureOptions {
  width?: number;
  height?: number;
  pose?: CameraPose;
  preview?: DesignConfig | null;
  mime?: 'image/png' | 'image/jpeg';
  quality?: number;
}

export interface WorldApi {
  ready: boolean;
  flyToPoi: (id: string, opts?: { instant?: boolean }) => void;
  flyTo: (pose: CameraPose, opts?: { instant?: boolean; mode?: CameraMode; fade?: boolean }) => void;
  resetView: () => void;
  fitLayer: (id: LayerId) => void;
  saveView: () => void;
  restoreView: () => void;
  getPose: () => CameraPose | null;
  capture: (opts?: CaptureOptions) => Promise<string | null>;
  layerObject: (id: LayerId) => THREE.Object3D | null;
}

export const worldApi: WorldApi = {
  ready: false,
  flyToPoi: () => {},
  flyTo: () => {},
  resetView: () => {},
  fitLayer: () => {},
  saveView: () => {},
  restoreView: () => {},
  getPose: () => null,
  capture: async () => null,
  layerObject: () => null,
};

/** Capture a series of images sequentially (each may use its own preview/pose). */
export async function captureSeries(list: CaptureOptions[]): Promise<(string | null)[]> {
  const out: (string | null)[] = [];
  for (const opts of list) out.push(await worldApi.capture(opts));
  return out;
}

/* Fade overlay used for safe teleport transitions (no flying through walls). */
export function fadeOverlay(on: boolean, ms = 260): Promise<void> {
  const el = document.getElementById('world-fade');
  if (!el) return Promise.resolve();
  el.style.transitionDuration = `${ms}ms`;
  el.style.opacity = on ? '1' : '0';
  return new Promise((r) => setTimeout(r, ms));
}
