/**
 * Procedural geometry for the concept stadium.
 *
 * The bowl is described by an inner rounded rectangle (the edge of the
 * playing area) and a cross-section profile in (d, y) space, where d is the
 * horizontal distance outwards from that inner edge. Any point of the
 * building is P(s, d) = inner(s) + d * normal(s), so every layer shares one
 * coordinate system and offsets are exact.
 *
 * Proportions follow published reference figures (105 × 68 m pitch, an
 * overall footprint of roughly 228 × 190 m) but this is NOT a survey model.
 */
import * as THREE from 'three';

export const PITCH = { length: 105, width: 68 };
/** Inner rounded rectangle half sizes and corner radius (m). */
export const INNER = { hw: 60, hd: 42, r: 12 };

export const PROFILE = {
  lowerStart: 1.6,
  lowerRows: 24,
  lowerTread: 0.85,
  lowerBaseY: 1.3,
  midSlabY: 13.6,
  groundSlabY: 6.6,
  crossAisle: [22.2, 26.5] as const,
  upperStart: 27,
  upperRows: 26,
  upperTread: 0.82,
  upperBaseY: 18.2,
  backD: 50,
  facadeD: 54,
  facadeTop: 44,
  roofInnerD: 6,
  roofOuterD: 57,
  roofInnerY: 40.5,
  roofOuterY: 45.5,
  roofThickness: 1.4,
};

export function lowerRowY(i: number) {
  return PROFILE.lowerBaseY + i * 0.4 + i * i * 0.0035;
}
export function lowerRowD(i: number) {
  return PROFILE.lowerStart + i * PROFILE.lowerTread;
}
export function upperRowY(i: number) {
  return PROFILE.upperBaseY + i * 0.56 + i * i * 0.0042;
}
export function upperRowD(i: number) {
  return PROFILE.upperStart + i * PROFILE.upperTread;
}
export const LOWER_TOP_Y = lowerRowY(PROFILE.lowerRows);
export const UPPER_TOP_Y = upperRowY(PROFILE.upperRows);

export function roofY(d: number) {
  const t = (d - PROFILE.roofInnerD) / (PROFILE.roofOuterD - PROFILE.roofInnerD);
  return PROFILE.roofInnerY + (PROFILE.roofOuterY - PROFILE.roofInnerY) * Math.pow(Math.max(0, Math.min(1, t)), 0.8);
}

/* ---------------- rounded rectangle parameterisation ---------------- */

const SIDE_X = INNER.hw - INNER.r; // half length of straight part along x
const SIDE_Z = INNER.hd - INNER.r;
const ARC = (Math.PI / 2) * INNER.r;
/** Segment lengths of the inner curve, starting at +z side centre and going counter-clockwise when seen from above (towards +x). */
const SEGMENTS = [
  { kind: 'line', len: SIDE_X }, // +z side, from x=0 to x=SIDE_X
  { kind: 'arc', len: ARC, cx: SIDE_X, cz: SIDE_Z, a0: Math.PI / 2 }, // corner (+x,+z)
  { kind: 'line', len: 2 * SIDE_Z }, // +x side
  { kind: 'arc', len: ARC, cx: SIDE_X, cz: -SIDE_Z, a0: 0 },
  { kind: 'line', len: 2 * SIDE_X }, // -z side
  { kind: 'arc', len: ARC, cx: -SIDE_X, cz: -SIDE_Z, a0: -Math.PI / 2 },
  { kind: 'line', len: 2 * SIDE_Z }, // -x side
  { kind: 'arc', len: ARC, cx: -SIDE_X, cz: SIDE_Z, a0: Math.PI },
  { kind: 'line', len: SIDE_X }, // back to +z centre
] as const;
export const INNER_PERIMETER = SEGMENTS.reduce((a, s) => a + s.len, 0);

export interface FramePoint {
  x: number;
  z: number;
  nx: number;
  nz: number;
}

/**
 * Point on the inner curve at perimeter fraction s ∈ [0,1).
 * s = 0 is the centre of the +z (south, main) side; s grows towards +x.
 */
