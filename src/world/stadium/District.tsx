/**
 * The stadium city: surroundings, landscape, accessibility routes and
 * transit/entries. All placements are schematic concept placements.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView } from '@/core/store/viewStore';
import { MEETING_POINTS, ZONE_BY_ID } from '@/core/district';
import { LayerGroup, Selectable } from './LayerGroup';
import { GATES, PROFILE, bowlPoint, innerPoint } from './geometry';
import { pavingTexture } from '../textures';
import { labelTexture } from '../labels';
import { runtime } from '../runtime';

function std(params: THREE.MeshStandardMaterialParameters) {
  const m = new THREE.MeshStandardMaterial(params);
  m.userData.baseEmissive = m.emissive.clone();
  m.userData.baseEmissiveIntensity = m.emissiveIntensity;
  return m;
}

/* ---------------- paths (shared by transit / access layers) ---------------- */

function gatePos(id: string, extra = 14) {
  const g = GATES.find((x) => x.id === id)!;
  const p = bowlPoint(g.s, PROFILE.facadeD + extra, 0);
  return new THREE.Vector3(p.x, 0, p.z);
}

/** Flat ribbon along a polyline (on the ground). */
function ribbonGeometry(points: THREE.Vector3[], width: number, y = 0.08) {
  const pos: number[] = [];
  const idx: number[] = [];
  const uv: number[] = [];
  let acc = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dir = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
    const n = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2);
    if (i > 0) acc += p.distanceTo(points[i - 1]);
    pos.push(p.x + n.x, y, p.z + n.z, p.x - n.x, y, p.z - n.z);
    uv.push(acc / 10, 0, acc / 10, 1);
    if (i < points.length - 1) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function curve(...pts: [number, number][]) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  return c.getPoints(pts.length * 12);
}

const tr = ZONE_BY_ID.transitHub;
const dropoff = ZONE_BY_ID.dropoff;
const fan = ZONE_BY_ID.fanPlaza;

export const PATHS = {
  transitToE: () => curve([tr.x, tr.z + 12], [90, -150], [40, -125], [gatePos('E').x, gatePos('E').z]),
  transitToD: () => curve([tr.x - 10, tr.z + 10], [150, -100], [gatePos('D').x + 10, gatePos('D').z]),
  dropoffToF: () => curve([dropoff.x, dropoff.z + 10], [-70, -135], [gatePos('F').x, gatePos('F').z]),
  plazaToA: () => curve([fan.x, fan.z - 10], [0, 130], [gatePos('A').x, gatePos('A').z]),
  accessDropoffToG: () => curve([dropoff.x - 15, dropoff.z + 8], [-150, -110], [-158, -40], [gatePos('G').x, gatePos('G').z]),
  accessTransitToC: () => curve([tr.x + 5, tr.z + 12], [168, -110], [170, -30], [gatePos('C').x, gatePos('C').z]),
  accessPlazaToA: () => curve([fan.x + 30, fan.z - 6], [22, 132], [gatePos('A').x + 6, gatePos('A').z]),
};

/* ---------------- Ground & plaza ---------------- */

export function Ground() {
  const mat = useMemo(() => std({ color: '#15171b', roughness: 0.95 }), []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} material={mat} receiveShadow>
      <circleGeometry args={[1600, 64]} />
    </mesh>
  );
}

function Trees({ points, scale = 1 }: { points: [number, number][]; scale?: number }) {
  const crown = useRef<THREE.InstancedMesh>(null);
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crownMat = useMemo(() => std({ color: '#2f6b3a', roughness: 0.9, emissive: '#0d2a14', emissiveIntensity: 0.2 }), []);
  const trunkMat = useMemo(() => std({ color: '#4a3a2a', roughness: 1 }), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    points.forEach(([x, z], i) => {
      const s = scale * (0.8 + ((i * 37) % 10) / 20);
      m.compose(new THREE.Vector3(x, 5.2 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      crown.current?.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, 1.4 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      trunk.current?.setMatrixAt(i, m);
    });
    for (const r of [crown.current, trunk.current]) {
      if (!r) continue;
      r.count = points.length;
      r.instanceMatrix.needsUpdate = true;
      r.computeBoundingSphere();
    }
  }, [points, scale]);
  return (
    <group>
      <instancedMesh ref={crown} args={[undefined, undefined, Math.max(1, points.length)]} material={crownMat}>
        <icosahedronGeometry args={[3.4, 0]} />
      </instancedMesh>
      <instancedMesh ref={trunk} args={[undefined, undefined, Math.max(1, points.length)]} material={trunkMat}>
        <cylinderGeometry args={[0.3, 0.45, 2.8, 6]} />
      </instancedMesh>
    </group>
  );
}

function scatter(cx: number, cz: number, w: number, d: number, n: number, seed: number): [number, number][] {
  const out: [number, number][] = [];
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) out.push([cx + (r() - 0.5) * w, cz + (r() - 0.5) * d]);
  return out;
}

