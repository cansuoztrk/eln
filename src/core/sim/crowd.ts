/**
 * Conceptual crowd-flow simulation (Crowd Flow Simulator).
 *
 * Agents move on a schematic network (sources → outer ring → gates →
 * concourse → stands) with a simple speed–density relation and gate
 * service rates. It is a visual explanation tool. It is NOT an evacuation
 * or safety calculation and must not be used for real operational decisions.
 */
import { ZONE_BY_ID } from '../district';
import { GATES, INNER, PROFILE, bowlPoint } from '@/world/stadium/geometry';

export type SourceId = 'metro' | 'bus' | 'parking' | 'plaza';
export type StandId = 'S-L' | 'S-U' | 'E-L' | 'E-U' | 'N-L' | 'N-U' | 'W-L' | 'W-U';
export type RouteStrategy = 'shortest' | 'balanced' | 'adaptive';
export type Scenario = 'arrival' | 'exit';

export const SOURCES: { id: SourceId; name: string; x: number; z: number }[] = [
  { id: 'metro', name: 'Metro bağlantısı (şematik)', x: ZONE_BY_ID.transitHub.x, z: ZONE_BY_ID.transitHub.z + 16 },
  { id: 'bus', name: 'Servis / indirme', x: ZONE_BY_ID.dropoff.x, z: ZONE_BY_ID.dropoff.z + 14 },
  { id: 'parking', name: 'Otopark', x: ZONE_BY_ID.parking.x, z: ZONE_BY_ID.parking.z + 26 },
  { id: 'plaza', name: 'Taraftar meydanı', x: ZONE_BY_ID.fanPlaza.x, z: ZONE_BY_ID.fanPlaza.z },
];

const SECTOR_S: Record<string, number> = { S: 0, E: 0.25, N: 0.5, W: 0.75 };
export const STANDS: { id: StandId; name: string }[] = [
  { id: 'S-L', name: 'Güney alt' },
  { id: 'S-U', name: 'Güney üst' },
  { id: 'E-L', name: 'Doğu alt' },
  { id: 'E-U', name: 'Doğu üst' },
  { id: 'N-L', name: 'Kuzey alt' },
  { id: 'N-U', name: 'Kuzey üst' },
  { id: 'W-L', name: 'Batı alt' },
  { id: 'W-U', name: 'Batı üst' },
];

export interface CrowdSettings {
  scenario: Scenario;
  strategy: RouteStrategy;
  openGates: string[];
  stands: StandId[];
  sources: Record<SourceId, number>;
  agents: number;
  gateRate: number; // agents per simulated second per gate
  speed: number; // time multiplier
}

export const DEFAULT_CROWD: CrowdSettings = {
  scenario: 'arrival',
  strategy: 'shortest',
  openGates: GATES.map((g) => g.id),
  stands: STANDS.map((s) => s.id),
  sources: { metro: 0.45, bus: 0.15, parking: 0.2, plaza: 0.2 },
  agents: 1400,
  gateRate: 2.2,
  speed: 6,
};

interface Node {
  x: number;
  z: number;
  kind: 'source' | 'ring' | 'gate' | 'concourse' | 'stand';
  ref?: string;
}

export interface Agent {
  x: number;
  z: number;
  path: number[];
  seg: number;
  speed: number;
  state: 'waiting' | 'walking' | 'queue' | 'done';
  spawnAt: number;
  gate: string;
  queueAt: number;
}

export const GRID = { size: 640, cells: 80 };

export class CrowdSim {
  nodes: Node[] = [];
  adj: { to: number; w: number }[][] = [];
  agents: Agent[] = [];
  settings: CrowdSettings = { ...DEFAULT_CROWD };
  time = 0;
  running = false;
  density = new Float32Array(GRID.cells * GRID.cells);
  heat = new Float32Array(GRID.cells * GRID.cells);
  gateQueue: Record<string, number> = {};
  gateServed: Record<string, number> = {};
  gateNextFree: Record<string, number> = {};
  peak = { value: 0, x: 0, z: 0 };
  finishedAt: number | null = null;
  version = 0;
  private sourceIdx: Record<string, number> = {};
  private gateIdx: Record<string, number> = {};
  private standIdx: Record<string, number> = {};
  private pathCache = new Map<string, { path: number[]; len: number }>();

