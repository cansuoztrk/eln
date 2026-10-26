/**
 * Decides, every frame, which lighting "look" the stadium shows and writes
 * it into the shared uniforms / runtime. Priority:
 *   1. Light Show Composer sequence preview (playing)
 *   2. Matchday atmosphere moments (goal, championship, kickoff…)
 *   3. The design's own light show (show.active)
 *   4. Architectural lighting derived from the design palette
 */
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView, type AtmosphereId } from '@/core/store/viewStore';
import type { DesignConfig, ShowLook, ShowPresetId } from '@/core/model/design';
import { SHOW_BY_ID, lookFromShow, speedToHz } from '@/core/model/lightshow';
import { lightUniforms, runtime, PROFILE_INDEX } from './runtime';
import { hexToRgb } from './stadium/seatPainter';

export function architecturalLook(d: DesignConfig): ShowLook {
  const mode = d.facade.lighting;
  return {
    primary: d.palette.primary,
    secondary: d.palette.secondary,
    ring: d.roof.light === 'none' ? 0 : d.roof.ring,
    speed: mode === 'static' ? 0 : mode === 'dynamic' ? 0.1 : 0.18,
    tribune: 0,
    led: d.screens.layout === 'standard' ? 'colors' : 'text',
    profile: mode === 'static' ? 'static' : mode === 'dynamic' ? 'breathe' : 'wave',
  };
}

interface AtmosphereSpec {
  floods: number;
  /** show preset during the first `introSeconds`, then `then` */
  intro?: ShowPresetId;
  introSeconds?: number;
  then?: ShowPresetId | 'arch';
  tifoSeconds?: number;
  led?: ShowLook['led'];
  lively: boolean;
}

export const ATMOSPHERE_SPECS: Record<AtmosphereId, AtmosphereSpec> = {
  silent: { floods: 0.22, lively: false, then: 'arch' },
  ambient: { floods: 0.6, lively: false, then: 'arch' },
  prematch: { floods: 0.85, lively: true, then: 'arch', led: 'match' },
  kickoff: { floods: 1, lively: true, intro: 'arrival', introSeconds: 9, then: 'arch', tifoSeconds: 9, led: 'match' },
  goal: { floods: 1, lively: true, intro: 'roar', introSeconds: 10, then: 'red-wave' },
  championship: { floods: 1, lively: true, then: 'championship', tifoSeconds: 12 },
};

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

function blendLook(a: ShowLook, b: ShowLook, t: number): ShowLook {
  if (t <= 0) return a;
  if (t >= 1) return b;
  tmpA.set(a.primary).lerp(tmpB.set(b.primary), t);
  const primary = `#${tmpA.getHexString()}`;
  tmpA.set(a.secondary).lerp(tmpB.set(b.secondary), t);
  const secondary = `#${tmpA.getHexString()}`;
  return {
    primary,
    secondary,
    ring: a.ring + (b.ring - a.ring) * t,
    speed: a.speed + (b.speed - a.speed) * t,
    tribune: a.tribune + (b.tribune - a.tribune) * t,
    led: t < 0.5 ? a.led : b.led,
    profile: t < 0.5 ? a.profile : b.profile,
  };
}

/** Evaluate the composer sequence at elapsed seconds. */
export function sequenceLook(d: DesignConfig, elapsed: number): { look: ShowLook; fade: number; done: boolean; progress: number; step: number } {
  const seq = d.show.sequence.length ? d.show.sequence : [{ id: 'x', preset: d.show.preset === 'custom' ? 'arrival' : d.show.preset, duration: 8 }];
  const total = seq.reduce((a, s) => a + s.duration, 0);
  const t = Math.min(elapsed, total);
  let acc = 0;
  let idx = 0;
  for (let i = 0; i < seq.length; i++) {
    if (t < acc + seq[i].duration || i === seq.length - 1) {
      idx = i;
      break;
    }
    acc += seq[i].duration;
  }
  const local = t - acc;
  const cur = SHOW_BY_ID[seq[idx].preset].look;
  const next = seq[idx + 1] ? SHOW_BY_ID[seq[idx + 1].preset].look : cur;
  const xf = Math.max(0, (local - (seq[idx].duration - 1.2)) / 1.2);
  const look = blendLook(cur, next, idx < seq.length - 1 ? xf : 0);
  let fade = 1;
  if (d.show.start === 'fade-in') fade = Math.min(1, elapsed / 2);
  else if (d.show.start === 'blackout-reveal') fade = elapsed < 1.2 ? 0.08 : Math.min(1, 0.08 + (elapsed - 1.2) / 1.5);
  const remaining = total - elapsed;
  if (d.show.end === 'fade-out' && remaining < 2) fade *= Math.max(0, remaining / 2);
  if (d.show.end === 'blackout' && remaining < 2) fade *= remaining < 0.6 ? 0.08 : Math.max(0.08, remaining / 2);
  const done = elapsed >= total && d.show.end !== 'hold';
  return { look, fade, done, progress: Math.min(1, elapsed / total), step: idx };
}