export function Landscape() {
  const design = useEffectiveDesign();
  const quality = useView((s) => s.quality);
  const on = design.green.landscape;
  const character = design.plaza.character;
  const lawn = useMemo(() => std({ color: '#244d2c', roughness: 1 }), []);
  const swale = useMemo(() => std({ color: '#1f5b5f', roughness: 0.3, metalness: 0.2, emissive: '#0a3a40', emissiveIntensity: 0.4 }), []);
  const canopy = useMemo(() => std({ color: '#e9e2d0', roughness: 0.6, side: THREE.DoubleSide, emissive: '#f2b631', emissiveIntensity: 0.05 }), []);
  const factor = quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : 1;
  const swales = useMemo(
    () => [
      ribbonGeometry(curve([-150, 160], [-110, 200], [-40, 214], [40, 214], [110, 200], [150, 160]), 5, 0.06),
      ribbonGeometry(curve([150, 60], [195, 0], [200, -90]), 4, 0.06),
    ],
    [],
  );

  const trees = useMemo(() => {
    const pts: [number, number][] = [];
    // avenue trees along the main plaza axis
    for (let i = 0; i < 9; i++) pts.push([-70 + i * 17.5, 205], [-70 + i * 17.5, 132]);
    if (on) {
      const park = ZONE_BY_ID.greenPark;
      pts.push(...scatter(park.x, park.z, park.w, park.d, Math.round(60 * factor), 11));
      pts.push(...scatter(-150, 30, 30, 120, Math.round(28 * factor), 5));
      if (character === 'park' || character === 'garden') pts.push(...scatter(fan.x, fan.z, fan.w * 0.9, fan.d * 0.8, Math.round(36 * factor), 23));
    }
    return pts;
  }, [on, character, factor]);

  return (
    <LayerGroup id="landscape">
      <Trees points={trees} />
      {on && (
        <Selectable id="greenPark">
          <mesh rotation-x={-Math.PI / 2} position={[ZONE_BY_ID.greenPark.x, 0.03, ZONE_BY_ID.greenPark.z]} material={lawn}>
            <planeGeometry args={[ZONE_BY_ID.greenPark.w, ZONE_BY_ID.greenPark.d]} />
          </mesh>
        </Selectable>
      )}
      {on && (character === 'park' || character === 'garden') && (
        <group>
          {[-1, 1].map((sd) => (
            <mesh key={sd} rotation-x={-Math.PI / 2} position={[fan.x + sd * 38, 0.04, fan.z]} material={lawn}>
              <planeGeometry args={[40, 46]} />
            </mesh>
          ))}
        </group>
      )}
      {character === 'garden' && on &&
        [-45, -15, 15, 45].map((x) => (
          <group key={x} position={[fan.x + x, 0, fan.z - 6]}>
            <mesh position={[0, 7, 0]} rotation-x={0.1} material={canopy}>
              <cylinderGeometry args={[9, 9, 0.3, 6]} />
            </mesh>
            <mesh position={[0, 3.5, 0]} material={canopy}>
              <cylinderGeometry args={[0.35, 0.5, 7, 8]} />
            </mesh>
          </group>
        ))}
      {design.green.rainwater && (
        <Selectable id="rainwater">
          {swales.map((g, i) => (
            <mesh key={i} geometry={g} material={swale} />
          ))}
          {[[-120, 150], [120, 150], [205, -100]].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 2, z]} material={swale}>
              <cylinderGeometry args={[4, 4, 4, 16]} />
            </mesh>
          ))}
        </Selectable>
      )}
    </LayerGroup>
  );
}

