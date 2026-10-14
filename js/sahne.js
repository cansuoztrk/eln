/*
  Sahne: binlerce ışık zerresi. Adın, bir kalp, iki şehir ya da bir gökyüzü olurlar.
  WebGL 1; desteklenmezse sayfa zerresiz ama eksiksiz çalışır.
*/
const VS = `
attribute vec3 aA;
attribute vec3 aB;
attribute vec3 aC;
attribute vec3 aD;
attribute vec3 aE;
attribute vec4 aR;
uniform vec3 uPrevA;
uniform vec3 uPrevB;
uniform vec3 uNextA;
uniform vec3 uNextB;
uniform float uT;
uniform float uTime;
uniform float uAspect;
uniform vec2 uPointer;
uniform float uPointerG;
uniform float uHug;
uniform float uDpr;
uniform float uDim;
uniform float uScroll;
uniform float uPulse;
uniform vec4 uKart;
uniform vec3 uRenkA;
uniform vec3 uRenkB;
uniform float uGuc;
varying float vAlpha;
varying vec3 vColor;
varying float vYaprak;
varying float vAci;
float ease(float t){ return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t + 2.0, 3.0) / 2.0; }
void main(){
  float st = clamp((uT - aR.x * 0.42) / 0.58, 0.0, 1.0);
  float e = ease(st);
  vec3 wa = mix(uPrevA, uNextA, e);
  vec3 wb = mix(uPrevB, uNextB, e);
  vec4 w = vec4(wa, wb.x);
  vec3 c = aC;
  c.x *= (1.0 - uHug * 0.985);
  c.y *= (1.0 - uHug * 0.6);
  vec3 sky = aD;
  // Gökyüzünde zerrelerin bir kısmı zambak yaprağıdır: yavaşça süzülerek düşer
  float yaprakMi = step(aR.x, 0.085);
  float hiz = yaprakMi * (0.014 + aR.z * 0.018) + 0.002;
  sky.y = mod(sky.y + 1.2 - uScroll * (0.08 + 0.12 * (sky.z + 1.0)) - uTime * hiz, 2.4) - 1.2;
  sky.x += yaprakMi * sin(uTime * 0.45 + aR.z * 30.0) * 0.05;
  vec3 p = aA * w.x + aB * w.y + c * w.z + sky * w.w + vec3(uKart.xy + aE.xy * uKart.zw, aE.z) * wb.y;
  float bump = sin(3.14159 * e) * (0.10 + aR.x * 0.28);
  p.x += sin(aR.z * 6.2831 + uTime * 0.9) * bump;
  p.y += cos(aR.z * 5.1 + uTime * 0.7) * bump;
  float br = 0.005 + 0.01 * w.w;
  p.x += sin(uTime * 0.35 + aR.z * 40.0) * br;
  p.y += cos(uTime * 0.3 + aR.z * 31.0) * br;
  float beat = uPulse * (w.y + w.z) * 0.035 * (0.6 + aR.x);
  p.xy *= 1.0 + beat;
  vec2 clip = vec2(p.x / uAspect, p.y);
  vec2 d = clip - uPointer;
  float dist = length(vec2(d.x * uAspect, d.y));
  float push = uPointerG * smoothstep(0.34, 0.0, dist) * 0.13;
  clip += normalize(d + vec2(0.00001)) * push;
  gl_Position = vec4(clip, 0.0, 1.0);
  float depth = 1.0 / (1.25 - p.z * 0.4);
  vYaprak = yaprakMi * w.w;
  vAci = aR.z * 6.2831 + uTime * (0.25 + aR.x * 3.0) * (aR.w > 0.5 ? 1.0 : -1.0);
  gl_PointSize = aR.y * uDpr * 2.3 * depth * (1.0 - 0.3 * w.w) * mix(1.0, 6.0, vYaprak);
  float tw = 0.7 + 0.3 * sin(uTime * (1.1 + aR.x * 2.2) + aR.z * 20.0);
  vAlpha = min(1.0, tw * uDim * uGuc * (0.5 + 0.5 * depth) * (1.0 - 0.4 * w.w) * (1.0 + uPulse * 0.6));
  vColor = mix(uRenkA, uRenkB, aR.w);
  vColor = mix(vColor, vec3(1.0, 0.95, 0.96), step(0.94, aR.x) * 0.7);
}`;

