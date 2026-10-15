/**
 * Fully synthesized audio (Web Audio API): no audio files to license, tiny
 * download size. SFX use a Hicaz-makam scale so every combo sounds like the
 * bazaar; the background track is a procedural darbuka + plucked-oud loop.
 */
import { Rng } from '../core/rng';

// D Hicaz: D Eb F# G A Bb C D (as semitone offsets from D4)
const HICAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19, 20, 22, 24];
const D4 = 293.66;
const hz = (semi: number) => D4 * Math.pow(2, semi / 12);

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private sfxOn = true;
  private musicOn = true;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextBeat = 0;
  private beatIndex = 0;
  private phrase: number[] = [];
  private musicRng = new Rng(20261015);
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
      this.sfxBus.gain.value = 0.8;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.0;
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

  /** App went to background / came back. */
  setSuspended(s: boolean): void {
    this.suspended = s;
    if (!this.ctx) return;
    if (s) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  // ───────────── primitives ─────────────

  private tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; at?: number; slideTo?: number; attack?: number; bus?: GainNode } = {}): void {
    const ctx = this.ctx!;
    const t = opts.at ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
    const peak = opts.gain ?? 0.2;
    const a = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(opts.bus ?? this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, opts: { freq?: number; q?: number; type?: BiquadFilterType; gain?: number; at?: number; sweepTo?: number; bus?: GainNode } = {}): void {
    const ctx = this.ctx!;
    const t = opts.at ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'bandpass';
    f.frequency.setValueAtTime(opts.freq ?? 2000, t);
    if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + dur);
    f.Q.value = opts.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(opts.gain ?? 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(opts.bus ?? this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  private bell(freq: number, at: number, gain = 0.16, dur = 0.55): void {
    this.tone(freq, dur, { at, gain, type: 'sine' });
    this.tone(freq * 2.01, dur * 0.6, { at, gain: gain * 0.35, type: 'sine' });
    this.tone(freq * 3.02, dur * 0.3, { at, gain: gain * 0.12, type: 'triangle' });
  }

  private ready(): boolean {
    return !!this.ctx && this.sfxOn && !this.suspended;
  }

  // ───────────── SFX ─────────────

  tap(): void {
    if (!this.ready()) return;
    this.tone(1100, 0.05, { gain: 0.08, slideTo: 700, type: 'triangle' });
  }

  pick(): void {
    if (!this.ready()) return;
    this.tone(hz(7), 0.09, { gain: 0.12, type: 'triangle', slideTo: hz(12) });
  }

  place(): void {
    if (!this.ready()) return;
    this.noise(0.04, { freq: 1700, q: 3, gain: 0.35 });
    this.tone(190, 0.1, { gain: 0.22, slideTo: 120 });
  }

  invalid(): void {
    if (!this.ready()) return;
    this.tone(150, 0.14, { gain: 0.16, slideTo: 95, type: 'triangle' });
  }

  clear(lines: number, combo: number): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    const start = Math.min(HICAZ.length - 6, Math.max(0, combo - 1));
    const notes = Math.min(6, lines + 2);
    for (let k = 0; k < notes; k++) {
      this.bell(hz(HICAZ[start + k]), t + k * 0.055, 0.14 + k * 0.01);
    }
    this.noise(0.35, { freq: 6000, q: 0.7, gain: 0.05 + lines * 0.02, at: t, sweepTo: 9000 });
    if (lines >= 2) this.tone(hz(-12), 0.35, { gain: 0.18, at: t, type: 'sine' });
  }

  combo(level: number): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.4, { freq: 400, sweepTo: 4000, q: 1.5, gain: 0.12, at: t });
    const top = HICAZ[Math.min(HICAZ.length - 1, 4 + level)];
    this.bell(hz(top), t + 0.12, 0.18, 0.8);
  }

  coin(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(1318, 0.08, { gain: 0.1, at: t, type: 'square' });
    this.tone(1760, 0.18, { gain: 0.09, at: t + 0.07, type: 'square' });
  }

  star(i: number): void {
    if (!this.ready()) return;
    this.bell(hz(HICAZ[7 + i * 2]), this.ctx!.currentTime, 0.2, 0.9);
  }

  win(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    const seq = [0, 4, 5, 7, 12];
    seq.forEach((s, k) => this.bell(hz(s), t + k * 0.11, 0.18, 0.7));
    this.tone(hz(-12), 1.2, { gain: 0.12, at: t, type: 'triangle' });
  }

  lose(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [7, 5, 4, 1].forEach((s, k) => this.tone(hz(s - 12), 0.35, { gain: 0.14, at: t + k * 0.16, type: 'triangle' }));
  }

  bomb(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(0.6, { type: 'lowpass', freq: 1800, sweepTo: 80, gain: 0.6, at: t });
    this.tone(130, 0.5, { gain: 0.35, slideTo: 38, at: t });
  }

  hammer(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(880, 0.12, { gain: 0.08, type: 'square', at: t, slideTo: 600 });
    this.noise(0.08, { freq: 3500, q: 2, gain: 0.3, at: t });
  }

  whoosh(): void {
    if (!this.ready()) return;
    this.noise(0.3, { freq: 300, sweepTo: 3000, q: 1, gain: 0.1 });
  }

  tick(): void {
    if (!this.ready()) return;
    this.noise(0.02, { freq: 4000, q: 4, gain: 0.25 });
  }

  purchase(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [12, 16, 19, 24].forEach((s, k) => this.bell(hz(s), t + k * 0.07, 0.12, 0.6));
  }

  // ───────────── procedural music ─────────────

  private startMusic(): void {
    if (!this.ctx || this.musicTimer) return;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setTargetAtTime(0.32, this.ctx.currentTime, 1.5);
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 40);
  }

  private stopMusic(): void {
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  /** Builds a 16-step melodic phrase on the Hicaz scale with a motif structure. */
  private newPhrase(): number[] {
    const r = this.musicRng;
    const motif: number[] = [];
    let deg = r.int(2, 5);
    for (let i = 0; i < 8; i++) {
      if (r.chance(0.3)) motif.push(-1);
      else {
        deg = Math.max(0, Math.min(9, deg + r.pick([-2, -1, -1, 1, 1, 2, 0])));
        motif.push(deg);
      }
    }
    // A A' : repeat the motif, resolving to the tonic on the last note.
    const answer = motif.map((d, i) => (i === 7 ? 0 : d >= 0 && r.chance(0.4) ? Math.max(0, d - 1) : d));
    return [...motif, ...answer];
  }

  private pluck(freq: number, at: number, gain: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(freq, at);
    osc2.frequency.setValueAtTime(freq * 1.003, at);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq * 6, at);
    f.frequency.exponentialRampToValueAtTime(freq * 1.2, at + 0.35);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);
    osc.connect(f);
    osc2.connect(f);
    f.connect(g).connect(this.musicBus);
    osc.start(at);
    osc2.start(at);
    osc.stop(at + 0.75);
    osc2.stop(at + 0.75);
  }

  private scheduleMusic(): void {
    const ctx = this.ctx!;
    const spb = 60 / 96 / 2; // eighth notes at 96 bpm
    while (this.nextBeat < ctx.currentTime + 0.15) {
      const step = this.beatIndex % 16;
      const t = this.nextBeat;
      // Maqsum-ish darbuka: D T . T D . T .
      const pattern = 'DT.TD.T.';
      const hit = pattern[step % 8];
      if (hit === 'D') {
        this.tone(95, 0.22, { at: t, gain: 0.26, slideTo: 55, bus: this.musicBus });
      } else if (hit === 'T') {
        this.noise(0.05, { at: t, freq: 3200, q: 2.5, gain: 0.12, bus: this.musicBus });
      }
      if (step % 2 === 1 && this.musicRng.chance(0.25)) {
        this.noise(0.03, { at: t, freq: 5200, q: 3, gain: 0.05, bus: this.musicBus });
      }
      // Drone every bar
      if (step === 0) {
        this.tone(hz(-24), spb * 16, { at: t, gain: 0.05, type: 'triangle', attack: 0.4, bus: this.musicBus });
        this.tone(hz(-17), spb * 16, { at: t, gain: 0.03, type: 'sine', attack: 0.6, bus: this.musicBus });
      }
      // Melody
      if (step === 0 && (this.beatIndex / 16) % 4 === 0) this.phrase = this.newPhrase();
      const deg = this.phrase[step];
      if (deg !== undefined && deg >= 0) this.pluck(hz(HICAZ[deg]), t, 0.07);
      this.nextBeat += spb;
      this.beatIndex++;
    }
  }
}

export const audio = new AudioEngine();