/* ---------------- Surroundings ---------------- */

function MeetingPin({ x, z, label }: { x: number; z: number; label: string }) {
  const tex = useMemo(() => labelTexture(label, { bg: '#f2b631', fg: '#111', w: 128, h: 64, font: 40 }), [label]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.quaternion.copy(camera.quaternion);
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 10, 8]} />
        <meshStandardMaterial color="#f2b631" emissive="#f2b631" emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={ref} position={[0, 11.5, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshBasicMaterial map={tex} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WasteStation({ x, z }: { x: number; z: number }) {
  const colors = ['#2e7dd1', '#f2b631', '#3fbf8a'];
  return (
    <group position={[x, 0, z]}>
      {colors.map((c, i) => (
        <mesh key={c} position={[(i - 1) * 1.4, 0.7, 0]}>
          <boxGeometry args={[1.1, 1.4, 1.1]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

export function Surroundings() {
  const design = useEffectiveDesign();
  const plazaMat = useMemo(() => {
    const t = pavingTexture('#3a3c42').clone();
    t.needsUpdate = true;
    t.repeat.set(16, 8);
    return std({ map: t, roughness: 0.85 });
  }, []);
  const pavilion = useMemo(() => std({ color: '#2a2d33', roughness: 0.5, emissive: '#ff8a3d', emissiveIntensity: 0.25 }), []);
  const glass = useMemo(() => std({ color: '#7fa3b8', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.55, emissive: '#ffd9a0', emissiveIntensity: 0.35 }), []);
  const gold = useMemo(() => std({ color: '#c9a04a', metalness: 0.9, roughness: 0.3 }), []);
  const stage = useMemo(() => std({ color: '#1d2027', roughness: 0.6 }), []);
  const lawn = useMemo(() => std({ color: '#2b5a33', roughness: 1 }), []);
  const totem = useMemo(() => std({ color: '#111', emissive: design.palette.primary, emissiveIntensity: 1.2 }), [design.palette.primary]);
  const pole = useMemo(() => std({ color: '#888', emissive: '#fff0d0', emissiveIntensity: 0.6 }), []);
  const social = ZONE_BY_ID.social;
  const museum = ZONE_BY_ID.museum;
  const lawnZone = ZONE_BY_ID.eventLawn;
  const event = design.plaza.character === 'event';

  return (
    <LayerGroup id="surroundings">
      {/* fan plaza & entry plaza paving */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 150]} material={plazaMat}>
        <planeGeometry args={[170, 100]} />
      </mesh>
      {design.district.fanZone && (
        <Selectable id="fanPlaza">
          {[-50, -17, 17, 50].map((x) => (
            <mesh key={x} position={[x, 4, fan.z - 22]} material={totem}>
              <boxGeometry args={[1.2, 8, 1.2]} />
            </mesh>
          ))}
          <group position={[0, 0, fan.z + 4]}>
            <mesh position={[0, 3.5, 0]} material={gold}>
              <boxGeometry args={[3, 7, 3]} />
            </mesh>
            <mesh position={[0, 7.4, 0]} material={totem}>
              <boxGeometry args={[3.4, 0.5, 3.4]} />
            </mesh>
          </group>
          {event && (
            <group position={[0, 0, fan.z + 24]}>
              <mesh position={[0, 1, 0]} material={stage}>
                <boxGeometry args={[36, 2, 12]} />
              </mesh>
              <mesh position={[0, 9, -4]} material={totem}>
                <boxGeometry args={[30, 12, 0.6]} />
              </mesh>
            </group>
          )}
        </Selectable>
      )}
      {[-75, -40, 40, 75].map((x) =>
        [118, 190].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 4, z]} material={pole}>
            <cylinderGeometry args={[0.15, 0.2, 8, 6]} />
          </mesh>
        )),
      )}
      {design.plaza.social === 'expanded' && (
        <Selectable id="social">
          <mesh rotation-x={-Math.PI / 2} position={[social.x, 0.02, social.z]} material={plazaMat}>
            <planeGeometry args={[social.w, social.d]} />
          </mesh>
          {[[-22, -18], [0, -18], [22, -18], [-22, 14], [22, 14]].map(([x, z]) => (
            <group key={`${x}${z}`} position={[social.x + x, 0, social.z + z]}>
              <mesh position={[0, 2.2, 0]} material={pavilion}>
                <boxGeometry args={[14, 4.4, 9]} />
              </mesh>
              <mesh position={[0, 4.8, 0]} material={glass}>
                <boxGeometry args={[16, 0.4, 11]} />
              </mesh>
            </group>
          ))}
        </Selectable>
      )}
      {design.district.museum && (
        <Selectable id="museum">
          <group position={[museum.x, 0, museum.z]} rotation-y={-0.5}>
            <mesh position={[0, 8, 0]} material={glass}>
              <boxGeometry args={[52, 16, 30]} />
            </mesh>
            {Array.from({ length: 18 }, (_, i) => (
              <mesh key={i} position={[-25 + i * 2.95, 8, 15.6]} material={gold}>
                <boxGeometry args={[0.5, 16, 1.2]} />
              </mesh>
            ))}
            <mesh position={[0, 16.4, 0]} material={gold}>
              <boxGeometry args={[56, 0.8, 34]} />
            </mesh>
          </group>
        </Selectable>
      )}
      {design.district.eventLawn && (
        <Selectable id="eventLawn">
          <mesh rotation-x={-Math.PI / 2} position={[lawnZone.x, 0.03, lawnZone.z]} material={lawn}>
            <planeGeometry args={[lawnZone.w, lawnZone.d]} />
          </mesh>
          <group position={[lawnZone.x - 26, 0, lawnZone.z]} rotation-y={Math.PI / 2}>
            <mesh position={[0, 1.2, 0]} material={stage}>
              <boxGeometry args={[30, 2.4, 14]} />
            </mesh>
            <mesh position={[0, 10, -6]} material={stage}>
              <boxGeometry args={[32, 0.8, 0.8]} />
            </mesh>
            {[-15, 15].map((x) => (
              <mesh key={x} position={[x, 5, -6]} material={stage}>
                <boxGeometry args={[0.8, 10, 0.8]} />
              </mesh>
            ))}
          </group>
        </Selectable>
      )}
      {design.district.meetingPoints && MEETING_POINTS.map((m) => <MeetingPin key={m.id} x={m.x} z={m.z} label={m.id} />)}
      {design.green.waste && (
        <Selectable id="waste">
          {[[30, 140], [-30, 140], [social.x, social.z + 32], [120, -120], [-120, 60]].map(([x, z]) => (
            <WasteStation key={`${x}${z}`} x={x} z={z} />
          ))}
        </Selectable>
      )}
    </LayerGroup>
  );
}

/* ---------------- Accessibility ---------------- */

export function AccessRoutes() {
  const design = useEffectiveDesign();
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#4ea3ff', toneMapped: false, transparent: true, opacity: 0.9 }), []);
  const geos = useMemo(() => [PATHS.accessDropoffToG(), PATHS.accessTransitToC(), PATHS.accessPlazaToA()].map((p) => ribbonGeometry(p, 3.2, 0.12)), []);
  useFrame(() => {
    mat.opacity = 0.65 + 0.25 * Math.sin(runtime.time * 2);
  });
  const platforms = useMemo(() => [0.03, 0.22, 0.47, 0.72].map((s) => bowlPoint(s, PROFILE.crossAisle[0] + 1.6, PROFILE.midSlabY + 0.3)), []);
  const service = useMemo(() => [0.1, 0.35, 0.6, 0.85].map((s) => bowlPoint(s, PROFILE.facadeD + 9, 1.3)), []);
  return (
    <LayerGroup id="access">
      {design.access.routes && (
        <Selectable id="accessRoutes">
          {geos.map((g, i) => (
            <mesh key={i} geometry={g} material={mat} />
          ))}
          {platforms.map((p, i) => (
            <mesh key={i} position={[p.x, p.y, p.z]}>
              <boxGeometry args={[8, 0.25, 2.6]} />
              <meshBasicMaterial color="#4ea3ff" toneMapped={false} />
            </mesh>
          ))}
        </Selectable>
      )}
      {design.access.servicePoints &&
        service.map((p, i) => (
          <group key={i} position={[p.x, 0, p.z]}>
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 6, 12]} />
              <meshStandardMaterial color="#4ea3ff" emissive="#4ea3ff" emissiveIntensity={0.9} />
            </mesh>
          </group>
        ))}
    </LayerGroup>
  );
}

/* ---------------- Transit & entries ---------------- */

function GatePortal({ id, s, main }: { id: string; s: number; main?: boolean }) {
  const f = innerPoint(s);
  const p = bowlPoint(s, PROFILE.facadeD + 3.6, 0);
  const tex = useMemo(() => labelTexture(id, { bg: '#c8102e', fg: '#ffffff', w: 128, h: 128 }), [id]);
  const w = main ? 20 : 11;
  return (
    <group position={[p.x, 0, p.z]} rotation-y={Math.atan2(f.nx, f.nz)}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(sd * w) / 2, 4, 0]}>
          <boxGeometry args={[0.8, 8, 1]} />
          <meshStandardMaterial color="#202329" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 8.2, 0]}>
        <boxGeometry args={[w + 0.8, 0.8, 1.2]} />
        <meshStandardMaterial color="#202329" emissive="#c8102e" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 10.3, 0.65]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {main && (
        <mesh position={[0, 9, 7]}>
          <boxGeometry args={[w + 8, 0.5, 14]} />
          <meshStandardMaterial color="#d8d4ca" emissive="#ffe0b0" emissiveIntensity={0.15} />
        </mesh>
      )}
    </group>
  );
}

