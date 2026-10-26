import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEffectiveDesign } from '@/core/store/effective';
import { useView } from '@/core/store/viewStore';
import { useClipping } from './clipping';
import { LayerGroup, Selectable } from './LayerGroup';
import { PROFILE, bowlPoint, innerPoint, ringWall, sweepProfile, upperRowY } from './geometry';
import { createLedTexture, paintLed, paintScreen } from './ledPainter';
import { runtime } from '../runtime';

export interface LedTextures {
  ctx: CanvasRenderingContext2D;
  all: THREE.Texture[];
  ribbon: THREE.Texture;
  boards: THREE.Texture;
  media: THREE.Texture;
  facade: THREE.Texture;
}

/** One LED canvas shared (through texture clones) by ribbons, boards and media surfaces. */
export function useLedTextures(): LedTextures {
  const led = useMemo(() => {
    const base = createLedTexture();
    const clone = (rx: number) => {
      const t = base.tex.clone();
      t.repeat.set(rx, 1);
      t.needsUpdate = true;
      return t;
    };
    const ribbon = clone(5);
    const boards = clone(-3);
    const media = clone(-2);
    const facade = clone(1);
    return { ctx: base.ctx, all: [base.tex, ribbon, boards, media, facade], ribbon, boards, media, facade };
  }, []);
  const last = useMemo(() => ({ key: '' }), []);
  useFrame((_, dt) => {
    const l = runtime.led;
    const key = `${l.mode}|${l.primary}|${l.secondary}`;
    if (key !== last.key) {
      last.key = key;
      paintLed(led.ctx, l.mode, l.primary, l.secondary);
      for (const t of led.all) t.needsUpdate = true;
    }
    const speed = l.scroll ? 0.01 : 0;
    for (const t of [led.ribbon, led.boards, led.media]) t.offset.x = (t.offset.x + dt * speed) % 1;
  });
  return led;
}

function EndScreen({ s, w, h, d, y, material }: { s: number; w: number; h: number; d: number; y: number; material: THREE.Material }) {
  const f = innerPoint(s);
  const p = bowlPoint(s, d, y);
  const rot = Math.atan2(f.nx, f.nz) + Math.PI;
  return (
    <group position={[p.x, p.y, p.z]} rotation-y={rot}>
      <mesh material={material}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[0, 0, -0.35]}>
        <boxGeometry args={[w + 0.8, h + 0.8, 0.6]} />
        <meshStandardMaterial color="#121418" roughness={0.6} />
      </mesh>
    </group>
  );
}

function useBasic(map: THREE.Texture, side: THREE.Side = THREE.DoubleSide) {
  const clipping = useClipping();
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map, toneMapped: false, side }), [map, side]);
  useEffect(() => () => m.dispose(), [m]);
  m.clippingPlanes = clipping;
  return m;
}

export function Screens({ led }: { led: LedTextures }) {
  const design = useEffectiveDesign();
  const layout = design.screens.layout;
  const quality = useView((s) => s.quality);

  // ring faces point outwards: boards face the stands (front), the ribbon faces the pitch (back)
  const ribbonMat = useBasic(led.ribbon, THREE.BackSide);
  const boardMat = useBasic(led.boards, THREE.FrontSide);
  const boardBack = useMemo(() => new THREE.MeshStandardMaterial({ color: '#15171c', side: THREE.BackSide, roughness: 0.8 }), []);
  const mediaMat = useBasic(led.media);

  const screen = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { ctx: c.getContext('2d')!, tex };
  }, []);
  const screenMat = useBasic(screen.tex);
  useEffect(() => {
    paintScreen(screen.ctx, design.palette.primary, design.palette.secondary, 'KONSEPT GÖRSELLEŞTİRME');
    screen.tex.needsUpdate = true;
  }, [screen, design.palette.primary, design.palette.secondary]);

  const geo = useMemo(
    () => ({
      ribbon: ringWall(PROFILE.upperStart - 0.05, PROFILE.upperBaseY - 1.15, PROFILE.upperBaseY - 0.05),
      boards: ringWall(-4, 0, 0.95),
      media: sweepProfile(
        [
          { d: PROFILE.facadeD + 2.6, y: 22 },
          { d: PROFILE.facadeD + 3.4, y: 38 },
        ],
        { skip: (s) => !(s < 0.09 || s > 0.91 || Math.abs(s - 0.5) < 0.09) },
      ),
    }),
    [],
  );
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const big = layout === 'extended' || layout === 'media-facade';
  const screenY = upperRowY(PROFILE.upperRows) + 4.2;
  const screenD = PROFILE.backD - 2;
  return (
    <LayerGroup id="screens">
      <Selectable id="perimeterBoards">
        <mesh geometry={geo.boards} material={boardMat} />
        <mesh geometry={geo.boards} material={boardBack} />
      </Selectable>
      {layout !== 'standard' && (
        <Selectable id="ledRibbon">
          <mesh geometry={geo.ribbon} material={ribbonMat} />
        </Selectable>
      )}
      <Selectable id="endScreens">
        <EndScreen s={0.25} w={big ? 34 : 24} h={big ? 10 : 7} d={screenD} y={screenY} material={screenMat} />
        <EndScreen s={0.75} w={big ? 34 : 24} h={big ? 10 : 7} d={screenD} y={screenY} material={screenMat} />
        {big && quality !== 'low' &&
          [0.125, 0.375, 0.625, 0.875].map((s) => <EndScreen key={s} s={s} w={14} h={6} d={screenD - 2} y={screenY - 1} material={screenMat} />)}
      </Selectable>
      {layout === 'media-facade' && (
        <Selectable id="mediaFacade">
          <mesh geometry={geo.media} material={mediaMat} />
        </Selectable>
      )}
    </LayerGroup>
  );
}