export function LightingDirector() {
  const design = useEffectiveDesign();
  const atmosphere = useView((s) => s.atmosphere);
  const reduced = useView((s) => s.reducedMotion);
  const atmoStart = useRef({ id: atmosphere, at: 0 });
  const lastTribuneKey = useRef('');
  const onStep = useView((s) => s.set);

  useFrame((_, dtRaw) => {
    const dt = Math.min(0.1, dtRaw);
    runtime.time += dt;
    const now = runtime.time;
    if (atmoStart.current.id !== atmosphere) atmoStart.current = { id: atmosphere, at: now };
    const atmoElapsed = now - atmoStart.current.at;
    const spec = ATMOSPHERE_SPECS[atmosphere];

    let look: ShowLook = architecturalLook(design);
    let fade = 1;
    if (design.show.active) look = lookFromShow(design.show);
    if (atmosphere !== 'silent' && atmosphere !== 'ambient') {
      const preset = spec.intro && atmoElapsed < (spec.introSeconds ?? 0) ? spec.intro : spec.then;
      if (preset && preset !== 'arch') look = SHOW_BY_ID[preset].look;
      if (spec.led && (!preset || preset === 'arch')) look = { ...look, led: spec.led };
    }
    if (runtime.show.playing) {
      const r = sequenceLook(design, now - runtime.show.startedAt);
      look = r.look;
      fade = r.fade;
      runtime.show.progress = r.progress;
      if (r.step !== runtime.show.stepIndex) {
        runtime.show.stepIndex = r.step;
        onStep({ announcement: `Gösteri adımı ${r.step + 1}` });
      }
      if (r.done) {
        runtime.show.playing = false;
        runtime.show.progress = 1;
        onStep({ announcement: 'Gösteri tamamlandı' });
      }
    }
    runtime.show.look = look;
    runtime.show.fade = fade;

    // colours & intensity (smoothed)
    const k = 1 - Math.exp(-dt * 3.5);
    lightUniforms.uColorA.value.lerp(tmpA.set(look.primary), k);
    lightUniforms.uColorB.value.lerp(tmpB.set(look.secondary), k);
    const targetI = (0.04 + look.ring * 1.0) * fade;
    lightUniforms.uIntensity.value += (targetI - lightUniforms.uIntensity.value) * k;
    lightUniforms.uProfile.value = PROFILE_INDEX[look.profile];
    lightUniforms.uHz.value = speedToHz(look.speed, reduced);
    lightUniforms.uTime.value = now;
    lightUniforms.uReveal.value = runtime.reveal;

    // floodlights
    const floodTarget = spec.floods;
    runtime.floods += (floodTarget - runtime.floods) * (1 - Math.exp(-dt * 1.5));
    runtime.lively = spec.lively && !reduced;
    const tifoTarget = spec.tifoSeconds && atmoElapsed < spec.tifoSeconds ? 1 : 0;
    runtime.tifo += (tifoTarget - runtime.tifo) * (1 - Math.exp(-dt * 2));
    if (Math.abs(runtime.tifo - tifoTarget) < 0.02) runtime.tifo = tifoTarget;

    // tribune light layer
    const tr = runtime.tribune;
    tr.active = look.tribune > 0.01;
    const hz = speedToHz(look.speed, reduced);
    const tKey = `${look.primary}${look.secondary}${look.tribune.toFixed(2)}${look.profile}${hz.toFixed(2)}${fade.toFixed(1)}`;
    if (tKey !== lastTribuneKey.current) {
      lastTribuneKey.current = tKey;
      tr.a = hexToRgb(look.primary);
      tr.b = hexToRgb(look.secondary);
      tr.coverage = look.tribune;
      tr.profile = PROFILE_INDEX[look.profile];
      tr.hz = hz;
      tr.level = fade * runtime.reveal;
      tr.version++;
    }

    // LED content
    runtime.led.mode = look.led;
    runtime.led.primary = look.primary;
    runtime.led.secondary = look.secondary;
    runtime.led.scroll = !reduced && (look.led === 'text' || look.led === 'match' || look.led === 'wave');
  }, -2);

  return null;
}