const FS = `
precision mediump float;
uniform float uCekirdek;
uniform vec3 uYaprakA;
uniform vec3 uYaprakB;
varying float vAlpha;
varying vec3 vColor;
varying float vYaprak;
varying float vAci;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  if (vYaprak > 0.5) {
    float c = cos(vAci);
    float s = sin(vAci);
    q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
    float y = q.y;
    float g = 0.17 * (1.0 - smoothstep(-0.44, 0.46, y) * 0.8) + 0.03;
    float kenar = 1.0 - smoothstep(0.7, 1.0, abs(q.x) / g);
    float boy = 1.0 - smoothstep(0.36, 0.46, abs(y));
    float a = kenar * boy;
    vec3 renk = mix(uYaprakA, uYaprakB, smoothstep(-0.4, 0.35, y));
    renk *= 0.88 + 0.12 * (1.0 - abs(q.x) / g);
    gl_FragColor = vec4(renk * a * vAlpha, a * vAlpha);
    return;
  }
  float r = length(q);
  float a = smoothstep(0.5, 0.0, r);
  a *= a;
  float core = smoothstep(0.16, 0.0, r);
  vec3 col = vColor * a + vec3(1.0) * core * uCekirdek;
  gl_FragColor = vec4(col * vAlpha, a * vAlpha);
}`;

const SEKILLER = ['ad', 'kalp', 'ikiz', 'gok', 'kart', '_'];
// Gece: parlayan gül altını zerreler (ışık toplanır). Gündüz: pudra zeminde koyu gül, inci yapraklar.
const TEMALAR = {
  koyu: { a: [0.98, 0.8, 0.68], b: [0.98, 0.62, 0.74], c: 0.45, ya: [0.86, 0.36, 0.55], yb: [0.98, 0.78, 0.86], karisim: 'ekle', g: 1.0 },
  acik: { a: [0.66, 0.28, 0.36], b: [0.74, 0.16, 0.4], c: 0.0, ya: [0.93, 0.5, 0.65], yb: [1.0, 0.92, 0.94], karisim: 'ust', g: 1.7 },
};

export class Sahne {
  constructor(canvas) {
    this.c = canvas;
    this.ok = false;
    this.t0 = performance.now();
    this.prev = [0, 0, 0, 1, 0, 0];
    this.next = [0, 0, 0, 1, 0, 0];
    this.mt = 1;
    this.hedefAd = 'gok';
    this.hug = 0;
    this.dim = 0;
    this.dimHedef = 1;
    this.ptr = [9, 9];
    this.ptrG = 0;
    this.scroll = 0;
    this.pulse = 0;
    this.yazi = 'Eln';
    this.kart = [0, 0.05, 0.6, 0.5];
    this.renkler = TEMALAR.koyu;
  }

