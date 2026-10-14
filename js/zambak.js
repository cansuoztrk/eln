/*
  Zambak: koddan çizilen, gerçeğe yakın pembe (yıldız) zambaklar.
  Her yaprakta beyaz kenarlar, ortada koyu pembe bir damar, benekler ve ince damarlar var.
  Ercikler pas rengi polenli; hepsi tohumla çizilir, her zambak biraz farklıdır.
*/
import { mulberry32 } from './zaman.js';

let sayac = 0;
const f = (n) => (Math.round(n * 10) / 10).toString();

function yaprakYolu(R, W, r, dalga = 0.05) {
  const sol = [];
  const sag = [];
  const faz = r() * 10;
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    let w = W * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 1.15) * (1 - 0.12 * t);
    w *= 1 + dalga * Math.sin(t * 22 + faz) * t;
    const y = -t * R;
    const kivrim = Math.sin(t * Math.PI) * W * 0.06;
    sol.push([-w + kivrim, y]);
    sag.push([w + kivrim, y]);
  }
  const noktalar = sol.concat(sag.reverse());
  return 'M' + noktalar.map(([x, y]) => f(x) + ' ' + f(y)).join(' L') + ' Z';
}

function cekirdekYolu(R, W, r) {
  const sol = [];
  const sag = [];
  for (let i = 0; i <= 30; i++) {
    const t = (i / 30) * 0.86;
    const w = W * 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(t / 0.86, 0.8)), 1.3);
    sol.push([-w, -t * R]);
    sag.push([w, -t * R]);
  }
  return 'M' + sol.concat(sag.reverse()).map(([x, y]) => f(x) + ' ' + f(y)).join(' L') + ' Z';
}

