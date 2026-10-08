/* Oda: Bizim Ada — ikimizin aynı anda yürüyebildiği, yıllar içinde birlikte kurduğumuz küçük izometrik bir ada.
   Bir kareye dokununca kedin oraya yürür (A*); raftan seçilen eşya kareye konur, döndürülür, taşınır, kaldırılır.
   Ortadaki ev birlikte geçen günlere ve konan eşyalara göre aşama aşama yükselir. İkimiz aynı banka, iskeleye ya da
   piknik örtüsüne yan yana oturunca güneş batar, kalpler yükselir, dakikalar sayılır. Gökyüzü gerçek Bakü saatine göre.
   Kayıtlar: adaesya {uid, tip, x, y, rot, gone} (aynı uid'nin son kaydı geçerli) · adakonum {x, y, dir} ·
   adaoturma {sn, bas, koltuk} · canlı: ada {k: 'yer' {x, y, dir, sit, yol} | 'duygu' {d} | 'mv' {uid, x, y, rot} | 'git'} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  // Deneme adresinde (?hizli=0.35) birlikte oturmanın kayda geçme eşiği kısalır
  const HIZ = (() => {
    const m = location.search.match(/[?&]hizli=([\d.]+)/);
    const v = m ? +m[1] : 1;
    return v > 0 && v < 1 ? v : 1;
  })();
  const ESIK = Math.max(5, Math.round(60 * HIZ));

  /* ================= Ada: ızgara ve kara ================= */
  const G = 18, HW = 32, HH = 16, LH = 12, MID = 8.5, ISKELE_Y = 9;
  const INK = '#3A1F2D';
  const KAPI = [9, 10];
  const DORT = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const KARA = new Uint8Array(G * G); // 0 su, 1 kum, 2 çimen
  const id = (i, j) => j * G + i;
  const icinde = (i, j) => i >= 0 && j >= 0 && i < G && j < G;
  const kara = (i, j) => icinde(i, j) && KARA[id(i, j)] > 0;
  const kum = (i, j) => icinde(i, j) && KARA[id(i, j)] === 1;
  const evMi = (i, j) => i >= 8 && i <= 9 && j >= 8 && j <= 9;
  const kapiMi = (i, j) => i === KAPI[0] && j === KAPI[1];
  const wx = (i, j) => (i - j) * HW;
  const wy = (i, j) => (i + j) * HH;
  (function adaKur() {
    const kenar = (a) => 5.9 + 0.5 * Math.sin(3 * a + 0.7) + 0.32 * Math.sin(5 * a + 2.1) + 0.22 * Math.cos(2 * a + 0.4);
    for (let j = 0; j < G; j++)
      for (let i = 0; i < G; i++) {
        const dx = i - MID, dy = j - MID;
        if (Math.hypot(dx, dy) <= kenar(Math.atan2(dy, dx))) KARA[id(i, j)] = 2;
      }
    for (let j = 0; j < G; j++)
      for (let i = 0; i < G; i++) {
        if (!KARA[id(i, j)]) continue;
        let sahil = false;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (!kara(i + a, j + b)) sahil = true;
        const dx = i - MID, dy = j - MID;
        const plaj = Math.hypot(dx, dy) > kenar(Math.atan2(dy, dx)) - 2.3 && dx + dy > 1.2;
        if (sahil || plaj) KARA[id(i, j)] = 1;
      }
  })();

  /* ================= Eşyalar ================= */
  // yer: kara | kum | su · boy: kaç kare · oturak: yan yana oturulur · duz: yere serili · gecer: üstünden yürünür ·
  // donus: kaç yön · kutu: dokunma kutusu [yarı genişlik, yükseklik]
  const ESYA = [
    { id: 'agac', ad: 'Ağaç', yer: 'kara', kutu: [26, 64] },
    { id: 'zambak', ad: 'Zambak tarhı', yer: 'kara', kutu: [28, 30] },
    { id: 'cicek', ad: 'Çiçek', yer: 'kara', kutu: [20, 28] },
    { id: 'cali', ad: 'Çalı', yer: 'kara', kutu: [22, 28] },
    { id: 'bank', ad: 'Bank', yer: 'kara', boy: 2, oturak: true, gecer: true, donus: 4, kutu: [40, 30] },
    { id: 'fener', ad: 'Fener', yer: 'kara', kutu: [16, 54] },
    { id: 'cit', ad: 'Çit', yer: 'kara', kutu: [30, 28] },
    { id: 'tasyol', ad: 'Taş yol', yer: 'kara', duz: true, gecer: true },
    { id: 'iskele', ad: 'İskele', yer: 'su', boy: 2, oturak: true, duz: true, gecer: true, donus: 4 },
    { id: 'kayik', ad: 'Kayık', yer: 'su', duz: true },
    { id: 'salincak', ad: 'Salıncak', yer: 'kara', kutu: [30, 52] },
    { id: 'piknik', ad: 'Piknik örtüsü', yer: 'kara', boy: 2, oturak: true, duz: true, gecer: true, donus: 4 },
    { id: 'kuyu', ad: 'Kuyu', yer: 'kara', kutu: [24, 54] },
    { id: 'posta', ad: 'Posta kutusu', yer: 'kara', kutu: [14, 42] },
    { id: 'cesme', ad: 'Küçük çeşme', yer: 'kara', kutu: [24, 40] },
    { id: 'kumkale', ad: 'Kum kalesi', yer: 'kum', kutu: [24, 34] },
    { id: 'semsiye', ad: 'Plaj şemsiyesi', yer: 'kum', kutu: [30, 60] },
  ];
  const DEF = {};
  ESYA.forEach((d) => (DEF[d.id] = Object.assign({ boy: 1, donus: 2 }, d)));
  const FACE = [1, 0, 3, 2]; // oturağın yönüne göre oturan kedinin yönü (0:+i 1:+j 2:-i 3:-j)
  const KOLTUK_Y = { bank: 8, iskele: 0, piknik: 0 };

  /* ================= Ev ================= */
  const ASAMA = [
    { ad: 'Temel', esya: 1, gun: 0, kutla: 'Evimizin temeli atıldı' },
    { ad: 'Duvarlar', esya: 6, gun: 7, kutla: 'Evimizin duvarları yükseldi' },
    { ad: 'Çatı', esya: 14, gun: 30, kutla: 'Evimizin çatısı kapandı' },
    { ad: 'Pencereler', esya: 24, gun: 100, kutla: 'Pencereler takıldı; geceleri ışığımız yanacak' },
    { ad: 'Bahçe kapısı', esya: 36, gun: 365, kutla: 'Bahçe kapımız açıldı. Evimiz tamam' },
  ];

  /* ================= Duygular ================= */
  const DUYGU = {
    kalp: { ad: 'Kalp' },
    yildiz: { ad: 'Yıldız' },
    ozledim: { ad: 'Özledim', metin: 'özledim' },
    miyav: { ad: 'Miyav', metin: 'miyav!' },
    gel: { ad: 'Gel yanıma', metin: 'gel yanıma' },
    seviyorum: { ad: 'Seni seviyorum', metin: 'seni seviyorum' },
  };

  /* ================= Renk ================= */
  const hex2 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgb2 = (c) => '#' + c.map((v) => Math.round(K.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const karis = (a, b, t) => {
    if (t <= 0) return a;
    if (t >= 1) return b;
    const x = hex2(a), y = hex2(b);
    return rgb2(x.map((v, k) => v + (y[k] - v) * t));
  };
  const KOYU = new Map();
  const koyu = (h, k) => {
    const key = h + k;
    let v = KOYU.get(key);
    if (!v) KOYU.set(key, (v = karis(h, INK, k)));
    return v;
  };
  let tint = { c: '#FFFFFF', a: 0, key: '' };
  const TM = new Map();
  // Günün saatine göre her rengi gökyüzünün tonuna karıştırır (ışıklar bu karışımdan geçmez)
  const R = (h) => {
    if (!tint.a) return h;
    let v = TM.get(h);
    if (!v) TM.set(h, (v = karis(h, tint.c, tint.a)));
    return v;
  };

  const EVRE = {
    gece: { gok: ['#1F1A4D', '#2C2566', '#463C8C'], deniz: '#2E3B7A', sig: '#3E57A3', dalga: '#9AA8F0', kopuk: '#B9C3F5', tc: '#272063', ta: 0.38, gece: 1, isik: 1, batim: 0 },
    safak: { gok: ['#BBA9F2', '#FFC4DA', '#FFE3CC'], deniz: '#93BFEA', sig: '#B7DBF6', dalga: '#FFFFFF', kopuk: '#FFFFFF', tc: '#FFB4A2', ta: 0.07, gece: 0, isik: 0.3, batim: 0.65 },
    gunduz: { gok: ['#8FD1FF', '#B4E2FF', '#DDF3FF'], deniz: '#7DC7F0', sig: '#ACE2FA', dalga: '#FFFFFF', kopuk: '#FFFFFF', tc: '#FFFFFF', ta: 0, gece: 0, isik: 0, batim: 0 },
    batim: { gok: ['#7E6AD4', '#FF92B8', '#FFC79E'], deniz: '#8B9DE0', sig: '#B5BCF2', dalga: '#FFE1EC', kopuk: '#FFE9F1', tc: '#FF7E6B', ta: 0.12, gece: 0, isik: 0.6, batim: 1 },
  };
  function karisP(a, b, t) {
    if (t <= 0) return a;
    if (t >= 1) return b;
    const o = {};
    for (const k in a) {
      const x = a[k], y = b[k];
      o[k] = Array.isArray(x) ? x.map((c, n) => karis(c, y[n], t)) : typeof x === 'number' ? x + (y - x) * t : karis(x, y, t);
    }
    return o;
  }
  // Bakü'de bugün güneşin doğuşu ve batışı (yerel saat, NOAA yaklaşık formülü)
  let gunesGun = '', gunesV = { dogus: 6.8, batis: 18.4 };
  function gunes() {
    const p = T.baku();
    const key = T.key(p);
    if (key === gunesGun) return gunesV;
    const n = Math.round((Date.UTC(p.y, p.mo - 1, p.d) - Date.UTC(p.y, 0, 0)) / 864e5);
    const rad = Math.PI / 180, lat = 40.41 * rad, g = ((2 * Math.PI) / 365) * (n - 1);
    const dek = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const ha = Math.acos(K.clamp(Math.cos(90.833 * rad) / (Math.cos(lat) * Math.cos(dek)) - Math.tan(lat) * Math.tan(dek), -1, 1)) / rad;
    const oglen = 720 - 4 * 49.87 - eot + 60 * (C.tzBaku || 4);
    gunesGun = key;
    gunesV = { dogus: (oglen - 4 * ha) / 60, batis: (oglen + 4 * ha) / 60 };
    return gunesV;
  }
  let saatZorla = null;
  const saat = () => {
    if (saatZorla != null) return saatZorla;
    const p = T.baku();
    return p.h + p.mi / 60 + p.s / 3600;
  };
  function paletHesap(h, f) {
    const { dogus: sr, batis: ss } = gunes();
    const kf = [[0, 'gece'], [sr - 0.9, 'gece'], [sr - 0.15, 'safak'], [sr + 0.8, 'gunduz'], [ss - 1.0, 'gunduz'], [ss - 0.25, 'batim'], [ss + 0.3, 'batim'], [ss + 1.05, 'gece'], [24, 'gece']];
    let k = 0;
    while (k < kf.length - 2 && h >= kf[k + 1][0]) k++;
    const [h0, a] = kf[k], [h1, b] = kf[k + 1];
    const p = karisP(EVRE[a], EVRE[b], h1 > h0 ? K.clamp((h - h0) / (h1 - h0), 0, 1) : 0);
    return f > 0 ? karisP(p, EVRE.batim, f) : p;
  }
  const evreAd = (p, h) => (p.gece > 0.6 ? 'gece' : p.batim > 0.55 ? (h < 12 ? 'şafak' : 'gün batımı') : 'gündüz');

  /* ================= Durum ================= */
  let root = null, cv = null, ctx = null, X = null, LW = 2.4;
  let vw = 0, vh = 0, dpr = 1, raf = 0, sonCiz = 0, sonKare = 0, kirli = true, aktif = false;
  let pal = EVRE.gunduz, batimF = 0;
  const cam = { x: 0, y: 250, z: 0.7 };
  let esyaRows = [], konumRows = [], oturmaRows = [];
  const satirVar = new Set();
  let esyalar = new Map(), esyaDizi = [], toplamUid = 0;
  const occ = new Map();
  const bekleyen = new Map(); // uid → kaydı yolda olan son hâl (anında görünsün)
  const kendi = new Set(); // bu oturumda benim koyduklarım (ev aşamasını ben açtıysam bildirim benden gider)
  const uzakTasi = new Map(); // uid → {x, y, rot, until} öbürü sürüklerken
  let yuklendi = null, yuklu = false;
  let asama = 0, asamaOnizle = null, evPop = 0, bekleyenKutla = 0;
  const gorAsama = () => (asamaOnizle != null ? asamaOnizle : asama);
  let kurMod = false, secTip = null, secRot = 0, tasiUid = null, surukle = null, hover = null;
  let uygunYol = null, uygunKey = '';
  let kartcik = null; // {tur, uid}
  let sonToast = 0, sonKonum = { x: -1, y: -1, at: 0 };
  let oturum = null, hbT = 0, logT = 0;
  const parca = [];
  const yeniKedi = (x, y) => ({ i: x, j: y, tx: x, ty: y, path: [], dir: 1, adim: 0, sit: null, duygu: null });
  const ben = yeniKedi(9, 11);
  const o = Object.assign(yeniKedi(8, 11), { seenAt: 0, bilinen: false });
  let benYerlesti = false;
  const oBurada = () => Date.now() - o.seenAt < 4500;

  /* ================= Eşya durumu ================= */
  const ayakKare = (def, x, y, rot) => (def.boy === 2 ? [[x, y], rot & 1 ? [x, y + 1] : [x + 1, y]] : [[x, y]]);
  function kur() {
    const by = new Map();
    const ekle = (d, who, at) => {
      if (!d || !d.uid || !DEF[d.tip]) return;
      const x = Math.round(+d.x), y = Math.round(+d.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const rot = ((Math.round(+d.rot) || 0) % 4 + 4) % 4;
      const e = by.get(d.uid);
      if (!e) by.set(d.uid, { uid: d.uid, tip: d.tip, x, y, rot, gone: Boolean(d.gone), by: who, at, son: who, sonAt: at });
      else Object.assign(e, { tip: d.tip, x, y, rot, gone: Boolean(d.gone), son: who, sonAt: at });
    };
    esyaRows.slice().sort((a, b) => a.at - b.at).forEach((r) => ekle(r.data, r.who, r.at));
    bekleyen.forEach((d) => ekle(d, mine(), d._at));
    esyalar = by;
    toplamUid = by.size;
    esyaDizi = [...by.values()].filter((e) => !e.gone);
    occ.clear();
    esyaDizi.forEach((e) => ayakKare(DEF[e.tip], e.x, e.y, e.rot).forEach(([i, j]) => icinde(i, j) && occ.set(id(i, j), e.uid)));
    uygunKey = '';
    kirli = true;
  }
  const esyaAt = (i, j) => {
    const u = occ.get(id(i, j));
    return u ? esyalar.get(u) : null;
  };
  const oturakAt = (i, j) => {
    const e = icinde(i, j) && esyaAt(i, j);
    return e && DEF[e.tip].oturak ? e : null;
  };
  function gecer(i, j) {
    if (!icinde(i, j) || evMi(i, j)) return false;
    const e = esyaAt(i, j);
    if (e) return Boolean(DEF[e.tip].gecer);
    return kara(i, j);
  }
  const kisiVar = (i, j) => (Math.round(ben.i) === i && Math.round(ben.j) === j) || (ben.tx === i && ben.ty === j) || (oBurada() && Math.round(o.i) === i && Math.round(o.j) === j);
  function uygun(tip, x, y, rot, haric) {
    const def = DEF[tip];
    if (!def) return 'Bu eşya rafta yok.';
    const ay = ayakKare(def, x, y, rot);
    for (const [i, j] of ay) {
      if (!icinde(i, j)) return 'Adanın dışına konmaz.';
      if (evMi(i, j) || kapiMi(i, j)) return 'Burası evin yeri.';
      const u = occ.get(id(i, j));
      if (u && u !== haric) return 'Bu kare dolu.';
      if (def.yer === 'su') {
        if (kara(i, j)) return `${def.ad} suya konur.`;
      } else if (!kara(i, j)) return `${def.ad} karaya konur.`;
      else if (def.yer === 'kum' && !kum(i, j)) return `${def.ad} kumsala yapılır.`;
      if (!def.gecer && kisiVar(i, j)) return 'Orada biri duruyor.';
    }
    if (def.yer === 'su') {
      const kiyi = ay.some(([i, j]) =>
        DORT.some(([a, b]) => {
          const n = [i + a, j + b];
          if (ay.some((q) => q[0] === n[0] && q[1] === n[1])) return false;
          if (kara(n[0], n[1])) return true;
          const e = icinde(n[0], n[1]) && esyaAt(n[0], n[1]);
          return Boolean(e && e.tip === 'iskele' && e.uid !== haric);
        })
      );
      if (!kiyi) return 'Kıyıya ya da bir iskeleye bitişik olmalı.';
    }
    return '';
  }
  const gunSayisi = () => (C.togetherDate ? Math.max(0, T.daysSince(C.togetherDate)) : 0);
  function asamaHesap() {
    const n = toplamUid, g = gunSayisi();
    let s = 0;
    while (s < ASAMA.length && n >= ASAMA[s].esya && g >= ASAMA[s].gun) s++;
    return s;
  }

  /* ================= Yol bulma (A*) ================= */
  function yolBul(sx, sy, gx, gy, yanina) {
    const hedef = (i, j) => (yanina ? Math.abs(i - gx) + Math.abs(j - gy) === 1 : i === gx && j === gy);
    if (hedef(sx, sy)) return [];
    if (!yanina && !gecer(gx, gy)) return null;
    const N = G * G, g = new Float32Array(N).fill(Infinity), from = new Int16Array(N).fill(-1), kapali = new Uint8Array(N);
    const h = (i, j) => Math.abs(i - gx) + Math.abs(j - gy);
    const acik = [id(sx, sy)];
    g[id(sx, sy)] = 0;
    while (acik.length) {
      let bi = 0, bf = Infinity;
      for (let k = 0; k < acik.length; k++) {
        const n = acik[k], f = g[n] + h(n % G, (n / G) | 0) * 1.001;
        if (f < bf) (bf = f), (bi = k);
      }
      const n = acik.splice(bi, 1)[0], i = n % G, j = (n / G) | 0;
      if (hedef(i, j)) {
        const yol = [];
        for (let m = n; m !== id(sx, sy); m = from[m]) yol.unshift([m % G, (m / G) | 0]);
        return yol;
      }
      kapali[n] = 1;
      for (const [a, b] of DORT) {
        const p = i + a, q = j + b;
        if (!gecer(p, q)) continue;
        const m = id(p, q);
        if (kapali[m]) continue;
        const ng = g[n] + 1;
        if (ng < g[m]) {
          g[m] = ng;
          from[m] = n;
          if (!acik.includes(m)) acik.push(m);
        }
      }
    }
    return null;
  }
  // Kayıtlı yer bir eşyanın altında kaldıysa en yakın boş kare
  function yakinBos(x, y) {
    if (gecer(x, y)) return [x, y];
    for (let r = 1; r < G; r++)
      for (let a = -r; a <= r; a++)
        for (const b of [r - Math.abs(a), -(r - Math.abs(a))]) if (gecer(x + a, y + b)) return [x + a, y + b];
    return [KAPI[0], KAPI[1] + 1];
  }

  /* ================= Çizim yardımcıları ================= */
  function yol(p) {
    X.beginPath();
    X.moveTo(p[0], p[1]);
    for (let k = 2; k < p.length; k += 2) X.lineTo(p[k], p[k + 1]);
    X.closePath();
  }
  function boya(f, cizgi = true) {
    X.fillStyle = f;
    X.fill();
    if (cizgi) X.stroke();
  }
  function elips(x, y, rx, ry, f, cizgi = true) {
    X.beginPath();
    X.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    boya(f, cizgi);
  }
  const golge = (x, y, rx, ry) => elips(x, y, rx, ry, 'rgba(58,31,45,0.16)', false);
  function cubuk(x1, y1, x2, y2, w, renk) {
    X.save();
    X.beginPath();
    X.moveTo(x1, y1);
    X.lineTo(x2, y2);
    X.lineWidth = w + LW * 1.5;
    X.stroke();
    X.lineWidth = w;
    X.strokeStyle = renk;
    X.stroke();
    X.restore();
  }
  // Daireler birleşik tek bir şekil gibi: önce kalın çizgi, sonra dolgu → yalnız dış hat kalır
  function top(list, f) {
    X.save();
    X.beginPath();
    list.forEach(([x, y, r]) => {
      X.moveTo(x + r, y);
      X.arc(x, y, r, 0, Math.PI * 2);
    });
    X.lineWidth = LW * 2;
    X.stroke();
    X.fillStyle = f;
    X.fill();
    X.restore();
  }
  // İzometrik kutu: zeminde (x, y) merkezli; a: i yönünde yarı boy (kare), b: j yönünde, h: yükseklik
  function kutu(x, y, a, b, h, ust, sol, sag) {
    const ix = 32 * a, iy = 16 * a, jx = -32 * b, jy = 16 * b;
    const c0 = [x - ix - jx, y - iy - jy], c1 = [x + ix - jx, y + iy - jy], c2 = [x + ix + jx, y + iy + jy], c3 = [x - ix + jx, y - iy + jy];
    if (h > 0) {
      yol([c1[0], c1[1] - h, c2[0], c2[1] - h, c2[0], c2[1], c1[0], c1[1]]);
      boya(sag);
      yol([c3[0], c3[1] - h, c2[0], c2[1] - h, c2[0], c2[1], c3[0], c3[1]]);
      boya(sol);
    }
    yol([c0[0], c0[1] - h, c1[0], c1[1] - h, c2[0], c2[1] - h, c3[0], c3[1] - h]);
    boya(ust);
  }
  const kutuR = (x, y, a, b, h, renk) => kutu(x, y, a, b, h, R(renk), R(koyu(renk, 0.08)), R(koyu(renk, 0.17)));
  function silindir(x, y, r, h, ust, yan) {
    const ry = r / 2;
    X.beginPath();
    X.moveTo(x - r, y - h);
    X.lineTo(x - r, y);
    X.ellipse(x, y, r, ry, 0, Math.PI, 0, true);
    X.lineTo(x + r, y - h);
    X.closePath();
    boya(yan);
    elips(x, y - h, r, ry, ust);
  }
  function rr(x, y, w, h, r) {
    X.beginPath();
    X.moveTo(x + r, y);
    X.arcTo(x + w, y, x + w, y + h, r);
    X.arcTo(x + w, y + h, x, y + h, r);
    X.arcTo(x, y + h, x, y, r);
    X.arcTo(x, y, x + w, y, r);
    X.closePath();
  }
  function kalpYol(x, y, s) {
    X.beginPath();
    X.moveTo(x, y + s * 0.42);
    X.bezierCurveTo(x - s * 1.15, y - s * 0.3, x - s * 0.55, y - s * 1.05, x, y - s * 0.4);
    X.bezierCurveTo(x + s * 0.55, y - s * 1.05, x + s * 1.15, y - s * 0.3, x, y + s * 0.42);
    X.closePath();
  }
  function yildizYol(x, y, n, r1, r2, a0 = -Math.PI / 2) {
    X.beginPath();
    for (let k = 0; k < n * 2; k++) {
      const r = k % 2 ? r2 : r1, a = a0 + (k * Math.PI) / n;
      X[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    X.closePath();
  }
  function fiyonk(x, y, s, renk) {
    X.save();
    X.translate(x, y);
    X.scale(s, s);
    X.rotate(-0.28);
    X.lineWidth = LW * 0.8 / s;
    X.beginPath();
    X.moveTo(0, 0);
    X.bezierCurveTo(-3, -7, -11, -8, -11, -1);
    X.bezierCurveTo(-11, 6, -3, 4, 0, 0);
    X.moveTo(0, 0);
    X.bezierCurveTo(3, -7, 11, -8, 11, -1);
    X.bezierCurveTo(11, 6, 3, 4, 0, 0);
    boya(renk);
    X.fillStyle = 'rgba(255,255,255,0.92)';
    [[-7, -2.5], [-4.5, 1.6], [7, -2.5], [4.5, 1.6]].forEach(([a, b]) => {
      X.beginPath();
      X.arc(a, b, 1.25, 0, Math.PI * 2);
      X.fill();
    });
    elips(0, 0, 2.8, 2.6, renk);
    X.restore();
  }

  /* ================= Eşya çizimleri (yerel: i ekseni boyunca, +j yüzü öne) ================= */
  const U = (t) => [32 * t, 16 * t];
  const NV = (t) => [-32 * t, 16 * t];
  const ust = (t, n) => [32 * t - 32 * n, 16 * t + 16 * n];
  let isiklar = [];
  const yaniyor = () => pal.isik > 0.35;
  const CIZ = {
    agac(e) {
      golge(0, 2, 20, 8);
      kutuR(0, 0, 0.08, 0.08, 22, '#E9AE7E');
      const v = e.v % 4, renk = R(['#86DDA6', '#FFB8D2', '#9FE5C4', '#86DDA6'][v]);
      top([[-11, -30, 12], [11, -31, 12.5], [0, -44, 16], [-2, -32, 13]], renk);
      if (v === 1) {
        X.fillStyle = R('#FFFFFF');
        [[-8, -40], [6, -48], [9, -34], [-3, -28], [-12, -32]].forEach(([a, b]) => (X.beginPath(), X.arc(a, b, 1.8, 0, 7), X.fill()));
      } else if (v === 2 || v === 3) {
        [[-9, -36], [7, -44], [10, -30], [-1, -27]].forEach(([a, b]) => elips(a, b, 2.6, 2.6, R(v === 2 ? '#FF6B8B' : '#FFD34E')));
      }
      elips(-6, -51, 4.5, 2.4, 'rgba(255,255,255,0.5)', false);
    },
    zambak(e) {
      kutuR(0, 0, 0.36, 0.36, 7, '#E8A97F');
      elips(0, -7, 19, 8, R('#A97A5C'), false);
      [[-13, -8], [11, -10], [0, -2], [-1, -15], [13, -2], [-12, 1]].forEach(([fx, fy], k) => {
        const y0 = fy - 7;
        X.save();
        X.lineWidth = LW * 0.55;
        X.strokeStyle = R('#3FA37A');
        X.beginPath();
        X.moveTo(fx, y0);
        X.lineTo(fx, y0 - 9);
        X.stroke();
        X.restore();
        elips(fx + 3, y0 - 4, 3, 1.4, R('#7FD39F'), false);
        X.save();
        X.lineWidth = LW * 0.6;
        yildizYol(fx, y0 - 12, 6, 5.6, 2.2, (e.v + k) * 0.3);
        boya(R((e.v + k) % 3 ? '#FFFFFF' : '#FFC1DA'));
        X.restore();
        elips(fx, y0 - 12, 1.3, 1.3, R('#FFD34E'), false);
      });
    },
    cicek(e) {
      golge(0, 2, 14, 5);
      const renk = ['#FF8FB8', '#FFE27A', '#CDBBFF', '#FFFFFF', '#FFC6A6'];
      [[-8, -2, 14], [7, -5, 18], [0, 5, 10]].forEach(([fx, fy, h], k) => {
        X.save();
        X.lineWidth = LW * 0.6;
        X.strokeStyle = R('#3FA37A');
        X.beginPath();
        X.moveTo(fx, fy);
        X.lineTo(fx, fy - h);
        X.stroke();
        X.restore();
        elips(fx - 3, fy - h * 0.45, 3.2, 1.5, R('#7FD39F'), false);
        const cx = fx, cy = fy - h;
        top([0, 1, 2, 3, 4].map((p) => [cx + Math.cos(p * 1.2566) * 3.6, cy + Math.sin(p * 1.2566) * 3.6, 3]), R(renk[(e.v + k) % renk.length]));
        elips(cx, cy, 1.8, 1.8, R(k === 1 ? '#FF8FB8' : '#FFD34E'), false);
      });
    },
    cali(e) {
      golge(0, 2, 19, 7);
      top([[-9, -8, 9.5], [9, -9, 10], [0, -15, 11.5], [1, -5, 9]], R('#6FCF9A'));
      [[-6, -12], [7, -15], [2, -6], [-10, -5], [10, -6]].forEach(([a, b], k) => elips(a, b, 2, 2, R(e.v % 2 ? '#FF6B8B' : k % 2 ? '#FFFFFF' : '#CDBBFF'), false));
      elips(-3, -21, 4, 2, 'rgba(255,255,255,0.45)', false);
    },
    // Bank: her kare kendi yarısını çizer (sıralama doğru olsun); faz: 'arka' oturak + arkalık, 'on' öndeki arkalık
    bank(e, yarim, faz) {
      const t0 = yarim ? 0 : -0.9, t1 = yarim ? 0.9 : 0, tm = (t0 + t1) / 2, a = (t1 - t0) / 2;
      const arkaN = e.rot >= 2 ? 0.2 : -0.2;
      const on = e.rot >= 2;
      const ahsap = '#FFC9A3', pembe = '#FF9EC2';
      const arkalik = () => {
        [t0, t1].forEach((tt) => {
          if (Math.abs(tt) < 0.01) return;
          const [px, py] = ust(tt * 0.92, arkaN);
          kutuR(px, py - 7, 0.035, 0.035, 18, ahsap);
        });
        const [bx, by] = ust(tm, arkaN);
        kutuR(bx, by - 15, a, 0.03, 9, pembe);
        if (yarim) {
          const [hx, hy] = ust(0.06, arkaN);
          X.save();
          X.lineWidth = LW * 0.6;
          kalpYol(hx + (on ? 2 : -2), hy - 19.5, 3.6);
          boya(R('#FFFFFF'));
          X.restore();
        }
      };
      if (faz === 'on') return on && arkalik();
      golge(...ust(tm, 0), 26 * a + 4, 8);
      [t0, t1].forEach((tt) => {
        if (Math.abs(tt) < 0.01) return;
        [-0.14, 0.14].forEach((n) => {
          const [px, py] = ust(tt * 0.9, n);
          kutuR(px, py, 0.035, 0.035, 7, koyu(ahsap, 0.1));
        });
      });
      if (!on) arkalik();
      const [sx, sy] = ust(tm, 0);
      kutuR(sx, sy - 7, a, 0.22, 4, ahsap);
    },
    fener(e) {
      golge(0, 2, 10, 4);
      kutuR(0, 0, 0.09, 0.09, 5, '#E6DDF4');
      cubuk(0, -4, 0, -42, 3.2, R('#8C6AA0'));
      cubuk(0, -40, 10, -44, 2.2, R('#8C6AA0'));
      const lit = yaniyor();
      X.save();
      X.lineWidth = LW * 0.6;
      X.beginPath();
      X.moveTo(10, -44);
      X.lineTo(10, -40);
      X.stroke();
      X.restore();
      kutu(10, -29, 0.1, 0.1, 10, lit ? '#FFF3B0' : R('#E9F6FF'), lit ? '#FFE27A' : R('#D2ECFF'), lit ? '#FFD34E' : R('#BBDDF7'));
      yol([4, -39, 10, -46, 16, -39, 10, -36]);
      boya(R('#E3174D'));
      if (lit) isiklar.push([10, -34, 1]);
    },
    cit(e) {
      const bant = (h1, h2) => {
        const [ax, ay] = U(-0.5), [bx, by] = U(0.5);
        yol([ax, ay - h1, bx, by - h1, bx, by - h2, ax, ay - h2]);
        boya(R('#FFF8FB'));
      };
      bant(6, 9.5);
      bant(14, 17.5);
      [-0.38, -0.13, 0.13, 0.38].forEach((t) => {
        const [px, py] = U(t);
        yol([px - 3.6, py + 1, px - 3.6, py - 18, px, py - 23, px + 3.6, py - 18, px + 3.6, py + 1]);
        boya(R('#FFFFFF'));
      });
    },
    tasyol(e) {
      X.save();
      X.lineWidth = LW * 0.7;
      [[-13, -1, 8, 4], [4, -7, 7, 3.6], [11, 4, 7.5, 3.8], [-3, 6, 6, 3.2]].forEach(([a, b, rx, ry], k) => {
        elips(a, b + 1.2, rx, ry, R('#C9BEDF'));
        elips(a, b, rx, ry, R(k % 2 ? '#EDE6F7' : '#E4DBF2'));
      });
      X.restore();
    },
    iskele(e, now) {
      [[-0.85, -0.34], [0.85, -0.34], [-0.85, 0.34], [0.85, 0.34], [0, 0.34]].forEach(([t, n]) => {
        const [px, py] = ust(t, n);
        silindir(px, py + 5, 3, 9, R('#C98A65'), R('#B57A52'));
      });
      kutuR(0, -4, 0.98, 0.42, 5, '#F4C08F');
      X.save();
      X.globalAlpha = 0.3;
      X.lineWidth = LW * 0.5;
      for (let t = -0.75; t <= 0.76; t += 0.25) {
        const [ax, ay] = ust(t, -0.42), [bx, by] = ust(t, 0.42);
        X.beginPath();
        X.moveTo(ax, ay - 9);
        X.lineTo(bx, by - 9);
        X.stroke();
      }
      X.restore();
    },
    kayik(e, now) {
      const b = K.reduced ? 0 : Math.sin(now / 600 + e.v) * 1.4;
      const ang = Math.atan2(16, 32);
      X.save();
      X.translate(0, b);
      X.beginPath();
      X.ellipse(0, 3, 21, 9, ang, 0, Math.PI * 2);
      boya(R('#FF8FB8'));
      X.save();
      X.strokeStyle = R('#FFFFFF');
      X.lineWidth = LW * 0.8;
      X.beginPath();
      X.ellipse(0, 1.5, 18.5, 7.2, ang, 0, Math.PI * 2);
      X.stroke();
      X.restore();
      X.beginPath();
      X.ellipse(0, -0.5, 15.5, 5.6, ang, 0, Math.PI * 2);
      boya(R('#C98A65'));
      const [p1x, p1y] = NV(-0.16), [p2x, p2y] = NV(0.16);
      cubuk(p1x, p1y - 1, p2x, p2y - 1, 3, R('#F4C08F'));
      [[-0.18, -0.55], [0.18, 0.55]].forEach(([n1, n2]) => {
        const [ax, ay] = ust(0.05, n1), [bx, by] = ust(0.1, n2);
        cubuk(ax, ay - 2, bx, by + 2, 1.6, R('#F4C08F'));
        elips(bx, by + 3, 3.6, 1.6, R('#F4C08F'));
      });
      X.restore();
    },
    salincak(e, now) {
      golge(0, 2, 26, 8);
      const ah = R('#F2B48C'), H = 46;
      const ayak = (t) => {
        const [tx, ty] = U(t);
        [-0.2, 0.2].forEach((n) => {
          const [bx, by] = ust(t, n);
          cubuk(bx, by, tx, ty - H, 3, ah);
        });
      };
      ayak(-0.42);
      const sal = K.reduced ? 0 : Math.sin(now / 520 + e.v) * 0.16;
      const [ax, ay] = U(-0.13), [bx, by] = U(0.13), [ox, oy] = NV(sal);
      X.save();
      X.lineWidth = LW * 0.55;
      X.beginPath();
      X.moveTo(ax, ay - H);
      X.lineTo(ax + ox, ay + oy - 12 - Math.abs(sal) * 10);
      X.moveTo(bx, by - H);
      X.lineTo(bx + ox, by + oy - 12 - Math.abs(sal) * 10);
      X.stroke();
      X.restore();
      kutuR(ox, oy - 12 - Math.abs(sal) * 10, 0.17, 0.09, 3, '#FF8FB8');
      const [l0x, l0y] = U(-0.44), [l1x, l1y] = U(0.44);
      cubuk(l0x, l0y - H, l1x, l1y - H, 3.6, ah);
      ayak(0.42);
    },
    piknik(e) {
      const k1 = ust(-0.92, -0.42), k2 = ust(0.92, -0.42), k3 = ust(0.92, 0.42), k4 = ust(-0.92, 0.42);
      yol([...k1, ...k2, ...k3, ...k4]);
      boya(R('#FFFFFF'));
      X.fillStyle = R('#FF7FA3');
      for (let a = 0; a < 8; a++)
        for (let b = 0; b < 4; b++) {
          if ((a + b) % 2) continue;
          const t0 = -0.92 + a * 0.23, n0 = -0.42 + b * 0.21;
          const p = [ust(t0, n0), ust(t0 + 0.23, n0), ust(t0 + 0.23, n0 + 0.21), ust(t0, n0 + 0.21)];
          X.beginPath();
          X.moveTo(...p[0]);
          p.slice(1).forEach((q) => X.lineTo(...q));
          X.closePath();
          X.fill();
        }
      yol([...k1, ...k2, ...k3, ...k4]);
      X.fillStyle = 'rgba(0,0,0,0)';
      X.stroke();
      const [sx, sy] = ust(e.rot >= 2 ? -0.58 : 0.58, e.rot >= 2 ? 0.12 : -0.12);
      kutuR(sx, sy, 0.13, 0.09, 8, '#E8B07A');
      X.save();
      X.beginPath();
      X.ellipse(sx, sy - 9, 6.5, 6, 0, Math.PI, 0);
      X.lineWidth = LW * 0.8;
      X.stroke();
      X.restore();
      elips(sx + 3, sy - 10, 2.6, 2.4, R('#FF6B8B'));
      const [hx, hy] = ust(e.rot >= 2 ? 0.45 : -0.45, 0.05);
      X.save();
      X.lineWidth = LW * 0.6;
      kalpYol(hx, hy, 4);
      boya(R('#E3174D'));
      X.restore();
    },
    kuyu(e) {
      golge(0, 3, 23, 9);
      silindir(0, 0, 17, 15, R('#EDE6F7'), R('#D2C6EA'));
      elips(0, -15, 12, 5.4, R('#4E8FD0'));
      X.save();
      X.globalAlpha = 0.35;
      X.lineWidth = LW * 0.5;
      [[-11, -9, -4, -9], [3, -5, 10, -6], [-6, -2, 1, -1]].forEach(([a, b, c, d]) => {
        X.beginPath();
        X.moveTo(a, b);
        X.lineTo(c, d);
        X.stroke();
      });
      X.restore();
      cubuk(-15, -12, -15, -40, 3, R('#F2B48C'));
      cubuk(15, -12, 15, -40, 3, R('#F2B48C'));
      cubuk(-15, -33, 15, -33, 2.2, R('#C98A65'));
      X.save();
      X.lineWidth = LW * 0.5;
      X.beginPath();
      X.moveTo(5, -33);
      X.lineTo(5, -24);
      X.stroke();
      X.restore();
      kutuR(5, -18, 0.08, 0.08, 6, '#FF8FB8');
      yol([-23, -36, 0, -54, 23, -36, 20, -32, 0, -48, -20, -32]);
      boya(R('#FF6F9A'));
    },
    posta(e) {
      golge(0, 2, 9, 4);
      cubuk(0, 0, 0, -22, 3.4, R('#F2B48C'));
      kutu(0, -21, 0.13, 0.22, 11, R('#FF8FB8'), R('#FF7FA9'), R('#F0578F'));
      const [hx, hy] = ust(0, 0.22);
      X.save();
      X.lineWidth = LW * 0.5;
      kalpYol(hx - 3, hy - 26, 3.2);
      boya(R('#FFFFFF'));
      X.restore();
      cubuk(8, -27, 8, -38, 1.4, R('#8C6AA0'));
      yol([8, -38, 15, -36, 8, -33]);
      boya(R('#E3174D'));
    },
    cesme(e, now) {
      golge(0, 3, 25, 10);
      silindir(0, 0, 21, 8, R('#E4DBF2'), R('#CBBFE6'));
      elips(0, -8, 16, 7, R('#9FD8FF'));
      silindir(0, -8, 4, 14, R('#E4DBF2'), R('#D2C6EA'));
      silindir(0, -22, 8, 3, R('#9FD8FF'), R('#D2C6EA'));
      const t = K.reduced ? 0.4 : (now / 900) % 1;
      X.save();
      X.strokeStyle = R('#E9F7FF');
      X.lineWidth = LW * 0.7;
      [[-1, 1], [1, 1], [-0.45, 0.6], [0.45, 0.6]].forEach(([s, m]) => {
        X.beginPath();
        X.moveTo(0, -27);
        X.quadraticCurveTo(s * 9 * m, -36, s * 13 * m, -9 + (1 - m) * 4);
        X.stroke();
      });
      X.fillStyle = '#FFFFFF';
      [-1, 1].forEach((s) => {
        const u = (t + (s > 0 ? 0.5 : 0)) % 1, x = s * 13 * u, y = -27 - 9 * 4 * u * (1 - u) * 0.9 + 18 * u * u;
        X.beginPath();
        X.arc(x, y, 1.6, 0, 7);
        X.fill();
      });
      X.restore();
    },
    kumkale(e) {
      golge(0, 3, 22, 9);
      elips(0, 1, 20, 8.5, R('#F2D49B'));
      const kule = (x, y, r, h) => {
        silindir(x, y, r, h, R('#FBE3B0'), R('#EBC98A'));
        X.save();
        X.lineWidth = LW * 0.6;
        [-0.55, 0, 0.55].forEach((p) => {
          X.beginPath();
          X.moveTo(x + p * r, y - h + r * 0.45 * (1 - Math.abs(p)));
          X.lineTo(x + p * r, y - h + r * 0.45 * (1 - Math.abs(p)) - 3);
          X.stroke();
        });
        X.restore();
      };
      kule(0, -5, 7, 19);
      cubuk(0, -24, 0, -34, 1.2, R('#8C6AA0'));
      yol([0, -34, 8, -31.5, 0, -29]);
      boya(R('#FF8FB8'));
      kule(-10, 1, 6, 12);
      kule(10, 2, 6, 11);
      elips(-3, 5, 2.2, 1.6, R('#FFC1DA'), false);
    },
    semsiye(e) {
      golge(-4, 4, 28, 10);
      const t1 = ust(-0.12, 0.28), t2 = ust(0.36, 0.28), t3 = ust(0.36, 0.5), t4 = ust(-0.12, 0.5);
      yol([...t1, ...t2, ...t3, ...t4]);
      boya(R('#9FD8FF'));
      X.save();
      X.strokeStyle = R('#FFFFFF');
      X.lineWidth = LW * 0.9;
      X.beginPath();
      X.moveTo(...ust(0.12, 0.28));
      X.lineTo(...ust(0.12, 0.5));
      X.stroke();
      X.restore();
      cubuk(0, 0, 3, -52, 2.2, R('#FFFFFF'));
      const tepe = [3, -61];
      const kenar = Array.from({ length: 7 }, (_, k) => [-26 + (58 * k) / 6, -42 - (4 * k) / 6]);
      const kubbe = () => {
        X.beginPath();
        X.moveTo(...kenar[0]);
        X.quadraticCurveTo(tepe[0], -78, ...kenar[6]);
        for (let k = 6; k > 0; k--) {
          const a = kenar[k], b = kenar[k - 1];
          X.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 5, b[0], b[1]);
        }
        X.closePath();
      };
      kubbe();
      X.fillStyle = R('#FF8FB8');
      X.fill();
      X.save();
      kubbe();
      X.clip();
      X.fillStyle = R('#FFFFFF');
      for (let k = 0; k < 6; k += 2) {
        X.beginPath();
        X.moveTo(tepe[0], tepe[1] - 4);
        X.lineTo(kenar[k][0], kenar[k][1] + 8);
        X.lineTo(kenar[k + 1][0], kenar[k + 1][1] + 8);
        X.closePath();
        X.fill();
      }
      X.restore();
      kubbe();
      X.stroke();
      X.save();
      X.lineWidth = LW * 0.5;
      kenar.slice(1, 6).forEach((p) => {
        X.beginPath();
        X.moveTo(tepe[0], tepe[1]);
        X.quadraticCurveTo((tepe[0] + p[0]) / 2 + (p[0] - tepe[0]) * 0.15, (tepe[1] + p[1]) / 2 - 3, p[0], p[1] + 4);
        X.globalAlpha = 0.35;
        X.stroke();
      });
      X.restore();
      elips(tepe[0], tepe[1] - 1.5, 2.4, 2.4, R('#E3174D'));
    },
  };

  /* ================= Ev çizimi ================= */
  const EV_X = wx(8.5, 8.5), EV_Y = wy(8.5, 8.5) - LH;
  function yuz(sol, a, b0) {
    // a: yarı boy; sol: +j yüzü (soldan öne), değilse +i yüzü (önden sağa); nokta(u, v)
    const L = 64 * a, D2 = 32 * a;
    return sol ? (u, v) => [-L + L * u, D2 * u - v + b0] : (u, v) => [L * u, D2 - D2 * u - v + b0];
  }
  function yuzDortgen(f, u0, u1, v0, v1) {
    return [...f(u0, v0), ...f(u1, v0), ...f(u1, v1), ...f(u0, v1)];
  }
  function pencere(f, u0, u1, v0, v1, lit) {
    yol(yuzDortgen(f, u0, u1, v0, v1));
    boya(lit ? '#FFE27A' : R('#BFE6FF'));
    X.save();
    X.lineWidth = LW * 0.55;
    X.strokeStyle = lit ? '#FFF6C9' : R('#FFFFFF');
    const um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
    X.beginPath();
    X.moveTo(...f(um, v0 + 1));
    X.lineTo(...f(um, v1 - 1));
    X.moveTo(...f(u0 + 0.01, vm));
    X.lineTo(...f(u1 - 0.01, vm));
    X.stroke();
    X.restore();
    yol(yuzDortgen(f, u0 - 0.03, u1 + 0.03, v0 - 4, v0));
    boya(R('#FF8FB8'));
    X.fillStyle = R('#FFFFFF');
    [0.25, 0.5, 0.75].forEach((p) => {
      const [x, y] = f(u0 + (u1 - u0) * p, v0 + 1.5);
      X.beginPath();
      X.arc(x, y - 1.5, 1.4, 0, 7);
      X.fill();
    });
    if (lit) {
      const [x, y] = f(um, vm);
      isiklar.push([EV_X + x, EV_Y + y, 0.8]);
    }
  }
  function evCiz(now) {
    const s = gorAsama();
    X.save();
    X.translate(EV_X, EV_Y);
    if (evPop) {
      const k = (now - evPop) / 900;
      if (k >= 1) evPop = 0;
      else {
        const sc = 1 + Math.sin(Math.PI * k) * 0.1 * (1 - k);
        X.scale(sc, 2 - sc);
      }
    }
    if (s === 0) {
      const c = [[0, -25.6], [51.2, 0], [0, 25.6], [-51.2, 0]];
      X.save();
      X.lineWidth = LW * 0.45;
      X.setLineDash([3, 3]);
      X.beginPath();
      c.forEach(([x, y], k) => X[k ? 'lineTo' : 'moveTo'](x, y - 9));
      X.closePath();
      X.stroke();
      X.restore();
      c.forEach(([x, y]) => cubuk(x, y, x, y - 11, 2.4, R('#F2B48C')));
      cubuk(-8, 14, -8, -6, 2.4, R('#F2B48C'));
      kutu(-8, -6, 0.22, 0.03, 13, R('#FFF8FB'), R('#FFE7EF'), R('#FFD2E0'));
      X.save();
      X.lineWidth = LW * 0.5;
      kalpYol(-10, -14, 3.4);
      boya(R('#FF8FB8'));
      X.restore();
    }
    if (s >= 1) kutuR(0, 0, 0.94, 0.94, 7, '#EDE6F7');
    const H = 46, b0 = -7, lit = yaniyor();
    if (s >= 2) {
      kutu(0, b0, 0.8, 0.8, H, s >= 3 ? R('#FFF6EE') : R('#F3DFCF'), R('#FFE7EF'), R('#FFD2E0'));
      const L = yuz(true, 0.8, b0), Rr = yuz(false, 0.8, b0);
      if (s >= 4) {
        pencere(L, 0.14, 0.38, 16, 31, lit);
        pencere(Rr, 0.16, 0.4, 16, 31, lit);
        pencere(Rr, 0.6, 0.84, 16, 31, lit);
        yol(yuzDortgen(L, 0.52, 0.78, 0, 27));
        boya(R('#E3174D'));
        const [hx, hy] = L(0.65, 20);
        X.save();
        X.lineWidth = LW * 0.5;
        kalpYol(hx, hy, 3.4);
        boya(lit ? '#FFE27A' : R('#FFC1DA'));
        X.restore();
        const [kx, ky] = L(0.74, 12);
        elips(kx, ky, 1.4, 1.4, R('#FFD34E'), false);
        const [lx, ly] = L(0.86, 30);
        cubuk(lx, ly + 2, lx, ly - 2, 1.4, R('#8C6AA0'));
        elips(lx, ly + 3, 2.6, 3.2, lit ? '#FFE27A' : R('#E9F6FF'));
        if (lit) isiklar.push([EV_X + lx, EV_Y + ly + 3, 0.7]);
      } else {
        yol(yuzDortgen(L, 0.52, 0.78, 0, 27));
        boya(R('#6E4B63'));
        [[L, 0.14, 0.38], [Rr, 0.16, 0.4], [Rr, 0.6, 0.84]].forEach(([f, u0, u1]) => {
          yol(yuzDortgen(f, u0, u1, 16, 31));
          boya(R('#8A6A7E'));
        });
      }
    }
    if (s >= 3) {
      const top0 = b0 - H, a = 0.95, Lx = 64 * a, Dy = 32 * a, tepe = top0 - 36;
      const c1 = [Lx, top0], c2 = [0, top0 + Dy], c3 = [-Lx, top0], ap = [0, tepe];
      yol([...c3, ...c2, ...ap]);
      boya(R('#FF8FB8'));
      yol([...c2, ...c1, ...ap]);
      boya(R('#F0578F'));
      X.save();
      X.globalAlpha = 0.3;
      X.lineWidth = LW * 0.5;
      [0.33, 0.66].forEach((k) => {
        const p = (q) => [q[0] + (ap[0] - q[0]) * k, q[1] + (ap[1] - q[1]) * k];
        X.beginPath();
        X.moveTo(...p(c3));
        X.lineTo(...p(c2));
        X.lineTo(...p(c1));
        X.stroke();
      });
      X.restore();
      kutuR(28, top0 - 12, 0.1, 0.1, 18, '#E4DBF2');
      if (!K.reduced)
        for (let k = 0; k < 3; k++) {
          const u = ((now / 2600 + k / 3) % 1);
          X.save();
          X.globalAlpha = (1 - u) * 0.55;
          elips(28 + Math.sin(u * 6 + k) * 3, top0 - 32 - u * 26, 3 + u * 5, 2.6 + u * 4, '#FFFFFF', false);
          X.restore();
        }
      fiyonk(0, tepe - 2, 0.9, R('#E3174D'));
    }
    X.restore();
  }
  // Bahçe kapısı: kapının önündeki karede çiçekli kemer, iki yanında alçak çit, içe açılmış kanatlar
  function kapiCiz() {
    const x = wx(...KAPI), y = wy(...KAPI) - LH;
    X.save();
    X.translate(x, y);
    X.lineWidth = LW * 0.7;
    [[-6, 9, 6, 3], [6, 12, 5.5, 2.8], [-1, 15, 4.6, 2.4]].forEach(([a, b, rx, ry]) => elips(a, b, rx, ry, R('#EDE6F7')));
    X.lineWidth = LW;
    const n = -0.16;
    const P = (t, h = 0, m = n) => {
      const [px, py] = ust(t, m);
      return [px, py - h];
    };
    const cit = (t0, t1) => {
      const bant = (h1, h2) => {
        const a = P(t0), b = P(t1);
        yol([a[0], a[1] - h1, b[0], b[1] - h1, b[0], b[1] - h2, a[0], a[1] - h2]);
        boya(R('#FFF8FB'));
      };
      bant(4, 6.5);
      bant(10, 12.5);
      for (let k = 0; k < 3; k++) {
        const [px, py] = P(t0 + ((t1 - t0) * (k + 0.5)) / 3);
        yol([px - 2.5, py + 1, px - 2.5, py - 13, px, py - 16, px + 2.5, py - 13, px + 2.5, py + 1]);
        boya(R('#FFFFFF'));
      }
    };
    const kanat = (s) => {
      const a = P(s * 0.2), b = P(s * 0.13, 0, n - 0.3);
      yol([a[0], a[1] - 2, b[0], b[1] - 2, b[0], b[1] - 14, a[0], a[1] - 15]);
      boya(R('#FFE7EF'));
    };
    kanat(-1);
    kanat(1);
    cit(-0.5, -0.22);
    const [ax, ay] = P(-0.2), [bx, by] = P(0.2);
    cubuk(ax, ay, ax, ay - 30, 3.2, R('#FFFFFF'));
    const kemer = () => {
      X.beginPath();
      X.moveTo(ax, ay - 30);
      X.bezierCurveTo(ax, ay - 46, bx, by - 46, bx, by - 30);
    };
    X.save();
    kemer();
    X.lineWidth = 3.4 + LW * 1.5;
    X.stroke();
    kemer();
    X.lineWidth = 3.4;
    X.strokeStyle = R('#FFFFFF');
    X.stroke();
    X.restore();
    [0.12, 0.3, 0.7, 0.88].forEach((u, k) => {
      const t = 1 - u, px = t * t * t * ax + 3 * t * t * u * ax + 3 * t * u * u * bx + u * u * u * bx;
      const py = t * t * t * (ay - 30) + 3 * t * t * u * (ay - 46) + 3 * t * u * u * (by - 46) + u * u * u * (by - 30);
      elips(px, py, 2.4, 2.4, R(k % 2 ? '#FFC1DA' : '#FF8FB8'), false);
    });
    X.save();
    X.lineWidth = LW * 0.7;
    kalpYol((ax + bx) / 2, (ay + by) / 2 - 41, 5);
    boya(R('#E3174D'));
    X.restore();
    cubuk(bx, by, bx, by - 30, 3.2, R('#FFFFFF'));
    cit(0.22, 0.5);
    X.restore();
  }

  /* ================= Kediler ================= */
  function kediCiz(a, kim, now, alfa, uyku) {
    const yuruyor = a.path.length > 0;
    const koltuk = !yuruyor && a.sit ? esyalar.get(a.sit) : null;
    const iskelede = esyaAt(Math.round(a.i), Math.round(a.j));
    const zeminY = iskelede && iskelede.tip === 'iskele' ? ISKELE_Y : LH;
    const otur = !yuruyor && (Boolean(koltuk) || uyku);
    const kalk = koltuk ? KOLTUK_Y[koltuk.tip] || 0 : 0;
    const arka = !uyku && a.dir >= 2;
    const ayna = !uyku && (a.dir === 1 || a.dir === 2);
    const her = kim === 'her';
    const sal = yuruyor ? Math.sin(a.adim) : 0;
    const bob = yuruyor ? -Math.abs(Math.cos(a.adim)) * 2.2 : uyku && !K.reduced ? Math.sin(now / 900) * 0.6 : 0;
    const beyaz = R('#FFFFFF');
    X.save();
    X.translate(wx(a.i, a.j), wy(a.i, a.j) - zeminY);
    X.globalAlpha = alfa;
    golge(0, 0, 12, 4.6);
    X.translate(0, -kalk + (otur ? 3 : 0));
    if (ayna) X.scale(-1, 1);
    X.lineWidth = LW * 0.85;
    // kuyruk (önden bakınca arkada)
    const kuyruk = () => {
      X.save();
      X.beginPath();
      if (arka) {
        X.moveTo(0, -7);
        X.quadraticCurveTo(9, -8, 7, -20);
      } else {
        X.moveTo(-6, -8);
        X.quadraticCurveTo(-17, -9, -15, -22);
      }
      X.lineWidth = 5.4;
      X.stroke();
      X.lineWidth = 2.8;
      X.strokeStyle = beyaz;
      X.stroke();
      X.restore();
    };
    if (!arka) kuyruk();
    if (otur) {
      elips(-1, -1.5, 4.2, 2.6, beyaz);
      elips(8, -1, 4.2, 2.6, beyaz);
    } else {
      elips(-4, -1.6 - Math.max(0, sal) * 2.2, 3.8, 2.5, beyaz);
      elips(4.5, -1.6 - Math.max(0, -sal) * 2.2, 3.8, 2.5, beyaz);
    }
    X.save();
    X.translate(0, bob);
    const giysi = her ? R('#FF8FB8') : R('#9FD8FF');
    if (her) {
      yol([-6, -17, 6, -17, 9.6, -3.5, -9.6, -3.5]);
      boya(giysi);
      X.fillStyle = 'rgba(255,255,255,0.85)';
      [[-4, -7], [3.5, -10], [5, -5.5], [-2, -12.5]].forEach(([x, y]) => (X.beginPath(), X.arc(x, y, 1.1, 0, 7), X.fill()));
    } else {
      yol([-6.5, -17, 6.5, -17, 7.5, -10, -7.5, -10]);
      boya(beyaz);
      yol([-7.5, -11, 7.5, -11, 8.2, -3.5, -8.2, -3.5]);
      boya(giysi);
      if (!arka) {
        elips(-3.6, -8.5, 1, 1, R('#FFFFFF'), false);
        elips(3.6, -8.5, 1, 1, R('#FFFFFF'), false);
      }
    }
    if (arka) kuyruk();
    elips(-8.6, -11 + sal * 1.4, 3, 3.6, beyaz);
    elips(8.6, -11 - sal * 1.4, 3, 3.6, beyaz);
    X.save();
    X.translate(arka ? 0 : 1.2, -27);
    yol([-12, -5.5, -12.8, -18.5, -3.2, -10.5]);
    boya(beyaz);
    yol([12, -5.5, 12.8, -18.5, 3.2, -10.5]);
    boya(beyaz);
    if (!arka) {
      X.fillStyle = R('#FFC1DA');
      yol([-10.6, -8.5, -11.2, -15, -6.4, -10.8]);
      X.fill();
      yol([10.6, -8.5, 11.2, -15, 6.4, -10.8]);
      X.fill();
    }
    elips(0, 0, 15, 11.6, beyaz);
    if (!arka) {
      if (uyku) {
        X.save();
        X.lineWidth = LW * 0.6;
        [-4.4, 5.6].forEach((x) => {
          X.beginPath();
          X.moveTo(x - 2.4, 0);
          X.quadraticCurveTo(x, 2.4, x + 2.4, 0);
          X.stroke();
        });
        X.restore();
      } else {
        elips(-4.2, 0.4, 1.7, 2.3, INK, false);
        elips(5.8, 0.4, 1.7, 2.3, INK, false);
        X.fillStyle = '#FFFFFF';
        [[-4.7, -0.5], [5.3, -0.5]].forEach(([x, y]) => (X.beginPath(), X.arc(x, y, 0.6, 0, 7), X.fill()));
      }
      elips(-7.6, 4.2, 2.8, 1.6, 'rgba(255,143,184,0.7)', false);
      elips(9.8, 4.2, 2.8, 1.6, 'rgba(255,143,184,0.7)', false);
      X.save();
      X.lineWidth = LW * 0.45;
      elips(1.2, 3.4, 2.3, 1.6, R('#FFD34E'));
      X.beginPath();
      X.moveTo(-0.2, 6);
      X.quadraticCurveTo(0.6, 7.2, 1.2, 6.1);
      X.quadraticCurveTo(1.8, 7.2, 2.6, 6);
      X.moveTo(-11, 1.5);
      X.lineTo(-18, 0.5);
      X.moveTo(-11, 4.5);
      X.lineTo(-18, 5.5);
      X.moveTo(13.4, 1.5);
      X.lineTo(19.5, 0.5);
      X.moveTo(13.4, 4.5);
      X.lineTo(19.5, 5.5);
      X.stroke();
      X.restore();
    }
    if (her) fiyonk(9.5, -11.5, 0.78, R('#E3174D'));
    else if (!arka) {
      X.save();
      X.lineWidth = LW * 0.6;
      X.beginPath();
      X.moveTo(-1.5, -11.2);
      X.quadraticCurveTo(-0.5, -15.5, 1.5, -12.2);
      X.quadraticCurveTo(2.5, -15.8, 4.2, -11.6);
      X.stroke();
      X.restore();
    }
    X.restore();
    if (!her && !arka) {
      X.save();
      X.translate(1, -15);
      X.lineWidth = LW * 0.7;
      yol([0, 0, -6.5, -3.4, -6.5, 3.4]);
      boya(R('#3E86E0'));
      yol([0, 0, 6.5, -3.4, 6.5, 3.4]);
      boya(R('#3E86E0'));
      elips(0, 0, 1.8, 1.8, R('#2F6CC0'));
      X.restore();
    }
    X.restore();
    X.restore();
  }

  /* ================= Sabit ada yolları ================= */
  let YOLLAR = null;
  function yollar() {
    if (YOLLAR) return YOLLAR;
    const y = { cim: new Path2D(), cim2: new Path2D(), kum: new Path2D(), sig: new Path2D(), sag: new Path2D(), sol: new Path2D(), islak: new Path2D(), hat: new Path2D(), alt: new Path2D(), kopuk: new Path2D(), tut: new Path2D(), nokta: new Path2D(), cicek: new Path2D(), izgara: new Path2D() };
    const dia = (p, cx, cy) => {
      p.moveTo(cx, cy - HH);
      p.lineTo(cx + HW, cy);
      p.lineTo(cx, cy + HH);
      p.lineTo(cx - HW, cy);
      p.closePath();
    };
    const r = K.rng(4242);
    for (let j = 0; j < G; j++)
      for (let i = 0; i < G; i++) {
        const cx = wx(i, j), cy = wy(i, j);
        if (!kara(i, j)) {
          let yakin = false;
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (kara(i + a, j + b)) yakin = true;
          if (yakin) dia(y.sig, cx, cy);
          let yakin2 = false;
          for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (kara(i + a, j + b)) yakin2 = true;
          if (yakin2) dia(y.izgara, cx, cy);
          continue;
        }
        const ty = cy - LH;
        dia(y.izgara, cx, ty);
        if (kum(i, j)) dia(y.kum, cx, ty);
        else dia((i + j) % 2 ? y.cim2 : y.cim, cx, ty);
        if (!kara(i - 1, j)) {
          y.hat.moveTo(cx - HW, ty);
          y.hat.lineTo(cx, ty - HH);
          y.kopuk.moveTo(cx - HW, cy);
          y.kopuk.lineTo(cx, cy - HH);
        }
        if (!kara(i, j - 1)) {
          y.hat.moveTo(cx, ty - HH);
          y.hat.lineTo(cx + HW, ty);
          y.kopuk.moveTo(cx, cy - HH);
          y.kopuk.lineTo(cx + HW, cy);
        }
        // Yalı yüzleri: yalnız dış hat çizilir (üst kenar, su çizgisi, dışa bakan köşelerin dikey kenarları).
        // Su çizgisi ve dikeyler kara üstlerinden önce çizilir; içbükey köşelerde öndeki kare onları örter.
        const dik = (x, y0) => {
          y.alt.moveTo(x, y0 - LH);
          y.alt.lineTo(x, y0);
        };
        const yuzEkle = (p, q) => {
          p.moveTo(q[0], q[1]);
          for (let k = 2; k < 8; k += 2) p.lineTo(q[k], q[k + 1]);
          p.closePath();
        };
        const sagVar = !kara(i + 1, j), solVar = !kara(i, j + 1);
        if (sagVar) {
          yuzEkle(y.sag, [cx + HW, ty, cx, ty + HH, cx, cy + HH, cx + HW, cy]);
          yuzEkle(y.islak, [cx + HW, cy - 4, cx, cy + HH - 4, cx, cy + HH, cx + HW, cy]);
          y.hat.moveTo(cx + HW, ty);
          y.hat.lineTo(cx, ty + HH);
          y.alt.moveTo(cx + HW, cy);
          y.alt.lineTo(cx, cy + HH);
          if (!(kara(i, j - 1) && !kara(i + 1, j - 1))) dik(cx + HW, cy);
          y.kopuk.moveTo(cx + HW, cy);
          y.kopuk.lineTo(cx, cy + HH);
        }
        if (solVar) {
          yuzEkle(y.sol, [cx - HW, ty, cx, ty + HH, cx, cy + HH, cx - HW, cy]);
          yuzEkle(y.islak, [cx - HW, cy - 4, cx, cy + HH - 4, cx, cy + HH, cx - HW, cy]);
          y.hat.moveTo(cx - HW, ty);
          y.hat.lineTo(cx, ty + HH);
          y.alt.moveTo(cx - HW, cy);
          y.alt.lineTo(cx, cy + HH);
          if (!(kara(i - 1, j) && !kara(i - 1, j + 1))) dik(cx - HW, cy);
          y.kopuk.moveTo(cx, cy + HH);
          y.kopuk.lineTo(cx - HW, cy);
        }
        if (sagVar && solVar) dik(cx, cy + HH);
        if (evMi(i, j)) continue;
        const ox = (r() - 0.5) * 30, oy = (r() - 0.5) * 12;
        if (!kum(i, j) && r() < 0.42) {
          const x = cx + ox, yy = ty + oy;
          y.tut.moveTo(x - 4, yy - 3);
          y.tut.lineTo(x - 2, yy);
          y.tut.lineTo(x, yy - 4);
          y.tut.lineTo(x + 2, yy);
          y.tut.lineTo(x + 4, yy - 3);
        } else if (!kum(i, j) && r() < 0.18) {
          const x = cx + ox, yy = ty + oy;
          [[-2, 0], [2, 0], [0, -1.6], [0, 1.6]].forEach(([a, b]) => {
            y.cicek.moveTo(x + a + 1.4, yy + b);
            y.cicek.arc(x + a, yy + b, 1.4, 0, Math.PI * 2);
          });
        } else if (kum(i, j) && r() < 0.5) {
          const x = cx + ox, yy = ty + oy;
          y.nokta.moveTo(x + 1.3, yy);
          y.nokta.arc(x, yy, 1.3, 0, Math.PI * 2);
          y.nokta.moveTo(x + 7.1, yy + 3);
          y.nokta.arc(x + 6, yy + 3, 1.1, 0, Math.PI * 2);
        }
      }
    return (YOLLAR = y);
  }
  // Denizde dalga işaretleri ve yıldızlar (sabit, rastgele ama her açılışta aynı)
  const DALGALAR = (() => {
    const r = K.rng(777), out = [];
    for (let k = 0; k < 120 && out.length < 70; k++) {
      const i = -4 + r() * (G + 8), j = -4 + r() * (G + 8);
      const a = Math.round(i), b = Math.round(j);
      let yakin = false;
      for (let p = -1; p <= 1; p++) for (let q = -1; q <= 1; q++) if (kara(a + p, b + q)) yakin = true;
      if (!yakin) out.push([wx(i, j), wy(i, j), r() * 6.28, 0.7 + r() * 0.6]);
    }
    return out;
  })();
  const YILDIZLAR = (() => {
    const r = K.rng(99);
    return Array.from({ length: 38 }, () => [r(), r() * 0.92, 0.5 + r() * 1.2, r() * 6.28, r() < 0.15]);
  })();
  const ATESBOCEK = (() => {
    const r = K.rng(31), out = [];
    for (let k = 0; k < 200 && out.length < 12; k++) {
      const i = Math.floor(r() * G), j = Math.floor(r() * G);
      if (kara(i, j) && !kum(i, j) && !evMi(i, j)) out.push([wx(i, j), wy(i, j) - LH, r() * 6.28]);
    }
    return out;
  })();

  /* ================= Kamera ================= */
  const dunya = (sx, sy) => [(sx - vw / 2) / cam.z + cam.x, (sy - vh / 2) / cam.z + cam.y];
  const ekran = (x, y) => [(x - cam.x) * cam.z + vw / 2, (y - cam.y) * cam.z + vh / 2];
  const zMin = () => Math.max(0.3, vw / 1400);
  const Z_MAX = 2;
  function kamSinir() {
    cam.z = K.clamp(cam.z, zMin(), Z_MAX);
    cam.x = K.clamp(cam.x, -560, 560);
    cam.y = K.clamp(cam.y, -20, 600);
  }
  function kareSec(sx, sy) {
    const [x, y] = dunya(sx, sy);
    const kare = (yy) => [Math.round((x / HW + yy / HH) / 2), Math.round((yy / HH - x / HW) / 2)];
    const k1 = kare(y + LH);
    if (kara(...k1)) return k1;
    const k2 = kare(y + ISKELE_Y);
    const e = icinde(...k2) && esyaAt(...k2);
    if (e && e.tip === 'iskele') return k2;
    return kare(y);
  }
  function anaKonum(e) {
    const def = DEF[e.tip];
    const ox = def.boy === 2 ? (e.rot & 1 ? 0 : 0.5) : 0, oy = def.boy === 2 ? (e.rot & 1 ? 0.5 : 0) : 0;
    return [wx(e.x + ox, e.y + oy), wy(e.x + ox, e.y + oy) - (def.yer === 'su' ? 0 : LH)];
  }
  function esyaVur(sx, sy) {
    const [x, y] = dunya(sx, sy);
    const adaylar = esyaDizi.filter((e) => !DEF[e.tip].duz && DEF[e.tip].kutu).sort((a, b) => b.x + b.y - (a.x + a.y));
    for (const e of adaylar) {
      const [ax, ay] = anaKonum(e), [hw, h] = DEF[e.tip].kutu;
      if (Math.abs(x - ax) <= hw && y <= ay + 10 && y >= ay - h) return e;
    }
    return null;
  }
  function kediVur(sx, sy, a) {
    const [x, y] = dunya(sx, sy);
    const ax = wx(a.i, a.j), ay = wy(a.i, a.j) - LH;
    return Math.abs(x - ax) <= 17 && y <= ay + 6 && y >= ay - 46;
  }
  function evVur(sx, sy) {
    const [x, y] = dunya(sx, sy);
    const dx = Math.abs(x - EV_X);
    const s = gorAsama();
    return dx < 62 && y < EV_Y + 28 - dx * 0.5 && y > EV_Y - (s >= 3 ? 100 : s >= 2 ? 60 : 20);
  }

  /* ================= Kare kare çizim ================= */
  function gokCiz(now, hz) {
    const g = pal.gok;
    X.fillStyle = g[0];
    X.fillRect(0, 0, vw, hz * 0.5 + 1);
    X.fillStyle = g[1];
    X.fillRect(0, hz * 0.5, vw, hz * 0.3 + 1);
    X.fillStyle = g[2];
    X.fillRect(0, hz * 0.8, vw, hz * 0.2 + 1);
    if (pal.gece > 0.04) {
      YILDIZLAR.forEach(([fx, fy, r, ph, buyuk]) => {
        X.globalAlpha = pal.gece * (K.reduced ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(now / 900 + ph)));
        X.fillStyle = '#FFF4C7';
        if (buyuk) {
          yildizYol(fx * vw, fy * hz, 4, r * 2.6, r * 0.8, 0);
          X.fill();
        } else {
          X.beginPath();
          X.arc(fx * vw, fy * hz, r, 0, 7);
          X.fill();
        }
      });
      X.globalAlpha = pal.gece;
      X.lineWidth = 2.2;
      X.strokeStyle = INK;
      elips(vw * 0.18, hz * 0.42, 11, 11, '#FFF4C7');
      X.fillStyle = 'rgba(214,200,150,0.6)';
      [[-3, -2, 2.4], [4, 3, 1.8], [2, -5, 1.4]].forEach(([a, b, r]) => (X.beginPath(), X.arc(vw * 0.18 + a, hz * 0.42 + b, r, 0, 7), X.fill()));
      X.globalAlpha = 1;
    }
    if (pal.gece < 0.96) {
      X.globalAlpha = 1 - pal.gece;
      const b = pal.batim, r = 13 + b * 9;
      X.lineWidth = 2.4;
      X.strokeStyle = INK;
      elips(vw * 0.78, hz * (0.36 + b * 0.66), r, r, karis('#FFE27A', '#FF9C7A', b));
      X.globalAlpha = (1 - pal.gece) * 0.95;
      const bulut = (x, y, s) => {
        X.save();
        X.translate(x, y);
        X.scale(s, s);
        X.beginPath();
        [[-10, 2, 7], [0, -2, 9], [10, 2, 7]].forEach(([a, c, rr2]) => {
          X.moveTo(a + rr2, c);
          X.arc(a, c, rr2, 0, 7);
        });
        X.lineWidth = 4.4 / s;
        X.stroke();
        X.fillStyle = karis('#FFFFFF', '#FFD6E4', b);
        X.fill();
        X.restore();
      };
      const kay = K.reduced ? 0 : now / 90;
      [[0.15, 0.5, 1], [0.55, 0.3, 0.8], [0.92, 0.62, 0.7]].forEach(([fx, fy, s], k) => bulut(((fx * (vw + 120) + kay * (0.6 + k * 0.25)) % (vw + 120)) - 60, hz * fy, s));
      X.globalAlpha = 1;
    }
  }
  function denizCiz(now, hz) {
    X.fillStyle = pal.deniz;
    X.fillRect(0, hz, vw, vh - hz);
    X.fillStyle = 'rgba(58,31,45,0.28)';
    X.fillRect(0, hz - 1, vw, 2);
    const b = pal.batim * (1 - pal.gece);
    if (b > 0.08) {
      X.fillStyle = karis(pal.deniz, '#FFC79E', 0.75);
      X.globalAlpha = b;
      for (let k = 0; k < 6; k++) {
        const w = 26 - k * 3.4 + (K.reduced ? 0 : Math.sin(now / 500 + k) * 2);
        X.fillRect(vw * 0.78 - w, hz + 5 + k * 7, w * 2, 2.5);
      }
      X.globalAlpha = 1;
    }
  }
  function dunyaCiz(now) {
    const y = yollar();
    // dalgalar
    const [x0, y0] = dunya(-40, -40), [x1, y1] = dunya(vw + 40, vh + 40);
    X.save();
    X.strokeStyle = pal.dalga;
    X.lineWidth = Math.max(1.6, 1.4 / cam.z);
    DALGALAR.forEach(([x, yy, ph, s]) => {
      if (x < x0 || x > x1 || yy < y0 || yy > y1) return;
      const k = K.reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now / 1100 + ph);
      X.globalAlpha = 0.15 + 0.5 * k;
      const dx = K.reduced ? 0 : Math.sin(now / 1700 + ph) * 4;
      X.beginPath();
      X.moveTo(x + dx - 8 * s, yy);
      X.quadraticCurveTo(x + dx - 4 * s, yy - 4 * s, x + dx, yy);
      X.quadraticCurveTo(x + dx + 4 * s, yy - 4 * s, x + dx + 8 * s, yy);
      X.stroke();
    });
    X.restore();
    // sığ su, köpük
    X.fillStyle = pal.sig;
    X.fill(y.sig);
    X.save();
    X.strokeStyle = pal.kopuk;
    X.globalAlpha = 0.9;
    X.lineWidth = 7;
    X.stroke(y.kopuk);
    if (!K.reduced) {
      X.globalAlpha = 0.3;
      X.lineWidth = 9 + 5 * (0.5 + 0.5 * Math.sin(now / 800));
      X.stroke(y.kopuk);
    }
    X.restore();
    // yalı, toprak
    X.fillStyle = R('#F3C99B');
    X.fill(y.sol);
    X.fillStyle = R('#E2AE80');
    X.fill(y.sag);
    X.fillStyle = R('#C9946D');
    X.globalAlpha = 0.55;
    X.fill(y.islak);
    X.globalAlpha = 1;
    X.stroke(y.alt);
    X.fillStyle = R('#FFE6B0');
    X.fill(y.kum);
    X.fillStyle = R('#A6E6BE');
    X.fill(y.cim);
    X.fillStyle = R('#9DE0B6');
    X.fill(y.cim2);
    X.fillStyle = R('#EBC88E');
    X.fill(y.nokta);
    X.fillStyle = R('#FFFFFF');
    X.fill(y.cicek);
    X.save();
    X.strokeStyle = R('#6CC79A');
    X.lineWidth = Math.max(1.3, 1.2 / cam.z);
    X.stroke(y.tut);
    X.restore();
    X.stroke(y.hat);
    if (kurMod) {
      X.save();
      X.strokeStyle = 'rgba(58,31,45,0.13)';
      X.lineWidth = Math.max(1, 1 / cam.z);
      X.stroke(y.izgara);
      X.restore();
      if (secTip || tasiUid) uygunCiz();
    }
  }
  function uygunCiz() {
    const tip = secTip || (esyalar.get(tasiUid) || {}).tip;
    const rot = secTip ? secRot : (esyalar.get(tasiUid) || {}).rot || 0;
    if (!tip) return;
    const key = `${tip}|${rot}|${tasiUid}|${esyaRows.length}|${bekleyen.size}|${ben.tx},${ben.ty}`;
    if (key !== uygunKey) {
      uygunKey = key;
      uygunYol = new Path2D();
      for (let j = 0; j < G; j++)
        for (let i = 0; i < G; i++) {
          if (uygun(tip, i, j, rot, tasiUid)) continue;
          const cx = wx(i, j), cy = wy(i, j) - (kara(i, j) ? LH : 0);
          uygunYol.moveTo(cx, cy - HH + 3);
          uygunYol.lineTo(cx + HW - 6, cy);
          uygunYol.lineTo(cx, cy + HH - 3);
          uygunYol.lineTo(cx - HW + 6, cy);
          uygunYol.closePath();
        }
    }
    X.save();
    X.fillStyle = 'rgba(255,255,255,0.4)';
    X.fill(uygunYol);
    X.strokeStyle = 'rgba(46,140,100,0.5)';
    X.lineWidth = Math.max(1.2, 1.2 / cam.z);
    X.setLineDash([4, 3]);
    X.stroke(uygunYol);
    X.restore();
  }
  // Hareketsiz eşyalar bir kez küçük bir tuvale çizilir, sonra kopyalanır (her karede yüzlerce yol yerine tek kopya).
  // Yakınlaştırma kademesi, gökyüzü tonu ya da ışık değişince önbellek yenilenir.
  const CANLI = { kayik: 1, salincak: 1, cesme: 1 };
  const KUTU = { agac: [-36, -68, 36, 14], zambak: [-34, -40, 34, 26], cicek: [-24, -36, 24, 14], cali: [-28, -36, 28, 14], bank: [-74, -46, 74, 36], fener: [-20, -58, 26, 12], cit: [-38, -34, 38, 18], tasyol: [-28, -18, 28, 18], iskele: [-52, -38, 52, 32], piknik: [-50, -32, 50, 30], kuyu: [-30, -62, 30, 18], posta: [-20, -46, 22, 12], kumkale: [-28, -42, 28, 16], semsiye: [-38, -86, 42, 20] };
  const SPRITE = new Map();
  let spriteKova = 0;
  function spriteCiz(key, ax, ay, ayna, kutu2, fn) {
    const olc = cam.z * dpr;
    if (olc > 3.2 || !window.document) return false;
    const kova = Math.pow(1.15, Math.round(Math.log(olc) / Math.log(1.15)));
    if (kova !== spriteKova || SPRITE.size > 240) {
      SPRITE.clear();
      spriteKova = kova;
    }
    let sp = SPRITE.get(key);
    if (!sp) {
      const [x0, y0, x1, y1] = kutu2;
      const c = document.createElement('canvas');
      c.width = Math.ceil((x1 - x0) * kova);
      c.height = Math.ceil((y1 - y0) * kova);
      const g = c.getContext('2d');
      const X0 = X, isik0 = isiklar;
      X = g;
      isiklar = [];
      g.setTransform(kova, 0, 0, kova, -x0 * kova, -y0 * kova);
      g.lineJoin = 'round';
      g.lineCap = 'round';
      g.strokeStyle = INK;
      g.lineWidth = LW;
      fn();
      sp = { c, kutu: kutu2, isik: isiklar };
      X = X0;
      isiklar = isik0;
      SPRITE.set(key, sp);
    }
    const [x0, y0, x1, y1] = sp.kutu;
    X.save();
    X.translate(ax, ay);
    if (ayna) X.scale(-1, 1);
    X.drawImage(sp.c, x0, y0, x1 - x0, y1 - y0);
    X.restore();
    sp.isik.forEach(([x, y, k]) => isiklar.push([ax + (ayna ? -x : x), ay + y, k]));
    return true;
  }
  function esyaCiz(e, now) {
    const [x, y] = anaKonum(e);
    if (!CANLI[e.tip] && !e.hayal && KUTU[e.tip]) {
      const key = `${e.tip}|${e.v}|${e.rot >= 2 ? 1 : 0}|${e.tip === 'fener' && yaniyor() ? 1 : 0}`;
      if (spriteCiz(key, x, y, e.rot & 1, KUTU[e.tip], () => CIZ[e.tip](e, now))) return;
    }
    X.save();
    X.translate(x, y);
    if (e.rot & 1) X.scale(-1, 1);
    const once = isiklar.length;
    CIZ[e.tip](e, now);
    // eşyanın yaktığı ışıklar yerel koordinatta; dünyaya taşı (aynalıysa x ters)
    for (let k = once; k < isiklar.length; k++) isiklar[k] = [x + (e.rot & 1 ? -1 : 1) * isiklar[k][0], y + isiklar[k][1], isiklar[k][2]];
    X.restore();
  }
  function bankCiz(e, yarim, faz, hayal) {
    const [x, y] = anaKonum(e);
    if (!hayal && spriteCiz(`bank|${yarim}|${faz}|${e.rot >= 2 ? 1 : 0}`, x, y, e.rot & 1, KUTU.bank, () => CIZ.bank(e, yarim, faz))) return;
    X.save();
    X.translate(x, y);
    if (e.rot & 1) X.scale(-1, 1);
    CIZ.bank(e, yarim, faz);
    X.restore();
  }
  function goster(e) {
    // sürüklenen ya da öbürünün taşıdığı eşya geçici yerinde
    if (surukle && surukle.uid === e.uid) return Object.assign({}, e, { x: surukle.x, y: surukle.y });
    const u = uzakTasi.get(e.uid);
    if (u && u.until > Date.now()) return Object.assign({}, e, { x: u.x, y: u.y, rot: u.rot });
    return e;
  }
  function ciz(now) {
    X = ctx;
    X.setTransform(dpr, 0, 0, dpr, 0, 0);
    X.lineJoin = 'round';
    X.lineCap = 'round';
    const h = saat();
    pal = paletHesap(h, batimF);
    const tcQ = rgb2(hex2(pal.tc).map((v) => Math.round(v / 6) * 6)), taQ = Math.round(pal.ta * 100) / 100;
    const tk = tcQ + taQ;
    if (tk !== tint.key) {
      tint = { c: tcQ, a: taQ, key: tk };
      TM.clear();
      SPRITE.clear();
    }
    const hz = Math.round(vh * 0.16);
    gokCiz(now, hz);
    denizCiz(now, hz);
    const z = cam.z;
    X.setTransform(dpr * z, 0, 0, dpr * z, dpr * (vw / 2 - cam.x * z), dpr * (vh / 2 - cam.y * z));
    LW = Math.max(2.2, 2 / z);
    X.lineWidth = LW;
    X.strokeStyle = INK;
    isiklar = [];
    dunyaCiz(now);
    // eşyalar: yere serili olanlar önce, sonra derinliğe göre
    const [x0, y0] = dunya(-90, -40), [x1, y1] = dunya(vw + 90, vh + 140);
    const gor = (e) => {
      const [x, y] = anaKonum(e);
      return x > x0 && x < x1 && y > y0 && y < y1;
    };
    const zemin = [], sahne = [];
    for (const e0 of esyaDizi) {
      const e = goster(e0);
      if (!gor(e)) continue;
      const def = DEF[e.tip];
      e.v = e.v != null ? e.v : K.hash(e.uid) % 7;
      if (def.duz) zemin.push(e);
      else if (e.tip === 'bank') {
        const [a, b] = ayakKare(def, e.x, e.y, e.rot);
        sahne.push({ k: a[0] + a[1] - 0.3, f: () => bankCiz(e, 0, 'arka') }, { k: b[0] + b[1] - 0.3, f: () => bankCiz(e, 1, 'arka') });
        if (e.rot >= 2) sahne.push({ k: a[0] + a[1] + 0.35, f: () => bankCiz(e, 0, 'on') }, { k: b[0] + b[1] + 0.35, f: () => bankCiz(e, 1, 'on') });
      } else sahne.push({ k: e.x + e.y, f: () => esyaCiz(e, now) });
    }
    if (secTip && hover && !surukle) {
      const e = { uid: '_hayal', tip: secTip, x: hover[0], y: hover[1], rot: secRot, v: 0, hayal: true };
      const ok = !uygun(secTip, hover[0], hover[1], secRot);
      const hayal = (f) => () => {
        X.globalAlpha = 0.6;
        f();
        X.globalAlpha = 1;
      };
      if (ok && DEF[secTip].duz) zemin.push(e);
      else if (ok && secTip === 'bank') sahne.push({ k: e.x + e.y + 0.1, f: hayal(() => (bankCiz(e, 0, 'arka', 1), bankCiz(e, 1, 'arka', 1), bankCiz(e, 0, 'on', 1), bankCiz(e, 1, 'on', 1))) });
      else if (ok) sahne.push({ k: e.x + e.y + 0.1, f: hayal(() => esyaCiz(e, now)) });
    }
    zemin.sort((a, b) => a.x + a.y - (b.x + b.y)).forEach((e) => {
      if (e.hayal) X.globalAlpha = 0.6;
      esyaCiz(e, now);
      X.globalAlpha = 1;
    });
    sahne.push({ k: 17.5, f: () => evCiz(now) });
    if (gorAsama() >= 5) sahne.push({ k: KAPI[0] + KAPI[1], f: kapiCiz });
    const oVar = oBurada();
    if (o.seenAt || o.bilinen) sahne.push({ k: o.i + o.j + 0.2, f: () => kediCiz(o, other(), now, oVar ? 1 : 0.55, !oVar) });
    sahne.push({ k: ben.i + ben.j + 0.21, f: () => kediCiz(ben, mine(), now, 1, false) });
    sahne.sort((a, b) => a.k - b.k).forEach((s) => s.f());
    // seçili eşya / sürükleme izi
    const isaret = (kareler, renk) => {
      X.save();
      X.strokeStyle = renk;
      X.lineWidth = Math.max(2, 2.2 / z);
      X.setLineDash([6, 4]);
      X.lineDashOffset = K.reduced ? 0 : -now / 60;
      kareler.forEach(([i, j]) => {
        const cy = wy(i, j) - (kara(i, j) ? LH : 0), cx = wx(i, j);
        X.beginPath();
        X.moveTo(cx, cy - HH);
        X.lineTo(cx + HW, cy);
        X.lineTo(cx, cy + HH);
        X.lineTo(cx - HW, cy);
        X.closePath();
        X.stroke();
      });
      X.restore();
    };
    if (kartcik && kartcik.uid) {
      const e = esyalar.get(kartcik.uid);
      if (e && !e.gone) isaret(ayakKare(DEF[e.tip], e.x, e.y, e.rot), '#E3174D');
    }
    if (surukle) isaret(ayakKare(DEF[surukle.tip], surukle.x, surukle.y, surukle.rot), surukle.ok ? '#3FA37A' : '#E3174D');
    // ışıklar
    const isik = pal.isik;
    if (isik > 0.05) {
      X.save();
      isiklar.forEach(([x, y, s]) => {
        X.fillStyle = `rgba(255,226,122,${0.16 * isik})`;
        X.beginPath();
        X.arc(x, y, 34 * s, 0, 7);
        X.fill();
        X.fillStyle = `rgba(255,236,170,${0.22 * isik})`;
        X.beginPath();
        X.arc(x, y, 16 * s, 0, 7);
        X.fill();
      });
      if (pal.gece > 0.3 && !K.reduced)
        ATESBOCEK.forEach(([bx, by, ph]) => {
          const ax = bx + Math.sin(now / 1400 + ph) * 22, ay = by - 16 + Math.cos(now / 1900 + ph * 2) * 9;
          X.fillStyle = `rgba(255,236,140,${pal.gece * (0.35 + 0.45 * Math.abs(Math.sin(now / 600 + ph)))})`;
          X.beginPath();
          X.arc(ax, ay, 2.2, 0, 7);
          X.fill();
          X.fillStyle = `rgba(255,236,140,${pal.gece * 0.12})`;
          X.beginPath();
          X.arc(ax, ay, 7, 0, 7);
          X.fill();
        });
      X.restore();
    }
    // parçacıklar
    parca.forEach((p) => {
      const k = (now - p.t0) / p.omur;
      X.save();
      X.globalAlpha = Math.max(0, 1 - k) * (k < 0.15 ? k / 0.15 : 1);
      X.lineWidth = LW * 0.7;
      if (p.tur === 'kalp') {
        kalpYol(p.x, p.y, p.s);
        boya(p.renk);
      } else if (p.tur === 'toz') elips(p.x, p.y, p.s, p.s * 0.7, 'rgba(255,255,255,0.9)', false);
      else {
        yildizYol(p.x, p.y, 4, p.s, p.s * 0.35, 0);
        boya(p.renk, false);
      }
      X.restore();
    });
    // ekran katmanı: balonlar, adlar
    X.setTransform(dpr, 0, 0, dpr, 0, 0);
    X.lineWidth = 2.2;
    X.strokeStyle = INK;
    // ad etiketleri: yan yana duran iki kedinin etiketleri üst üste binmesin
    X.font = '600 10.5px Fredoka, Nunito, sans-serif';
    const etiket = (a, kim, var_) => {
      const [sx, sy] = ekran(wx(a.i, a.j), wy(a.i, a.j) - LH);
      const ad = nameOf(kim) || '';
      return { a, kim, var_, sx, sy, ad, w: X.measureText(ad).width + 12, kay: 0 };
    };
    const liste = [];
    if (o.seenAt || o.bilinen) liste.push(etiket(o, other(), oVar));
    liste.push(etiket(ben, mine(), true));
    if (liste.length === 2) {
      const [p, q] = liste, dx = q.sx - p.sx, ust2 = (p.w + q.w) / 2 + 4 - Math.abs(dx);
      if (ust2 > 0 && Math.abs(q.sy - p.sy) < 17) {
        const yon = dx >= 0 ? 1 : -1;
        p.kay = (-yon * ust2) / 2;
        q.kay = (yon * ust2) / 2;
      }
    }
    liste.forEach(({ a, kim, var_, sx, sy, ad, w, kay }) => {
      if (sx < -60 || sx > vw + 60 || sy < -40 || sy > vh + 80) return;
      X.font = '600 10.5px Fredoka, Nunito, sans-serif';
      X.globalAlpha = var_ ? 0.95 : 0.6;
      rr(sx + kay - w / 2, sy + 5, w, 15, 7.5);
      X.lineWidth = 1.6;
      X.strokeStyle = INK;
      boya(kim === 'her' ? '#FFE1EC' : '#E1F1FF');
      X.fillStyle = INK;
      X.textAlign = 'center';
      X.textBaseline = 'middle';
      X.fillText(ad, sx + kay, sy + 12.8);
      X.globalAlpha = 1;
      if (!var_ && !K.reduced) {
        X.font = '700 12px Fredoka, Nunito, sans-serif';
        for (let k = 0; k < 3; k++) {
          const u = (now / 2400 + k / 3) % 1;
          X.globalAlpha = 0.75 * (1 - u);
          X.fillStyle = '#FFFFFF';
          X.strokeStyle = INK;
          X.lineWidth = 3;
          const tx = sx + 12 + u * 14, ty = sy - 44 * cam.z - u * 18;
          X.strokeText('z', tx, ty);
          X.fillText('z', tx, ty);
        }
        X.globalAlpha = 1;
      }
      if (a.duygu && now - a.duygu.t0 < 3400) balon(sx + kay * 1.6, sy - 50 * cam.z, a.duygu.d, now - a.duygu.t0);
    });
  }
  function balon(sx, sy, d, yas) {
    const def = DUYGU[d];
    if (!def) return;
    const k = yas / 3400;
    const sc = Math.min(1, yas / 160) * (k > 0.9 ? 1 - (k - 0.9) * 10 : 1);
    if (sc <= 0) return;
    X.save();
    X.translate(sx, sy - (K.reduced ? 0 : k * 10));
    X.scale(sc, sc);
    X.font = '600 13px Fredoka, Nunito, sans-serif';
    const w = def.metin ? X.measureText(def.metin).width + 20 : 32, h = 27;
    X.lineWidth = 2.4;
    X.strokeStyle = INK;
    X.beginPath();
    X.moveTo(-5, -7);
    X.lineTo(0, 0);
    X.lineTo(5, -7);
    rr(-w / 2, -7 - h, w, h, 13);
    X.fillStyle = '#FFFFFF';
    X.stroke();
    X.fill();
    X.beginPath();
    X.moveTo(-4, -8.5);
    X.lineTo(0, -1.8);
    X.lineTo(4, -8.5);
    X.closePath();
    X.fill();
    X.beginPath();
    X.moveTo(-5, -7);
    X.lineTo(0, 0);
    X.lineTo(5, -7);
    X.stroke();
    if (def.metin) {
      X.fillStyle = INK;
      X.textAlign = 'center';
      X.textBaseline = 'middle';
      X.fillText(def.metin, 0, -7 - h / 2 + 0.5);
    } else if (d === 'kalp') {
      X.lineWidth = 2;
      kalpYol(0, -19, 8);
      boya('#E3174D');
    } else {
      X.lineWidth = 2;
      yildizYol(0, -20.5, 5, 9, 4);
      boya('#FFE27A');
    }
    X.restore();
  }

  /* ================= Hareket ================= */
  const YURU_HIZ = 3.2;
  function ilerle(a, dt) {
    if (!a.path.length) return false;
    let kalan = YURU_HIZ * dt;
    while (kalan > 0 && a.path.length) {
      const [ti, tj] = a.path[0];
      const di = ti - a.i, dj = tj - a.j, d = Math.hypot(di, dj);
      if (d > 0.001) a.dir = Math.abs(di) > Math.abs(dj) ? (di > 0 ? 0 : 2) : dj > 0 ? 1 : 3;
      if (d <= kalan) {
        a.i = ti;
        a.j = tj;
        a.tx = ti;
        a.ty = tj;
        a.path.shift();
        kalan -= d;
      } else {
        a.i += (di / d) * kalan;
        a.j += (dj / d) * kalan;
        kalan = 0;
      }
    }
    a.adim += dt * 13;
    if (!a.path.length) vardi(a);
    return true;
  }
  function vardi(a) {
    const s = oturakAt(a.tx, a.ty);
    if (a === ben) {
      ben.sit = s ? s.uid : null;
      if (s) ben.dir = FACE[s.rot];
      yayinla();
      if (Date.now() - sonKonum.at > 120000) konumKaydet();
      hud();
    } else if (s && a.sit === s.uid) a.dir = FACE[s.rot];
  }
  function yuru(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    if (!icinde(x, y)) return false;
    const bas = ben.path.length ? ben.path[0] : [ben.tx, ben.ty];
    const p = yolBul(bas[0], bas[1], x, y, !gecer(x, y));
    if (!p) return false;
    ben.path = ben.path.length ? [bas, ...p] : p;
    if (ben.path.length) ben.sit = null;
    else vardi(ben);
    benYerlesti = true;
    yayinla();
    kirli = true;
    calis();
    return true;
  }
  function yayinla() {
    if (!K.cloud || !K.cloud.enabled || !aktif) return;
    K.cloud.send('ada', { k: 'yer', x: ben.tx, y: ben.ty, dir: ben.dir, sit: ben.sit || '', yol: ben.path.slice(0, 40) });
  }
  function canli(m) {
    if (!m || m.who === mine()) return;
    if (m.k === 'git') {
      if (o.seenAt) o.sonAt = Date.now();
      o.seenAt = 0;
      o.path = [];
      o.bilinen = true;
      kirli = true;
      hud();
      return;
    }
    const once = oBurada();
    o.seenAt = Date.now();
    if (m.k === 'yer') {
      const x = Math.round(+m.x), y = Math.round(+m.y);
      if (!icinde(x, y)) return;
      const yolu = Array.isArray(m.yol) ? m.yol.filter((p) => Array.isArray(p) && icinde(+p[0], +p[1])).map((p) => [+p[0], +p[1]]) : [];
      const uzak = Math.abs(o.i - x) + Math.abs(o.j - y) > 2.5;
      const hedef = (a) => (a.length ? a[a.length - 1].join() : '');
      if (!once || uzak || K.activeRoom !== 'ada') {
        const son = yolu.length && K.activeRoom !== 'ada' ? yolu[yolu.length - 1] : [x, y];
        Object.assign(o, { i: son[0], j: son[1], tx: son[0], ty: son[1], path: K.activeRoom === 'ada' ? yolu : [] });
      } else if (yolu.length) {
        if (hedef(yolu) !== hedef(o.path)) {
          const ilk = yolu[0], yanyana = Math.abs(ilk[0] - o.tx) + Math.abs(ilk[1] - o.ty) <= 1;
          o.path = yanyana ? yolu : [[x, y], ...yolu];
        }
      } else if (!o.path.length && (o.tx !== x || o.ty !== y)) {
        o.path = yolBul(o.tx, o.ty, x, y) || [];
        if (!o.path.length) Object.assign(o, { i: x, j: y, tx: x, ty: y });
      }
      o.sit = m.sit || null;
      if (!o.path.length && Number.isFinite(+m.dir)) o.dir = +m.dir & 3;
      o.bilinen = true;
      if (!once) {
        hud();
        if (K.activeRoom !== 'ada' && !K.store.get('adaCagri' + T.todayKey())) {
          K.store.set('adaCagri' + T.todayKey(), 1);
          K.fx.toast(`🏝 <b>${K.esc(nameOf(m.who))} adada.</b> <a href="#ada">Yanına git</a>`, { icon: A.icon('sky'), duration: 7000 });
        }
      }
    } else if (m.k === 'duygu' && DUYGU[m.d]) {
      o.duygu = { d: m.d, t0: performance.now() };
      if (K.activeRoom === 'ada') K.audio.sfx.pop();
    } else if (m.k === 'mv' && typeof m.uid === 'string') {
      uzakTasi.set(m.uid, { x: Math.round(+m.x), y: Math.round(+m.y), rot: (+m.rot || 0) & 3, until: Date.now() + 1800 });
    }
    kirli = true;
    calis();
  }
  function duygu(d) {
    if (!DUYGU[d]) return false;
    ben.duygu = { d, t0: performance.now() };
    if (K.cloud && K.cloud.enabled) K.cloud.send('ada', { k: 'duygu', d });
    K.audio.sfx.pop();
    kirli = true;
    calis();
    return true;
  }

  /* ================= Birlikte oturmak ================= */
  function birlikteMi() {
    if (!ben.sit || !o.sit || ben.sit !== o.sit || !oBurada() || ben.path.length || o.path.length) return false;
    if (ben.tx === o.tx && ben.ty === o.ty) return false;
    const e = esyalar.get(ben.sit);
    return Boolean(e && !e.gone);
  }
  const sureYaz = (sn) => (sn >= 3600 ? `${Math.floor(sn / 3600)} sa ${Math.floor((sn % 3600) / 60)} dk` : sn >= 60 ? `${Math.floor(sn / 60)} dk${sn % 60 ? ` ${sn % 60} sn` : ''}` : `${sn} sn`);
  function oturmaDenetle() {
    const b = birlikteMi();
    if (b && !oturum) {
      oturum = { bas: Date.now(), koltuk: ben.sit, odul: false, kayit: 0 };
      K.audio.sfx.chime();
      K.vibrate(30);
      kalpSac(8);
    }
    if (!b && oturum) bitir();
    if (oturum) {
      const sn = Math.floor((Date.now() - oturum.bas) / 1000);
      if (sn >= ESIK && !oturum.odul) {
        oturum.odul = true;
        K.stickers.award('adaoturma');
        K.fx.toast(`🌅 <b>Bir dakikayı geçtiniz.</b> Bu gün batımı ikinizin.`, { duration: 3600 });
      }
      if (Date.now() - oturum.kayit > 5000) {
        oturum.kayit = Date.now();
        K.store.set('adaOturum', { bas: oturum.bas, koltuk: oturum.koltuk, sn });
      }
    }
  }
  function bitir() {
    const sn = Math.round((Date.now() - oturum.bas) / 1000);
    const kayit = { sn, bas: oturum.bas, koltuk: oturum.koltuk };
    oturum = null;
    K.store.del('adaOturum');
    if (sn >= ESIK) {
      K.store.set('adaOturmaBekle', kayit);
      setTimeout(oturmaYaz, K.isOwner() ? 300 : 4500);
      K.fx.toast(`🌅 <b>${sureYaz(sn)}</b> birlikte oturdunuz.`, { duration: 4000 });
    }
    hud();
  }
  async function oturmaYaz() {
    const b = K.store.get('adaOturmaBekle');
    if (!b || !K.cloud || !K.cloud.enabled) return;
    await yukle();
    if (oturmaRows.some((r) => r.data && r.data.koltuk === b.koltuk && Math.abs((+r.data.bas || 0) - b.bas) < 30000)) return K.store.del('adaOturmaBekle');
    const ilk = !oturmaRows.length;
    const r = await K.cloud.add('adaoturma', { sn: b.sn, bas: b.bas, koltuk: b.koltuk });
    if (!r) return;
    K.store.del('adaOturmaBekle');
    satirEkle(oturmaRows, r);
    if (ilk) K.ping(`🌅 Bizim Ada'da ilk kez yan yana oturduk`, `${sureYaz(b.sn)} boyunca güneşi birlikte batırdık.`, ['sunrise'], { click: K.roomUrl('ada') });
    panel();
  }
  function kalpSac(n) {
    if (K.reduced) n = Math.min(n, 2);
    const ax = (wx(ben.i, ben.j) + wx(o.i, o.j)) / 2, ay = (wy(ben.i, ben.j) + wy(o.i, o.j)) / 2 - LH - 40;
    const now = performance.now();
    for (let k = 0; k < n; k++)
      parca.push({ tur: 'kalp', x: ax + (Math.random() - 0.5) * 24, y: ay + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.5) * 8, vy: -16 - Math.random() * 14, s: 5 + Math.random() * 3.5, renk: ['#E3174D', '#FF8FB8', '#FF6B8B'][k % 3], t0: now + k * 90, omur: 2400 + Math.random() * 900 });
  }

  /* ================= Bulut ================= */
  function satirEkle(arr, r) {
    if (!r || satirVar.has(r.id)) return false;
    satirVar.add(r.id);
    arr.push(r);
    return true;
  }
  async function hepsi(kind) {
    let out = [], before = null;
    for (let n = 0; n < 20; n++) {
      const got = await K.cloud.list(kind, 1000, before ? { before } : undefined);
      out = got.concat(out);
      if (got.length < 1000) break;
      before = got[0].at;
    }
    return out;
  }
  function yukle() {
    if (!K.cloud || !K.cloud.enabled) return Promise.resolve();
    return (yuklendi = yuklendi || (async () => {
      const [es, ko, ot] = await Promise.all([hepsi('adaesya'), K.cloud.list('adakonum', 120), K.cloud.list('adaoturma', 1000)]);
      es.forEach((r) => satirEkle(esyaRows, r));
      ko.forEach((r) => satirEkle(konumRows, r));
      ot.forEach((r) => satirEkle(oturmaRows, r));
      kur();
      yuklu = true;
      konumlariUygula();
      asamaKontrol(false);
      const s = K.store.get('adaOturum');
      if (s && !oturum) {
        K.store.del('adaOturum');
        if (s.sn >= ESIK) K.store.set('adaOturmaBekle', s);
      }
      if (K.store.get('adaOturmaBekle')) setTimeout(oturmaYaz, K.isOwner() ? 500 : 4500);
      if (K.activeRoom === 'ada') {
        panel();
        hud();
      }
      kirli = true;
    })());
  }
  function konumlariUygula() {
    const son = (w) => konumRows.filter((r) => r.who === w && r.data).sort((a, b) => a.at - b.at).pop();
    const b = son(mine());
    if (!benYerlesti) {
      const [x, y] = yakinBos(b ? Math.round(+b.data.x) || 0 : K.isOwner() ? 10 : 8, b ? Math.round(+b.data.y) || 0 : 11);
      Object.assign(ben, { i: x, j: y, tx: x, ty: y, path: [], dir: b ? +b.data.dir & 3 : 1 });
      const s = oturakAt(x, y);
      ben.sit = s ? s.uid : null;
      sonKonum = { x, y, at: b ? b.at : 0 };
      benYerlesti = true;
      kamOrtala(true);
    }
    const ob = son(other());
    if (!o.seenAt && !o.bilinen) {
      const [x, y] = ob ? [Math.round(+ob.data.x) || 0, Math.round(+ob.data.y) || 0] : [K.isOwner() ? 8 : 10, 11];
      Object.assign(o, { i: x, j: y, tx: x, ty: y, path: [], bilinen: true, sonAt: ob ? ob.at : 0 });
    }
  }
  function konumKaydet() {
    if (!K.cloud || !K.cloud.enabled || !yuklu) return;
    if (sonKonum.x === ben.tx && sonKonum.y === ben.ty) return;
    sonKonum = { x: ben.tx, y: ben.ty, at: Date.now() };
    K.cloud.add('adakonum', { x: ben.tx, y: ben.ty, dir: ben.dir }).then((r) => r && satirEkle(konumRows, r));
  }
  K.on('cloud', (ok) => {
    if (!ok) return;
    K.cloud.onLive('ada', canli);
    K.cloud.on('adaesya', (r) => {
      if (!satirEkle(esyaRows, r)) return;
      if (r.data && r.data.uid) {
        bekleyen.delete(r.data.uid);
        uzakTasi.delete(r.data.uid);
      }
      const ilk = esyaRows.filter((q) => q.data && q.data.uid === (r.data || {}).uid).length === 1;
      kur();
      if (yuklu) asamaKontrol(Boolean(r.data && kendi.has(r.data.uid)));
      if (r.who !== mine() && ilk && !r.data.gone && DEF[r.data.tip] && K.activeRoom !== 'ada' && Date.now() - sonToast > 600000) {
        sonToast = Date.now();
        K.fx.toast(`<b>${K.esc(nameOf(r.who))} adamıza ${K.esc(DEF[r.data.tip].ad.toLocaleLowerCase('tr'))} koydu.</b> <a href="#ada">Bak</a>`, { icon: A.icon('sky'), duration: 6000 });
      }
      if (K.activeRoom === 'ada') {
        panelSonra();
        kirli = true;
      }
    });
    K.cloud.on('adakonum', (r) => satirEkle(konumRows, r));
    K.cloud.on('adaoturma', (r) => satirEkle(oturmaRows, r) && K.activeRoom === 'ada' && panelSonra());
  });

  /* ================= Eşya işlemleri ================= */
  async function kaydet(data) {
    const d = Object.assign({}, data, { _at: Date.now() });
    bekleyen.set(d.uid, d);
    kur();
    calis();
    const temiz = { uid: d.uid, tip: d.tip, x: d.x, y: d.y, rot: d.rot, gone: Boolean(d.gone) };
    let r = null;
    try {
      r = await K.cloud.add('adaesya', temiz);
    } catch (e) {
      r = null;
    }
    if (!r) {
      bekleyen.delete(d.uid);
      kur();
      K.fx.toast('Kaydedilemedi. İnternet bağlantını kontrol et.');
      return null;
    }
    satirEkle(esyaRows, r);
    bekleyen.delete(d.uid);
    kur();
    panelSonra();
    return r;
  }
  async function koy(tip, x, y, rot = 0) {
    const def = DEF[tip];
    if (!def) return 'Bu eşya rafta yok.';
    x = Math.round(x);
    y = Math.round(y);
    rot = ((Math.round(rot) || 0) % def.donus + def.donus) % def.donus;
    const neden = uygun(tip, x, y, rot);
    if (neden) {
      ipucu(neden, true);
      return neden;
    }
    const once = asamaHesap();
    const uid = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    kendi.add(uid);
    K.audio.sfx.pop();
    const [ax, ay] = anaKonum({ tip, x, y, rot });
    for (let k = 0; k < (K.reduced ? 2 : 6); k++) parca.push({ tur: k % 2 ? 'yildiz' : 'toz', x: ax + (Math.random() - 0.5) * 30, y: ay - Math.random() * 10, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 20, s: 2.4 + Math.random() * 2, renk: '#FFE27A', t0: performance.now(), omur: 700 });
    const r = await kaydet({ uid, tip, x, y, rot, gone: false });
    if (!r) return null;
    K.stickers.award('ada');
    if (asamaHesap() > once) asamaKontrol(true);
    return r;
  }
  async function degistir(uid, patch) {
    const e = esyalar.get(uid);
    if (!e) return null;
    return kaydet({ uid, tip: e.tip, x: e.x, y: e.y, rot: e.rot, gone: false, ...patch });
  }
  async function dondur(uid) {
    const e = esyalar.get(uid);
    if (!e) return null;
    const def = DEF[e.tip];
    let rot = -1, neden = '';
    for (let k = 1; k < def.donus && rot < 0; k++) {
      const r = (e.rot + k) % def.donus, n = uygun(e.tip, e.x, e.y, r, uid);
      if (!n) rot = r;
      else neden = neden || n;
    }
    if (rot < 0) return ipucu('Döndürmeye yer yok: ' + neden.charAt(0).toLocaleLowerCase('tr') + neden.slice(1), true), null;
    K.audio.sfx.tap();
    return degistir(uid, { rot });
  }
  async function tasi(uid, x, y) {
    const e = esyalar.get(uid);
    if (!e) return null;
    const neden = uygun(e.tip, x, y, e.rot, uid);
    if (neden) return ipucu(neden, true), null;
    K.audio.sfx.tap();
    return degistir(uid, { x, y });
  }
  async function kaldir(uid) {
    const e = esyalar.get(uid);
    if (!e) return null;
    K.audio.sfx.tap();
    return degistir(uid, { gone: true });
  }
  function asamaKontrol(benim) {
    const s = asamaHesap();
    asama = s;
    const gor = K.store.get('adaAsama', -1);
    if (gor < 0) K.store.set('adaAsama', s);
    else if (s > gor) {
      K.store.set('adaAsama', s);
      if (K.activeRoom === 'ada') kutla(s);
      else bekleyenKutla = s;
      if (benim) K.ping(`🏡 Bizim Ada'da evimiz büyüdü: ${ASAMA[s - 1].ad}`, `${ASAMA[s - 1].kutla}. Gel, birlikte bakalım.`, ['house_with_garden'], { click: K.roomUrl('ada') });
    }
    if (s >= ASAMA.length) K.stickers.award('adaev');
    kirli = true;
  }
  function kutla(s) {
    bekleyenKutla = 0;
    const a = ASAMA[s - 1];
    if (!a) return;
    evPop = performance.now();
    const now = performance.now();
    for (let k = 0; k < (K.reduced ? 4 : 16); k++) parca.push({ tur: k % 3 ? 'toz' : 'yildiz', x: EV_X + (Math.random() - 0.5) * 120, y: EV_Y + 10 - Math.random() * 30, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 30, s: 3 + Math.random() * 3, renk: '#FFE27A', t0: now, omur: 1100 });
    K.audio.sfx.success();
    K.vibrate([20, 40, 20]);
    K.fx.confetti({ count: 70, shapes: ['heart', 'star'] });
    K.fx.toast(`🏡 <b>${K.esc(a.kutla)}.</b> ${s < ASAMA.length ? `Evimiz ${s}/${ASAMA.length}` : 'Ev tamam!'}`, { icon: A.icon('house'), duration: 5200 });
    calis();
  }

  /* ================= Dokunma ================= */
  const ptr = new Map();
  let jest = null;
  function konumE(e) {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  function bas(e) {
    if (e.button != null && e.button > 0) return;
    e.preventDefault();
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (err) {}
    const [x, y] = konumE(e);
    ptr.set(e.pointerId, [x, y]);
    if (ptr.size === 2) {
      const [a, b] = [...ptr.values()];
      jest = { tur: 'cimdik', d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z0: cam.z, orta: dunya((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
      if (surukle) surukle = null;
      kartKapat();
      return;
    }
    if (ptr.size > 2) return;
    let tutulan = null;
    if (kurMod && !secTip) {
      const e2 = esyaVur(x, y);
      const k = kareSec(x, y);
      const zemin = icinde(...k) && esyaAt(...k);
      tutulan = e2 || (zemin && DEF[zemin.tip].duz ? zemin : null);
    }
    jest = { tur: 'dokun', sx: x, sy: y, cx: cam.x, cy: cam.y, t0: performance.now(), tut: tutulan ? tutulan.uid : null };
  }
  function kay(e) {
    const [x, y] = konumE(e);
    if (e.pointerType === 'mouse' && !ptr.size) {
      const k = secTip ? kareSec(x, y) : null;
      const yeni = k && icinde(...k) ? k : null;
      if (String(yeni) !== String(hover)) {
        hover = yeni;
        kirli = true;
      }
      return;
    }
    if (!ptr.has(e.pointerId)) return;
    ptr.set(e.pointerId, [x, y]);
    if (!jest) return;
    if (jest.tur === 'cimdik' && ptr.size >= 2) {
      const [a, b] = [...ptr.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      cam.z = K.clamp(jest.z0 * (d / jest.d0), zMin(), Z_MAX);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      cam.x = jest.orta[0] - (mx - vw / 2) / cam.z;
      cam.y = jest.orta[1] - (my - vh / 2) / cam.z;
      kamSinir();
      kirli = true;
      return;
    }
    const dx = x - jest.sx, dy = y - jest.sy;
    if (jest.tur === 'dokun' && Math.hypot(dx, dy) > 8) {
      kartKapat();
      if (jest.tut) {
        const t = esyalar.get(jest.tut);
        jest.tur = 'suru';
        surukle = { uid: t.uid, tip: t.tip, rot: t.rot, x: t.x, y: t.y, ok: true, gonder: 0 };
      } else jest.tur = 'kaydir';
    }
    if (jest.tur === 'kaydir') {
      cam.x = jest.cx - dx / cam.z;
      cam.y = jest.cy - dy / cam.z;
      kamSinir();
      kirli = true;
    } else if (jest.tur === 'suru' && surukle) {
      const k = kareSec(x, y);
      if (icinde(...k) && (k[0] !== surukle.x || k[1] !== surukle.y)) {
        surukle.x = k[0];
        surukle.y = k[1];
        surukle.ok = !uygun(surukle.tip, k[0], k[1], surukle.rot, surukle.uid);
        kirli = true;
        if (K.cloud && K.cloud.enabled && Date.now() - surukle.gonder > 90) {
          surukle.gonder = Date.now();
          K.cloud.send('ada', { k: 'mv', uid: surukle.uid, x: k[0], y: k[1], rot: surukle.rot });
        }
      }
    }
  }
  function birak(e) {
    if (!ptr.has(e.pointerId)) return;
    const [x, y] = konumE(e);
    ptr.delete(e.pointerId);
    const j = jest;
    if (ptr.size === 1 && j && j.tur === 'cimdik') {
      const [p] = [...ptr.values()];
      jest = { tur: 'kaydir', sx: p[0], sy: p[1], cx: cam.x, cy: cam.y };
      return;
    }
    if (ptr.size) return;
    jest = null;
    if (!j || e.type === 'pointercancel') {
      surukle = null;
      return;
    }
    if (j.tur === 'dokun') dokun(x, y);
    else if (j.tur === 'suru' && surukle) {
      const s = surukle;
      surukle = null;
      const t = esyalar.get(s.uid);
      if (t && s.ok && (s.x !== t.x || s.y !== t.y)) tasi(s.uid, s.x, s.y);
      else if (t && !s.ok) {
        ipucu(uygun(s.tip, s.x, s.y, s.rot, s.uid), true);
        if (K.cloud && K.cloud.enabled) K.cloud.send('ada', { k: 'mv', uid: s.uid, x: t.x, y: t.y, rot: t.rot });
      }
      kirli = true;
    }
  }
  function tekerlek(e) {
    e.preventDefault();
    const [x, y] = konumE(e);
    const once = dunya(x, y);
    cam.z = K.clamp(cam.z * Math.exp(-e.deltaY * 0.0015), zMin(), Z_MAX);
    cam.x = once[0] - (x - vw / 2) / cam.z;
    cam.y = once[1] - (y - vh / 2) / cam.z;
    kamSinir();
    kartKapat();
    kirli = true;
  }
  function dokun(x, y) {
    const k = kareSec(x, y);
    if (tasiUid) {
      const u = tasiUid;
      tasiUid = null;
      if (icinde(...k)) tasi(u, k[0], k[1]);
      ipucu('');
      if (!$('#adRaf').classList.contains('acik')) {
        kurMod = false;
        $('#adSahne').classList.remove('kur');
      }
      kirli = true;
      return;
    }
    if (kurMod && secTip) {
      const e = icinde(...k) && esyaAt(...k);
      if (e && e.tip !== 'tasyol') return kartAc({ tur: 'esya', uid: e.uid }, x, y);
      if (!icinde(...k)) return;
      koy(secTip, k[0], k[1], secRot);
      return;
    }
    if (kediVur(x, y, ben) && !kurMod) return sozAc(true);
    if ((o.seenAt || o.bilinen) && kediVur(x, y, o)) return kartAc({ tur: 'o' }, x, y);
    const vur = esyaVur(x, y);
    if (vur) return kartAc({ tur: 'esya', uid: vur.uid }, x, y);
    if (evVur(x, y) || (icinde(...k) && evMi(...k))) return kartAc({ tur: 'ev' }, x, y);
    if (!icinde(...k)) return;
    const zemin = esyaAt(...k);
    if (zemin && DEF[zemin.tip].oturak) {
      let [tx, ty] = k;
      if (oBurada() && o.tx === tx && o.ty === ty && !o.path.length) {
        const diger = ayakKare(DEF[zemin.tip], zemin.x, zemin.y, zemin.rot).find(([a, b]) => a !== tx || b !== ty);
        if (diger) [tx, ty] = diger;
      }
      yuru(tx, ty);
      kartAc({ tur: 'esya', uid: zemin.uid, kisa: true }, x, y);
      return;
    }
    if (kurMod && zemin) return kartAc({ tur: 'esya', uid: zemin.uid }, x, y);
    if (!yuru(...k) && !kara(...k)) suHalka(k);
  }
  function suHalka(k) {
    const now = performance.now();
    parca.push({ tur: 'toz', x: wx(...k), y: wy(...k), vx: 0, vy: -6, s: 5, t0: now, omur: 600 });
    kirli = true;
  }

  /* ================= Arayüz ================= */
  const $ = (s) => K.$(s, root);
  let ipucuT = 0;
  function ipucu(metin, hata) {
    const el = $('#adIpucu');
    if (!el) return;
    clearTimeout(ipucuT);
    el.hidden = !metin;
    el.textContent = metin || '';
    el.classList.toggle('hata', Boolean(hata));
    if (metin && hata) ipucuT = setTimeout(() => (el.hidden = true), 2600);
  }
  function kartAc(k, sx, sy) {
    kartcik = k;
    const el = $('#adKartcik');
    let html = '';
    if (k.tur === 'esya') {
      const e = esyalar.get(k.uid);
      if (!e) return kartKapat();
      const def = DEF[e.tip];
      html = `<b>${K.esc(def.ad)}</b><small>${K.esc(nameOf(e.by))} koydu · ${K.esc(T.fmt(new Date(e.at)))}${e.son !== e.by ? `<br>${K.esc(nameOf(e.son))} son kez düzenledi` : ''}</small>
        <div class="ad-kart-dug"><button type="button" data-ad-k="dondur">↻ Döndür</button><button type="button" data-ad-k="tasi">Taşı</button><button type="button" data-ad-k="kaldir">Kaldır</button></div>`;
    } else if (k.tur === 'ev') {
      const s = asama, sira = ASAMA[s];
      html = `<b>Evimiz</b><small>${s ? `${K.esc(ASAMA[s - 1].ad)} tamam · ${s}/${ASAMA.length}` : 'Henüz bir arsa'}${sira ? `<br>Sıradaki: ${K.esc(sira.ad)}` : '<br>Ev tamam, kapı hep açık'}</small>`;
    } else if (k.tur === 'o') {
      const w = other(), here = oBurada();
      const son = o.sonAt ? `son: ${K.esc(T.fmt(new Date(o.sonAt)))}` : '';
      html = `<b>${K.esc(nameOf(w))}</b><small>${here ? 'Şu an adada, yanına git' : `Uyuyor${son ? ' · ' + son : ''}`}</small><div class="ad-kart-dug"><button type="button" data-ad-k="kalp">♥ Kalp gönder</button></div>`;
    }
    el.innerHTML = html;
    el.hidden = false;
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = K.clamp(sx - w / 2, 8, vw - w - 8) + 'px';
    el.style.top = (sy - h - 26 > 50 ? sy - h - 26 : Math.min(vh - h - 70, sy + 22)) + 'px';
    clearTimeout(el._t);
    if (k.kisa) el._t = setTimeout(() => kartcik === k && kartKapat(), 2600);
    kirli = true;
  }
  function kartKapat() {
    if (!kartcik) return;
    kartcik = null;
    const el = $('#adKartcik');
    if (el) el.hidden = true;
    kirli = true;
  }
  function sozAc(ac) {
    const el = $('#adSozler');
    if (!el) return;
    el.hidden = ac === undefined ? !el.hidden : !ac;
  }
  function rafAc(ac) {
    kurMod = ac;
    if (!ac) {
      secTip = null;
      tasiUid = null;
      hover = null;
    }
    const raf2 = $('#adRaf');
    raf2.classList.toggle('acik', ac);
    raf2.setAttribute('aria-hidden', String(!ac));
    $('#adSahne').classList.toggle('kur', ac);
    $('[data-ad-kur]').setAttribute('aria-expanded', String(ac));
    sozAc(false);
    kartKapat();
    rafCiz();
    ipucu(ac ? 'Bir eşya seç, sonra adada bir kareye dokun. Eşyayı sürükleyerek taşıyabilirsin.' : '');
    kirli = true;
  }
  function rafCiz() {
    K.$$('[data-ad-tip]', root).forEach((b) => b.classList.toggle('on', b.dataset.adTip === secTip));
    const c = $('[data-ad-cevir]');
    if (c) c.disabled = !secTip;
  }
  let kucukler = false;
  function kucukCiz() {
    if (kucukler) return;
    kucukler = true;
    const eski = { tint, LW }, X0 = X;
    tint = { c: '#FFFFFF', a: 0, key: '' };
    K.$$('[data-ad-tip] canvas', root).forEach((c) => {
      const def = DEF[c.parentNode.dataset.adTip];
      const g = c.getContext('2d');
      X = g;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, c.width, c.height);
      const s = c.width / 112;
      const olc = (def.boy === 2 ? 0.7 : 1.08) * s;
      g.setTransform(olc, 0, 0, olc, c.width / 2, c.height * 0.76);
      LW = 2.4;
      g.lineWidth = LW;
      g.lineJoin = 'round';
      g.lineCap = 'round';
      g.strokeStyle = INK;
      const k = def.boy === 2 ? 1.6 : 1;
      yol([0, -HH * k, HW * k, 0, 0, HH * k, -HW * k, 0]);
      g.fillStyle = def.yer === 'su' ? '#ACE2FA' : def.yer === 'kum' ? '#FFE6B0' : '#A6E6BE';
      g.fill();
      g.save();
      g.globalAlpha = 0.25;
      g.lineWidth = 1.5;
      g.stroke();
      g.restore();
      isiklar = [];
      const e = { uid: def.id, tip: def.id, x: 0, y: 0, rot: 0, v: 0 };
      if (def.id === 'bank') {
        CIZ.bank(e, 0, 'arka');
        CIZ.bank(e, 1, 'arka');
      } else CIZ[def.id](e, 0);
    });
    X = X0;
    tint = eski.tint;
    LW = eski.LW;
    TM.clear();
  }
  function hud() {
    if (!root || K.activeRoom !== 'ada') return;
    const here = oBurada(), w = other();
    const yaz = (el, html) => el.innerHTML !== html && (el.innerHTML = html);
    yaz($('#adKim'), `<i class="${here ? 'on' : ''}"></i>${K.esc(nameOf(w))} ${here ? 'adada' : 'uyuyor'}`);
    const h = saat();
    const p = paletHesap(h, batimF);
    const st = `Bakü ${K.pad(Math.floor(h))}:${K.pad(Math.floor((h % 1) * 60))} · ${oturum ? 'gün batımı ♡' : evreAd(p, h)}`;
    if ($('#adSaat').textContent !== st) $('#adSaat').textContent = st;
    const ot = $('#adOtur');
    if (oturum) {
      const sn = Math.floor((Date.now() - oturum.bas) / 1000);
      ot.hidden = false;
      yaz(ot, `<b>${Math.floor(sn / 60)}</b><span>birlikte oturduğunuz dakika</span><i>${K.pad(Math.floor(sn / 60))}:${K.pad(sn % 60)}</i>`);
    } else ot.hidden = true;
    $('#adSahne').classList.toggle('gece', p.gece > 0.5);
  }
  let panelT = 0;
  const panelSonra = () => {
    cancelAnimationFrame(panelT);
    panelT = requestAnimationFrame(panel);
  };
  function panel() {
    if (!root || K.activeRoom !== 'ada') return;
    const s = asama, n = toplamUid, g = gunSayisi(), sira = ASAMA[s];
    let ileri;
    if (sira) {
      const eks = Math.max(0, sira.esya - n), gk = Math.max(0, sira.gun - g);
      ileri = `Sıradaki: <b>${K.esc(sira.ad)}</b> · ${[eks ? `${eks} eşya daha` : '', gk ? `${gk} gün sonra` : ''].filter(Boolean).join(', ') || 'çok yakında'}`;
    } else ileri = 'Evimiz tamam. Bahçe kapısı hep açık.';
    $('#adEv').innerHTML = `<p class="card-eyebrow">Evimiz</p><ol class="ad-asama">${ASAMA.map((a, k) => `<li class="${k < s ? 'ok' : k === s ? 'sira' : ''}"><i></i><span>${K.esc(a.ad)}</span></li>`).join('')}</ol>
      <p class="small center muted">${ileri}</p><p class="small center muted">Birlikte <b>${K.num(g)}</b>. gün · adaya konan <b>${K.num(n)}</b> eşya</p>`;
    const bende = esyaDizi.filter((e) => e.by === mine()).length, onda = esyaDizi.filter((e) => e.by === other()).length;
    const tekil = [];
    oturmaRows
      .filter((r) => r.data && +r.data.sn > 0)
      .sort((a, b) => a.at - b.at)
      .forEach((r) => {
        const v = tekil.find((q) => q.koltuk === r.data.koltuk && Math.abs(q.bas - (+r.data.bas || r.at)) < 30000);
        if (v) v.sn = Math.max(v.sn, +r.data.sn);
        else tekil.push({ koltuk: r.data.koltuk, bas: +r.data.bas || r.at, sn: +r.data.sn });
      });
    const top2 = tekil.reduce((a, q) => a + q.sn, 0), enUzun = tekil.reduce((a, q) => Math.max(a, q.sn), 0);
    const son = esyaDizi.slice().sort((a, b) => b.at - a.at).slice(0, 5);
    $('#adBilgi').innerHTML = `<p class="card-eyebrow">Adamız</p>
      <div class="ad-sayi"><div><b>${K.num(esyaDizi.length)}</b><small>eşya adada</small></div><div><b>${K.num(Math.floor(top2 / 60))}</b><small>birlikte dakika</small></div><div><b>${K.num(tekil.length)}</b><small>gün batımı</small></div></div>
      <p class="small center muted">${K.esc(nameOf(mine()))} ${bende} · ${K.esc(nameOf(other()))} ${onda}${enUzun ? ` · en uzun oturuşumuz ${K.esc(sureYaz(enUzun))}` : ''}</p>
      ${son.length ? `<ul class="ad-son">${son.map((e) => `<li><span>${K.esc(DEF[e.tip].ad)}</span><small>${K.esc(nameOf(e.by))} · ${K.esc(T.fmtShort(new Date(e.at)))}</small></li>`).join('')}</ul>` : '<p class="small center muted">Ada henüz bomboş. İlk eşyayı kim koyacak?</p>'}`;
  }

  /* ================= Döngü ================= */
  function calis() {
    if (!aktif || raf || document.hidden) return;
    sonKare = performance.now();
    raf = requestAnimationFrame(dongu);
  }
  function dongu(now) {
    raf = 0;
    if (!aktif || document.hidden || !ctx) return;
    const ham = Math.max(0, (now - sonKare) / 1000), dt = Math.min(0.05, ham), dtYuru = Math.min(0.5, ham);
    sonKare = now;
    let hareket = ilerle(ben, dtYuru);
    if (ilerle(o, dtYuru)) hareket = true;
    const hedefF = oturum ? 1 : 0;
    if (Math.abs(batimF - hedefF) > 0.002) {
      batimF += (hedefF - batimF) * Math.min(1, dt * (K.reduced ? 10 : 1.3));
      hareket = true;
    } else batimF = hedefF;
    if (oturum && !K.reduced && Math.random() < dt * 1.3) kalpSac(1);
    for (let k = parca.length - 1; k >= 0; k--) {
      const p = parca[k];
      if (now < p.t0) continue;
      if (now - p.t0 > p.omur) {
        parca.splice(k, 1);
        continue;
      }
      p.x += p.vx * dt + (p.tur === 'kalp' && !K.reduced ? Math.sin((now - p.t0) / 300) * 0.25 : 0);
      p.y += p.vy * dt;
    }
    if (parca.length || evPop || (ben.duygu && now - ben.duygu.t0 < 3500) || (o.duygu && now - o.duygu.t0 < 3500)) hareket = true;
    const ortam = !K.reduced && now - sonCiz > 80;
    if (kirli || hareket || ortam || (surukle && !K.reduced)) {
      ciz(now);
      sonCiz = now;
      kirli = false;
    }
    raf = requestAnimationFrame(dongu);
    if (K.reduced && !hareket && !kirli && !surukle) {
      cancelAnimationFrame(raf);
      raf = 0;
      setTimeout(calis, 1000);
    }
  }
  function boyut() {
    if (!cv) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = w;
    vh = h;
    const W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
    }
    kamSinir();
    kirli = true;
    calis();
  }
  function kamOrtala(hemen) {
    if (!vw) return;
    cam.x = wx(ben.i, ben.j) * 0.6 + EV_X * 0.4;
    cam.y = (wy(ben.i, ben.j) - LH - 30) * 0.6 + (EV_Y - 20) * 0.4;
    if (hemen && !kamAyar) cam.z = K.clamp(vw / 580, 0.5, 1.05);
    kamSinir();
    kirli = true;
  }
  let kamAyar = false;
  function tik() {
    if (!aktif) return;
    oturmaDenetle();
    hud();
    if (Date.now() - hbT > 1150 && !document.hidden) {
      hbT = Date.now();
      yayinla();
    }
    if (Date.now() - logT > 30000) {
      logT = Date.now();
      if (yuklu && !bekleyen.size) asamaKontrol(false);
    }
    kirli = kirli || Boolean(oturum);
  }
  let tikT = 0;
  const gorunurluk = () => {
    if (!aktif) return;
    if (document.hidden) {
      if (K.cloud && K.cloud.enabled) K.cloud.send('ada', { k: 'git' });
      konumKaydet();
    } else {
      yayinla();
      kirli = true;
      calis();
    }
  };

  /* ================= Oda ================= */
  const kalpSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5C6 16.5 2.5 13 2.5 8.6 2.5 5.6 4.8 3.5 7.6 3.5c1.8 0 3.4 1 4.4 2.5 1-1.5 2.6-2.5 4.4-2.5 2.8 0 5.1 2.1 5.1 5.1 0 4.4-3.5 7.9-9.5 11.9Z"/></svg>';
  const yildizSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.8 6.3.7-4.7 4.3 1.3 6.3L12 16.7l-5.6 3.2 1.3-6.3L3 9.3l6.3-.7L12 2.8Z"/></svg>';
  K.room({
    id: 'ada',
    wing: 'hazine',
    title: 'Bizim Ada',
    sub: 'İki kedi, bir ada, bir ev',
    icon: 'sky',
    color: '#DDF3FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (oBurada() && K.activeRoom !== 'ada' ? '♥' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>İkimizin küçük adası. Bir kareye dokun, kedin oraya yürüsün; raftan bir şey seçip adaya koyalım. Ortadaki ev biz büyüdükçe yükselir. Aynı banka ya da iskeleye yan yana oturunca güneş batar.</p></div>
        <section class="ad-kart"><div class="ad-sahne" id="adSahne">
          <canvas class="ad-tuval" id="adTuval" role="img" aria-label="Bizim Ada: iki kedinin birlikte kurduğu ada"></canvas>
          <div class="ad-ust"><p class="ad-hap" id="adKim"></p><p class="ad-hap ad-saat" id="adSaat"></p></div>
          <div class="ad-yak"><button type="button" class="ad-yuv" data-ad-zoom="1" aria-label="Yakınlaştır">+</button><button type="button" class="ad-yuv" data-ad-zoom="-1" aria-label="Uzaklaştır">−</button><button type="button" class="ad-yuv" data-ad-bul aria-label="Kedimi bul"><span class="ad-bul"></span></button></div>
          <div class="ad-otur" id="adOtur" hidden></div>
          <p class="ad-ipucu" id="adIpucu" hidden></p>
          <div class="ad-kartcik" id="adKartcik" hidden></div>
          <div class="ad-sozler" id="adSozler" hidden>${['ozledim', 'miyav', 'gel', 'seviyorum'].map((d) => `<button type="button" data-ad-duygu="${d}">${K.esc(DUYGU[d].metin)}</button>`).join('')}</div>
          <div class="ad-alt"><div class="ad-duygular"><button type="button" class="ad-yuv kalp" data-ad-duygu="kalp" aria-label="Kalp gönder">${kalpSvg}</button><button type="button" class="ad-yuv yildiz" data-ad-duygu="yildiz" aria-label="Yıldız gönder">${yildizSvg}</button><button type="button" class="ad-yuv soz" data-ad-soz aria-label="Bir söz gönder">söz</button></div>
            <button type="button" class="ad-kur" data-ad-kur aria-expanded="false">Kur</button></div>
          <div class="ad-raf" id="adRaf" aria-hidden="true">
            <div class="ad-raf-bas"><b>Eşya rafı</b><button type="button" class="ad-yuv" data-ad-cevir aria-label="Döndür" disabled>↻</button><button type="button" class="ad-bitti" data-ad-kur-kapat>Bitti</button></div>
            <div class="ad-raf-liste">${ESYA.map((d) => `<button type="button" class="ad-esya" data-ad-tip="${d.id}"><canvas width="112" height="112" aria-hidden="true"></canvas><small>${K.esc(d.ad)}</small></button>`).join('')}</div>
          </div>
        </div></section>
        <section class="card ad-ev" id="adEv"></section>
        <section class="card ad-bilgi" id="adBilgi"></section>`;
      cv = $('#adTuval');
      ctx = cv.getContext('2d');
      cv.addEventListener('pointerdown', bas);
      cv.addEventListener('pointermove', kay);
      cv.addEventListener('pointerup', birak);
      cv.addEventListener('pointercancel', birak);
      cv.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && hover && ((hover = null), (kirli = true)));
      cv.addEventListener('wheel', tekerlek, { passive: false });
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      // Kenardan kaydırıp odadan çıkma jesti haritayı kaydırırken tetiklenmesin
      $('#adSahne').addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      if (window.ResizeObserver) new ResizeObserver(boyut).observe(cv);
      else window.addEventListener('resize', boyut);
      document.addEventListener('visibilitychange', gorunurluk);
      el.addEventListener('click', async (e) => {
        const t = e.target;
        const z = t.closest('[data-ad-zoom]');
        if (z) {
          const once = [cam.x, cam.y];
          cam.z = K.clamp(cam.z * (z.dataset.adZoom === '1' ? 1.25 : 0.8), zMin(), Z_MAX);
          [cam.x, cam.y] = once;
          kamAyar = true;
          kamSinir();
          kartKapat();
          kirli = true;
          return calis();
        }
        if (t.closest('[data-ad-bul]')) return kamOrtala(false), calis();
        const d = t.closest('[data-ad-duygu]');
        if (d) {
          duygu(d.dataset.adDuygu);
          return sozAc(false);
        }
        if (t.closest('[data-ad-soz]')) return sozAc();
        if (t.closest('[data-ad-kur]')) return rafAc(!kurMod);
        if (t.closest('[data-ad-kur-kapat]')) return rafAc(false);
        if (t.closest('[data-ad-cevir]')) {
          if (!secTip) return;
          secRot = (secRot + 1) % DEF[secTip].donus;
          uygunKey = '';
          kirli = true;
          return ipucu(`${DEF[secTip].ad} döndü. Yerini seç.`);
        }
        const tp = t.closest('[data-ad-tip]');
        if (tp) {
          secTip = secTip === tp.dataset.adTip ? null : tp.dataset.adTip;
          secRot = 0;
          tasiUid = null;
          kartKapat();
          rafCiz();
          ipucu(secTip ? `${DEF[secTip].ad}: ${DEF[secTip].yer === 'su' ? 'kıyıya yakın bir su karesine' : DEF[secTip].yer === 'kum' ? 'kumsalda bir kareye' : 'bir kareye'} dokun` : 'Bir eşya seç, sonra adada bir kareye dokun.');
          kirli = true;
          return;
        }
        const kb = t.closest('[data-ad-k]');
        if (kb && kartcik) {
          const k = kartcik;
          if (kb.dataset.adK === 'kalp') {
            duygu('kalp');
            return kartKapat();
          }
          if (k.tur !== 'esya') return;
          if (kb.dataset.adK === 'dondur') return dondur(k.uid);
          if (kb.dataset.adK === 'tasi') {
            tasiUid = k.uid;
            kartKapat();
            if (!kurMod) {
              kurMod = true;
              $('#adSahne').classList.add('kur');
            }
            ipucu('Yeni yerine dokun.');
            kirli = true;
            return;
          }
          if (kb.dataset.adK === 'kaldir') {
            if (kb.dataset.emin !== '1') {
              kb.dataset.emin = '1';
              kb.textContent = 'Emin misin?';
              kb.classList.add('emin');
              return;
            }
            kartKapat();
            return kaldir(k.uid);
          }
        }
      });
    },
    enter() {
      aktif = true;
      kucukCiz();
      boyut();
      if (!benYerlesti || !kamAyar) kamOrtala(true);
      yukle().then(() => {
        if (bekleyenKutla && K.activeRoom === 'ada') setTimeout(() => K.activeRoom === 'ada' && kutla(bekleyenKutla), 700);
      });
      panel();
      hud();
      hbT = 0;
      clearInterval(tikT);
      tikT = setInterval(tik, 500);
      yayinla();
      kirli = true;
      calis();
    },
    leave() {
      if (oturum) bitir();
      if (K.cloud && K.cloud.enabled) K.cloud.send('ada', { k: 'git' });
      konumKaydet();
      aktif = false;
      clearInterval(tikT);
      cancelAnimationFrame(raf);
      raf = 0;
      ptr.clear();
      jest = null;
      surukle = null;
      if (kurMod) rafAc(false);
      kartKapat();
      sozAc(false);
    },
  });

  // Test ve diğer odalar için küçük bir dışa açık API
  K.ada = {
    yuru,
    koy,
    dondur,
    kaldir,
    duygu,
    tasi,
    uygun: (tip, x, y, rot = 0) => uygun(tip, x, y, rot),
    // Bir eşya için ilk uygun kare (deneme kolaylığı): [x, y]
    bos(tip, rot = 0, yakin) {
      const [cx, cy] = yakin || [ben.tx, ben.ty];
      let best = null, bd = Infinity;
      for (let j = 0; j < G; j++)
        for (let i = 0; i < G; i++) {
          if (uygun(tip, i, j, rot)) continue;
          const d = Math.abs(i - cx) + Math.abs(j - cy);
          if (d < bd) (bd = d), (best = [i, j]);
        }
      return best;
    },
    // Evi verilen aşamada göster (yalnız bu ekranda, kaydedilmez; null ile gerçeğe döner)
    evOnizle(s) {
      asamaOnizle = s == null ? null : K.clamp(Math.round(+s), 0, ASAMA.length);
      kirli = true;
      calis();
    },
    // Bakü saatini zorla (ondalık saat; null ile gerçek saate döner)
    saat(h) {
      saatZorla = h == null ? null : +h;
      kirli = true;
      hud();
      calis();
    },
    yukle,
    // Bir karenin ortalama çizim süresi (ms), deneme için
    _olc(n = 30) {
      if (!ctx || !vw) return 0;
      const t0 = performance.now();
      for (let k = 0; k < n; k++) ciz(performance.now()), ctx.getImageData(0, 0, 1, 1);
      return +((performance.now() - t0) / n).toFixed(2);
    },
    durum() {
      const p = paletHesap(saat(), batimF);
      return {
        ben: { x: ben.tx, y: ben.ty, i: +ben.i.toFixed(2), j: +ben.j.toFixed(2), sit: ben.sit, yuruyor: ben.path.length > 0, dir: ben.dir },
        o: { x: o.tx, y: o.ty, i: +o.i.toFixed(2), j: +o.j.toFixed(2), sit: o.sit, here: oBurada(), yuruyor: o.path.length > 0 },
        esya: esyaDizi.length,
        toplamEsya: toplamUid,
        esyalar: esyaDizi.map((e) => ({ uid: e.uid, tip: e.tip, x: e.x, y: e.y, rot: e.rot, by: e.by })),
        asama,
        birlikte: Boolean(oturum),
        sn: oturum ? Math.floor((Date.now() - oturum.bas) / 1000) : 0,
        oturmaKayit: oturmaRows.length,
        evre: evreAd(p, saat()),
        gece: +p.gece.toFixed(2),
        gunbatimi: +batimF.toFixed(2),
        kam: { x: Math.round(cam.x), y: Math.round(cam.y), z: +cam.z.toFixed(2) },
        esik: ESIK,
      };
    },
    ekran: (i, j) => {
      const r = cv ? cv.getBoundingClientRect() : { left: 0, top: 0 };
      const [x, y] = ekran(wx(i, j), wy(i, j) - (kara(i, j) ? LH : 0));
      return [r.left + x, r.top + y];
    },
  };
})();
