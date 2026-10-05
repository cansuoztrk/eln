/* Kızıl Kapsül — Kurucu Paneli: oyunu Habbo'da yöneten kişi için tur tur yardımcı. */
(function (kok) {
  'use strict';
  const KK = kok.KK;
  const ANAHTAR = 'kk-kurucu';
  const $ = (s, k) => (k || document).querySelector(s);
  const $$ = (s, k) => Array.from((k || document).querySelectorAll(s));
  function kac(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const rastgele = (d) => d[Math.floor(Math.random() * d.length)];
  function karistir(d) { const a = d.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  let G = null;
  let sayac = { kalan: 60, toplam: 60, calisiyor: false, id: null };

  function yeniDurum() {
    return {
      adim: 'kadro', ham: '', oyuncular: [],
      ayar: { yanci: 'oto', medik: false, lanet: 'rastgele', halBilir: false, olaylar: true, o2: true, kimlik: 'gizli', sablon: '{mesaj}' },
      tur: 0, o2: 100, kaptanYetki: false, turlar: [], final: null, sonuc: null, gizle: true, sonKategoriler: []
    };
  }
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(G)); } catch (e) { /* depolama yok */ } }
  function yukle() {
    try { const v = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); if (v && v.ayar) return v; } catch (e) { /* bozuk kayıt */ }
    return null;
  }

  /* ---------- yardımcılar ---------- */
  const ad = (id) => G.oyuncular[id].ad;
  const hain = (p) => KK.HAIN_ROLLER.includes(p.rol);
  const canlilar = () => G.oyuncular.filter((p) => p.durum === 'canli');
  const aktifTur = () => G.turlar[G.turlar.length - 1];
  function fisilti(isim, mesaj) {
    return (G.ayar.sablon || '{mesaj}').replace('{isim}', isim).replace('{mesaj}', mesaj);
  }
  function kopyaKutu(metin, opt) {
    opt = opt || {};
    const uzun = metin.length > 100;
    return '<div class="kopya' + (opt.fisilti ? ' fisilti-kutu' : '') + '"><code>' + kac(metin) + '</code><span class="kopya-sag"><small class="' + (uzun ? 'uzun' : '') + '" title="Habbo sohbet sınırı yaklaşık 100 karakter">' + metin.length + '</small>' +
      '<button type="button" class="dugme ince" data-kopya="' + kac(metin) + '">Kopyala</button></span></div>';
  }
  function duyuru(sablon, d) { return sablon.replace(/\{(\w+)\}/g, (_, k) => (d[k] != null ? d[k] : '')); }

  function rolFisiltisi(p) {
    const ekip = G.oyuncular.filter((q) => hain(q) && q !== p);
    const suik = G.oyuncular.find((q) => q.rol === 'suikastci');
    switch (p.rol) {
      case 'suikastci': return 'Rolün: SUİKASTÇI. Yancın: ' + (ekip.map((q) => q.ad).join(', ') || '-') + '. Oylama olan gece 1 masumu öldürebilirsin.';
      case 'yanci': return 'Rolün: YANCI. Suikastçı: ' + (suik ? suik.ad : '-') + (ekip.length > 1 ? ' (+' + ekip.filter((q) => q !== suik).map((q) => q.ad).join(', ') + ')' : '') + '. Onu koru, görevleri boz.';
      case 'halusinatif': return G.ayar.halBilir ? 'Rolün: HALÜSİNATİF. Masumsun ama algıların bozuk. Lanetin gizli.' : 'Rolün: MÜRETTEBAT. Yalancıları bul, kapsüle sadece temizleri bindir.';
      case 'kaptan': return 'Rolün: GİZLİ KAPTAN. Her tur PAS ya da OYLAMA kararını bana fısılda. 1 oylama = final yetkisi.';
      case 'medik': return 'Rolün: MEDİK. Oylama gecelerinde koruyacağın kişiyi bana fısılda.';
      default: return 'Rolün: MÜRETTEBAT. Yalancıları bul, kapsüle sadece temizleri bindir.';
    }
  }
  function rolAdi(p) {
    const r = KK.ROLLER[p.rol].ad;
    return p.rol === 'halusinatif' ? r + ' (' + (p.lanet ? 'Şalter' : 'Kabin') + ' laneti)' : r;
  }
  function maske(icerik) { return G.gizle ? '<span class="maske" title="Rolleri göster ayarını aç">●●●●●</span>' : icerik; }

  /* ---------- çizim ---------- */
  function ciz() {
    if (!G) G = yukle() || yeniDurum();
    const kok2 = $('#kurucu-icerik');
    $$('.kurucu-adimlar button').forEach((b) => {
      b.setAttribute('aria-current', b.dataset.adim === G.adim ? 'step' : 'false');
      b.disabled = (b.dataset.adim !== 'kadro' && !G.oyuncular.length) || (b.dataset.adim === 'final' && !G.tur);
    });
    $('#kurucu-o2').textContent = G.ayar.o2 ? '%' + G.o2 : 'kapalı';
    $('#kurucu-o2-dolu').style.width = (G.ayar.o2 ? G.o2 : 100) + '%';
    $('#kurucu-gizle').checked = !G.gizle;
    kok2.innerHTML = ({ kadro: kadroHtml, roller: rollerHtml, tur: turHtml, final: finalHtml })[G.adim]();
    kaydet();
  }

  function kadroHtml() {
    const a = G.ayar;
    const isimler = isimAyikla(G.ham);
    const n = isimler.length;
    const yanci = a.yanci === 'oto' ? (n >= 10 ? 2 : 1) : Number(a.yanci);
    const hata = n && (n < 6 ? 'En az 6 oyuncu gerekir.' : n > 16 ? 'En fazla 16 oyuncu.' : new Set(isimler.map(KK.normalize)).size !== n ? 'Aynı isim iki kez yazılmış.' : '');
    return '<div class="kurucu-iki">' +
      '<section class="k-kart"><h3>Kadro</h3><label for="k-isimler">Habbo adları <small>(her satıra bir isim ya da virgülle)</small></label>' +
      '<textarea id="k-isimler" rows="10" placeholder="Pırıl.Kaptan&#10;-Lale-&#10;xX.Deniz.Xx&#10;MertBey&#10;...">' + kac(G.ham) + '</textarea>' +
      '<p class="k-not" id="k-sayi">' + (n ? n + ' oyuncu' : 'Henüz isim yok') + (hata ? ' · <b class="hata">' + hata + '</b>' : '') + '</p></section>' +
      '<section class="k-kart"><h3>Kurallar</h3><div class="k-form">' +
      secimAlani('k-yanci', 'Yancı sayısı', [['oto', 'Otomatik (' + yanci + ')'], ['1', '1'], ['2', '2'], ['3', '3']], String(a.yanci)) +
      secimAlani('k-lanet', 'Halüsinatif laneti', [['rastgele', 'Rastgele'], ['kabin', 'Kabin laneti'], ['salter', 'Şalter laneti']], a.lanet) +
      secimAlani('k-kimlik', 'Atılanın kimliği', [['gizli', 'Gizli kalsın'], ['takim', 'Takımı açıklansın'], ['rol', 'Rolü açıklansın']], a.kimlik) +
      anahtarAlani('k-halbilir', 'Halüsinatif rolünü bilsin', a.halBilir, 'Kapalıyken kendini Mürettebat sanır. Şalter laneti ancak böyle işe yarar.') +
      anahtarAlani('k-olaylar', 'İstasyon olayları', a.olaylar, 'Her tur başında bir olay kartı çekilir.') +
      anahtarAlani('k-o2', 'Oksijen saati', a.o2, 'Her tur %' + KK.O2.TABAN + ', her kırmızı şalter %' + KK.O2.KIRMIZI + ' daha düşer. %0 olunca final.') +
      anahtarAlani('k-medik', 'Medik rolü (genişleme)', a.medik, 'Oylama gecelerinde bir kişiyi korur.') +
      '<label for="k-sablon">Fısıltı şablonu <small>{isim} ve {mesaj} yer tutucuları</small></label><input id="k-sablon" value="' + kac(a.sablon) + '" spellcheck="false">' +
      '</div></section></div>' +
      '<div class="k-eylem"><button type="button" class="dugme birincil" id="k-dagit"' + (!n || hata ? ' disabled' : '') + '>Rolleri dağıt</button>' +
      (G.oyuncular.length ? '<span class="k-not">Yeniden dağıtmak mevcut oyunu sıfırlar.</span>' : '') + '</div>';
  }

  function secimAlani(id, etiket, secenek, deger) {
    return '<label for="' + id + '">' + etiket + '</label><select id="' + id + '">' + secenek.map(([v, t]) => '<option value="' + v + '"' + (v === deger ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>';
  }
  function anahtarAlani(id, etiket, deger, not) {
    return '<label class="anahtar" for="' + id + '"><input type="checkbox" id="' + id + '"' + (deger ? ' checked' : '') + '><span class="anahtar-ray" aria-hidden="true"></span><span>' + etiket + '<small>' + not + '</small></span></label>';
  }

  function isimAyikla(ham) {
    return String(ham || '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 20);
  }

  function rolleriDagit() {
    const isimler = isimAyikla(G.ham);
    const n = isimler.length;
    const yanci = G.ayar.yanci === 'oto' ? (n >= 10 ? 2 : 1) : Number(G.ayar.yanci);
    const roller = ['suikastci'];
    for (let i = 0; i < yanci; i++) roller.push('yanci');
    roller.push('halusinatif', 'kaptan');
    if (G.ayar.medik) roller.push('medik');
    while (roller.length < n) roller.push('murettebat');
    const dagitim = karistir(roller).slice(0, n);
    G.oyuncular = isimler.map((isim, id) => ({
      id, ad: isim, rol: dagitim[id], durum: 'canli',
      lanet: dagitim[id] === 'halusinatif' ? (G.ayar.lanet === 'kabin' ? 0 : G.ayar.lanet === 'salter' ? 1 : (Math.random() < 0.5 ? 0 : 1)) : null
    }));
    G.tur = 0; G.o2 = 100; G.kaptanYetki = false; G.turlar = []; G.final = null; G.sonuc = null; G.sonKategoriler = [];
    G.adim = 'roller';
    ciz();
  }

  function rollerHtml() {
    const say = {};
    G.oyuncular.forEach((p) => { say[p.rol] = (say[p.rol] || 0) + 1; });
    return '<section class="k-kart"><h3>Roller ve fısıltılar</h3><p class="k-not">Her oyuncuya kendi satırındaki metni fısılda. Ekranı yayınlıyorsan rolleri gizli tut.</p>' +
      '<p class="k-dagilim">' + Object.keys(say).map((r) => '<span class="rol-cip t-' + KK.ROLLER[r].takim + '">' + KK.ROLLER[r].ad + ' × ' + say[r] + '</span>').join(' ') + '</p>' +
      '<div class="tablo-kutu"><table class="k-tablo"><thead><tr><th>#</th><th>Habbo adı</th><th>Rol</th><th>Fısıltı</th></tr></thead><tbody>' +
      G.oyuncular.map((p) => '<tr><td class="sayi">' + (p.id + 1) + '</td><td>' + kac(p.ad) + '</td><td>' + maske('<span class="rol-cip t-' + KK.ROLLER[p.rol].takim + '">' + kac(rolAdi(p)) + '</span>') + '</td><td>' +
        (G.gizle ? '<button type="button" class="dugme ince" data-kopya="' + kac(fisilti(p.ad, rolFisiltisi(p))) + '">Fısıltıyı kopyala</button>' : kopyaKutu(fisilti(p.ad, rolFisiltisi(p)), { fisilti: true })) + '</td></tr>').join('') +
      '</tbody></table></div></section>' +
      '<section class="k-kart"><h3>Açılış duyurusu</h3>' + KK.DUYURU.baslangic.map((d) => kopyaKutu(d)).join('') + '</section>' +
      '<div class="k-eylem"><button type="button" class="dugme birincil" id="k-tur-baslat">' + (G.tur ? 'Turlara dön' : 'Tur 1\'i başlat') + '</button></div>';
  }

  /* ---------- tur ---------- */
  function turBaslat() {
    G.tur++;
    G.turlar.push({ no: G.tur, olay: null, kabinler: [], salter: null, telefon: null, karar: null, atilan: undefined, gece: null, o2Once: G.o2, bitti: false });
    G.adim = 'tur';
    ciz();
  }

  function olayCek(t) {
    const havuz = KK.OLAYLAR.filter((o) => !G.turlar.some((x) => x !== t && x.no === t.no - 1 && x.olay === o.id) || o.id === 'sakin');
    const top = havuz.reduce((s, o) => s + o.agirlik, 0);
    let r = Math.random() * top;
    for (const o of havuz) { r -= o.agirlik; if (r <= 0) return o.id; }
    return 'sakin';
  }
  const olayBul = (id) => KK.OLAYLAR.find((o) => o.id === id) || KK.OLAYLAR[0];

  function kelimeUret() {
    const adaylar = KK.KATEGORILER.filter((k) => !G.sonKategoriler.includes(k.ad));
    const kat = rastgele(adaylar.length ? adaylar : KK.KATEGORILER);
    G.sonKategoriler.push(kat.ad); if (G.sonKategoriler.length > 4) G.sonKategoriler.shift();
    let masum, h;
    if (kat.sayisal) { const n = 12 + Math.floor(Math.random() * 80); masum = String(n); h = String(n + (1 + Math.floor(Math.random() * 4)) * (Math.random() < 0.5 ? -1 : 1)); }
    else { const iki = karistir(kat.kelimeler).slice(0, 2); masum = iki[0]; h = iki[1]; }
    return { kat: kat.ad, sayisal: !!kat.sayisal, masum, hain: h, sanri: rastgele(KK.SANRILAR) };
  }
  function duydugu(p, k) { return hain(p) ? k.hain : (p.rol === 'halusinatif' && p.lanet === 0 ? k.sanri : k.masum); }
  function kabinSinif(k) {
    const a = KK.normalize(k.soylenen[k.a] || ''), b = KK.normalize(k.soylenen[k.b] || '');
    if (!a || !b) return null;
    if (a === b) return 'eslesme';
    const kat = KK.KATEGORILER.find((c) => c.ad === k.kat);
    const ilgili = (w) => (k.sayisal ? /^\d+$/.test(w) : kat && kat.kelimeler.includes(w));
    return ilgili(a) && ilgili(b) ? 'yakin' : 'alakasiz';
  }

  function kabinSec(t) {
    const canli = canlilar();
    const cift = t.olay === 'ek_kabin' && canli.length >= 6 ? 2 : 1;
    const secilen = karistir(canli).slice(0, cift * 2);
    t.kabinler = [];
    for (let i = 0; i + 1 < secilen.length; i += 2) t.kabinler.push(Object.assign({ a: secilen[i].id, b: secilen[i + 1].id, soylenen: {} }, kelimeUret()));
  }

  function salterSec(t) {
    const canli = canlilar();
    const kabinde = new Set(t.kabinler.flatMap((k) => [k.a, k.b]));
    const sayi = Math.min(t.olay === 'guc_dalgasi' ? 4 : 3, canli.length);
    const once = karistir(canli.filter((p) => !kabinde.has(p.id)));
    const sonra = karistir(canli.filter((p) => kabinde.has(p.id)));
    t.salter = { kisiler: once.concat(sonra).slice(0, sayi).map((p) => p.id), renk: {}, kamera: null };
  }

  function telefonBilgi(t, arayan) {
    const kabin = t.kabinler.flatMap((k) => [k.a, k.b]);
    const salter = t.salter ? t.salter.kisiler : [];
    const adet = t.olay === 'cift_hat' ? 2 : 1;
    const bilgiler = []; const kullan = new Set();
    for (let i = 0; i < adet; i++) {
      for (let d = 0; d < 10; d++) {
        const r = Math.random();
        if (r < 0.2 && salter.length && !kullan.has('sayi')) {
          kullan.add('sayi');
          const n = salter.filter((id) => hain(G.oyuncular[id])).length;
          bilgiler.push('Şalter odasında ' + n + ' hain vardı.'); break;
        }
        if (r < 0.4 && t.kabinler.length && !kullan.has('cift')) {
          kullan.add('cift');
          const k = t.kabinler[0];
          const ayni = hain(G.oyuncular[k.a]) === hain(G.oyuncular[k.b]);
          bilgiler.push('Kabindeki ' + ad(k.a) + ' ve ' + ad(k.b) + ' ' + (ayni ? 'AYNI' : 'FARKLI') + ' takımdan.'); break;
        }
        const aday = [...new Set([...kabin, ...salter])].filter((id) => id !== arayan && !kullan.has('b' + id));
        if (!aday.length) continue;
        const h = rastgele(aday); kullan.add('b' + h);
        const sira = salter.indexOf(h);
        bilgiler.push((sira >= 0 ? 'Şalter odasındaki ' + (sira + 1) + '. kişi (' + ad(h) + ')' : 'Kabine giren ' + ad(h)) + ' ' + (hain(G.oyuncular[h]) ? 'HAİNDİR.' : 'MASUMDUR.'));
        break;
      }
    }
    return bilgiler;
  }

  function kisiSecim(id, liste, deger, bos) {
    return '<select id="' + id + '">' + (bos ? '<option value="">' + bos + '</option>' : '') + liste.map((p) => '<option value="' + p.id + '"' + (String(p.id) === String(deger) ? ' selected' : '') + '>' + kac(p.ad) + '</option>').join('') + '</select>';
  }

  function adimKart(no, baslik, durum, icerik) {
    return '<section class="k-kart k-adim" data-durum="' + durum + '"><header><span class="k-no">' + no + '</span><h3>' + baslik + '</h3><span class="k-durum">' + { bekliyor: 'Sırada', aktif: 'Şimdi', tamam: 'Tamam', kapali: 'Bu tur yok' }[durum] + '</span></header>' + icerik + '</section>';
  }

  function turHtml() {
    const t = aktifTur();
    if (!t) return '<p class="k-not">Henüz tur yok.</p>';
    const kap = G.oyuncular.find((p) => p.rol === 'kaptan');
    const ust = '<div class="k-tur-ust"><h2>TUR ' + t.no + '</h2><span>Kaptan yetkisi: <b>' + (G.kaptanYetki ? 'kazanıldı' : 'yok') + '</b></span><span>Hayatta: <b>' + canlilar().length + '</b> · Hain: <b>' + canlilar().filter(hain).length + '</b></span>' +
      '<span>Kaptan: <b>' + maske(kac(kap ? kap.ad : '-')) + '</b>' + (kap && kap.durum !== 'canli' ? ' (hayatta değil)' : '') + '</span></div>';
    const adimlar = [];
    // 0 · olay
    if (G.ayar.olaylar) {
      adimlar.push(adimKart('0', 'İstasyon olayı', t.olay ? 'tamam' : 'aktif', t.olay
        ? '<p class="k-olay t-' + olayBul(t.olay).tip + '"><b>' + olayBul(t.olay).ad + '</b> · ' + olayBul(t.olay).metin + '</p>' + kopyaKutu('OLAY: ' + olayBul(t.olay).ad + '! ' + olayBul(t.olay).metin) + '<button type="button" class="dugme ince" data-is="olay-yeniden">Yeniden çek</button>'
        : '<button type="button" class="dugme birincil" data-is="olay">Olay kartı çek</button>'));
    } else if (!t.olay) t.olay = 'sakin';
    const olayHazir = !!t.olay;
    // 1 · kabin
    let kabinIc = '';
    if (!olayHazir) kabinIc = '<p class="k-not">Önce olay kartını çek.</p>';
    else if (!t.kabinler.length) kabinIc = '<button type="button" class="dugme birincil" data-is="kabin">Rastgele ' + (t.olay === 'ek_kabin' ? '2 çift' : '2 kişi') + ' seç</button>';
    else {
      kabinIc = t.kabinler.map((k, i) => {
        const sinif = kabinSinif(k);
        return '<div class="k-kabin"><p><b>' + kac(ad(k.a)) + '</b> & <b>' + kac(ad(k.b)) + '</b> · Kategori: ' + kac(k.kat) + ' · Masum: <code>' + kac(k.masum) + '</code> Hain: <code>' + kac(k.hain) + '</code> Sanrı: <code>' + kac(k.sanri) + '</code></p>' +
          kopyaKutu(duyuru(KK.DUYURU.kabin, { a: ad(k.a), b: ad(k.b) })) +
          [k.a, k.b].map((id) => '<div class="k-fisilti"><span>' + kac(ad(id)) + ' ' + maske('<small>(' + kac(rolAdi(G.oyuncular[id])) + ')</small>') + '</span>' + kopyaKutu(fisilti(ad(id), 'Kabin şifren: ' + duydugu(G.oyuncular[id], k) + '. Çıkınca diğeriyle AYNI ANDA söyle.'), { fisilti: true }) + '</div>').join('') +
          '<div class="k-satir"><label>' + kac(ad(k.a)) + ' dedi <input data-kabin="' + i + '" data-kim="' + k.a + '" value="' + kac(k.soylenen[k.a] || '') + '"></label><label>' + kac(ad(k.b)) + ' dedi <input data-kabin="' + i + '" data-kim="' + k.b + '" value="' + kac(k.soylenen[k.b] || '') + '"></label>' +
          '<span class="k-sinif ' + (sinif ? 's-' + sinif : '') + '">' + (sinif ? { eslesme: 'Eşleşti', yakin: 'Uyuşmazlık: yakın kelime', alakasiz: 'Uyuşmazlık: alakasız (sanrı?)' }[sinif] : 'Sonucu yaz') + '</span></div></div>';
      }).join('') + '<button type="button" class="dugme ince" data-is="kabin">Yeniden seç</button>';
    }
    adimlar.push(adimKart('1', 'Kabin turu', !olayHazir ? 'bekliyor' : t.kabinler.length ? 'tamam' : 'aktif', kabinIc));
    // 2 · şalter
    let salterIc = '';
    if (!t.kabinler.length) salterIc = '<p class="k-not">Kabin turundan sonra.</p>';
    else if (!t.salter) salterIc = '<button type="button" class="dugme birincil" data-is="salter">Rastgele ' + (t.olay === 'guc_dalgasi' ? 4 : 3) + ' kişi seç</button>';
    else {
      const s = t.salter;
      const yesil = s.kisiler.filter((id) => s.renk[id] === 'yesil').length;
      const tamam = s.kisiler.every((id) => s.renk[id]);
      salterIc = kopyaKutu(duyuru(KK.DUYURU.salter, { kisiler: s.kisiler.map((id, i) => (i + 1) + '.' + ad(id)).join(', ') })) +
        '<ol class="k-salter">' + s.kisiler.map((id) => {
          const p = G.oyuncular[id];
          const lanetli = p.rol === 'halusinatif' && p.lanet === 1;
          return '<li><span class="k-salter-ad">' + kac(p.ad) + ' ' + maske('<small>(' + kac(rolAdi(p)) + ')</small>') + '</span>' +
            kopyaKutu(fisilti(p.ad, lanetli ? 'Şalter odasındasın. Şalterin zaten YEŞİL yanıyor.' : 'Şalter odasındasın. Şalterin KIRMIZI. Açmak istersen bana AÇ yaz.'), { fisilti: true }) +
            '<span class="k-renk" role="group" aria-label="' + kac(p.ad) + ' şalter sonucu"><button type="button" class="r-yesil" aria-pressed="' + (s.renk[id] === 'yesil') + '" data-renk="yesil" data-kim="' + id + '">Yeşil yaptı</button><button type="button" class="r-kirmizi" aria-pressed="' + (s.renk[id] === 'kirmizi') + '" data-renk="kirmizi" data-kim="' + id + '">Kırmızı kaldı</button></span></li>';
        }).join('') + '</ol>' +
        (tamam ? kopyaKutu(duyuru(KK.DUYURU.salterSonuc, { n: s.kisiler.length, g: yesil })) : '<p class="k-not">Her kişinin sonucunu işaretle; panel toplamı hazırlanır. Lanetli halüsinatif kırmızı bırakır.</p>') +
        (tamam && t.olay === 'kamera' ? (s.kamera == null ? '<button type="button" class="dugme ince" data-is="kamera">Kamera kaydını aç</button>' : kopyaKutu('GÜVENLİK KAMERASI: ' + ad(s.kamera) + ' şalteri ' + (s.renk[s.kamera] === 'yesil' ? 'YEŞİL' : 'KIRMIZI') + ' bıraktı.')) : '');
    }
    const salterTamam = t.salter && t.salter.kisiler.every((id) => t.salter.renk[id]);
    adimlar.push(adimKart('2', 'Şalter odası', !t.kabinler.length ? 'bekliyor' : salterTamam ? 'tamam' : 'aktif', salterIc));
    // 3 · telefon
    let telIc = '';
    const telDurum = !salterTamam ? 'bekliyor' : t.olay === 'parazit' ? 'kapali' : t.telefon && t.telefon.bilgiler ? 'tamam' : 'aktif';
    if (!salterTamam) telIc = '<p class="k-not">Şalter odasından sonra.</p>';
    else if (t.olay === 'parazit') telIc = kopyaKutu('TELEFON: Radyo paraziti! Hat kesik, bu tur bilgi yok.');
    else {
      telIc = kopyaKutu(KK.DUYURU.telefon) + '<div class="k-satir"><label>Halkın seçtiği kişi ' + kisiSecim('k-arayan', canlilar().concat(t.telefon && G.oyuncular[t.telefon.arayan].durum !== 'canli' ? [G.oyuncular[t.telefon.arayan]] : []), t.telefon ? t.telefon.arayan : '', 'Seç…') + '</label>' +
        '<button type="button" class="dugme birincil" data-is="telefon">Gerçek bilgi üret</button></div>' +
        (t.telefon && t.telefon.bilgiler ? t.telefon.bilgiler.map((b) => kopyaKutu(fisilti(ad(t.telefon.arayan), 'TELEFON: ' + b), { fisilti: true })).join('') +
          '<p class="k-not">Bilgi her zaman doğrudur. ' + kac(ad(t.telefon.arayan)) + ' ' + maske(hain(G.oyuncular[t.telefon.arayan]) ? '<b class="hata">bir HAİN; duyuruyu çarpıtabilir.</b>' : 'masum.') + '</p>' : '');
    }
    adimlar.push(adimKart('3', 'Telefon', telDurum, telIc));
    // 4 · kaptan
    const kapHazir = telDurum === 'tamam' || telDurum === 'kapali';
    let kapIc = '';
    if (!kapHazir) kapIc = '<p class="k-not">Telefondan sonra.</p>';
    else if (t.olay === 'kizil_alarm' && !t.karar) { t.karar = 'oylama'; t.zorunlu = true; }
    if (kapHazir) {
      kapIc = kopyaKutu(KK.DUYURU.kaptan);
      if (t.zorunlu) kapIc += '<p class="k-olay t-kotu"><b>Kızıl Alarm:</b> oylama zorunlu, Kaptan yetki kazanmaz.</p>';
      else kapIc += '<div class="k-satir"><button type="button" class="dugme' + (t.karar === 'pas' ? ' birincil' : '') + '" data-karar="pas">Kaptan PAS dedi</button><button type="button" class="dugme' + (t.karar === 'oylama' ? ' birincil' : '') + '" data-karar="oylama">Kaptan OYLAMA dedi</button></div>';
      if (t.karar) kapIc += kopyaKutu(t.karar === 'pas' ? KK.DUYURU.pas : KK.DUYURU.oylama);
      if (t.karar === 'oylama') {
        kapIc += '<div class="k-satir"><label>Sandık sonucu ' + kisiSecim('k-atilan', canlilar().concat(t.atilan != null && t.atilan !== '' && G.oyuncular[t.atilan].durum !== 'canli' ? [G.oyuncular[t.atilan]] : []), t.atilan == null ? '' : t.atilan, 'Beraberlik / kimse') + '</label><button type="button" class="dugme birincil" data-is="atil">Sonucu işle</button></div>';
        if (t.atilanIslendi) {
          const p = t.atilan !== '' && t.atilan != null ? G.oyuncular[t.atilan] : null;
          const kim = p ? (G.ayar.kimlik === 'takim' ? ' Kimlik: ' + (hain(p) ? 'HAİN' : 'MASUM') + '.' : G.ayar.kimlik === 'rol' ? ' Kimlik: ' + KK.ROLLER[p.rol].ad.toLocaleUpperCase('tr-TR') + '.' : '') : '';
          kapIc += kopyaKutu(p ? p.ad + ' hava kilidinden atıldı!' + kim : 'Beraberlik! Kimse atılmadı.');
          // gece
          const suik = G.oyuncular.find((q) => q.rol === 'suikastci' && q.durum === 'canli');
          const medik = G.oyuncular.find((q) => q.rol === 'medik' && q.durum === 'canli');
          if (t.olay === 'karantina') kapIc += kopyaKutu('Karantina: kapılar kilitli. Bu gece kimse ölmeyecek.');
          else if (!suik) kapIc += '<p class="k-not">Suikastçı hayatta değil: gece sessiz geçecek. ' + (t.gece ? '' : '<button type="button" class="dugme ince" data-is="gece-sessiz">Sessiz geceyi işle</button>') + '</p>';
          else {
            kapIc += '<div class="k-gece"><p>' + kopyaKutu(KK.DUYURU.gece) + '</p>' + kopyaKutu(fisilti(suik.ad, 'Gece oldu. Kimi öldürmek istiyorsun? Bana fısılda.'), { fisilti: true }) +
              (medik ? kopyaKutu(fisilti(medik.ad, 'Gece oldu. Bu gece kimi koruyorsun? Bana fısılda.'), { fisilti: true }) : '') +
              '<div class="k-satir"><label>Suikastçının hedefi ' + kisiSecim('k-kurban', canlilar().filter((q) => !hain(q)), t.gece ? t.gece.kurban : '', 'Seç…') + '</label>' +
              (medik ? '<label class="anahtar kucuk" for="k-kurtardi"><input type="checkbox" id="k-kurtardi"' + (t.gece && t.gece.kurtarildi ? ' checked' : '') + '><span class="anahtar-ray" aria-hidden="true"></span><span>Medik onu korudu</span></label>' : '') +
              '<button type="button" class="dugme birincil" data-is="gece">Sabahı işle</button></div></div>';
          }
          if (t.gece) {
            kapIc += kopyaKutu(t.gece.olen != null ? duyuru(KK.DUYURU.sabahOlum, { x: ad(t.gece.olen) }) + ' Kimliği: ' + KK.ROLLER[G.oyuncular[t.gece.olen].rol].ad.toLocaleUpperCase('tr-TR') + '.' : t.gece.kurtarildi ? 'Sabah oldu. Gece bir saldırı oldu ama Medik kurbanı kurtardı!' : KK.DUYURU.sabahSessiz);
          }
        }
      }
    }
    const geceGerek = t.karar === 'oylama' && t.olay !== 'karantina' && G.oyuncular.some((q) => q.rol === 'suikastci' && q.durum === 'canli');
    const kapTamam = t.karar === 'pas' || (t.karar === 'oylama' && t.atilanIslendi && (!geceGerek || t.gece));
    adimlar.push(adimKart('4', 'Kaptan\'ın kararı', !kapHazir ? 'bekliyor' : kapTamam ? 'tamam' : 'aktif', kapIc));
    // 5 · tur sonu
    let sonIc = '<p class="k-not">Kaptan kararından sonra.</p>';
    if (kapTamam) {
      const kirmizi = t.salter ? t.salter.kisiler.filter((id) => t.salter.renk[id] === 'kirmizi').length : 0;
      const dusus = KK.O2.TABAN + KK.O2.KIRMIZI * kirmizi + (t.olay === 'sizinti' ? KK.O2.OLAY : 0) - (t.olay === 'yedek_tup' ? KK.O2.OLAY : 0);
      const yeni = Math.max(0, G.o2 - dusus);
      const durum = oyunDurumu(G.ayar.o2 ? yeni : 100);
      sonIc = (G.ayar.o2 ? '<p>Oksijen: %' + G.o2 + ' → <b>%' + yeni + '</b> <small>(taban ' + KK.O2.TABAN + ' + kırmızı ' + kirmizi + '×' + KK.O2.KIRMIZI + (t.olay === 'sizinti' ? ' + sızıntı' : '') + (t.olay === 'yedek_tup' ? ' − yedek tüp' : '') + ')</small></p>' : '') +
        (durum ? '<p class="k-olay ' + (durum.kazanan === 'hain' ? 't-kotu' : 't-iyi') + '"><b>' + durum.baslik + '</b> ' + durum.metin + '</p>' : '') +
        '<div class="k-satir"><button type="button" class="dugme birincil" data-is="tur-bitir" data-o2="' + yeni + '">' + (durum && durum.final ? 'Turu bitir, finale geç' : durum ? 'Turu bitir, sonucu açıkla' : 'Turu bitir, Tur ' + (t.no + 1) + '\'e geç') + '</button></div>';
    }
    adimlar.push(adimKart('5', 'Tur sonu', kapTamam ? 'aktif' : 'bekliyor', sonIc));
    return ust + '<div class="k-akis">' + adimlar.join('') + '</div>' + kadroPaneli();
  }

  function oyunDurumu(o2) {
    const c = canlilar(); const h = c.filter(hain).length; const m = c.length - h;
    if (!h) return { kazanan: 'masum', baslik: 'Hainler bitti!', metin: 'Hayatta hain kalmadı. Mürettebat kazanır; istersen yine de fırlatma töreni yap.', final: true };
    if (m < 3) return { kazanan: 'hain', baslik: 'Temiz koltuk kalmadı.', metin: 'Masum sayısı 3\'ün altına düştü: hainler kazanır.', final: false };
    if (o2 <= 0) return { baslik: 'Oksijen bitti.', metin: 'Son fırlatma penceresi: finale geçin.', final: true };
    if (c.length <= 4) return { baslik: 'Çok az kişi kaldı.', metin: 'Kapsül hazır: finale geçin.', final: true };
    return null;
  }

  function kadroPaneli() {
    return '<section class="k-kart k-kadro"><h3>Kadro durumu</h3><ul>' + G.oyuncular.map((p) => '<li class="' + (p.durum !== 'canli' ? 'cikti' : '') + '"><span>' + kac(p.ad) + '</span>' + maske('<i class="rol-cip t-' + KK.ROLLER[p.rol].takim + '">' + kac(rolAdi(p)) + '</i>') +
      '<select data-durum="' + p.id + '" aria-label="' + kac(p.ad) + ' durumu"><option value="canli"' + (p.durum === 'canli' ? ' selected' : '') + '>Hayatta</option><option value="atildi"' + (p.durum === 'atildi' ? ' selected' : '') + '>Atıldı</option><option value="oldu"' + (p.durum === 'oldu' ? ' selected' : '') + '>Öldü</option></select></li>').join('') + '</ul></section>';
  }

  /* ---------- final ---------- */
  function finalHtml() {
    if (!G.final) G.final = { koltuklar: ['', '', ''], acik: false };
    const f = G.final;
    const kap = G.oyuncular.find((p) => p.rol === 'kaptan');
    const yetki = G.kaptanYetki && kap && kap.durum === 'canli';
    const c = canlilar();
    const koltuk = (i) => '<label>' + (i + 1) + '. koltuk ' + (i === 0 && yetki ? '<small>(Kaptan seçer)</small>' : '<small>(halk seçer)</small>') + kisiSecim('k-koltuk-' + i, c, f.koltuklar[i], 'Seç…') + '</label>';
    const dolu = f.koltuklar.filter((x) => x !== '' && x != null);
    const durum = oyunDurumu(G.ayar.o2 ? G.o2 : 100);
    if (durum && !durum.final) {
      return '<section class="k-kart"><div class="k-final-sonuc t-kotu"><h3>HAİNLER KAZANDI</h3><p>' + durum.metin + '</p>' + kopyaKutu('Temiz koltuk kalmadı! Hainler istasyonu ele geçirdi.') +
        kopyaKutu('Roller: ' + G.oyuncular.map((p) => p.ad + '=' + KK.ROLLER[p.rol].ad).join(', ')) + '</div></section>' + kadroPaneli();
    }
    let sonuc = '';
    if (f.acik && dolu.length) {
      const hainler = dolu.filter((id) => hain(G.oyuncular[id]));
      sonuc = '<div class="k-final-sonuc ' + (hainler.length ? 't-kotu' : 't-iyi') + '"><h3>' + (hainler.length ? 'KAPSÜL PATLADI' : 'KAPSÜL TEMİZ KALKTI') + '</h3>' +
        (hainler.length ? '<p>İçerideki hain: ' + hainler.map((id) => kac(ad(id))).join(', ') + '</p>' : '') + kopyaKutu(hainler.length ? KK.DUYURU.kazanHain : KK.DUYURU.kazanMasum) +
        kopyaKutu('Roller: ' + G.oyuncular.map((p) => p.ad + '=' + KK.ROLLER[p.rol].ad).join(', ')) + '</div>';
    }
    return '<section class="k-kart"><h3>Fırlatma anı</h3>' + kopyaKutu(KK.DUYURU.final) +
      '<p>' + (kap ? 'Gizli Kaptan: <b>' + kac(kap.ad) + '</b> · ' : '') + (kap && kap.durum !== 'canli' ? 'Kaptan hayatta değil: 3 koltuğu da halk seçer.' : yetki ? 'En az bir oylama başlattı: 1. koltuğu kendisi seçer.' : 'Hiç oylama başlatmadı: söz hakkı yok, 3 koltuğu da halk seçer.') + '</p>' +
      kopyaKutu(kap && kap.durum === 'canli' ? 'Gizli Kaptan ' + kap.ad + '! ' + (yetki ? '1. koltuğu o seçecek, kalan 2 koltuk halk oylamasıyla.' : 'Hiç oylama açmadığı için 3 koltuğu da halk seçecek.') : 'Kaptan aramızda değil. 3 koltuğu da halk seçecek.') +
      '<div class="k-koltuklar">' + [0, 1, 2].map(koltuk).join('') + '</div>' +
      '<div class="k-eylem"><button type="button" class="dugme birincil" data-is="final-ac"' + (new Set(dolu).size !== Math.min(3, c.length) ? ' disabled' : '') + '>Sonucu açıkla</button></div>' + sonuc + '</section>' + kadroPaneli();
  }

  /* ---------- sayaç ---------- */
  function sayacCiz() {
    const d = Math.floor(sayac.kalan / 60), s = sayac.kalan % 60;
    $('#sayac-goster').textContent = d + ':' + String(s).padStart(2, '0');
    $('#sayac-kutu').classList.toggle('son', sayac.kalan <= 10 && sayac.calisiyor);
    $('#sayac-basla').textContent = sayac.calisiyor ? 'Durdur' : 'Başlat';
  }
  function sayacAdim() {
    sayac.kalan = Math.max(0, sayac.kalan - 1);
    if (sayac.kalan <= 5 && sayac.kalan > 0) KK.Ses.sayac();
    if (sayac.kalan === 0) { KK.Ses.alarm(); sayacDur(); }
    sayacCiz();
  }
  function sayacDur() { sayac.calisiyor = false; clearInterval(sayac.id); sayac.id = null; sayacCiz(); }

  /* ---------- olaylar ---------- */
  function bagla() {
    const kokEl = $('#gorunum-kurucu');
    kokEl.addEventListener('click', async (e) => {
      const kopya = e.target.closest('[data-kopya]');
      if (kopya) {
        const v = kopya.dataset.kopya;
        try { await navigator.clipboard.writeText(v); kopya.textContent = 'Kopyalandı'; }
        catch (err) {
          const code = kopya.closest('.kopya') ? $('code', kopya.closest('.kopya')) : null;
          if (code) { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); kopya.textContent = 'Seçildi, Ctrl+C'; }
          else kopya.textContent = 'Kopyalanamadı';
        }
        KK.Ses.tik();
        setTimeout(() => { if (kopya.isConnected) kopya.textContent = kopya.closest('.kopya') ? 'Kopyala' : 'Fısıltıyı kopyala'; }, 1600);
        return;
      }
      const adim = e.target.closest('.kurucu-adimlar button');
      if (adim && !adim.disabled) { G.adim = adim.dataset.adim; ciz(); return; }
      const t = aktifTur();
      const is = e.target.closest('[data-is]');
      if (is) {
        const ne = is.dataset.is;
        if (ne === 'olay' || ne === 'olay-yeniden') { t.olay = olayCek(t); t.kabinler = []; t.salter = null; t.telefon = null; t.karar = null; t.zorunlu = false; KK.Ses.bip(); }
        if (ne === 'kabin') kabinSec(t);
        if (ne === 'salter') salterSec(t);
        if (ne === 'kamera') t.salter.kamera = rastgele(t.salter.kisiler);
        if (ne === 'telefon') {
          const v = $('#k-arayan').value; if (v === '') return;
          t.telefon = { arayan: Number(v), bilgiler: telefonBilgi(t, Number(v)) };
        }
        if (ne === 'atil') {
          const v = $('#k-atilan').value;
          if (t.atilan !== undefined && t.atilan !== '' && t.atilan != null && G.oyuncular[t.atilan].durum === 'atildi') G.oyuncular[t.atilan].durum = 'canli';
          t.atilan = v === '' ? '' : Number(v);
          if (v !== '') G.oyuncular[Number(v)].durum = 'atildi';
          t.atilanIslendi = true; t.gece = null;
          KK.Ses.kilit();
        }
        if (ne === 'gece-sessiz') t.gece = { olen: null, kurtarildi: false };
        if (ne === 'gece') {
          const v = $('#k-kurban').value; if (v === '') return;
          if (t.gece && t.gece.olen != null) G.oyuncular[t.gece.olen].durum = 'canli';
          const kurtarildi = !!($('#k-kurtardi') && $('#k-kurtardi').checked);
          t.gece = { kurban: Number(v), kurtarildi, olen: kurtarildi ? null : Number(v) };
          if (!kurtarildi) G.oyuncular[Number(v)].durum = 'oldu';
        }
        if (ne === 'tur-bitir') {
          if (G.ayar.o2) G.o2 = Number(is.dataset.o2);
          t.bitti = true;
          const d = oyunDurumu(G.ayar.o2 ? G.o2 : 100);
          if (d) { G.adim = 'final'; G.final = null; }
          else { turBaslat(); return; }
        }
        if (ne === 'final-ac') { G.final.acik = true; const h = G.final.koltuklar.some((id) => id !== '' && hain(G.oyuncular[id])); h ? KK.Ses.patlama() : KK.Ses.zafer(); }
        ciz(); return;
      }
      const karar = e.target.closest('[data-karar]');
      if (karar && t) {
        t.karar = karar.dataset.karar;
        if (t.karar === 'oylama' && !t.zorunlu) G.kaptanYetki = true;
        else if (t.karar === 'pas') G.kaptanYetki = G.turlar.some((x) => x !== t && x.karar === 'oylama' && !x.zorunlu);
        ciz(); return;
      }
      const renk = e.target.closest('[data-renk]');
      if (renk && t && t.salter) { t.salter.renk[renk.dataset.kim] = renk.dataset.renk; KK.Ses.salter(renk.dataset.renk === 'yesil'); ciz(); return; }
      if (e.target.id === 'k-dagit') { G.ham = $('#k-isimler').value; rolleriDagit(); return; }
      if (e.target.id === 'k-tur-baslat') { if (G.tur) G.adim = 'tur'; else turBaslat(); ciz(); return; }
      if (e.target.id === 'kurucu-sifirla') { $('#kurucu-sifirla-onay').hidden = false; return; }
      if (e.target.id === 'kurucu-sifirla-hayir') { $('#kurucu-sifirla-onay').hidden = true; return; }
      if (e.target.id === 'kurucu-sifirla-evet') { G = yeniDurum(); $('#kurucu-sifirla-onay').hidden = true; ciz(); return; }
      const hazir = e.target.closest('[data-sure]');
      if (hazir) { sayacDur(); sayac.kalan = sayac.toplam = Number(hazir.dataset.sure); sayacCiz(); return; }
      if (e.target.id === 'sayac-basla') {
        KK.Ses.uyandir();
        if (sayac.calisiyor) sayacDur();
        else { if (sayac.kalan === 0) sayac.kalan = sayac.toplam; sayac.calisiyor = true; sayac.id = setInterval(sayacAdim, 1000); sayacCiz(); }
        return;
      }
      if (e.target.id === 'sayac-sifir') { sayacDur(); sayac.kalan = sayac.toplam; sayacCiz(); }
    });
    kokEl.addEventListener('input', (e) => {
      if (e.target.id === 'k-isimler') {
        G.ham = e.target.value; kaydet();
        const n = isimAyikla(G.ham).length;
        $('#k-sayi').textContent = n ? n + ' oyuncu' : 'Henüz isim yok';
        const d = $('#k-dagit'); if (d) d.disabled = n < 6 || n > 16;
      }
      if (e.target.dataset.kabin != null) {
        const k = aktifTur().kabinler[Number(e.target.dataset.kabin)];
        k.soylenen[e.target.dataset.kim] = e.target.value; kaydet();
        const s = kabinSinif(k); const el = e.target.closest('.k-satir').querySelector('.k-sinif');
        el.className = 'k-sinif ' + (s ? 's-' + s : '');
        el.textContent = s ? { eslesme: 'Eşleşti', yakin: 'Uyuşmazlık: yakın kelime', alakasiz: 'Uyuşmazlık: alakasız (sanrı?)' }[s] : 'Sonucu yaz';
      }
      if (e.target.id === 'k-sablon') { G.ayar.sablon = e.target.value || '{mesaj}'; kaydet(); }
    });
    kokEl.addEventListener('change', (e) => {
      const id = e.target.id;
      const harita = { 'k-yanci': 'yanci', 'k-lanet': 'lanet', 'k-kimlik': 'kimlik' };
      if (harita[id]) { G.ayar[harita[id]] = e.target.value; G.ham = $('#k-isimler') ? $('#k-isimler').value : G.ham; ciz(); return; }
      const anahtarlar = { 'k-halbilir': 'halBilir', 'k-olaylar': 'olaylar', 'k-o2': 'o2', 'k-medik': 'medik' };
      if (anahtarlar[id]) { G.ayar[anahtarlar[id]] = e.target.checked; kaydet(); return; }
      if (id === 'kurucu-gizle') { G.gizle = !e.target.checked; ciz(); return; }
      if (id && id.startsWith('k-koltuk-')) { G.final.koltuklar[Number(id.slice(9))] = e.target.value === '' ? '' : Number(e.target.value); G.final.acik = false; ciz(); return; }
      if (e.target.dataset.durum != null) { G.oyuncular[Number(e.target.dataset.durum)].durum = e.target.value; ciz(); }
    });
  }

  KK.Kurucu = { ciz, bagla, sayacCiz };
})(typeof window !== 'undefined' ? window : globalThis);