// Tek bir zambak (yukarıdan bakış). Döndürür: { tanim, govde }
export function zambak({ R = 100, tohum = 1, renk = 'pembe', benek = true } = {}) {
  const id = 'zb' + ++sayac;
  const r = mulberry32(tohum * 7919 + 11);
  const P = renk === 'beyaz'
    ? { kok: '#f3c6d3', orta: '#fbe3ea', uc: '#fffafb', cekirdek: '#f4a7c0', benek: '#c25a7d' }
    : { kok: '#b0174f', orta: '#e45b8a', uc: '#fff4f7', cekirdek: '#c81d5c', benek: '#7d0a35' };
  const tanim = `
    <linearGradient id="${id}a" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${-R}">
      <stop offset="0" stop-color="${P.orta}"/><stop offset=".55" stop-color="#fbd5e1"/><stop offset="1" stop-color="${P.uc}"/>
    </linearGradient>
    <linearGradient id="${id}b" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${-R * 0.86}">
      <stop offset="0" stop-color="${P.kok}"/><stop offset=".45" stop-color="${P.cekirdek}"/><stop offset=".8" stop-color="${P.orta}" stop-opacity=".55"/><stop offset="1" stop-color="${P.orta}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}c"><stop offset="0" stop-color="#eef3c8"/><stop offset=".55" stop-color="#d9e6a6" stop-opacity=".8"/><stop offset="1" stop-color="#d9e6a6" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}p" cx=".35" cy=".35"><stop offset="0" stop-color="#e07a2e"/><stop offset=".6" stop-color="#9a3a10"/><stop offset="1" stop-color="#5e1f07"/></radialGradient>
    <filter id="${id}y" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(R * 0.035)}"/></filter>
    <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="${f(R * 0.04)}" stdDeviation="${f(R * 0.05)}" flood-color="#3a0a1c" flood-opacity=".35"/></filter>`;

  const yapraklar = [];
  for (let k = 0; k < 6; k++) {
    const ic = k % 2 === 1;
    const aci = k * 60 + (r() - 0.5) * 9 + (ic ? 0 : 0);
    const L = R * (ic ? 0.93 : 1) * (0.95 + r() * 0.08);
    const W = R * (ic ? 0.3 : 0.25);
    let benekler = '';
    if (benek) {
      const n = 26 + Math.floor(r() * 16);
      for (let j = 0; j < n; j++) {
        const t = 0.07 + Math.pow(r(), 1.4) * 0.5;
        const yan = (r() - 0.5) * W * 0.9 * Math.sin(Math.PI * Math.min(1, t * 1.6));
        const rr = 0.5 + r() * 1.5 * (1 - t);
        benekler += `<ellipse cx="${f(yan)}" cy="${f(-t * L)}" rx="${f(rr * R * 0.012)}" ry="${f(rr * R * 0.018)}" fill="${P.benek}" opacity="${f(0.45 + r() * 0.45)}"/>`;
      }
    }
    let damarlar = '';
    for (const s of [-0.55, -0.28, 0.28, 0.55]) {
      const x = s * W * 0.7;
      damarlar += `<path d="M0 ${f(-L * 0.05)} Q${f(x * 1.3)} ${f(-L * 0.45)} ${f(x * 0.4)} ${f(-L * 0.9)}" fill="none" stroke="#9c1446" stroke-opacity=".1" stroke-width="${f(R * 0.006)}"/>`;
    }
    yapraklar.push({
      ic,
      aci,
      govde: `
        <path d="${yaprakYolu(L, W, r)}" fill="url(#${id}a)"/>
        <path d="${cekirdekYolu(L, W, r)}" fill="url(#${id}b)" filter="url(#${id}y)"/>
        ${damarlar}
        ${benekler}
        <path d="M0 ${f(-L * 0.04)} L0 ${f(-L * 0.78)}" stroke="#fff" stroke-opacity=".45" stroke-width="${f(R * 0.012)}" stroke-linecap="round"/>
        <path d="${yaprakYolu(L, W, mulberry32(tohum + k))}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${f(R * 0.006)}"/>`,
    });
  }
  // Önce dış yapraklar, üstüne iç yapraklar
  const sirali = yapraklar.filter((y) => !y.ic).concat(yapraklar.filter((y) => y.ic));
  const yaprakHtml = sirali
    .map((y, i) => `<g class="zb-yaprak" style="--a:${f(y.aci)}deg;--i:${i}"><g transform="rotate(${f(y.aci)})">${y.govde}</g></g>`)
    .join('');

  // Ercikler ve dişicik
  let ercik = '';
  for (let k = 0; k < 6; k++) {
    const a = ((k * 60 + 30 + (r() - 0.5) * 16) * Math.PI) / 180;
    const uz = R * (0.48 + r() * 0.1);
    const ex = Math.sin(a) * uz;
    const ey = -Math.cos(a) * uz;
    const kx = Math.sin(a + 0.25) * uz * 0.5;
    const ky = -Math.cos(a + 0.25) * uz * 0.5;
    const pa = (Math.atan2(ey, ex) * 180) / Math.PI + 90;
    ercik += `<path d="M0 0 Q${f(kx)} ${f(ky)} ${f(ex)} ${f(ey)}" fill="none" stroke="#e8efc8" stroke-width="${f(R * 0.014)}" stroke-linecap="round"/>
      <ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(R * 0.06)}" ry="${f(R * 0.022)}" transform="rotate(${f(pa)} ${f(ex)} ${f(ey)})" fill="url(#${id}p)"/>`;
  }
  const da = r() * 360;
  const dx = Math.sin((da * Math.PI) / 180) * R * 0.6;
  const dy = -Math.cos((da * Math.PI) / 180) * R * 0.6;
  const disicik = `<path d="M0 0 Q${f(dx * 0.4 + R * 0.05)} ${f(dy * 0.5)} ${f(dx)} ${f(dy)}" fill="none" stroke="#dbe7b4" stroke-width="${f(R * 0.02)}" stroke-linecap="round"/>
    <circle cx="${f(dx)}" cy="${f(dy)}" r="${f(R * 0.04)}" fill="#a9bd74"/><circle cx="${f(dx - R * 0.01)}" cy="${f(dy - R * 0.012)}" r="${f(R * 0.015)}" fill="#d6e3a6"/>`;

  const govde = `<g class="zambak" filter="url(#${id}g)">
      <g class="zb-yapraklar">${yaprakHtml}</g>
      <circle r="${f(R * 0.14)}" fill="url(#${id}c)"/>
      <g class="zb-ercik">${ercik}${disicik}</g>
    </g>`;
  return { tanim, govde };
}

