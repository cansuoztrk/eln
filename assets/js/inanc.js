/* Kızıl Kapsül — çıkarım motoru.
 * Her gözlemci (bot, oyuncu ya da tarafsız halk) olası tüm rol dağılımlarını ("dünyalar") sayar
 * ve her olayın o dünyada ne kadar olası olduğuna göre ağırlıklandırır. Botların şüphesi buradan gelir. */
(function (kok) {
  'use strict';
  const KK = (kok.KK = kok.KK || {});
  const TABAN = 0.004; // hiçbir gözlem bir dünyayı tamamen silmesin (insanlar beklenmedik oynar)

  // Kabin: tipler I (masum), H (kabin lanetli halüsinatif), T (hain). Anahtar sıralı harf çifti.
  const KABIN = {
    II: { eslesme: 0.96, yakin: 0.02, alakasiz: 0.02 },
    IT: { eslesme: 0.18, yakin: 0.72, alakasiz: 0.10 },
    TT: { eslesme: 0.93, yakin: 0.04, alakasiz: 0.03 },
    HI: { eslesme: 0.03, yakin: 0.03, alakasiz: 0.94 },
    HT: { eslesme: 0.02, yakin: 0.04, alakasiz: 0.94 },
    HH: { eslesme: 0.34, yakin: 0.33, alakasiz: 0.33 }
  };

  // Şalter: kişi başına P(beyan, gerçek renk | tip). Tipler I, S (şalter lanetli), T.
  const SALTER = {
    I: { bastim: { yesil: 0.95, kirmizi: 0.01 }, zaten: { yesil: 0.004, kirmizi: 0.01 },
      tuhaf: { yesil: 0.004, kirmizi: 0.006 }, basmadim: { yesil: 0.004, kirmizi: 0.012 } },
    S: { bastim: { yesil: 0.03, kirmizi: 0.02 }, zaten: { yesil: 0.01, kirmizi: 0.66 },
      tuhaf: { yesil: 0.05, kirmizi: 0.22 }, basmadim: { yesil: 0.004, kirmizi: 0.01 } },
    T: { bastim: { yesil: 0.42, kirmizi: 0.40 }, zaten: { yesil: 0.01, kirmizi: 0.10 },
      tuhaf: { yesil: 0.005, kirmizi: 0.04 }, basmadim: { yesil: 0.005, kirmizi: 0.02 } }
  };

  // Telefon: hain arayanın bilgiyi çarpıtma politikası. Motor da botları bu politikayla oynatır.
  const TELEFON = {
    birey: function (gercek) { // gercek: 'hain' | 'masum'
      return gercek === 'hain' ? { masum: 0.88, hain: 0.12 } : { hain: 0.35, masum: 0.65 };
    },
    sayi: function (t) {
      const d = {};
      const ekle = (k, p) => { d[k] = (d[k] || 0) + p; };
      if (t > 0) { ekle(t - 1, 0.55); ekle(0, 0.2); ekle(t, 0.25); } else { ekle(0, 0.6); ekle(1, 0.4); }
      return d;
    },
    cift: function (gercek, hainSayisi) { // hainSayisi: çiftteki hain sayısı
      if (hainSayisi === 2) return { ayni: 0.85, farkli: 0.15 };
      if (hainSayisi === 1) return { ayni: 0.7, farkli: 0.3 };
      return { farkli: 0.35, ayni: 0.65 };
    }
  };
  KK.TELEFON_POLITIKA = TELEFON;

  function bit(maske, id) { return (maske >>> id) & 1; }

  function kombinasyonlar(dizi, k, cb, bas, secim) {
    bas = bas || 0; secim = secim || [];
    if (secim.length === k) { cb(secim); return; }
    for (let i = bas; i < dizi.length; i++) {
      secim.push(dizi[i]);
      kombinasyonlar(dizi, k, cb, i + 1, secim);
      secim.pop();
    }
  }

  /* yapi: { n, yanciSayisi, halVar, lanetler: [0,1] | [0] | [1] }
   * bilgi: null (tarafsız halk) ya da { ben, hain: bool, hainMaske, suik, halBen: bool }
   * keskinlik: 0..1, yumuşak kanıtın ne kadar ciddiye alındığı (1 = kusursuz akıl yürütme). */
  class Inanc {
    constructor(yapi, bilgi, keskinlik) {
      this.n = yapi.n;
      this.bilgi = bilgi || null;
      this.keskinlik = keskinlik == null ? 1 : keskinlik;
      const hm = [], su = [], ha = [], la = [];
      const kisiler = [];
      for (let i = 0; i < this.n; i++) kisiler.push(i);
      const b = this.bilgi;
      for (let s = 0; s < this.n; s++) {
        const kalan = kisiler.filter((i) => i !== s);
        kombinasyonlar(kalan, yapi.yanciSayisi, (yancilar) => {
          let maske = 1 << s;
          for (const y of yancilar) maske |= 1 << y;
          if (b) {
            if (b.hain) { if (maske !== b.hainMaske || s !== b.suik) return; }
            else if (bit(maske, b.ben)) return;
          }
          const halAdaylari = yapi.halVar ? kisiler.filter((i) => !bit(maske, i)) : [-1];
          for (const h of halAdaylari) {
            if (b && !b.hain) {
              if (b.halBen && h !== b.ben) continue;
              if (!b.halBen && h === b.ben) continue;
            }
            for (const l of yapi.lanetler) { hm.push(maske); su.push(s); ha.push(h); la.push(l); }
          }
        });
      }
      this.m = hm.length;
      this.hainMaske = Int32Array.from(hm);
      this.suik = Int8Array.from(su);
      this.hal = Int8Array.from(ha);
      this.lanet = Int8Array.from(la);
      this.w = new Float64Array(this.m).fill(1 / Math.max(1, this.m));
      this.marjinal();
    }

    kabinTip(i, id) {
      if (bit(this.hainMaske[i], id)) return 'T';
      return this.hal[i] === id && this.lanet[i] === 0 ? 'H' : 'I';
    }
    salterTip(i, id) {
      if (bit(this.hainMaske[i], id)) return 'T';
      return this.hal[i] === id && this.lanet[i] === 1 ? 'S' : 'I';
    }

    // Bir dünyada telefon bilgisinin gerçek değeri.
    telefonGercek(i, bilgi) {
      const m = this.hainMaske[i];
      if (bilgi.tur === 'birey') return bit(m, bilgi.hedef) ? 'hain' : 'masum';
      if (bilgi.tur === 'sayi') { let t = 0; for (const k of bilgi.kisiler) t += bit(m, k); return t; }
      return bit(m, bilgi.a) === bit(m, bilgi.b) ? 'ayni' : 'farkli';
    }

    olasilik(i, g) {
      switch (g.tip) {
        case 'kabin': {
          const anahtar = [this.kabinTip(i, g.a), this.kabinTip(i, g.b)].sort().join('');
          return KABIN[anahtar][g.sinif];
        }
        case 'salter': {
          const k = g.kisiler.length;
          const tipler = g.kisiler.map((id) => this.salterTip(i, id));
          let top = 0;
          for (let mask = 0; mask < 1 << k; mask++) { // bit=1 → yeşil
            let yesil = 0; for (let j = 0; j < k; j++) yesil += (mask >> j) & 1;
            if (yesil !== g.yesil) continue;
            let p = 1;
            for (let j = 0; j < k; j++) {
              const renk = (mask >> j) & 1 ? 'yesil' : 'kirmizi';
              const bilinen = g.bilinen && g.bilinen[g.kisiler[j]];
              if (bilinen && bilinen !== renk) { p = 0; break; }
              p *= SALTER[tipler[j]][g.beyanlar[j]][renk];
            }
            top += p;
          }
          return top;
        }
        case 'telefon': {
          const gercek = this.telefonGercek(i, g.bilgi);
          const arayanHain = bit(this.hainMaske[i], g.arayan);
          const d = g.bilgi.deger;
          if (!arayanHain) return d === gercek ? 0.97 : 0.03;
          let dag;
          if (g.bilgi.tur === 'birey') dag = TELEFON.birey(gercek);
          else if (g.bilgi.tur === 'sayi') dag = TELEFON.sayi(gercek);
          else dag = TELEFON.cift(gercek, bit(this.hainMaske[i], g.bilgi.a) + bit(this.hainMaske[i], g.bilgi.b));
          return dag[d] || 0.02;
        }
        case 'gercek': // telefonu açan kişinin duyduğu gerçek bilgi
          return this.telefonGercek(i, g.bilgi) === g.bilgi.deger ? 1 : 0;
        case 'kimlik': {
          const hain = bit(this.hainMaske[i], g.kisi) === 1;
          if (g.takim && (g.takim === 'hain') !== hain) return 0;
          if (g.rol) {
            if (g.rol === 'suikastci' && this.suik[i] !== g.kisi) return 0;
            if (g.rol === 'yanci' && (!hain || this.suik[i] === g.kisi)) return 0;
            if (g.rol === 'halusinatif' && this.hal[i] !== g.kisi) return 0;
            if (g.rol !== 'halusinatif' && !hain && this.hal[i] === g.kisi) return 0;
          }
          return 1;
        }
        case 'olum': // Suikastçı gece birini öldürdü
          return bit(g.canlilar, this.suik[i]) && !bit(this.hainMaske[i], g.kisi) ? 1 : 0;
        case 'kurtarma': // saldırı oldu ama Medik kurtardı
          return bit(g.canlilar, this.suik[i]) ? 1 : 0;
        case 'sessizGece': // oylama oldu, karantina yok, kimse saldırmadı
          return bit(g.canlilar, this.suik[i]) ? 0.002 : 1;
        case 'kaptanAcik':
          return !bit(this.hainMaske[i], g.kisi) && this.hal[i] !== g.kisi ? 1 : 0;
        default:
          return 1;
      }
    }

    gozlem(g) {
      const yeni = new Float64Array(this.m);
      const sert = g.tip === 'gercek' || g.tip === 'kimlik' || g.tip === 'olum' || g.tip === 'kurtarma' || g.tip === 'kaptanAcik';
      let top = 0;
      for (let i = 0; i < this.m; i++) {
        let p = this.olasilik(i, g);
        if (!sert) { if (p < TABAN) p = TABAN; if (this.keskinlik !== 1) p = Math.pow(p, this.keskinlik); }
        yeni[i] = this.w[i] * p;
        top += yeni[i];
      }
      if (top <= 0 || !isFinite(top)) return false; // çelişkili bilgi: bu gözlemciyi bozma
      for (let i = 0; i < this.m; i++) yeni[i] /= top;
      this.w = yeni;
      this.marjinal();
      return true;
    }

    marjinal() {
      const n = this.n;
      this.pHain = new Float64Array(n);
      this.pHal = new Float64Array(n);
      this.pSuik = new Float64Array(n);
      this.pLanetSalter = 0;
      for (let i = 0; i < this.m; i++) {
        const w = this.w[i];
        if (w === 0) continue;
        const m = this.hainMaske[i];
        for (let k = 0; k < n; k++) if (bit(m, k)) this.pHain[k] += w;
        if (this.hal[i] >= 0) this.pHal[this.hal[i]] += w;
        this.pSuik[this.suik[i]] += w;
        if (this.lanet[i] === 1) this.pLanetSalter += w;
      }
    }

    hain(id) { return this.pHain[id]; }
    halusinatif(id) { return this.pHal[id]; }
    suikastci(id) { return this.pSuik[id]; }
  }

  KK.Inanc = Inanc;
  KK.INANC_TABLO = { KABIN, SALTER };
})(typeof window !== 'undefined' ? window : globalThis);
