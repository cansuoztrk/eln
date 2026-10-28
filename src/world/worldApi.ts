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
  /** Frames a layer or a selectable part; false when it is not in the scene or hidden. */
  fitObject: (id: string) => boolean;
  saveView: () => void;
  restoreView: () => void;
  getPose: () => CameraPose | null;
  capture: (opts?: CaptureOptions) => Promise<string | null>;
  layerObject: (id: LayerId) => THREE.Object3D | null;
}

/** Last camera request made before the 3D world was ready; replayed once it mounts. */
let pendingCamera: (() => void) | null = null;

export function flushPendingCamera() {
  const fn = pendingCamera;
  pendingCamera = null;
  fn?.();
}

export const worldApi: WorldApi = {
  ready: false,
  flyToPoi: (id, opts) => {
    pendingCamera = () => worldApi.flyToPoi(id, { ...opts, instant: true });
  },
  flyTo: (pose, opts) => {
    pendingCamera = () => worldApi.flyTo(pose, { ...opts, instant: true });
  },
  resetView: () => {},
  fitLayer: () => {},
  fitObject: () => false,
  saveView: () => {},
  restoreView: () => {},
  getPose: () => null,
  capture: async () => null,
  layerObject: () => null,
};

/* Fade overlay used for safe teleport transitions (no flying through walls). */
export function fadeOverlay(on: boolean, ms = 260): Promise<void> {
  const el = document.getElementById('world-fade');
  if (!el) return Promise.resolve();
  el.style.transitionDuration = `${ms}ms`;
  el.style.opacity = on ? '1' : '0';
  return new Promise((r) => setTimeout(r, ms));
}