// Uzun, ince bir zambak yaprağı (yeşil)
export function yesilYaprak(L = 140, W = 16, tohum = 1) {
  const r = mulberry32(tohum * 31 + 5);
  const id = 'yy' + ++sayac;
  const tanim = `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(-W)}" y1="0" x2="${f(W)}" y2="0"><stop offset="0" stop-color="#2f5a35"/><stop offset=".5" stop-color="#5f8f55"/><stop offset="1" stop-color="#3d6a3f"/></linearGradient>`;
  const govde = `<path d="${yaprakYolu(L, W, r, 0.01)}" fill="url(#${id})"/><path d="M0 0 L0 ${f(-L * 0.92)}" stroke="#a9c99a" stroke-opacity=".5" stroke-width="1"/>`;
  return { tanim, govde };
}

// Kapalı bir tomurcuk (yandan)
export function tomurcuk(L = 70, tohum = 1) {
  const id = 'tm' + ++sayac;
  const tanim = `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${-L}"><stop offset="0" stop-color="#7fa36a"/><stop offset=".35" stop-color="#d7a3b4"/><stop offset=".8" stop-color="#ef8fb0"/><stop offset="1" stop-color="#f6c2d2"/></linearGradient>`;
  const W = L * 0.17;
  const yol = `M0 0 C${f(-W * 1.2)} ${f(-L * 0.3)} ${f(-W * 1.3)} ${f(-L * 0.75)} 0 ${f(-L)} C${f(W * 1.3)} ${f(-L * 0.75)} ${f(W * 1.2)} ${f(-L * 0.3)} 0 0 Z`;
  const govde = `<path d="${yol}" fill="url(#${id})"/><path d="M0 ${f(-L * 0.1)} Q${f(W * 0.3)} ${f(-L * 0.55)} 0 ${f(-L * 0.97)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>`;
  return { tanim, govde };
}

// Köşe buketi: iki zambak, bir tomurcuk, yapraklar
export function buket({ tohum = 1, olcek = 1 } = {}) {
  const r = mulberry32(tohum * 101 + 7);
  const parca = [];
  const tanimlar = [];
  const ekle = (o, tr) => {
    tanimlar.push(o.tanim);
    parca.push(`<g transform="${tr}">${o.govde}</g>`);
  };
  for (let i = 0; i < 6; i++) ekle(yesilYaprak(150 + r() * 70, 14 + r() * 6, tohum + i), `translate(${f(r() * 40)} ${f(r() * 30)}) rotate(${f(-75 + i * 22 + r() * 10)})`);
  ekle(tomurcuk(78, tohum), `translate(150 -20) rotate(${f(28 + r() * 10)})`);
  ekle(zambak({ R: 86, tohum: tohum + 3 }), `translate(118 72) rotate(${f(r() * 60)})`);
  ekle(zambak({ R: 68, tohum: tohum + 9 }), `translate(26 160) rotate(${f(r() * 60)})`);
  return `<svg viewBox="-80 -120 360 360" class="buket" aria-hidden="true"><defs>${tanimlar.join('')}</defs><g transform="scale(${olcek})">${parca.join('')}</g></svg>`;
}

// Tek zambak SVG'si
export function zambakSvg({ R = 100, tohum = 1, sinif = '', renk } = {}) {
  const z = zambak({ R, tohum, renk });
  const m = R * 1.25;
  return `<svg class="zambak-svg ${sinif}" viewBox="${-m} ${-m} ${m * 2} ${m * 2}" aria-hidden="true"><defs>${z.tanim}</defs>${z.govde}</svg>`;
}

// Kurutulmuş (preslenmiş) küçük bir zambak dalı: zarfın mührünün altına
export function kurutulmus(tohum = 4) {
  const z = zambak({ R: 34, tohum, renk: 'pembe' });
  const y1 = yesilYaprak(70, 7, tohum);
  const y2 = yesilYaprak(56, 6, tohum + 1);
  return `<svg class="kurutulmus" viewBox="-60 -150 140 200" aria-hidden="true"><defs>${z.tanim}${y1.tanim}${y2.tanim}</defs>
    <path d="M0 40 Q-6 -30 4 -96" stroke="#6f8a52" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <g transform="translate(2 -20) rotate(-38)">${y1.govde}</g>
    <g transform="translate(0 4) rotate(30)">${y2.govde}</g>
    <g transform="translate(4 -104) rotate(18) scale(1 .92)">${z.govde}</g></svg>`;
}

