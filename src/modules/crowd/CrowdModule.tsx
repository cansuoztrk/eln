import { useCallback, useEffect, useRef, useState } from 'react';
import { useView } from '@/core/store/viewStore';
import { DEFAULT_CROWD, GRID, SOURCES, STANDS, crowdSim, describeLocation, type CrowdSettings, type RouteStrategy, type Scenario, type SourceId, type StandId } from '@/core/sim/crowd';
import { GATES, INNER, PROFILE, bowlPoint } from '@/world/stadium/geometry';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section, Segmented, Slider, Toggle } from '@/ui/primitives';

type Viz = 'off' | 'dots' | 'heat';
const W = 600;
const SCALE = W / GRID.size; // px per metre
const toPx = (v: number) => (v + GRID.size / 2) * SCALE;

const SOURCE_LABEL: Record<SourceId, string> = { metro: 'Metro (şematik)', bus: 'Servis', parking: 'Otopark', plaza: 'Meydan' };

function drawRing(ctx: CanvasRenderingContext2D, d: number) {
  const hw = INNER.hw + d;
  const hd = INNER.hd + d;
  const r = INNER.r + d;
  ctx.beginPath();
  ctx.roundRect(toPx(-hw), toPx(-hd), hw * 2 * SCALE, hd * 2 * SCALE, r * SCALE);
}

function heatColor(t: number) {
  const x = Math.min(1, t);
  const r = Math.round(40 + 215 * Math.min(1, x * 1.6));
  const g = Math.round(180 * Math.max(0, 1 - Math.abs(x - 0.45) * 2.2));
  const b = Math.round(200 * Math.max(0, 1 - x * 2.5));
  return `rgba(${r},${g},${b},${0.15 + 0.6 * x})`;
}

