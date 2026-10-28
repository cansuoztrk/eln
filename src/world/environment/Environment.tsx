/**
 * Istanbul-inspired surroundings: night sky, distant towers, hills with
 * city lights, a strait with a suspension-bridge silhouette. Abstract and
 * procedural — not a geographic reconstruction.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment as EnvironmentMap, Lightformer, Stars } from '@react-three/drei';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView } from '@/core/store/viewStore';
import { QUALITY_SETTINGS } from '@/core/quality';
import { windowsTexture } from '../textures';
import { easeLook, envPalette, look, targetLook } from './look';

function useEnvPalette() {
  const env = useView((s) => s.env);
  const night = useEffectiveDesign().palette.night;
  return envPalette(env, night);
}

/**
 * Eases the time-of-day look toward the selected environment (about 1.5 s);
 * instant on the first frame, with reduced motion and during image captures.
 */
function EnvDirector() {
  const env = useView((s) => s.env);
  const night = useEffectiveDesign().palette.night;
  const target = useMemo(() => targetLook(env, night), [env, night]);
  const first = useRef(true);
  useFrame((_, dt) => {
    const v = useView.getState();
    const k = first.current || v.reducedMotion || v.capturing ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 2.6);
    first.current = false;
    easeLook(target, k);
  });
  return null;
}

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() } },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uHorizon; varying vec3 vP;
          void main(){ float h = clamp(vP.y * 1.6 + 0.05, 0.0, 1.0); vec3 c = mix(uHorizon, uTop, pow(h, 0.7)); gl_FragColor = vec4(c,1.0);
          #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uTop.value.copy(look.sky);
    mat.uniforms.uHorizon.value.copy(look.horizon);
  });
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[4200, 32, 16]} />
    </mesh>
  );
}

function FogSync() {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(look.fog.clone(), look.fogNear, look.fogFar);
    scene.background = look.sky.clone();
  }, [scene]);
  useFrame(() => {
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.color.copy(look.fog);
      fog.near = look.fogNear;
      fog.far = look.fogFar;
    }
    if (scene.background instanceof THREE.Color) scene.background.copy(look.sky);
  });
  return null;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function City() {
  const quality = useView((s) => s.quality);
  const count = QUALITY_SETTINGS[quality].cityCount;
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => {
    const t = windowsTexture();
    return new THREE.MeshStandardMaterial({ color: '#1a1d24', emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.8, roughness: 0.85 });
  }, []);
  useFrame(() => {
    mat.emissiveIntensity = look.cityGlow;
    mat.color.copy(look.city);
  });
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const r = seeded(99);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let i = 0;
    // a cluster of business towers to the north-east (abstract "Maslak-like" skyline)
    const tower = Math.floor(count * 0.18);
    for (; i < tower; i++) {
      const a = 0.55 + r() * 0.6;
      const dist = 900 + r() * 600;
      const h = 60 + r() * 170;
      const w = 18 + r() * 22;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI);
      m.compose(new THREE.Vector3(Math.cos(a) * dist, h / 2, -Math.sin(a) * dist), q, new THREE.Vector3(w, h, w * (0.6 + r() * 0.6)));
      mesh.setMatrixAt(i, m);
    }
    for (; i < count; i++) {
      const a = r() * Math.PI * 2;
      const dist = 560 + Math.pow(r(), 0.7) * 1300;
      const h = 9 + r() * 32;
      const w = 14 + r() * 30;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI);
      m.compose(new THREE.Vector3(Math.cos(a) * dist, h / 2, Math.sin(a) * dist), q, new THREE.Vector3(w, h, w * (0.5 + r())));
      mesh.setMatrixAt(i, m);
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 700]} material={mat} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function Hills() {
  const ground = useMemo(() => new THREE.MeshStandardMaterial({ color: look.hills.clone(), roughness: 1 }), []);
  const glowMat = useMemo(() => new THREE.PointsMaterial({ size: 2.4, sizeAttenuation: true, color: '#ffcf8a', transparent: true, opacity: 0.8, toneMapped: false }), []);
  const glow = useRef<THREE.Points>(null);
  useFrame(() => {
    ground.color.copy(look.hills);
    glowMat.opacity = 0.8 * look.lights;
    if (glow.current) glow.current.visible = look.lights > 0.02;
  });
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(1500, 3600, 96, 6);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const r = seeded(5);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x, z);
      const a = Math.atan2(z, x);
      const h = (Math.sin(a * 5) * 0.5 + 0.5) * 90 + Math.sin(a * 13 + 1.3) * 35 + r() * 12;
      pos.setY(i, Math.max(0, h * Math.min(1, (d - 1500) / 900)));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const lights = useMemo(() => {
    const r = seeded(17);
    const pts: number[] = [];
    for (let i = 0; i < 5000; i++) {
      const a = r() * Math.PI * 2;
      const d = 900 + r() * 2600;
      pts.push(Math.cos(a) * d, 2 + r() * 50 * Math.min(1, Math.max(0, (d - 1500) / 900)), Math.sin(a) * d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} material={ground} />
      <points ref={glow} geometry={lights} material={glowMat} />
    </group>
  );
}

function Strait() {
  const water = useMemo(() => new THREE.MeshStandardMaterial({ color: look.water.clone(), metalness: 0.6, roughness: 0.15 }), []);
  const towerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2f38', emissive: '#7aa2ff', emissiveIntensity: 0.4 }), []);
  const deckMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#20242c', emissive: '#ffcf8a', emissiveIntensity: 0.35 }), []);
  useFrame(() => {
    water.color.copy(look.water);
    towerMat.emissiveIntensity = 0.4 * look.lights;
    deckMat.emissiveIntensity = 0.35 * look.lights;
  });
  const cables = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const span = 1100;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = -span / 2 + t * span;
      const y = 165 - 120 * (1 - Math.pow(2 * t - 1, 2));
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#a8c4ff' }), []);
  const lines = useMemo(() => [-11, 11].map((z) => {
    const l = new THREE.Line(cables, lineMat);
    l.position.z = z;
    return l;
  }), [cables, lineMat]);
  return (
    <group position={[2300, 0, 300]} rotation-y={Math.PI / 2.2}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.5, 0]} material={water}>
        <planeGeometry args={[5200, 520]} />
      </mesh>
      {[-550, 550].map((x) => (
        <mesh key={x} position={[x, 85, 0]} material={towerMat}>
          <boxGeometry args={[10, 170, 14]} />
        </mesh>
      ))}
      <mesh position={[0, 64, 0]} material={deckMat}>
        <boxGeometry args={[1800, 4, 26]} />
      </mesh>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  );
}