export function Transit() {
  const design = useEffectiveDesign();
  const pathMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#b9c2cf', toneMapped: false, transparent: true, opacity: 0.35 }), []);
  const linkMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#3fbf8a', toneMapped: false, transparent: true, opacity: 0.9 }), []);
  const station = useMemo(() => std({ color: '#d8dde5', roughness: 0.4, metalness: 0.2, emissive: '#5b9bd5', emissiveIntensity: 0.25 }), []);
  const lot = useMemo(() => std({ color: '#202227', roughness: 0.95 }), []);
  const paths = useMemo(() => [PATHS.transitToE(), PATHS.transitToD(), PATHS.dropoffToF(), PATHS.plazaToA()].map((p) => ribbonGeometry(p, 6, 0.07)), []);
  const links = useMemo(() => [PATHS.transitToE(), PATHS.transitToD()].map((p) => ribbonGeometry(p, 2.4, 0.1)), []);
  const park = ZONE_BY_ID.parking;
  return (
    <LayerGroup id="transit">
      <Selectable id="gates">
        {GATES.map((g) => (
          <GatePortal key={g.id} id={g.id} s={g.s} main={g.main} />
        ))}
      </Selectable>
      {paths.map((g, i) => (
        <mesh key={i} geometry={g} material={pathMat} />
      ))}
      {design.green.transitLink && links.map((g, i) => <mesh key={i} geometry={g} material={linkMat} />)}
      <mesh rotation-x={-Math.PI / 2} position={[park.x, 0.02, park.z]} material={lot}>
        <planeGeometry args={[park.w, park.d]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[dropoff.x, 0.02, dropoff.z]} material={lot}>
        <planeGeometry args={[dropoff.w, dropoff.d]} />
      </mesh>
      {design.district.transitHub && (
        <Selectable id="transitHub">
          <group position={[tr.x, 0, tr.z]}>
            <mesh position={[0, 4, 0]} material={station}>
              <boxGeometry args={[tr.w, 8, tr.d]} />
            </mesh>
            <mesh position={[0, 8.6, 0]}>
              <boxGeometry args={[tr.w + 6, 0.6, tr.d + 6]} />
              <meshStandardMaterial color="#5b9bd5" emissive="#5b9bd5" emissiveIntensity={0.7} />
            </mesh>
          </group>
        </Selectable>
      )}
    </LayerGroup>
  );
}
