import { useEffect, useRef, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { LED_MODES, SHOW_ENDS, SHOW_PRESET_IDS, SHOW_PROFILES, SHOW_STARTS, type ShowPresetId, type ShowStep } from '@/core/model/design';
import { SHOW_BY_ID, SHOW_FACTS, SHOW_PRESETS, MAX_SHOW_HZ, speedToHz } from '@/core/model/lightshow';
import { END_LABEL, LED_LABEL, PROFILE_LABEL, START_LABEL } from '@/core/model/labels';
import { runtime } from '@/world/runtime';
import { worldApi } from '@/world/worldApi';
import { Badge, ColorField, Icon, Note, Section, Select, Slider, Toggle } from '@/ui/primitives';

let stepSeq = 100;

export default function LightShowModule() {
  const show = useDesign((s) => s.design.show);
  const patch = useDesign((s) => s.patch);
  const reduced = useView((s) => s.reducedMotion);
  const [playing, setPlaying] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    worldApi.flyTo({ pos: [190, 85, 235], target: [0, 22, 0] }, { mode: 'explorer' });
    return () => {
      runtime.show.playing = false;
    };
  }, []);

  // progress bar driven by the runtime (no React re-render per frame)
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (bar.current) bar.current.style.width = `${Math.round(runtime.show.progress * 100)}%`;
      if (label.current) label.current.textContent = runtime.show.playing ? `Adım ${runtime.show.stepIndex + 1} / ${show.sequence.length}` : 'Hazır';
      if (!runtime.show.playing && playing) setPlaying(false);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, show.sequence.length]);

  const set = (p: Parameters<typeof patch>[0]['show'], label: string) => patch({ show: { ...p, preset: 'custom' } }, label, { respectLocks: false });

  const applyPreset = (id: ShowPresetId) => {
    const look = SHOW_BY_ID[id].look;
    patch({ show: { ...look, preset: id, active: true } }, `Işık gösterisi: ${SHOW_BY_ID[id].name}`, { respectLocks: false });
  };

  const play = () => {
    if (!show.sequence.length) return;
    runtime.show.playing = true;
    runtime.show.startedAt = runtime.time;
    runtime.show.stepIndex = 0;
    runtime.show.progress = 0;
    setPlaying(true);
  };
  const stop = () => {
    runtime.show.playing = false;
    runtime.show.progress = 0;
    setPlaying(false);
  };

  const setSeq = (sequence: ShowStep[], label: string) => patch({ show: { sequence } }, label, { respectLocks: false });
  const move = (i: number, d: number) => {
    const s = [...show.sequence];
    const j = i + d;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    setSeq(s, 'Sahne sırası değişti');
  };

  const hz = speedToHz(show.speed, reduced);
  return (
    <div>
      <Section title="Gösteri durumu" kicker="Light Show Composer" badges={<Badge kind="sim">Web tabanlı görsel simülasyon</Badge>}>
        <Toggle
          label="Işık gösterisini stadyuma uygula"
          description="Kapalıyken stadyum mimari aydınlatmasını (DNA paleti) kullanır."
          checked={show.active}
          onChange={(v) => patch({ show: { active: v } }, v ? 'Işık gösterisi açıldı' : 'Işık gösterisi kapatıldı', { respectLocks: false })}
        />
      </Section>

      <Section title="Hazır gösteriler">
        <div className="grid grid-cols-2 gap-2">
          {SHOW_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={show.active && show.preset === p.id}
              onClick={() => applyPreset(p.id)}
              className={`text-left rounded-xl border p-2.5 ${show.active && show.preset === p.id ? 'border-aslan bg-aslan/10' : 'border-line bg-surface-2 hover:border-white/20'}`}
            >
              <span className="flex h-2 rounded-full overflow-hidden mb-2" aria-hidden="true">
                <span className="flex-1" style={{ background: p.look.primary }} />
                <span className="flex-1" style={{ background: p.look.secondary }} />
              </span>
              <span className="text-[12.5px] font-semibold block leading-tight">{p.name}</span>
              <span className="text-[11px] muted block mt-1 leading-snug">{p.mood}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Kontroller" kicker={show.preset === 'custom' ? 'Özel gösteri' : `Taban: ${SHOW_BY_ID[show.preset].name}`}>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Ana renk" value={show.primary} onChange={(v) => set({ primary: v, active: true }, 'Gösteri ana rengi')} />
          <ColorField label="İkinci renk" value={show.secondary} onChange={(v) => set({ secondary: v, active: true }, 'Gösteri ikinci rengi')} />
        </div>
        <Slider label="Işık halkası yoğunluğu" value={show.ring} onChange={(v) => set({ ring: v, active: true }, 'Halka yoğunluğu')} />
        <Slider label="Işık geçiş hızı" value={show.speed} onChange={(v) => set({ speed: v, active: true }, 'Geçiş hızı')} format={() => `${hz.toFixed(2)} Hz`} />
        <Slider label="Tribün ışıklarının kapsamı" value={show.tribune} onChange={(v) => set({ tribune: v, active: true }, 'Tribün kapsamı')} />
        <Select label="Çevre LED ekranlarının görünümü" value={show.led} options={LED_MODES.map((v) => ({ value: v, label: LED_LABEL[v] }))} onChange={(v) => set({ led: v, active: true }, 'LED görünümü')} />
        <Select label="Animasyon profili" value={show.profile} options={SHOW_PROFILES.map((v) => ({ value: v, label: PROFILE_LABEL[v] }))} onChange={(v) => set({ profile: v, active: true }, 'Animasyon profili')} />
        <div className="grid grid-cols-2 gap-2">
          <Select label="Başlangıç sahnesi" value={show.start} options={SHOW_STARTS.map((v) => ({ value: v, label: START_LABEL[v] }))} onChange={(v) => patch({ show: { start: v } }, 'Başlangıç sahnesi', { respectLocks: false })} />
          <Select label="Bitiş sahnesi" value={show.end} options={SHOW_ENDS.map((v) => ({ value: v, label: END_LABEL[v] }))} onChange={(v) => patch({ show: { end: v } }, 'Bitiş sahnesi', { respectLocks: false })} />
        </div>
      </Section>

      <Section title="Sahne zaman çizelgesi" kicker="Sekans">
        <ol className="flex flex-col gap-1.5">
          {show.sequence.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1.5 card card-tight !py-2">
              <span className="w-5 text-[11px] muted tabular-nums">{i + 1}</span>
              <select
                className="select !min-h-[30px] !text-[12px] flex-1"
                value={s.preset}
                aria-label={`Sahne ${i + 1} gösterisi`}
                onChange={(e) => setSeq(show.sequence.map((x, j) => (j === i ? { ...x, preset: e.target.value as ShowPresetId } : x)), 'Sahne değişti')}
              >
                {SHOW_PRESET_IDS.map((id) => (
                  <option key={id} value={id}>
                    {SHOW_BY_ID[id].name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={3}
                max={60}
                className="input !min-h-[30px] !w-16 !px-2 !text-[12px]"
                value={s.duration}
                aria-label={`Sahne ${i + 1} süresi (saniye)`}
                onChange={(e) => setSeq(show.sequence.map((x, j) => (j === i ? { ...x, duration: Math.min(60, Math.max(3, Number(e.target.value) || 3)) } : x)), 'Sahne süresi')}
              />
              <span className="text-[11px] muted">sn</span>
              <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Sahne ${i + 1} yukarı taşı`}>
                <Icon name="ArrowUp" size={13} />
              </button>
              <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={() => move(i, 1)} disabled={i === show.sequence.length - 1} aria-label={`Sahne ${i + 1} aşağı taşı`}>
                <Icon name="ArrowDown" size={13} />
              </button>
              <button type="button" className="btn btn-icon btn-sm btn-ghost" onClick={() => setSeq(show.sequence.filter((_, j) => j !== i), 'Sahne silindi')} aria-label={`Sahne ${i + 1} sil`}>
                <Icon name="Trash2" size={13} />
              </button>
            </li>
          ))}
        </ol>
        <div className="flex gap-2 mt-2">
          <button type="button" className="btn btn-sm" disabled={show.sequence.length >= 12} onClick={() => setSeq([...show.sequence, { id: `s${stepSeq++}`, preset: 'golden-halo', duration: 8 }], 'Sahne eklendi')}>
            <Icon name="Plus" size={14} /> Sahne ekle
          </button>
          {playing ? (
            <button type="button" className="btn btn-sm btn-primary" onClick={stop}>
              <Icon name="Square" size={14} /> Durdur
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-primary" onClick={play} disabled={!show.sequence.length}>
              <Icon name="Play" size={14} /> Önizlemeyi oynat
            </button>
          )}
        </div>
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden" role="progressbar" aria-label="Gösteri ilerlemesi">
            <div ref={bar} className="h-full bg-gold" style={{ width: '0%' }} />
          </div>
          <span ref={label} className="text-[11.5px] muted" aria-live="off">
            Hazır
          </span>
        </div>
      </Section>

      <Note kind="warn">
        <ul className="list-dots">
          {SHOW_FACTS.map((f) => (
            <li key={f}>{f}</li>
          ))}
          <li>Şu anki geçiş frekansı: {hz.toFixed(2)} Hz (üst sınır {MAX_SHOW_HZ} Hz).</li>
        </ul>
      </Note>
    </div>
  );
}
