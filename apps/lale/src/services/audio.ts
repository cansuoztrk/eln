import { store } from '../meta/state';

/**
 * Procedural sound: gentle UI chimes and looping ambient beds for studying.
 * Everything is synthesised with Web Audio, so the app ships no audio files
 * and works offline. Ambient beds are long noise buffers shaped by filters
 * and slow LFOs; they keep playing while the screen is on.
 */
export type Ambient = 'rain' | 'waves' | 'fire' | 'wind' | 'brown' | 'cafe';
export const AMBIENTS: Ambient[] = ['rain', 'brown', 'waves', 'fire', 'wind', 'cafe'];
/** Ambient beds available without Lale Bahçıvan. */
export const FREE_AMBIENTS: Ambient[] = ['rain', 'brown'];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bed: { stop: () => void; gain: GainNode } | null = null;
  private bedKind: Ambient | null = null;

  private ensure(): AudioContext | null {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Call from a user gesture once so iOS unlocks audio. */
  unlock(): void {
    this.ensure();
  }

  setSuspended(s: boolean): void {
    if (!this.ctx) return;
    if (s && !this.bed) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  private tone(freq: number, at: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.master!);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  private chime(notes: number[], gap: number, vol = 0.18, dur = 0.9): void {
    if (!store.data.settings.sound) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.02;
    notes.forEach((f, i) => {
      this.tone(f, t0 + i * gap, dur, vol);
      this.tone(f * 2, t0 + i * gap, dur * 0.5, vol * 0.25);
    });
  }

  tap(): void {
    this.chime([880], 0, 0.05, 0.08);
  }
  start(): void {
    this.chime([523.25, 659.25, 783.99], 0.09, 0.14);
  }
  plant(): void {
    this.chime([659.25, 783.99, 987.77, 1318.5], 0.11, 0.16, 1.2);
  }
  rare(): void {
    this.chime([523.25, 659.25, 783.99, 1046.5, 1318.5, 1568], 0.08, 0.15, 1.4);
  }
  breakDone(): void {
    this.chime([783.99, 659.25], 0.18, 0.15);
  }
  wilt(): void {
    this.chime([392, 349.23, 293.66], 0.16, 0.12, 0.8);
  }
  save(): void {
    this.chime([987.77, 1318.5], 0.07, 0.08, 0.4);
  }

  // ───────────── ambient beds ─────────────

  private noise(seconds: number, kind: 'white' | 'brown' | 'pink'): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'brown') {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.2;
        } else if (kind === 'pink') {
          b0 = 0.99765 * b0 + w * 0.099046;
          b1 = 0.963 * b1 + w * 0.2965164;
          b2 = 0.57 * b2 + w * 1.0526913;
          d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
        } else d[i] = w * 0.5;
      }
    }
    return buf;
  }

  private loop(buf: AudioBuffer, out: AudioNode): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.connect(out);
    s.start();
    return s;
  }

  private lfo(param: AudioParam, freq: number, depth: number): OscillatorNode {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.value = depth;
    o.connect(g).connect(param);
    o.start();
    return o;
  }

  playAmbient(kind: Ambient | null, volume = store.data.settings.volume): void {
    if (kind === this.bedKind && this.bed) {
      this.bed.gain.gain.setTargetAtTime(volume * 0.5, this.ctx!.currentTime, 0.3);
      return;
    }
    this.stopAmbient();
    if (!kind) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master!);
    const nodes: (AudioScheduledSourceNode)[] = [];
    const timers: number[] = [];
    const filt = (type: BiquadFilterType, f: number, q = 0.7) => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      return b;
    };
    if (kind === 'rain') {
      const hp = filt('highpass', 900);
      const lp = filt('lowpass', 7000);
      hp.connect(lp).connect(gain);
      nodes.push(this.loop(this.noise(6, 'pink'), hp));
      const drops = filt('bandpass', 2600, 2.5);
      const dg = ctx.createGain();
      dg.gain.value = 0.25;
      drops.connect(dg).connect(gain);
      nodes.push(this.loop(this.noise(4, 'white'), drops));
      nodes.push(this.lfo(dg.gain, 0.17, 0.12));
    } else if (kind === 'brown') {
      const lp = filt('lowpass', 500);
      lp.connect(gain);
      nodes.push(this.loop(this.noise(8, 'brown'), lp));
    } else if (kind === 'waves') {
      const lp = filt('lowpass', 900);
      const wg = ctx.createGain();
      wg.gain.value = 0.5;
      lp.connect(wg).connect(gain);
      nodes.push(this.loop(this.noise(8, 'pink'), lp));
      nodes.push(this.lfo(wg.gain, 0.11, 0.45));
      nodes.push(this.lfo(lp.frequency, 0.11, 500));
    } else if (kind === 'wind') {
      const bp = filt('bandpass', 420, 0.9);
      const wg = ctx.createGain();
      wg.gain.value = 0.7;
      bp.connect(wg).connect(gain);
      nodes.push(this.loop(this.noise(8, 'pink'), bp));
      nodes.push(this.lfo(bp.frequency, 0.07, 260));
      nodes.push(this.lfo(wg.gain, 0.05, 0.35));
    } else if (kind === 'fire') {
      const lp = filt('lowpass', 700);
      lp.connect(gain);
      nodes.push(this.loop(this.noise(8, 'brown'), lp));
      const crackle = () => {
        if (this.bedKind !== 'fire' || !this.ctx) return;
        const t = this.ctx.currentTime;
        const n = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.noise(0.03, 'white');
          const bp = filt('bandpass', 1500 + Math.random() * 3500, 3);
          const g = this.ctx.createGain();
          g.gain.value = 0.25 + Math.random() * 0.35;
          src.connect(bp).connect(g).connect(gain);
          src.start(t + i * 0.05 + Math.random() * 0.04);
        }
        timers.push(window.setTimeout(crackle, 120 + Math.random() * 600));
      };
      crackle();
    } else if (kind === 'cafe') {
      // Distant çay ocağı murmur: band-limited babble with slow swells and a rare spoon clink.
      const bp = filt('bandpass', 600, 0.6);
      const cg = ctx.createGain();
      cg.gain.value = 0.6;
      bp.connect(cg).connect(gain);
      nodes.push(this.loop(this.noise(8, 'pink'), bp));
      nodes.push(this.lfo(cg.gain, 0.3, 0.15));
      nodes.push(this.lfo(bp.frequency, 0.21, 180));
      const clink = () => {
        if (this.bedKind !== 'cafe' || !this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.frequency.value = 2900 + Math.random() * 900;
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(gain);
        o.start(t);
        o.stop(t + 0.4);
        timers.push(window.setTimeout(clink, 4000 + Math.random() * 9000));
      };
      timers.push(window.setTimeout(clink, 2500));
    }
    gain.gain.setTargetAtTime(volume * 0.5, ctx.currentTime, 0.8);
    this.bedKind = kind;
    this.bed = {
      gain,
      stop: () => {
        timers.forEach((t) => clearTimeout(t));
        const now = ctx.currentTime;
        gain.gain.setTargetAtTime(0, now, 0.25);
        setTimeout(() => {
          for (const n of nodes) {
            try {
              n.stop();
            } catch {
              /* already stopped */
            }
          }
          gain.disconnect();
        }, 900);
      },
    };
  }

  stopAmbient(): void {
    this.bed?.stop();
    this.bed = null;
    this.bedKind = null;
  }

  get ambient(): Ambient | null {
    return this.bedKind;
  }
}

export const audio = new AudioEngine();
