/*
  İpek: arka planda yavaşça dalgalanan bordo bir ipek.
  Üzerinde gezinen sıcak bir ışık var; parmağını izler, kumaşın kıvrımlarını aydınlatır.
  Yumuşak bir görüntü olduğu için düşük çözünürlükte çizilir; telefonu yormaz.
*/
const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uLight;   // x, y (ekran ortası 0), güç
uniform float uAmb;
uniform vec3 uPtr;     // dokunuş dalgası: x, y, güç
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uScroll;
uniform float uAcik;

float alan(vec2 uv, float t){
  vec2 p = uv;
  for (int i = 1; i < 7; i++) {
    float fi = float(i);
    p.x += 0.42 / fi * sin(fi * 1.45 * p.y + t * 0.9 + fi * 0.7);
    p.y += 0.36 / fi * cos(fi * 1.25 * p.x - t * 0.7 + fi * 1.3);
  }
  return sin(p.x * 2.3 + p.y * 1.5);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 k = uv * 2.0 + vec2(0.0, uScroll * 0.28);
  vec2 d = uv - uPtr.xy;
  float dl = length(d);
  k += (d / (dl + 0.0001)) * uPtr.z * 0.05 * exp(-dl * dl * 9.0) * sin(dl * 22.0 - uTime * 5.0);
  float t = uTime * 0.11;
  float e = 0.012;
  float h = alan(k, t);
  float hx = alan(k + vec2(e, 0.0), t);
  float hy = alan(k + vec2(0.0, e), t);
  vec3 n = normalize(vec3((h - hx) * 7.0, (h - hy) * 7.0, 1.0));

  vec2 lp = uLight.xy;
  vec3 L = normalize(vec3(lp - uv, 0.5));
  float uz = dot(lp - uv, lp - uv);
  float att = uLight.z / (1.0 + uz * 6.0);
  float dif = clamp(dot(n, L), 0.0, 1.0);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(clamp(dot(n, H), 0.0, 1.0), 46.0);
  float parilti = pow(clamp(dot(n, H), 0.0, 1.0), 6.0);
  float kat = 0.5 + 0.5 * h;

  vec3 renk = mix(uC1, uC2, smoothstep(0.1, 0.95, kat * 0.75 + dif * 0.3));
  vec3 col = renk * (uAmb * 1.3 + dif * att * 0.55 + parilti * att * 0.5);
  col += uC3 * spec * att * 0.55;
  col += uC3 * pow(kat, 16.0) * 0.035 * (uAmb + att);
  col = 1.0 - exp(-col * 1.25);
  float vig = smoothstep(1.25, 0.15, length(uv * vec2(0.85, 1.0)));
  col *= mix(0.35, 1.0, vig);
  // Gündüz: pudra pembesi saten. Kıvrımlarda yumuşak gölge, sırtlarda inci parlaklığı.
  float isik = clamp(dif * (0.55 + att * 0.6) + kat * 0.22, 0.0, 1.0);
  vec3 gunduz = mix(uC1, uC2, smoothstep(0.05, 0.95, isik));
  gunduz += uC3 * spec * (0.25 + att * 0.3);
  gunduz *= mix(0.9, 1.0, vig);
  col = mix(col, gunduz, uAcik);
  // titreşim: bantlaşmayı önlemek için çok hafif gren
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

// [gölge, kumaş, parlaklık]
const RENKLER = {
  gece: [[0.02, 0.006, 0.014], [0.36, 0.06, 0.16], [1.0, 0.78, 0.84]],
  aksam: [[0.026, 0.006, 0.012], [0.4, 0.07, 0.15], [1.0, 0.76, 0.66]],
  sabah: [[0.86, 0.66, 0.7], [0.99, 0.91, 0.92], [1.0, 1.0, 1.0]],
  gun: [[0.88, 0.7, 0.73], [0.995, 0.93, 0.935], [1.0, 1.0, 1.0]],
};

export class Ipek {
  constructor(canvas) {
    this.c = canvas;
    this.isik = [0, 0.1, 0.0];
    this.isikHedef = [0, 0.1, 0.0];
    this.amb = 0.0;
    this.ambHedef = 0.06;
    this.ptr = [0, 0, 0];
    this.scroll = 0;
    this.renk = RENKLER.gece.map((x) => x.slice());
    this.renkHedef = RENKLER.gece;
    this.serbest = false; // ışık kendi başına mı geziyor
    this.acik = 0;
    this.acikHedef = 0;
  }

  baslat() {
    const gl = this.c.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return false;
    this.gl = gl;
    const sh = (t, s) => {
      const o = gl.createShader(t);
      gl.shaderSource(o, s);
      gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o));
      return o;
    };
    try {
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link');
      this.p = p;
    } catch (e) {
      console.warn('İpek kurulamadı', e);
      return false;
    }
    gl.useProgram(this.p);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(this.p, 'p');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    for (const n of ['uRes', 'uTime', 'uLight', 'uAmb', 'uPtr', 'uC1', 'uC2', 'uC3', 'uScroll', 'uAcik']) this.u[n] = gl.getUniformLocation(this.p, n);
    this.boyutla();
    addEventListener('resize', () => this.boyutla());
    const ptr = (e, g) => {
      const x = (e.clientX / innerWidth - 0.5) * this.aspect;
      const y = 0.5 - e.clientY / innerHeight;
      this.parmak = [x, y];
      if (g) this.ptr = [x, y, 1];
    };
    addEventListener('pointermove', (e) => ptr(e, false), { passive: true });
    addEventListener('pointerdown', (e) => ptr(e, true), { passive: true });
    this.az = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.t0 = performance.now();
    const dongu = (now) => {
      this.kare(now);
      requestAnimationFrame(dongu);
    };
    requestAnimationFrame(dongu);
    this.ok = true;
    return true;
  }

  boyutla() {
    const olcek = innerWidth < 700 ? 0.55 : 0.5;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.c.width = Math.max(2, Math.floor(innerWidth * dpr * olcek));
    this.c.height = Math.max(2, Math.floor(innerHeight * dpr * olcek));
    this.aspect = innerWidth / innerHeight;
    this.gl.viewport(0, 0, this.c.width, this.c.height);
  }

  vakit(v) {
    this.renkHedef = RENKLER[v] || RENKLER.gece;
    this.acikHedef = v === 'sabah' || v === 'gun' ? 1 : 0;
  }
  hemen() {
    this.renk = this.renkHedef.map((x) => x.slice());
    this.acik = this.acikHedef;
  }

  // Ekran koordinatı (0..1) ile ışığı bir yere götür
  isigaGotur(x, y, guc) {
    this.isikHedef = [(x - 0.5) * this.aspect, 0.5 - y, guc == null ? this.isikHedef[2] : guc];
  }

  kare(now) {
    if (document.hidden) return;
    const gl = this.gl;
    const dt = Math.min(0.05, (now - (this.son || now)) / 1000);
    this.son = now;
    const t = (now - this.t0) / 1000;
    if (this.serbest) {
      // Işık kendi kendine dolaşır; parmak varsa ona doğru eğilir
      let x = Math.sin(t * 0.13) * 0.42 * this.aspect;
      let y = 0.18 + Math.cos(t * 0.09) * 0.22;
      if (this.parmak) {
        x = x * 0.45 + this.parmak[0] * 0.55;
        y = y * 0.45 + this.parmak[1] * 0.55;
      }
      this.isikHedef[0] = x;
      this.isikHedef[1] = y;
    }
    const yak = (a, b, k) => a + (b - a) * Math.min(1, dt * k);
    this.isik = this.isik.map((v, i) => yak(v, this.isikHedef[i], i === 2 ? 1.4 : 2.2));
    this.amb = yak(this.amb, this.ambHedef, 0.8);
    this.acik = yak(this.acik, this.acikHedef, 0.6);
    this.ptr[2] *= Math.pow(0.2, dt);
    for (let i = 0; i < 3; i++) this.renk[i] = this.renk[i].map((v, j) => yak(v, this.renkHedef[i][j], 0.5));
    const u = this.u;
    gl.uniform2f(u.uRes, this.c.width, this.c.height);
    gl.uniform1f(u.uTime, this.az ? t * 0.2 : t);
    gl.uniform3fv(u.uLight, this.isik);
    gl.uniform1f(u.uAmb, this.amb);
    gl.uniform3fv(u.uPtr, this.ptr);
    gl.uniform3fv(u.uC1, this.renk[0]);
    gl.uniform3fv(u.uC2, this.renk[1]);
    gl.uniform3fv(u.uC3, this.renk[2]);
    gl.uniform1f(u.uScroll, this.scroll);
    gl.uniform1f(u.uAcik, this.acik);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