  constructor() {
    this.buildGraph();
  }

  private addNode(n: Node) {
    this.nodes.push(n);
    this.adj.push([]);
    return this.nodes.length - 1;
  }
  private link(a: number, b: number) {
    const w = Math.hypot(this.nodes[a].x - this.nodes[b].x, this.nodes[a].z - this.nodes[b].z);
    this.adj[a].push({ to: b, w });
    this.adj[b].push({ to: a, w });
  }

  private buildGraph() {
    const RING = 24;
    const ring: number[] = [];
    for (let i = 0; i < RING; i++) {
      const p = bowlPoint(i / RING, PROFILE.facadeD + 34, 0);
      ring.push(this.addNode({ x: p.x, z: p.z, kind: 'ring' }));
    }
    for (let i = 0; i < RING; i++) this.link(ring[i], ring[(i + 1) % RING]);
    const CON = 32;
    const con: number[] = [];
    for (let i = 0; i < CON; i++) {
      const p = bowlPoint(i / CON, 36, 0);
      con.push(this.addNode({ x: p.x, z: p.z, kind: 'concourse' }));
    }
    for (let i = 0; i < CON; i++) this.link(con[i], con[(i + 1) % CON]);
    for (const g of GATES) {
      const p = bowlPoint(g.s, PROFILE.facadeD + 4, 0);
      const gi = this.addNode({ x: p.x, z: p.z, kind: 'gate', ref: g.id });
      this.gateIdx[g.id] = gi;
      const r = Math.round(g.s * RING) % RING;
      this.link(gi, ring[r]);
      this.link(gi, ring[(r + 1) % RING]);
      this.link(gi, ring[(r + RING - 1) % RING]);
      const c = Math.round(g.s * CON) % CON;
      this.link(gi, con[c]);
    }
    for (const s of STANDS) {
      const [side, tier] = s.id.split('-');
      const ss = SECTOR_S[side];
      const p = bowlPoint(ss, tier === 'L' ? 12 : 40, 0);
      const si = this.addNode({ x: p.x, z: p.z, kind: 'stand', ref: s.id });
      this.standIdx[s.id] = si;
      for (const off of [-1, 0, 1]) this.link(si, con[(Math.round(ss * CON) + off + CON) % CON]);
    }
    for (const src of SOURCES) {
      const si = this.addNode({ x: src.x, z: src.z, kind: 'source', ref: src.id });
      this.sourceIdx[src.id] = si;
      // connect to the two nearest ring nodes
      const near = ring
        .map((r) => ({ r, d: Math.hypot(this.nodes[r].x - src.x, this.nodes[r].z - src.z) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const n of near) this.link(si, n.r);
    }
  }

  /** Dijkstra restricted by allowed node kinds and closed gates. */
  private shortest(from: number, to: number, allowGate: string | null): { path: number[]; len: number } {
    const key = `${from}>${to}>${allowGate}`;
    const hit = this.pathCache.get(key);
    if (hit) return hit;
    const N = this.nodes.length;
    const dist = new Float64Array(N).fill(Infinity);
    const prev = new Int32Array(N).fill(-1);
    const done = new Uint8Array(N);
    dist[from] = 0;
    for (;;) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < N; i++) if (!done[i] && dist[i] < best) (best = dist[i]), (u = i);
      if (u < 0 || u === to) break;
      done[u] = 1;
      for (const e of this.adj[u]) {
        const n = this.nodes[e.to];
        if (n.kind === 'gate' && n.ref !== allowGate) continue;
        if (n.kind === 'stand' && e.to !== to) continue;
        if (n.kind === 'source' && e.to !== to) continue;
        const nd = dist[u] + e.w;
        if (nd < dist[e.to]) {
          dist[e.to] = nd;
          prev[e.to] = u;
        }
      }
    }
    const path: number[] = [];
    if (dist[to] < Infinity) for (let v = to; v !== -1; v = prev[v]) path.unshift(v);
    const res = { path, len: dist[to] };
    this.pathCache.set(key, res);
    return res;
  }

