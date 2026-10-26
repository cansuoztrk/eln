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
import { NIGHT_COLORS } from '@/core/model/labels';
import { QUALITY_SETTINGS } from '@/core/quality';
import { windowsTexture } from '../textures';

const ENV_COLORS = {
  dusk: { sky: '#1a2a4f', horizon: '#d9825b', fog: '#3b3348' },
  day: { sky: '#6fa3d9', horizon: '#cfe0ef', fog: '#a9bccd' },
};

function useEnvPalette() {
  const env = useView((s) => s.env);
  const night = useEffectiveDesign().palette.night;
  return env === 'night' ? NIGHT_COLORS[night] : { ...ENV_COLORS[env], accent: '#ffffff' };
}

function Sky() {
  const pal = useEnvPalette();
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
  mat.uniforms.uTop.value.set(pal.sky);
  mat.uniforms.uHorizon.value.set(pal.horizon);
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[4200, 32, 16]} />
    </mesh>
  );
}

function FogSync() {
  const pal = useEnvPalette();
  const env = useView((s) => s.env);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(pal.fog, env === 'day' ? 900 : 650, env === 'day' ? 4200 : 3400);
    scene.background = new THREE.Color(pal.sky);
  }, [scene, pal.fog, pal.sky, env]);
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
  const env = useView((s) => s.env);
  const count = QUALITY_SETTINGS[quality].cityCount;
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => {
    const t = windowsTexture();
    return new THREE.MeshStandardMaterial({ color: '#1a1d24', emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.8, roughness: 0.85 });
  }, []);
  useFrame(() => {
    mat.emissiveIntensity = env === 'day' ? 0.05 : env === 'dusk' ? 0.45 : 0.8;
    mat.color.set(env === 'day' ? '#8c929c' : '#1a1d24');
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
  const env = useView((s) => s.env);
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
      <mesh geometry={geo}>
        <meshStandardMaterial color={env === 'day' ? '#4d5a46' : '#0b0d10'} roughness={1} />
      </mesh>
      {env !== 'day' && (
        <points geometry={lights}>
          <pointsMaterial size={2.4} sizeAttenuation color="#ffcf8a" transparent opacity={0.8} toneMapped={false} />
        </points>
      )}
    </group>
  );
}

function Strait() {
  const env = useView((s) => s.env);
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
  const lit = env !== 'day';
  return (
    <group position={[2300, 0, 300]} rotation-y={Math.PI / 2.2}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.5, 0]}>
        <planeGeometry args={[5200, 520]} />
        <meshStandardMaterial color={env === 'day' ? '#2f5f7f' : '#05080e'} metalness={0.6} roughness={0.15} />
      </mesh>
      {[-550, 550].map((x) => (
        <mesh key={x} position={[x, 85, 0]}>
          <boxGeometry args={[10, 170, 14]} />
          <meshStandardMaterial color="#2a2f38" emissive={lit ? '#7aa2ff' : '#000'} emissiveIntensity={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 64, 0]}>
        <boxGeometry args={[1800, 4, 26]} />
        <meshStandardMaterial color="#20242c" emissive={lit ? '#ffcf8a' : '#000'} emissiveIntensity={0.35} />
      </mesh>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  );
}

export function SceneLights() {
  const env = useView((s) => s.env);
  const pal = useEnvPalette();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    if (hemi.current) {
      hemi.current.color.set(env === 'day' ? '#dfeaff' : env === 'dusk' ? '#8fa0d0' : pal.accent);
      hemi.current.groundColor.set(env === 'day' ? '#6d6455' : '#15161a');
      hemi.current.intensity = env === 'day' ? 1.4 : env === 'dusk' ? 0.8 : 0.42;
    }
    if (sun.current) {
      sun.current.color.set(env === 'day' ? '#fff6e6' : env === 'dusk' ? '#ffb27a' : '#b9c8ff');
      sun.current.intensity = env === 'day' ? 2.6 : env === 'dusk' ? 1.1 : 0.35;
    }
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#8fa0d0', '#15161a', 0.5]} />
      <directionalLight ref={sun} position={env === 'dusk' ? [-600, 180, -300] : [300, 600, 200]} intensity={0.4} />
      {/* soft fill that represents the bowl being lit by its own floodlights */}
      <pointLight position={[0, 70, 0]} intensity={env === 'day' ? 0 : 9000} distance={260} decay={1.6} color="#fff1dc" />
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

export function Environment() {
  const env = useView((s) => s.env);
  const reduced = useView((s) => s.reducedMotion);
  return (
    <group>
      <FogSync />
      <Reflections />
      <Sky />
      {env !== 'day' && <Stars radius={3000} depth={600} count={2500} factor={18} saturation={0} fade speed={reduced ? 0 : 0.3} />}
      <City />
      <Hills />
      <Strait />
    </group>
  );
}
