/*
  Ses: kalp atışı ve her gün başka çalan yumuşak bir piyano.
  Hepsi tarayıcıda üretilir; dışarıdan ses dosyası yok.
*/
import { mulberry32, hash } from './zaman.js';

const NOTA = (n) => 440 * Math.pow(2, (n - 69) / 12);
// Fa minör / La bemol majör renginde dört akor (MIDI)
const AKORLAR = [
  { bas: 41, ton: [53, 56, 60, 63, 67] }, // Fm9
  { bas: 37, ton: [49, 53, 56, 60, 65] }, // Dbmaj7
  { bas: 44, ton: [51, 56, 58, 60, 63] }, // Ab(add9)
  { bas: 39, ton: [51, 56, 58, 63, 65] }, // Ebsus4(add9)
];
const PENTA = [68, 70, 72, 75, 77, 80, 82, 84]; // Ab Bb C Eb F Ab Bb C

export class Ses {
  constructor() {
    this.ctx = null;
    this.acik = false;
    this.calisiyor = false;
    this.tohum = 1;
  }

  hazirla() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.ana = ctx.createGain();
    this.ana.gain.value = 0;
    const komp = ctx.createDynamicsCompressor();
    komp.threshold.value = -18;
    komp.ratio.value = 3;
    const filtre = ctx.createBiquadFilter();
    filtre.type = 'lowpass';
    filtre.frequency.value = 5200;
    this.ana.connect(filtre).connect(komp).connect(ctx.destination);