export default function CrowdModule() {
  const set = useView((s) => s.set);
  const crowdIn3D = useView((s) => s.crowdIn3D);
  const quality = useView((s) => s.quality);
  const reduced = useView((s) => s.reducedMotion);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<CrowdSettings>(() => ({ ...DEFAULT_CROWD, agents: quality === 'low' ? 900 : DEFAULT_CROWD.agents }));
  const [viz, setViz] = useState<Viz>('heat');
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(crowdSim.stats());
  const [gateStats, setGateStats] = useState<{ id: string; served: number; queue: number }[]>([]);

  const draw = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = '#0d1016';
    ctx.fillRect(0, 0, W, W);
    // heat
    if (viz === 'heat') {
      const cs = W / GRID.cells;
      let max = 0.0001;
      for (const h of crowdSim.heat) if (h > max) max = h;
      for (let i = 0; i < crowdSim.heat.length; i++) {
        const v = crowdSim.heat[i] / max;
        if (v < 0.04) continue;
        ctx.fillStyle = heatColor(v);
        ctx.fillRect((i % GRID.cells) * cs, Math.floor(i / GRID.cells) * cs, cs + 0.5, cs + 0.5);
      }
    }
    // building
    ctx.fillStyle = '#20232a';
    drawRing(ctx, PROFILE.facadeD);
    ctx.fill();
    ctx.strokeStyle = '#5a606b';
    ctx.lineWidth = 1;
    drawRing(ctx, PROFILE.backD);
    ctx.stroke();
    ctx.fillStyle = '#1d5a2a';
    drawRing(ctx, 0);
    ctx.fill();
    ctx.strokeStyle = '#3a3e47';
    drawRing(ctx, 36);
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // gates
    ctx.font = '700 11px Inter Variable, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const g of GATES) {
      const p = bowlPoint(g.s, PROFILE.facadeD + 4, 0);
      const open = crowdSim.settings.openGates.includes(g.id);
      ctx.fillStyle = open ? '#c8102e' : '#555';
      ctx.beginPath();
      ctx.arc(toPx(p.x), toPx(p.z), 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(g.id, toPx(p.x), toPx(p.z) + 0.5);
    }
    // sources
    for (const s of SOURCES) {
      const w = crowdSim.settings.sources[s.id];
      ctx.fillStyle = w > 0 ? '#5bb4ff' : '#3a4250';
      ctx.fillRect(toPx(s.x) - 7, toPx(s.z) - 7, 14, 14);
      ctx.fillStyle = '#cfe6ff';
      ctx.font = '600 10px Inter Variable, sans-serif';
      ctx.fillText(SOURCE_LABEL[s.id], toPx(s.x), toPx(s.z) + 16);
    }
    // agents
    if (viz !== 'off') {
      for (const a of crowdSim.agents) {
        if (a.state !== 'walking' && a.state !== 'queue') continue;
        ctx.fillStyle = a.state === 'queue' ? '#ff4d5e' : '#ffd166';
        ctx.fillRect(toPx(a.x) - 1.2, toPx(a.z) - 1.2, 2.4, 2.4);
      }
    }
    // peak marker
    if (crowdSim.peak.value > 0) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(toPx(crowdSim.peak.x), toPx(crowdSim.peak.z), 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [viz]);

  const refreshStats = useCallback(() => {
    setStats(crowdSim.stats());
    setGateStats(GATES.map((g) => ({ id: g.id, served: crowdSim.gateServed[g.id] ?? 0, queue: crowdSim.gateQueue[g.id] ?? 0 })));
  }, []);

  // settings change → reset
  useEffect(() => {
    crowdSim.running = false;
    setRunning(false);
    crowdSim.reset(settings);
    refreshStats();
    draw();
  }, [settings, draw, refreshStats]);

  // loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastStats = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (crowdSim.running) {
        crowdSim.step(dt);
        draw();
        if (now - lastStats > 250) {
          lastStats = now;
          refreshStats();
          if (!crowdSim.running) setRunning(false);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw, refreshStats]);

  useEffect(() => {
    return () => {
      crowdSim.running = false;
      useView.getState().set({ crowdIn3D: false, highlight: [] });
    };
  }, []);

  useEffect(() => {
    if (crowdIn3D) worldApi.flyTo({ pos: [40, 330, 330], target: [0, 0, 20] }, { mode: 'explorer' });
  }, [crowdIn3D]);

  const toggleGate = (id: string) => setSettings((s) => ({ ...s, openGates: s.openGates.includes(id) ? s.openGates.filter((g) => g !== id) : [...s.openGates, id] }));
  const toggleStand = (id: StandId) => setSettings((s) => ({ ...s, stands: s.stands.includes(id) ? s.stands.filter((g) => g !== id) : [...s.stands, id] }));
  const maxServed = Math.max(1, ...gateStats.map((g) => g.served + g.queue));
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  return (
    <div>
      <Section title="Senaryo" kicker="Crowd Flow Simulator" badges={<Badge kind="sim">Kavramsal simülasyon</Badge>}>
        <div className="flex flex-wrap gap-2">
          <Segmented<Scenario> label="Senaryo" value={settings.scenario} onChange={(v) => setSettings((s) => ({ ...s, scenario: v }))} options={[{ value: 'arrival', label: 'Giriş (maç öncesi)' }, { value: 'exit', label: 'Çıkış' }]} />
        </div>
        <div className="mt-2">
          <span className="field-label">Güzergâh stratejisi</span>
          <Segmented<RouteStrategy>
            label="Güzergâh stratejisi"
            value={settings.strategy}
            onChange={(v) => setSettings((s) => ({ ...s, strategy: v }))}
            options={[
              { value: 'shortest', label: 'En kısa' },
              { value: 'balanced', label: 'Dengeli' },
              { value: 'adaptive', label: 'Kuyruğa duyarlı' },
            ]}
          />
        </div>
      </Section>

      <div className="rounded-xl overflow-hidden border border-line mb-2">
        <canvas ref={canvas} width={W} height={W} className="w-full h-auto block" role="img" aria-label={`Taraftar akışı haritası. Tamamlanan: yüzde ${pct}. ${stats.peak.value > 0 ? `En yoğun bölge: ${describeLocation(stats.peak.x, stats.peak.z)}` : ''}`} />
      </div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => {
            if (stats.finishedAt !== null) crowdSim.reset(settings);
            crowdSim.running = !crowdSim.running;
            setRunning(crowdSim.running);
          }}
        >
          <Icon name={running ? 'Pause' : 'Play'} size={14} /> {running ? 'Duraklat' : stats.finishedAt !== null ? 'Yeniden oynat' : 'Başlat'}
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            crowdSim.running = false;
            setRunning(false);
            crowdSim.reset(settings);
            refreshStats();
            draw();
          }}
        >
          <Icon name="RotateCcw" size={14} /> Sıfırla
        </button>
        <Segmented<Viz>
          label="Görselleştirme"
          value={viz}
          onChange={(v) => {
            setViz(v);
            setTimeout(draw, 0);
          }}
          options={[
            { value: 'off', label: 'Kapalı' },
            { value: 'dots', label: 'Noktalar' },
            { value: 'heat', label: 'Isı haritası' },
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Simüle süre" value={mmss(stats.time)} />
        <Stat label="Tamamlanan" value={`%${pct}`} />
        <Stat label="Hareket hâlinde" value={String(stats.active)} />
      </div>
      {stats.peak.value > 0 && (
        <p className="text-[12px] muted -mt-2 mb-3">
          Kavramsal olarak en yoğun bölge: <strong className="text-text">{describeLocation(stats.peak.x, stats.peak.z)}</strong>
        </p>
      )}

      <Section title="Kapı yükü" kicker="Geçen + bekleyen (temsili)">
        <ul className="flex flex-col gap-1">
          {gateStats.map((g) => (
            <li key={g.id} className="flex items-center gap-2 text-[12px]">
              <span className="w-12">Kapı {g.id}</span>
              <span className="flex-1 h-2.5 rounded bg-surface-3 overflow-hidden flex" aria-hidden="true">
                <span className="h-full bg-gold" style={{ width: `${(g.served / maxServed) * 100}%` }} />
                <span className="h-full bg-aslan" style={{ width: `${(g.queue / maxServed) * 100}%` }} />
              </span>
              <span className="w-20 text-right tabular-nums muted">
                {g.served} / {g.queue}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] muted mt-1">Altın: geçen temsili grup · Kırmızı: kuyrukta bekleyen. 1 nokta ≈ temsili bir küçük grup.</p>
      </Section>

      <Section title="Giriş noktaları (kapılar)">
        <div className="flex flex-wrap gap-1.5">
          {GATES.map((g) => (
            <button key={g.id} type="button" className="chip" aria-pressed={settings.openGates.includes(g.id)} onClick={() => toggleGate(g.id)}>
              Kapı {g.id}
            </button>
          ))}
        </div>
        <Slider label="Kapı başına hizmet hızı (temsili)" value={settings.gateRate} min={0.5} max={5} step={0.1} format={(v) => `${v.toFixed(1)} nokta/sn`} onChange={(v) => setSettings((s) => ({ ...s, gateRate: v }))} />
      </Section>

      <Section title="Hedef tribünler">
        <div className="flex flex-wrap gap-1.5">
          {STANDS.map((s) => (
            <button key={s.id} type="button" className="chip" aria-pressed={settings.stands.includes(s.id)} onClick={() => toggleStand(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Taraftar gruplarının başlangıç bölgeleri">
        {SOURCES.map((s) => (
          <Slider key={s.id} label={SOURCE_LABEL[s.id]} value={settings.sources[s.id]} onChange={(v) => setSettings((st) => ({ ...st, sources: { ...st.sources, [s.id]: v } }))} />
        ))}
        <Slider label="Örnek nokta sayısı" value={settings.agents} min={200} max={quality === 'low' ? 1500 : 3000} step={100} format={(v) => String(v)} onChange={(v) => setSettings((s) => ({ ...s, agents: v }))} />
        <Slider label="Simülasyon hızı" value={settings.speed} min={1} max={reduced ? 6 : 12} step={1} format={(v) => `${v}×`} onChange={(v) => setSettings((s) => ({ ...s, speed: v }))} />
        <Toggle label="Akışı 3D modelde göster" checked={crowdIn3D} onChange={(v) => set({ crowdIn3D: v, highlight: v ? ['transit', 'concourse'] : [] })} />
      </Section>

      <Note kind="eng">
        Bu, şematik bir ağ üzerinde basit bir hız–yoğunluk ilişkisi kullanan görsel bir açıklama aracıdır. Gerçek kalabalık verisi, gerçek stadyum geometrisi veya doğrulanmış bir mühendislik modeli içermez; tahliye güvenliği hesabı veya gerçek zamanlı kalabalık tahmini değildir. Yangın güvenliği ve tahliye kararları yetkin uzmanların değerlendirmesini gerektirir.
      </Note>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-tight text-center">
      <div className="text-[18px] font-semibold tabular-nums display" data-stat={label}>
        {value}
      </div>
      <div className="text-[10.5px] muted uppercase tracking-wide">{label}</div>
    </div>
  );
}
