import { describe, expect, it } from 'vitest';
import { CrowdSim, DEFAULT_CROWD } from '@/core/sim/crowd';
import { seatMetrics } from '@/modules/seats/seatMath';
import { INNER_PERIMETER, innerPoint, sectionPolygons, withBreaks, ringSamples, TUNNEL_BREAKS, inTunnel } from '@/world/stadium/geometry';

function run(sim: CrowdSim, seconds: number) {
  sim.running = true;
  for (let t = 0; t < seconds && sim.running; t += 0.1) sim.step(0.1);
}

describe('crowd simulation', () => {
  it('moves every agent to its destination', () => {
    const sim = new CrowdSim();
    sim.reset({ ...DEFAULT_CROWD, agents: 300, speed: 10 });
    run(sim, 400);
    const s = sim.stats();
    expect(s.total).toBe(300);
    expect(s.done).toBe(300);
    expect(s.finishedAt).not.toBeNull();
  });

  it('routes only through open gates', () => {
    const sim = new CrowdSim();
    sim.reset({ ...DEFAULT_CROWD, agents: 200, openGates: ['A', 'E'] });
    expect(new Set(sim.agents.map((a) => a.gate))).toEqual(new Set(['A', 'E']));
  });

  it('balanced routing spreads load over more gates than shortest routing', () => {
    const count = (strategy: 'shortest' | 'balanced') => {
      const sim = new CrowdSim();
      sim.reset({ ...DEFAULT_CROWD, agents: 800, strategy, sources: { metro: 1, bus: 0, parking: 0, plaza: 0 } });
      const per: Record<string, number> = {};
      for (const a of sim.agents) per[a.gate] = (per[a.gate] ?? 0) + 1;
      return Math.max(...Object.values(per));
    };
    expect(count('balanced')).toBeLessThan(count('shortest'));
  });

  it('handles the no-gate edge case without agents', () => {
    const sim = new CrowdSim();
    sim.reset({ ...DEFAULT_CROWD, openGates: [] });
    expect(sim.agents).toHaveLength(0);
  });
});

describe('geometry', () => {
  it('parameterises the inner curve continuously', () => {
    let prev = innerPoint(0);
    for (let i = 1; i <= 400; i++) {
      const p = innerPoint(i / 400);
      expect(Math.hypot(p.x - prev.x, p.z - prev.z)).toBeLessThan((INNER_PERIMETER / 400) * 1.05);
      prev = p;
    }
  });

  it('places exact break points at the tunnel opening', () => {
    const samples = withBreaks(ringSamples(), TUNNEL_BREAKS);
    const inside = samples.slice(0, -1).filter((s, i) => inTunnel((s + samples[i + 1]) / 2));
    expect(inside.length).toBeGreaterThan(0);
  });

  it('builds closed section polygons', () => {
    for (const p of sectionPolygons()) expect(p.pts.length).toBeGreaterThan(3);
  });
});

describe('seat metrics', () => {
  it('upper-tier seats are further away and higher than lower-tier seats', () => {
    const lower = seatMetrics({ tier: 'lower', block: 0, row: 0.5 });
    const upper = seatMetrics({ tier: 'upper', block: 0, row: 0.5 });
    expect(upper.toCenter).toBeGreaterThan(lower.toCenter);
    expect(upper.eyeHeight).toBeGreaterThan(lower.eyeHeight);
    expect(lower.cValueMm).toBeGreaterThan(0);
  });
});
