/**
 * Sound & Atmosphere engine. Every sound is synthesised in real time with
 * the Web Audio API (noise, oscillators, filters). No samples, no club
 * chants, no broadcast recordings — all original, generic textures.
 * Sound is off by default and only starts after an explicit user action.
 */
import type { AtmosphereId } from '@/core/store/viewStore';

interface LayerLevels {
  wind: number;
  pad: number;
  murmur: number;
  roar: number;
  rhythm: number;
  chant: number;
  pops: number;
}

const LEVELS: Record<AtmosphereId, LayerLevels> = {
  silent: { wind: 0.5, pad: 0.35, murmur: 0, roar: 0, rhythm: 0, chant: 0, pops: 0 },
  ambient: { wind: 0.2, pad: 0.1, murmur: 0.45, roar: 0, rhythm: 0, chant: 0, pops: 0 },
  prematch: { wind: 0.05, pad: 0, murmur: 0.75, roar: 0.12, rhythm: 0.5, chant: 0.35, pops: 0 },
  kickoff: { wind: 0, pad: 0, murmur: 0.85, roar: 0.3, rhythm: 0.65, chant: 0.45, pops: 0 },
  goal: { wind: 0, pad: 0, murmur: 0.9, roar: 0.85, rhythm: 0.7, chant: 0.6, pops: 0 },
  championship: { wind: 0, pad: 0.2, murmur: 0.9, roar: 0.5, rhythm: 0.8, chant: 0.7, pops: 0.6 },
};

