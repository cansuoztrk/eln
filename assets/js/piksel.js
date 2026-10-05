/* Kızıl Kapsül — tohumdan piksel mürettebat portresi üretir (Habbo esintili, önden görünüm). */
(function (kok) {
  'use strict';
  const KK = (kok.KK = kok.KK || {});
  const W = 16, H = 22;
  const TEN = ['#f6d2b0', '#eab68c', '#c98d62', '#8d5a3b', '#f1c7a4', '#b5774c'];
  const SAC = ['#2b1d16', '#6b3e1f', '#d9a441', '#b8402f', '#22304d', '#e8e3d8', '#7a2e8f', '#141414'];
  const UST = ['#e04848', '#3b82c4', '#3fae6a', '#e0a030', '#8e5bd6', '#e06aa8', '#2fb3b3', '#f2f2f2', '#4b5563', '#f07f3c'];
  const ALT = ['#2d3a4a', '#5a4632', '#33363b', '#1f4b6e', '#4a2f4f'];
  const AYAK = ['#141414', '#f2f2f2', '#7a3b1f', '#3b82c4'];
  const onbellek = new Map();

  function rng(t) {
    let a = t >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  }

  function izgara(tohum) {
    const r = rng(tohum);
    const sec = (d) => d[Math.floor(r() * d.length)];
    const g = Array.from({ length: H }, () => new Array(W).fill(null));
    const boya = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const kutu = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) boya(x, y, c); };
    const ten = sec(TEN), sac = sec(SAC), ust = sec(UST), alt = sec(ALT), ayak = sec(AYAK);
    const stil = sec(['kisa', 'uzun', 'kirpi', 'sapka', 'topuz', 'kisa', 'yan']);
    const aksesuar = r() < 0.18 ? 'gozluk' : r() < 0.2 ? 'kulaklik' : null;
    const golge = (c) => {
      const n = parseInt(c.slice(1), 16);
      const k = (v) => Math.max(0, Math.floor(v * 0.72));
      return '#' + [k(n >> 16), k((n >> 8) & 255), k(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
    };

    // baş ve yüz
    kutu(4, 4, 11, 10, ten);
    boya(3, 6, ten); boya(12, 6, ten); boya(3, 7, ten); boya(12, 7, ten); // kulaklar
    boya(6, 7, '#1d1a22'); boya(9, 7, '#1d1a22');
    boya(6, 6, golge(ten)); boya(9, 6, golge(ten));
    boya(7, 9, golge(ten)); boya(8, 9, golge(ten));
    // saç
    if (stil === 'kisa' || stil === 'yan') { kutu(4, 2, 11, 4, sac); boya(4, 5, sac); boya(11, 5, sac); if (stil === 'yan') kutu(4, 5, 6, 5, sac); }
    if (stil === 'uzun') { kutu(4, 2, 11, 4, sac); kutu(3, 4, 4, 12, sac); kutu(11, 4, 12, 12, sac); }
    if (stil === 'kirpi') { kutu(4, 3, 11, 4, sac); [4, 6, 8, 10].forEach((x) => boya(x, 2, sac)); [5, 7, 9, 11].forEach((x) => boya(x, 1, sac)); }
    if (stil === 'sapka') { kutu(4, 1, 11, 4, ust); kutu(3, 4, 13, 4, golge(ust)); }
    if (stil === 'topuz') { kutu(4, 3, 11, 4, sac); kutu(6, 0, 9, 2, sac); boya(4, 5, sac); boya(11, 5, sac); }
    if (aksesuar === 'gozluk') { kutu(5, 7, 10, 7, '#1d1a22'); boya(5, 6, '#9fd8ff'); boya(10, 6, '#9fd8ff'); }
    if (aksesuar === 'kulaklik') { kutu(3, 3, 12, 3, '#3a3f47'); kutu(2, 5, 3, 8, '#3a3f47'); kutu(12, 5, 13, 8, '#3a3f47'); boya(13, 9, '#3a3f47'); boya(12, 10, '#3a3f47'); }
    // boyun ve gövde
    kutu(7, 11, 8, 11, golge(ten));
    kutu(4, 12, 11, 16, ust);
    kutu(2, 12, 3, 15, ust); kutu(12, 12, 13, 15, ust);
    boya(2, 16, ten); boya(3, 16, ten); boya(12, 16, ten); boya(13, 16, ten);
    kutu(6, 12, 9, 12, golge(ust));
    // pantolon ve ayakkabı
    kutu(5, 17, 10, 19, alt);
    boya(7, 19, null); boya(8, 19, null);
    kutu(4, 20, 6, 20, ayak); kutu(9, 20, 11, 20, ayak);
    return g;
  }

  KK.avatar = function (tohum, olcek) {
    olcek = olcek || 4;
    const anahtar = tohum + ':' + olcek;
    if (onbellek.has(anahtar)) return onbellek.get(anahtar);
    if (typeof document === 'undefined') return '';
    const g = izgara(tohum);
    const c = document.createElement('canvas');
    c.width = W * olcek; c.height = H * olcek;
    const x = c.getContext('2d');
    // dış hat: dolu piksele komşu boş piksel
    x.fillStyle = 'rgba(12,10,14,0.92)';
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      if (g[y][i]) continue;
      const komsu = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][i + dx]);
      if (komsu) x.fillRect(i * olcek, y * olcek, olcek, olcek);
    }
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      if (!g[y][i]) continue;
      x.fillStyle = g[y][i];
      x.fillRect(i * olcek, y * olcek, olcek, olcek);
    }
    const url = c.toDataURL('image/png');
    onbellek.set(anahtar, url);
    return url;
  };
})(typeof window !== 'undefined' ? window : globalThis);