    // Yankı: kendiliğinden üretilmiş bir oda
    const uzun = 4.6;
    const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * uzun), ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2);
    }
    this.yanki = ctx.createConvolver();
    this.yanki.buffer = ir;
    this.islak = ctx.createGain();
    this.islak.gain.value = 0.42;
    this.kuru = ctx.createGain();
    this.kuru.gain.value = 0.7;
    this.muzik = ctx.createGain();
    this.muzik.gain.value = 0.0;
    this.muzik.connect(this.kuru).connect(this.ana);
    this.muzik.connect(this.yanki).connect(this.islak).connect(this.ana);

    this.kalpYolu = ctx.createGain();
    this.kalpYolu.gain.value = 0.9;
    this.kalpYolu.connect(this.ana);
  }

  async ac() {
    this.hazirla();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {});
    const t = this.ctx.currentTime;
    this.ana.gain.cancelScheduledValues(t);
    this.ana.gain.setValueAtTime(this.ana.gain.value, t);
    this.ana.gain.linearRampToValueAtTime(0.85, t + 1.2);
    this.acik = true;
  }

  kapat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ana.gain.cancelScheduledValues(t);
    this.ana.gain.setValueAtTime(this.ana.gain.value, t);
    this.ana.gain.linearRampToValueAtTime(0, t + 0.8);
    this.acik = false;
  }

  // Bir kalp atışı: lub-dub
  kalp(guc = 1) {
    if (!this.ctx || !this.acik) return;
    const ctx = this.ctx;
    const vur = (t, g) => {
      const o = ctx.createOscillator();
      const v = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 140;
      o.type = 'sine';
      o.frequency.setValueAtTime(62, t);
      o.frequency.exponentialRampToValueAtTime(36, t + 0.16);
      v.gain.setValueAtTime(0.0001, t);
      v.gain.exponentialRampToValueAtTime(g, t + 0.018);
      v.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      o.connect(f).connect(v).connect(this.kalpYolu);
      o.start(t);
      o.stop(t + 0.3);
    };
    const t = ctx.currentTime + 0.01;
    vur(t, 0.9 * guc);
    vur(t + 0.27, 0.55 * guc);
  }

  // Tek bir piyano notası
  nota(midi, t, hiz = 0.5, sure = 4) {
    const ctx = this.ctx;
    const f = NOTA(midi);
    const v = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(5200, f * 7), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(380, f * 1.6), t + 1.6);
    const sapma = (Math.random() - 0.5) * 6;
    const parcalar = [
      ['triangle', 1, 1],
      ['sine', 2, 0.22],
      ['sine', 3, 0.06],
    ];
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(hiz * 0.22, t + 0.012);
    v.gain.exponentialRampToValueAtTime(hiz * 0.08, t + 0.5);
    v.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    v.connect(lp).connect(this.muzik);
    for (const [tip, kat, kaz] of parcalar) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = tip;
      o.frequency.value = f * kat;
      o.detune.value = sapma;
      g.gain.value = kaz;
      o.connect(g).connect(v);
      o.start(t);
      o.stop(t + sure + 0.1);
    }
  }

  // Bugünün melodisi: tohum günün tarihinden gelir
  muzigiBaslat(gunAnahtari) {
    this.hazirla();
    if (!this.ctx || this.calisiyor) return;
    this.calisiyor = true;
    this.tohum = hash('melodi:' + gunAnahtari);
    const r = mulberry32(this.tohum);
    // Günün motifi: sekiz adımlık yumuşak bir yürüyüş
    let k = 2 + Math.floor(r() * 3);
    this.motif = Array.from({ length: 8 }, () => {
      k = Math.max(0, Math.min(PENTA.length - 1, k + [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)]));
      return r() < 0.28 ? null : PENTA[k];
    });
    const t = this.ctx.currentTime;
    this.muzik.gain.cancelScheduledValues(t);
    this.muzik.gain.setValueAtTime(0.0001, t);
    this.muzik.gain.linearRampToValueAtTime(0.9, t + 5);
    this.olcu = 0;
    this.siradaki = t + 0.2;
    const BPM = 62;
    this.vurus = 60 / BPM;
    const planla = () => {
      if (!this.calisiyor) return;
      while (this.siradaki < this.ctx.currentTime + 1.2) {
        this.olcuCal(this.siradaki, this.olcu++, r);
        this.siradaki += this.vurus * 4;
      }
      this.zaman = setTimeout(planla, 300);
    };
    planla();
  }

  olcuCal(t, i, r) {
    const a = AKORLAR[i % 4];
    const v = this.vurus;
    this.nota(a.bas, t, 0.55, 6);
    this.nota(a.bas + 12, t + 0.02, 0.28, 5);
    // Arpej: sekizlikler, bazıları boş
    const sira = [0, 2, 1, 3, 2, 4, 3, 1];
    for (let s = 0; s < 8; s++) {
      if (r() < 0.32) continue;
      this.nota(a.ton[sira[s] % a.ton.length], t + s * (v / 2) + (r() - 0.5) * 0.02, 0.18 + r() * 0.12, 3.6);
    }
    // Melodi: iki ölçüde bir, motif biraz değişerek
    if (i % 2 === 1 || i > 7) {
      const yarim = (i % 4) < 2 ? 0 : 4;
      for (let s = 0; s < 4; s++) {
        const n = this.motif[yarim + s];
        if (n == null || r() < 0.18) continue;
        this.nota(n + (i > 15 && r() < 0.2 ? 12 : 0), t + s * v + (r() - 0.5) * 0.03, 0.34 + r() * 0.12, 4.5);
      }
    }
  }

  muzigiDurdur() {
    this.calisiyor = false;
    clearTimeout(this.zaman);
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.muzik.gain.cancelScheduledValues(t);
    this.muzik.gain.setValueAtTime(this.muzik.gain.value, t);
    this.muzik.gain.linearRampToValueAtTime(0.0001, t + 1.5);
  }

  // Kısa, parıltılı bir akor (mektup açılırken, sarılınca)
  pirilti(yukseklik = 0) {
    if (!this.ctx || !this.acik) return;
    const t = this.ctx.currentTime + 0.02;
    [68, 72, 75, 80].forEach((n, i) => this.nota(n + yukseklik, t + i * 0.09, 0.22, 3.2));
  }
}