// Küçük çizgi süs (bölüm ayracı)
export function susCizgi() {
  return `<svg class="sus" viewBox="0 0 200 40" aria-hidden="true"><path d="M4 20 H74 M126 20 H196" stroke="currentColor" stroke-width=".8"/>
    <g fill="none" stroke="currentColor" stroke-width="1">
      <path d="M100 20 C94 8 92 4 100 -2 C108 4 106 8 100 20Z" transform="translate(0 8)"/>
      <path d="M100 28 C88 22 80 22 76 14 C86 12 94 16 100 28Z"/><path d="M100 28 C112 22 120 22 124 14 C114 12 106 16 100 28Z"/>
    </g><circle cx="100" cy="30" r="1.4" fill="currentColor"/></svg>`;
}

// Gerçekçi bir mum mühür: düzensiz kenarlı, damlalı, kabartmalı
export function muhurSvg(harf = 'A', tohum = 3) {
  const r = mulberry32(tohum * 13 + 1);
  const id = 'mh' + ++sayac;
  const damlalar = Array.from({ length: 3 + Math.floor(r() * 2) }, () => ({ a: r() * Math.PI * 2, w: 0.14 + r() * 0.12, l: 5 + r() * 8 }));
  const N = 72;
  const f1 = r() * 6;
  const f2 = r() * 6;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    let rad = 40 + Math.sin(a * 5 + f1) * 1.4 + Math.sin(a * 11 + f2) * 0.7;
    for (const d of damlalar) {
      let fark = Math.abs(a - d.a);
      fark = Math.min(fark, Math.PI * 2 - fark);
      rad += d.l * Math.exp(-Math.pow(fark / d.w, 2));
    }
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  let d = `M${f((pts[0][0] + pts[N - 1][0]) / 2)} ${f((pts[0][1] + pts[N - 1][1]) / 2)}`;
  for (let i = 0; i < N; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % N];
    d += ` Q${f(p[0])} ${f(p[1])} ${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2)}`;
  }
  return `<svg viewBox="-56 -56 112 112" aria-hidden="true"><defs>
      <radialGradient id="${id}g" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#e05c84"/><stop offset=".45" stop-color="#a8234d"/><stop offset="1" stop-color="#5a0a26"/></radialGradient>
      <radialGradient id="${id}i" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#b62d58"/><stop offset="1" stop-color="#7d1238"/></radialGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <path d="${d}" fill="url(#${id}g)"/>
    <path d="${d}" fill="none" stroke="#4a0820" stroke-opacity=".35" stroke-width="1"/>
    <circle r="29.5" fill="url(#${id}i)"/>
    <circle r="29.5" fill="none" stroke="#3e0518" stroke-opacity=".55" stroke-width="2.4"/>
    <circle r="29.5" cy="1" fill="none" stroke="#ffb3c6" stroke-opacity=".28" stroke-width="1"/>
    <circle r="25" fill="none" stroke="#3e0518" stroke-opacity=".3" stroke-width=".8" stroke-dasharray="1.4 2.2"/>
    <g fill="none" stroke-linecap="round">
      <path d="M-17 9 C-12 14 -5 16 0 16 C5 16 12 14 17 9" stroke="#3e0518" stroke-opacity=".45" stroke-width="1.2"/>
      <path d="M-17 10 C-12 15 -5 17 0 17 C5 17 12 15 17 10" stroke="#ffb3c6" stroke-opacity=".25" stroke-width=".8"/>
    </g>
    <text x="0.8" y="10.8" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="30" fill="#ffb3c6" fill-opacity=".3">${harf}</text>
    <text x="0" y="10" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="30" fill="#5c0722">${harf}</text>
    <ellipse cx="-15" cy="-19" rx="13" ry="6" transform="rotate(-32 -15 -19)" fill="url(#${id}h)" opacity=".7"/>
  </svg>`;
}