  private routeVia(src: number, dst: number, gate: string) {
    return this.shortest(src, dst, gate);
  }

  reset(settings?: Partial<CrowdSettings>) {
    if (settings) this.settings = { ...this.settings, ...settings };
    this.pathCache.clear();
    const st = this.settings;
    this.time = 0;
    this.finishedAt = null;
    this.agents = [];
    this.heat.fill(0);
    this.density.fill(0);
    this.peak = { value: 0, x: 0, z: 0 };
    this.gateQueue = {};
    this.gateServed = {};
    this.gateNextFree = {};
    for (const g of GATES) {
      this.gateQueue[g.id] = 0;
      this.gateServed[g.id] = 0;
      this.gateNextFree[g.id] = 0;
    }
    const gates = st.openGates.length ? st.openGates : [];
    const stands = st.stands.length ? st.stands : [];
    if (!gates.length || !stands.length) {
      this.version++;
      return;
    }
    const srcIds = (Object.keys(st.sources) as SourceId[]).filter((k) => st.sources[k] > 0);
    const totalW = srcIds.reduce((a, k) => a + st.sources[k], 0) || 1;
    let seed = 12345;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const load: Record<string, number> = Object.fromEntries(gates.map((g) => [g, 0]));
    const spawnWindow = 240; // simulated seconds
    for (let i = 0; i < st.agents; i++) {
      // pick source by weight
      let r = rnd() * totalW;
      let src: SourceId = srcIds[0];
      for (const k of srcIds) {
        r -= st.sources[k];
        if (r <= 0) {
          src = k;
          break;
        }
      }
      const stand = stands[Math.floor(rnd() * stands.length)];
      const a = this.sourceIdx[src];
      const b = this.standIdx[stand];
      const from = st.scenario === 'arrival' ? a : b;
      const to = st.scenario === 'arrival' ? b : a;
      // choose gate
      let bestGate = gates[0];
      let bestCost = Infinity;
      let bestPath: number[] = [];
      for (const g of gates) {
        const route = this.routeVia(from, to, g);
        if (!route.path.length) continue;
        let cost = route.len;
        if (st.strategy === 'balanced') cost += load[g] * 0.9;
        if (st.strategy === 'adaptive') cost += load[g] * 0.45 + (load[g] / Math.max(0.5, st.gateRate)) * 1.4;
        if (cost < bestCost) {
          bestCost = cost;
          bestGate = g;
          bestPath = route.path;
        }
      }
      if (!bestPath.length) continue;
      load[bestGate]++;
      const start = this.nodes[bestPath[0]];
      const jitter = 6;
      this.agents.push({
        x: start.x + (rnd() - 0.5) * jitter,
        z: start.z + (rnd() - 0.5) * jitter,
        path: bestPath,
        seg: 0,
        speed: 1.15 + rnd() * 0.35,
        state: 'waiting',
        spawnAt: st.scenario === 'arrival' ? Math.pow(rnd(), 0.9) * spawnWindow : rnd() * 60,
        gate: bestGate,
        queueAt: 0,
      });
    }
    this.version++;
  }

  private cellOf(x: number, z: number) {
    const c = GRID.cells;
    const ix = Math.floor(((x + GRID.size / 2) / GRID.size) * c);
    const iz = Math.floor(((z + GRID.size / 2) / GRID.size) * c);
    if (ix < 0 || iz < 0 || ix >= c || iz >= c) return -1;
    return iz * c + ix;
  }

