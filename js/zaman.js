/*
  Zaman: Bakü ve İstanbul saati, günün seçimi, özel günler, ayın evresi.
  İki şehir de yaz saati uygulamıyor: Bakü UTC+4, İstanbul UTC+3.
*/
export const BAKU = 4;
export const IST = 3;
export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const pad = (n) => String(n).padStart(2, '0');

// ?gun=2027-04-23 ile başka bir günü önizlemek mümkün (yalnızca deneme için)
let kayma = 0;
try {
  const q = new URLSearchParams(location.search).get('gun');
  if (q && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(q)) {
    const [d, t = '12:00'] = q.split('T');
    const hedef = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), +t.slice(0, 2) - BAKU, +t.slice(3, 5));
    kayma = hedef - Date.now();
  }
} catch (e) {}
export const simdiMs = () => Date.now() + kayma;

export function an(off = BAKU, ms = simdiMs()) {
  const d = new Date(ms + off * 3600e3);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    s: d.getUTCSeconds(),
    hg: d.getUTCDay(),
    no: Math.floor((ms + off * 3600e3) / 864e5),
  };
}
export const gunAnahtari = (t) => `${t.y}-${pad(t.m)}-${pad(t.d)}`;
export const saatYaz = (t) => `${pad(t.h)}:${pad(t.mi)}`;
export const gunNo = (iso) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5);
export const uzunTarih = (t) => `${t.d} ${AYLAR[t.m - 1]} ${t.y}`;
export function isoUzun(iso) {
  return `${+iso.slice(8, 10)} ${AYLAR[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`;
}

export function vakit(h) {
  if (h >= 5 && h < 11) return 'sabah';
  if (h >= 11 && h < 17) return 'gun';
  if (h >= 17 && h < 22) return 'aksam';
  return 'gece';
}

// Tohumlu rastgelelik: her gün herkes için aynı, her gün farklı
export function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function karistir(n, seed) {
  const r = mulberry32(seed);
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}
// İlk turda yazıldığı sırayla, sonraki turlarda her tur başka bir sırayla
export function gununSecimi(liste, tuz, gunIdx) {
  const n = liste.length;
  if (!n) return { oge: null, index: 0, tur: 0 };
  const g = Math.max(0, gunIdx);
  const tur = Math.floor(g / n);
  const i = g % n;
  const index = tur === 0 ? i : karistir(n, hash(tuz + ':' + tur))[i];
  return { oge: liste[index], index, tur };
}

// Ayın evresi (ortalama sinodik ay, yeterince doğru)
export function ayEvresi(ms = simdiMs()) {
  const syn = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const yas = ((((ms - ref) / 864e5) % syn) + syn) % syn;
  const f = yas / syn;
  const isik = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const adlar = [
    [0.03, 'Yeni ay'],
    [0.22, 'Büyüyen hilal'],
    [0.28, 'İlk dördün'],
    [0.47, 'Büyüyen ay'],
    [0.53, 'Dolunay'],
    [0.72, 'Küçülen ay'],
    [0.78, 'Son dördün'],
    [0.97, 'Küçülen hilal'],
    [1.01, 'Yeni ay'],
  ];
  const ad = adlar.find(([s]) => f < s)[1];
  return { f, isik, ad, yas };
}

// Bugün özel bir gün mü?
export function ozelGun(t, tarih) {
  const md = `${pad(t.m)}-${pad(t.d)}`;
  const sev = tarih.sevgili;
  const sevY = +sev.slice(0, 4);
  const tanY = +tarih.tanisma.slice(0, 4);
  const sonuc = [];
  if (md === sev.slice(5) && t.y > sevY) sonuc.push({ tur: 'yildonumu', yil: t.y - sevY });
  if (md === tarih.onunDogum) sonuc.push({ tur: 'onunDogum' });
  if (md === tarih.benimDogum) sonuc.push({ tur: 'benimDogum' });
  if (md === tarih.tanisma.slice(5) && t.y > tanY) sonuc.push({ tur: 'tanisma', yil: t.y - tanY });
  if (t.d === 21 && md !== sev.slice(5)) {
    const ay = (t.y - sevY) * 12 + (t.m - +sev.slice(5, 7));
    if (ay > 0) sonuc.push({ tur: 'ayin21', ay });
  }
  if (md === '02-14') sonuc.push({ tur: 'sevgililer' });
  if (md === '01-01') sonuc.push({ tur: 'yilbasi' });
  if (md === '03-20' || md === '03-21') sonuc.push({ tur: 'novruz' });
  return sonuc;
}

// Yaklaşan güzel günler
export function yaklasanlar(t, tarih) {
  const bugun = t.no;
  const sonraki = (md, ad, ayrinti) => {
    let y = t.y;
    let n = gunNo(`${y}-${md}`);
    if (n < bugun) n = gunNo(`${++y}-${md}`);
    return { ad: typeof ad === 'function' ? ad(y) : ad, kalan: n - bugun, iso: `${y}-${md}`, ayrinti };
  };
  const sevY = +tarih.sevgili.slice(0, 4);
  const tanY = +tarih.tanisma.slice(0, 4);
  const liste = [
    sonraki(tarih.onunDogum, 'Senin doğum günün'),
    sonraki(tarih.benimDogum, 'Benim doğum günüm'),
    sonraki(tarih.tanisma.slice(5), (y) => `Tanışmamızın ${y - tanY}. yılı`),
    sonraki(tarih.sevgili.slice(5), (y) => `${y - sevY}. yıl dönümümüz`),
  ];
  // Bir sonraki ayın 21'i
  let y = t.y;
  let m = t.d <= 21 ? t.m : t.m + 1;
  if (m > 12) {
    m = 1;
    y++;
  }
  const ay = (y - sevY) * 12 + (m - +tarih.sevgili.slice(5, 7));
  if (!(m === +tarih.sevgili.slice(5, 7))) liste.push({ ad: `${ay}. ayımız`, kalan: gunNo(`${y}-${pad(m)}-21`) - bugun, iso: `${y}-${pad(m)}-21` });
  return liste.filter((x) => x.kalan >= 0).sort((a, b) => a.kalan - b.kalan);
}
