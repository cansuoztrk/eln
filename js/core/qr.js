/* Küçük QR kodlayıcı — bayt kipi, M hata düzeltme, sürüm 1–10 (en fazla 213 bayt). Kavuşma Kutusu'nun ses kartı ve
   Yıllık Kitabı'nın sayfaları için. Dışarıya hiçbir şey göndermez; kare matrisi ve SVG üretir.
   K.qr.matrix(metin) → boolean[][] · K.qr.svg(metin, {px, fg, bg, label}) → '<svg ...>' */
(function () {
  'use strict';
  const K = window.K;

  // [toplam veri baytı, blok başına EC baytı, kısa blok sayısı, uzun blok sayısı] — M düzeyi
  const M = [null, [16, 10, 1, 0], [28, 16, 1, 0], [44, 26, 1, 0], [64, 18, 2, 0], [86, 24, 2, 0], [108, 16, 4, 0], [124, 18, 4, 0], [154, 22, 2, 2], [182, 22, 3, 2], [216, 26, 4, 1]];
  const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  const gmul = (x, y) => {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  };
  function rsDivisor(deg) {
    const r = new Array(deg).fill(0);
    r[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) {
        r[j] = gmul(r[j], root);
        if (j + 1 < deg) r[j] ^= r[j + 1];
      }
      root = gmul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, div) {
    const r = new Array(div.length).fill(0);
    data.forEach((b) => {
      const f = b ^ r.shift();
      r.push(0);
      div.forEach((d, i) => (r[i] ^= gmul(d, f)));
    });
    return r;
  }
  const utf8 = (s) => Array.from(new TextEncoder().encode(s));

  function matrix(text) {
    const bytes = utf8(String(text));
    let ver = 1;
    for (; ver <= 10; ver++) {
      const cap = M[ver][0] * 8 - 4 - (ver < 10 ? 8 : 16);
      if (bytes.length * 8 <= cap) break;
    }
    if (ver > 10) throw new Error('QR için metin çok uzun');
    const [dataLen, ecLen, nShort, nLong] = M[ver];
    // Bit dizisi
    const bits = [];
    const put = (v, n) => {
      for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1);
    };
    put(4, 4);
    put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach((b) => put(b, 8));
    put(0, Math.min(4, dataLen * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
    for (let p = 0; data.length < dataLen; p ^= 1) data.push(p ? 0x11 : 0xec);
    // Bloklar ve hata düzeltme
    const blocks = [], div = rsDivisor(ecLen);
    const shortLen = Math.floor(dataLen / (nShort + nLong));
    let k = 0;
    for (let b = 0; b < nShort + nLong; b++) {
      const len = shortLen + (b >= nShort ? 1 : 0);
      const d = data.slice(k, k + len);
      k += len;
      blocks.push({ d, e: rsRemainder(d, div) });
    }
    const all = [];
    for (let i = 0; i <= shortLen; i++) blocks.forEach((b) => i < b.d.length && all.push(b.d[i]));
    for (let i = 0; i < ecLen; i++) blocks.forEach((b) => all.push(b.e[i]));
    // Matris
    const size = ver * 4 + 17;
    const mod = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, v) => {
      mod[y][x] = v;
      fn[y][x] = true;
    };
    for (let i = 0; i < size; i++) {
      set(6, i, i % 2 === 0);
      set(i, 6, i % 2 === 0);
    }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([x, y]) => {
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++) {
          const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy;
          if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4);
        }
    });
    const al = ALIGN[ver], na = al.length;
    for (let i = 0; i < na; i++)
      for (let j = 0; j < na; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    const format = (mask) => {
      const d = (0 << 3) | mask; // M düzeyi = 00
      let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      const g = (i) => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, g(i));
      set(8, 7, g(6));
      set(8, 8, g(7));
      set(7, 8, g(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, g(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, g(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, g(i));
      set(8, size - 8, true);
    };
    format(0);
    if (ver >= 7) {
      let r = ver;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const b = (ver << 12) | r;
      for (let i = 0; i < 18; i++) {
        const v = ((b >>> i) & 1) === 1, a = size - 11 + (i % 3), c = Math.floor(i / 3);
        set(a, c, v);
        set(c, a, v);
      }
    }
    // Veri yerleşimi (zikzak)
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let v = 0; v < size; v++)
        for (let j = 0; j < 2; j++) {
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
          if (!fn[y][x] && i < all.length * 8) {
            mod[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
            i++;
          }
        }
    }
    const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0, (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
    const apply = (m) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x];
    };
    function penalty() {
      let p = 0, dark = 0;
      const line = (get) => {
        for (let a = 0; a < size; a++) {
          let run = 1;
          for (let b = 1; b <= size; b++) {
            if (b < size && get(a, b) === get(a, b - 1)) run++;
            else {
              if (run >= 5) p += 3 + run - 5;
              run = 1;
            }
          }
          for (let b = 0; b + 10 < size; b++) {
            const s = Array.from({ length: 11 }, (_, q) => (get(a, b + q) ? 1 : 0)).join('');
            if (s === '10111010000' || s === '00001011101') p += 40;
          }
        }
      };
      line((a, b) => mod[a][b]);
      line((a, b) => mod[b][a]);
      for (let y = 0; y < size - 1; y++)
        for (let x = 0; x < size - 1; x++) {
          const c = mod[y][x];
          if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3;
        }
      mod.forEach((r) => r.forEach((c) => c && dark++));
      const total = size * size;
      p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return p;
    }
    let best = 0, bestP = Infinity;
    for (let m = 0; m < 8; m++) {
      apply(m);
      format(m);
      const p = penalty();
      if (p < bestP) (bestP = p), (best = m);
      apply(m);
    }
    apply(best);
    format(best);
    return mod;
  }
  function svg(text, opt = {}) {
    const m = matrix(text);
    const n = m.length, q = 4, all = n + q * 2;
    let d = '';
    m.forEach((row, y) => row.forEach((c, x) => c && (d += `M${x + q} ${y + q}h1v1h-1z`)));
    return `<svg class="${opt.cls || 'qr'}" viewBox="0 0 ${all} ${all}" width="${opt.px || all * 4}" height="${opt.px || all * 4}" shape-rendering="crispEdges" role="img" aria-label="${opt.label || 'QR kod'}"><rect width="${all}" height="${all}" fill="${opt.bg || '#fff'}"/><path d="${d}" fill="${opt.fg || '#000'}"/></svg>`;
  }
  K.qr = { matrix, svg };
})();
