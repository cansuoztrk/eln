/**
 * Fully synthesized audio (Web Audio API): no audio files to license and a
 * tiny download. The sound of an Istanbul street: coin clinks, a cash
 * register, seagulls, the ferry horn, a cat's meow. The background track is
 * a procedural Nihavend café loop (plucked ud, soft bass, bendir).
 */
import { Rng } from '../core/rng';

// A Nihavend (harmonic minor flavour): A B C D E F G# A — semitones from A3.
const NIHAVEND = [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19, 20, 23, 24];
const A3 = 220;
const hz = (semi: number) => A3 * Math.pow(2, semi / 12);

/** Chord progression (scale degrees as root, as semitone offsets) — 8 bars. */
const PROGRESSION: ReadonlyArray<{ root: number; tones: number[] }> = [
  { root: 0, tones: [0, 3, 7] }, // Am
  { root: 5, tones: [5, 8, 12] }, // Dm
  { root: 7, tones: [7, 11, 14] }, // E
  { root: 0, tones: [0, 3, 7] }, // Am
  { root: 8, tones: [8, 12, 15] }, // F
  { root: 10, tones: [10, 14, 17] }, // G
  { root: 7, tones: [7, 11, 14] }, // E
  { root: 0, tones: [0, 3, 7] }, // Am
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private sfxOn = true;
  private musicOn = true;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextStep = 0;
  private stepIndex = 0;
  private rng = new Rng(20261015);
  private suspended = false;
  private lastCash = 0;

  /** Must be called from a user gesture (browsers block autoplay). */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.75;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      if (this.musicOn) this.startMusic();
    }
    if (this.ctx.state === 'suspended' && !this.suspended) void this.ctx.resume();
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (!this.ctx) return;
    if (on) this.startMusic();
    else this.stopMusic();
  }

  /** App went to background / an ad is playing. */
  setSuspended(s: boolean): void {
    this.suspended = s;
    if (!this.ctx) return;
    if (s) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  // ───────────── primitives ─────────────

  private tone(freq: number, dur: number, o: { type?: OscillatorType; gain?: number; at?: number; slideTo?: number; attack?: number; bus?: GainNode; vibrato?: number } = {}): void {
    const ctx = this.ctx!;
    const t = o.at ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    if (o.vibrato) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 6;
      lg.gain.value = o.vibrato;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    const peak = o.gain ?? 0.2;
    const a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(o.bus ?? this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, o: { freq?: number; q?: number; type?: BiquadFilterType; gain?: number; at?: number; sweepTo?: number; bus?: GainNode } = {}): void {
    const ctx = this.ctx!;
    const t = o.at ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.freq ?? 2000, t);
    if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + dur);
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.gain ?? 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(o.bus ?? this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  private bell(freq: number, at: number, gain = 0.14, dur = 0.5): void {
    this.tone(freq, dur, { at, gain, type: 'sine' });
    this.tone(freq * 2.01, dur * 0.6, { at, gain: gain * 0.35, type: 'sine' });
    this.tone(freq * 3.02, dur * 0.3, { at, gain: gain * 0.1, type: 'triangle' });
  }

  private ready(): boolean {
    return !!this.ctx && this.sfxOn && !this.suspended;
  }

  // ───────────── SFX ─────────────

  tap(): void {
    if (!this.ready()) return;
    this.tone(900, 0.05, { gain: 0.07, slideTo: 620, type: 'triangle' });
  }

  /** A stand finished a cycle. Throttled; bigger payouts sound richer. */
  cash(big = false): void {
    if (!this.ready()) return;
    const now = this.ctx!.currentTime;
    if (now - this.lastCash < (big ? 0.05 : 0.12)) return;
    this.lastCash = now;
    const p = 1 + (this.rng.next() - 0.5) * 0.12;
    this.tone(2093 * p, 0.07, { gain: 0.05, type: 'square', at: now });
    this.tone(2637 * p, 0.12, { gain: 0.045, type: 'square', at: now + 0.04 });
    if (big) this.noise(0.08, { freq: 5000, q: 2, gain: 0.08, at: now });
  }

  /** Cash register "ka-ching" (big moments). */
  register(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.06, { freq: 2500, q: 3, gain: 0.25, at: t });
    this.tone(180, 0.08, { gain: 0.15, at: t, slideTo: 120 });
    this.bell(2349, t + 0.08, 0.12, 0.7);
    this.bell(3136, t + 0.12, 0.08, 0.6);
  }

  buy(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.03, { freq: 1800, q: 3, gain: 0.2, at: t });
    this.tone(hz(12), 0.08, { gain: 0.1, type: 'triangle', at: t, slideTo: hz(19) });
  }

  unlock2(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [12, 15, 19, 24].forEach((s, k) => this.bell(hz(s), t + k * 0.07, 0.12, 0.6));
  }

  milestone(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [7, 12, 15, 19].forEach((s, k) => this.bell(hz(s + 12), t + k * 0.06, 0.11, 0.7));
    this.noise(0.5, { freq: 6000, q: 0.7, gain: 0.05, at: t, sweepTo: 10000 });
  }

  /** Neighbourhood festival: a little zurna fanfare over a davul. */
  festival(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    const seq = [12, 14, 15, 17, 19, 17, 19, 24];
    seq.forEach((s, k) => this.tone(hz(s), 0.16, { at: t + k * 0.11, gain: 0.07, type: 'sawtooth', vibrato: 6 }));
    for (let k = 0; k < 4; k++) this.tone(85, 0.25, { at: t + k * 0.22, gain: 0.3, slideTo: 50 });
  }

  /** A synthesized "miyav": sawtooth through moving formants. */
  meow(pitch = 1): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520 * pitch, t);
    osc.frequency.linearRampToValueAtTime(760 * pitch, t + 0.18);
    osc.frequency.linearRampToValueAtTime(430 * pitch, t + 0.55);
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 6;
    f1.frequency.setValueAtTime(800, t);
    f1.frequency.linearRampToValueAtTime(1500, t + 0.2);
    f1.frequency.linearRampToValueAtTime(700, t + 0.55);
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 8;
    f2.frequency.setValueAtTime(2100, t);
    f2.frequency.linearRampToValueAtTime(2700, t + 0.2);
    f2.frequency.linearRampToValueAtTime(1900, t + 0.55);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
    g.gain.setValueAtTime(0.5, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.connect(f1).connect(g);
    osc.connect(f2).connect(g);
    g.connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  hire(): void {
    if (!this.ready()) return;
    this.meow(1 + (this.rng.next() - 0.5) * 0.2);
    const t = this.ctx!.currentTime;
    this.bell(hz(24), t + 0.45, 0.1, 0.6);
  }

  recipe(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.12, { freq: 3000, q: 0.8, gain: 0.08, at: t, sweepTo: 6000 });
    this.bell(hz(19), t + 0.06, 0.12, 0.7);
    this.bell(hz(24), t + 0.14, 0.1, 0.7);
  }

  /** Seagull cry: "kee-yaa". */
  seagull(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    for (let k = 0; k < 2; k++) {
      const at = t + k * 0.32;
      this.tone(1700, 0.22, { at, gain: 0.07, type: 'triangle', slideTo: 1150, vibrato: 30 });
      this.tone(3400, 0.18, { at, gain: 0.02, type: 'sine', slideTo: 2300 });
    }
  }

  catchGull(): void {
    if (!this.ready()) return;
    this.register();
  }

  /** The ferry horn: a deep, slightly detuned chord. */
  ferryHorn(): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.12);
    g.gain.setValueAtTime(0.22, t + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    f.connect(g).connect(this.sfxBus);
    for (const [fr, type] of [
      [110, 'sawtooth'],
      [110.8, 'sawtooth'],
      [165, 'square'],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(fr, t);
      o.frequency.linearRampToValueAtTime(fr * 0.97, t + 1.5);
      o.connect(f);
      o.start(t);
      o.stop(t + 1.55);
    }
  }

  rush(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.6, { freq: 400, sweepTo: 3000, q: 1, gain: 0.1, at: t });
    [0, 4, 7, 12].forEach((s, k) => this.bell(hz(s + 12), t + 0.1 + k * 0.05, 0.1, 0.5));
  }

  boost(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(220, 0.5, { at: t, gain: 0.1, type: 'sawtooth', slideTo: 880 });
    this.noise(0.5, { freq: 500, sweepTo: 5000, q: 1.5, gain: 0.08, at: t });
    this.bell(hz(24), t + 0.45, 0.12, 0.6);
  }

  gold(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [19, 24, 27, 31].forEach((s, k) => this.bell(hz(s), t + k * 0.05, 0.09, 0.5));
  }

  move(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.8, { freq: 300, sweepTo: 4000, q: 1, gain: 0.12, at: t });
    const seq = [0, 3, 7, 12, 15, 19, 24];
    seq.forEach((s, k) => this.bell(hz(s), t + 0.3 + k * 0.08, 0.13, 0.9));
    this.tone(hz(-12), 1.4, { gain: 0.1, at: t + 0.3, type: 'triangle' });
  }

  purchase(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [12, 15, 19, 24].forEach((s, k) => this.bell(hz(s), t + k * 0.07, 0.12, 0.6));
  }

  error(): void {
    if (!this.ready()) return;
    this.tone(150, 0.14, { gain: 0.14, slideTo: 95, type: 'triangle' });
  }

  whoosh(): void {
    if (!this.ready()) return;
    this.noise(0.25, { freq: 300, sweepTo: 2500, q: 1, gain: 0.08 });
  }

  // ───────────── procedural music: a Nihavend café loop ─────────────

  private startMusic(): void {
    if (!this.ctx || this.musicTimer) return;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setTargetAtTime(0.26, this.ctx.currentTime, 1.5);
    this.nextStep = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 40);
  }

  private stopMusic(): void {
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private pluck(freq: number, at: number, gain: number, len = 0.8): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(freq, at);
    osc2.frequency.setValueAtTime(freq * 1.004, at);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq * 5, at);
    f.frequency.exponentialRampToValueAtTime(freq * 1.1, at + 0.3);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    osc.connect(f);
    osc2.connect(f);
    f.connect(g).connect(this.musicBus);
    osc.start(at);
    osc2.start(at);
    osc.stop(at + len + 0.05);
    osc2.stop(at + len + 0.05);
  }

  private scheduleMusic(): void {
    const ctx = this.ctx!;
    const sixteenth = 60 / 84 / 4;
    while (this.nextStep < ctx.currentTime + 0.15) {
      const t = this.nextStep;
      const step = this.stepIndex % 16;
      const bar = Math.floor(this.stepIndex / 16) % PROGRESSION.length;
      const chord = PROGRESSION[bar];
      // Swing: delay off-beat eighths a little.
      const swing = step % 4 === 2 ? sixteenth * 0.18 : 0;
      // Bendir: low "düm" on 1 and the "and" of 2, "tek" on 3.
      if (step === 0 || step === 6) this.tone(80, 0.3, { at: t, gain: 0.22, slideTo: 48, bus: this.musicBus });
      if (step === 8 || step === 12) this.noise(0.06, { at: t + swing, freq: 2600, q: 2.5, gain: 0.07, bus: this.musicBus });
      if (step % 2 === 1 && this.rng.chance(0.35)) this.noise(0.03, { at: t, freq: 6500, q: 3, gain: 0.025, bus: this.musicBus });
      // Bass on 1 and 3.
      if (step === 0 || step === 8) this.tone(hz(chord.root - 24), sixteenth * 7, { at: t, gain: 0.09, type: 'triangle', attack: 0.02, bus: this.musicBus });
      // Ud arpeggio on eighths, with occasional melodic runs on the Nihavend scale.
      if (step % 2 === 0) {
        let semi = chord.tones[(step / 2) % chord.tones.length] + 12;
        if (this.rng.chance(0.22)) semi = NIHAVEND[this.rng.int(5, 12)];
        this.pluck(hz(semi), t + swing, 0.045 + (step === 0 ? 0.015 : 0));
      }
      // Kanun tremolo flourish at the end of every 4th bar.
      if (bar % 4 === 3 && step >= 12) this.pluck(hz(chord.tones[2] + 24 - (step - 12)), t, 0.025, 0.25);
      this.nextStep += sixteenth;
      this.stepIndex++;
    }
  }
}

export const audio = new AudioEngine();
