/* Dünya yardımcıları (Faz 30): Bizim Haritamız'ın dünya verisini (js/harita-veri.js, Natural Earth, kamu malı) başka
   odalar da kullanabilsin diye yükleme, Mercator izdüşümü, ters izdüşüm, iki nokta arası uzaklık ve küçük bir şehir listesi.
   Neredeyiz? ve İki Hayat Çizgisi kullanır. */
(function () {
  'use strict';
  const K = window.K;
  const PI = Math.PI;
  const H = () => window.HARITA;

  function load() {
    if (window.HARITA) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'js/harita-veri.js';
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const proj = (lat, lng) => [H().W / 2 + (H().k * lng * PI) / 180, H().ty - H().k * Math.log(Math.tan(PI / 4 + (Math.max(-80, Math.min(82, lat)) * PI) / 360))];
  const unproj = (x, y) => [(2 * Math.atan(Math.exp((H().ty - y) / H().k)) - PI / 2) * (180 / PI), ((x - H().W / 2) / H().k) * (180 / PI)];
  function km(a, b) {
    const r = PI / 180, R = 6371;
    const dl = (b[0] - a[0]) * r, dg = (b[1] - a[1]) * r;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dg / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
  }
  // Bir kutuya (lat/lng sınırları) oturan viewBox: [x, y, w, h]
  function kutu(noktalar, pay = 0.25, oran = 1.25) {
    const xy = noktalar.map(([la, ln]) => proj(la, ln));
    let x0 = Math.min(...xy.map((p) => p[0])), x1 = Math.max(...xy.map((p) => p[0]));
    let y0 = Math.min(...xy.map((p) => p[1])), y1 = Math.max(...xy.map((p) => p[1]));
    let w = Math.max(14, x1 - x0), h = Math.max(10, y1 - y0);
    x0 -= w * pay; y0 -= h * pay; w *= 1 + 2 * pay; h *= 1 + 2 * pay;
    if (w / h > oran) (y0 -= (w / oran - h) / 2), (h = w / oran);
    else (x0 -= (h * oran - w) / 2), (w = h * oran);
    return [x0, y0, w, h];
  }
  const SEHIR = [
    ['İstanbul', 41.01, 28.98], ['Bakü', 40.41, 49.87], ['Ankara', 39.93, 32.86], ['İzmir', 38.42, 27.14], ['Bursa', 40.19, 29.06], ['Antalya', 36.9, 30.7],
    ['Trabzon', 41.0, 39.72], ['Erzurum', 39.9, 41.27], ['Kars', 40.6, 43.1], ['Iğdır', 39.92, 44.05], ['Konya', 37.87, 32.48], ['Adana', 37.0, 35.32],
    ['Gaziantep', 37.07, 37.38], ['Diyarbakır', 37.91, 40.23], ['Samsun', 41.29, 36.33], ['Eskişehir', 39.78, 30.52], ['Kocaeli', 40.77, 29.94], ['Edirne', 41.68, 26.56],
    ['Gəncə', 40.68, 46.36], ['Sumqayıt', 40.59, 49.67], ['Şəki', 41.19, 47.17], ['Quba', 41.36, 48.51], ['Lənkəran', 38.75, 48.85], ['Naxçıvan', 39.21, 45.41],
    ['Şamaxı', 40.63, 48.64], ['Mingəçevir', 40.76, 47.06], ['Qəbələ', 40.98, 47.85], ['Tiflis', 41.72, 44.79], ['Batum', 41.64, 41.64], ['Tahran', 35.69, 51.39],
    ['Moskova', 55.76, 37.62], ['Londra', 51.51, -0.13], ['Paris', 48.86, 2.35], ['Roma', 41.9, 12.5], ['Berlin', 52.52, 13.4], ['Viyana', 48.21, 16.37],
    ['Prag', 50.08, 14.44], ['Amsterdam', 52.37, 4.9], ['Barselona', 41.39, 2.17], ['Dubai', 25.2, 55.27], ['Tokyo', 35.68, 139.69], ['New York', 40.71, -74.01],
  ];
  const sehirBul = (ad) => {
    const n = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ə/g, 'e');
    return SEHIR.find((s) => n(s[0]) === n(ad || '')) || null;
  };
  K.dunya = { load, proj, unproj, km, kutu, SEHIR, sehirBul, veri: H };
})();
