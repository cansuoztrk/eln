/**
 * Time-of-day look: the target values of each environment (night / dusk /
 * day) and the current values, which the environment director eases toward
 * the target every frame so a switch reads as a transition, not a cut.
 */
import * as THREE from 'three';
import type { NightTint } from '@/core/model/design';
import { NIGHT_COLORS } from '@/core/model/labels';
import type { EnvMode } from '@/core/store/viewStore';

const ENV_COLORS = {
  dusk: { sky: '#1a2a4f', horizon: '#d9825b', fog: '#3b3348' },
  day: { sky: '#6fa3d9', horizon: '#cfe0ef', fog: '#a9bccd' },
};

export function envPalette(env: EnvMode, night: NightTint) {
  return env === 'night' ? NIGHT_COLORS[night] : { ...ENV_COLORS[env], accent: '#ffffff' };
}

export interface EnvLook {
  sky: THREE.Color;
  horizon: THREE.Color;
  fog: THREE.Color;
  fogNear: number;
  fogFar: number;
  hemi: THREE.Color;
  ground: THREE.Color;
  hemiIntensity: number;
  sun: THREE.Color;
  sunIntensity: number;
  sunPos: THREE.Vector3;
  /** bowl fill light standing in for the floodlights */
  flood: number;
  city: THREE.Color;
  cityGlow: number;
  hills: THREE.Color;
  water: THREE.Color;
  /** 0..1 night lighting: hill lights, bridge lights, stars */
  lights: number;
}

export function targetLook(env: EnvMode, night: NightTint): EnvLook {
  const pal = envPalette(env, night);
  const day = env === 'day';
  const dusk = env === 'dusk';
  return {
    sky: new THREE.Color(pal.sky),
    horizon: new THREE.Color(pal.horizon),
    fog: new THREE.Color(pal.fog),
    fogNear: day ? 900 : 650,
    fogFar: day ? 4200 : 3400,
    hemi: new THREE.Color(day ? '#dfeaff' : dusk ? '#8fa0d0' : pal.accent),
    ground: new THREE.Color(day ? '#6d6455' : '#15161a'),
    hemiIntensity: day ? 1.4 : dusk ? 0.8 : 0.42,
    sun: new THREE.Color(day ? '#fff6e6' : dusk ? '#ffb27a' : '#b9c8ff'),
    sunIntensity: day ? 2.6 : dusk ? 1.1 : 0.35,
    sunPos: dusk ? new THREE.Vector3(-600, 180, -300) : new THREE.Vector3(300, 600, 200),
    flood: day ? 0 : 500,
    city: new THREE.Color(day ? '#8c929c' : '#1a1d24'),
    cityGlow: day ? 0.05 : dusk ? 0.45 : 0.8,
    hills: new THREE.Color(day ? '#4d5a46' : '#0b0d10'),
    water: new THREE.Color(day ? '#2f5f7f' : '#05080e'),
    lights: day ? 0 : 1,
  };
}

/** Current look; environment components read it every frame. */
export const look: EnvLook = targetLook('night', 'istanbul-blue');

/** Moves the current look a fraction `k` (0..1) of the way to `target`. */
export function easeLook(target: EnvLook, k: number) {
  const cur = look as unknown as Record<string, number | THREE.Color | THREE.Vector3>;
  for (const [key, t] of Object.entries(target) as [string, number | THREE.Color | THREE.Vector3][]) {
    const c = cur[key];
    if (typeof t === 'number') cur[key] = (c as number) + (t - (c as number)) * k;
    else if (t instanceof THREE.Color) (c as THREE.Color).lerp(t, k);
    else (c as THREE.Vector3).lerp(t, k);
  }
}