export function SceneLights() {
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const flood = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (hemi.current) {
      hemi.current.color.copy(look.hemi);
      hemi.current.groundColor.copy(look.ground);
      hemi.current.intensity = look.hemiIntensity;
    }
    if (sun.current) {
      sun.current.color.copy(look.sun);
      sun.current.intensity = look.sunIntensity;
      sun.current.position.copy(look.sunPos);
    }
    if (flood.current) flood.current.intensity = look.flood;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#8fa0d0', '#15161a', 0.5]} />
      <directionalLight ref={sun} position={[300, 600, 200]} intensity={0.4} />
      {/* soft fill that represents the bowl being lit by its own floodlights */}
      <pointLight ref={flood} position={[0, 70, 0]} intensity={9000} distance={260} decay={1.6} color="#fff1dc" />
      <ambientLight intensity={0.08} />
    </>
  );
}

/**
 * Image-based lighting rendered once from a few in-scene light panels
 * (no HDR download): gives metal and glass materials something to reflect.
 */
function Reflections() {
  const env = useView((s) => s.env);
  const pal = useEnvPalette();
  const primary = useEffectiveDesign().palette.primary;
  const day = env === 'day';
  return (
    <EnvironmentMap key={`${env}-${pal.horizon}-${primary}`} frames={1} resolution={128} environmentIntensity={day ? 1 : env === 'dusk' ? 0.7 : 0.55}>
      <color attach="background" args={[day ? '#9fb7cf' : pal.sky]} />
      {/* sky dome glow */}
      <Lightformer form="rect" intensity={day ? 2.2 : 0.5} color={day ? '#ffffff' : pal.horizon} position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
      {/* horizon city glow ring */}
      <Lightformer form="ring" intensity={day ? 0.6 : 1.6} color={day ? '#e8eef5' : '#ffcf8a'} position={[0, 1, 0]} rotation-x={Math.PI / 2} scale={18} />
      {/* stadium floodlight bounce */}
      <Lightformer form="rect" intensity={day ? 0.4 : 1.4} color="#fff1dc" position={[0, 6, -10]} scale={[16, 4, 1]} />
      <Lightformer form="rect" intensity={day ? 0.3 : 0.9} color={primary} position={[10, 3, 6]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={day ? 0.3 : 0.8} color="#f2b631" position={[-10, 3, 6]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
    </EnvironmentMap>
  );
}

function StarLayer() {
  const reduced = useView((s) => s.reducedMotion);
  const ref = useRef<THREE.Group>(null);
  // additive stars vanish against a brightening sky anyway; hide them halfway through the transition
  useFrame(() => {
    if (ref.current) ref.current.visible = look.lights > 0.5;
  });
  return (
    <group ref={ref}>
      <Stars radius={3000} depth={600} count={2500} factor={18} saturation={0} fade speed={reduced ? 0 : 0.3} />
    </group>
  );
}

export function Environment() {
  return (
    <group>
      <EnvDirector />
      <FogSync />
      <Reflections />
      <Sky />
      <StarLayer />
      <City />
      <Hills />
      <Strait />
    </group>
  );
}
