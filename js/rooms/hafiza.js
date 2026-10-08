/* Oda: Hafıza Sarayı — telefonla içinde yürünen üç boyutlu bir saray. Girişte fiyonk heykelli, iki kuleli mozaik zeminli
   bir hol; holden açılan koridorda kaledeki ilk kaydın ayından bu aya kadar her ay bir salon: kapının üstünde ay levhası,
   duvarlarda o ayın fotoğrafları çerçeveli tablolar, masada notlardan mektuplar, köşede o ayın kalpleriyle dolu kavanoz,
   ayın sayıları için bir tabela. Koridorun sonunda iskeleli, yarım kalmış "gelecek aylar" kanadı. three.js
   (js/vendor/three.min.js) odaya ilk girişte bir kez yüklenir; yüklenemezse ya da WebGL yoksa ayların 2B listesi.
   Kayıt yazmaz (K.arsiv'den okur). Pullar: hafiza (ilk giriş), hafizahepsi (bütün salonlar gezilince). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const fmtDay = (d) => (d && /^\d{4}-\d\d-\d\d$/.test(d) ? T.fmt(d) : '');
  const ymOf = (at) => T.key(T.baku(new Date(at))).slice(0, 7);
  const spread = (arr, n) => (arr.length <= n ? arr.slice() : Array.from({ length: n }, (_, i) => arr[Math.floor(((i + 0.5) * arr.length) / n)]));
  const angDiff = (a, b) => {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  };

  // Ölçüler (metre). Hol z: 0 → -14; koridor holden -z yönünde; her bölümde (SEG) solda ve sağda birer salon.
  const EYE = 1.6, RAD = 0.3, SPEED = 3.2, LOOK = 0.0055, WT = 0.1;
  const HALL = { x0: -7, x1: 7, z0: -14, z1: 0, h: 5.6 };
  const CW = 2, CH = 3.4, SEG = 9, SW = 8.2, SH = 3.6, DOOR = 1.1, DOOR_H = 2.6, ARCH = 1.8, ARCH_H = 3.0, FUT = 12, FW = 6;
  const NEAR_IN = 16, NEAR_OUT = 24, SIGN_IN = 34, SIGN_OUT = 44, SHOW = 40;
  // Tablo yerleri: [duvar, konum] — b: dip duvar (v), l/r: yan duvarlar (u). En fazla 9 tablo.
  const SLOTS = [['b', 0], ['b', -2.7], ['b', 2.7], ['l', 4.1], ['r', 4.1], ['l', 6.3], ['r', 6.3], ['l', 1.9], ['r', 1.9]];
  const THEMES = ['sky', 'pink', 'mint', 'lilac', 'butter', 'peach'];

  function pal() {
    const v = (n, d) => {
      try {
        const s = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
        return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s) ? s : d;
      } catch (e) {
        return d;
      }
    };
    return { bg: v('--k4-bg', '#FFF0F5'), card: v('--k4-card', '#FFFFFF'), ink: v('--k4-ink', '#3A1F2D'), red: v('--k4-red', '#E3174D'), pink: v('--k4-pink', '#FF8FB8'), butter: v('--k4-butter', '#FFE27A'), sky: v('--k4-sky', '#9FD8FF'), mint: v('--k4-mint', '#9FE5C4'), lilac: v('--k4-lilac', '#CDBBFF'), peach: v('--k4-peach', '#FFC6A6') };
  }

  let root = null, S = null, ui = null, runId = 0, threeP = null, mode = '', ph = null;
  let months = [], groups = {}, salons = [];
  const joy = { x: 0, y: 0, on: false, id: null };
  const keys = {};

  /* ---------------- three.js'i bir kez yükle ---------------- */
  function loadThree() {
    if (window.THREE && window.THREE.WebGLRenderer) return Promise.resolve(window.THREE);
    if (!threeP)
      threeP = new Promise((res, rej) => {
        const s = document.createElement('script');
        let done = false;
        const fail = () => {
          if (done) return;
          done = true;
          threeP = null;
          s.remove();
          rej(new Error('three'));
        };
        const to = setTimeout(fail, 25000);
        s.src = 'js/vendor/three.min.js';
        s.async = true;
        s.onload = () => {
          clearTimeout(to);
          if (window.THREE && window.THREE.WebGLRenderer) (done = true), res(window.THREE);
          else fail();
        };
        s.onerror = () => (clearTimeout(to), fail());
        document.head.appendChild(s);
      });
    return threeP;
  }
  function glOk() {
    try {
      const c = document.createElement('canvas');
      const g = window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'));
      if (!g) return false;
      const x = g.getExtension('WEBGL_lose_context');
      x && x.loseContext();
      return true;
    } catch (e) {
      return false;
    }
  }
  const fontsReady = () =>
    document.fonts && document.fonts.load
      ? Promise.race([Promise.all(['600 40px Fredoka', '700 40px Fredoka', '700 30px Caveat'].map((f) => document.fonts.load(f))).catch(() => {}), new Promise((r) => setTimeout(r, 2500))])
      : Promise.resolve();

  /* ---------------- Veri: aylar, fotoğraflar, notlar ---------------- */
  async function loadData() {
    const [ms, ps, ns] = await Promise.all([K.arsiv.months(), K.arsiv.photos(), K.arsiv.notes()]);
    const g = {};
    ms.forEach((ym) => (g[ym] = { photos: [], notes: [] }));
    ps.forEach((p) => g[ymOf(p.at)] && g[ymOf(p.at)].photos.push(p));
    ns.forEach((n) => g[ymOf(n.at)] && g[ymOf(n.at)].notes.push(n));
    groups = g;
    months = ms;
  }
  const nextYm = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return `${m === 12 ? y + 1 : y}-${String((m % 12) + 1).padStart(2, '0')}`;
  };

  /* ---------------- Tuval yardımcıları ---------------- */
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function heart(g, x, y, s, col) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.beginPath();
    g.moveTo(0, 0.38);
    g.bezierCurveTo(-0.12, 0.27, -0.5, 0.06, -0.5, -0.16);
    g.bezierCurveTo(-0.5, -0.44, -0.14, -0.52, 0, -0.26);
    g.bezierCurveTo(0.14, -0.52, 0.5, -0.44, 0.5, -0.16);
    g.bezierCurveTo(0.5, 0.06, 0.12, 0.27, 0, 0.38);
    g.closePath();
    g.fillStyle = col;
    g.fill();
    g.restore();
  }
  function wrap(g, text, maxW, maxLines) {
    const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let cur = '', cut = false;
    for (let i = 0; i < words.length; i++) {
      let w = words[i];
      while (g.measureText(w).width > maxW && w.length > 4) w = w.slice(0, -2);
      const t = cur ? cur + ' ' + w : w;
      if (cur && g.measureText(t).width > maxW) {
        lines.push(cur);
        cur = w;
        if (lines.length === maxLines) {
          cut = true;
          cur = '';
          break;
        }
      } else cur = t;
    }
    if (cur) lines.push(cur);
    if (cut) lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,.;:!?]*$/, '') + '…';
    return lines;
  }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new S.THREE.CanvasTexture(c);
    t.anisotropy = S.aniso;
    return t;
  }
  const FD = (wt, px) => `${wt} ${px}px Fredoka, 'Baloo 2', Nunito, sans-serif`;

  // Holün zemini: iki kuleli bir kale mozaiği. u: x yönü (0..1), v: uzaktan (koridor) girişe (0..1); heykel ortada.
  function texMosaic(P) {
    return canvasTex(1024, 1024, (g) => {
      const N = 48, s = 1024 / N, rnd = K.rng(7);
      const td = (u) => Math.abs(Math.abs(u - 0.5) - 0.3);
      const tower = (u, v) => td(u) < 0.06 && v > 0.3 && v < 0.8;
      const roof = (u, v) => v <= 0.3 && v > 0.13 && td(u) < (0.08 * (v - 0.13)) / 0.17;
      const wall = (u, v) => Math.abs(u - 0.5) < 0.24 && v > 0.42 && v < 0.8;
      const cren = (u, v, c) => Math.abs(u - 0.5) < 0.24 && v > 0.385 && v <= 0.42 && c % 2 === 0;
      const gate = (u, v) => Math.abs(u - 0.5) < 0.06 && v > 0.64 && v < 0.8 && (v > 0.68 || Math.abs(u - 0.5) < 0.035);
      const win = (u, v) => tower(u, v) && td(u) < 0.024 && ((v > 0.42 && v < 0.48) || (v > 0.6 && v < 0.66));
      const heartIn = (u, v) => {
        const x = (u - 0.5) / 0.085, y = (0.3 - v) / 0.085;
        return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y <= 0;
      };
      const flag = (u, v) => td(u) < 0.012 && v > 0.08 && v <= 0.13;
      const solid = (u, v, c) => tower(u, v) || roof(u, v) || wall(u, v) || cren(u, v, c) || heartIn(u, v) || flag(u, v);
      const at = (r, c) => [(c + 0.5) / N, (r + 0.5) / N];
      const color = (r, c) => {
        const [u, v] = at(r, c);
        if (u < 0.045 || u > 0.955 || v < 0.045 || v > 0.955) return (r + c) % 2 ? P.pink : '#FFE3EE';
        if (solid(u, v, c)) {
          if (heartIn(u, v)) return P.red;
          if (flag(u, v)) return P.butter;
          if (roof(u, v)) return P.red;
          if (win(u, v)) return P.sky;
          if (gate(u, v)) return '#D97BA6';
          if (tower(u, v)) return '#FFB3CE';
          return P.lilac;
        }
        if (v > 0.8) return rnd() < 0.14 ? (rnd() < 0.5 ? P.butter : '#FFD0E2') : P.mint;
        return (r + c) % 2 ? '#FFF4DE' : '#FFEDCD';
      };
      g.fillStyle = '#E2CCD3';
      g.fillRect(0, 0, 1024, 1024);
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          rr(g, c * s + 1.5, r * s + 1.5, s - 3, s - 3, 4);
          g.fillStyle = color(r, c);
          g.fill();
          const j = rnd();
          g.fillStyle = j < 0.5 ? `rgba(255,255,255,${(j * 0.34).toFixed(2)})` : `rgba(58,31,45,${((j - 0.5) * 0.09).toFixed(3)})`;
          g.fill();
        }
    });
  }
  function texSky() {
    return canvasTex(128, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#FFB4A9');
      gr.addColorStop(0.55, '#FFD3B6');
      gr.addColorStop(1, '#FFF0C9');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 256);
      g.fillStyle = '#FFF8DC';
      g.beginPath();
      g.arc(64, 196, 26, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)';
      [[30, 70, 26, 9], [92, 112, 22, 8], [48, 140, 30, 9]].forEach(([x, y, rx, ry]) => {
        g.beginPath();
        g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        g.fill();
      });
    });
  }
  function texGlow() {
    return canvasTex(128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,240,190,.95)');
      gr.addColorStop(0.3, 'rgba(255,205,130,.45)');
      gr.addColorStop(1, 'rgba(255,180,110,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    });
  }
  function texEmpty(P) {
    return canvasTex(128, 128, (g) => {
      g.fillStyle = '#FFF7EC';
      g.fillRect(0, 0, 128, 128);
      heart(g, 64, 62, 54, '#FFD6E5');
      g.fillStyle = '#C9A8B8';
      g.font = FD(600, 13);
      g.textAlign = 'center';
      g.fillText('bekliyor', 64, 112);
    });
  }
  function texBanner(P) {
    return canvasTex(1024, 256, (g) => {
      g.fillStyle = '#FFFFFF';
      g.fillRect(0, 0, 1024, 256);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = FD(700, 104);
      g.lineJoin = 'round';
      g.lineWidth = 14;
      g.strokeStyle = P.ink;
      g.strokeText('Hafıza Sarayı', 512, 112);
      g.fillStyle = P.red;
      g.fillText('Hafıza Sarayı', 512, 112);
      g.font = FD(600, 38);
      g.fillStyle = P.ink;
      g.fillText('her ay bir salon', 512, 208);
      heart(g, 74, 118, 70, P.pink);
      heart(g, 950, 118, 70, P.pink);
    });
  }
  function texDoorSign(s, P) {
    return canvasTex(512, 128, (g) => {
      g.fillStyle = P.butter;
      g.fillRect(0, 0, 512, 128);
      rr(g, 8, 8, 496, 112, 22);
      g.lineWidth = 6;
      g.strokeStyle = P.ink;
      g.stroke();
      g.fillStyle = P.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = FD(600, 54);
      g.fillText(s.ad, 256, 68, 380);
      heart(g, 46, 66, 34, P.red);
      heart(g, 466, 66, 34, P.red);
    });
  }
  function texBoard(s, m, P) {
    const c = m.counts || {};
    const stats = [
      [m.photos.length, 'kare'],
      [m.notes.length, 'yazı'],
      [c.kalpk || 0, 'kalp'],
      [(c.kucak || 0) + (c.selam || 0), 'sarılma'],
      [c.tsmesaj || 0, 'ses'],
    ];
    return canvasTex(512, 256, (g) => {
      g.fillStyle = '#FFFFFF';
      g.fillRect(0, 0, 512, 256);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = P.red;
      g.font = FD(700, 40);
      g.fillText(s.ad, 256, 44, 470);
      g.fillStyle = '#FFE3EE';
      rr(g, 20, 82, 472, 4, 2);
      g.fill();
      stats.forEach(([n, l], i) => {
        const x = 52 + i * 102;
        g.fillStyle = P.ink;
        g.font = FD(700, n > 999 ? 36 : 52);
        g.fillText(String(n), x, 142);
        g.fillStyle = '#8A5A78';
        g.font = FD(600, 27);
        g.fillText(l, x, 200, 98);
      });
    });
  }
  function texLetter(n, P) {
    return canvasTex(256, 256, (g) => {
      g.fillStyle = '#FFF8EC';
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(255,143,184,.35)';
      g.lineWidth = 1.5;
      for (let y = 66; y < 226; y += 26) {
        g.beginPath();
        g.moveTo(14, y + 6);
        g.lineTo(242, y + 6);
        g.stroke();
      }
      heart(g, 226, 28, 26, P.red);
      g.fillStyle = P.red;
      g.font = FD(600, 16);
      g.textBaseline = 'alphabetic';
      g.fillText(n.label, 16, 34, 180);
      g.fillStyle = '#4A2138';
      g.font = `700 25px Caveat, 'Segoe Print', cursive`;
      wrap(g, n.text, 224, 5).forEach((l, i) => g.fillText(l, 16, 70 + i * 26));
      g.font = `700 22px Caveat, 'Segoe Print', cursive`;
      g.textAlign = 'right';
      g.fillText(`— ${nameOf(n.who)}`, 240, 240);
    });
  }
  function texFuture(P) {
    const last = months[months.length - 1];
    const nx = last ? K.arsiv.monthName(nextYm(last)) : '';
    return canvasTex(512, 512, (g) => {
      g.fillStyle = '#FFFFFF';
      g.fillRect(0, 0, 512, 512);
      const band = (y) => {
        g.save();
        g.beginPath();
        g.rect(0, y, 512, 44);
        g.clip();
        g.fillStyle = P.butter;
        g.fillRect(0, y, 512, 44);
        g.fillStyle = P.ink;
        for (let x = -60; x < 560; x += 56) {
          g.beginPath();
          g.moveTo(x, y + 44);
          g.lineTo(x + 28, y + 44);
          g.lineTo(x + 56, y);
          g.lineTo(x + 28, y);
          g.closePath();
          g.fill();
        }
        g.restore();
      };
      band(0);
      band(468);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = P.ink;
      g.font = FD(700, 62);
      g.fillText('Gelecek aylar', 256, 128, 470);
      g.fillStyle = P.red;
      g.font = FD(600, 34);
      g.fillText('yapım aşamasında', 256, 190);
      g.fillStyle = '#8A5A78';
      g.font = FD(500, 28);
      g.fillText('Sıradaki salon', 256, 268);
      g.fillStyle = P.ink;
      g.font = FD(700, 46);
      g.fillText(nx, 256, 322, 470);
      heart(g, 256, 400, 54, P.pink);
    });
  }

  /* ---------------- Birleştirilmiş kutu/şekil kümesi (tek çizim çağrısı + koyu dış çizgi gövdesi) ---------------- */
  function batch() {
    const T3 = S.THREE, pos = [], nor = [], col = [], hul = [], bul = [];
    const m4 = new T3.Matrix4(), n3 = new T3.Matrix3(), v = new T3.Vector3(), q = new T3.Quaternion(), eu = new T3.Euler(), sc = new T3.Vector3(), p = new T3.Vector3(), c = new T3.Color();
    const put = (geo, out, nOut) => {
      const Pa = geo.attributes.position, Na = geo.attributes.normal, I = geo.index, n = I ? I.count : Pa.count;
      if (nOut) n3.getNormalMatrix(m4);
      for (let i = 0; i < n; i++) {
        const k = I ? I.getX(i) : i;
        v.fromBufferAttribute(Pa, k).applyMatrix4(m4);
        out.push(v.x, v.y, v.z);
        if (nOut) {
          v.fromBufferAttribute(Na, k).applyMatrix3(n3).normalize();
          nOut.push(v.x, v.y, v.z);
          col.push(c.r, c.g, c.b);
        }
      }
    };
    const B = {
      add(geo, o) {
        eu.set(o.rx || 0, o.ry || 0, o.rz || 0);
        q.setFromEuler(eu);
        p.set(o.x || 0, o.y || 0, o.z || 0);
        m4.compose(p, q, sc.set(o.w, o.h, o.d));
        if (o.bulb) return put(geo, bul);
        c.set(o.c);
        put(geo, pos, nor);
        const t = o.hull === undefined ? 0.03 : o.hull;
        if (t) {
          m4.compose(p, q, sc.set(o.w + 2 * t, o.h + 2 * t, o.d + 2 * t));
          put(geo, hul);
        }
      },
      box: (o) => B.add(S.G.box, o),
      cyl: (o) => B.add(S.G.cyl, o),
      sph: (o) => B.add(S.G.sph, o),
      mesh() {
        const g = new T3.Group();
        const geo = (a, n, cl) => {
          const b = new T3.BufferGeometry();
          b.setAttribute('position', new T3.Float32BufferAttribute(a, 3));
          n && b.setAttribute('normal', new T3.Float32BufferAttribute(n, 3));
          cl && b.setAttribute('color', new T3.Float32BufferAttribute(cl, 3));
          b.computeBoundingSphere();
          return b;
        };
        if (pos.length) {
          const m = new T3.Mesh(geo(pos, nor, col), S.matToon);
          m.userData.kabuk = true;
          S.shells.push(m);
          g.add(m);
        }
        if (hul.length) g.add(new T3.Mesh(geo(hul), S.matHull));
        if (bul.length) g.add(new T3.Mesh(geo(bul), S.matBulb));
        return g;
      },
    };
    return B;
  }
  const block = (x0, z0, x1, z1) => S.walls.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) });
  function obstacle(x, z, r, sq) {
    S.obst.push({ x, z, r });
    const h = sq || r;
    block(x - h, z - h, x + h, z + h);
  }

  // Dikdörtgen bir alan: zemin, tavan ve içe doğru dört duvar paneli. open: {n, s, w, e: [[a, b, yükseklik]]}
  // n = z0 kenarı (-z), s = z1, w = x0, e = x1. jag: yarım kalmış duvar yüksekliği (yalnız jagSides).
  function space(B, r, o) {
    const { x0, x1, z0, z1, h } = r;
    if (o.floor) B.box({ x: (x0 + x1) / 2, y: -0.05, z: (z0 + z1) / 2, w: x1 - x0, h: 0.1, d: z1 - z0, c: o.floor, hull: 0 });
    if (o.ceil) B.box({ x: (x0 + x1) / 2, y: h + 0.05, z: (z0 + z1) / 2, w: x1 - x0, h: 0.1, d: z1 - z0, c: o.ceil, hull: 0 });
    const op = o.open || {};
    side('n', 'x', x0, x1, z0 + WT / 2, +1);
    side('s', 'x', x0, x1, z1 - WT / 2, -1);
    side('w', 'z', z0 + WT, z1 - WT, x0 + WT / 2, +1);
    side('e', 'z', z0 + WT, z1 - WT, x1 - WT / 2, -1);
    function side(name, ax, lo, hi, k, inward) {
      const jag = o.jag && (o.jagSides || 'nswe').includes(name) ? o.jag : null;
      const put = (a, b, y0, y1, depth, off, c, hull) => {
        const mid = (a + b) / 2, len = b - a, kk = k + inward * off;
        if (ax === 'x') B.box({ x: mid, y: (y0 + y1) / 2, z: kk, w: len, h: y1 - y0, d: depth, c, hull });
        else B.box({ x: kk, y: (y0 + y1) / 2, z: mid, w: depth, h: y1 - y0, d: len, c, hull });
      };
      const panel = (a, b) => {
        if (jag) for (let s = a; s < b - 0.01; s += 0.9) put(s, Math.min(b, s + 0.9), 0, jag(), WT, 0, o.wall, 0.025);
        else put(a, b, 0, h, WT, 0, o.wall, 0.02);
        if (o.wain) put(a, b, 0, 0.95, 0.04, WT / 2 + 0.02, o.wain, 0.015);
        const k0 = k - (inward * WT) / 2, k1 = k + inward * (WT / 2 + (o.wain ? 0.06 : 0.01));
        if (ax === 'x') block(a, k0, b, k1);
        else block(k0, a, k1, b);
      };
      let cur = lo;
      (op[name] || [])
        .slice()
        .sort((m, n) => m[0] - n[0])
        .forEach(([a, b, oh]) => {
          if (a > cur) panel(cur, a);
          if (!jag && oh < h - 0.01) put(a, b, oh, h, WT, 0, o.wall, 0.02);
          cur = Math.max(cur, b);
        });
      if (hi > cur) panel(cur, hi);
    }
  }

  function chandelier(B, x, y, z, size, P) {
    B.cyl({ x, y: y - 0.03, z, w: 0.3, h: 0.06, d: 0.3, c: P.butter, hull: 0.015 });
    B.cyl({ x, y: y - 0.32, z, w: 0.045, h: 0.56, d: 0.045, c: P.ink, hull: 0 });
    const ry = y - 0.62;
    B.add(S.G.tor, { x, y: ry, z, w: size, h: size, d: size, rx: Math.PI / 2, c: P.butter, hull: 0 });
    B.sph({ x, y: ry - 0.12, z, w: 0.2, h: 0.24, d: 0.2, c: P.pink, hull: 0.015 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, cx = x + Math.cos(a) * size * 0.5, cz = z + Math.sin(a) * size * 0.5;
      B.cyl({ x: cx, y: ry + 0.08, z: cz, w: 0.07, h: 0.13, d: 0.07, c: '#FFFFFF', hull: 0.012 });
      B.sph({ x: cx, y: ry + 0.19, z: cz, w: 0.1, h: 0.13, d: 0.1, bulb: true });
    }
    glow(x, ry + 0.1, z, 1.6 + size * 1.4);
  }
  function glow(x, y, z, s) {
    const sp = new S.THREE.Sprite(S.matGlow);
    sp.position.set(x, y, z);
    sp.scale.set(s, s, 1);
    S.glows.add(sp);
  }
  function plane(w, h, base, map) {
    const T3 = S.THREE;
    const mat = new T3.MeshBasicMaterial({ color: base });
    mat.userData.base = base;
    mat.userData.ph = base;
    if (map) setMap(mat, map);
    const m = new T3.Mesh(S.G.plane, mat);
    m.scale.set(w, h, 1);
    S.basics.push(mat);
    return m;
  }
  function setMap(mat, map) {
    mat.map = map;
    mat.userData.base = map ? '#FFFFFF' : mat.userData.ph || mat.userData.base;
    tint(mat);
    mat.needsUpdate = true;
  }
  function tint(mat) {
    mat.color.set(mat.userData.base).multiplyScalar(S.night ? 0.8 : 1);
  }

  /* ---------------- Saray parçaları ---------------- */
  function buildHall(P) {
    const T3 = S.THREE, B = batch(), { x0, x1, z0, z1, h } = HALL;
    const wall = new T3.Color(P.pink).lerp(new T3.Color('#FFFFFF'), 0.68);
    space(B, HALL, { ceil: '#FFF7EF', wall, wain: P.pink, open: { n: [[-ARCH, ARCH, ARCH_H]] } });
    // Mozaik zemin
    const fl = new T3.Mesh(new T3.PlaneGeometry(x1 - x0, z1 - z0), new T3.MeshLambertMaterial({ map: S.mosaic }));
    fl.rotation.x = -Math.PI / 2;
    fl.position.set(0, 0, (z0 + z1) / 2);
    fl.userData.kabuk = true;
    S.shells.push(fl);
    // Kemer ve tabela
    const zf = z0 + WT;
    [-1, 1].forEach((sx) => B.box({ x: sx * (ARCH + 0.12), y: (ARCH_H + 0.2) / 2, z: zf + 0.06, w: 0.24, h: ARCH_H + 0.2, d: 0.12, c: P.butter }));
    B.box({ x: 0, y: ARCH_H + 0.1, z: zf + 0.06, w: ARCH * 2 + 0.48, h: 0.2, d: 0.12, c: P.butter });
    B.box({ x: 0, y: 4.72, z: zf + 0.04, w: 4.3, h: 1.12, d: 0.08, c: '#FFFFFF' });
    const ban = plane(4.0, 1.0, '#FFFFFF', S.banner);
    ban.position.set(0, 4.72, zf + 0.085);
    // Fiyonk heykeli
    const sz = -7;
    B.cyl({ x: 0, y: 0.38, z: sz, w: 2.0, h: 0.76, d: 2.0, c: P.lilac });
    B.cyl({ x: 0, y: 0.83, z: sz, w: 2.24, h: 0.14, d: 2.24, c: P.butter });
    B.cyl({ x: 0, y: 0.08, z: sz, w: 2.3, h: 0.16, d: 2.3, c: P.butter });
    const by = 2.18;
    [-1, 1].forEach((sx) => {
      B.sph({ x: sx * 0.68, y: by, z: sz, w: 1.25, h: 0.95, d: 0.46, rz: sx * 0.3, c: P.red, hull: 0.04 });
      B.sph({ x: sx * 0.74, y: by, z: sz, w: 0.5, h: 0.34, d: 0.5, rz: sx * 0.3, c: '#B80F3C', hull: 0 });
      B.box({ x: sx * 0.3, y: by - 0.74, z: sz, w: 0.32, h: 0.9, d: 0.13, rz: sx * 0.32, c: P.red, hull: 0.035 });
      [-1, 1].forEach((fz) => B.sph({ x: sx * 0.95, y: by + 0.24, z: sz + fz * 0.2, w: 0.14, h: 0.14, d: 0.06, c: '#FFFFFF', hull: 0 }));
    });
    B.sph({ x: 0, y: by - 0.04, z: sz, w: 0.5, h: 0.46, d: 0.52, c: P.red, hull: 0.04 });
    obstacle(0, sz, 1.15);
    const proxy = new T3.Mesh(S.G.cyl, S.matProxy);
    proxy.scale.set(2.4, 3.0, 2.4);
    proxy.position.set(0, 1.5, sz);
    proxy.userData.hf = { t: 'heykel' };
    S.picks.push(proxy);
    // Sütunlar
    [[-5.9, -2.2], [5.9, -2.2], [-5.9, -11.8], [5.9, -11.8]].forEach(([x, z]) => {
      B.cyl({ x, y: h / 2, z, w: 0.64, h, d: 0.64, c: P.lilac, hull: 0.025 });
      B.box({ x, y: 0.15, z, w: 0.9, h: 0.3, d: 0.9, c: P.butter });
      B.box({ x, y: h - 0.14, z, w: 0.86, h: 0.28, d: 0.86, c: P.butter });
      obstacle(x, z, 0.45);
    });
    // Pencereler (gün batımı)
    [[x0 + WT, 1], [x1 - WT, -1]].forEach(([wx, dir]) =>
      [-4.6, -9.4].forEach((wz) => {
        B.box({ x: wx + dir * 0.05, y: 2.25, z: wz, w: 0.1, h: 2.4, d: 1.8, c: P.butter });
        B.box({ x: wx + dir * 0.13, y: 1.0, z: wz, w: 0.18, h: 0.1, d: 2.0, c: P.butter });
        const sky = new T3.Mesh(S.G.plane, S.matWindow);
        sky.scale.set(1.5, 2.1, 1);
        sky.rotation.y = (dir * Math.PI) / 2;
        sky.position.set(wx + dir * 0.105, 2.25, wz);
        S.hall.add(sky);
        B.box({ x: wx + dir * 0.115, y: 2.25, z: wz, w: 0.03, h: 2.1, d: 0.07, c: '#FFFFFF', hull: 0.01 });
        B.box({ x: wx + dir * 0.115, y: 2.6, z: wz, w: 0.03, h: 0.07, d: 1.5, c: '#FFFFFF', hull: 0.01 });
      })
    );
    // Giriş kapısı (arkada)
    [-1, 1].forEach((sx) => {
      B.box({ x: sx * 0.58, y: 1.45, z: z1 - WT - 0.05, w: 1.1, h: 2.9, d: 0.08, c: P.pink });
      B.box({ x: sx * 0.58, y: 1.5, z: z1 - WT - 0.1, w: 0.7, h: 1.9, d: 0.03, c: '#FFC1D8', hull: 0.012 });
      B.sph({ x: sx * 0.16, y: 1.4, z: z1 - WT - 0.13, w: 0.1, h: 0.1, d: 0.1, c: P.butter, hull: 0.012 });
    });
    B.box({ x: 0, y: 3.0, z: z1 - WT - 0.06, w: 2.6, h: 0.2, d: 0.12, c: P.butter });
    // Saksılar
    [-2.7, 2.7].forEach((x) => {
      const z = z0 + 0.95;
      B.cyl({ x, y: 0.25, z, w: 0.6, h: 0.5, d: 0.6, c: P.peach });
      B.sph({ x, y: 0.82, z, w: 0.9, h: 0.8, d: 0.9, c: P.mint });
      [0, 1, 2].forEach((i) => B.sph({ x: x + Math.cos(i * 2.1) * 0.3, y: 0.98 + (i % 2) * 0.14, z: z + Math.sin(i * 2.1) * 0.3, w: 0.13, h: 0.13, d: 0.13, c: i % 2 ? P.butter : P.pink, hull: 0.012 }));
      obstacle(x, z, 0.4);
    });
    chandelier(B, 0, h, sz, 1.5, P);
    // Karşılama halısı
    B.box({ x: 0, y: 0.008, z: -0.95, w: 2.6, h: 0.016, d: 1.1, c: P.red, hull: 0 });
    const g = B.mesh();
    g.add(fl, ban, proxy);
    S.hall.add(g);
  }

  function buildCorridor(P, segs) {
    const B = batch(), z1 = HALL.z0, z0 = S.zEnd;
    const left = [], right = [];
    salons.forEach((s) => (s.side < 0 ? left : right).push([s.zc - DOOR, s.zc + DOOR, DOOR_H]));
    space(B, { x0: -CW, x1: CW, z0, z1, h: CH }, { floor: '#EFCBAA', ceil: '#FFF7EF', wall: '#F2EAFF', wain: P.lilac, open: { s: [[-ARCH, ARCH, ARCH_H]], n: [[-ARCH, ARCH, ARCH_H]], w: left, e: right } });
    B.box({ x: 0, y: 0.008, z: (z0 + z1) / 2, w: 1.5, h: 0.016, d: z1 - z0 - 0.3, c: P.pink, hull: 0 });
    [-1, 1].forEach((sx) => B.box({ x: sx * 0.8, y: 0.01, z: (z0 + z1) / 2, w: 0.1, h: 0.02, d: z1 - z0 - 0.3, c: P.butter, hull: 0 }));
    for (let s = 0; s <= segs; s++) {
      const z = z1 - s * SEG;
      if (s > 0 && s < segs) B.box({ x: 0, y: CH - 0.09, z, w: CW * 2 - 0.2, h: 0.18, d: 0.26, c: P.peach });
      if (s === 0 || s === segs) continue;
      [-1, 1].forEach((sx) => {
        B.box({ x: sx * (CW - WT - 0.05), y: 2.2, z, w: 0.08, h: 0.34, d: 0.18, c: P.butter, hull: 0.015 });
        B.sph({ x: sx * (CW - WT - 0.17), y: 2.4, z, w: 0.16, h: 0.2, d: 0.16, bulb: true });
        glow(sx * (CW - WT - 0.17), 2.4, z, 1.1);
      });
    }
    S.corridor.add(B.mesh());
  }

  function salonColors(s, P) {
    const T3 = S.THREE, mo = +s.ym.slice(5);
    const base = P[THEMES[(mo - 1) % THEMES.length]];
    const tone = (t) => new T3.Color(base).lerp(new T3.Color('#FFFFFF'), t);
    return { base, wall: tone(0.62), wain: tone(0.12), rug: tone(0.25), floor: new T3.Color('#EBC6A2').lerp(new T3.Color(base), 0.12) };
  }

  function buildSalon(s, P) {
    const T3 = S.THREE, B = batch(), sd = s.side, col = salonColors(s, P);
    const L = (u, v) => [sd * (CW + u), s.zc + v];
    const r = sd < 0 ? { x0: -(CW + SW), x1: -CW } : { x0: CW, x1: CW + SW };
    const door = [[s.zc - DOOR, s.zc + DOOR, DOOR_H]];
    space(B, { x0: r.x0, x1: r.x1, z0: s.zTop - SEG, z1: s.zTop, h: SH }, { floor: col.floor, ceil: '#FFF8F1', wall: col.wall, wain: col.wain, open: sd < 0 ? { e: door } : { w: door } });
    const g = s.group;
    // Kapı pervazları (iki yüz) ve ay levhası
    [CW - WT - 0.04, CW + WT + 0.04].forEach((u) => {
      const x = sd * u;
      [-1, 1].forEach((k) => B.box({ x, y: (DOOR_H + 0.1) / 2, z: s.zc + k * (DOOR + 0.055), w: 0.08, h: DOOR_H + 0.1, d: 0.13, c: col.base }));
      B.box({ x, y: DOOR_H + 0.07, z: s.zc, w: 0.08, h: 0.14, d: DOOR * 2 + 0.24, c: col.base });
    });
    B.box({ x: sd * (CW - WT - 0.03), y: 3.02, z: s.zc, w: 0.06, h: 0.52, d: 1.94, c: P.butter });
    const sign = plane(1.84, 0.46, P.butter);
    sign.rotation.y = Math.atan2(-sd, 0);
    sign.position.set(sd * (CW - WT - 0.065), 3.02, s.zc);
    sign.userData.hf = { t: 'kapi', s };
    S.picks.push(sign);
    s.signMesh = sign;
    g.add(sign);
    // Halı, masa, mektuplar
    const [tx, tz] = L(4.4, 0);
    B.box({ x: tx, y: 0.008, z: tz, w: 2.6, h: 0.016, d: 3.4, c: col.rug, hull: 0 });
    B.box({ x: tx, y: 0.79, z: tz, w: 0.98, h: 0.06, d: 1.95, c: '#E3AE86' });
    [-1, 1].forEach((a) => [-1, 1].forEach((b) => B.box({ x: tx + a * 0.4, y: 0.38, z: tz + b * 0.85, w: 0.07, h: 0.76, d: 0.07, c: '#E3AE86', hull: 0.015 })));
    B.box({ x: tx, y: 0.826, z: tz, w: 0.5, h: 0.012, d: 1.98, c: col.base, hull: 0 });
    obstacle(tx, tz, 1.05, 0.62);
    S.walls[S.walls.length - 1].z0 = tz - 1.08;
    S.walls[S.walls.length - 1].z1 = tz + 1.08;
    const rnd = K.rng(K.hash(s.ym));
    s.letters.forEach((n, i) => {
      const m = plane(0.44, 0.44, '#FFF8EC');
      m.userData.ph = '#FFF8EC';
      m.rotation.set(-Math.PI / 2, -sd * (Math.PI / 2) + (rnd() - 0.5) * 0.5, 0, 'YXZ');
      const v = (i - (s.letters.length - 1) / 2) * 0.6;
      m.position.set(tx + (rnd() - 0.5) * 0.12, 0.835 + i * 0.002, tz + v);
      m.userData.hf = { t: 'mektup', n };
      S.picks.push(m);
      s.letterMeshes.push({ mesh: m, n });
      g.add(m);
    });
    // Tablolar
    const FR = [P.butter, P.pink, P.mint, P.sky, P.lilac, P.peach];
    const shown = s.shown.length ? s.shown : [null, null, null];
    shown.forEach((p, i) => {
      const [wall, at] = SLOTS[i];
      const nrm = wall === 'b' ? [-sd, 0] : wall === 'l' ? [0, 1] : [0, -1];
      const ry = Math.atan2(nrm[0], nrm[1]);
      const [fx, fz] = wall === 'b' ? L(SW - WT, at) : L(at, wall === 'l' ? -(SEG / 2 - WT) : SEG / 2 - WT);
      B.box({ x: fx + nrm[0] * 0.06, y: 1.75, z: fz + nrm[1] * 0.06, w: 1.3, h: 1.3, d: 0.08, ry, c: FR[(i + K.hash(s.ym)) % FR.length] });
      const m = plane(1.06, 1.06, '#FFF7EC', p ? null : S.empty);
      m.userData.ph = '#FFF7EC';
      m.rotation.y = ry;
      m.position.set(fx + nrm[0] * 0.103, 1.75, fz + nrm[1] * 0.103);
      m.userData.hf = p ? { t: 'foto', p } : { t: 'bos', s };
      S.picks.push(m);
      s.paintings.push({ mesh: m, p });
      g.add(m);
    });
    // Kavanoz köşede
    const [jx, jz] = L(7.4, 3.6);
    B.cyl({ x: jx, y: 0.275, z: jz, w: 0.64, h: 0.55, d: 0.64, c: col.base });
    B.cyl({ x: jx, y: 0.57, z: jz, w: 0.62, h: 0.04, d: 0.62, c: '#FFFFFF', hull: 0.015 });
    B.cyl({ x: jx, y: 1.34, z: jz, w: 0.66, h: 0.1, d: 0.66, c: P.red });
    [-1, 1].forEach((k) => B.sph({ x: jx + k * 0.12, y: 1.44, z: jz, w: 0.2, h: 0.12, d: 0.12, rz: k * 0.35, c: P.red, hull: 0.012 }));
    obstacle(jx, jz, 0.36);
    const glass = new T3.Mesh(S.G.glass, S.matGlass);
    glass.position.set(jx, 0.95, jz);
    glass.renderOrder = 2;
    glass.userData.hf = { t: 'kavanoz', s };
    S.picks.push(glass);
    s.jarPos = [jx, jz];
    g.add(glass);
    // Ayın sayıları tabelası (kapıya dönük)
    const [bx, bz] = L(0.8, -2.5);
    const bry = Math.atan2(sd * -0.8, 2.5);
    B.cyl({ x: bx, y: 0.5, z: bz, w: 0.08, h: 1.0, d: 0.08, c: P.ink, hull: 0 });
    B.cyl({ x: bx, y: 0.03, z: bz, w: 0.44, h: 0.06, d: 0.44, c: P.ink, hull: 0 });
    B.box({ x: bx, y: 1.22, z: bz, w: 0.98, h: 0.54, d: 0.05, ry: bry, c: '#FFFFFF' });
    const brd = plane(0.9, 0.45, '#FFFFFF');
    brd.rotation.y = bry;
    brd.position.set(bx + Math.sin(bry) * 0.03, 1.22, bz + Math.cos(bry) * 0.03);
    brd.userData.hf = { t: 'tabela', s };
    S.picks.push(brd);
    s.board = brd;
    g.add(brd);
    obstacle(bx, bz, 0.25);
    chandelier(B, tx, SH, tz, 1.0, P);
    s.lampAt = [tx, tz];
    g.add(B.mesh());
  }

  function buildFuture(P) {
    const T3 = S.THREE, B = batch(), z1 = S.zEnd, z0 = z1 - FUT, rnd = K.rng(99);
    space(B, { x0: -FW, x1: FW, z0, z1, h: 3.4 }, { floor: '#EED5BC', wall: '#FBE3D2', wain: P.peach, jag: () => 1.0 + rnd() * 2.3, jagSides: 'nwe', open: { s: [[-ARCH, ARCH, ARCH_H]] } });
    // Yarım döşenmiş karolar
    const TC = [P.pink, P.sky, P.mint, P.lilac, P.butter];
    for (let i = 0; i < 22; i++) {
      const cx = -3 + (i % 6) * 0.62, cz = z1 - 1.6 - Math.floor(i / 6) * 0.62;
      if (rnd() < 0.3) continue;
      B.box({ x: cx + 1.2, y: 0.01, z: cz, w: 0.56, h: 0.02, d: 0.56, c: TC[i % TC.length], hull: 0 });
    }
    // İskeleler
    [[-4.3, z1 - 5.2], [4.1, z1 - 8.6]].forEach(([sx, sz]) => {
      [-0.8, 0.8].forEach((dx) => [-0.5, 0.5].forEach((dz) => B.box({ x: sx + dx, y: 1.8, z: sz + dz, w: 0.07, h: 3.6, d: 0.07, c: P.butter, hull: 0.015 })));
      [1.25, 2.55].forEach((y) => B.box({ x: sx, y, z: sz, w: 1.85, h: 0.06, d: 1.1, c: '#D9A47A', hull: 0.015 }));
      [-1, 1].forEach((k) => B.box({ x: sx, y: 1.9, z: sz + 0.52, w: 0.05, h: 1.95, d: 0.05, rz: k * 0.68, c: P.butter, hull: 0.012 }));
      B.box({ x: sx - 0.3, y: 2.72, z: sz, w: 0.4, h: 0.28, d: 0.3, c: P.sky });
      obstacle(sx, sz, 1.0, 0.95);
    });
    // Tuğla yığını, kova, dubalar
    for (let l = 0; l < 3; l++) for (let i = 0; i < 4 - l; i++) B.box({ x: 2.2 + i * 0.42 + l * 0.21, y: 0.1 + l * 0.2, z: z1 - 3.2, w: 0.4, h: 0.19, d: 0.22, c: i % 2 ? P.peach : '#F59A8A', hull: 0.012 });
    obstacle(2.85, z1 - 3.2, 0.9, 0.9);
    B.cyl({ x: -2.0, y: 0.16, z: z1 - 9.6, w: 0.44, h: 0.32, d: 0.44, c: P.sky });
    obstacle(-2.0, z1 - 9.6, 0.3);
    [-1.6, 1.6].forEach((x) => {
      B.add(S.G.cone, { x, y: 0.28, z: z1 - 1.5, w: 0.36, h: 0.56, d: 0.36, c: P.peach });
      B.cyl({ x, y: 0.3, z: z1 - 1.5, w: 0.25, h: 0.08, d: 0.25, c: '#FFFFFF', hull: 0 });
      B.box({ x, y: 0.02, z: z1 - 1.5, w: 0.44, h: 0.04, d: 0.44, c: P.peach, hull: 0.012 });
      obstacle(x, z1 - 1.5, 0.25);
    });
    // Yarım kalmış kapı
    [-1.2, 1.2].forEach((x) => B.box({ x, y: 1.15, z: z0 + WT + 0.1, w: 0.18, h: 2.3, d: 0.18, c: P.lilac }));
    // Işık zinciri
    const lz = z1 - 6;
    B.box({ x: 0, y: 3.15, z: lz, w: FW * 2 - 0.4, h: 0.02, d: 0.02, c: P.ink, hull: 0 });
    for (let i = 0; i < 9; i++) {
      const x = -4.8 + i * 1.2;
      B.sph({ x, y: 3.05, z: lz, w: 0.13, h: 0.17, d: 0.13, bulb: true });
      i % 2 || glow(x, 3.05, lz, 0.9);
    }
    // Tabela (sehpa)
    const ez = z1 - 6.4;
    [-1, 1].forEach((k) => B.box({ x: k * 0.5, y: 0.85, z: ez + 0.05, w: 0.07, h: 1.75, d: 0.07, rz: k * -0.12, c: '#D9A47A', hull: 0.012 }));
    B.box({ x: 0, y: 1.5, z: ez, w: 1.36, h: 1.36, d: 0.05, c: '#FFFFFF' });
    const fs = plane(1.28, 1.28, '#FFFFFF', S.futureTex);
    fs.position.set(0, 1.5, ez + 0.03);
    fs.userData.hf = { t: 'gelecek' };
    S.picks.push(fs);
    obstacle(0, ez, 0.6, 0.7);
    const g = B.mesh();
    g.add(fs);
    S.future.add(g);
    S.futureLamp = [0, lz];
  }

  function heartGeo(T3) {
    const s = new T3.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(-0.12, -0.36, -0.5, -0.12, -0.5, 0.15);
    s.bezierCurveTo(-0.5, 0.44, -0.18, 0.52, 0, 0.27);
    s.bezierCurveTo(0.18, 0.52, 0.5, 0.44, 0.5, 0.15);
    s.bezierCurveTo(0.5, -0.12, 0.12, -0.36, 0, -0.5);
    const g = new T3.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 1, curveSegments: 6 });
    g.center();
    return g;
  }
  function fillJar(s, n) {
    const T3 = S.THREE;
    const count = Math.min(80, n);
    if (!count || s.hearts) return;
    const im = new T3.InstancedMesh(S.G.heart, S.matHeart, count);
    const m = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), p = new T3.Vector3(), sc = new T3.Vector3(), c = new T3.Color();
    const rnd = K.rng(K.hash(s.ym + 'k'));
    const P = S.P, cols = [P.red, P.pink, '#FFB3CE', P.lilac];
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, rr2 = Math.sqrt(rnd()) * 0.18;
      p.set(s.jarPos[0] + Math.cos(a) * rr2, 0.66 + Math.floor(i / 9) * 0.066 + rnd() * 0.03, s.jarPos[1] + Math.sin(a) * rr2);
      e.set((rnd() - 0.5) * 1.6, rnd() * Math.PI * 2, (rnd() - 0.5) * 1.2);
      m.compose(p, q.setFromEuler(e), sc.setScalar(0.1));
      im.setMatrixAt(i, m);
      im.setColorAt(i, c.set(cols[i % cols.length]));
    }
    s.hearts = im;
    s.group.add(im);
  }

  /* ---------------- Yakındaki salonların dokuları ---------------- */
  const nextTick = () => new Promise((r) => setTimeout(r, 16));
  async function loadSalon(s) {
    const tok = S.tok, T3 = S.THREE;
    const alive = () => S && S.tok === tok && s.want;
    s.state = 'loading';
    try {
      if (!s.month) s.month = await K.arsiv.month(s.ym);
      if (!alive()) return dropSalon(s);
      const b = texBoard(s, s.month, S.P);
      setMap(s.board.material, b);
      S.renderer.initTexture(b);
      fillJar(s, (s.month.counts && s.month.counts.kalpk) || 0);
      S.dirty = true;
      for (const it of s.letterMeshes) {
        if (!alive()) return dropSalon(s);
        const t = texLetter(it.n, S.P);
        setMap(it.mesh.material, t);
        S.renderer.initTexture(t);
        S.dirty = true;
        await nextTick();
      }
      for (const it of s.paintings) {
        if (!it.p) continue;
        if (!alive()) return dropSalon(s);
        const img = new Image();
        img.decoding = 'async';
        img.src = it.p.thumb;
        try {
          await img.decode();
        } catch (e) {
          continue;
        }
        if (!alive()) return dropSalon(s);
        const t = new T3.Texture(img);
        t.anisotropy = Math.min(4, S.aniso);
        t.needsUpdate = true;
        const ar = (img.naturalWidth || 1) / (img.naturalHeight || 1);
        it.mesh.scale.set(1.06 * Math.min(1, ar), 1.06 * Math.min(1, 1 / ar), 1);
        setMap(it.mesh.material, t);
        S.renderer.initTexture(t);
        S.dirty = true;
        await nextTick();
      }
      if (!alive()) return dropSalon(s);
      s.state = 'loaded';
    } catch (e) {
      s.state = 'none';
      s.want = false;
    }
  }
  function dropSalon(s) {
    const drop = (mat) => {
      if (!mat.map) return;
      mat.map.dispose();
      setMap(mat, null);
    };
    s.paintings.forEach((it) => it.p && drop(it.mesh.material));
    s.letterMeshes.forEach((it) => drop(it.mesh.material));
    s.board && drop(s.board.material);
    s.state = 'none';
    S && (S.dirty = true);
  }
  function stream() {
    let busy = false, best = null;
    salons.forEach((s) => {
      const d = Math.hypot(S.pos.x - s.cx, S.pos.z - s.zc);
      s.dist = d;
      const vis = d < SHOW || S.loc === s.k;
      if (s.group.visible !== vis) (s.group.visible = vis), (S.dirty = true);
      s.want = d < NEAR_IN || (s.want && d < NEAR_OUT);
      if (s.state === 'loading') busy = true;
      if (!s.want && s.state === 'loaded') dropSalon(s);
      if (s.want && s.state === 'none' && (!best || d < best.dist)) best = s;
      const ws = d < SIGN_IN || (s.signTex && d < SIGN_OUT);
      if (ws && !s.signTex) {
        s.signTex = texDoorSign(s, S.P);
        setMap(s.signMesh.material, s.signTex);
        S.dirty = true;
      } else if (!ws && s.signTex) {
        s.signTex.dispose();
        s.signTex = null;
        setMap(s.signMesh.material, null);
        S.dirty = true;
      }
    });
    const hv = S.pos.z > HALL.z0 - SHOW;
    if (S.hall.visible !== hv) (S.hall.visible = hv), (S.dirty = true);
    const fv = S.pos.z < S.zEnd + SHOW;
    if (S.future.visible !== fv) (S.future.visible = fv), (S.dirty = true);
    if (best && !busy) loadSalon(best);
  }

  /* ---------------- Konum, yürüme, çarpışma ---------------- */
  function areaOf(x, z) {
    if (z > HALL.z0) return 'hol';
    if (z < S.zEnd) return 'gel';
    if (Math.abs(x) <= CW) return 'kor';
    const k = Math.floor((HALL.z0 - z) / SEG) * 2 + (x > 0 ? 1 : 0);
    return k < salons.length ? k : 'kor';
  }
  function free(x, z) {
    for (const w of S.walls) {
      const cx = x < w.x0 ? w.x0 : x > w.x1 ? w.x1 : x, cz = z < w.z0 ? w.z0 : z > w.z1 ? w.z1 : z;
      if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < RAD * RAD) return false;
    }
    return true;
  }
  function tryMove(dx, dz) {
    const p = S.pos;
    if (free(p.x + dx, p.z + dz)) return (p.x += dx), (p.z += dz), true;
    if (Math.abs(dx) > 1e-4 && free(p.x + dx, p.z)) return (p.x += dx), true;
    if (Math.abs(dz) > 1e-4 && free(p.x, p.z + dz)) return (p.z += dz), true;
    return false;
  }
  function doorNodes(a) {
    if (a === 'hol') return [[0, HALL.z0 + 0.8], [0, HALL.z0 - 0.8]];
    if (a === 'gel') return [[0, S.zEnd - 0.8], [0, S.zEnd + 0.8]];
    if (typeof a === 'number') {
      const s = salons[a];
      return [[s.side * (CW + 1.0), s.zc], [s.side * (CW - 0.8), s.zc]];
    }
    return [];
  }
  function walkTo(x, z) {
    const a = areaOf(S.pos.x, S.pos.z), b = areaOf(x, z);
    const pts = a === b ? [] : [...doorNodes(a), ...doorNodes(b).reverse()];
    S.path = [...pts.map(([px, pz]) => ({ x: px, z: pz })), { x, z, end: true }];
    S.prog = null;
    S.marker.position.set(x, 0.03, z);
    S.marker.visible = true;
    S.dirty = true;
  }
  function firstObst(ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
    let best = null, bt = 2;
    S.obst.forEach((o) => {
      const r = o.r + RAD;
      if ((bx - o.x) ** 2 + (bz - o.z) ** 2 < r * r || (ax - o.x) ** 2 + (az - o.z) ** 2 < r * r) return;
      const t = Math.max(0, Math.min(1, ((o.x - ax) * dx + (o.z - az) * dz) / L2));
      const cx = ax + dx * t, cz = az + dz * t;
      if ((cx - o.x) ** 2 + (cz - o.z) ** 2 < r * r && t < bt) (bt = t), (best = o);
    });
    return best;
  }
  function avoid() {
    for (let i = 0; i < 2; i++) {
      const w = S.path[0];
      w.checked = true;
      const o = firstObst(S.pos.x, S.pos.z, w.x, w.z);
      if (!o) return;
      const ax = w.x - S.pos.x, az = w.z - S.pos.z, l = Math.hypot(ax, az) || 1;
      const px = -az / l, pz = ax / l;
      const sgn = (o.x - S.pos.x) * px + (o.z - S.pos.z) * pz > 0 ? -1 : 1;
      const r = o.r + RAD + 0.4;
      S.path.unshift({ x: o.x + px * sgn * r, z: o.z + pz * sgn * r });
    }
  }
  function follow(dt) {
    let w = S.path[0];
    if (!w.checked) avoid(), (w = S.path[0]);
    const dx = w.x - S.pos.x, dz = w.z - S.pos.z, d = Math.hypot(dx, dz);
    if (d < (w.end ? 0.1 : 0.3)) {
      S.path.shift();
      S.prog = null;
      if (!S.path.length) S.marker.visible = false;
      return true;
    }
    const sp = Math.min(SPEED * dt, d);
    tryMove((dx / d) * sp, (dz / d) * sp);
    if (!S.drag) S.yaw += angDiff(Math.atan2(-dx, -dz), S.yaw) * Math.min(1, dt * 3.2);
    if (!S.prog || d < S.prog.d - 0.05) S.prog = { d, t: 0 };
    else if ((S.prog.t += dt) > 0.7) {
      S.path = [];
      S.marker.visible = false;
    }
    return true;
  }
  function step(dt) {
    // Yavaş karelerde de gerçek hızla yürü, ama çarpışma için en fazla 0.1 m'lik adımlarla
    const n = Math.max(1, Math.ceil((SPEED * dt) / 0.1));
    let moved = false;
    for (let i = 0; i < n; i++) moved = step1(dt / n) || moved;
    return moved;
  }
  function step1(dt) {
    let moved = false;
    const turn = (keys.arrowleft ? 1 : 0) - (keys.arrowright ? 1 : 0);
    if (turn) (S.yaw += turn * 1.9 * dt), (moved = true);
    const fwd = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0) - joy.y;
    const str = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + joy.x;
    if (Math.abs(fwd) > 0.05 || Math.abs(str) > 0.05) {
      if (S.path.length) (S.path = []), (S.marker.visible = false);
      const sy = Math.sin(S.yaw), cy = Math.cos(S.yaw);
      let dx = -sy * fwd + cy * str, dz = -cy * fwd - sy * str;
      const l = Math.hypot(dx, dz);
      if (l > 1) (dx /= l), (dz /= l);
      tryMove(dx * SPEED * dt, dz * SPEED * dt);
      moved = true;
    } else if (S.path.length) moved = follow(dt) || moved;
    return moved;
  }
  function lampTarget() {
    const l = S.loc;
    if (l === 'hol') return [0, 3.4, -4.6];
    if (l === 'gel') return [S.futureLamp[0], 2.9, S.futureLamp[1]];
    if (typeof l === 'number') return [salons[l].lampAt[0], SH - 0.8, salons[l].lampAt[1]];
    return [0, CH - 0.5, S.pos.z - 1.2];
  }

  /* ---------------- Döngü ---------------- */
  function loop(now) {
    if (!S || !S.running) return;
    S.raf = requestAnimationFrame(loop);
    const dt = Math.min(0.12, S.last ? (now - S.last) / 1000 : 0.016);
    S.last = now;
    let moved = step(dt);
    S.tick += dt;
    if (S.tick > 0.35) (S.tick = 0), slow();
    if (S.night) {
      const [x, y, z] = lampTarget();
      const lp = S.lamp.position, k = Math.min(1, dt * 4);
      if (Math.abs(lp.x - x) + Math.abs(lp.z - z) + Math.abs(lp.y - y) > 0.02) {
        lp.set(lp.x + (x - lp.x) * k, lp.y + (y - lp.y) * k, lp.z + (z - lp.z) * k);
        moved = true;
      }
    }
    if (moved || S.dirty) {
      S.dirty = false;
      S.camera.position.set(S.pos.x, EYE, S.pos.z);
      S.camera.rotation.set(S.pitch, S.yaw, 0);
      S.renderer.render(S.scene, S.camera);
      S.frames++;
    }
  }
  function slow() {
    const loc = areaOf(S.pos.x, S.pos.z);
    if (loc !== S.loc) {
      S.loc = loc;
      if (typeof loc === 'number') visit(salons[loc].ym);
      hud();
    }
    stream();
    const n = document.body.classList.contains('night') || document.body.classList.contains('gece-modu');
    if (n !== S.night) applyNight(n);
  }
  function applyNight(n) {
    S.night = n;
    const bg = n ? '#2A1D3E' : '#FFD9CB';
    S.scene.background.set(bg);
    S.scene.fog.color.set(bg);
    S.hemi.intensity = n ? 0.62 : 0.78;
    S.hemi.color.set(n ? '#9C8CD8' : '#FFF4EA');
    S.hemi.groundColor.set(n ? '#4A3358' : '#F6DDF6');
    S.sun.intensity = n ? 0.1 : 0.42;
    S.lamp.intensity = n ? 1.05 : 0;
    const [x, y, z] = lampTarget();
    S.lamp.position.set(x, y, z);
    S.matBulb.color.set(n ? '#FFE27A' : '#FFF8E6');
    S.matWindow.color.set(n ? '#4E4290' : '#FFFFFF');
    S.glows.visible = n;
    S.basics.forEach(tint);
    S.dirty = true;
  }
  function pause() {
    if (!S) return;
    S.running = false;
    cancelAnimationFrame(S.raf);
    Object.keys(keys).forEach((k) => (keys[k] = false));
  }
  function resume() {
    if (!S || S.running || !S.ready || S.lost) return;
    S.running = true;
    S.last = 0;
    S.dirty = true;
    S.raf = requestAnimationFrame(loop);
  }
  function resize() {
    if (!S) return;
    const r = ui.stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    S.renderer.setSize(w, h, false);
    const ar = w / h;
    S.camera.aspect = ar;
    S.camera.fov = ar < 1 ? 70 + (1 - ar) * 30 : 70;
    S.camera.updateProjectionMatrix();
    S.dirty = true;
  }

  /* ---------------- Dokunma ve bakış ---------------- */
  function onDown(e) {
    if (S.drag || (e.button && e.button !== 0)) return;
    S.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false };
    try {
      S.canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    hint(false);
  }
  function onMove(e) {
    const d = S && S.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 8) d.moved = true;
    if (d.moved) {
      S.yaw += dx * LOOK;
      S.pitch = K.clamp(S.pitch + dy * LOOK, -0.8, 0.65);
      S.dirty = true;
    }
  }
  function onUp(e) {
    const d = S && S.drag;
    if (!d || d.id !== e.pointerId) return;
    S.drag = null;
    // Asıl dokunuş "click"te işlenir: pencere pointerup'ta açılırsa ardından gelen click onu hemen kapatırdı.
    S.tapOK = e.type === 'pointerup' && !d.moved && performance.now() - d.t < 650;
    S.tapAt = performance.now();
  }
  function onClick(e) {
    if (!S || !S.tapOK || performance.now() - S.tapAt > 900) return;
    S.tapOK = false;
    tap(e.clientX, e.clientY);
  }
  function shown(o) {
    for (; o; o = o.parent) if (!o.visible) return false;
    return true;
  }
  function tap(cx, cy) {
    const T3 = S.THREE, r = S.canvas.getBoundingClientRect();
    const ndc = new T3.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    const ray = new T3.Raycaster();
    ray.far = 45;
    S.camera.updateMatrixWorld();
    ray.setFromCamera(ndc, S.camera);
    const list = S.picks.concat(S.shells).filter(shown);
    const h = ray.intersectObjects(list, false)[0];
    if (!h) return;
    const hf = h.object.userData.hf;
    if (hf) return interact(hf, cx, cy);
    const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : null;
    if (n && n.y < -0.5) return;
    const p = h.point.clone();
    if (n && Math.abs(n.y) < 0.5) p.addScaledVector(ray.ray.direction, -0.5);
    walkTo(p.x, p.z);
  }
  function interact(hf, cx, cy) {
    K.audio && K.audio.sfx && K.audio.sfx.pop && K.audio.sfx.pop();
    if (hf.t === 'foto') return openPhoto(hf.p);
    if (hf.t === 'mektup') return openLetter(hf.n);
    if (hf.t === 'tabela') return openStats(hf.s);
    if (hf.t === 'kapi') return git(hf.s.ym);
    if (hf.t === 'kavanoz') return jarTap(hf.s, cx, cy);
    if (hf.t === 'bos') return K.fx.toast(`${K.esc(hf.s.ad)} duvarları fotoğraf bekliyor. Günün Karesi'ne ya da kartpostala ekledikçe buraya asılır.`);
    if (hf.t === 'heykel') {
      K.fx.burst(cx, cy, { count: 10, shapes: ['heart'] });
      return K.fx.toast('Kalenin fiyonku. Her salon onun etrafında büyüyor.');
    }
    if (hf.t === 'gelecek') {
      const last = months[months.length - 1];
      return K.fx.toast(`Her ay buraya yeni bir salon eklenecek. Sıradaki: <b>${K.esc(last ? K.arsiv.monthName(nextYm(last)) : '')}</b>`);
    }
  }
  async function jarTap(s, cx, cy) {
    K.fx.burst(cx, cy, { count: 9, shapes: ['heart'] });
    const m = s.month || (s.month = await K.arsiv.month(s.ym));
    const n = (m.counts && m.counts.kalpk) || 0;
    K.fx.toast(n ? `<b>${K.esc(s.ad)}</b> · kavanoza <b>${K.num ? K.num(n) : n}</b> kalp düştü` : `<b>${K.esc(s.ad)}</b> · bu ay kavanoza kalp düşmemiş. Bir tane atmaya ne dersin?`);
  }

  /* ---------------- Pencereler (modal) ---------------- */
  async function openPhoto(p) {
    const m = K.ui.modal({
      label: 'Tablo',
      cls: 'hf-modal',
      html: `<figure class="hf-buyuk"><img alt=""></figure>${p.text ? `<p class="hf-m-yazi">“${K.esc(p.text)}”</p>` : ''}<p class="hf-m-alt">${K.esc(p.label)} · ${K.esc(nameOf(p.who))}${fmtDay(p.day) ? ` · ${K.esc(fmtDay(p.day))}` : ''}</p>`,
    });
    const img = K.$('.hf-buyuk img', m.el);
    img.src = p.thumb;
    if (p.full && K.medya) {
      const url = await K.medya.rowUrl(p.full, 'img');
      url && (img.src = url);
    }
  }
  function openLetter(n) {
    K.ui.modal({ label: 'Mektup', cls: 'hf-modal', html: `<div class="hf-mektup"><small>${K.esc(n.label)}</small><p>${K.esc(n.text)}</p><span>— ${K.esc(nameOf(n.who))}${fmtDay(n.day) ? ` · ${K.esc(fmtDay(n.day))}` : ''}</span></div>` });
  }
  async function openStats(s) {
    const m = s.month || (s.month = await K.arsiv.month(s.ym));
    const c = m.counts || {};
    const st = [[m.photos.length, 'kare'], [m.notes.length, 'yazı'], [c.kalpk || 0, 'kalp kavanoza'], [(c.kucak || 0) + (c.selam || 0), 'sarılma ve selam'], [c.tsmesaj || 0, 'sesli mesaj'], [c.mektup || 0, 'mektup']];
    K.ui.modal({ label: 'Ayın sayıları', cls: 'hf-modal', html: `<h3 class="hf-m-baslik">${K.esc(s.ad)}</h3><div class="hf-sayilar">${st.map(([n, l]) => `<div><b>${K.num ? K.num(n) : n}</b><small>${K.esc(l)}</small></div>`).join('')}</div>` });
  }

  /* ---------------- Gezinme: salon atlama, arayüz ---------------- */
  const ORDER = () => ['hol', ...months, 'gel'];
  function curIndex() {
    const l = S ? S.loc : 'hol';
    if (l === 'hol') return 0;
    if (l === 'gel') return months.length + 1;
    if (typeof l === 'number') return l + 1;
    return null;
  }
  function neighbor(dir) {
    const i = curIndex(), o = ORDER();
    if (i !== null) return o[i + dir] || null;
    const z = S.pos.z;
    if (dir > 0) {
      const s = salons.find((x) => x.zc < z - 0.5);
      return s ? s.ym : 'gel';
    }
    const back = salons.filter((x) => x.zc > z + 0.5);
    return back.length ? back[back.length - 1].ym : 'hol';
  }
  function place(t) {
    S.path = [];
    S.marker.visible = false;
    S.pitch = -0.06;
    if (t === 'hol') (S.pos = { x: 0, z: -1.0 }), (S.yaw = 0);
    else if (t === 'gel') (S.pos = { x: 0, z: S.zEnd - 0.9 }), (S.yaw = 0);
    else {
      const s = salons.find((x) => x.ym === t);
      S.pos = { x: s.side * (CW + 1.2), z: s.zc };
      S.yaw = -s.side * (Math.PI / 2);
    }
    S.tick = 1;
    S.dirty = true;
  }
  function git(t) {
    if (!S || !S.ready) return false;
    if (t !== 'hol' && t !== 'gel' && !salons.some((s) => s.ym === t)) return false;
    hint(false);
    if (K.reduced) {
      place(t);
      slow();
      return true;
    }
    ui.perde.classList.add('on');
    clearTimeout(S.fadeT);
    S.fadeT = setTimeout(() => {
      if (!S) return;
      place(t);
      slow();
      ui.perde.classList.remove('on');
    }, 190);
    return true;
  }
  function visited() {
    return K.store.get('hafizaGezilen', []);
  }
  function visit(ym) {
    const seen = visited();
    if (!seen.includes(ym)) {
      seen.push(ym);
      K.store.set('hafizaGezilen', seen.slice(-400));
    }
    if (months.length && months.every((m) => seen.includes(m)) && !K.store.get('hafizaHepsi', false)) {
      K.store.set('hafizaHepsi', true);
      K.stickers.award('hafizahepsi');
      K.fx.confetti({ count: 70, shapes: ['heart', 'star'] });
      K.fx.toast('<b>Bütün salonları gezdin!</b> Sarayın her ayı artık senin de hafızanda.', { duration: 4200 });
    }
  }
  function hud() {
    if (!S) return;
    const l = S.loc;
    ui.yer.textContent = l === 'hol' ? 'Giriş holü' : l === 'gel' ? 'Gelecek aylar' : l === 'kor' ? 'Koridor' : salons[l].ad;
    ui.sel.value = typeof l === 'number' ? salons[l].ym : l;
    const seen = visited();
    ui.sayac.textContent = `${months.filter((m) => seen.includes(m)).length}/${months.length} salon`;
    ui.prev.disabled = !neighbor(-1);
    ui.next.disabled = !neighbor(1);
  }
  function fillSelect() {
    ui.sel.innerHTML = `<option value="hol">Giriş holü</option><option value="kor" hidden disabled>Koridor</option>${months
      .map((ym) => `<option value="${ym}">${K.esc(K.arsiv.monthName(ym))}</option>`)
      .join('')}<option value="gel">Gelecek aylar</option>`;
  }
  function hint(on) {
    if (!ui) return;
    clearTimeout(ui.hintT);
    ui.ipucu.hidden = !on;
    if (on) ui.hintT = setTimeout(() => hint(false), 7000);
  }
  function setFull(on) {
    if (!ui) return;
    const st = ui.stage;
    if (on && !ph) {
      ph = document.createComment('hf');
      st.before(ph);
      document.body.appendChild(st);
      st.classList.add('tam');
      document.body.classList.add('hf-tam-acik');
    } else if (!on && ph) {
      ph.replaceWith(st);
      ph = null;
      st.classList.remove('tam');
      document.body.classList.remove('hf-tam-acik');
    }
    ui.tam.setAttribute('aria-pressed', on ? 'true' : 'false');
    ui.tam.setAttribute('aria-label', on ? 'Tam ekrandan çık' : 'Tam ekran');
    resize();
  }

  /* ---------------- 2B liste (yedek) ---------------- */
  function listHtml() {
    const rows = months
      .slice()
      .reverse()
      .map((ym) => {
        const g = groups[ym] || { photos: [], notes: [] };
        const th = spread(g.photos, 4)
          .map((p) => `<button type="button" class="hf-kucuk" data-hf-foto="${K.esc(p.id)}" aria-label="Fotoğrafı aç"><img src="${K.esc(p.thumb)}" alt="" loading="lazy"></button>`)
          .join('');
        const n = g.notes.length ? g.notes[g.notes.length - 1] : null;
        return `<article class="hf-ay-kart"><div class="hf-ay-bas"><h4>${K.esc(K.arsiv.monthName(ym))}</h4><small>${g.photos.length} kare · ${g.notes.length} yazı</small></div>${th ? `<div class="hf-kucukler">${th}</div>` : '<p class="muted small">Bu ayın duvarları henüz boş.</p>'}${n ? `<p class="hf-alinti">“${K.esc(n.text.length > 120 ? n.text.slice(0, 118) + '…' : n.text)}” <small>${K.esc(nameOf(n.who))}</small></p>` : ''}${mode === '3b' ? `<button type="button" class="btn soft small" data-hf-sec="${ym}">Salona git</button>` : ''}</article>`;
      })
      .join('');
    const note = mode === '2b' ? `<div class="hf-yedek-not"><p><b>Saray bu telefonda üç boyutlu açılamadı.</b> Salonlar burada ay ay sıralı duruyor.</p></div>` : '';
    return `${note}<div class="hf-aylar">${rows || '<p class="muted center">Henüz bir ay yok.</p>'}</div><p class="center"><a class="btn red" href="#muze">Kale Müzesi'ne git</a></p>`;
  }
  function renderList() {
    if (!ui || ui.liste.hidden) return;
    ui.liste.innerHTML = listHtml();
  }
  function findPhoto(id) {
    for (const ym of months) {
      const p = ((groups[ym] || {}).photos || []).find((x) => x.id === id);
      if (p) return p;
    }
    return null;
  }
  function fallback() {
    mode = '2b';
    teardown();
    ui.stage.hidden = true;
    ui.listBtn.hidden = true;
    ui.liste.hidden = false;
    renderList();
    if (!months.length && K.arsiv) loadData().then(renderList, () => {});
  }

  /* ---------------- Kurulum ve temizlik ---------------- */
  async function start() {
    const my = ++runId;
    mode = '';
    ui.stage.hidden = false;
    ui.listBtn.hidden = false;
    ui.durum.hidden = false;
    ui.durumYazi.textContent = 'Saray kuruluyor…';
    let THREE;
    try {
      if (!K.arsiv) throw new Error('arsiv');
      if (!glOk()) throw new Error('webgl');
      [THREE] = await Promise.all([loadThree(), loadData(), fontsReady()]);
    } catch (e) {
      if (my !== runId) return;
      return fallback();
    }
    if (my !== runId || K.activeRoom !== 'hafiza') return;
    try {
      build(THREE, my);
      mode = '3b';
      renderList();
    } catch (e) {
      console.warn('[hafiza] saray kurulamadı', e);
      fallback();
    }
  }

  function build(T3, tok) {
    const renderer = new T3.WebGLRenderer({ antialias: true, powerPreference: 'default' });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    const canvas = renderer.domElement;
    canvas.className = 'hf-tuval';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Hafıza Sarayı: içinde yürünen üç boyutlu saray');
    ui.stage.insertBefore(canvas, ui.stage.firstChild);
    const scene = new T3.Scene();
    scene.background = new T3.Color('#FFD9CB');
    scene.fog = new T3.Fog('#FFD9CB', 13, 42);
    const camera = new T3.PerspectiveCamera(75, 1, 0.05, 60);
    camera.rotation.order = 'YXZ';
    const P = pal();
    S = { THREE: T3, renderer, canvas, scene, camera, tok, P, aniso: Math.min(8, renderer.capabilities.getMaxAnisotropy()), pos: { x: 0, z: -1 }, yaw: 0, pitch: -0.06, path: [], walls: [], obst: [], picks: [], shells: [], basics: [], dirty: true, running: false, ready: false, raf: 0, last: 0, tick: 1, frames: 0, loc: null, night: null, drag: null };
    const grad = new T3.DataTexture(new Uint8Array([150, 210, 255]), 3, 1, renderer.capabilities.isWebGL2 ? T3.RedFormat : T3.LuminanceFormat);
    grad.minFilter = grad.magFilter = T3.NearestFilter;
    grad.generateMipmaps = false;
    grad.needsUpdate = true;
    S.G = {
      box: new T3.BoxGeometry(1, 1, 1),
      cyl: new T3.CylinderGeometry(0.5, 0.5, 1, 18),
      cone: new T3.CylinderGeometry(0, 0.5, 1, 18),
      sph: new T3.SphereGeometry(0.5, 18, 12),
      tor: new T3.TorusGeometry(0.5, 0.05, 8, 32),
      plane: new T3.PlaneGeometry(1, 1),
      glass: new T3.CylinderGeometry(0.3, 0.3, 0.74, 22, 1, true),
      heart: heartGeo(T3),
    };
    S.grad = grad;
    S.matToon = new T3.MeshToonMaterial({ vertexColors: true, gradientMap: grad });
    S.matHull = new T3.MeshBasicMaterial({ color: P.ink, side: T3.BackSide });
    S.matBulb = new T3.MeshBasicMaterial({ color: '#FFF8E6' });
    S.matGlass = new T3.MeshLambertMaterial({ color: '#EAF7FF', transparent: true, opacity: 0.34, depthWrite: false, side: T3.DoubleSide });
    S.matHeart = new T3.MeshToonMaterial({ color: '#FFFFFF', gradientMap: grad });
    S.matProxy = new T3.MeshBasicMaterial({ visible: false });
    S.mosaic = texMosaic(P);
    S.banner = texBanner(P);
    S.empty = texEmpty(P);
    S.matWindow = new T3.MeshBasicMaterial({ map: texSky() });
    S.matGlow = new T3.SpriteMaterial({ map: texGlow(), blending: T3.AdditiveBlending, depthWrite: false, transparent: true });
    S.hemi = new T3.HemisphereLight('#FFF4EA', '#F6DDF6', 0.78);
    S.sun = new T3.DirectionalLight('#FFD2A8', 0.42);
    S.sun.position.set(-3, 5, 2);
    S.lamp = new T3.PointLight('#FFC27A', 0, 11, 1.4);
    scene.add(S.hemi, S.sun, S.lamp);
    S.hall = new T3.Group();
    S.corridor = new T3.Group();
    S.future = new T3.Group();
    S.glows = new T3.Group();
    scene.add(S.hall, S.corridor, S.future, S.glows);
    // Salonlar
    salons = months.map((ym, k) => {
      const seg = k >> 1, side = k % 2 ? 1 : -1, zTop = HALL.z0 - seg * SEG;
      const g = groups[ym] || { photos: [], notes: [] };
      const grp = new T3.Group();
      scene.add(grp);
      return { k, ym, ad: K.arsiv.monthName(ym), seg, side, zTop, zc: zTop - SEG / 2, cx: side * (CW + SW / 2), photos: g.photos, notes: g.notes, shown: spread(g.photos, SLOTS.length), letters: spread(g.notes.filter((n) => n.text.length > 1), 3), state: 'none', want: false, month: null, paintings: [], letterMeshes: [], group: grp, dist: 99 };
    });
    const segs = Math.max(1, Math.ceil(salons.length / 2));
    S.zEnd = HALL.z0 - segs * SEG;
    S.futureTex = texFuture(P);
    buildHall(P);
    buildCorridor(P, segs);
    salons.forEach((s) => buildSalon(s, P));
    buildFuture(P);
    S.marker = new T3.Mesh(new T3.RingGeometry(0.16, 0.25, 28), new T3.MeshBasicMaterial({ color: P.red, transparent: true, opacity: 0.85, depthWrite: false }));
    S.marker.rotation.x = -Math.PI / 2;
    S.marker.visible = false;
    scene.add(S.marker);
    // Olaylar
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (!S || S.closing) return;
      S.lost = true;
      pause();
      ui.durum.hidden = false;
      ui.durumYazi.innerHTML = 'Saray bir an dinlendi. <button type="button" class="btn soft small" data-hf-yeniden>Yeniden kur</button>';
    });
    if (window.ResizeObserver) (S.ro = new ResizeObserver(resize)).observe(ui.stage);
    else window.addEventListener('resize', resize);
    fillSelect();
    resize();
    place('hol');
    slow();
    S.ready = true;
    ui.durum.hidden = true;
    hud();
    // Saray ekrana tam sığmıyorsa oda görünümünü ona doğru kaydır (kullanıcı henüz kaydırmadıysa)
    const view = ui.stage.closest('.room-view');
    if (view && !ph && view.scrollTop < 40) {
      const head = view.querySelector('.room-head'), r = ui.stage.getBoundingClientRect(), vr = view.getBoundingClientRect();
      if (r.bottom > vr.bottom) view.scrollBy({ top: r.top - (head ? head.getBoundingClientRect().bottom : vr.top) - 12, behavior: K.reduced ? 'auto' : 'smooth' });
    }
    if (K.store.get('hafizaIpucu', 0) < 3) {
      K.store.set('hafizaIpucu', K.store.get('hafizaIpucu', 0) + 1);
      hint(true);
    }
    if (!document.hidden) resume();
  }

  function teardown() {
    clearTimeout(S && S.fadeT);
    setFull(false);
    hint(false);
    Object.keys(keys).forEach((k) => (keys[k] = false));
    joy.x = joy.y = 0;
    if (!S) return;
    const s0 = S;
    s0.closing = true;
    pause();
    s0.ro && s0.ro.disconnect();
    window.removeEventListener('resize', resize);
    const seen = new Set();
    const free1 = (x) => x && !seen.has(x) && (seen.add(x), x.dispose());
    s0.scene.traverse((o) => {
      free1(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (!m) return;
        free1(m.map);
        free1(m.gradientMap);
        free1(m);
      });
    });
    salons.forEach((s) => free1(s.signTex));
    Object.values(s0.G).forEach(free1);
    [s0.mosaic, s0.banner, s0.empty, s0.futureTex, s0.grad, s0.matGlow.map, s0.matWindow.map].forEach(free1);
    [s0.matToon, s0.matHull, s0.matBulb, s0.matGlass, s0.matHeart, s0.matProxy, s0.matGlow, s0.matWindow].forEach(free1);
    s0.renderer.dispose();
    try {
      s0.renderer.forceContextLoss();
    } catch (e) {}
    s0.canvas.remove();
    S = null;
    salons = [];
  }

  /* ---------------- Oda ---------------- */
  function onKey(e) {
    if (K.activeRoom !== 'hafiza' || !S) return;
    const t = e.target;
    if ((t && t.closest && t.closest('input, textarea, select')) || document.body.classList.contains('has-modal')) return;
    const k = String(e.key || '').toLowerCase();
    if (k === 'escape' && ph && e.type === 'keydown') return setFull(false);
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      keys[k] = e.type === 'keydown';
      e.preventDefault();
      if (e.type === 'keydown') hint(false);
    }
  }
  const expandSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

  K.room({
    id: 'hafiza',
    wing: 'anilar',
    title: 'Hafıza Sarayı',
    sub: 'Her ay bir salon',
    icon: 'house',
    color: '#FFE4D6',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="hf-sahne" id="hfSahne">
          <div class="hf-ust"><span class="hf-yer" id="hfYer">Saray</span><span class="hf-sayac" id="hfSayac"></span><button type="button" class="hf-dug hf-tam-dug" data-hf-tam aria-pressed="false" aria-label="Tam ekran">${expandSvg}</button></div>
          <p class="hf-ipucu" id="hfIpucu" hidden>Sürükle: etrafına bak · Yere dokun: oraya yürü · Soldaki topla da yürüyebilirsin</p>
          <div class="hf-joy" id="hfJoy" aria-hidden="true"><i></i></div>
          <div class="hf-alt"><button type="button" class="hf-dug" data-hf-git="-1" aria-label="Önceki ay">‹</button><select class="hf-ay" id="hfAy" aria-label="Ay seç"></select><button type="button" class="hf-dug" data-hf-git="1" aria-label="Sonraki ay">›</button></div>
          <div class="hf-perde" id="hfPerde"></div>
          <div class="hf-durum" id="hfDurum"><span class="hf-fiyonk">${A.bow ? A.bow('#E3174D') : ''}</span><p id="hfDurumYazi">Saray kuruluyor…</p></div>
        </div>
        <div class="room-intro hf-intro"><p>Kalenin her ayı bu sarayda bir salon. Parmağınla sürükleyip etrafına bak, yere dokunup yürü; tablolara, masadaki mektuplara ve köşedeki kavanoza dokun. Koridorun sonu gelecek aylara açılıyor.</p></div>
        <div class="row center hf-baglar"><button type="button" class="btn soft small" data-hf-liste>Liste olarak gör</button><a class="btn ghost small" href="#muze">Kale Müzesi</a></div>
        <div class="hf-liste" id="hfListe" hidden></div>`;
      ui = {
        stage: K.$('#hfSahne', el),
        yer: K.$('#hfYer', el),
        sayac: K.$('#hfSayac', el),
        tam: K.$('[data-hf-tam]', el),
        ipucu: K.$('#hfIpucu', el),
        sel: K.$('#hfAy', el),
        prev: K.$('[data-hf-git="-1"]', el),
        next: K.$('[data-hf-git="1"]', el),
        perde: K.$('#hfPerde', el),
        durum: K.$('#hfDurum', el),
        durumYazi: K.$('#hfDurumYazi', el),
        liste: K.$('#hfListe', el),
        listBtn: K.$('[data-hf-liste]', el),
      };
      // Sahne düğmeleri (sahne tam ekranda gövdeye taşınabildiği için kendi dinleyicisi var)
      ui.stage.addEventListener('click', (e) => {
        const g = e.target.closest('[data-hf-git]');
        if (g) {
          const t = neighbor(+g.dataset.hfGit);
          t && git(t);
          return;
        }
        if (e.target.closest('[data-hf-tam]')) return setFull(!ph);
        if (e.target.closest('[data-hf-yeniden]')) {
          teardown();
          start();
        }
      });
      ui.sel.addEventListener('change', () => {
        git(ui.sel.value);
        ui.sel.blur();
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-hf-liste]')) {
          ui.liste.hidden = !ui.liste.hidden;
          ui.listBtn.textContent = ui.liste.hidden ? 'Liste olarak gör' : 'Listeyi gizle';
          return renderList();
        }
        const f = e.target.closest('[data-hf-foto]');
        if (f) {
          const p = findPhoto(f.dataset.hfFoto);
          return p && openPhoto(p);
        }
        const s = e.target.closest('[data-hf-sec]');
        if (s && git(s.dataset.hfSec)) ui.stage.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center' });
      });
      // Yürüme topu
      const J = K.$('#hfJoy', el), knob = J.firstElementChild;
      const jm = (e) => {
        const r = J.getBoundingClientRect(), R = r.width / 2, lim = R * 0.62;
        let x = (e.clientX - r.left - R) / lim, y = (e.clientY - r.top - R) / lim;
        const l = Math.hypot(x, y);
        if (l > 1) (x /= l), (y /= l);
        joy.x = x;
        joy.y = y;
        knob.style.transform = `translate(${(x * lim).toFixed(1)}px, ${(y * lim).toFixed(1)}px)`;
      };
      J.addEventListener('pointerdown', (e) => {
        joy.on = true;
        joy.id = e.pointerId;
        try {
          J.setPointerCapture(e.pointerId);
        } catch (err) {}
        hint(false);
        jm(e);
        e.preventDefault();
      });
      J.addEventListener('pointermove', (e) => joy.on && e.pointerId === joy.id && jm(e));
      const jend = (e) => {
        if (e.pointerId !== joy.id) return;
        joy.on = false;
        joy.x = joy.y = 0;
        knob.style.transform = '';
      };
      J.addEventListener('pointerup', jend);
      J.addEventListener('pointercancel', jend);
      window.addEventListener('keydown', onKey);
      window.addEventListener('keyup', onKey);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) pause();
        else if (K.activeRoom === 'hafiza') resume();
      });
    },
    enter() {
      K.stickers.award('hafiza');
      if (!S) start();
      else resume();
    },
    leave() {
      runId++;
      teardown();
    },
  });

  // Test ve diğer odalar için küçük bir dışa açık API
  function screenPoint(t, i) {
    if (!S || !S.ready) return null;
    const T3 = S.THREE, v = new T3.Vector3(), r = S.canvas.getBoundingClientRect(), ray = new T3.Raycaster();
    S.camera.position.set(S.pos.x, EYE, S.pos.z);
    S.camera.rotation.set(S.pitch, S.yaw, 0);
    S.camera.updateMatrixWorld();
    const list = S.picks.concat(S.shells).filter(shown);
    const out = [];
    S.picks.forEach((m) => {
      const hf = m.userData.hf;
      if (!hf || hf.t !== t || !shown(m)) return;
      v.setFromMatrixPosition(m.matrixWorld).project(S.camera);
      if (v.z > 1 || Math.abs(v.x) > 0.9 || Math.abs(v.y) > 0.85) return;
      ray.setFromCamera(new T3.Vector2(v.x, v.y), S.camera);
      const h = ray.intersectObjects(list, false)[0];
      if (h && h.object === m) out.push({ x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height });
    });
    return out[i || 0] || null;
  }
  // Kamerayı en yakındaki bir nesneye çevir (tablo, mektup, kavanoz, tabela...)
  function aim(t, i) {
    if (!S || !S.ready) return false;
    const v = new S.THREE.Vector3();
    S.scene.updateMatrixWorld();
    const list = S.picks
      .filter((m) => m.userData.hf && m.userData.hf.t === t && shown(m))
      .map((m) => (v.setFromMatrixPosition(m.matrixWorld), { x: v.x, y: v.y, z: v.z, d: Math.hypot(v.x - S.pos.x, v.z - S.pos.z) }))
      .sort((a, b) => a.d - b.d);
    const o = list[i || 0];
    if (!o) return false;
    S.yaw = Math.atan2(-(o.x - S.pos.x), -(o.z - S.pos.z));
    S.pitch = K.clamp(Math.atan2(o.y - EYE, o.d), -0.8, 0.65);
    S.dirty = true;
    return true;
  }
  K.hafiza = {
    salonlar: () => salons.map((s) => ({ ym: s.ym, ad: s.ad, foto: s.photos.length, tablo: s.shown.length, mektup: s.letters.length, durum: s.state, levha: !!s.signTex, gorunur: s.group.visible })),
    git: (ym) => git(ym),
    yer: () => (S ? { alan: S.loc, x: +S.pos.x.toFixed(2), z: +S.pos.z.toFixed(2), yaw: +S.yaw.toFixed(2) } : null),
    yonel: aim,
    yuru: (x, z) => S && S.ready && (walkTo(x, z), true),
    bak: (yaw, pitch) => S && ((S.yaw = yaw), pitch != null && (S.pitch = pitch), (S.dirty = true)),
    nokta: screenPoint,
    durum: () => ({ kip: mode, calisiyor: !!(S && S.running), gece: !!(S && S.night), ...(S ? { cizim: S.renderer.info.render.calls, doku: S.renderer.info.memory.textures, geometri: S.renderer.info.memory.geometries, kare: S.frames } : {}) }),
    yedek: () => fallback(),
  };
})();
