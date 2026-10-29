/**
 * Emissive "light ribbon" material shared by the roof rings, crown and
 * facade washes. Animation is computed in the shader from shared uniforms
 * (see runtime.lightUniforms) so a single light show drives every element.
 * Output is HDR (> 1) so the bloom pass can pick it up.
 */
import * as THREE from 'three';
import { lightUniforms } from '../runtime';

const vertex = /* glsl */ `
  #include <common>
  #include <clipping_planes_pars_vertex>
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;

const fragment = /* glsl */ `
  #include <common>
  #include <clipping_planes_pars_fragment>
  uniform float uTime;
  uniform float uHz;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;
  uniform float uFacadeIntensity;
  uniform float uChannel;    // 0 = roof light, 1 = facade light
  uniform int uProfile;
  uniform float uMinLevel;
  uniform float uReveal;
  uniform float uSegments;
  uniform float uGain;
  uniform float uVertical;   // 1 = fade towards the top (facade wash)
  uniform float uSegmentGap; // 1 = segmented rhythm with gaps
  uniform float uOffset;     // phase offset per element
  uniform int uProfileOverride; // -1 = follow the global look
  uniform sampler2D uMediaMap;
  uniform float uMediaMix;
  uniform vec2 uMediaRepeat;
  uniform vec2 uMediaOffset;
  varying vec2 vUv;
  varying vec3 vWorld;

  float hash11(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

  void main() {
    #include <clipping_planes_fragment>
    float x = fract(vUv.x + uOffset);
    float t = uTime * uHz;
    float m = 0.0;
    float level = 1.0;
    int prof = uProfileOverride >= 0 ? uProfileOverride : uProfile;
    if (prof == 0) {
      m = smoothstep(0.42, 0.5, fract(x * uSegments)) * smoothstep(0.58, 0.5, fract(x * uSegments)) * 0.6;
    } else if (prof == 1) {
      level = mix(uMinLevel, 1.0, 0.5 + 0.5 * sin(6.28318 * t));
      m = 0.5 + 0.5 * sin(6.28318 * (x * 2.0));
      m *= 0.35;
    } else if (prof == 2) {
      float f = fract(x * 2.0 - t * 0.5);
      m = smoothstep(0.0, 0.22, f) * (1.0 - smoothstep(0.32, 0.6, f));
      level = mix(0.65, 1.0, m);
    } else if (prof == 3) {
      m = 0.5 + 0.5 * sin(6.28318 * (x * 3.0 - t * 0.5));
      level = mix(0.6, 1.0, m);
    } else if (prof == 4) {
      float cell = floor(x * 220.0);
      float ph = hash11(cell) * 6.28318;
      float tw = 0.5 + 0.5 * sin(6.28318 * t * (0.5 + 0.5 * hash11(cell + 7.0)) + ph);
      m = tw * tw;
      level = mix(0.55, 1.0, m);
    } else {
      float f = fract(x + t * 0.125);
      m = smoothstep(0.47, 0.53, f) * (1.0 - smoothstep(0.97, 1.0, f));
    }
    if (uSegmentGap > 0.5) {
      float seg = fract(x * uSegments);
      level *= smoothstep(0.08, 0.14, seg) * (1.0 - smoothstep(0.86, 0.92, seg));
    }
    float vert = 1.0;
    if (uVertical > 0.5) vert = mix(1.0, 0.18, smoothstep(0.0, 1.0, vUv.y));
    float intensity = uChannel > 0.5 ? uFacadeIntensity : uIntensity;
    vec3 col = mix(uColorA, uColorB, clamp(m, 0.0, 1.0)) * level * intensity * uGain * uReveal * vert;
    if (uMediaMix > 0.0) {
      vec3 media = texture2D(uMediaMap, vUv * uMediaRepeat + uMediaOffset).rgb;
      col = mix(col, media * 2.2 * intensity * uReveal, uMediaMix);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface LightMaterialOptions {
  gain?: number;
  vertical?: boolean;
  segmentGap?: boolean;
  offset?: number;
  side?: THREE.Side;
  /** fixed profile index, ignoring the global look */
  profile?: number;
  /** which intensity the element follows: the roof ring (default) or the facade light */
  channel?: 'roof' | 'facade';
  media?: THREE.Texture;
  mediaRepeat?: [number, number];
}

export function createLightMaterial(opts: LightMaterialOptions = {}) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      ...lightUniforms,
      uGain: { value: opts.gain ?? 1 },
      uVertical: { value: opts.vertical ? 1 : 0 },
      uSegmentGap: { value: opts.segmentGap ? 1 : 0 },
      uOffset: { value: opts.offset ?? 0 },
      uChannel: { value: opts.channel === 'facade' ? 1 : 0 },
      uProfileOverride: { value: opts.profile ?? -1 },
      uMediaMap: { value: opts.media ?? null },
      uMediaMix: { value: 0 },
      uMediaRepeat: { value: new THREE.Vector2(...(opts.mediaRepeat ?? [1, 1])) },
      uMediaOffset: { value: new THREE.Vector2(0, 0) },
    },
    side: opts.side ?? THREE.DoubleSide,
    toneMapped: false,
    clipping: true,
  });
  return mat;
}