export function innerPoint(s: number): FramePoint {
  let L = (((s % 1) + 1) % 1) * INNER_PERIMETER;
  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i];
    if (L <= seg.len || i === SEGMENTS.length - 1) {
      const f = Math.min(L, seg.len);
      switch (i) {
        case 0:
          return { x: f, z: INNER.hd, nx: 0, nz: 1 };
        case 2:
          return { x: INNER.hw, z: SIDE_Z - f, nx: 1, nz: 0 };
        case 4:
          return { x: SIDE_X - f, z: -INNER.hd, nx: 0, nz: -1 };
        case 6:
          return { x: -INNER.hw, z: -SIDE_Z + f, nx: -1, nz: 0 };
        case 8:
          return { x: -SIDE_X + f, z: INNER.hd, nx: 0, nz: 1 };
        default: {
          const arc = seg as { cx: number; cz: number; a0: number };
          const a = arc.a0 - f / INNER.r;
          const nx = Math.cos(a);
          const nz = Math.sin(a);
          return { x: arc.cx + nx * INNER.r, z: arc.cz + nz * INNER.r, nx, nz };
        }
      }
    }
    L -= seg.len;
  }
  return { x: 0, z: INNER.hd, nx: 0, nz: 1 };
}

/** World position at perimeter fraction s, offset d and height y. */
export function bowlPoint(s: number, d: number, y: number, out = new THREE.Vector3()) {
  const p = innerPoint(s);
  return out.set(p.x + p.nx * d, y, p.z + p.nz * d);
}

/** Sampling of s used by all ring geometries (dense in corners, sparse on straights). */
export function ringSamples(straightSteps = 10, cornerSteps = 14): number[] {
  const out: number[] = [];
  let acc = 0;
  SEGMENTS.forEach((seg, i) => {
    const steps = seg.kind === 'arc' ? cornerSteps : Math.max(1, Math.round((straightSteps * seg.len) / (2 * SIDE_X)));
    for (let k = 0; k < steps; k++) out.push((acc + (seg.len * k) / steps) / INNER_PERIMETER);
    acc += seg.len;
    if (i === SEGMENTS.length - 1) out.push(1);
  });
  return out;
}

/** Perimeter length at offset d (exact for an offset rounded rectangle). */
export function perimeterAt(d: number) {
  return INNER_PERIMETER + 2 * Math.PI * d;
}

/* ---------------- builders ---------------- */

export interface ProfilePoint {
  d: number;
  y: number;
}

/**
 * Sweep an open polyline profile (d,y) around the bowl.
 * uv.x = s (0..1 around), uv.y = cumulative profile length (normalised).
 * uv1 = (s, profile param) — same values, separate channel for maps.
 */
