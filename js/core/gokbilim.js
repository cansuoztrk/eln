/* Kale 2.0 — Gök hesapları (kalenin birkaç yerinde ortak): iki şehirde gün doğumu ve batımı, ayın gökyüzündeki
   yüksekliği, ayın evresi, dolunay ve yeni ay zamanları. Hassasiyet birkaç dakika; ev kullanımı için yeterli.
   Güneş: NOAA'nın sadeleştirilmiş denklemi. Ay: Schlyter'in düşük hassasiyetli yörüngesi + ana pertürbasyonlar.
   Evreler: Meeus, Astronomical Algorithms, bölüm 49 (ana düzeltme terimleri). */
(function () {
  'use strict';
  const K = window.K;
  const rad = Math.PI / 180;
  const CITY = { baku: [40.4093, 49.8671], ist: [41.0082, 28.9784] };
  const norm360 = (x) => ((x % 360) + 360) % 360;

  // key: 'YYYY-MM-DD' (o günün yerel takvim günü) → { rise, set } (ms, UTC)
  function sun(key, where) {
    const [lat, lng] = typeof where === 'string' ? CITY[where] : where;
    const [y, m, d] = key.split('-').map(Number);
    const jd = Date.UTC(y, m - 1, d, 12) / 864e5 + 2440587.5;
    const n = Math.round(jd - 2451545.0 + 0.0008);
    const js = n - lng / 360;
    const M = (357.5291 + 0.98560028 * js) % 360;
    const Cc = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    const L = (M + Cc + 180 + 102.9372) % 360;
    const jt = 2451545.0 + js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
    const cosw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
    const w = Math.acos(Math.max(-1, Math.min(1, cosw))) / rad;
    const ms = (j) => Math.round((j - 2440587.5) * 864e5);
    return { rise: ms(jt - w / 360), set: ms(jt + w / 360), noon: ms(jt) };
  }
  const gmst = (date) => {
    const D = date.getTime() / 864e5 + 2440587.5 - 2451545.0;
    return norm360((18.697374558 + 24.06570982441908 * D) * 15);
  };
  function altOf(ra, dec, date, where) {
    const [lat, lng] = typeof where === 'string' ? CITY[where] : where;
    const H = (gmst(date) + lng - ra) * rad;
    return Math.asin(Math.sin(lat * rad) * Math.sin(dec * rad) + Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(H)) / rad;
  }
  // Ayın gök koordinatları (derece)
  function moonPos(date) {
    const d = date.getTime() / 864e5 + 2440587.5 - 2451543.5;
    const N = norm360(125.1228 - 0.0529538083 * d) * rad;
    const i = 5.1454 * rad;
    const w = norm360(318.0634 + 0.1643573223 * d) * rad;
    const e = 0.0549;
    const M = norm360(115.3654 + 13.0649929509 * d) * rad;
    let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
    for (let k = 0; k < 4; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const xv = Math.cos(E) - e, yv = Math.sqrt(1 - e * e) * Math.sin(E);
    const v = Math.atan2(yv, xv);
    const xh = Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i);
    const yh = Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i);
    const zh = Math.sin(v + w) * Math.sin(i);
    let lon = Math.atan2(yh, xh) / rad, lat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) / rad;
    // Ana pertürbasyonlar
    const Ms = norm360(356.047 + 0.9856002585 * d), Mm = M / rad;
    const Ls = norm360(Ms + 282.9404 + 4.70935e-5 * d), Lm = norm360(N / rad + w / rad + Mm);
    const Dd = Lm - Ls, F = Lm - N / rad;
    const s = (x) => Math.sin(x * rad);
    lon += -1.274 * s(Mm - 2 * Dd) + 0.658 * s(2 * Dd) - 0.186 * s(Ms) - 0.059 * s(2 * Mm - 2 * Dd) - 0.057 * s(Mm - 2 * Dd + Ms) + 0.053 * s(Mm + 2 * Dd) + 0.046 * s(2 * Dd - Ms) + 0.041 * s(Mm - Ms) - 0.035 * s(Dd) - 0.031 * s(Mm + Ms);
    lat += -0.173 * s(F - 2 * Dd) - 0.055 * s(Mm - F - 2 * Dd) - 0.046 * s(Mm + F - 2 * Dd) + 0.033 * s(F + 2 * Dd) + 0.017 * s(2 * Mm + F);
    const ecl = (23.4393 - 3.563e-7 * d) * rad;
    const x = Math.cos(lon * rad) * Math.cos(lat * rad), y = Math.sin(lon * rad) * Math.cos(lat * rad), z = Math.sin(lat * rad);
    const ye = y * Math.cos(ecl) - z * Math.sin(ecl), ze = y * Math.sin(ecl) + z * Math.cos(ecl);
    return { ra: norm360(Math.atan2(ye, x) / rad), dec: Math.atan2(ze, Math.sqrt(x * x + ye * ye)) / rad };
  }
  const moonAlt = (date, where) => {
    const p = moonPos(date);
    return altOf(p.ra, p.dec, date, where);
  };
  // 0 yeni ay, 0.5 dolunay
  const phase = (date) => {
    const syn = 29.530588861;
    const ref = Date.UTC(2000, 0, 6, 18, 14) / 864e5;
    return (((date.getTime() / 864e5 - ref) % syn) + syn) % syn / syn;
  };
  // Meeus: k tam sayı → yeni ay, k + 0.5 → dolunay. Dönüş: ms (UTC)
  function lunation(k) {
    const T = k / 1236.85;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T * T * T;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * rad;
    const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T) * rad;
    const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T) * rad;
    const O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * rad;
    const full = Math.abs(k % 1) > 0.25;
    const c = full
      ? -0.40614 * Math.sin(Mp) + 0.17302 * E * Math.sin(M) + 0.01614 * Math.sin(2 * Mp) + 0.01043 * Math.sin(2 * F) + 0.00734 * E * Math.sin(Mp - M) - 0.00515 * E * Math.sin(Mp + M) + 0.00209 * E * E * Math.sin(2 * M) - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M) - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F) - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(O)
      : -0.4072 * Math.sin(Mp) + 0.17241 * E * Math.sin(M) + 0.01608 * Math.sin(2 * Mp) + 0.01039 * Math.sin(2 * F) + 0.00739 * E * Math.sin(Mp - M) - 0.00514 * E * Math.sin(Mp + M) + 0.00208 * E * E * Math.sin(2 * M) - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M) - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F) - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(O);
    jde += c;
    return Math.round((jde - 2440587.5) * 864e5 - 69e3);
  }
  // from (ms) sonrasındaki n dolunay ya da yeni ay
  function moons(from, n, full) {
    let k = Math.floor((from / 864e5 + 2440587.5 - 2451550.09766) / 29.530588861) - 1;
    const out = [];
    for (let guard = 0; out.length < n && guard < n + 40; guard++, k++) {
      const t = lunation(k + (full ? 0.5 : 0));
      if (t >= from) out.push(t);
    }
    return out;
  }
  K.gok = { CITY, sun, altOf, moonPos, moonAlt, phase, lunation, fullMoons: (from, n) => moons(from, n, true), newMoons: (from, n) => moons(from, n, false) };
})();
