import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView } from '@/core/store/viewStore';
import {
  PROFILE,
  TUNNEL_BREAKS,
  UPPER_TOP_Y,
  inTunnel,
  ringSamples,
  withBreaks,
  lowerRowD,
  lowerRowY,
  ringWall,
  sweepProfile,
  tierProfile,
  upperRowD,
  upperRowY,
} from './geometry';
import { SEAT_TEX_H, SEAT_TEX_W, hexToRgb, paintSeats } from './seatPainter';
import { runtime } from '../runtime';
import { useClipping } from './clipping';
import { LayerGroup } from './LayerGroup';

const TUNNEL_ROWS = 9;
const ROW_POINTS = 7;

function useSeatTextures(tier: 'lower' | 'upper') {
  return useMemo(() => {
    const base = document.createElement('canvas');
    base.width = SEAT_TEX_W;
    base.height = SEAT_TEX_H;
    const glow = document.createElement('canvas');
    glow.width = SEAT_TEX_W;
    glow.height = SEAT_TEX_H;
    const map = new THREE.CanvasTexture(base);
    map.colorSpace = THREE.SRGBColorSpace;
    map.channel = 1;
    map.wrapS = THREE.RepeatWrapping;
    const emissive = new THREE.CanvasTexture(glow);
    emissive.colorSpace = THREE.SRGBColorSpace;
    emissive.channel = 1;
    emissive.wrapS = THREE.RepeatWrapping;
    const bctx = base.getContext('2d')!;
    const gctx = glow.getContext('2d')!;
    return {
      tier,
      map,
      emissive,
      bctx,
      gctx,
      img: bctx.createImageData(SEAT_TEX_W, SEAT_TEX_H),
      gimg: gctx.createImageData(SEAT_TEX_W, SEAT_TEX_H),
    };
  }, [tier]);
}

function Tier({ tier }: { tier: 'lower' | 'upper' }) {
  const design = useEffectiveDesign();
  const occupancy = useView((s) => s.occupancy);
  const clipping = useClipping();
  const tex = useSeatTextures(tier);
  const last = useRef({ t: -1, version: -1, key: '' });

  const geometry = useMemo(() => {
    if (tier === 'lower') {
      const prof = tierProfile(PROFILE.lowerRows, lowerRowD, lowerRowY, PROFILE.lowerTread);
      return sweepProfile(prof, { samples: withBreaks(ringSamples(), TUNNEL_BREAKS), skip: (s, seg) => inTunnel(s) && seg < TUNNEL_ROWS * ROW_POINTS });
    }
    return sweepProfile(tierProfile(PROFILE.upperRows, upperRowD, upperRowY, PROFILE.upperTread));
  }, [tier]);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: tex.map,
      emissiveMap: tex.emissive,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 2.4,
      roughness: 0.78,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    m.userData.baseEmissive = m.emissive.clone();
    m.userData.baseEmissiveIntensity = 2.4;
    return m;
  }, [tex]);
  material.clippingPlanes = clipping;

  const key = `${design.seats.choreography}|${design.palette.primary}|${design.palette.secondary}|${occupancy.toFixed(2)}`;

  useFrame(() => {
    const tr = runtime.tribune;
    const animated = (tr.active && tr.coverage > 0 && tr.hz > 0) || runtime.lively;
    const fps = tr.active && tr.coverage > 0 ? 8 : 3;
    const due = animated && runtime.time - last.current.t > 1 / fps;
    if (!due && last.current.version === tr.version && last.current.key === key + runtime.tifo.toFixed(2)) return;
    last.current = { t: runtime.time, version: tr.version, key: key + runtime.tifo.toFixed(2) };
    paintSeats(tex.img, tex.gimg, {
      tier,
      choreography: design.seats.choreography,
      primary: hexToRgb(design.palette.primary),
      secondary: hexToRgb(design.palette.secondary),
      occupancy,
      tifo: runtime.tifo,
      time: runtime.time,
      show: tr.active ? { a: tr.a, b: tr.b, coverage: tr.coverage, profile: tr.profile, hz: tr.hz, level: tr.level } : null,
    });
    tex.bctx.putImageData(tex.img, 0, 0);
    tex.gctx.putImageData(tex.gimg, 0, 0);
    tex.map.needsUpdate = true;
    tex.emissive.needsUpdate = true;
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  const concrete = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5d5f63', roughness: 0.9, side: THREE.DoubleSide }), []);
  concrete.clippingPlanes = clipping;

  const walls = useMemo(() => {
    if (tier === 'lower') {
      return [ringWall(PROFILE.lowerStart, 0, PROFILE.lowerBaseY, { samples: withBreaks(ringSamples(), TUNNEL_BREAKS), skip: inTunnel })];
    }
    const soffit = sweepProfile([
      { d: PROFILE.upperStart, y: PROFILE.upperBaseY - 1.2 },
      { d: PROFILE.upperStart + 2, y: PROFILE.upperBaseY - 1.6 },
      { d: PROFILE.backD, y: UPPER_TOP_Y - 2.2 },
    ]);
    const parapet = ringWall(PROFILE.backD, UPPER_TOP_Y - 2.2, UPPER_TOP_Y + 1.1);
    const front = ringWall(PROFILE.upperStart, PROFILE.upperBaseY - 1.2, PROFILE.upperBaseY);
    return [soffit, parapet, front];
  }, [tier]);

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      {walls.map((g, i) => (
        <mesh key={i} geometry={g} material={concrete} />
      ))}
    </group>
  );
}

/** Railings on the front of the cross aisle (thin emissive-free band). */
function CrossAisleRail() {
  const clipping = useClipping();
  const g = useMemo(() => ringWall(PROFILE.crossAisle[0] + 0.1, PROFILE.midSlabY, PROFILE.midSlabY + 1.0), []);
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9aa3ad', metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.35, side: THREE.DoubleSide }), []);
  m.clippingPlanes = clipping;
  return <mesh geometry={g} material={m} />;
}

export function LowerTier() {
  return (
    <LayerGroup id="lowerTier">
      <Tier tier="lower" />
      <CrossAisleRail />
    </LayerGroup>
  );
}

export function UpperTier() {
  return (
    <LayerGroup id="upperTier">
      <Tier tier="upper" />
    </LayerGroup>
  );
}