export function sweepProfile(
  profile: ProfilePoint[],
  opts: { samples?: number[]; skip?: (s: number, segIndex: number) => boolean; tile?: number } = {},
): THREE.BufferGeometry {
  const samples = opts.samples ?? ringSamples();
  const lens = [0];
  for (let i = 1; i < profile.length; i++) lens.push(lens[i - 1] + Math.hypot(profile[i].d - profile[i - 1].d, profile[i].y - profile[i - 1].y));
  const total = lens[lens.length - 1] || 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const uv1: number[] = [];
  const indices: number[] = [];
  const v = new THREE.Vector3();
  const P = profile.length;
  for (let a = 0; a < samples.length; a++) {
    const s = samples[a];
    for (let i = 0; i < P; i++) {
      bowlPoint(s, profile[i].d, profile[i].y, v);
      positions.push(v.x, v.y, v.z);
      const arc = s * perimeterAt(profile[i].d);
      uvs.push(opts.tile ? arc / opts.tile : s, lens[i] / total);
      uv1.push(s, lens[i] / total);
    }
  }
  for (let a = 0; a < samples.length - 1; a++) {
    const sMid = (samples[a] + samples[a + 1]) / 2;
    for (let i = 0; i < P - 1; i++) {
      if (opts.skip?.(sMid, i)) continue;
      const i0 = a * P + i;
      const i1 = (a + 1) * P + i;
      indices.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv1, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Stepped tier profile: tread + riser per row, plus a seat-back strip. */
export function tierProfile(rows: number, rowD: (i: number) => number, rowY: (i: number) => number, tread: number): ProfilePoint[] {
  const pts: ProfilePoint[] = [];
  for (let i = 0; i < rows; i++) {
    const d0 = rowD(i);
    const y0 = rowY(i);
    const y1 = rowY(i + 1);
    pts.push({ d: d0, y: y0 });
    pts.push({ d: d0 + tread * 0.55, y: y0 });
    // seat back / chair band
    pts.push({ d: d0 + tread * 0.62, y: y0 + 0.42 });
    pts.push({ d: d0 + tread * 0.72, y: y0 + 0.42 });
    pts.push({ d: d0 + tread * 0.78, y: y0 });
    pts.push({ d: d0 + tread, y: y0 });
    pts.push({ d: d0 + tread, y: y1 });
  }
  return pts;
}

/** Flat annulus between two offsets at height y (or sloped via yFn). */
export function ringBand(d0: number, d1: number, y0: number, y1 = y0, samples?: number[]) {
  return sweepProfile(
    [
      { d: d0, y: y0 },
      { d: d1, y: y1 },
    ],
    { samples },
  );
}

/** Vertical wall band at offset d from y0 to y1. */
export function ringWall(d: number, y0: number, y1: number, opts: { samples?: number[]; skip?: (s: number) => boolean; tile?: number } = {}) {
  return sweepProfile(
    [
      { d, y: y0 },
      { d, y: y1 },
    ],
    { samples: opts.samples, skip: opts.skip ? (s) => opts.skip!(s) : undefined, tile: opts.tile },
  );
}

/** Tunnel / gate angular helpers */
export const TUNNEL_S = 0.5; // centre of -z (north) side
export const TUNNEL_HALF_WIDTH = 4.5; // m
export function sDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
}
/** Is s inside the player tunnel opening (measured on the inner curve)? */
export function inTunnel(s: number) {
  return sDistance(s, TUNNEL_S) * INNER_PERIMETER < TUNNEL_HALF_WIDTH;
}

/** Gates (entrances) around the facade, as perimeter fractions. */
export const GATES: { id: string; s: number; main?: boolean }[] = [
  { id: 'A', s: 0, main: true },
  { id: 'B', s: 0.115 },
  { id: 'C', s: 0.25 },
  { id: 'D', s: 0.385 },
  { id: 'E', s: 0.5 },
  { id: 'F', s: 0.615 },
  { id: 'G', s: 0.75 },
  { id: 'H', s: 0.885 },
];
export const GATE_HALF_WIDTH = 6; // m along facade

export const GATE_BREAKS = GATES.flatMap((g) => {
  const hw = (g.main ? GATE_HALF_WIDTH * 1.8 : GATE_HALF_WIDTH) / perimeterAt(PROFILE.facadeD);
  return [g.s - hw, g.s + hw];
});

export function gateAt(s: number): string | null {
  const per = perimeterAt(PROFILE.facadeD);
  for (const g of GATES) if (sDistance(s, g.s) * per < (g.main ? GATE_HALF_WIDTH * 1.8 : GATE_HALF_WIDTH)) return g.id;
  return null;
}

/** Merge extra break points into a sample list so openings get exact edges. */
export function withBreaks(base: number[], breaks: number[]): number[] {
  const all = [...base, ...breaks.map((b) => ((b % 1) + 1) % 1)];
  return [...new Set(all.map((x) => Math.round(x * 1e6) / 1e6))].sort((a, b) => a - b);
}

export const TUNNEL_BREAKS = [TUNNEL_S - TUNNEL_HALF_WIDTH / INNER_PERIMETER, TUNNEL_S + TUNNEL_HALF_WIDTH / INNER_PERIMETER];

/** Vomitory openings in the cross-aisle band (mid level). */
export function vomitoryAt(s: number) {
  const n = 16;
  const f = (s * n) % 1;
  return f > 0.44 && f < 0.56;
}
export const VOM_BREAKS = Array.from({ length: 16 }, (_, k) => [(k + 0.44) / 16, (k + 0.56) / 16]).flat();

/** Section cap polygons for the architectural section (d,y space). */
export function sectionPolygons(): { id: string; label: string; pts: ProfilePoint[] }[] {
  const lower: ProfilePoint[] = [{ d: PROFILE.lowerStart, y: 0 }];
  for (let i = 0; i <= PROFILE.lowerRows; i++) {
    lower.push({ d: lowerRowD(i), y: lowerRowY(i) + 0.15 });
    if (i < PROFILE.lowerRows) lower.push({ d: lowerRowD(i) + PROFILE.lowerTread, y: lowerRowY(i) + 0.15 });
  }
  lower.push({ d: PROFILE.crossAisle[0], y: LOWER_TOP_Y + 0.15 });
  lower.push({ d: PROFILE.crossAisle[0], y: 0 });

  const upper: ProfilePoint[] = [];
  for (let i = 0; i <= PROFILE.upperRows; i++) {
    upper.push({ d: upperRowD(i), y: upperRowY(i) });
    if (i < PROFILE.upperRows) upper.push({ d: upperRowD(i) + PROFILE.upperTread, y: upperRowY(i) });
  }
  upper.push({ d: PROFILE.backD, y: UPPER_TOP_Y });
  upper.push({ d: PROFILE.backD, y: UPPER_TOP_Y - 2.2 });
  upper.push({ d: PROFILE.upperStart + 2, y: PROFILE.upperBaseY - 1.6 });
  upper.push({ d: PROFILE.upperStart, y: PROFILE.upperBaseY - 1.2 });

  const midSlab: ProfilePoint[] = [
    { d: PROFILE.crossAisle[0], y: PROFILE.midSlabY - 0.5 },
    { d: PROFILE.backD, y: PROFILE.midSlabY - 0.5 },
    { d: PROFILE.backD, y: PROFILE.midSlabY },
    { d: PROFILE.crossAisle[0], y: PROFILE.midSlabY },
  ];
  const groundSlab: ProfilePoint[] = [
    { d: PROFILE.crossAisle[0], y: PROFILE.groundSlabY - 0.4 },
    { d: PROFILE.backD, y: PROFILE.groundSlabY - 0.4 },
    { d: PROFILE.backD, y: PROFILE.groundSlabY },
    { d: PROFILE.crossAisle[0], y: PROFILE.groundSlabY },
  ];
  const roof: ProfilePoint[] = [];
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const d = PROFILE.roofInnerD + ((PROFILE.roofOuterD - PROFILE.roofInnerD) * i) / N;
    roof.push({ d, y: roofY(d) + PROFILE.roofThickness });
  }
  for (let i = N; i >= 0; i--) {
    const d = PROFILE.roofInnerD + ((PROFILE.roofOuterD - PROFILE.roofInnerD) * i) / N;
    roof.push({ d, y: roofY(d) });
  }
  const facade: ProfilePoint[] = [
    { d: PROFILE.facadeD - 0.6, y: 0 },
    { d: PROFILE.facadeD + 0.6, y: 0 },
    { d: PROFILE.facadeD + 2.2, y: PROFILE.facadeTop },
    { d: PROFILE.facadeD + 1.0, y: PROFILE.facadeTop },
  ];
  return [
    { id: 'lowerTier', label: 'Alt tribün', pts: lower },
    { id: 'upperTier', label: 'Üst tribün', pts: upper },
    { id: 'concourse', label: 'Orta kat döşemesi', pts: midSlab },
    { id: 'concourse2', label: 'Zemin üstü döşeme', pts: groundSlab },
    { id: 'roof', label: 'Çatı', pts: roof },
    { id: 'facade', label: 'Cephe', pts: facade },
  ];
}

/** Seat position helpers for the Seat Experience (eye height above tread). */
export function seatEye(tier: 'lower' | 'upper', s: number, rowFrac: number) {
  const rows = tier === 'lower' ? PROFILE.lowerRows : PROFILE.upperRows;
  const i = Math.max(0, Math.min(rows - 1, Math.round(rowFrac * (rows - 1))));
  const d = (tier === 'lower' ? lowerRowD(i) : upperRowD(i)) + 0.4;
  const y = (tier === 'lower' ? lowerRowY(i) : upperRowY(i)) + 1.15;
  return { pos: bowlPoint(s, d, y), row: i + 1, d, y };
}
