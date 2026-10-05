/* Kızıl Kapsül — oyun motoru. DOM'a dokunmaz; arayüz ve testler aynı motoru kullanır. */
(function (kok) {
  'use strict';
  const KK = (kok.KK = kok.KK || {});

  const O2_TABAN = 20;      // her tur düşen oksijen
  const O2_KIRMIZI = 6;     // kırmızı kalan her şalter için ek düşüş
  const O2_OLAY = 8;        // sızıntı / yedek tüp etkisi

  function tohumluRastgele(tohum) {
    let a = tohum >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalize(kelime) {
    return String(kelime || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
  }
  KK.normalize = normalize;

  class Oyun {
    constructor(ayar) {
      this.ayar = Object.assign({
        oyuncuSayisi: 8, insanAd: 'Sen', insanRol: 'rastgele', zorluk: 'normal', olaylar: true,
        medik: false, lanet: 'rastgele', halBilir: false, kimlik: 'gizli', otomatik: false,
        tohum: (Date.now() ^ (Math.random() * 1e9)) >>> 0
      }, ayar || {});
      this.r = tohumluRastgele(this.ayar.tohum);
      this.tur = 0;
      this.faz = 'brifing';
      this.o2 = 100;
      this.kaptanYetki = false;
      this.kaptanOylamaSayisi = 0;
      this.kayit = [];
      this.sohbet = [];
      this.mesajNo = 0;
      this.suclamalar = [];
      this.bitti = false;
      this.sonuc = null;
      this.finalBekliyor = false;
      this.final = null;
      this.sonKategoriler = [];
      this.sonOlay = null;
      this.sonKorunan = null;
      this.oyunculariKur();
      this.modelleriKur();
    }

    /* ---------- yardımcılar ---------- */
    rastgele(dizi) { return dizi[Math.floor(this.r() * dizi.length)]; }
    karistir(dizi) {
      const a = dizi.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
    agirlikliSec(dizi, k, agirlik) {
      const havuz = dizi.slice(); const secilen = [];
      while (secilen.length < k && havuz.length) {
        const w = havuz.map(agirlik); const top = w.reduce((s, x) => s + x, 0);
        let r = this.r() * top; let i = 0;
        for (; i < havuz.length - 1; i++) { r -= w[i]; if (r <= 0) break; }
        secilen.push(havuz.splice(i, 1)[0]);
      }
      return secilen;
    }
    secEnIyi(adaylar, skor, beceri) {
      if (!adaylar.length) return null;
      const s = adaylar.map((a) => ({ a, s: skor(a) + this.r() * 0.02 })).sort((x, y) => y.s - x.s);
      if (s.length === 1 || this.r() < beceri) return s[0].a;
      return s[Math.floor(this.r() * Math.min(3, s.length))].a;
    }
    hainMi(p) { return KK.HAIN_ROLLER.includes(p.rol); }
    canlilar() { return this.oyuncular.filter((p) => p.durum === 'canli'); }
    canliMaske() { let m = 0; for (const p of this.canlilar()) m |= 1 << p.id; return m; }
    insan() { return this.oyuncular.find((p) => p.insan); }
    elle(p) { return p.insan && p.durum === 'canli' && !this.ayar.otomatik; }
    ekip(p) { return this.oyuncular.filter((q) => q !== p && this.hainMi(q) && this.hainMi(p)); }
    takim(p) { return this.hainMi(p) ? 'hain' : 'masum'; }
    aktif() { return this.kayit[this.kayit.length - 1]; }

    mesaj(kim, metin, tip) {
      const m = { no: ++this.mesajNo, kim, metin, tip: tip || (kim == null ? 'sistem' : 'konusma'), tur: this.tur, faz: this.faz };
      this.sohbet.push(m);
      return m;
    }
    replik(kim, anahtar, d) {
      const p = this.oyuncular[kim];
      let metin = this.rastgele(KK.REPLIK[anahtar]);
      metin = metin.replace(/\{(\w+)\}/g, (_, k) => {
        const v = d && d[k];
        if (v == null) return '';
        return typeof v === 'object' && v.id != null ? '@[' + v.id + ']' : String(v);
      });
      if (p.kisilik && this.r() < 0.3) {
        const on = this.rastgele(KK.KISILIKLER[p.kisilik].on);
        if (on) {
          const ilk = metin.charAt(0);
          if (/[A-ZÇĞİÖŞÜ]/.test(ilk) && metin.charAt(1) !== '*') metin = ilk.toLocaleLowerCase('tr-TR') + metin.slice(1);
          metin = on + ' ' + metin;
        }
      }
      if (d && d.x && ['kabinYakin', 'kabinYakinIcerden', 'kaptanOyla', 'kaptanSuphe', 'telefonYalanTepki', 'telefonInanc', 'salterIcerdenTek', 'katil'].includes(anahtar)) {
        this.suclamalar.push({ kim, hedef: (d.c || d.x).id, tur: this.tur });
      }
      return this.mesaj(kim, metin);
    }

    /* ---------- kurulum ---------- */
    oyunculariKur() {
      const n = Math.max(7, Math.min(12, this.ayar.oyuncuSayisi | 0));
      this.yanciSayisi = n >= 10 ? 2 : 1;
      const roller = ['suikastci'];
      for (let i = 0; i < this.yanciSayisi; i++) roller.push('yanci');
      roller.push('halusinatif', 'kaptan');
      if (this.ayar.medik) roller.push('medik');
      while (roller.length < n) roller.push('murettebat');

      const isimler = this.karistir(KK.BOT_ISIMLERI.filter((x) => normalize(x) !== normalize(this.ayar.insanAd)));
      const kisilikler = Object.keys(KK.KISILIKLER);
      const insanId = Math.floor(this.r() * n);
      let dagitim = this.karistir(roller);
      if (this.ayar.insanRol && this.ayar.insanRol !== 'rastgele' && roller.includes(this.ayar.insanRol)) {
        const i = dagitim.indexOf(this.ayar.insanRol);
        [dagitim[i], dagitim[insanId]] = [dagitim[insanId], dagitim[i]];
      }
      const lanetSec = () => (this.ayar.lanet === 'kabin' ? 0 : this.ayar.lanet === 'salter' ? 1 : (this.r() < 0.5 ? 0 : 1));
      this.oyuncular = dagitim.map((rol, id) => ({
        id, rol,
        insan: id === insanId,
        ad: id === insanId ? (String(this.ayar.insanAd || 'Sen').trim().slice(0, 18) || 'Sen') : isimler[id % isimler.length],
        lanet: rol === 'halusinatif' ? lanetSec() : null,
        durum: 'canli',
        kisilik: kisilikler[Math.floor(this.r() * kisilikler.length)],
        avatarTohum: Math.floor(this.r() * 1e9),
        sonKabin: -9, sonSalter: -9
      }));
      for (const p of this.oyuncular) {
        p.gorunenRol = p.rol === 'halusinatif' && !this.ayar.halBilir ? 'murettebat' : p.rol;
        // Zorluk karşı takımın becerisini belirler. Masum müttefikler orta seviyededir ki kararı oyuncu versin.
        const insanTakim = this.takim(this.oyuncular[insanId]);
        const z = { kolay: 0, normal: 1, zor: 2 }[this.ayar.zorluk] ?? 1;
        if (p.insan) p.beceri = 0.8;
        else if (this.takim(p) === insanTakim) p.beceri = insanTakim === 'masum' ? 0.58 : 0.78;
        else p.beceri = this.takim(p) === 'masum' ? [0.4, 0.62, 0.85][z] : [0.5, 0.75, 0.95][z];
      }
    }

    bilgi(p) {
      if (this.hainMi(p)) {
        let m = 0; let s = -1;
        for (const q of this.oyuncular) if (this.hainMi(q)) { m |= 1 << q.id; if (q.rol === 'suikastci') s = q.id; }
        return { ben: p.id, hain: true, hainMaske: m, suik: s };
      }
      return { ben: p.id, hain: false, halBen: p.gorunenRol === 'halusinatif' };
    }

    modelleriKur() {
      const yapi = {
        n: this.oyuncular.length, yanciSayisi: this.yanciSayisi, halVar: true,
        lanetler: this.ayar.lanet === 'kabin' ? [0] : this.ayar.lanet === 'salter' ? [1] : [0, 1]
      };
      // Botlar kanıtı becerileri oranında ciddiye alır; oyuncunun modeli (ARIA) kusursuzdur.
      for (const p of this.oyuncular) {
        p.inanc = new KK.Inanc(yapi, this.bilgi(p), p.insan ? 1 : 0.08 + 0.45 * p.beceri * p.beceri);
        // Kişisel önyargı: herkes bazı yüzlere içgüdüsel olarak daha az güvenir. Beceri düştükçe büyür.
        const sigma = 0.08 + 0.35 * (1 - p.beceri);
        p.onyargi = this.oyuncular.map((q) => (q === p ? 0 : (this.r() + this.r() + this.r() - 1.5) * sigma * 1.6));
      }
      this.halk = new KK.Inanc(yapi, null);
    }

    gozlemYay(g) {
      for (const p of this.oyuncular) p.inanc.gozlem(g);
      this.halk.gozlem(g);
    }

    /* ---------- tur başı ---------- */
    turBaslat() {
      this.tur++;
      this.faz = 'olay';
      const olay = this.olayCek();
      const t = {
        no: this.tur, olay, o2Once: this.o2, o2Sonra: null, kirmizi: 0,
        kabinler: [], salter: null, telefon: null, kaptan: null, oylama: null, gece: null
      };
      this.kayit.push(t);
      this.mesaj(null, 'TUR ' + this.tur + ' · Oksijen %' + this.o2 + ' · İstasyon olayı: **' + olay.ad + '**. ' + olay.metin);
      return t;
    }

    olayCek() {
      const sakin = KK.OLAYLAR[0];
      if (!this.ayar.olaylar || this.tur === 1) return sakin;
      const havuz = KK.OLAYLAR.filter((o) => o.id !== this.sonOlay || o.id === 'sakin');
      const toplam = havuz.reduce((s, o) => s + o.agirlik, 0);
      let r = this.r() * toplam;
      for (const o of havuz) { r -= o.agirlik; if (r <= 0) { this.sonOlay = o.id; return o; } }
      return sakin;
    }

    /* ---------- 1. kabin ---------- */
    kabinHazirla() {
      this.faz = 'kabin';
      const t = this.aktif();
      const canli = this.canlilar();
      const cift = t.olay.id === 'ek_kabin' && canli.length >= 6 ? 2 : 1;
      const secilen = this.agirlikliSec(canli, cift * 2, (p) => 1 + 2 * Math.min(4, this.tur - p.sonKabin));
      for (let i = 0; i + 1 < secilen.length; i += 2) {
        const a = secilen[i], b = secilen[i + 1];
        a.sonKabin = b.sonKabin = this.tur;
        t.kabinler.push(this.kelimeUret(a, b));
      }
      const adlar = t.kabinler.map((k) => '@[' + k.a + '] ve @[' + k.b + ']').join(', ');
      this.mesaj(null, 'KABİN TURU: ' + adlar + ' teyit kabinine giriyor.');
      return t.kabinler;
    }

    kelimeUret(a, b) {
      const adaylar = KK.KATEGORILER.filter((k) => !this.sonKategoriler.includes(k.ad));
      const kat = this.rastgele(adaylar.length ? adaylar : KK.KATEGORILER);
      this.sonKategoriler.push(kat.ad);
      if (this.sonKategoriler.length > 4) this.sonKategoriler.shift();
      let masumK, hainK;
      if (kat.sayisal) {
        const n = 12 + Math.floor(this.r() * 80);
        const fark = (1 + Math.floor(this.r() * 4)) * (this.r() < 0.5 ? -1 : 1);
        masumK = String(n); hainK = String(n + fark);
      } else {
        const iki = this.karistir(kat.kelimeler).slice(0, 2);
        masumK = iki[0]; hainK = iki[1];
      }
      const sanriK = this.rastgele(KK.SANRILAR);
      const duyulan = {};
      for (const p of [a, b]) {
        duyulan[p.id] = this.hainMi(p) ? hainK : (p.rol === 'halusinatif' && p.lanet === 0 ? sanriK : masumK);
      }
      return { a: a.id, b: b.id, kategori: kat.ad, sayisal: !!kat.sayisal, masumK, hainK, sanriK, duyulan, soylenen: null, sinif: null };
    }

    kategoriIlgili(kelime, k) {
      if (k.sayisal) return /^\d+$/.test(kelime);
      const kat = KK.KATEGORILER.find((c) => c.ad === k.kategori);
      return !!kat && kat.kelimeler.includes(kelime);
    }

    kelimeSinif(w1, w2, k) {
      if (w1 === w2) return 'eslesme';
      return this.kategoriIlgili(w1, k) && this.kategoriIlgili(w2, k) ? 'yakin' : 'alakasiz';
    }

    botKabinKelime(p, k, ortakId) {
      const duydugu = k.duyulan[p.id];
      if (!this.hainMi(p)) return duydugu;
      if (this.hainMi(this.oyuncular[ortakId])) return duydugu; // ekip arkadaşıyla aynı kelimeyi duyarlar
      const r = this.r();
      if (p.beceri < 0.6 && r < 0.4) return duydugu;              // acemi hain kendi kelimesini söyler
      if (r < 0.04 + 0.08 * p.beceri) return this.rastgele(KK.SANRILAR); // halüsinatif taklidi
      if (k.sayisal) {
        const fark = (1 + Math.floor(this.r() * 4)) * (this.r() < 0.5 ? -1 : 1);
        return String(Number(duydugu) + fark);
      }
      const kat = KK.KATEGORILER.find((c) => c.ad === k.kategori);
      return this.rastgele(kat.kelimeler.filter((w) => w !== duydugu));
    }

    kabinSoyle(i, insanKelime) {
      const k = this.aktif().kabinler[i];
      const soylenen = {};
      for (const [id, ortak] of [[k.a, k.b], [k.b, k.a]]) {
        const p = this.oyuncular[id];
        soylenen[id] = this.elle(p) && insanKelime != null && normalize(insanKelime)
          ? normalize(insanKelime) : this.botKabinKelime(p, k, ortak);
      }
      k.soylenen = soylenen;
      k.sinif = this.kelimeSinif(soylenen[k.a], soylenen[k.b], k);
      this.gozlemYay({ tip: 'kabin', a: k.a, b: k.b, sinif: k.sinif });
      this.mesaj(k.a, 'Ben **' + soylenen[k.a] + '** duydum.');
      this.mesaj(k.b, 'Ben **' + soylenen[k.b] + '** duydum.');
      const sonucMetni = { eslesme: 'EŞLEŞTİ', yakin: 'UYUŞMAZLIK (yakın kelimeler)', alakasiz: 'UYUŞMAZLIK (alakasız kelime)' }[k.sinif];
      this.mesaj(null, 'Kabin sonucu: **' + sonucMetni + '**');
      this.kabinTepkileri(k);
      return k;
    }

    konusmacilar(haric, adet) {
      const havuz = this.canlilar().filter((p) => !p.insan && !haric.includes(p.id));
      const agir = (p) => ({ lider: 1.6, agresif: 1.5, analitik: 1.3, sakin: 0.7, saskin: 1 })[p.kisilik] || 1;
      return this.agirlikliSec(havuz, adet, agir);
    }

    kabinTepkileri(k) {
      const ikili = [k.a, k.b];
      for (const [id, ortak] of [[k.a, k.b], [k.b, k.a]]) {
        const p = this.oyuncular[id];
        if (p.insan || this.r() > 0.75) continue;
        const o = this.oyuncular[ortak];
        const kendi = k.soylenen[id];
        if (k.sinif === 'eslesme') this.replik(id, 'kabinEslesmeIcerden', { x: o });
        else if (k.sinif === 'yakin') this.replik(id, 'kabinYakinIcerden', { x: o, k1: kendi });
        else if (p.gorunenRol === 'halusinatif' && KK.SANRILAR.includes(kendi)) this.replik(id, 'kabinKendimAlakasiz', { k1: kendi });
        else this.replik(id, 'kabinAlakasizIcerden', { x: o, k1: kendi });
      }
      for (const s of this.konusmacilar(ikili, 1 + (this.r() < 0.5 ? 1 : 0))) {
        const a = this.oyuncular[k.a], b = this.oyuncular[k.b];
        if (k.sinif === 'eslesme') { this.replik(s.id, 'kabinEslesme', { a, b }); continue; }
        if (k.sinif === 'yakin') {
          let x;
          if (this.hainMi(s)) x = this.hainMi(a) ? b : this.hainMi(b) ? a : (this.halk.hain(a.id) >= this.halk.hain(b.id) ? a : b);
          else x = s.inanc.hain(a.id) >= s.inanc.hain(b.id) ? a : b;
          this.replik(s.id, 'kabinYakin', { x, k1: k.soylenen[a.id], k2: k.soylenen[b.id] });
        } else {
          const x = s.inanc.halusinatif(a.id) >= s.inanc.halusinatif(b.id) ? a : b;
          this.replik(s.id, 'kabinAlakasiz', { x, k2: k.soylenen[x.id] });
        }
      }
    }

    /* ---------- 2. şalter ---------- */
    salterHazirla() {
      this.faz = 'salter';
      const t = this.aktif();
      const canli = this.canlilar();
      const sayi = Math.min(t.olay.id === 'guc_dalgasi' ? 4 : 3, canli.length);
      const kabinde = new Set(t.kabinler.flatMap((k) => [k.a, k.b]));
      const secilen = this.agirlikliSec(canli, sayi, (p) => (kabinde.has(p.id) ? 0.2 : 1) * (1 + Math.min(3, this.tur - p.sonSalter)));
      for (const p of secilen) p.sonSalter = this.tur;
      t.salter = { kisiler: secilen.map((p) => p.id), renk: {}, beyan: {}, yesil: null, bilinen: null };
      this.mesaj(null, 'ŞALTER ODASI: ' + t.salter.kisiler.map((id, i) => (i + 1) + '. @[' + id + ']').join(', ') + ' sırayla odaya giriyor.');
      return t.salter;
    }

    botSalter(p, sabotajVar) {
      if (this.hainMi(p)) {
        const taban = { kolay: 0.45, normal: 0.55, zor: 0.6 }[this.ayar.zorluk] || 0.55;
        let s = sabotajVar ? 0.12 : taban;
        if (this.halk.hain(p.id) > 0.55) s *= 0.45;
        if (this.r() < s) {
          const r = this.r();
          return { renk: 'kirmizi', beyan: r < 0.78 ? 'bastim' : r < 0.93 ? 'zaten' : 'tuhaf' };
        }
        return { renk: 'yesil', beyan: 'bastim' };
      }
      if (p.rol === 'halusinatif' && p.lanet === 1) return { renk: 'kirmizi', beyan: this.r() < 0.74 ? 'zaten' : 'tuhaf' };
      return { renk: 'yesil', beyan: 'bastim' };
    }

    salterUygula(insanSonuc) {
      const t = this.aktif(); const s = t.salter;
      let sabotajVar = false;
      for (const id of s.kisiler) {
        const p = this.oyuncular[id];
        const sonuc = this.elle(p) && insanSonuc ? insanSonuc : this.botSalter(p, sabotajVar);
        s.renk[id] = sonuc.renk; s.beyan[id] = sonuc.beyan;
        if (this.hainMi(p) && sonuc.renk === 'kirmizi') sabotajVar = true;
      }
      s.yesil = s.kisiler.filter((id) => s.renk[id] === 'yesil').length;
      t.kirmizi += s.kisiler.length - s.yesil;
      if (t.olay.id === 'kamera') {
        const id = this.rastgele(s.kisiler);
        s.bilinen = { [id]: s.renk[id] };
      }
      this.gozlemYay({ tip: 'salter', kisiler: s.kisiler, beyanlar: s.kisiler.map((id) => s.beyan[id]), yesil: s.yesil, bilinen: s.bilinen });
      const BEYAN = { bastim: 'Bastım, yeşil yaptım.', zaten: 'Benimki zaten yeşildi, dokunmadım.', tuhaf: 'Bastım ama kırmızıya döndü?!', basmadim: 'Basmadım.' };
      for (const id of s.kisiler) this.mesaj(id, BEYAN[s.beyan[id]]);
      this.mesaj(null, 'ANA PANEL: ' + s.kisiler.length + ' şalterden **' + s.yesil + '** tanesi YEŞİL.');
      if (s.bilinen) {
        const id = Object.keys(s.bilinen)[0];
        this.mesaj(null, 'GÜVENLİK KAMERASI: @[' + id + '] kişisinin şalteri **' + (s.bilinen[id] === 'yesil' ? 'YEŞİL' : 'KIRMIZI') + '**.');
      }
      this.salterTepkileri(s);
      return s;
    }

    salterTepkileri(s) {
      const n = s.kisiler.length;
      const basanlar = s.kisiler.filter((id) => s.beyan[id] === 'bastim');
      if (s.yesil === n) { const k = this.konusmacilar([], 1)[0]; if (k) this.replik(k.id, 'salterTam', {}); return; }
      if (basanlar.length > s.yesil) {
        const iceride = s.kisiler.map((id) => this.oyuncular[id])
          .filter((p) => !p.insan && !this.hainMi(p) && s.renk[p.id] === 'yesil');
        if (iceride.length) {
          const p = this.rastgele(iceride);
          const digerleri = basanlar.filter((id) => id !== p.id).map((id) => this.oyuncular[id]);
          if (digerleri.length === 1) this.replik(p.id, 'salterIcerdenTek', { x: digerleri[0] });
          else if (digerleri.length >= 2) {
            const sirali = digerleri.sort((a, b) => p.inanc.hain(b.id) - p.inanc.hain(a.id));
            this.replik(p.id, 'salterIcerden', { x: sirali[0], y: sirali[1] });
          }
        }
        const k = this.konusmacilar(s.kisiler, 1)[0];
        if (k) this.replik(k.id, 'salterTutarsiz', { s: basanlar.length, g: s.yesil, n });
      } else {
        const k = this.konusmacilar([], 1)[0];
        if (k && this.r() < 0.7) this.replik(k.id, 'salterTutarli', { g: s.yesil, n });
      }
      const zaten = s.kisiler.find((id) => s.beyan[id] === 'zaten');
      const tuhaf = s.kisiler.find((id) => s.beyan[id] === 'tuhaf');
      const garip = zaten != null ? ['salterZaten', zaten] : tuhaf != null ? ['salterTuhaf', tuhaf] : null;
      if (garip) {
        const k = this.konusmacilar([garip[1]], 1)[0];
        if (k) this.replik(k.id, garip[0], { x: this.oyuncular[garip[1]] });
      }
    }

    /* ---------- 3. telefon ---------- */
    telefonVar() { return this.aktif().olay.id !== 'parazit'; }

    telefonSecimi(insanOy) {
      this.faz = 'telefon';
      const t = this.aktif();
      if (!this.telefonVar()) {
        t.telefon = { iptal: true };
        this.mesaj(null, 'TELEFON: Hat cızırdıyor... Radyo paraziti yüzünden bu tur bilgi gelmiyor.');
        return t.telefon;
      }
      const canli = this.canlilar();
      const oylar = {};
      for (const p of canli) {
        const adaylar = canli.filter((q) => q !== p);
        if (this.elle(p) && insanOy != null && adaylar.some((q) => q.id === insanOy)) { oylar[p.id] = insanOy; continue; }
        let hedef;
        if (this.hainMi(p)) {
          const ekip = adaylar.filter((q) => this.hainMi(q) && this.halk.hain(q.id) < 0.5);
          hedef = ekip.length && this.r() < 0.55 + 0.35 * p.beceri
            ? this.rastgele(ekip)
            : this.secEnIyi(adaylar.filter((q) => !this.hainMi(q)), (q) => -this.halk.hain(q.id), p.beceri);
        } else {
          hedef = this.secEnIyi(adaylar, (q) => -this.suphe(p, q), p.beceri);
        }
        if (hedef) oylar[p.id] = hedef.id;
      }
      const sayim = this.say(oylar);
      const enCok = Math.max(...Object.values(sayim));
      const ust = Object.keys(sayim).filter((k) => sayim[k] === enCok).map(Number);
      const arayan = this.rastgele(ust);
      t.telefon = { oylar, sayim, arayan, beraberlik: ust.length > 1, bilgiler: [] };
      this.mesaj(null, 'TELEFON ÇALIYOR! Halk seçti: telefonu @[' + arayan + '] açıyor.' + (ust.length > 1 ? ' (Beraberlik kurayla bozuldu.)' : ''));
      this.telefonBilgiUret();
      return t.telefon;
    }

    say(oylar) {
      const s = {};
      for (const k in oylar) if (oylar[k] != null) s[oylar[k]] = (s[oylar[k]] || 0) + 1;
      return s;
    }

    telefonBilgiUret() {
      const t = this.aktif(); const tel = t.telefon;
      const adet = t.olay.id === 'cift_hat' ? 2 : 1;
      const kabinKisiler = t.kabinler.flatMap((k) => [k.a, k.b]);
      const salterKisiler = t.salter ? t.salter.kisiler : [];
      const kullanilan = new Set();
      for (let i = 0; i < adet; i++) {
        let bilgi = null;
        for (let deneme = 0; deneme < 8 && !bilgi; deneme++) {
          const r = this.r();
          if (r < 0.2 && salterKisiler.length && !kullanilan.has('sayi')) {
            bilgi = { tur: 'sayi', kisiler: salterKisiler.slice() };
            kullanilan.add('sayi');
          } else if (r < 0.4 && t.kabinler.length && !kullanilan.has('cift')) {
            const k = t.kabinler[0];
            bilgi = { tur: 'cift', a: k.a, b: k.b };
            kullanilan.add('cift');
          } else {
            const adaylar = [...new Set([...kabinKisiler, ...salterKisiler])].filter((id) => id !== tel.arayan && !kullanilan.has('b' + id));
            if (!adaylar.length) continue;
            const hedef = this.rastgele(adaylar);
            kullanilan.add('b' + hedef);
            const sira = salterKisiler.indexOf(hedef);
            bilgi = { tur: 'birey', hedef, yer: sira >= 0 ? 'Şalter odasındaki ' + (sira + 1) + '. kişi' : 'Kabine giren' };
          }
        }
        if (!bilgi) continue;
        bilgi.gercek = this.gercekDeger(bilgi);
        tel.bilgiler.push(bilgi);
      }
      return tel.bilgiler;
    }

    gercekDeger(b) {
      const h = (id) => this.hainMi(this.oyuncular[id]);
      if (b.tur === 'birey') return h(b.hedef) ? 'hain' : 'masum';
      if (b.tur === 'sayi') return b.kisiler.filter(h).length;
      return h(b.a) === h(b.b) ? 'ayni' : 'farkli';
    }

    bilgiMetni(b, deger) {
      if (b.tur === 'birey') return b.yer + ' @[' + b.hedef + '] **' + (deger === 'hain' ? 'HAİNDİR' : 'MASUMDUR') + '**.';
      if (b.tur === 'sayi') return 'Şalter odasında **' + deger + '** hain vardı.';
      return 'Kabindeki @[' + b.a + '] ve @[' + b.b + '] **' + (deger === 'ayni' ? 'AYNI' : 'FARKLI') + '** takımdan.';
    }

    secenekler(b) {
      if (b.tur === 'birey') return ['masum', 'hain'];
      if (b.tur === 'cift') return ['ayni', 'farkli'];
      const n = b.kisiler.length; const s = [];
      for (let i = 0; i <= Math.min(n, this.yanciSayisi + 1); i++) s.push(i);
      return s;
    }

    botDuyuru(p, b) {
      if (!this.hainMi(p)) return b.gercek;
      let dag;
      if (b.tur === 'birey') dag = KK.TELEFON_POLITIKA.birey(b.gercek);
      else if (b.tur === 'sayi') dag = KK.TELEFON_POLITIKA.sayi(b.gercek);
      else dag = KK.TELEFON_POLITIKA.cift(b.gercek, [b.a, b.b].filter((id) => this.hainMi(this.oyuncular[id])).length);
      const anahtarlar = Object.keys(dag);
      let r = this.r() * anahtarlar.reduce((s, k) => s + dag[k], 0);
      for (const k of anahtarlar) {
        r -= dag[k];
        if (r <= 0) return b.tur === 'sayi' ? Number(k) : k;
      }
      return b.gercek;
    }

    telefonDuyur(insanDuyurular) {
      const t = this.aktif(); const tel = t.telefon;
      if (!tel || tel.iptal) return tel;
      const p = this.oyuncular[tel.arayan];
      tel.bilgiler.forEach((b, i) => {
        p.inanc.gozlem({ tip: 'gercek', bilgi: Object.assign({}, b, { deger: b.gercek }) });
        const elden = this.elle(p) && insanDuyurular && insanDuyurular[i] != null;
        b.duyuru = elden ? insanDuyurular[i] : this.botDuyuru(p, b);
        if (b.tur === 'sayi') b.duyuru = Number(b.duyuru);
        b.yalan = b.duyuru !== b.gercek;
        this.gozlemYay({ tip: 'telefon', arayan: p.id, bilgi: Object.assign({}, b, { deger: b.duyuru }) });
        this.mesaj(p.id, 'Telefondaki ses dedi ki: ' + this.bilgiMetni(b, b.duyuru));
      });
      this.telefonTepkileri(tel);
      return tel;
    }

    telefonTepkileri(tel) {
      const c = this.oyuncular[tel.arayan];
      for (const b of tel.bilgiler) {
        if (b.tur === 'birey') {
          const h = this.oyuncular[b.hedef];
          if (h.durum === 'canli' && !h.insan) {
            if (b.duyuru === 'hain') this.replik(h.id, this.hainMi(h) ? 'telefonInkar' : 'telefonYalanTepki', { c });
            else if (this.r() < 0.6) this.replik(h.id, 'telefonTesekkur', {});
          }
          const s = this.konusmacilar([h.id, c.id], 1)[0];
          if (s) {
            const guvensiz = this.hainMi(s) ? (this.hainMi(h) && b.duyuru === 'hain') : s.inanc.hain(c.id) > 0.5;
            if (guvensiz) this.replik(s.id, 'telefonSuphe', { c });
            else if (b.duyuru === 'hain' && !(this.hainMi(s) && this.hainMi(h))) this.replik(s.id, 'telefonInanc', { x: h });
          }
        } else {
          const s = this.konusmacilar([c.id], 1)[0];
          if (s && !this.hainMi(s) && s.inanc.hain(c.id) > 0.45) this.replik(s.id, 'telefonSuphe', { c });
        }
      }
    }

    /* ---------- 4. kaptan ---------- */
    // Botun gözünden şüphe: çıkarım + kişisel önyargı.
    suphe(p, q) { return Math.max(0, Math.min(1, p.inanc.hain(q.id) + (p.onyargi ? p.onyargi[q.id] : 0))); }

    enSupheli(p, model) {
      const adaylar = this.canlilar().filter((q) => q !== p);
      let en = null; let ep = -1;
      for (const q of adaylar) { const v = model ? model.hain(q.id) : this.suphe(p, q); if (v > ep) { ep = v; en = q; } }
      return { kisi: en, p: ep };
    }

    kaptanTartisma() {
      this.faz = 'kaptan';
      const konusanlar = this.konusmacilar([], Math.min(4, this.canlilar().length - 1));
      for (const p of konusanlar) {
        if (this.r() < 0.12 && p.kisilik === 'saskin') { this.replik(p.id, 'saskinAra', {}); continue; }
        if (this.hainMi(p)) {
          const top = this.enSupheli(p, this.halk);
          if (top.kisi && this.hainMi(top.kisi) && top.kisi !== p && top.p > 0.4) this.replik(p.id, 'kaptanSavun', { x: top.kisi });
          else {
            const masumlar = this.canlilar().filter((q) => !this.hainMi(q));
            const x = this.secEnIyi(masumlar, (q) => this.halk.hain(q.id), p.beceri);
            const v = x ? this.halk.hain(x.id) : 0;
            if (x && v > 0.45) this.replik(p.id, 'kaptanOyla', { x });
            else if (x && v > 0.3) this.replik(p.id, 'kaptanSuphe', { x });
            else this.replik(p.id, 'kaptanPas', {});
          }
        } else {
          const top = this.enSupheli(p);
          if (top.kisi && top.p > 0.62) this.replik(p.id, 'kaptanOyla', { x: top.kisi });
          else if (top.kisi && top.p > 0.4) this.replik(p.id, 'kaptanSuphe', { x: top.kisi });
          else this.replik(p.id, 'kaptanPas', {});
        }
      }
    }

    kaptan() { return this.oyuncular.find((p) => p.rol === 'kaptan'); }

    botKaptanKarari(p) {
      const top = this.enSupheli(p);
      if (top.p >= 0.68) return 'oylama';
      if (!this.kaptanYetki && top.p >= 0.5 && this.tur >= 2) return 'oylama';
      if (!this.kaptanYetki && this.o2 <= 40 && top.p >= 0.35) return 'oylama';
      return 'pas';
    }

    kaptanKarar(insanKarar) {
      const t = this.aktif();
      const kap = this.kaptan();
      let karar, veren, zorunlu = false, halkOylari = null;
      if (t.olay.id === 'kizil_alarm') { karar = 'oylama'; veren = 'alarm'; zorunlu = true; }
      else if (kap.durum === 'canli') {
        veren = 'kaptan';
        karar = this.elle(kap) && insanKarar ? insanKarar : this.botKaptanKarari(kap);
      } else {
        veren = 'halk'; halkOylari = {};
        for (const p of this.canlilar()) {
          if (this.elle(p) && insanKarar) { halkOylari[p.id] = insanKarar; continue; }
          if (this.hainMi(p)) halkOylari[p.id] = this.oyuncular.some((q) => q.rol === 'suikastci' && q.durum === 'canli') && this.halk.hain(p.id) < 0.45 ? 'oylama' : 'pas';
          else halkOylari[p.id] = this.enSupheli(p).p >= 0.55 ? 'oylama' : 'pas';
        }
        const evet = Object.values(halkOylari).filter((v) => v === 'oylama').length;
        karar = evet * 2 > Object.keys(halkOylari).length ? 'oylama' : 'pas';
      }
      const yetkiKazandi = karar === 'oylama' && veren === 'kaptan' && !this.kaptanYetki;
      if (karar === 'oylama' && veren === 'kaptan') { this.kaptanYetki = true; this.kaptanOylamaSayisi++; }
      t.kaptan = { karar, veren, zorunlu, halkOylari, yetkiKazandi };
      if (veren === 'alarm') this.mesaj(null, 'KIZIL ALARM! Oylama zorunlu. Sandık kuruluyor.');
      else if (veren === 'halk') this.mesaj(null, 'Kaptan hayatta değil. Halk karar verdi: **' + (karar === 'oylama' ? 'OYLAMA' : 'PAS') + '**.');
      else this.mesaj(null, 'GİZLİ KAPTAN KARARINI VERDİ: **' + (karar === 'oylama' ? 'OYLAMA BAŞLAT' : 'PAS GEÇİYORUM') + '**.');
      return t.kaptan;
    }

    /* ---------- oylama ---------- */
    oylamaYap(insanOy) {
      this.faz = 'oylama';
      const t = this.aktif();
      const canli = this.canlilar();
      const oylar = {};
      const tazeSuclama = (id) => this.suclamalar.filter((s) => s.tur === this.tur && s.hedef === id).length;
      for (const p of canli) {
        const adaylar = canli.filter((q) => q !== p);
        if (this.elle(p) && insanOy !== undefined) { oylar[p.id] = insanOy; continue; }
        if (this.hainMi(p)) {
          const masumlar = adaylar.filter((q) => !this.hainMi(q));
          const x = this.secEnIyi(masumlar, (q) => this.halk.hain(q.id) + 0.03 * tazeSuclama(q.id), p.beceri);
          oylar[p.id] = x ? x.id : null;
        } else {
          const x = this.secEnIyi(adaylar, (q) => this.suphe(p, q) + 0.02 * tazeSuclama(q.id), p.beceri);
          // Emin olmayan masum çekimser kalır; beraberlikte kimse atılmaz.
          oylar[p.id] = x && (this.suphe(p, x) >= 0.32 || this.r() < 0.2) ? x.id : null;
        }
      }
      const sayim = this.say(oylar);
      const degerler = Object.values(sayim);
      const enCok = degerler.length ? Math.max(...degerler) : 0;
      const ust = Object.keys(sayim).filter((k) => sayim[k] === enCok).map(Number);
      const atilan = enCok > 0 && ust.length === 1 ? ust[0] : null;
      t.oylama = { oylar, sayim, atilan, beraberlik: ust.length > 1 };
      if (atilan == null) {
        this.mesaj(null, ust.length > 1 ? 'OYLAMA: Beraberlik! Kimse atılmadı.' : 'OYLAMA: Kimse oy almadı.');
      } else {
        const p = this.oyuncular[atilan];
        p.durum = 'atildi';
        p.cikisTur = this.tur;
        let ek = '';
        if (this.ayar.kimlik === 'takim') {
          this.gozlemYay({ tip: 'kimlik', kisi: atilan, takim: this.takim(p) });
          ek = ' Kimlik taraması: **' + (this.hainMi(p) ? 'HAİN' : 'MASUM') + '**.';
        } else if (this.ayar.kimlik === 'rol') {
          this.gozlemYay({ tip: 'kimlik', kisi: atilan, takim: this.takim(p), rol: p.rol });
          ek = ' Kimlik taraması: **' + KK.ROLLER[p.rol].ad.toLocaleUpperCase('tr-TR') + '**.';
        }
        this.mesaj(null, 'OYLAMA: @[' + atilan + '] ' + enCok + ' oyla hava kilidinden atıldı.' + ek);
      }
      return t.oylama;
    }

    /* ---------- gece ---------- */
    geceVar() { const t = this.aktif(); return !!(t.kaptan && t.kaptan.karar === 'oylama'); }

    geceYap(insanHedef, insanKoruma) {
      this.faz = 'gece';
      const t = this.aktif();
      if (!this.geceVar()) return null;
      const maske = this.canliMaske();
      const g = { tip: null, hedef: null, korunan: null, olen: null };
      t.gece = g;
      if (t.olay.id === 'karantina') {
        g.tip = 'karantina';
        this.mesaj(null, 'SABAH: Karantina kapıları gece boyu kilitliydi. Kimse ölmedi.');
        return g;
      }
      const suik = this.oyuncular.find((p) => p.rol === 'suikastci' && p.durum === 'canli');
      const medik = this.oyuncular.find((p) => p.rol === 'medik' && p.durum === 'canli');
      if (medik) {
        const adaylar = this.canlilar().filter((q) => q !== medik && q.id !== this.sonKorunan);
        let k = null;
        if (this.elle(medik) && insanKoruma != null && adaylar.some((q) => q.id === insanKoruma)) k = insanKoruma;
        else { const x = this.secEnIyi(adaylar, (q) => -medik.inanc.hain(q.id), medik.beceri); k = x ? x.id : null; }
        g.korunan = k; this.sonKorunan = k;
      }
      if (!suik) {
        g.tip = 'sessiz';
        this.gozlemYay({ tip: 'sessizGece', canlilar: maske });
        this.mesaj(null, 'SABAH: Gece sessiz geçti. Kimse saldırıya uğramadı.');
        const s = this.konusmacilar([], 1)[0]; if (s) this.replik(s.id, 'sabahSessiz', {});
        return g;
      }
      const hedefler = this.canlilar().filter((q) => !this.hainMi(q));
      let hedef = null;
      if (this.elle(suik) && insanHedef != null && hedefler.some((q) => q.id === insanHedef)) hedef = insanHedef;
      else {
        // Hedef: halkın en güvendiği (kapsül adayı) ve hainleri en çok suçlayan masum.
        const suclayan = (id) => this.suclamalar.filter((s) => s.kim === id && this.hainMi(this.oyuncular[s.hedef])).length;
        const x = this.secEnIyi(hedefler, (q) => 0.6 * (1 - this.halk.hain(q.id)) + 0.2 * Math.min(3, suclayan(q.id)) + 0.15 * this.r(), suik.beceri);
        hedef = x ? x.id : null;
      }
      g.hedef = hedef;
      if (hedef == null) { g.tip = 'sessiz'; return g; }
      if (hedef === g.korunan) {
        g.tip = 'kurtarma';
        this.gozlemYay({ tip: 'kurtarma', canlilar: maske });
        this.mesaj(null, 'SABAH: Gece bir saldırı oldu ama **Medik** kurbanı kurtardı! Suikastçı hâlâ aramızda.');
        const s = this.konusmacilar([], 1)[0]; if (s) this.replik(s.id, 'sabahKurtarma', {});
        return g;
      }
      const o = this.oyuncular[hedef];
      o.durum = 'oldu'; o.cikisTur = this.tur;
      g.tip = 'olum'; g.olen = hedef;
      this.gozlemYay({ tip: 'olum', kisi: hedef, canlilar: maske });
      this.gozlemYay({ tip: 'kimlik', kisi: hedef, takim: 'masum', rol: o.rol });
      this.mesaj(null, 'SABAH: @[' + hedef + '] ölü bulundu. Kimliği: **' + KK.ROLLER[o.rol].ad.toLocaleUpperCase('tr-TR') + '**.');
      const s = this.konusmacilar([], 1)[0]; if (s) this.replik(s.id, 'sabahOlum', { x: o });
      return g;
    }

    /* ---------- tur sonu ---------- */
    turBitir() {
      const t = this.aktif();
      let dusus = O2_TABAN + O2_KIRMIZI * t.kirmizi;
      if (t.olay.id === 'sizinti') dusus += O2_OLAY;
      if (t.olay.id === 'yedek_tup') dusus -= O2_OLAY;
      this.o2 = Math.max(0, this.o2 - dusus);
      t.o2Sonra = this.o2;
      t.o2Dusus = dusus;
      this.mesaj(null, 'TUR SONU: Oksijen %' + t.o2Once + ' → %' + this.o2 + (t.kirmizi ? ' (' + t.kirmizi + ' kırmızı şalter oksijeni hızlandırdı)' : '') + '.');
      this.durumKontrol();
      return t;
    }

    durumKontrol() {
      const canli = this.canlilar();
      const hain = canli.filter((p) => this.hainMi(p)).length;
      const masum = canli.length - hain;
      if (hain === 0) return this.bitir('masum', 'temizlik');
      if (masum < 3) return this.bitir('hain', 'azinlik');
      if (this.o2 <= 0) { this.finalBekliyor = true; this.finalNedeni = 'oksijen'; }
      else if (canli.length <= 4) { this.finalBekliyor = true; this.finalNedeni = 'kalabalik'; }
      return null;
    }

    bitir(kazanan, neden, koltuklar) {
      this.bitti = true;
      this.faz = 'bitti';
      this.sonuc = { kazanan, neden, koltuklar: koltuklar || null };
      const NEDEN = {
        temizlik: 'Bütün hainler etkisiz hale getirildi. Kapsül temiz kalkıyor!',
        azinlik: 'Kapsüle binecek 3 temiz kişi kalmadı. Hainler istasyonu ele geçirdi.',
        final: kazanan === 'masum' ? 'Kapsüldeki 3 kişi de temiz. Kapsül yörüngeye ulaştı!' : 'Kapsülde hain vardı. Kalkışta infilak!'
      };
      this.mesaj(null, (kazanan === 'masum' ? 'MÜRETTEBAT KAZANDI. ' : 'HAİNLER KAZANDI. ') + NEDEN[neden]);
      return this.sonuc;
    }

    /* ---------- final ---------- */
    finalHazirla() {
      this.faz = 'final';
      const kap = this.kaptan();
      const canli = this.canlilar();
      this.final = { koltuklar: [], kaptan: kap.id, kaptanCanli: kap.durum === 'canli', yetki: this.kaptanYetki && kap.durum === 'canli', oylar: null, sayim: null };
      this.mesaj(null, 'FIRLATMA ANI! Hayatta kalan ' + canli.length + ' kişi masaya toplandı.');
      if (kap.durum === 'canli') {
        this.gozlemYay({ tip: 'kaptanAcik', kisi: kap.id });
        this.mesaj(null, 'Gizli Kaptan kimliğini açıkladı: @[' + kap.id + ']. ' + (this.final.yetki
          ? 'Oylama riskini aldığı için 1. koltuğu kendisi seçecek.'
          : 'Hiç oylama başlatmadığı için söz hakkı yok. 3 koltuğu da halk seçecek.'));
      } else {
        this.mesaj(null, 'Gizli Kaptan hayatta değil. 3 koltuğu da halk seçecek.');
      }
      if (canli.length <= 3) {
        this.final.koltuklar = canli.map((p) => p.id);
        this.mesaj(null, 'Hayatta kalan herkes kapsüle biniyor.');
      }
      return this.final;
    }

    finalKaptanSecim(insanSecim) {
      const f = this.final;
      if (!f.yetki || f.koltuklar.length) return null;
      const kap = this.kaptan();
      let secim;
      if (this.elle(kap) && insanSecim != null && this.oyuncular[insanSecim].durum === 'canli') secim = insanSecim;
      else secim = this.r() < 0.9 ? kap.id : this.secEnIyi(this.canlilar(), (q) => -kap.inanc.hain(q.id), kap.beceri).id;
      f.koltuklar.push(secim);
      f.kaptanSecimi = secim;
      this.mesaj(kap.id, secim === kap.id ? '1. koltuğa kendimi alıyorum. Temiz olduğumu biliyorum.' : '1. koltuğa @[' + secim + '] oturacak.');
      return secim;
    }

    finalOylama(insanSecimler) {
      const f = this.final;
      const bos = 3 - f.koltuklar.length;
      if (bos <= 0) return f;
      const canli = this.canlilar();
      const adaylar = canli.filter((p) => !f.koltuklar.includes(p.id));
      if (adaylar.length <= bos) { f.koltuklar.push(...adaylar.map((p) => p.id)); return f; }
      const oylar = {};
      for (const p of canli) {
        const secenek = adaylar.filter((q) => q !== p);
        if (this.elle(p) && Array.isArray(insanSecimler)) {
          oylar[p.id] = insanSecimler.filter((id) => secenek.some((q) => q.id === id)).slice(0, bos);
          continue;
        }
        let siralama;
        if (this.hainMi(p)) {
          const ekip = secenek.filter((q) => this.hainMi(q));
          const masum = secenek.filter((q) => !this.hainMi(q)).sort((a, b) => this.halk.hain(b.id) - this.halk.hain(a.id));
          siralama = ekip.concat(masum);
        } else {
          siralama = secenek.slice().sort((a, b) => this.suphe(p, a) - this.suphe(p, b));
          if (this.r() > p.beceri && siralama.length > bos) { const i = Math.floor(this.r() * bos); const j = bos + Math.floor(this.r() * (siralama.length - bos)); [siralama[i], siralama[j]] = [siralama[j], siralama[i]]; }
        }
        oylar[p.id] = siralama.slice(0, bos).map((q) => q.id);
      }
      const sayim = {};
      for (const k in oylar) for (const id of oylar[k]) sayim[id] = (sayim[id] || 0) + 1;
      const kura = {}; for (const p of adaylar) kura[p.id] = this.r();
      const sirali = adaylar.map((p) => p.id).sort((a, b) => ((sayim[b] || 0) - (sayim[a] || 0)) || (kura[b] - kura[a]));
      f.oylar = oylar; f.sayim = sayim;
      f.koltuklar.push(...sirali.slice(0, bos));
      return f;
    }

    finalSonuc() {
      const f = this.final;
      const hainler = f.koltuklar.filter((id) => this.hainMi(this.oyuncular[id]));
      f.icerdekiHainler = hainler;
      this.mesaj(null, 'KAPSÜL KOLTUKLARI: ' + f.koltuklar.map((id) => '@[' + id + ']').join(', ') + '. Fırlatma başlıyor...');
      return this.bitir(hainler.length ? 'hain' : 'masum', 'final', f.koltuklar.slice());
    }

    /* ---------- oyuncu sözleri ---------- */
    insanSoz(tip, hedefId) {
      const ben = this.insan();
      if (ben.durum !== 'canli') return [];
      const once = this.sohbet.length;
      const h = hedefId != null ? this.oyuncular[hedefId] : null;
      if (tip === 'sucla' && h) {
        this.mesaj(ben.id, 'Bence @[' + h.id + '] şüpheli. Ona dikkat edin.');
        this.suclamalar.push({ kim: ben.id, hedef: h.id, tur: this.tur });
        if (h.durum === 'canli' && !h.insan) this.replik(h.id, 'savunma', { x: ben });
        const s = this.konusmacilar([h.id], 1)[0];
        if (s) {
          const v = this.hainMi(s) ? (this.hainMi(h) ? 0 : 0.6) : s.inanc.hain(h.id);
          if (v > 0.42) this.replik(s.id, 'katil', { x: h });
          else if (v < 0.22) this.replik(s.id, 'reddet', { x: h });
        }
      } else if (tip === 'savun' && h) {
        this.mesaj(ben.id, 'Bence @[' + h.id + '] temiz. Yanlış kişiye yüklenmeyelim.');
        if (h.durum === 'canli' && !h.insan) this.replik(h.id, 'tesekkurSavunma', {});
        const s = this.konusmacilar([h.id], 1)[0];
        if (s && !this.hainMi(s) && s.inanc.hain(h.id) > 0.5) this.replik(s.id, 'kaptanSuphe', { x: h });
      } else if (tip === 'masumum') {
        this.mesaj(ben.id, 'Ben masumum, kayda bakın. Söylediklerim tutarlı.');
        const s = this.konusmacilar([], 1)[0];
        if (s) {
          const v = this.hainMi(s) ? 0.3 : s.inanc.hain(ben.id);
          this.replik(s.id, v < 0.3 ? 'insanaGuven' : 'kaptanSuphe', { x: ben });
        }
      }
      return this.sohbet.slice(once);
    }

    /* ---------- otomatik tur (hayalet modu ve testler) ---------- */
    turuOynat(insan) {
      insan = insan || {};
      this.turBaslat();
      const kabinler = this.kabinHazirla();
      kabinler.forEach((_, i) => this.kabinSoyle(i, insan.kelime));
      this.salterHazirla();
      this.salterUygula(insan.salter);
      this.telefonSecimi(insan.telefonOy);
      this.telefonDuyur(insan.duyurular);
      this.kaptanTartisma();
      const k = this.kaptanKarar(insan.kaptan);
      if (k.karar === 'oylama') { this.oylamaYap(insan.oy); this.geceYap(insan.hedef, insan.koruma); }
      return this.turBitir();
    }

    tamOyun() {
      let guvenlik = 0;
      while (!this.bitti && !this.finalBekliyor && guvenlik++ < 40) this.turuOynat();
      if (!this.bitti && this.finalBekliyor) {
        this.finalHazirla();
        this.finalKaptanSecim();
        this.finalOylama();
        this.finalSonuc();
      }
      return this.sonuc;
    }
  }

  KK.Oyun = Oyun;
  KK.O2 = { TABAN: O2_TABAN, KIRMIZI: O2_KIRMIZI, OLAY: O2_OLAY };
})(typeof window !== 'undefined' ? window : globalThis);
