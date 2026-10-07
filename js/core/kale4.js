/* Kale 4.0 — "Pastel Pop" kabuğu (body.k4). Yüz altmışı aşan odayı kullanışlı kılan yeni gezinme:
   - Alttaki sekme çubuğu: Bugün · Biz · ♥ (kalp menüsü) · Kale · Anılar. Öbürünün varlığı üst çubukta.
   - Kale sekmesi: anında oda araması, "Sana özel" (favoriler, son girdiklerin, onun şu an olduğu oda), "Yeni" ve
     dokuz niyet rafı ("Ona bir şey gönder", "Birlikte, şimdi", "Oyna"...). Her oda bir niyete bağlı; raf "Hepsi" ile
     ızgaraya açılır. Eski kanat düzeni en altta katlanır bir bölümde durur, kale haritasında kuleye dokununca açılır.
   - Anılar sekmesi: kalenin bütün fotoğraf, yazı ve seslerinden ay ay akan tek bir anı akışı ve anı odalarının girişleri.
   - Her odanın altında "Benzer odalar"; oda başlığında niyet etiketi ve favori yıldızı.
   - Üst çubuktaki "Ben": tema, pullar, bildirimler, Face ID, yedek gibi ayarlar tek sayfada.
   - Salonu düzenle: Bugün sekmesindeki bölümlerin sırası, boyu ve görünürlüğü (bu cihazda).
   - Kapıdan odaya akış: View Transitions destekleyen tarayıcılarda kartın ikonu odanın başlığına uçar. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const on = () => document.body.classList.contains('k4');
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const visible = (r) => !(typeof r.hidden === 'function' ? r.hidden() : r.hidden);

  /* ---------- Niyetler ---------- */
  const NIYET = [
    { id: 'gonder', ad: 'Ona bir şey gönder', kisa: 'Gönder', renk: '#FFB3CC', ikon: 'letter', alt: 'Mektup, ses, kalp, kart, zarf', odalar: ['kavanoz', 'mektuplar', 'telesekreter', 'kartpostal', 'yazitipi', 'elyazisi', 'suzaman', 'kazikazan', 'guvercin', 'gunesposta', 'tebrik', 'sesim', 'gunses', 'fisilti', 'adinhali', 'gulus', 'teselli', 'kalpatis', 'ruya', 'cocukluk', 'kuponlar', 'sebepler', 'defter', 'telsiz', 'sorular', 'seslikitap', 'protokol', 'perde'] },
    { id: 'birlikte', ad: 'Birlikte, şimdi', kisa: 'Birlikte', renk: '#CDBBFF', ikon: 'hugs', alt: 'Aynı anda, iki şehirden', odalar: ['birlikte', 'elele', 'nefes', 'birlikteizle', 'sofra', 'piyano', 'beste', 'radyo', 'bizfm', 'dakika', 'kulup', 'uyku', 'gece', 'alarm', 'randevu', 'ada', 'calisma', 'aynian', 'birgun', 'pencereler', 'duet'] },
    { id: 'oyna', ad: 'Oyna', kisa: 'Oyna', renk: '#9FE5C4', ikon: 'dice', alt: 'İkimiz, bir oyun', odalar: ['macera', 'pinpon', 'nerd', 'amiral', 'gartic', 'yapboz', 'anibulmaca', 'bulmaca', 'kacis', 'kule2', 'saklambac', 'boyama', 'cizgiroman', 'siramasal', 'tahmin', 'yarisma', 'kelime', 'emojisarki', 'neredeyiz', 'labirent', 'dans', 'prenses', 'fiyonkavi', 'av', 'oyun', 'angela', 'muzik', 'muzikkutusu', 'gokyuzu', 'tahta', 'gorev', 'film', 'arkitty'] },
    { id: 'anilar', ad: 'Anılarımız', kisa: 'Anılar', renk: '#FFE27A', ikon: 'camera', alt: 'Fotoğraflar, sesler, ilkler', odalar: ['hafiza', 'muze', 'mozaik', 'belgesel', 'anlar', 'kare', 'galeri', 'portreler', 'kabin', 'sinema', 'masal', 'devam', 'ilkler', 'gungun', 'izler', 'sohbet', 'yildizlar', 'sarkimiz', 'sarkidefteri', 'seslerimiz', 'fotoses', 'kitap', 'yillik', 'agac', 'bizpedia', 'harita', 'hayatcizgisi', 'tanisma', 'dgfilm', 'ozet', 'rapor', 'kelimebulutu', 'kittygunluk'] },
    { id: 'kavusma', ad: 'Kavuşmaya doğru', kisa: 'Kavuşma', renk: '#9FD8FF', ikon: 'plane', alt: 'Bilet, bavul, ilk gün', odalar: ['bilet', 'kumbara', 'zincir', 'nezaman', 'ilk-sarilma', 'bavul', 'senaryo', 'ilkgun', 'ilkbakis', 'kutu', 'pasaport', 'kesif', 'gunluk', 'vedadegil', 'takvim', 'bulusalim', 'rota', 'uzak', 'yerler'] },
    { id: 'gelecek', ad: 'Geleceğimiz', kisa: 'Gelecek', renk: '#FFC6A6', ikon: 'house', alt: 'Ev, şehir, hayaller, sözler', odalar: ['ev', 'sehir', 'hayaller', 'tarifler', 'cerceveler', 'gazete10', 'omur', 'yilsoz', 'birinciyil', 'kapsul', 'onyil', 'kiler', 'zaman-yolcusu', 'kokular', 'son'] },
    { id: 'iyi', ad: 'Kendini iyi hisset', kisa: 'İyi hisset', renk: '#FFD1E1', ikon: 'heart', alt: 'Zor günler, barış, minnet', odalar: ['hava', 'kalpharita', 'baris', 'minnet', 'iyilik', 'kalkan', 'sevgidili', 'pazar', 'soz', 'zambak', 'kedi', 'nezaman'] },
    { id: 'ozel', ad: 'Bu günlere özel', kisa: 'Özel günler', renk: '#FFE9A8', ikon: 'party', alt: 'Mevsimler, bayramlar, doğum günleri', odalar: ['ozel', 'saray', 'kis', 'novruz', 'adimiz', 'goktakvimi', 'fenerler', 'ters', 'hediye', 'altinoda'] },
    { id: 'kale', ad: 'Kalenin araçları', kisa: 'Araçlar', renk: '#E6E0F0', ikon: 'key', alt: 'Pullar, yedek, melodi, ayarlar', odalar: ['album', 'gardirop', 'katalog', 'kalemelodi', 'muhur', 'duvar', 'gazete', 'sinif', 'yedek', 'gardirop', 'katalog', 'posterler', 'lamba', 'panel'] },
  ];
  const KANAT = { anilar: 'anilar', kalp: 'gonder', oyun: 'oyna', zaman: 'gelecek', hazine: 'kale', mevsim: 'ozel', sahip: 'kale' };
  function niyetOf(id) {
    const n = NIYET.find((x) => x.odalar.includes(id));
    if (n) return n;
    const r = K.rooms.find((x) => x.id === id);
    return NIYET.find((x) => x.id === KANAT[(r && r.wing) || 'hazine']) || NIYET[NIYET.length - 1];
  }
  function odalar(nid) {
    const n = NIYET.find((x) => x.id === nid);
    if (!n) return [];
    const acik = K.rooms.filter((r) => visible(r) && !r.secret);
    const liste = n.odalar.map((id) => acik.find((r) => r.id === id)).filter(Boolean);
    acik.forEach((r) => !liste.includes(r) && !NIYET.some((x) => x.odalar.includes(r.id)) && KANAT[r.wing || 'hazine'] === nid && liste.push(r));
    return liste;
  }

  /* ---------- Favoriler ve geçmiş ---------- */
  const favs = () => K.store.get('k4fav', []);
  const favMi = (id) => favs().includes(id);
  function favDegis(id) {
    const f = favs();
    const i = f.indexOf(id);
    i < 0 ? f.unshift(id) : f.splice(i, 1);
    K.store.set('k4fav', f.slice(0, 24));
    K.fx.toast(i < 0 ? '⭐ Favorilere eklendi. Kale sekmesinde en üstte.' : 'Favorilerden çıkarıldı.', { duration: 1800, log: false });
    K.audio.sfx.tap && K.audio.sfx.tap();
    i < 0 && K.stickers.award('k4fav');
    favYildiz();
    kale();
  }
  const sayac = () => K.store.get('k4say', {});
  K.on('room', ({ id }) => {
    const s = sayac();
    s[id] = (s[id] || 0) + 1;
    K.store.set('k4say', s);
  });

  /* ---------- Oda kartı ---------- */
  function kart(r, opt = {}) {
    const visited = K.store.get('visited', {});
    const badge = r.badge ? r.badge() : '';
    const yeni = !visited[r.id] && !r.secret;
    const o = opt.onda ? '<span class="k4-onda">Şu an burada</span>' : '';
    return `<a class="k4-oda ${opt.cls || ''}" href="#${r.id}" data-room="${r.id}" data-k4oda="${r.id}" style="--c:${r.color || '#FFE3EC'}"><span class="k4-oda-ik">${A.icon(r.icon)}</span><b>${K.esc(K.val(r.title))}</b><small>${K.esc(K.fill(K.val(r.sub || '')))}</small>${o}${badge ? `<i class="k4-rozet">${K.esc(String(badge))}</i>` : yeni ? '<i class="k4-rozet yeni">Yeni</i>' : ''}${favMi(r.id) ? '<em class="k4-yildiz" aria-label="Favori">★</em>' : ''}</a>`;
  }

  /* ---------- Kale sekmesi ---------- */
  let acikRaf = K.store.get('k4raf', '');
  function raf(id, ad, renk, ikon, liste, alt, opt = {}) {
    if (!liste.length) return '';
    const acik = acikRaf === id;
    return `<section class="k4-raf ${acik ? 'acik' : ''}" data-raf="${id}" style="--n:${renk}">
      <header><span class="k4-raf-ik">${A.icon(ikon)}</span><div><h3>${K.esc(ad)}</h3>${alt ? `<small>${K.esc(alt)}</small>` : ''}</div>${liste.length > 3 ? `<button type="button" class="k4-hepsi" data-k4raf="${id}" aria-expanded="${acik}">${acik ? 'Sırala' : `Hepsi · ${liste.length}`}</button>` : ''}</header>
      <div class="k4-raf-icerik">${liste.map((r) => kart(r, { onda: opt.onda === r.id })).join('')}</div></section>`;
  }
  function kale() {
    const box = K.$('#k4Kale');
    if (!box || !on()) return;
    const acik = K.rooms.filter((r) => visible(r) && !r.secret);
    const visited = K.store.get('visited', {});
    const last = K.store.get('lastVisit', {});
    const w = K.yan && K.yan.where && K.yan.where();
    const onda = w && w.room ? acik.find((r) => r.id === w.room) : null;
    const fav = favs().map((id) => acik.find((r) => r.id === id)).filter(Boolean);
    const son = acik.filter((r) => last[r.id] && !favs().includes(r.id)).sort((a, b) => last[b.id] - last[a.id]).slice(0, 8);
    const ozel = (onda ? [onda] : []).concat(fav, son).filter((r, i, a) => a.indexOf(r) === i);
    const yeni = acik.filter((r) => !visited[r.id] && r.id !== 'panel');
    const q = (K.$('#k4Ara', box) && K.$('#k4Ara', box).value) || '';
    K.$('#k4Raflar', box).innerHTML =
      raf('ozel', 'Sana özel', '#FFE3EC', 'star', ozel, onda ? `${nameOf(other())} şu an ${K.val(onda.title)} odasında` : fav.length ? 'Favorilerin ve son girdiklerin' : 'Bir odada ★ ile favorine ekle', { onda: onda && onda.id }) +
      (yeni.length && yeni.length < acik.length ? raf('yeni', 'Henüz girmediklerin', '#FFF3B8', 'door', yeni.slice(0, 24), `${yeni.length} kapı seni bekliyor`) : '') +
      NIYET.map((n) => raf(n.id, n.ad, n.renk, n.ikon, odalar(n.id), n.alt)).join('');
    K.$('#k4KaleSay', box).textContent = `${acik.length} oda · ${NIYET.length} raf`;
    if (q) ara(q);
  }
  // Türkçe harfleri sadeleştirerek ara
  const sade = (s) => String(s || '').toLocaleLowerCase('tr').replace(/[ıi̇]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a');
  function ara(q) {
    const box = K.$('#k4AraSonuc');
    if (!box) return;
    const s = sade(q.trim());
    K.$('#k4Raflar').hidden = Boolean(s);
    if (!s) return (box.hidden = true);
    const acik = K.rooms.filter((r) => visible(r) && !r.secret);
    const puan = (r) => {
      const t = sade(K.val(r.title)), a = sade(K.fill(K.val(r.sub || ''))), n = sade(niyetOf(r.id).ad);
      return t.startsWith(s) ? 4 : t.includes(s) ? 3 : a.includes(s) ? 2 : n.includes(s) || r.id.includes(s) ? 1 : 0;
    };
    const bulunan = acik.map((r) => [r, puan(r)]).filter((x) => x[1]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    box.hidden = false;
    box.innerHTML = bulunan.length
      ? `<p class="k4-ara-ust">${bulunan.length} oda</p><div class="k4-izgara">${bulunan.map((r) => kart(r)).join('')}</div>`
      : `<p class="k4-ara-ust">"${K.esc(q)}" diye bir oda yok.</p>`;
    box.insertAdjacentHTML('beforeend', K.ara ? `<button type="button" class="btn soft small" data-k4sor>Kitty'ye sor: "${K.esc(q)}"</button>` : '');
  }
  function kaleKur() {
    const sec = K.$('.sec.castle');
    if (!sec || K.$('#k4Kale')) return;
    sec.insertAdjacentHTML('afterbegin', `<div class="k4-kale" id="k4Kale">
      <div class="k4-bas"><h2>Kale</h2><small id="k4KaleSay"></small></div>
      <label class="k4-ara"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15.5 15.5 L21 21" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg><input id="k4Ara" type="search" autocomplete="off" placeholder="Bir oda ara: mektup, uyku, oyun..." aria-label="Oda ara"></label>
      <div class="k4-ara-sonuc" id="k4AraSonuc" hidden></div>
      <div class="k4-niyetler" id="k4Niyetler">${NIYET.map((n) => `<button type="button" data-k4git="${n.id}" style="--n:${n.renk}">${A.icon(n.ikon)}<span>${K.esc(n.kisa)}</span></button>`).join('')}</div>
      <div id="k4Raflar"></div>
      <div class="k4-harita-bas"><h3>Kale haritası</h3><small>Bir kuleye dokun: o kanadın bütün odaları</small></div>
    </div>`);
    // Eski raflar ve kanatlar katlanır bir bölüme
    const wings = K.$('#wings'), quick = K.$('#shelfQuick');
    if (wings) {
      const det = K.el('<details class="k4-kanatlar" id="k4Kanatlar"><summary>Kanatlara göre bütün kapılar</summary></details>');
      wings.parentNode.insertBefore(det, wings);
      quick && det.appendChild(quick);
      det.appendChild(wings);
    }
    const inp = K.$('#k4Ara');
    inp.addEventListener('input', () => ara(inp.value));
    inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const ilk = K.$('#k4AraSonuc .k4-oda');
      ilk && K.go(ilk.dataset.k4oda);
    });
    kale();
  }

  /* ---------- Anılar sekmesi ---------- */
  const ANI_GIRIS = ['hafiza', 'muze', 'mozaik', 'belgesel', 'anlar', 'kare', 'galeri', 'portreler', 'yillik', 'gungun', 'ilkler', 'fotoses'];
  let aniFiltre = 'hepsi', aniAy = 3, aniVeri = null;
  async function anilar(yenile) {
    const box = K.$('#anilar');
    if (!box || !on()) return;
    const acik = K.rooms.filter((r) => visible(r) && !r.secret);
    K.$('#k4AniGiris', box).innerHTML = ANI_GIRIS.map((id) => acik.find((r) => r.id === id)).filter(Boolean).map((r) => kart(r, { cls: 'kucuk' })).join('');
    K.$$('[data-k4ani]', box).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k4ani === aniFiltre)));
    const akis = K.$('#k4Akis', box);
    if (!K.arsiv || !K.cloud || !K.cloud.enabled) return (akis.innerHTML = '<p class="muted center">Anı akışı bulut açıkken dolar.</p>');
    if (!aniVeri || yenile) {
      akis.innerHTML = `<div class="k4-ay" aria-busy="true"><h3><span class="k4-iskelet" style="width:140px;height:22px"></span></h3><div class="k4-ani-izgara">${'<span class="k4-ani k4-iskelet"></span>'.repeat(9)}</div></div>`;
      const [p, n, v] = await Promise.all([K.arsiv.photos(), K.arsiv.notes(), K.arsiv.voices()]);
      aniVeri = { p, n, v };
    }
    const { p, n, v } = aniVeri;
    const ogeler = []
      .concat(aniFiltre === 'hepsi' || aniFiltre === 'foto' ? p.map((x) => ({ t: 'foto', x })) : [])
      .concat(aniFiltre === 'hepsi' || aniFiltre === 'yazi' ? n.map((x) => ({ t: 'yazi', x })) : [])
      .concat(aniFiltre === 'hepsi' || aniFiltre === 'ses' ? v.map((x) => ({ t: 'ses', x, day: T.key(T.baku(new Date(x.at))) })) : [])
      .sort((a, b) => b.x.at - a.x.at);
    const aylar = [];
    ogeler.forEach((o) => {
      const ay = (o.x.day || o.day || T.key(T.baku(new Date(o.x.at)))).slice(0, 7);
      let a = aylar[aylar.length - 1];
      if (!a || a.ay !== ay) aylar.push((a = { ay, l: [] }));
      a.l.push(o);
    });
    const goster = aylar.slice(0, aniAy);
    akis.innerHTML = goster.length
      ? goster.map((a) => `<section class="k4-ay"><h3>${K.esc(K.arsiv.monthName(a.ay))}<small>${a.l.length} anı</small></h3><div class="k4-ani-izgara">${a.l.slice(0, 60).map(aniHTML).join('')}</div></section>`).join('') + (aylar.length > aniAy ? '<div class="row center"><button type="button" class="btn soft" data-k4daha>Daha eski aylar</button></div>' : '')
      : '<p class="muted center">Henüz burada bir şey yok. İlk fotoğraf Günün Karesi\'nden gelir.</p>';
    box._ogeler = ogeler;
  }
  function aniHTML(o, i) {
    const x = o.x;
    const kim = `<em>${K.esc(nameOf(x.who))}</em>`;
    if (o.t === 'foto') return `<button type="button" class="k4-ani foto" data-k4aniac="${x.id}"><img src="${x.thumb}" alt="" loading="lazy"><span>${K.esc(x.label)} · ${kim}</span>${K.fotoses && K.fotoses.var(x.id) ? '<i class="k4-ani-ses">🔊</i>' : ''}</button>`;
    if (o.t === 'ses') return `<button type="button" class="k4-ani ses" data-k4ses="${x.audio}"><b>🎙</b><span>${Math.round(x.dur || 0)} sn · ${kim}</span></button>`;
    return `<button type="button" class="k4-ani yazi" data-k4aniac="${x.id}"><p>${K.esc(x.text.slice(0, 120))}</p><span>${K.esc(x.label)} · ${kim}</span></button>`;
  }
  function aniAc(id) {
    const o = (K.$('#anilar')._ogeler || []).find((y) => y.x.id === id);
    if (!o) return;
    const x = o.x;
    if (o.t === 'foto') {
      const m = K.ui.modal({ label: x.label, cls: 'k4-aniac', html: `<img class="k4-aniac-img" src="${x.thumb}" alt=""><p class="card-eyebrow">${K.esc(x.label)} · ${K.esc(T.fmt(x.day || new Date(x.at), true))}</p>${x.text ? `<p>${K.esc(x.text)}</p>` : ''}<p class="muted small">${K.esc(nameOf(x.who))}</p><div id="k4FotoSes"></div>` });
      x.full && K.medya.rowUrl(x.full, 'img').then((u) => u && K.$('.k4-aniac-img', m.el) && (K.$('.k4-aniac-img', m.el).src = u));
      K.fotoses && K.fotoses.bagla(K.$('#k4FotoSes', m.el), x);
      return;
    }
    K.ui.modal({ label: x.label, cls: 'k4-aniac', html: `<p class="card-eyebrow">${K.esc(x.label)} · ${K.esc(T.fmt(x.day || new Date(x.at), true))}</p><p class="k4-aniac-yazi">${K.esc(x.text)}</p><p class="muted small">— ${K.esc(nameOf(x.who))}</p>` });
  }
  function anilarKur() {
    const castle = K.$('.sec.castle');
    if (!castle || K.$('#anilar')) return;
    castle.insertAdjacentHTML('afterend', `<section class="wrap sec k4-anilar tp tp-anilar" id="anilar">
      <div class="k4-bas"><h2>Anılar</h2><small>Kalede biriken her şey, ay ay</small></div>
      <div class="k4-ani-giris" id="k4AniGiris"></div>
      <div class="k4-seg" role="group" aria-label="Anı türü">${[['hepsi', 'Hepsi'], ['foto', 'Fotoğraflar'], ['yazi', 'Yazılar'], ['ses', 'Sesler']].map(([id, ad]) => `<button type="button" data-k4ani="${id}">${ad}</button>`).join('')}</div>
      <div id="k4Akis"></div></section>`);
    K.salon && K.salon.tab && K.salon.current && K.salon.current() === 'anilar' && K.salon.tab('anilar');
  }

  /* ---------- Alt sekme çubuğu ---------- */
  const SEKME = [['bugun', 'Bugün', 'sun'], ['biz', 'Biz', 'hugs'], ['kale', 'Kale', 'key'], ['anilar', 'Anılar', 'camera']];
  function cubuk() {
    const dock = K.$('#dock');
    if (!dock || K.$('[data-k4tab]', dock)) return;
    const kalp = K.$('.dock-kalp', dock);
    const btn = ([id, ad, ik]) => K.el(`<button type="button" class="k4-tab" data-k4tab="${id}" aria-label="${ad}">${A.icon(ik)}<span>${ad}</span></button>`);
    SEKME.slice(0, 2).forEach((s) => dock.insertBefore(btn(s), kalp));
    SEKME.slice(2).forEach((s) => dock.appendChild(btn(s)));
    cubukBoya();
  }
  function cubukBoya() {
    const t = K.activeRoom ? '' : (K.salon && K.salon.current && K.salon.current()) || 'bugun';
    K.$$('[data-k4tab]').forEach((b) => b.setAttribute('aria-current', b.dataset.k4tab === t ? 'page' : 'false'));
  }
  function sekmeyeGit(t) {
    const git = () => {
      K.salon && K.salon.tab(t);
      window.scrollTo({ top: 0, behavior: 'auto' });
      cubukBoya();
      if (t === 'kale') kale();
      if (t === 'anilar') anilar();
    };
    if (K.activeRoom) {
      location.hash = '';
      setTimeout(git, 60);
    } else git();
  }

  /* ---------- Üst çubuk: öbürü ve "Ben" ---------- */
  function ustCubuk() {
    const acts = K.$('.top-actions');
    if (!acts || K.$('#k4Yan')) return;
    const yan = K.el(`<button type="button" class="icon-btn k4-yan" id="k4Yan" aria-label="${K.esc(nameOf(other()))}">${K.avatar ? K.avatar(other(), 'yan-av') : ''}<i class="k4-nokta"></i></button>`);
    const ben = K.el(`<button type="button" class="icon-btn k4-ben" id="k4Ben" aria-label="Ben ve ayarlar">${K.avatar ? K.avatar(mine(), 'ben-av') : ''}</button>`);
    acts.insertBefore(yan, acts.firstChild);
    acts.appendChild(ben);
    yanBoya();
  }
  function yanBoya() {
    const b = K.$('#k4Yan');
    if (!b) return;
    const w = K.yan && K.yan.where && K.yan.where();
    b.classList.toggle('on', Boolean(w));
    b.title = w ? `${nameOf(other())}: ${w.text}` : `${nameOf(other())} şu an kalede değil`;
  }
  const PASTEL_RENK = () => K.gunrengi.PASTEL[K.gunrengi.secim().k][0];
  function benSayfa() {
    const n = Object.keys(K.stickers.got()).length;
    const ogeler = [
      ['atolye', 'palette', 'Tema Atölyesi', 'Tasarım, renk, fiyonk, hareket', () => K.atolye && K.atolye.open()],
      ['duzen', 'board', 'Salonu düzenle', 'Bugün sekmesinin sırası ve bölümleri', () => duzenle()],
      ['album', 'sticker', 'Pul Albümü', `${n} pul`, () => K.go('album')],
      ['yeni', 'gift', 'Kalede yeni ne var?', 'Son güncellemenin sayfaları', () => K.yeni && K.yeni.open && K.yeni.open(true)],
      ['telefon', 'chat', 'Bildirimler', 'Telefonuna kale bildirimi', () => (K.telefon && K.telefon.sheet ? K.telefon.sheet() : K.go('panel'))],
      ['faceid', 'key', 'Face ID ile giriş', K.faceid && K.faceid.state && K.faceid.state() ? 'Kuruldu' : 'Şifresiz, güvenli', () => K.faceid && K.faceid.sheet()],
      ['takvim', 'calendar', 'Takvim aboneliği', '21\'ler telefonunun takviminde', () => K.takvimabone && K.takvimabone.sheet()],
      ['widget', 'frame', "Kale Widget'ı", 'Ana ekranda kale', () => K.widget && K.widget.open()],
      ['siri', 'hug', 'Siri ile sarıl', 'Kestirmeler ve NFC', () => K.kisayol && K.kisayol.open()],
      ['yedek', 'house', 'Kale Yedeği', 'Yedekle, geri yükle, aylık yedekler', () => K.go('yedek')],
      ['panel', 'key', 'Kale Paneli', 'Kale sahibinin ayarları', () => K.go('panel')],
      ['kilit', 'door', 'Bu cihazda kilitle', 'Bir dahaki girişte şifre sorulur', () => K.$('#footLock') && K.$('#footLock').click()],
    ].filter((x) => (x[0] !== 'panel' || K.isOwner()) && (x[0] !== 'faceid' || K.faceid) && (x[0] !== 'takvim' || K.takvimabone) && (x[0] !== 'widget' || K.widget) && (x[0] !== 'siri' || K.kisayol));
    const m = K.ui.modal({
      label: 'Ben',
      cls: 'k4-bensayfa',
      html: `<div class="k4-ben-bas">${K.avatar ? K.avatar(mine(), 'ben-av buyuk') : ''}<div><h2>${K.esc(nameOf(mine()))}</h2><p class="muted small">${K.esc(K.isOwner() ? C.myCity : C.herCity)} · ${n} pul · ${Object.keys(K.store.get('visited', {})).length} oda gezildi</p>${K.gunrengi && K.gunrengi.etiket() ? `<p class="k4-gunrengi"><i style="background:${PASTEL_RENK()}"></i>Günün rengi: ${K.esc(K.gunrengi.etiket())}</p>` : ''}</div></div>
        <div class="k4-ben-izgara">${ogeler.map(([id, ik, ad, alt], i) => `<button type="button" data-k4ben="${i}"><span class="k4-oda-ik">${A.icon(ik)}</span><b>${K.esc(ad)}</b><small>${K.esc(alt)}</small></button>`).join('')}</div>`,
    });
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k4ben]');
      if (!b) return;
      m.close();
      setTimeout(() => ogeler[+b.dataset.k4ben][4](), 250);
    });
  }

  /* ---------- Benzer odalar ve oda başlığı ---------- */
  function odaAlt(id) {
    if (!on()) return;
    const view = K.$('#roomView');
    let box = K.$('#k4Benzer');
    if (!box) {
      box = K.el('<aside class="k4-benzer" id="k4Benzer"></aside>');
      K.$('#roomStage').insertAdjacentElement('afterend', box);
    }
    const n = niyetOf(id);
    const l = odalar(n.id).filter((r) => r.id !== id).slice(0, 10);
    box.hidden = !l.length || id === 'panel';
    box.innerHTML = `<h3><span class="k4-raf-ik" style="--n:${n.renk}">${A.icon(n.ikon)}</span>${K.esc(n.ad)}</h3><div class="k4-raf-icerik">${l.map((r) => kart(r, { cls: 'kucuk' })).join('')}</div>`;
    let yol = K.$('#k4Yol');
    if (!yol) {
      yol = K.el('<button type="button" class="k4-yol" id="k4Yol"></button>');
      const titles = K.$('.room-titles', view);
      titles && titles.insertBefore(yol, titles.firstChild);
      const fav = K.el('<button type="button" class="k4-favbtn" id="k4FavBtn" aria-label="Favorilere ekle">★</button>');
      K.$('#roomIcon').insertAdjacentElement('beforebegin', fav);
    }
    yol.textContent = n.kisa;
    yol.dataset.k4git = n.id;
    yol.style.setProperty('--n', n.renk);
    favYildiz();
  }
  function favYildiz() {
    const b = K.$('#k4FavBtn');
    if (!b || !K.activeRoom) return;
    const f = favMi(K.activeRoom);
    b.classList.toggle('on', f);
    b.setAttribute('aria-pressed', String(f));
    b.setAttribute('aria-label', f ? 'Favorilerden çıkar' : 'Favorilere ekle');
  }

  /* ---------- Salonu düzenle ---------- */
  const BOLUM = [['#hero', 'Karşılama ve Kitty'], ['#kmSerit', 'Kavuşma şeridi'], ['#stories', 'Hikâyeler'], ['#kalpBar', 'Kalp çubuğu'], ['#k4Sahne', 'Pamuk ile Kitty'], ['#cicek', 'Günün Çiçeği'], ['.together', 'Birlikte sayacı'], ['#gunbatimi', 'Gün batımı köprüsü'], ['#special', 'Bugünün kartları'], ['#k4Gunluk', 'Kitty\'nin günlüğü'], ['.sec.today', 'Bugün senin için'], ['#install', 'Ana ekrana ekle']];
  const duzenOku = () => K.store.get('k4duzen', { sira: [], gizli: [], kucuk: [] });
  function duzenUygula() {
    const d = duzenOku();
    BOLUM.forEach(([sel], i) => {
      const el = K.$(sel);
      if (!el) return;
      const s = d.sira.indexOf(sel);
      el.style.order = on() ? String(s < 0 ? 100 + i : s) : '';
      el.classList.toggle('k4-gizli', on() && d.gizli.includes(sel));
      el.classList.toggle('k4-kucuk', on() && d.kucuk.includes(sel));
    });
  }
  function duzenle() {
    let d = duzenOku();
    const sirali = () => {
      const var_ = BOLUM.filter(([sel]) => K.$(sel));
      return var_.slice().sort((a, b) => {
        const ia = d.sira.indexOf(a[0]), ib = d.sira.indexOf(b[0]);
        return (ia < 0 ? 100 + BOLUM.indexOf(a) : ia) - (ib < 0 ? 100 + BOLUM.indexOf(b) : ib);
      });
    };
    const m = K.ui.modal({ label: 'Salonu düzenle', cls: 'k4-duzen', html: '<h2>Salonu düzenle</h2><p class="muted">Bugün sekmesindeki bölümlerin sırasını, boyunu ve görünürlüğünü seç. Bu telefonda kalır.</p><ol class="k4-duzen-l" id="k4DuzenL"></ol><div class="row"><button type="button" class="btn ghost small" data-k4sifirla>Varsayılana dön</button></div>' });
    const ciz = () => {
      K.$('#k4DuzenL', m.el).innerHTML = sirali()
        .map(([sel, ad], i, l) => `<li class="${d.gizli.includes(sel) ? 'gizli' : ''}"><b>${K.esc(ad)}</b><div><button type="button" data-k4yukari="${sel}" ${i ? '' : 'disabled'} aria-label="Yukarı">↑</button><button type="button" data-k4asagi="${sel}" ${i < l.length - 1 ? '' : 'disabled'} aria-label="Aşağı">↓</button><button type="button" data-k4boy="${sel}" aria-pressed="${d.kucuk.includes(sel)}">${d.kucuk.includes(sel) ? 'Küçük' : 'Normal'}</button><button type="button" data-k4goz="${sel}" aria-pressed="${!d.gizli.includes(sel)}">${d.gizli.includes(sel) ? 'Gizli' : 'Açık'}</button></div></li>`)
        .join('');
    };
    const kaydet = () => {
      K.store.set('k4duzen', d);
      duzenUygula();
      ciz();
      K.stickers.award('k4duzen');
    };
    ciz();
    m.el.addEventListener('click', (e) => {
      const l = sirali().map((x) => x[0]);
      const y = e.target.closest('[data-k4yukari]'), a = e.target.closest('[data-k4asagi]');
      if (y || a) {
        const sel = (y || a).dataset[y ? 'k4yukari' : 'k4asagi'];
        const i = l.indexOf(sel), j = y ? i - 1 : i + 1;
        [l[i], l[j]] = [l[j], l[i]];
        d.sira = l;
        return kaydet();
      }
      const g = e.target.closest('[data-k4goz]');
      if (g) {
        const sel = g.dataset.k4goz;
        d.gizli = d.gizli.includes(sel) ? d.gizli.filter((x) => x !== sel) : d.gizli.concat(sel);
        return kaydet();
      }
      const b = e.target.closest('[data-k4boy]');
      if (b) {
        const sel = b.dataset.k4boy;
        d.kucuk = d.kucuk.includes(sel) ? d.kucuk.filter((x) => x !== sel) : d.kucuk.concat(sel);
        return kaydet();
      }
      if (e.target.closest('[data-k4sifirla]')) {
        d = { sira: [], gizli: [], kucuk: [] };
        kaydet();
      }
    });
  }

  /* ---------- Kapıdan odaya akış (View Transitions) ---------- */
  const vtVar = () => typeof document.startViewTransition === 'function' && !K.reduced;
  let kaynak = null;
  K.gecis = (fn) => {
    if (!on() || !vtVar() || document.hidden) return fn();
    const src = kaynak && kaynak.isConnected ? kaynak : null;
    kaynak = null;
    if (src) src.style.viewTransitionName = 'k4-ikon';
    try {
      const vt = document.startViewTransition(() => {
        if (src) src.style.viewTransitionName = '';
        fn();
        const hedef = K.activeRoom ? K.$('#roomIcon') : null;
        if (src && hedef) hedef.style.viewTransitionName = 'k4-ikon';
      });
      vt.finished.finally(() => {
        const h = K.$('#roomIcon');
        h && (h.style.viewTransitionName = '');
      });
    } catch (e) {
      fn();
    }
  };

  /* ---------- Olaylar ---------- */
  document.addEventListener(
    'click',
    (e) => {
      if (!on()) return;
      const oda = e.target.closest('[data-k4oda], .door[data-room]');
      if (oda) kaynak = oda.querySelector('.k4-oda-ik, .door-arch') || null;
      // Haritadaki kule: kanatlar bölümünü aç ve o kanada in
      const kule = e.target.closest('.km-t[data-wing]');
      if (kule) {
        const det = K.$('#k4Kanatlar');
        det && (det.open = true);
      }
    },
    true
  );
  /* ---------- Hareketli ikon ailesi: dokunulan ikon kendi küçük hareketini yapar ---------- */
  document.addEventListener('pointerdown', (e) => {
    if (K.reduced || !document.body.classList.contains('k4')) return;
    const t = e.target.closest('a, button, [role="button"], .k4-oda, .biz-t, .special-card');
    const ic = t && t.querySelector('svg.ic');
    if (!ic) return;
    ic.classList.remove('ic-oyna');
    void ic.getBoundingClientRect();
    ic.classList.add('ic-oyna');
    setTimeout(() => ic.classList.remove('ic-oyna'), 900);
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (!on()) return;
    const t = e.target.closest('[data-k4tab]');
    if (t) {
      K.audio.sfx.tap && K.audio.sfx.tap();
      return sekmeyeGit(t.dataset.k4tab);
    }
    const r = e.target.closest('[data-k4raf]');
    if (r) {
      acikRaf = acikRaf === r.dataset.k4raf ? '' : r.dataset.k4raf;
      K.store.set('k4raf', acikRaf);
      kale();
      const s = K.$(`.k4-raf[data-raf="${r.dataset.k4raf}"]`);
      s && s.scrollIntoView({ block: 'start', behavior: K.reduced ? 'auto' : 'smooth' });
      return;
    }
    const g = e.target.closest('[data-k4git]');
    if (g) {
      const id = g.dataset.k4git;
      const go = () => {
        acikRaf = id;
        K.store.set('k4raf', id);
        kale();
        const s = K.$(`.k4-raf[data-raf="${id}"]`);
        s && s.scrollIntoView({ block: 'start', behavior: K.reduced ? 'auto' : 'smooth' });
      };
      if (K.activeRoom || (K.salon && K.salon.current() !== 'kale')) {
        sekmeyeGit('kale');
        return setTimeout(go, 150);
      }
      return go();
    }
    if (e.target.closest('[data-k4sor]')) return K.ara && K.ara.open();
    if (e.target.closest('#k4Yan')) return K.yan && K.yan.sheet ? K.yan.sheet() : null;
    if (e.target.closest('#k4Ben')) return benSayfa();
    if (e.target.closest('#k4FavBtn')) return K.activeRoom && favDegis(K.activeRoom);
    const fa = e.target.closest('[data-k4ani]');
    if (fa) {
      aniFiltre = fa.dataset.k4ani;
      aniAy = 3;
      return anilar();
    }
    if (e.target.closest('[data-k4daha]')) {
      aniAy += 3;
      return anilar();
    }
    const ac = e.target.closest('[data-k4aniac]');
    if (ac) return aniAc(ac.dataset.k4aniac);
    const ses = e.target.closest('[data-k4ses]');
    if (ses) return K.medya.cal(ses.dataset.k4ses);
  });
  // Bir oda kartına basılı tutunca favori
  let basT = 0, basildi = false;
  document.addEventListener('pointerdown', (e) => {
    const c = on() && e.target.closest('[data-k4oda]');
    if (!c) return;
    basildi = false;
    clearTimeout(basT);
    basT = setTimeout(() => {
      basildi = true;
      K.vibrate && K.vibrate(20);
      favDegis(c.dataset.k4oda);
    }, 560);
  });
  ['pointerup', 'pointercancel', 'pointermove'].forEach((ev) => document.addEventListener(ev, (e) => (ev !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) && clearTimeout(basT)));
  document.addEventListener(
    'click',
    (e) => {
      if (basildi && e.target.closest('[data-k4oda]')) {
        e.preventDefault();
        e.stopPropagation();
        basildi = false;
      }
    },
    true
  );
  document.addEventListener('contextmenu', (e) => on() && e.target.closest('[data-k4oda]') && e.preventDefault());

  function kur() {
    document.body.classList.toggle('vt', on() && vtVar());
    if (!on()) return duzenUygula();
    ustCubuk();
    kaleKur();
    anilarKur();
    cubuk();
    duzenUygula();
  }
  /* ---------- Canlı Kale: haritada onun olduğu kulenin penceresi yanar, içinde küçük bir siluet ---------- */
  function kaleCanli() {
    const svg = K.$('#castleMap svg.kmap');
    if (!svg) return;
    K.$$('.km-onda', svg).forEach((e) => e.remove());
    K.$$('.km-t.onda', svg).forEach((e) => e.classList.remove('onda'));
    const wrap = K.$('#castleMap');
    const wx = K.gercekhava && K.gercekhava.now && K.gercekhava.now();
    const c = wx && (K.isOwner() ? wx.baku : wx.ist);
    wrap && wrap.classList.toggle('km-yagmur', Boolean(c && ((c.code >= 51 && c.code < 70) || (c.code >= 80 && c.code < 90))));
    wrap && wrap.classList.toggle('km-kar', Boolean(c && ((c.code >= 70 && c.code < 80) || c.code === 85 || c.code === 86)));
    const w = K.yan && K.yan.where && K.yan.where();
    if (!w) return;
    const r = w.room && K.rooms.find((x) => x.id === w.room);
    const g = K.$(`.km-t[data-wing="${r ? r.wing : 'kalp'}"]`, svg);
    const body = g && K.$('.km-body', g);
    if (!body) return;
    const x = +body.getAttribute('x') + +body.getAttribute('width') / 2, y = +body.getAttribute('y') + 74;
    g.classList.add('onda');
    g.insertAdjacentHTML('beforeend', `<g class="km-onda"><circle cx="${x}" cy="${y + 14}" r="34" fill="#FFE27A" opacity=".35"/><path d="M${x - 16} ${y + 34} V${y + 4} A16 16 0 0 1 ${x + 16} ${y + 4} V${y + 34} Z" fill="#FFE27A" stroke="#4A2138" stroke-width="3"/>
      <path d="M${x - 9} ${y + 34} C${x - 10} ${y + 22} ${x - 9} ${y + 16} ${x - 8} ${y + 12} L${x - 9} ${y + 4} L${x - 3} ${y + 9} C${x} ${y + 8} ${x + 3} ${y + 8} ${x + 5} ${y + 9} L${x + 9} ${y + 4} L${x + 9} ${y + 13} C${x + 10} ${y + 18} ${x + 10} ${y + 24} ${x + 9} ${y + 34} Z" fill="#4A2138" opacity=".75"/>
      <circle cx="${x + 7}" cy="${y + 8}" r="3" fill="#E3174D"/>
      <g class="km-onda-lbl"><rect x="${x - 50}" y="${y - 30}" width="100" height="24" rx="12" fill="#fff" stroke="#4A2138" stroke-width="2.5"/><text x="${x}" y="${y - 13}" text-anchor="middle">${K.esc(nameOf(other()))} burada</text></g></g>`);
  }
  K.on('built', () => setTimeout(kaleCanli, 600));
  /* ---------- Bir saniyede açılış: ölçüm ve ekran dışını erteleme ---------- */
  K.on('built', () => {
    const ms = Math.round(performance.now());
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const boya = Math.round(performance.now());
      const l = K.store.get('acilisSure', []).concat([{ at: Date.now(), kur: ms, boya }]).slice(-12);
      K.store.set('acilisSure', l);
    }));
    // Ana salonun görünmeyen bölümleri tarayıcıya "sonra çiz" diye bildirilir
    K.$$('main.home > :is(.sec.today, #biz)').forEach((el) => el.classList.add('k4-ertele'));
    // Boştayken sık girilen odaların ikon ve küçük fotoğrafları ısınır
    const isit = () => {
      const last = K.store.get('lastVisit', {});
      Object.keys(last).sort((a, b) => last[b] - last[a]).slice(0, 6).forEach((id) => {
        const r = K.rooms.find((x) => x.id === id);
        r && A.icon(r.icon);
      });
    };
    'requestIdleCallback' in window ? requestIdleCallback(isit, { timeout: 3000 }) : setTimeout(isit, 1500);
  });
  const acilis = () => K.store.get('acilisSure', []);
  K.on('built', () => setTimeout(kur, 30));
  K.on('tasarim', () => setTimeout(() => (kur(), location.reload()), 300));
  K.on('salonTab', (t) => {
    cubukBoya();
    if (!on()) return;
    if (t === 'kale') kale(), kaleCanli();
    if (t === 'anilar') anilar();
  });
  K.on('room', ({ id }) => {
    cubukBoya();
    odaAlt(id);
  });
  K.on('presence', () => {
    yanBoya();
    kaleCanli();
    on() && K.salon && K.salon.current && K.salon.current() === 'kale' && !K.activeRoom && kale();
  });
  K.on('cloud', (ok) => ok && setTimeout(() => (aniVeri = null), 3000));
  window.addEventListener('hashchange', () => setTimeout(cubukBoya, 50));
  setInterval(yanBoya, 20000);
  K.kale4 = { NIYET, niyetOf, odalar, kale, anilar, duzenle, favDegis, ben: benSayfa, sekme: sekmeyeGit, acilis, kaleCanli };
})();
