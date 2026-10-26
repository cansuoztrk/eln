/**
 * Seat Experience geometry: blocks, eye positions and approximate
 * sightline metrics derived from the concept profile (NOT real seating data).
 */
import { INNER, PITCH, PROFILE, innerPoint, lowerRowD, lowerRowY, upperRowD, upperRowY } from '@/world/stadium/geometry';
import type { CameraPose } from '@/world/worldApi';

export type Tier = 'lower' | 'upper';
export const BLOCKS_PER_TIER = 24;

export interface SeatPick {
  tier: Tier;
  block: number; // 0..BLOCKS_PER_TIER-1
  row: number; // 0..1 (front..back)
}

export const sideOf = (s: number): 'Güney' | 'Doğu' | 'Kuzey' | 'Batı' => {
  const x = ((s % 1) + 1) % 1;
  if (x < 0.125 || x >= 0.875) return 'Güney';
  if (x < 0.375) return 'Doğu';
  if (x < 0.625) return 'Kuzey';
  return 'Batı';
};

export function blockCenterS(block: number) {
  return (block + 0.5) / BLOCKS_PER_TIER;
}

export function blockName(p: SeatPick) {
  const s = blockCenterS(p.block);
  return `${p.tier === 'lower' ? 'Alt' : 'Üst'} ${sideOf(s)} · Blok ${p.tier === 'lower' ? 'L' : 'U'}${String(p.block + 1).padStart(2, '0')}`;
}

export function seatGeometry(p: SeatPick) {
  const rows = p.tier === 'lower' ? PROFILE.lowerRows : PROFILE.upperRows;
  const i = Math.max(0, Math.min(rows - 1, Math.round(p.row * (rows - 1))));
  const rowD = p.tier === 'lower' ? lowerRowD : upperRowD;
  const rowY = p.tier === 'lower' ? lowerRowY : upperRowY;
  const tread = p.tier === 'lower' ? PROFILE.lowerTread : PROFILE.upperTread;
  const s = blockCenterS(p.block);
  const f = innerPoint(s);
  const d = rowD(i) + 0.4;
  const eyeY = rowY(i) + 1.15;
  const x = f.x + f.nx * d;
  const z = f.z + f.nz * d;
  return { s, row: i + 1, rows, d, eyeY, x, z, riser: rowY(i + 1) - rowY(i), tread, nx: f.nx, nz: f.nz };
}

export type LookTarget = 'center' | 'goalW' | 'goalE';
export const LOOK_LABEL: Record<LookTarget, string> = { center: 'Orta nokta', goalW: 'Batı kalesi', goalE: 'Doğu kalesi' };

export function seatPose(p: SeatPick, look: LookTarget): CameraPose {
  const g = seatGeometry(p);
  const target: [number, number, number] = look === 'center' ? [0, 0.8, 0] : look === 'goalW' ? [-PITCH.length / 2, 1.2, 0] : [PITCH.length / 2, 1.2, 0];
  return { pos: [g.x, g.eyeY, g.z], target, fov: 50 };
}

export function seatMetrics(p: SeatPick) {
  const g = seatGeometry(p);
  const toCenter = Math.hypot(g.x, g.z, g.eyeY);
  const toGoalW = Math.hypot(g.x + PITCH.length / 2, g.z, g.eyeY - 1.2);
  const toGoalE = Math.hypot(g.x - PITCH.length / 2, g.z, g.eyeY - 1.2);
  const horizCenter = Math.hypot(g.x, g.z);
  const depression = (Math.atan2(g.eyeY, horizCenter) * 180) / Math.PI;
  // horizontal distance from the eye to the nearest touch/goal line (point of focus)
  const side = sideOf(g.s);
  const lineGap = side === 'Doğu' || side === 'Batı' ? INNER.hw - PITCH.length / 2 : INNER.hd - PITCH.width / 2;
  const D = g.d + lineGap;
  const R = g.eyeY;
  const cValue = (D * (g.riser + R)) / (D + g.tread) - R;
  const covered = g.d >= PROFILE.roofInnerD;
  return {
    toCenter,
    toNearestGoal: Math.min(toGoalW, toGoalE),
    eyeHeight: g.eyeY,
    depression,
    cValueMm: cValue * 1000,
    covered,
    row: g.row,
    rows: g.rows,
  };
}
