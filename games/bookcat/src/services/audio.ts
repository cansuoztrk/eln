/**
 * Fully synthesized audio (Web Audio API): no audio files to license and a
 * tiny download. The sounds of an old bookshop: page flips, cards sliding on
 * a wooden table, a little bell when a shelf is complete, Tekir's meow. The
 * background track is a procedural late-evening jazz loop (soft electric
 * piano, upright bass, brushed snare).
 */
import { Rng } from '../core/rng';

const A3 = 220;
const hz = (semi: number) => A3 * Math.pow(2, semi / 12);
// Pentatonic over the progression for the melody fragments (semitones from A3).
const PENTA = [3, 5, 7, 10, 12, 15, 17, 19, 22, 24];

/** ii–V–I–vi in C with 7ths/9ths (semitones from A3) — 8 bars, two per chord. */
const PROGRESSION: ReadonlyArray<{ root: number; tones: number[] }> = [
  { root: 5, tones: [5, 8, 12, 15] }, // Dm7
  { root: 5, tones: [5, 8, 12, 15] },
  { root: 10, tones: [10, 14, 17, 20] }, // G7
  { root: 10, tones: [10, 14, 17, 20] },
  { root: 3, tones: [3, 7, 10, 14] }, // Cmaj7
  { root: 3, tones: [3, 7, 10, 14] },
  { root: 0, tones: [0, 3, 7, 10] }, // Am7
  { root: 0, tones: [0, 3, 7, 10] },
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
    this.tone(1300, 0.05, { gain: 0.05, type: 'triangle' });
  }

  /** A card turned over (stock draw / reveal): a short paper flick. */
  flip(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.09, { freq: 2600, sweepTo: 5200, q: 1.2, gain: 0.09, at: t });
  }

  /** A card set down on the table. */
  place(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.06, { freq: 900, q: 1.4, gain: 0.12, at: t, type: 'lowpass' });
    this.tone(180, 0.08, { gain: 0.07, at: t, type: 'triangle', slideTo: 120 });
  }

  /** A word shelved on its category: paper slide + soft bell rising with progress. */
  shelve(progress = 0): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.12, { freq: 1800, sweepTo: 3600, q: 1, gain: 0.07, at: t });
    this.bell(hz(15 + Math.round(progress * 9)), t + 0.03, 0.08, 0.45);
  }

  /** A shelf is complete: a little shop-door bell arpeggio. */
  complete(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [15, 19, 22, 27, 31].forEach((s, k) => this.bell(hz(s), t + k * 0.06, 0.11, 0.7));
  }

  win(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [3, 7, 10, 15, 19, 22, 27].forEach((s, k) => this.bell(hz(s), t + k * 0.09, 0.12, 0.9));
    this.tone(hz(-9), 1.6, { gain: 0.1, at: t + 0.5, type: 'triangle' });
    this.meow(1.15, t + 0.9);
  }

  lose(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [12, 10, 7, 3].forEach((s, k) => this.tone(hz(s), 0.32, { gain: 0.08, at: t + k * 0.16, type: 'triangle' }));
  }

  meow(pitch = 1, at?: number): void {
    if (!this.ready()) return;
    const t = at ?? this.ctx!.currentTime;
    this.tone(520 * pitch, 0.38, { at: t, gain: 0.07, type: 'sawtooth', slideTo: 780 * pitch, attack: 0.04, vibrato: 14 });
    this.tone(780 * pitch, 0.22, { at: t + 0.22, gain: 0.05, type: 'triangle', slideTo: 430 * pitch });
  }

  coin(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.bell(hz(27), t, 0.09, 0.3);
    this.bell(hz(34), t + 0.06, 0.08, 0.4);
  }

  booster(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.4, { freq: 600, sweepTo: 4800, q: 1.4, gain: 0.07, at: t });
    [12, 19, 24].forEach((s, k) => this.bell(hz(s), t + 0.15 + k * 0.07, 0.09, 0.5));
  }

  purchase(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [12, 15, 19, 24].forEach((s, k) => this.bell(hz(s), t + k * 0.07, 0.12, 0.6));
  }

  error(): void {
    if (!this.ready()) return;
    this.tone(160, 0.13, { gain: 0.12, slideTo: 100, type: 'triangle' });
  }

  whoosh(): void {
    if (!this.ready()) return;
    this.noise(0.25, { freq: 300, sweepTo: 2500, q: 1, gain: 0.07 });
  }

  // ───────────── procedural music: late-evening bookshop jazz ─────────────

  private startMusic(): void {
    if (!this.ctx || this.musicTimer) return;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setTargetAtTime(0.24, this.ctx.currentTime, 1.5);
    this.nextStep = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 40);
  }

  private stopMusic(): void {
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  /** Soft electric-piano voice (two detuned sines + a bell partial). */
  private keys(freq: number, at: number, gain: number, len = 1.6): void {
    this.tone(freq, len, { at, gain, type: 'sine', attack: 0.01, bus: this.musicBus });
    this.tone(freq * 1.003, len * 0.9, { at, gain: gain * 0.6, type: 'triangle', attack: 0.01, bus: this.musicBus });
    this.tone(freq * 4.02, 0.25, { at, gain: gain * 0.12, type: 'sine', bus: this.musicBus });
  }

  private scheduleMusic(): void {
    const ctx = this.ctx!;
    const eighth = 60 / 72 / 2;
    while (this.nextStep < ctx.currentTime + 0.15) {
      const t = this.nextStep;
      const step = this.stepIndex % 8;
      const bar = Math.floor(this.stepIndex / 8) % PROGRESSION.length;
      const chord = PROGRESSION[bar];
      const swing = step % 2 === 1 ? eighth * 0.22 : 0;
      // Brushed snare on 2 and 4, soft ride swish on the off-beats.
      if (step === 2 || step === 6) this.noise(0.18, { at: t, freq: 1800, q: 0.7, gain: 0.05, bus: this.musicBus });
      if (step % 2 === 1) this.noise(0.05, { at: t + swing, freq: 7000, q: 2, gain: 0.018, bus: this.musicBus });
      // Walking bass: root, fifth, approach.
      if (step % 2 === 0) {
        const walk = [0, 7, 3, 5][step / 2];
        this.tone(hz(chord.root + walk - 24), eighth * 1.8, { at: t, gain: 0.08, type: 'triangle', attack: 0.015, bus: this.musicBus });
      }
      // Comped chord on beat 1 (and a push on the "and" of 3 every other bar).
      if (step === 0 || (step === 5 && bar % 2 === 1)) {
        chord.tones.forEach((s) => this.keys(hz(s + 12), t + swing, 0.022, step === 0 ? 1.8 : 0.9));
      }
      // Sparse melody fragments.
      if (step % 2 === 1 && this.rng.chance(0.28)) this.keys(hz(PENTA[this.rng.int(2, 9)] + 12), t + swing, 0.03, 0.7);
      this.nextStep += eighth;
      this.stepIndex++;
    }
  }
}

export const audio = new AudioEngine();
