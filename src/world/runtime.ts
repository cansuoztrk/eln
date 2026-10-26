/**
 * Per-frame mutable state shared by world components (kept out of React
 * state so animation does not trigger re-renders).
 */
import * as THREE from 'three';
import type { ShowLook } from '@/core/model/design';

export const runtime = {
  time: 0,
  /** 0..1 cinematic reveal of lighting during the intro */
  reveal: 1,
  /** animated exploded factor 0..1 */
  explode: 0,
  /** floodlight level 0..1 (pitch illumination) */
  floods: 0.55,
  /** temporary boost after a goal moment (decays) */
  burst: 0,
  pointer: new THREE.Vector2(),
  /** tribune light layer state written by the lighting director */
  tribune: {
    active: false,
    a: [255, 255, 255] as [number, number, number],
    b: [255, 255, 255] as [number, number, number],
    coverage: 0,
    profile: 0,
    hz: 0,
    level: 1,
    /** bump to force a repaint */
    version: 0,
  },
  /** LED content written by the lighting director */
  led: { mode: 'text' as import('@/core/model/design').LedMode, primary: '#c8102e', secondary: '#f2b631', scroll: true },
  /** crowd card display (tifo) 0..1 */
  tifo: 0,
  /** crowd liveliness: repaint shimmer when true */
  lively: false,
  /** light show playback */
  show: {
    playing: false,
    startedAt: 0,
    stepIndex: 0,
    stepElapsed: 0,
    /** total progress 0..1 of the sequence */
    progress: 0,
    look: null as ShowLook | null,
    /** global fade 0..1 for start/end scenes */
    fade: 1,
  },
};

/** Shared uniforms for every emissive light ribbon. */
export const lightUniforms = {
  uTime: { value: 0 },
  uHz: { value: 0.2 },
  uColorA: { value: new THREE.Color('#c8102e') },
  uColorB: { value: new THREE.Color('#f2b631') },
  uIntensity: { value: 1 },
  uProfile: { value: 0 },
  uMinLevel: { value: 0.35 },
  uReveal: { value: 1 },
  uSegments: { value: 16 },
};

export const PROFILE_INDEX = { static: 0, breathe: 1, chase: 2, wave: 3, sparkle: 4, split: 5 } as const;
