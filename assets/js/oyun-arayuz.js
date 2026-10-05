/* Kızıl Kapsül — simülasyon arayüzü: motoru sahneye bağlar, aşamaları canlandırır. */
(function (kok) {
  'use strict';
  const KK = kok.KK;
  const IPTAL = { iptal: true };
  const D = { oyun: null, ayar: null, oturum: 0, hiz: 1, sonMesaj: 0, etiketler: {}, ariaHak: 0, ariaAnlik: null,
    hayalet: false, atla: false, rolGorunur: false, aktifSekme: 'telsiz', okunmamis: 0 };
  let akis = Promise.resolve();
  let kalpZamanlayici = null;

  /* ---------- küçük yardımcılar ---------- */
  const $ = (s, k) => (k || document).querySelector(s);
  const $$ = (s, k) => Array.from((k || document).querySelectorAll(s));
  function kac(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function oyuncu(id) { return D.oyun.oyuncular[id]; }
  function ben() { return D.oyun.insan(); }
  function benCanli() { return ben().durum === 'canli'; }
  function avatar(p, olcek) { return KK.avatar(p.avatarTohum, olcek || 3); }
  function etiket(id) {
    const p = oyuncu(id);
    return '<span class="kisi-et' + (p.insan ? ' ben' : '') + (p.durum !== 'canli' ? ' cikti' : '') + '"><img src="' + avatar(p, 2) + '" alt=""><span>' + kac(p.ad) + '</span></span>';
  }
  function metin(s) {
    return kac(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/@\[(\d+)\]/g, (_, id) => etiket(Number(id)));
  }
  function yuzde(v) { return Math.round(v * 100); }

  function bekle(ms) {
    const no = D.oturum;
    return new Promise((res, rej) => setTimeout(() => (no === D.oturum ? res() : rej(IPTAL)), D.atla ? 0 : ms * D.hiz));
  }
  function guncel(no) { if (no !== D.oturum) throw IPTAL; }

  /* ---------- sahne ---------- */
  function sahneKur(faz, baslik, alt, html) {
    $('#sahne-faz').textContent = faz;
    $('#sahne-baslik').textContent = baslik;
    $('#sahne-alt').innerHTML = alt || '';
    const ic = $('#sahne-icerik');
    ic.innerHTML = html || '';
    $('#sahne-eylem').innerHTML = '';
    const sahne = $('#sahne');
    sahne.classList.remove('giris'); void sahne.offsetWidth; sahne.classList.add('giris');
    // Dar ekranda sahne telsizin üstünde kalır; yeni aşama başlayınca görünür alana getir.
    if (window.innerWidth <= 720 && sahne.getBoundingClientRect().top < 0) sahne.scrollIntoView({ block: 'start' });
    return ic;
  }

  // Her istem kendi kabını alır; eski dinleyiciler kabıyla birlikte atılır.
  function eylemAlani(html) {
    const kap = $('#sahne-eylem');
    kap.innerHTML = '';
    const e = document.createElement('div');
    e.className = 'eylem-ic';
    e.innerHTML = html;
    kap.appendChild(e);
    return e;
  }

  function devam(etiketMetni, opt) {
    opt = opt || {};
    const no = D.oturum;
    if (D.atla) return Promise.resolve();
    const e = eylemAlani('<button class="dugme birincil" id="devam-dugme" type="button">' + kac(etiketMetni) + ' <span aria-hidden="true">→</span></button>' +
      (D.hayalet ? '<span class="eylem-not">Hayalet modu: kendiliğinden ilerliyor</span>' : ''));
    const b = $('#devam-dugme', e);
    b.focus({ preventScroll: true });
    return new Promise((res, rej) => {
      let bitti = false;
      const tamam = () => { if (bitti) return; bitti = true; KK.Ses.tik(); e.innerHTML = ''; no === D.oturum ? res() : rej(IPTAL); };
      b.addEventListener('click', tamam);
      if (D.hayalet || opt.otomatik) setTimeout(tamam, (opt.otomatik || 2200) * D.hiz);
    });
  }

  // Oyuncudan bir kişi seçmesini ister.
  function kisiSec(adaylar, soru, opt) {
    opt = opt || {};
    const no = D.oturum;
    const e = eylemAlani('<div class="secim"><p class="secim-soru">' + kac(soru) + '</p><div class="secim-izgara">' +
      adaylar.map((p) => '<button type="button" class="secim-kisi' + (opt.tehlike ? ' tehlike' : '') + '" data-id="' + p.id + '"><img src="' + avatar(p, 2) + '" alt=""><span>' + kac(p.ad) + (p.insan ? ' (sen)' : '') + '</span>' + (D.etiketler[p.id] ? '<i class="mini-etiket e-' + D.etiketler[p.id] + '">' + ETIKET_AD[D.etiketler[p.id]] + '</i>' : '') + '</button>').join('') +
      (opt.cekimser ? '<button type="button" class="secim-kisi cekimser" data-id="-1"><span>Çekimser</span></button>' : '') +
      '</div></div>');
    return new Promise((res, rej) => {
      e.addEventListener('click', (ev) => {
        const b = ev.target.closest('.secim-kisi'); if (!b) return;
        KK.Ses.tik();
        const id = Number(b.dataset.id);
        e.innerHTML = '';
        no === D.oturum ? res(id < 0 ? null : id) : rej(IPTAL);
      });
    });
  }

  function cokluSec(adaylar, adet, soru) {
    const no = D.oturum;
    const e = eylemAlani('<div class="secim"><p class="secim-soru">' + kac(soru) + '</p><div class="secim-izgara">' +
      adaylar.map((p) => '<button type="button" class="secim-kisi" aria-pressed="false" data-id="' + p.id + '"><img src="' + avatar(p, 2) + '" alt=""><span>' + kac(p.ad) + '</span></button>').join('') +
      '</div><button type="button" class="dugme birincil" id="coklu-onay" disabled>Oyları gönder (0/' + adet + ')</button></div>');
    const secili = new Set();
    const onay = $('#coklu-onay', e);
    return new Promise((res, rej) => {
      e.addEventListener('click', (ev) => {
        const b = ev.target.closest('.secim-kisi');
        if (b) {
          const id = Number(b.dataset.id);
          if (secili.has(id)) secili.delete(id); else if (secili.size < adet) secili.add(id);
          $$('.secim-kisi', e).forEach((x) => x.setAttribute('aria-pressed', secili.has(Number(x.dataset.id)) ? 'true' : 'false'));
          onay.disabled = secili.size !== Math.min(adet, adaylar.length);
          onay.textContent = 'Oyları gönder (' + secili.size + '/' + adet + ')';
          KK.Ses.tik();
          return;
        }
        if (ev.target === onay && !onay.disabled) { e.innerHTML = ''; no === D.oturum ? res(Array.from(secili)) : rej(IPTAL); }
      });
    });
  }

  function secenekSor(soru, secenekler) {
    const no = D.oturum;
    const e = eylemAlani('<div class="secim"><p class="secim-soru">' + soru + '</p><div class="secenekler">' +
      secenekler.map((s, i) => '<button type="button" class="dugme' + (s.birincil ? ' birincil' : '') + (s.tehlike ? ' tehlike' : '') + '" data-i="' + i + '">' + s.etiket + '</button>').join('') + '</div></div>');
    return new Promise((res, rej) => {
      e.addEventListener('click', (ev) => {
        const b = ev.target.closest('button[data-i]'); if (!b) return;
        KK.Ses.tik(); e.innerHTML = '';
        no === D.oturum ? res(secenekler[Number(b.dataset.i)].deger) : rej(IPTAL);
      });
    });
  }

  /* ---------- HUD ---------- */
  const FAZLAR = [['olay', 'Olay'], ['kabin', 'Kabin'], ['salter', 'Şalter'], ['telefon', 'Telefon'], ['kaptan', 'Kaptan'], ['gece', 'Gece']];
  function fazAyarla(faz) {
    const sira = { oylama: 'kaptan' }[faz] || faz;
    $('#hud-fazlar').innerHTML = FAZLAR.map(([k, ad]) => '<li class="' + (k === sira ? 'aktif' : '') + '">' + ad + '</li>').join('');
    $('#sahne').dataset.faz = faz;
    $('#hud-tur').textContent = D.oyun.tur || '–';
  }

  function o2Goster(deger) {
    $('#hud-o2').textContent = '%' + deger;
    const dolu = $('#hud-o2-dolu');
    dolu.style.width = deger + '%';
    const kutu = $('#hud-o2-kutu');
    kutu.classList.toggle('kritik', deger <= 30);
    kutu.classList.toggle('uyari', deger > 30 && deger <= 55);
  }

  function rolRozeti() {
    const b = $('#hud-rol');
    const r = KK.ROLLER[ben().gorunenRol];
    b.textContent = D.rolGorunur ? r.ad.toLocaleUpperCase('tr-TR') : 'ROLÜ GÖSTER';
    b.dataset.takim = D.rolGorunur ? r.takim : '';
    b.setAttribute('aria-pressed', D.rolGorunur ? 'true' : 'false');
  }

  /* ---------- mürettebat listesi ---------- */
  const ETIKETLER = [null, 'temiz', 'supheli', 'hain', 'hal'];
  const ETIKET_AD = { temiz: 'Temiz', supheli: 'Şüpheli', hain: 'Hain?', hal: 'Halüsinatif?' };

  function bilinenRol(p) {
    const o = D.oyun;
    if (p.insan) return { ad: KK.ROLLER[p.gorunenRol].ad, takim: KK.ROLLER[p.gorunenRol].takim };
    if (D.hayalet || o.bitti) return { ad: KK.ROLLER[p.rol].ad + (p.rol === 'halusinatif' ? (p.lanet ? ' · Şalter' : ' · Kabin') : ''), takim: KK.ROLLER[p.rol].takim };
    if (o.hainMi(ben()) && o.hainMi(p)) return { ad: KK.ROLLER[p.rol].ad, takim: 'hain' };
    if (p.durum === 'oldu') return { ad: KK.ROLLER[p.rol].ad, takim: 'masum' };
    if (p.durum === 'atildi' && o.ayar.kimlik === 'rol') return { ad: KK.ROLLER[p.rol].ad, takim: o.takim(p) };
    if (p.durum === 'atildi' && o.ayar.kimlik === 'takim') return { ad: o.hainMi(p) ? 'Hain' : 'Masum', takim: o.takim(p) };
    if (o.final && p.rol === 'kaptan' && p.durum === 'canli') return { ad: 'Gizli Kaptan', takim: 'masum' };
    return null;
  }

  function ekipCiz(isaret) {
    isaret = isaret || {};
    const o = D.oyun;
    const ul = $('#ekip-liste');
    ul.innerHTML = o.oyuncular.map((p) => {
      const r = bilinenRol(p);
      const et = D.etiketler[p.id];
      const durum = p.durum === 'oldu' ? 'Öldürüldü' : p.durum === 'atildi' ? 'Atıldı' : (isaret[p.id] || '');
      return '<li class="ekip-kart' + (p.durum !== 'canli' ? ' cikti' : '') + (p.insan ? ' ben' : '') + (isaret[p.id] ? ' isaretli' : '') + '" data-id="' + p.id + '">' +
        '<img class="ekip-avatar" src="' + avatar(p, 3) + '" alt="">' +
        '<div class="ekip-bilgi"><span class="ekip-ad">' + kac(p.ad) + (p.insan ? ' <i class="sen">SEN</i>' : '') + '</span>' +
        '<span class="ekip-alt">' + (r ? '<i class="rol-cip t-' + r.takim + '">' + kac(r.ad) + '</i>' : '') + (durum ? '<i class="durum-cip">' + kac(durum) + '</i>' : '') + '</span></div>' +
        (!p.insan && p.durum === 'canli' && !o.bitti ? '<button type="button" class="etiket-dugme' + (et ? ' e-' + et : '') + '" data-id="' + p.id + '" title="Şüphe panosu: etiketi değiştir">' + (et ? ETIKET_AD[et] : 'Not al') + '</button>' : '') +
        '</li>';
    }).join('');
    sozSecimGuncelle();
  }

  /* ---------- telsiz ---------- */
  function mesajlar() {
    akis = akis.then(mesajlariIsle, mesajlariIsle);
    return akis;
  }

  async function mesajlariIsle() {
    const o = D.oyun; const no = D.oturum;
    if (!o) return;
    while (no === D.oturum && D.sonMesaj < o.sohbet.length) {
      const m = o.sohbet[D.sonMesaj++];
      if (!D.atla) {
        if (m.tip !== 'sistem') {
          const yaz = yaziyor(m.kim);
          await bekle(380 + Math.min(900, m.metin.length * 9));
          yaz.remove();
        } else await bekle(220);
      }
      mesajEkle(m);
    }
  }

  function yaziyor(kim) {
    const li = document.createElement('li');
    li.className = 'mesaj yaziyor';
    li.innerHTML = '<img src="' + avatar(oyuncu(kim), 2) + '" alt=""><span class="nokta"><i></i><i></i><i></i></span>';
    $('#telsiz').appendChild(li); kaydir();
    return li;
  }

  function mesajEkle(m) {
    const li = document.createElement('li');
    if (m.tip === 'sistem') {
      li.className = 'mesaj sistem';
      li.innerHTML = '<span class="m-metin">' + metin(m.metin) + '</span>';
    } else {
      const p = oyuncu(m.kim);
      li.className = 'mesaj' + (p.insan ? ' benim' : '');
      li.innerHTML = '<img src="' + avatar(p, 2) + '" alt=""><div class="m-govde"><b class="m-ad">' + kac(p.ad) + '</b><span class="m-metin">' + metin(m.metin) + '</span></div>';
      if (!D.atla) KK.Ses.mesaj();
    }
    $('#telsiz').appendChild(li);
    if (D.aktifSekme !== 'telsiz') { D.okunmamis++; okunmamisGoster(); }
    kaydir();
  }

  function kaydir() { const t = $('#telsiz-kutu'); t.scrollTop = t.scrollHeight; }
  function okunmamisGoster() {
    const r = $('#sekme-telsiz .rozet-sayi');
    r.textContent = D.okunmamis > 9 ? '9+' : D.okunmamis;
    r.hidden = D.okunmamis === 0;
  }

  function sozSecimGuncelle() {
    const s = $('#soz-hedef'); if (!s || !D.oyun) return;
    const once = s.value;
    s.innerHTML = D.oyun.canlilar().filter((p) => !p.insan).map((p) => '<option value="' + p.id + '">' + kac(p.ad) + '</option>').join('');
    if ([...s.options].some((o) => o.value === once)) s.value = once;
    const kapali = !benCanli() || D.oyun.bitti;
    $$('#soz-formu button, #soz-formu select').forEach((x) => { x.disabled = kapali; });
  }

  /* ---------- seyir defteri ---------- */
  const BEYAN_AD = { bastim: 'Bastım', zaten: 'Zaten yeşildi', tuhaf: 'Bastım, kırmızı oldu', basmadim: 'Basmadım' };
  function defterCiz() {
    const o = D.oyun;
    const p = $('#panel-defter');
    if (!o.kayit.length) { p.innerHTML = '<p class="bos-not">Seyir defteri ilk turla birlikte dolmaya başlar. Kim ne dedi, panel ne gösterdi, hepsi buraya yazılır.</p>'; return; }
    p.innerHTML = o.kayit.slice().reverse().map((t) => {
      const sat = [];
      for (const k of t.kabinler) {
        if (!k.soylenen) { sat.push(['Kabin', etiket(k.a) + ' & ' + etiket(k.b) + ' <em>bekleniyor</em>']); continue; }
        const benimki = k.duyulan[ben().id] != null ? ' <em class="ozel">(sen duydun: ' + kac(k.duyulan[ben().id]) + ')</em>' : '';
        sat.push(['Kabin', etiket(k.a) + ' <b>' + kac(k.soylenen[k.a]) + '</b> · ' + etiket(k.b) + ' <b>' + kac(k.soylenen[k.b]) + '</b> → <i class="sonuc s-' + k.sinif + '">' + { eslesme: 'Eşleşti', yakin: 'Yakın kelime', alakasiz: 'Alakasız' }[k.sinif] + '</i>' + benimki]);
      }
      if (t.salter && t.salter.yesil != null) {
        const s = t.salter;
        let ek = s.kisiler.map((id, i) => (i + 1) + '. ' + etiket(id) + ' <em>' + BEYAN_AD[s.beyan[id]] + '</em>').join(' · ');
        ek += ' → <i class="sonuc ' + (s.yesil === s.kisiler.length ? 's-eslesme' : 's-yakin') + '">Panel ' + s.yesil + '/' + s.kisiler.length + '</i>';
        if (s.bilinen) { const id = Object.keys(s.bilinen)[0]; ek += ' · Kamera: ' + etiket(Number(id)) + ' ' + (s.bilinen[id] === 'yesil' ? 'yeşil' : 'kırmızı'); }
        sat.push(['Şalter', ek]);
      }
      if (t.telefon) {
        if (t.telefon.iptal) sat.push(['Telefon', '<em>Hat kesikti</em>']);
        else if (t.telefon.bilgiler && t.telefon.bilgiler.some((b) => b.duyuru != null)) {
          sat.push(['Telefon', etiket(t.telefon.arayan) + ': ' + t.telefon.bilgiler.map((b) => '“' + metin(o.bilgiMetni(b, b.duyuru)) + '”').join(' ')]);
        }
      }
      if (t.kaptan) sat.push(['Karar', { kaptan: 'Kaptan', halk: 'Halk', alarm: 'Kızıl Alarm' }[t.kaptan.veren] + ': <b>' + (t.kaptan.karar === 'oylama' ? 'OYLAMA' : 'PAS') + '</b>']);
      if (t.oylama) {
        const oy = Object.keys(t.oylama.oylar).map((k) => etiket(Number(k)) + '→' + (t.oylama.oylar[k] == null ? '<em>çekimser</em>' : etiket(t.oylama.oylar[k]))).join(' ');
        sat.push(['Oylama', (t.oylama.atilan != null ? etiket(t.oylama.atilan) + ' atıldı' : '<em>Kimse atılmadı</em>') + '<span class="oy-dokum">' + oy + '</span>']);
      }
      if (t.gece) {
        const g = t.gece;
        sat.push(['Gece', g.tip === 'olum' ? etiket(g.olen) + ' öldürüldü' : g.tip === 'kurtarma' ? 'Saldırı püskürtüldü' : g.tip === 'karantina' ? 'Karantina: kimse ölmedi' : 'Sessiz gece, saldırı yok']);
      }
      return '<section class="defter-tur"><header><b>TUR ' + t.no + '</b><span>' + kac(t.olay.ad) + '</span><span class="o2-not">O₂ %' + t.o2Once + (t.o2Sonra != null ? ' → %' + t.o2Sonra : '') + '</span></header><dl>' +
        sat.map(([a, b]) => '<div><dt>' + a + '</dt><dd>' + b + '</dd></div>').join('') + '</dl></section>';
    }).join('');
  }

  /* ---------- ARIA ---------- */
  function ariaCiz() {
    const o = D.oyun; const p = $('#panel-aria');
    const z = o.ayar.zorluk;
    const ust = '<p class="aria-giris"><b>ARIA</b>, istasyonun taktik bilgisayarı. Sadece senin bildiklerini bilir ve her kanıtı olasılığa çevirir.</p>';
    if (z === 'zor') { p.innerHTML = ust + '<p class="bos-not">Zor seviyede ARIA devre dışı. Kızıl Usta olmak istiyorsan kendi aklına güven.</p>'; return; }
    if (D.hayalet) { p.innerHTML = ust + '<p class="bos-not">Hayalet modundasın; artık her şeyi görüyorsun.</p>'; return; }
    let veri = null; let not = '';
    if (z === 'kolay') { veri = anlik(); not = 'Kolay seviye: canlı analiz.'; }
    else if (D.ariaAnlik) { veri = D.ariaAnlik; not = 'Tur ' + veri.tur + ' analizi. Her tur 1 sorgu hakkın var.'; }
    const dugme = z === 'normal' ? '<button type="button" class="dugme ince" id="aria-sorgu"' + (D.ariaHak > 0 && !o.bitti ? '' : ' disabled') + '>Analiz çalıştır (' + D.ariaHak + ' hak)</button>' : '';
    if (!veri) { p.innerHTML = ust + dugme + '<p class="bos-not">Bu tur henüz sorgu yapmadın.</p>'; return; }
    p.innerHTML = ust + dugme + '<p class="aria-not">' + not + '</p><ul class="aria-liste">' + veri.satirlar.map((s) =>
      '<li><span class="aria-ad">' + etiket(s.id) + '</span><span class="aria-cubuk" title="Hain olasılığı"><i class="c-hain" style="width:' + s.hain + '%"></i></span><b class="aria-deger">%' + s.hain + '</b>' +
      '<span class="aria-cubuk ince" title="Halüsinatif olasılığı"><i class="c-hal" style="width:' + s.hal + '%"></i></span><b class="aria-deger hal">%' + s.hal + '</b></li>').join('') +
      '</ul><p class="aria-lejant"><i class="c-hain"></i> Hain olasılığı <i class="c-hal"></i> Halüsinatif olasılığı</p>';
  }

  function anlik() {
    const o = D.oyun; const m = ben().inanc;
    return {
      tur: o.tur,
      satirlar: o.canlilar().filter((p) => !p.insan).map((p) => ({ id: p.id, hain: yuzde(m.hain(p.id)), hal: yuzde(m.halusinatif(p.id)) }))
        .sort((a, b) => b.hain - a.hain)
    };
  }

  function panelleriYenile() { defterCiz(); ariaCiz(); }

  /* ---------- aşamalar ---------- */
  async function brifing() {
    fazAyarla('brifing');
    const b = ben(); const r = KK.ROLLER[b.gorunenRol];
    const o = D.oyun;
    const ekip = o.hainMi(b) ? o.ekip(b) : [];
    const ic = sahneKur('FISILTI KUTUSU', 'Kurucu sana rolünü fısıldıyor', 'Etrafına bak; kimse ekranını görmesin.',
      '<div class="rol-kart-sahne"><div class="rol-kart" id="rol-kart" data-takim="' + r.takim + '">' +
      '<div class="rk-yuz rk-on"><span class="rk-damga">GİZLİ</span><span class="rk-not">Fısıltı geliyor…</span></div>' +
      '<div class="rk-yuz rk-arka"><span class="rk-ust">' + kac(r.etiket) + '</span><img src="' + avatar(b, 5) + '" alt="" class="rk-avatar"><h3>' + kac(r.ad) + '</h3>' +
      '<p class="rk-kisa">' + kac(r.kisa) + '</p><p class="rk-guc">' + kac(r.guc) + '</p>' +
      (ekip.length ? '<p class="rk-ekip">Ekibin: ' + ekip.map((p) => etiket(p.id) + ' <em>' + KK.ROLLER[p.rol].ad + '</em>').join(', ') + '</p>' : '') +
      (b.gorunenRol === 'halusinatif' ? '<p class="rk-ekip">Lanetin gizli. Kabin mi Şalter mi? Algılarına tam güvenme.</p>' : '') +
      '</div></div></div><ul class="rk-ipucu">' + r.ipuclari.map((i) => '<li>' + kac(i) + '</li>').join('') + '</ul>');
    KK.Ses.fisilti();
    await bekle(900);
    $('#rol-kart', ic).classList.add('acik');
    D.rolGorunur = true; rolRozeti();
    o.mesaj(null, 'İstasyon KERBEROS-7: oksijen kritik. Kapsülde 3 koltuk var. Aramızda ' + (o.yanciSayisi + 1) + ' hain olduğu biliniyor.');
    await mesajlar();
    await devam('Göreve başla');
    D.rolGorunur = false; rolRozeti();
  }

  async function turBasi() {
    const o = D.oyun;
    const t = o.turBaslat();
    D.ariaHak = o.ayar.zorluk === 'normal' ? 1 : 0;
    D.ariaAnlik = null;
    fazAyarla('olay'); o2Goster(o.o2); ekipCiz(); panelleriYenile();
    sahneKur('TUR ' + t.no, 'İstasyon olayı', 'Her turun başında istasyonda bir şey olur.',
      '<div class="olay-kart t-' + t.olay.tip + '"><span class="olay-ust">OLAY KARTI · ' + { iyi: 'LEHTE', kotu: 'ALEYHTE', notr: 'NÖTR' }[t.olay.tip] + '</span><h3>' + kac(t.olay.ad) + '</h3><p>' + kac(t.olay.metin) + '</p></div>');
    if (t.olay.tip === 'kotu') KK.Ses.alarm(); else KK.Ses.bip();
    await mesajlar();
    await devam('Kabin turuna geç', { otomatik: D.hayalet ? 1500 : 0 });
  }

  async function kabinFazi() {
    const o = D.oyun; const no = D.oturum;
    fazAyarla('kabin');
    const kabinler = o.kabinHazirla();
    for (let i = 0; i < kabinler.length; i++) {
      const k = kabinler[i];
      const isaret = {}; isaret[k.a] = 'Kabinde'; isaret[k.b] = 'Kabinde';
      ekipCiz(isaret);
      const ic = sahneKur('1 · KABİN TURU', 'Teyit kabini' + (kabinler.length > 1 ? ' ' + (i + 1) + '/' + kabinler.length : ''),
        'Kurucu ikisine de bir şifre fısıldar. Masumlar aynı şeyi duyar, hainler farklı. İkisi aynı anda söyler.',
        '<div class="kabinler">' + kabinKutusu(k.a) + '<div class="kabin-orta"><span class="geri-sayim" id="geri-sayim" aria-live="polite"></span><span class="damga" id="kabin-damga" hidden></span></div>' + kabinKutusu(k.b) + '</div>');
      await mesajlar();
      guncel(no);
      await bekle(500);
      KK.Ses.fisilti();
      const benIcerde = benCanli() && (k.a === ben().id || k.b === ben().id) && !o.ayar.otomatik;
      let kelime = null;
      $$('.kabin-durum', ic).forEach((x) => { x.textContent = 'Şifreyi dinliyor…'; });
      if (benIcerde) {
        const duydugum = k.duyulan[ben().id];
        const balon = $('.kabin[data-id="' + ben().id + '"] .balon', ic);
        balon.hidden = false; balon.className = 'balon fisilti';
        balon.innerHTML = '<span>Fısıltı:</span> <b>' + kac(duydugum) + '</b>';
        kelime = await kelimeAl(duydugum);
      } else {
        await bekle(1300);
      }
      for (const s of ['3', '2', '1']) { $('#geri-sayim').textContent = s; KK.Ses.sayac(); await bekle(520); }
      $('#geri-sayim').textContent = '';
      const sonuc = o.kabinSoyle(i, kelime);
      for (const id of [k.a, k.b]) {
        const b = $('.kabin[data-id="' + id + '"] .balon', ic);
        b.hidden = false; b.className = 'balon soz'; b.innerHTML = '<b>' + kac(sonuc.soylenen[id]) + '</b>';
        $('.kabin[data-id="' + id + '"] .kabin-durum', ic).textContent = 'Söyledi';
      }
      const damga = $('#kabin-damga');
      damga.hidden = false;
      damga.className = 'damga d-' + sonuc.sinif;
      damga.textContent = { eslesme: 'EŞLEŞTİ', yakin: 'UYUŞMAZLIK', alakasiz: 'SANRI?' }[sonuc.sinif];
      sonuc.sinif === 'eslesme' ? KK.Ses.eslesme() : KK.Ses.uyusmazlik();
      panelleriYenile();
      await mesajlar();
      await devam(i < kabinler.length - 1 ? 'Sıradaki kabin' : 'Şalter odasına geç');
    }
  }

  function kabinKutusu(id) {
    const p = oyuncu(id);
    return '<div class="kabin" data-id="' + id + '"><div class="kabin-cam"><div class="balon" hidden></div><img class="kabin-avatar" src="' + avatar(p, 4) + '" alt=""></div>' +
      '<span class="kabin-ad">' + kac(p.ad) + (p.insan ? ' (sen)' : '') + '</span><span class="kabin-durum">Kabine girdi</span></div>';
  }

  function kelimeAl(duydugum) {
    const no = D.oturum;
    const hain = D.oyun.hainMi(ben());
    const e = eylemAlani('<form class="kelime-formu" id="kelime-formu" autocomplete="off"><label for="kelime-girdi">Ne söyleyeceksin?</label>' +
      '<div class="kelime-satir"><input id="kelime-girdi" maxlength="24" value="' + kac(duydugum) + '" spellcheck="false"><button class="dugme birincil" type="submit">3-2-1 Söyle</button></div>' +
      '<p class="kelime-ipucu">' + (hain
        ? 'Sen hain kelimesini duydun. Masumlar aynı kategoriden başka bir kelime duydu. Tahmin edip onu söyleyebilirsin.'
        : 'Duyduğun kelimeyi aynen söylemek en güvenlisi. Ama blöf de serbest.') + '</p></form>');
    const g = $('#kelime-girdi', e);
    g.focus({ preventScroll: true }); g.select();
    return new Promise((res, rej) => {
      $('#kelime-formu', e).addEventListener('submit', (ev) => {
        ev.preventDefault();
        const v = KK.normalize(g.value) || duydugum;
        e.innerHTML = '';
        no === D.oturum ? res(v) : rej(IPTAL);
      });
    });
  }

  async function salterFazi() {
    const o = D.oyun;
    fazAyarla('salter');
    const s = o.salterHazirla();
    const isaret = {}; s.kisiler.forEach((id, i) => { isaret[id] = 'Şalter ' + (i + 1); });
    ekipCiz(isaret);
    const ic = sahneKur('2 · ŞALTER ODASI', s.kisiler.length + ' kişi sırayla girer', 'Şalterler kırmızı başlar. Görev hepsini yeşile çevirmek. Panel sadece toplamı gösterir.',
      '<div class="salter-oda"><div class="ana-panel"><span class="etiket-kucuk">ANA PANEL</span><div class="ampuller">' + s.kisiler.map(() => '<i class="ampul"></i>').join('') +
      '</div><b class="panel-sayac" id="panel-sayac">? / ' + s.kisiler.length + '</b></div><div class="salterler">' +
      s.kisiler.map((id, i) => { const p = oyuncu(id); return '<div class="salter-slot" data-i="' + i + '"><span class="sira">' + (i + 1) + '</span><img src="' + avatar(p, 3) + '" alt=""><span class="slot-ad">' + kac(p.ad) + '</span><div class="slot-ic"><span class="slot-durum">Sırada</span></div><div class="beyan" hidden></div></div>'; }).join('') +
      '</div></div>');
    await mesajlar();
    let insanSonuc = null;
    for (let i = 0; i < s.kisiler.length; i++) {
      const id = s.kisiler[i];
      const slot = $('.salter-slot[data-i="' + i + '"]', ic);
      slot.classList.add('iceride');
      $('.slot-durum', slot).textContent = 'İçeride…';
      if (id === ben().id && benCanli() && !o.ayar.otomatik) insanSonuc = await salterEtkilesim(slot);
      else { await bekle(850); KK.Ses.tik(); }
      slot.classList.remove('iceride'); slot.classList.add('cikti');
      $('.slot-ic', slot).innerHTML = '<span class="slot-durum">Çıktı</span>';
    }
    const sonuc = o.salterUygula(insanSonuc);
    const ampuller = $$('.ampul', ic);
    for (let j = 0; j < ampuller.length; j++) {
      const yesil = j < sonuc.yesil;
      ampuller[j].classList.add(yesil ? 'yesil' : 'kirmizi');
      KK.Ses.salter(yesil);
      await bekle(380);
    }
    $('#panel-sayac').textContent = sonuc.yesil + ' / ' + sonuc.kisiler.length + ' YEŞİL';
    $('#panel-sayac').classList.add(sonuc.yesil === sonuc.kisiler.length ? 'tam' : 'eksik');
    sonuc.kisiler.forEach((id, i) => {
      const b = $('.salter-slot[data-i="' + i + '"] .beyan', ic);
      b.hidden = false; b.textContent = '“' + BEYAN_AD[sonuc.beyan[id]] + '”';
      if (sonuc.bilinen && sonuc.bilinen[id]) {
        const slot = $('.salter-slot[data-i="' + i + '"]', ic);
        slot.classList.add('kamera', sonuc.bilinen[id] === 'yesil' ? 'k-yesil' : 'k-kirmizi');
        $('.slot-ic', slot).innerHTML = '<span class="kamera-not">KAMERA: ' + (sonuc.bilinen[id] === 'yesil' ? 'YEŞİL' : 'KIRMIZI') + '</span>';
      }
    });
    panelleriYenile();
    await mesajlar();
    await devam('Telefona geç');
  }

  function salterEtkilesim(slot) {
    const no = D.oturum;
    const b = ben();
    const lanetli = b.rol === 'halusinatif' && b.lanet === 1;
    let gercek = 'kirmizi'; let cevirme = 0;
    const gorunen = () => (lanetli ? (gercek === 'kirmizi' ? 'yesil' : 'kirmizi') : gercek);
    const ic = $('.slot-ic', slot);
    ic.innerHTML = '<button type="button" class="kol-kutu" id="kol" aria-label="Şalteri çevir"><i class="lamba"></i><span class="kol"></span></button>';
    const ciz = () => {
      const g = gorunen();
      const kol = $('#kol', ic);
      kol.dataset.renk = g;
      kol.setAttribute('aria-pressed', g === 'yesil' ? 'true' : 'false');
    };
    ciz();
    const hain = D.oyun.hainMi(b);
    const e = eylemAlani('<div class="salter-eylem"><p class="secim-soru" id="salter-not">' +
      (gorunen() === 'yesil' ? 'Şalterin <b class="r-yesil">YEŞİL</b> görünüyor. Garip, kırmızı başlaması gerekiyordu.' : 'Şalterin <b class="r-kirmizi">KIRMIZI</b>. Kola tıklayıp çevirebilirsin.') +
      (hain ? ' Hain olarak kırmızı bırakabilirsin; her kırmızı şalter oksijeni %' + KK.O2.KIRMIZI + ' daha düşürür.' : '') +
      '</p><button type="button" class="dugme birincil" id="salter-cik">Odadan çık</button></div>');
    return new Promise((res, rej) => {
      $('#kol', ic).addEventListener('click', () => {
        gercek = gercek === 'kirmizi' ? 'yesil' : 'kirmizi'; cevirme++;
        KK.Ses.salter(gorunen() === 'yesil');
        ciz();
        $('#salter-not', e).innerHTML = 'Şalterin şu an <b class="r-' + gorunen() + '">' + (gorunen() === 'yesil' ? 'YEŞİL' : 'KIRMIZI') + '</b> görünüyor.';
      });
      $('#salter-cik', e).addEventListener('click', async () => {
        KK.Ses.tik();
        $('#kol', ic).disabled = true;
        const g = gorunen();
        const oneri = cevirme === 0 ? (g === 'yesil' ? 'zaten' : 'basmadim') : g === 'yesil' ? 'bastim' : 'tuhaf';
        const secenek = ['bastim', 'zaten', 'tuhaf', 'basmadim'].map((k) => ({ etiket: BEYAN_AD[k] + (k === oneri ? ' <small>(gördüğün)</small>' : ''), deger: k, birincil: k === oneri }));
        try {
          const beyan = await secenekSor('Çıkınca herkese ne söyleyeceksin?', secenek);
          no === D.oturum ? res({ renk: gercek, beyan }) : rej(IPTAL);
        } catch (err) { rej(err); }
      });
    });
  }

  async function telefonFazi() {
    const o = D.oyun;
    fazAyarla('telefon');
    ekipCiz();
    if (!o.telefonVar()) {
      o.telefonSecimi();
      sahneKur('3 · TELEFON', 'Hat kesik', 'Radyo paraziti yüzünden bu tur istihbarat yok.',
        '<div class="telefon-sahne"><div class="telefon-cihaz kesik" aria-hidden="true"><span class="ahize"></span><span class="tus-takimi"></span></div><p class="telex">HAT KESİK · ··· ·· ·</p></div>');
      panelleriYenile(); await mesajlar();
      await devam('Kaptan\'ın kararına geç');
      return;
    }
    const ic = sahneKur('3 · TELEFON', 'Telefon çalıyor', 'Halk telefonu kimin açacağını seçer. Kurucu ona net bir bilgi verir; o da herkese duyurur. Doğru mu duyurur, orası ona kalmış.',
      '<div class="telefon-sahne"><div class="telefon-cihaz caliyor" id="telefon" aria-hidden="true"><span class="ahize"></span><span class="tus-takimi"></span></div><div class="telefon-sag" id="telefon-sag"></div></div>');
    KK.Ses.zil();
    let oy = null;
    if (benCanli() && !o.ayar.otomatik) oy = await kisiSec(o.canlilar().filter((p) => !p.insan), 'Telefonu kim açsın? En güvendiğin kişiyi seç.');
    else await bekle(900);
    const tel = o.telefonSecimi(oy);
    $('#telefon-sag', ic).innerHTML = '<p class="etiket-kucuk">HALKIN SEÇİMİ</p><ul class="mini-sayim">' +
      Object.keys(tel.sayim).sort((a, b) => tel.sayim[b] - tel.sayim[a]).map((id) => '<li>' + etiket(Number(id)) + '<b>' + tel.sayim[id] + ' oy</b></li>').join('') + '</ul>';
    await mesajlar();
    $('#telefon', ic).classList.remove('caliyor');
    $('#telefon', ic).classList.add('acik');
    let duyurular = null;
    if (tel.arayan === ben().id && benCanli() && !o.ayar.otomatik) {
      duyurular = [];
      for (let i = 0; i < tel.bilgiler.length; i++) {
        const b = tel.bilgiler[i];
        $('#telefon-sag', ic).innerHTML = '<p class="etiket-kucuk">HATTAKİ SES' + (tel.bilgiler.length > 1 ? ' · ' + (i + 1) + '/' + tel.bilgiler.length : '') + '</p><p class="telex gizli-bilgi">' + metin(o.bilgiMetni(b, b.gercek)) + '</p>';
        const sec = o.secenekler(b).map((d) => ({
          etiket: (d === b.gercek ? 'Olduğu gibi: ' : 'Çarpıt: ') + metin(o.bilgiMetni(b, d)),
          deger: d, birincil: d === b.gercek, tehlike: d !== b.gercek
        }));
        duyurular.push(await secenekSor('Herkese ne duyuracaksın?', sec));
      }
    } else {
      $('#telefon-sag', ic).insertAdjacentHTML('beforeend', '<p class="telefon-dinliyor">' + etiket(tel.arayan) + ' ahizeyi kaldırdı, dinliyor…</p>');
      await bekle(1500);
    }
    o.telefonDuyur(duyurular);
    $('#telefon-sag', ic).innerHTML = '<p class="etiket-kucuk">DUYURU · ' + kac(oyuncu(tel.arayan).ad) + '</p>' +
      tel.bilgiler.map((b) => '<p class="telex">' + metin(o.bilgiMetni(b, b.duyuru)) + '</p>').join('');
    KK.Ses.bip();
    panelleriYenile();
    await mesajlar();
    await devam('Kaptan\'ın kararına geç');
  }

  async function kaptanFazi() {
    const o = D.oyun;
    fazAyarla('kaptan');
    ekipCiz();
    const t = o.aktif(); const kap = o.kaptan();
    const ic = sahneKur('4 · KAPTAN\'IN KARARI', 'Tartışma ve karar', 'Telsizden suçlayabilir ya da savunabilirsin. Sonra Gizli Kaptan oylama açılıp açılmayacağına karar verir.',
      '<div class="kaptan-konsol"><div class="kol-yuva"><span class="ky-etiket">PAS</span><span class="buyuk-kol" id="buyuk-kol" data-durum="orta"><i></i></span><span class="ky-etiket">OYLAMA</span></div>' +
      '<dl class="kaptan-bilgi"><div><dt>Kaptan yetkisi</dt><dd>' + (o.kaptanYetki ? 'Kazanıldı · finalde 1. koltuk Kaptan\'ın' : 'Henüz kazanılmadı') + '</dd></div>' +
      '<div><dt>PAS</dt><dd>Kimse elenmez, gece kimse ölmez.</dd></div><div><dt>OYLAMA</dt><dd>En çok oyu alan atılır. Gece Suikastçı 1 kişiyi öldürebilir.</dd></div></dl></div>');
    o.kaptanTartisma();
    await mesajlar();
    if (benCanli() && !o.ayar.otomatik) await devam('Tartışmayı bitir');
    let karar = null;
    if (t.olay.id === 'kizil_alarm') { await bekle(400); }
    else if (kap.durum === 'canli' && kap.insan && !o.ayar.otomatik) {
      karar = await secenekSor('Sen Gizli Kaptan\'sın. Kararın ne? ' + (o.kaptanYetki ? '' : 'Oylama açarsan finalde 1. koltuğu sen seçersin.'), [
        { etiket: 'PAS GEÇİYORUM', deger: 'pas' }, { etiket: 'OYLAMA BAŞLAT', deger: 'oylama', birincil: true }]);
    } else if (kap.durum !== 'canli' && benCanli() && !o.ayar.otomatik) {
      karar = await secenekSor('Kaptan hayatta değil. Karar halkın. Senin oyun?', [
        { etiket: 'Pas geçelim', deger: 'pas' }, { etiket: 'Oylama yapalım', deger: 'oylama', birincil: true }]);
    } else {
      eylemAlani('<p class="eylem-not bekleyen">Gizli Kaptan düşünüyor…</p>');
      await bekle(1600);
      eylemAlani('');
    }
    const k = o.kaptanKarar(karar);
    $('#buyuk-kol', ic).dataset.durum = k.karar;
    k.karar === 'oylama' ? KK.Ses.alarm() : KK.Ses.bip();
    $('.kaptan-bilgi dd', ic).textContent = o.kaptanYetki ? 'Kazanıldı · finalde 1. koltuk Kaptan\'ın' : 'Henüz kazanılmadı';
    panelleriYenile();
    await mesajlar();
    if (k.karar === 'oylama') { await devam('Sandığa geç'); await oylamaFazi(); await geceFazi(); }
    else await devam('Turu bitir');
  }

  async function oylamaFazi() {
    const o = D.oyun;
    fazAyarla('oylama');
    const canli = o.canlilar();
    const ic = sahneKur('SANDIK', 'Oylama', 'En çok oyu alan hava kilidinden atılır. Beraberlikte kimse atılmaz. Kimse kendine oy veremez.',
      '<div class="sandik"><ul class="sayim-tablo" id="sayim">' + canli.map((p) => '<li data-id="' + p.id + '">' + etiket(p.id) + '<span class="sayim-cubuk"><i style="width:0"></i></span><b>0</b></li>').join('') + '</ul><ol class="oy-akisi" id="oy-akisi"></ol></div>');
    let oy;
    if (benCanli() && !o.ayar.otomatik) oy = await kisiSec(canli.filter((p) => !p.insan), 'Oyunu kime veriyorsun?', { cekimser: true });
    const sonuc = o.oylamaYap(benCanli() && !o.ayar.otomatik ? oy : undefined);
    const sayac = {};
    const toplam = canli.length;
    for (const voter of Object.keys(sonuc.oylar)) {
      const hedef = sonuc.oylar[voter];
      $('#oy-akisi', ic).insertAdjacentHTML('beforeend', '<li>' + etiket(Number(voter)) + ' → ' + (hedef == null ? '<em>çekimser</em>' : etiket(hedef)) + '</li>');
      if (hedef != null) {
        sayac[hedef] = (sayac[hedef] || 0) + 1;
        const li = $('#sayim li[data-id="' + hedef + '"]', ic);
        $('i', li).style.width = (100 * sayac[hedef] / toplam) + '%';
        $('b', li).textContent = sayac[hedef];
      }
      KK.Ses.oy();
      await bekle(300);
    }
    if (sonuc.atilan != null) {
      const p = oyuncu(sonuc.atilan);
      $('#sahne-icerik').insertAdjacentHTML('beforeend', '<div class="hava-kilidi"><img src="' + avatar(p, 4) + '" alt=""><p>' + kac(p.ad) + ' hava kilidinden atılıyor…</p></div>');
      KK.Ses.kilit();
      await bekle(1800);
    } else KK.Ses.bip();
    ekipCiz(); panelleriYenile();
    await mesajlar();
    if (sonuc.atilan === ben().id) await hayaletBasla('Halk seni hava kilidinden attı.');
    await devam(o.geceVar() ? 'Geceye geç' : 'Turu bitir');
  }

  async function geceFazi() {
    const o = D.oyun;
    if (!o.geceVar()) return;
    fazAyarla('gece');
    const t = o.aktif();
    $('#sahne').classList.add('karanlik');
    const ic = sahneKur('GECE', 'Işıklar söndü', t.olay.id === 'karantina' ? 'Karantina kapıları kilitli. Bu gece kimse kimseye ulaşamaz.' : 'Oylama yapıldığı için güvenlik duvarı kalktı. Suikastçı iş başında.',
      '<div class="gece-sahne"><div class="gece-ay" aria-hidden="true"></div><p class="gece-not" id="gece-not">İstasyon karanlık. Koridorlarda ayak sesleri…</p></div>');
    kalpBaslat();
    const b = ben();
    let hedef = null, koruma = null;
    try {
      if (t.olay.id !== 'karantina' && benCanli() && !o.ayar.otomatik) {
        if (b.rol === 'medik') {
          koruma = await kisiSec(o.canlilar().filter((p) => p !== b && p.id !== o.sonKorunan), 'Bu gece kimi koruyacaksın? (Aynı kişiyi üst üste koruyamazsın.)');
        }
        if (b.rol === 'suikastci') {
          hedef = await kisiSec(o.canlilar().filter((p) => !o.hainMi(p)), 'Bu gece kimi susturacaksın?', { tehlike: true });
        }
      }
      await bekle(1800);
    } finally { kalpDurdur(); }
    const g = o.geceYap(hedef, koruma);
    $('#sahne').classList.remove('karanlik');
    const not = $('#gece-not', ic);
    if (g && g.tip === 'olum') {
      const p = oyuncu(g.olen);
      not.innerHTML = 'Sabah oldu. ' + etiket(p.id) + ' ölü bulundu. Kimliği: <b>' + kac(KK.ROLLER[p.rol].ad) + '</b>';
      KK.Ses.patlama();
    } else if (g && g.tip === 'kurtarma') { not.textContent = 'Sabah oldu. Bir saldırı püskürtüldü; Medik kurbanı kurtardı.'; KK.Ses.eslesme(); }
    else if (g && g.tip === 'karantina') { not.textContent = 'Sabah oldu. Karantina sayesinde kimse ölmedi.'; KK.Ses.bip(); }
    else { not.textContent = 'Sabah oldu. Gece sessiz geçti. Hiç saldırı olmadı… Suikastçı hâlâ aramızda mı?'; KK.Ses.bip(); }
    ekipCiz(); panelleriYenile();
    await mesajlar();
    if (g && g.olen === ben().id) await hayaletBasla('Suikastçı gece seni buldu.');
    await devam('Turu bitir');
  }

  function kalpBaslat() { kalpDurdur(); if (D.atla) return; KK.Ses.kalp(); kalpZamanlayici = setInterval(() => KK.Ses.kalp(), 1150); }
  function kalpDurdur() { if (kalpZamanlayici) clearInterval(kalpZamanlayici); kalpZamanlayici = null; }

  async function turSonu() {
    const o = D.oyun;
    const t = o.turBitir();
    fazAyarla('gece');
    const satirlar = ['Taban tüketim: %' + KK.O2.TABAN];
    if (t.kirmizi) satirlar.push(t.kirmizi + ' kırmızı şalter: %' + (t.kirmizi * KK.O2.KIRMIZI));
    if (t.olay.id === 'sizinti') satirlar.push('Oksijen sızıntısı: %' + KK.O2.OLAY);
    if (t.olay.id === 'yedek_tup') satirlar.push('Yedek tüp: −%' + KK.O2.OLAY);
    sahneKur('TUR ' + t.no + ' SONU', 'Oksijen raporu', '',
      '<div class="o2-rapor"><div class="o2-buyuk"><span>%' + t.o2Once + '</span><b id="o2-sayac">%' + t.o2Once + '</b></div><ul>' + satirlar.map((s) => '<li>' + kac(s) + '</li>').join('') + '</ul></div>');
    const adim = Math.max(1, Math.round((t.o2Once - t.o2Sonra) / 12));
    for (let v = t.o2Once; v > t.o2Sonra; v -= adim) { $('#o2-sayac').textContent = '%' + v; o2Goster(Math.max(t.o2Sonra, v)); await bekle(45); }
    $('#o2-sayac').textContent = '%' + t.o2Sonra; o2Goster(t.o2Sonra);
    if (t.o2Sonra <= 30) KK.Ses.alarm();
    panelleriYenile();
    await mesajlar();
    if (o.bitti) return;
    if (o.finalBekliyor) {
      $('#sahne-alt').textContent = o.finalNedeni === 'oksijen' ? 'Oksijen tükendi. Son fırlatma penceresi açıldı.' : 'İstasyonda çok az kişi kaldı. Kapsül hazır.';
      await devam('Fırlatma anına geç');
      return;
    }
    await devam('Tur ' + (o.tur + 1) + ' başlasın');
  }

  async function finalFazi() {
    const o = D.oyun;
    fazAyarla('final');
    $('#hud-fazlar').innerHTML = '<li class="aktif">Fırlatma</li>';
    const f = o.finalHazirla();
    ekipCiz(); panelleriYenile();
    const canli = o.canlilar();
    const ic = sahneKur('FIRLATMA ANI', canli.length + ' kişi, 3 koltuk', 'Kapsüldeki 3 kişi de temizse mürettebat kazanır. İçeride tek bir hain varsa kapsül patlar.',
      '<div class="kapsul-sahne"><div class="kapsul" id="kapsul"><div class="kapsul-govde">' + [0, 1, 2].map((i) => '<div class="koltuk" data-k="' + i + '"><span>' + (i + 1) + '</span></div>').join('') +
      '</div><div class="kapsul-alev" aria-hidden="true"></div></div><div class="kalanlar" id="kalanlar">' + canli.map((p) => '<span data-id="' + p.id + '">' + etiket(p.id) + '</span>').join('') + '</div></div>');
    await mesajlar();
    const koltukDoldur = async () => {
      for (let i = 0; i < f.koltuklar.length; i++) {
        const k = $('.koltuk[data-k="' + i + '"]', ic);
        if (k.dataset.dolu) continue;
        const p = oyuncu(f.koltuklar[i]);
        k.dataset.dolu = '1';
        k.innerHTML = '<img src="' + avatar(p, 3) + '" alt=""><em>' + kac(p.ad) + '</em>';
        const yer = $('#kalanlar span[data-id="' + p.id + '"]', ic); if (yer) yer.classList.add('bindi');
        KK.Ses.salter(true);
        await bekle(450);
      }
    };
    await koltukDoldur();
    if (f.yetki && !f.koltuklar.length) {
      let secim = null;
      const kap = o.kaptan();
      if (kap.insan && benCanli() && !o.ayar.otomatik) secim = await kisiSec(canli, 'Kaptan olarak 1. koltuğa kimi alıyorsun? (Kendini de seçebilirsin.)');
      else await bekle(1200);
      o.finalKaptanSecim(secim);
      await mesajlar(); await koltukDoldur();
    }
    if (f.koltuklar.length < 3) {
      const bos = 3 - f.koltuklar.length;
      const adaylar = o.canlilar().filter((p) => !f.koltuklar.includes(p.id));
      let secimler = null;
      const benAday = adaylar.filter((p) => !p.insan);
      if (adaylar.length > bos && benCanli() && !o.ayar.otomatik) secimler = await cokluSec(benAday, Math.min(bos, benAday.length), 'Halk oylaması: kalan ' + bos + ' koltuğa kimleri istiyorsun? (Kendine oy veremezsin.)');
      o.finalOylama(secimler);
      if (f.sayim) {
        o.mesaj(null, 'Halk oylaması: ' + Object.keys(f.sayim).sort((a, b) => f.sayim[b] - f.sayim[a]).map((id) => '@[' + id + '] ' + f.sayim[id]).join(' · '));
      }
      await mesajlar(); await koltukDoldur();
    }
    await devam('FIRLAT');
    o.finalSonuc();
    await mesajlar();
    await firlatma(o.sonuc.kazanan === 'masum', ic);
  }

  async function firlatma(temiz, ic) {
    const kapsul = $('#kapsul', ic) || $('#kapsul');
    eylemAlani('<p class="geri-sayim-buyuk" id="firlatma-sayac"></p>');
    for (const s of ['3', '2', '1']) { $('#firlatma-sayac').textContent = s; KK.Ses.sayac(); await bekle(650); }
    $('#firlatma-sayac').textContent = 'ATEŞLEME';
    if (kapsul) kapsul.classList.add('atesleme');
    KK.Ses.kalkis();
    await bekle(1500);
    if (temiz) { if (kapsul) kapsul.classList.add('kalkis'); KK.Ses.zafer(); }
    else { if (kapsul) kapsul.classList.add('patlama'); $('#sahne').classList.add('sarsinti'); KK.Ses.patlama(); }
    await bekle(2200);
    $('#sahne').classList.remove('sarsinti');
  }

  async function erkenBitis() {
    const o = D.oyun;
    const temiz = o.sonuc.kazanan === 'masum';
    fazAyarla('final');
    const ic = sahneKur('OYUN BİTTİ', temiz ? 'Hainler etkisiz' : 'Temiz koltuk kalmadı', temiz ? 'İstasyonda hain kalmadı. Hayatta kalanlar kapsüle güvenle biniyor.' : 'Masumların sayısı üç koltuğu dolduramayacak kadar azaldı.',
      '<div class="kapsul-sahne"><div class="kapsul" id="kapsul"><div class="kapsul-govde">' + [0, 1, 2].map((i) => '<div class="koltuk" data-k="' + i + '"><span>' + (i + 1) + '</span></div>').join('') + '</div><div class="kapsul-alev" aria-hidden="true"></div></div></div>');
    if (temiz) {
      const koltuk = o.canlilar().slice(0, 3);
      koltuk.forEach((p, i) => { const k = $('.koltuk[data-k="' + i + '"]', ic); k.innerHTML = '<img src="' + avatar(p, 3) + '" alt=""><em>' + kac(p.ad) + '</em>'; });
      await bekle(600);
      await firlatma(true, ic);
    } else {
      KK.Ses.yenilgi();
      await bekle(1400);
    }
  }

  /* ---------- hayalet modu ---------- */
  async function hayaletBasla(neden) {
    if (D.hayalet) return;
    D.hayalet = true;
    const s = $('#hayalet-serit');
    s.hidden = false;
    $('#hayalet-neden').textContent = neden;
    sozSecimGuncelle(); ekipCiz(); ariaCiz();
    KK.Ses.yenilgi();
    await bekle(400);
  }

  /* ---------- sonuç ve kara kutu ---------- */
  async function sonucEkrani() {
    const o = D.oyun;
    D.hayalet = false;
    $('#hayalet-serit').hidden = true;
    fazAyarla('final');
    $('#hud-fazlar').innerHTML = '<li class="aktif">Kara Kutu</li>';
    const b = ben();
    const kazandim = o.takim(b) === o.sonuc.kazanan;
    const yeni = KK.Rozet.degerlendir(o);
    ekipCiz(); panelleriYenile(); sozSecimGuncelle();
    const ic = sahneKur('KARA KUTU', o.sonuc.kazanan === 'masum' ? 'MÜRETTEBAT KAZANDI' : 'HAİNLER KAZANDI',
      kac(NEDEN_METNI[o.sonuc.neden + (o.sonuc.kazanan === 'masum' ? '+' : '-')] || '') + ' ' + (kazandim ? 'Takımın kazandı.' : 'Takımın kaybetti.') + ' Gerçek rolün: <b>' + kac(KK.ROLLER[b.rol].ad) + '</b>' + (b.rol !== b.gorunenRol ? ' (kendini Mürettebat sanıyordun!)' : '') + '.',
      karaKutuHtml(o, yeni));
    $('#sahne').dataset.sonuc = o.sonuc.kazanan;
    kazandim ? KK.Ses.zafer() : KK.Ses.yenilgi();
    await mesajlar();
    const e = eylemAlani('<div class="secenekler"><button type="button" class="dugme birincil" id="tekrar">Aynı ayarlarla tekrar</button><button type="button" class="dugme" id="ayarlar">Ayarları değiştir</button><a class="dugme" href="#ana">Ana sayfa</a></div>');
    $('#tekrar', e).addEventListener('click', () => baslat(D.ayar));
    $('#ayarlar', e).addEventListener('click', () => { location.hash = '#oyna'; });
    ic.querySelectorAll('.kk-sekme').forEach((x) => x.addEventListener('click', () => {
      ic.querySelectorAll('.kk-sekme').forEach((y) => y.setAttribute('aria-selected', y === x ? 'true' : 'false'));
      ic.querySelectorAll('.kk-panel').forEach((y) => { y.hidden = y.dataset.panel !== x.dataset.panel; });
    }));
  }

  const NEDEN_METNI = {
    'temizlik+': 'Bütün hainler etkisiz hale getirildi.',
    'azinlik-': 'İstasyonda 3 temiz kişi kalmadı.',
    'final+': 'Kapsüldeki üç kişi de temizdi.',
    'final-': 'Kapsülde hain vardı.'
  };

  function karaKutuHtml(o, yeniRozetler) {
    const kader = (p) => {
      if (o.sonuc.koltuklar && o.sonuc.koltuklar.includes(p.id)) return o.sonuc.kazanan === 'masum' ? 'Kapsülle kurtuldu' : 'Kapsülde infilak';
      if (p.durum === 'oldu') return 'Tur ' + p.cikisTur + ' gecesi öldürüldü';
      if (p.durum === 'atildi') return 'Tur ' + p.cikisTur + ' atıldı';
      return o.sonuc.neden === 'temizlik' && o.sonuc.kazanan === 'masum' ? 'Kurtuldu' : 'İstasyonda kaldı';
    };
    const dogruOy = {};
    for (const t of o.kayit) if (t.oylama) for (const k in t.oylama.oylar) {
      const h = t.oylama.oylar[k]; if (h == null) continue;
      if (!o.hainMi(o.oyuncular[k]) && o.hainMi(o.oyuncular[h])) dogruOy[k] = (dogruOy[k] || 0) + 1;
    }
    const keskin = Object.keys(dogruOy).sort((a, b) => dogruOy[b] - dogruOy[a])[0];
    let yalanlar = 0;
    const turlar = o.kayit.map((t) => {
      const sat = [];
      for (const k of t.kabinler) {
        if (!k.soylenen) continue;
        const kisi = (id) => {
          const yalan = k.soylenen[id] !== k.duyulan[id];
          if (yalan) yalanlar++;
          const sanri = k.duyulan[id] === k.sanriK;
          return etiket(id) + ' duydu <b>' + kac(k.duyulan[id]) + '</b>' + (sanri ? ' <i class="kk-hal">sanrı</i>' : '') + ', söyledi <b>' + kac(k.soylenen[id]) + '</b>' + (yalan ? ' <i class="kk-yalan">YALAN</i>' : '');
        };
        sat.push(['Kabin', 'Kategori: ' + kac(k.kategori) + ' · masum: <b>' + kac(k.masumK) + '</b>, hain: <b>' + kac(k.hainK) + '</b><br>' + kisi(k.a) + '<br>' + kisi(k.b)]);
      }
      if (t.salter && t.salter.yesil != null) {
        sat.push(['Şalter', t.salter.kisiler.map((id) => {
          const r = t.salter.renk[id]; const by = t.salter.beyan[id];
          const yalan = o.hainMi(o.oyuncular[id]) && r === 'kirmizi' && by !== 'basmadim';
          if (yalan) yalanlar++;
          return etiket(id) + ' <i class="kk-renk r-' + r + '">' + (r === 'yesil' ? 'yeşil' : 'kırmızı') + '</i> “' + BEYAN_AD[by] + '”' + (yalan ? ' <i class="kk-yalan">SABOTAJ</i>' : '');
        }).join('<br>')]);
      }
      if (t.telefon && t.telefon.bilgiler) {
        sat.push(['Telefon', t.telefon.bilgiler.filter((b) => b.duyuru != null).map((b) => {
          if (b.yalan) yalanlar++;
          return 'Gerçek: ' + metin(o.bilgiMetni(b, b.gercek)) + (b.yalan ? '<br>Duyurulan: ' + metin(o.bilgiMetni(b, b.duyuru)) + ' <i class="kk-yalan">ÇARPITILDI</i>' : ' <i class="kk-dogru">doğru duyuruldu</i>');
        }).join('<br>')]);
      }
      if (t.gece && t.gece.hedef != null) sat.push(['Gece', 'Suikastçı hedefi: ' + etiket(t.gece.hedef) + (t.gece.tip === 'kurtarma' ? ' (Medik kurtardı)' : '')]);
      return '<section class="defter-tur"><header><b>TUR ' + t.no + '</b><span>' + kac(t.olay.ad) + '</span></header><dl>' + sat.map(([a, b]) => '<div><dt>' + a + '</dt><dd>' + b + '</dd></div>').join('') + '</dl></section>';
    }).join('');
    const kadro = '<table class="kk-tablo"><thead><tr><th>Mürettebat</th><th>Rol</th><th>Kader</th><th>Doğru oy</th></tr></thead><tbody>' +
      o.oyuncular.map((p) => '<tr class="t-' + o.takim(p) + '"><td>' + etiket(p.id) + '</td><td><i class="rol-cip t-' + o.takim(p) + '">' + kac(KK.ROLLER[p.rol].ad) + '</i>' +
        (p.rol === 'halusinatif' ? ' <small>' + (p.lanet ? 'Şalter laneti' : 'Kabin laneti') + '</small>' : '') + '</td><td>' + kac(kader(p)) + '</td><td class="sayi">' + (dogruOy[p.id] || 0) + '</td></tr>').join('') + '</tbody></table>';
    const istat = '<ul class="kk-istat"><li><b>' + o.tur + '</b><span>tur oynandı</span></li><li><b>%' + o.o2 + '</b><span>oksijen kaldı</span></li><li><b>' + yalanlar + '</b><span>yalan ve sabotaj</span></li><li><b>' + (keskin != null ? kac(oyuncu(Number(keskin)).ad) : '—') + '</b><span>en keskin göz</span></li></ul>';
    const rozet = yeniRozetler.length ? '<div class="kk-rozetler"><p class="etiket-kucuk">YENİ ROZET</p>' + yeniRozetler.map((r) => '<span class="rozet-yama"><b>' + kac(r.ad) + '</b><small>' + kac(r.kosul) + '</small></span>').join('') + '</div>' : '';
    return istat + rozet + '<div class="kk-sekmeler" role="tablist"><button type="button" class="kk-sekme" role="tab" aria-selected="true" data-panel="kadro">Kimlikler</button><button type="button" class="kk-sekme" role="tab" aria-selected="false" data-panel="gercek">Gerçek kayıt</button></div>' +
      '<div class="kk-panel tablo-kutu" data-panel="kadro">' + kadro + '</div><div class="kk-panel" data-panel="gercek" hidden>' + turlar + '</div>';
  }

  /* ---------- ana döngü ---------- */
  async function dongu() {
    const o = D.oyun;
    try {
      await brifing();
      while (!o.bitti && !o.finalBekliyor) {
        if (D.atla) { o.turuOynat(); continue; }
        await turBasi();
        await kabinFazi();
        await salterFazi();
        await telefonFazi();
        await kaptanFazi();
        await turSonu();
      }
      if (!o.bitti && o.finalBekliyor) {
        if (D.atla) { o.finalHazirla(); o.finalKaptanSecim(); o.finalOylama(); o.finalSonuc(); }
        else await finalFazi();
      } else if (!D.atla) await erkenBitis();
      D.atla = false;
      await sonucEkrani();
    } catch (e) {
      if (e === IPTAL) return;
      console.error(e);
      eylemAlani('<p class="eylem-not">Beklenmedik bir hata oldu: ' + kac(e.message || e) + '. Ana sayfadan yeni bir oyun başlatabilirsin.</p>');
    }
  }

  function baslat(ayar) {
    D.oturum++;
    D.ayar = Object.assign({}, ayar, { tohum: undefined });
    D.oyun = new KK.Oyun(Object.assign({}, ayar, { tohum: (Date.now() ^ (Math.random() * 1e9)) >>> 0 }));
    D.sonMesaj = 0; D.etiketler = {}; D.hayalet = false; D.atla = false; D.rolGorunur = false; D.okunmamis = 0; D.ariaAnlik = null; D.ariaHak = 0;
    D.hiz = ayar.hiz === 'hizli' ? 0.5 : 1;
    akis = Promise.resolve();
    kalpDurdur();
    $('#telsiz').innerHTML = '';
    $('#hayalet-serit').hidden = true;
    $('#sahne').classList.remove('karanlik', 'sarsinti');
    delete $('#sahne').dataset.sonuc;
    $('#hud-hiz').textContent = D.hiz === 1 ? '1×' : '2×';
    sekmeAc('telsiz');
    okunmamisGoster();
    KK.Uygulama.goster('oyun');
    KK.Ses.uyandir();
    o2Goster(100); rolRozeti(); ekipCiz(); panelleriYenile();
    dongu();
  }

  function cik() {
    D.oturum++;
    kalpDurdur();
    D.oyun = null;
  }

  function sekmeAc(ad) {
    D.aktifSekme = ad;
    $$('.yan .sekme').forEach((s) => s.setAttribute('aria-selected', s.dataset.sekme === ad ? 'true' : 'false'));
    $$('.yan .sekme-panel').forEach((p) => { p.hidden = p.id !== 'panel-' + ad; });
    if (ad === 'telsiz') { D.okunmamis = 0; okunmamisGoster(); kaydir(); }
    if (ad === 'aria' && D.oyun) ariaCiz();
  }

  /* ---------- olay bağlantıları ---------- */
  function bagla() {
    $('#ekip-liste').addEventListener('click', (e) => {
      const b = e.target.closest('.etiket-dugme'); if (!b) return;
      const id = Number(b.dataset.id);
      const i = ETIKETLER.indexOf(D.etiketler[id] || null);
      const yeni = ETIKETLER[(i + 1) % ETIKETLER.length];
      if (yeni) D.etiketler[id] = yeni; else delete D.etiketler[id];
      KK.Ses.tik();
      ekipCiz(Object.fromEntries($$('#ekip-liste .isaretli').map((li) => [li.dataset.id, $('.durum-cip', li) ? $('.durum-cip', li).textContent : ''])));
    });
    $$('.yan .sekme').forEach((s) => s.addEventListener('click', () => sekmeAc(s.dataset.sekme)));
    $('#panel-aria').addEventListener('click', (e) => {
      if (e.target.id !== 'aria-sorgu' || !D.oyun || D.ariaHak <= 0) return;
      D.ariaHak--; D.ariaAnlik = anlik(); KK.Ses.bip(); ariaCiz();
    });
    $('#soz-formu').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-soz]'); if (!b || !D.oyun || !benCanli() || D.oyun.bitti) return;
      e.preventDefault();
      const tip = b.dataset.soz;
      const hedef = tip === 'masumum' ? null : Number($('#soz-hedef').value);
      if (tip !== 'masumum' && Number.isNaN(hedef)) return;
      D.oyun.insanSoz(tip, hedef);
      KK.Ses.tik();
      mesajlar();
    });
    $('#soz-formu').addEventListener('submit', (e) => e.preventDefault());
    $('#hud-rol').addEventListener('click', () => { D.rolGorunur = !D.rolGorunur; rolRozeti(); });
    $('#hud-ses').addEventListener('click', () => { KK.Ses.ayarla(!KK.Ses.acikMi()); sesDugmesi(); });
    $('#hud-hiz').addEventListener('click', () => { D.hiz = D.hiz === 1 ? 0.5 : 1; $('#hud-hiz').textContent = D.hiz === 1 ? '1×' : '2×'; });
    $('#hud-aria').addEventListener('click', () => sekmeAc('aria'));
    $('#hayalet-atla').addEventListener('click', () => { D.atla = true; const b = $('#devam-dugme'); if (b) b.click(); });
    $('#oyun-cik').addEventListener('click', () => {
      if (!D.oyun || D.oyun.bitti) { location.hash = '#ana'; return; }
      $('#cikis-onay').hidden = false;
      $('#cikis-evet').focus();
    });
    $('#cikis-hayir').addEventListener('click', () => { $('#cikis-onay').hidden = true; });
    $('#cikis-evet').addEventListener('click', () => { $('#cikis-onay').hidden = true; location.hash = '#ana'; });
    sesDugmesi();
  }

  function sesDugmesi() {
    const b = $('#hud-ses');
    b.textContent = KK.Ses.acikMi() ? 'SES AÇIK' : 'SES KAPALI';
    b.setAttribute('aria-pressed', KK.Ses.acikMi() ? 'true' : 'false');
  }

  KK.OyunArayuz = { baslat, cik, bagla, aktifMi: () => !!D.oyun && !D.oyun.bitti };

  /* ---------- rozetler ---------- */
  const ROZETLER = [
    { id: 'ilk_kalkis', ad: 'İlk Temiz Kalkış', kosul: 'Mürettebat olarak kazan.' },
    { id: 'kizil_golge', ad: 'Kızıl Gölge', kosul: 'Suikastçı olarak kazan.' },
    { id: 'sadik_yanci', ad: 'Sadık Yancı', kosul: 'Yancı olarak kazan.' },
    { id: 'kaptanin_kumari', ad: 'Kaptan\'ın Kumarı', kosul: 'Kaptan olarak oylama başlat ve kazan.' },
    { id: 'delinin_zaferi', ad: 'Delinin Zaferi', kosul: 'Halüsinatif olarak kazan.' },
    { id: 'gece_melegi', ad: 'Gece Meleği', kosul: 'Medik olarak bir saldırıyı püskürt.' },
    { id: 'yalan_dedektoru', ad: 'Yalan Dedektörü', kosul: 'Bir haini atan oylamada oyun ona gitsin.' },
    { id: 'hat_korsani', ad: 'Hat Korsanı', kosul: 'Hain olarak telefonda yalan söyle ve kazan.' },
    { id: 'kusursuz_panel', ad: 'Kusursuz Panel', kosul: 'Girdiğin şalter odasında bütün şalterler yeşil yansın.' },
    { id: 'temiz_sayfa', ad: 'Temiz Sayfa', kosul: 'Bütün hainleri finalden önce at.' },
    { id: 'son_nefes', ad: 'Son Nefes', kosul: 'Oksijen tükenmişken kazan.' },
    { id: 'kapsul_yolcusu', ad: 'Kapsül Yolcusu', kosul: 'Temiz kalkan kapsülde koltuk kap.' },
    { id: 'kizil_usta', ad: 'Kızıl Usta', kosul: 'Zor seviyede kazan.' }
  ];

  function rozetOku() { try { return JSON.parse(localStorage.getItem('kk-rozetler') || '{}') || {}; } catch (e) { return {}; } }
  function rozetYaz(v) { try { localStorage.setItem('kk-rozetler', JSON.stringify(v)); } catch (e) { /* depolama yok */ } }

  KK.Rozet = {
    liste: ROZETLER,
    kazanilan: rozetOku,
    degerlendir(o) {
      const b = o.insan(); const kazandi = o.takim(b) === o.sonuc.kazanan;
      const kosullar = {
        ilk_kalkis: kazandi && b.rol === 'murettebat',
        kizil_golge: kazandi && b.rol === 'suikastci',
        sadik_yanci: kazandi && b.rol === 'yanci',
        kaptanin_kumari: kazandi && b.rol === 'kaptan' && o.kaptanOylamaSayisi > 0,
        delinin_zaferi: kazandi && b.rol === 'halusinatif',
        gece_melegi: b.rol === 'medik' && o.kayit.some((t) => t.gece && t.gece.tip === 'kurtarma'),
        yalan_dedektoru: o.kayit.some((t) => t.oylama && t.oylama.atilan != null && o.hainMi(o.oyuncular[t.oylama.atilan]) && t.oylama.oylar[b.id] === t.oylama.atilan),
        hat_korsani: kazandi && o.hainMi(b) && o.kayit.some((t) => t.telefon && t.telefon.arayan === b.id && t.telefon.bilgiler && t.telefon.bilgiler.some((x) => x.yalan)),
        kusursuz_panel: o.kayit.some((t) => t.salter && t.salter.kisiler.includes(b.id) && t.salter.yesil === t.salter.kisiler.length),
        temiz_sayfa: o.sonuc.neden === 'temizlik',
        son_nefes: kazandi && o.o2 <= 0,
        kapsul_yolcusu: o.sonuc.kazanan === 'masum' && !!o.sonuc.koltuklar && o.sonuc.koltuklar.includes(b.id),
        kizil_usta: kazandi && o.ayar.zorluk === 'zor'
      };
      const kayit = rozetOku(); const yeni = [];
      for (const r of ROZETLER) if (kosullar[r.id] && !kayit[r.id]) { kayit[r.id] = new Date().toISOString().slice(0, 10); yeni.push(r); }
      if (yeni.length) rozetYaz(kayit);
      return yeni;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