  step(dtReal: number) {
    if (!this.running) return;
    const st = this.settings;
    const dt = Math.min(0.1, dtReal) * st.speed;
    this.time += dt;
    // density
    this.density.fill(0);
    for (const a of this.agents) {
      if (a.state === 'walking' || a.state === 'queue') {
        const c = this.cellOf(a.x, a.z);
        if (c >= 0) this.density[c] += 1;
      }
    }
    let peak = 0;
    let peakCell = 0;
    for (let i = 0; i < this.density.length; i++) {
      this.heat[i] = this.heat[i] * Math.exp(-dt * 0.05) + this.density[i] * dt * 0.02;
      if (this.density[i] > peak) {
        peak = this.density[i];
        peakCell = i;
      }
    }
    if (peak > this.peak.value) {
      const c = GRID.cells;
      this.peak = {
        value: peak,
        x: ((peakCell % c) + 0.5) * (GRID.size / c) - GRID.size / 2,
        z: (Math.floor(peakCell / c) + 0.5) * (GRID.size / c) - GRID.size / 2,
      };
    }
    for (const g of GATES) this.gateQueue[g.id] = 0;
    let remaining = 0;
    for (const a of this.agents) {
      if (a.state === 'done') continue;
      remaining++;
      if (a.state === 'waiting') {
        if (this.time >= a.spawnAt) a.state = 'walking';
        else continue;
      }
      const targetIdx = a.path[a.seg + 1];
      if (targetIdx === undefined) {
        a.state = 'done';
        continue;
      }
      const target = this.nodes[targetIdx];
      if (a.state === 'queue') {
        this.gateQueue[a.gate]++;
        if (this.time >= this.gateNextFree[a.gate]) {
          this.gateNextFree[a.gate] = this.time + 1 / Math.max(0.2, st.gateRate);
          this.gateServed[a.gate]++;
          a.state = 'walking';
          a.seg++;
        }
        continue;
      }
      const c = this.cellOf(a.x, a.z);
      const rho = c >= 0 ? this.density[c] : 0;
      const f = Math.max(0.18, 1 - rho / 40);
      const dx = target.x - a.x;
      const dz = target.z - a.z;
      const dist = Math.hypot(dx, dz);
      const stepLen = a.speed * f * dt;
      if (dist <= stepLen + 0.5) {
        if (target.kind === 'gate' && a.queueAt !== targetIdx) {
          a.queueAt = targetIdx;
          a.state = 'queue';
          this.gateQueue[a.gate]++;
        } else a.seg++;
        if (a.seg >= a.path.length - 1) a.state = 'done';
      } else {
        a.x += (dx / dist) * stepLen;
        a.z += (dz / dist) * stepLen;
      }
    }
    if (remaining === 0 && this.finishedAt === null && this.agents.length) {
      this.finishedAt = this.time;
      this.running = false;
    }
  }

  stats() {
    const total = this.agents.length;
    const done = this.agents.filter((a) => a.state === 'done').length;
    const active = this.agents.filter((a) => a.state === 'walking' || a.state === 'queue').length;
    return { total, done, active, time: this.time, finishedAt: this.finishedAt, peak: this.peak };
  }
}

export const crowdSim = new CrowdSim();

/** Name the location of a point in plain terms (for the peak-density readout). */
export function describeLocation(x: number, z: number): string {
  let best = '';
  let bestD = Infinity;
  for (const g of GATES) {
    const p = bowlPoint(g.s, PROFILE.facadeD + 4, 0);
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < bestD) {
      bestD = d;
      best = `Kapı ${g.id} çevresi`;
    }
  }
  for (const s of SOURCES) {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d < bestD) {
      bestD = d;
      best = s.name;
    }
  }
  if (Math.abs(x) < INNER.hw + PROFILE.backD && Math.abs(z) < INNER.hd + PROFILE.backD && bestD > 30) best = 'İç dolaşım halkası';
  return best;
}