  baslat() {
    const gl = this.c.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) return false;
    this.gl = gl;
    const sh = (tip, kaynak) => {
      const s = gl.createShader(tip);
      gl.shaderSource(s, kaynak);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    try {
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      this.p = p;
    } catch (e) {
      console.warn('Sahne kurulamadı', e);
      return false;
    }
    gl.useProgram(this.p);
    this.u = {};
    for (const n of ['uPrevA', 'uPrevB', 'uNextA', 'uNextB', 'uT', 'uTime', 'uAspect', 'uPointer', 'uPointerG', 'uHug', 'uDpr', 'uDim', 'uScroll', 'uPulse', 'uKart', 'uRenkA', 'uRenkB', 'uCekirdek', 'uYaprakA', 'uYaprakB', 'uGuc']) this.u[n] = gl.getUniformLocation(this.p, n);
    this.a = {};
    for (const n of ['aA', 'aB', 'aC', 'aD', 'aE', 'aR']) this.a[n] = gl.getAttribLocation(this.p, n);
    this.buf = {};
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.disable(gl.DEPTH_TEST);

    const az = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.az = az;
    const kucuk = Math.min(innerWidth, innerHeight) < 600;
    this.N = az ? 1400 : kucuk ? 2600 : 4600;
    this.boyutla();
    this.kur();
    this.ok = true;

    let rt;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const eski = this.aspect;
        this.boyutla();
        if (Math.abs(eski - this.aspect) > 0.04) this.kur();
      }, 180);
    });
    const ptr = (e) => {
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = -((e.clientY / innerHeight) * 2 - 1);
      this.ptr = [x, y];
      this.ptrG = 1;
    };
    addEventListener('pointermove', ptr, { passive: true });
    addEventListener('pointerdown', ptr, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.t0 = performance.now() - this.zaman * 1000;
    });
    this.zaman = 0;
    const dongu = (now) => {
      this.kare(now);
      this.raf = requestAnimationFrame(dongu);
    };
    this.raf = requestAnimationFrame(dongu);
    return true;
  }

  boyutla() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.c.width = Math.floor(innerWidth * dpr);
    this.c.height = Math.floor(innerHeight * dpr);
    this.aspect = innerWidth / innerHeight;
    this.gl.viewport(0, 0, this.c.width, this.c.height);
  }

  // Yazıyı zerrelere çevir
  yaziNoktalari(N, aspect) {
    const cv = document.createElement('canvas');
    const W = 900;
    const H = 420;
    cv.width = W;
    cv.height = H;
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = 'italic 500 330px "Cormorant Garamond", Georgia, serif';
    x.fillText(this.yazi, W / 2, H / 2 + 10);
    const d = x.getImageData(0, 0, W, H).data;
    const pts = [];
    let minX = W, maxX = 0, minY = H, maxY = 0;
    for (let y = 0; y < H; y += 2)
      for (let xx = 0; xx < W; xx += 2)
        if (d[(y * W + xx) * 4 + 3] > 140) {
          pts.push([xx, y]);
          if (xx < minX) minX = xx;
          if (xx > maxX) maxX = xx;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
    const out = new Float32Array(N * 3);
    if (!pts.length) return out;
    const gw = maxX - minX || 1;
    const gh = maxY - minY || 1;
    const hedefG = Math.min(aspect * 2 * 0.78, 1.5);
    const s = Math.min(hedefG / gw, 0.62 / gh);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    for (let i = 0; i < N; i++) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      out[i * 3] = (p[0] - cx + Math.random() * 2) * s;
      out[i * 3 + 1] = -(p[1] - cy + Math.random() * 2) * s + 0.2;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return out;
  }

  kur() {
    const gl = this.gl;
    const N = this.N;
    const a = this.aspect;
    const A = this.yaziNoktalari(N, a);
    const B = new Float32Array(N * 3);
    const C = new Float32Array(N * 3);
    const D = new Float32Array(N * 3);
    const E = new Float32Array(N * 3);
    const R = new Float32Array(N * 4);
    const ks = Math.min(a * 0.95, 0.95) * 0.042;
    const kenar = Math.min(a * 0.66, 0.92);
    for (let i = 0; i < N; i++) {
      // Kalp: kenarda yoğun, içi seyrek
      const t = Math.random() * Math.PI * 2;
      const ic = Math.random() < 0.55 ? 1 : Math.sqrt(Math.random()) * 0.95;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      B[i * 3] = hx * ks * ic + (Math.random() - 0.5) * 0.012;
      B[i * 3 + 1] = hy * ks * ic + 0.08 + (Math.random() - 0.5) * 0.012;
      B[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      // İki şehir ve aralarındaki ince ışık yolu
      const r = Math.random();
      if (r < 0.7) {
        const yan = r < 0.35 ? -1 : 1;
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.pow(Math.random(), 1.8) * 0.12;
        C[i * 3] = yan * kenar + Math.cos(ang) * rad;
        C[i * 3 + 1] = 0.06 + Math.sin(ang) * rad;
      } else {
        const u = Math.random();
        const x = -kenar + 2 * kenar * u;
        C[i * 3] = x + (Math.random() - 0.5) * 0.01;
        C[i * 3 + 1] = 0.06 + Math.sin(u * Math.PI) * 0.32 + (Math.random() - 0.5) * 0.012;
      }
      C[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      // Gökyüzü
      D[i * 3] = (Math.random() * 2 - 1) * a * 1.12;
      D[i * 3 + 1] = Math.random() * 2.4 - 1.2;
      D[i * 3 + 2] = Math.random() * 2 - 1;
      // Mektup kâğıdı: açılışta zerreler buradan doğar
      E[i * 3] = Math.random() * 2 - 1;
      E[i * 3 + 1] = Math.random() * 2 - 1;
      E[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      // Rastgele: gecikme, boyut, faz, renk
      R[i * 4] = Math.random();
      R[i * 4 + 1] = 0.55 + Math.pow(Math.random(), 3) * 1.9;
      R[i * 4 + 2] = Math.random();
      R[i * 4 + 3] = Math.random() < 0.3 ? 0.4 + Math.random() * 0.6 : Math.random() * 0.25;
    }
    const yukle = (ad, veri, boyut) => {
      if (!this.buf[ad]) this.buf[ad] = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf[ad]);
      gl.bufferData(gl.ARRAY_BUFFER, veri, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.a[ad]);
      gl.vertexAttribPointer(this.a[ad], boyut, gl.FLOAT, false, 0, 0);
    };
    yukle('aA', A, 3);
    yukle('aB', B, 3);
    yukle('aC', C, 3);
    yukle('aD', D, 3);
    yukle('aE', E, 3);
    yukle('aR', R, 4);
  }

  async yaziHazirla(yazi) {
    this.yazi = yazi;
    try {
      await document.fonts.load('italic 500 120px "Cormorant Garamond"');
    } catch (e) {}
    if (this.ok) this.kur();
  }

  hedef(ad, sure = 2.6, zorla = false) {
    if (ad === this.hedefAd && !zorla) return;
    const e = this.mt >= 1 ? 1 : this.mt;
    this.prev = this.prev.map((v, i) => v + (this.next[i] - v) * e);
    this.next = SEKILLER.map((s) => (s === ad ? 1 : 0));
    this.mt = 0;
    this.msure = sure;
    this.hedefAd = ad;
  }

  kare(now) {
    const gl = this.gl;
    const dt = Math.min(0.05, (now - (this.son || now)) / 1000);
    this.son = now;
    this.zaman = (now - this.t0) / 1000;
    if (this.mt < 1) this.mt = Math.min(1, this.mt + dt / (this.msure || 2.6));
    this.dim += (this.dimHedef - this.dim) * Math.min(1, dt * 1.6);
    this.ptrG *= Math.pow(0.25, dt);
    this.pulse *= Math.pow(0.02, dt);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const u = this.u;
    gl.uniform3fv(u.uPrevA, this.prev.slice(0, 3));
    gl.uniform3fv(u.uPrevB, this.prev.slice(3, 6));
    gl.uniform3fv(u.uNextA, this.next.slice(0, 3));
    gl.uniform3fv(u.uNextB, this.next.slice(3, 6));
    gl.uniform1f(u.uT, this.mt);
    gl.uniform1f(u.uTime, this.az ? this.zaman * 0.3 : this.zaman);
    gl.uniform1f(u.uAspect, this.aspect);
    gl.uniform2fv(u.uPointer, this.ptr);
    gl.uniform1f(u.uPointerG, this.az ? 0 : this.ptrG);
    gl.uniform1f(u.uHug, this.hug);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform1f(u.uDim, this.dim);
    gl.uniform1f(u.uScroll, this.scroll);
    gl.uniform1f(u.uPulse, this.pulse);
    gl.uniform4fv(u.uKart, this.kart);
    const T = this.renkler;
    gl.uniform3fv(u.uRenkA, T.a);
    gl.uniform3fv(u.uRenkB, T.b);
    gl.uniform1f(u.uCekirdek, T.c);
    gl.uniform3fv(u.uYaprakA, T.ya);
    gl.uniform3fv(u.uYaprakB, T.yb);
    gl.uniform1f(u.uGuc, T.g);
    gl.drawArrays(gl.POINTS, 0, this.N);
  }

  // Ekrandaki bir dikdörtgeni (ör. mektup kâğıdı) zerrelerin doğacağı yer yap
  kartKonumu(r) {
    const a = this.aspect;
    this.kart = [((r.left + r.width / 2) / innerWidth * 2 - 1) * a, -((r.top + r.height / 2) / innerHeight * 2 - 1), (r.width / innerWidth) * a, r.height / innerHeight];
  }

  tema(acik) {
    this.renkler = acik ? TEMALAR.acik : TEMALAR.koyu;
    if (!this.gl) return;
    if (this.renkler.karisim === 'ekle') this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
    else this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  nabiz(g = 1) {
    this.pulse = Math.max(this.pulse, g);
  }
}