export const ATMOSPHERE_INFO: Record<AtmosphereId, { name: string; description: string }> = {
  silent: { name: 'Sessiz mimari keşif', description: 'Rüzgâr ve yumuşak bir ses dokusu; ışıklar sakin, tribünler boş.' },
  ambient: { name: 'Hafif stadyum ambiyansı', description: 'Uzak bir uğultu ve dağınık kalabalık; projektörler orta seviyede.' },
  prematch: { name: 'Maç öncesi atmosfer', description: 'Dolan tribünler, ritmik davullar ve el çırpma; LED bantlarda örnek maç bilgisi.' },
  kickoff: { name: 'Başlama anı', description: 'Hakem düdüğü, tam projektör ışığı ve tribünlerde koreografi gösterimi.' },
  goal: { name: 'Gol anı', description: 'Yükselen kalabalık sesi ve korna; ışıkta “The Roar” gösterisi, ardından kırmızı dalga.' },
  championship: { name: 'Şampiyonluk gecesi', description: 'Kutlama ritmi, uzak havai fişek patlamaları ve “Championship Celebration” ışık gösterisi.' },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private gains: Partial<Record<keyof LayerLevels, GainNode>> = {};
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextBeat = 0;
  private beat = 0;
  private nextPop = 0;
  private nextChant = 0;
  private mode: AtmosphereId = 'silent';
  running = false;

  get supported() {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  }

  async start(mode: AtmosphereId, volume: number): Promise<boolean> {
    if (!this.supported) return false;
    if (!this.ctx) this.build();
    try {
      await this.ctx!.resume();
    } catch {
      return false;
    }
    this.running = true;
    this.setVolume(volume);
    this.setMode(mode, true);
    if (!this.timer) this.timer = setInterval(() => this.schedule(), 60);
    return true;
  }

  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    void this.ctx?.suspend();
  }

  setVolume(v: number) {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)) * 0.8, this.ctx.currentTime, 0.1);
  }

  setMode(mode: AtmosphereId, initial = false) {
    const prev = this.mode;
    this.mode = mode;
    if (!this.ctx || !this.running) return;
    const t = this.ctx.currentTime;
    const lv = LEVELS[mode];
    for (const k of Object.keys(lv) as (keyof LayerLevels)[]) {
      const g = this.gains[k];
      if (g) g.gain.setTargetAtTime(lv[k], t, initial ? 0.3 : 0.9);
    }
    if (mode !== prev || initial) {
      if (mode === 'kickoff') this.whistle(t + 0.3, 1.1);
      if (mode === 'goal') {
        this.roarSwell(t + 0.05);
        this.horn(t + 0.3);
      }
      if (mode === 'championship') this.horn(t + 0.2);
    }
  }

  /** One-shot effects callable from the UI. */
  trigger(kind: 'whistle' | 'roar' | 'horn') {
    if (!this.ctx || !this.running) return;
    const t = this.ctx.currentTime + 0.05;
    if (kind === 'whistle') this.whistle(t, 0.9);
    if (kind === 'roar') this.roarSwell(t);
    if (kind === 'horn') this.horn(t);
  }

  private build() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp).connect(ctx.destination);

    // pink-ish noise buffer
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0,
        b1 = 0,
        b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
      }
    }
    this.noise = buf;

    const layer = (key: keyof LayerLevels) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(this.master!);
      this.gains[key] = g;
      return g;
    };
    const loop = (dest: AudioNode, rate = 1) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = rate;
      src.connect(dest);
      src.start();
      return src;
    };
    const lfo = (target: AudioParam, freq: number, depth: number) => {
      const o = ctx.createOscillator();
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = depth;
      o.connect(g).connect(target);
      o.start();
    };

    // wind
    {
      const out = layer('wind');
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 380;
      const g = ctx.createGain();
      g.gain.value = 0.6;
      lfo(g.gain, 0.08, 0.35);
      lfo(f.frequency, 0.05, 160);
      loop(f, 0.6);
      f.connect(g).connect(out);
    }
    // architectural pad
    {
      const out = layer('pad');
      const g = ctx.createGain();
      g.gain.value = 0.05;
      lfo(g.gain, 0.06, 0.025);
      [110, 164.81, 220, 277.18].forEach((fq, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = fq;
        o.detune.value = (i - 1.5) * 4;
        o.connect(g);
        o.start();
      });
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 900;
      g.connect(f).connect(out);
    }
    // murmur (crowd bed)
    {
      const out = layer('murmur');
      [380, 720, 1150].forEach((fq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = fq;
        f.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.value = 0.55;
        lfo(g.gain, 0.17 + i * 0.07, 0.18);
        loop(f, 0.9 + i * 0.07);
        f.connect(g).connect(out);
      });
    }
    // roar (big crowd)
    {
      const out = layer('roar');
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.value = 1.2;
      lfo(g.gain, 0.3, 0.2);
      loop(f, 1.1);
      f.connect(g).connect(out);
    }
    layer('rhythm');
    layer('chant');
    layer('pops');
    this.nextBeat = ctx.currentTime + 0.2;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.running) return;
    const lv = LEVELS[this.mode];
    const ahead = ctx.currentTime + 0.25;
    const bpm = this.mode === 'championship' ? 118 : 104;
    const spb = 60 / bpm / 2; // eighth notes
    while (this.nextBeat < ahead) {
      if (lv.rhythm > 0) {
        // generic pattern: boom . clap . boom boom clap .
        const step = this.beat % 8;
        if (step === 0 || step === 4 || step === 5) this.drum(this.nextBeat);
        if (step === 2 || step === 6) this.clap(this.nextBeat);
      }
      this.nextBeat += spb;
      this.beat++;
    }
    if (lv.chant > 0 && ctx.currentTime > this.nextChant) {
      this.vowel(ctx.currentTime + 0.1, 1.6);
      this.vowel(ctx.currentTime + 1.9, 1.6, 1.12);
      this.nextChant = ctx.currentTime + 6 + Math.random() * 3;
    }
    if (lv.pops > 0 && ctx.currentTime > this.nextPop) {
      this.pop(ctx.currentTime + 0.05);
      this.nextPop = ctx.currentTime + 1.2 + Math.random() * 2.4;
    }
  }

  private envGain(dest: AudioNode, t: number, a: number, peak: number, d: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(dest);
    return g;
  }

  private drum(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    const g = this.envGain(this.gains.rhythm!, t, 0.005, 0.9, 0.35);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.45);
  }

  private clap(t: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1500;
    f.Q.value = 0.6;
    const g = this.envGain(this.gains.rhythm!, t, 0.004, 0.55, 0.16);
    src.connect(f).connect(g);
    src.start(t, Math.random() * 3);
    src.stop(t + 0.25);
  }

  private vowel(t: number, dur: number, pitch = 1) {
    const ctx = this.ctx!;
    const out = this.gains.chant!;
    const mix = ctx.createGain();
    mix.gain.setValueAtTime(0, t);
    mix.gain.linearRampToValueAtTime(0.12, t + 0.35);
    mix.gain.linearRampToValueAtTime(0.09, t + dur - 0.3);
    mix.gain.linearRampToValueAtTime(0, t + dur);
    // formants of an open "o" vowel
    const formants = [450, 800, 2830].map((fq, i) => {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = fq;
      f.Q.value = 6;
      const g = ctx.createGain();
      g.gain.value = [1, 0.6, 0.15][i];
      f.connect(g).connect(mix);
      return f;
    });
    mix.connect(out);
    [196, 247, 294, 196.5, 147].forEach((fq) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = fq * pitch;
      o.detune.value = (Math.random() - 0.5) * 30;
      formants.forEach((f) => o.connect(f));
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  private whistle(t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 2950;
    const vib = ctx.createOscillator();
    vib.frequency.value = 28;
    const vg = ctx.createGain();
    vg.gain.value = 110;
    vib.connect(vg).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.03);
    g.gain.setValueAtTime(0.16, t + dur - 0.08);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    vib.start(t);
    o.stop(t + dur + 0.05);
    vib.stop(t + dur + 0.05);
  }

  private horn(t: number) {
    const ctx = this.ctx!;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.08);
    g.gain.setValueAtTime(0.1, t + 1.3);
    g.gain.linearRampToValueAtTime(0, t + 1.7);
    f.connect(g).connect(this.master!);
    [233, 293.7, 349.2].forEach((fq) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = fq;
      o.connect(f);
      o.start(t);
      o.stop(t + 1.8);
    });
  }

  private roarSwell(t: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(400, t);
    f.frequency.linearRampToValueAtTime(3200, t + 1.2);
    f.frequency.linearRampToValueAtTime(1600, t + 6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1.3, t + 0.9);
    g.gain.linearRampToValueAtTime(0.0, t + 7);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
    src.stop(t + 7.2);
  }

  private pop(t: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 300 + Math.random() * 500;
    f.Q.value = 1.2;
    const g = this.envGain(this.gains.pops!, t, 0.003, 0.7, 0.9);
    src.connect(f).connect(g);
    src.start(t, Math.random() * 3);
    src.stop(t + 1.1);
  }
}

export const audioEngine = new AudioEngine();
