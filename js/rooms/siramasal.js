/* Oda: Sırayla Masal — yeni masallar, cümle cümle, sırayla: biriniz yazınca kalem öbürüne geçer. Kitty her cümlenin
   kelimelerine bakıp küçük bir çizim yapıştırır (deniz, kedi, ay, kule, zambak...). Otuz cümle olunca masal kapanır ve
   kitap olur; biten masallar Uyku Masalları'nın rafında da durur, gece ekranında okunur.
   Kayıtlar: masalkitap {bid, title}, masalcumle {bid, i, text} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const LEN = 30;
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const TITLES = ['Fiyonkunu Kaybeden Bulut', 'Hazar\'ın Altındaki Kütüphane', 'Martı ile Güvercinin Yarışı', 'Ay\'a Merdiven Kuran Kedi', 'İki Kule Arasındaki Gizli Tünel', 'Kar Tanesinin Uzun Yolculuğu', 'Rüzgârın Unuttuğu Şarkı', 'Zambak Bahçesinin Gece Bekçisi', 'Kayıp Saatin Peşinde', 'Deniz Kızının Mektubu'];
  // Kitty'nin çizimleri: anahtar kelime kökleri → küçük SVG
  const ART = [
    [/deniz|dalga|hazar|boğaz|okyanus|su\b|göl/, 'dalga', '<path d="M4 34 q8 -8 16 0 t16 0 t16 0 t16 0" /><path d="M4 46 q8 -8 16 0 t16 0 t16 0 t16 0" />'],
    [/kedi|pamuk|miyav|pati/, 'kedi', '<path d="M14 54 C10 34 18 24 34 24 C50 24 58 34 54 54 Z"/><path d="M18 28 L16 12 L28 20 Z M50 28 L52 12 L40 20 Z"/><circle cx="27" cy="38" r="2.5" class="d"/><circle cx="41" cy="38" r="2.5" class="d"/>'],
    [/\bay\b|ay'|ayın|dolunay|gece|karanlık/, 'ay', '<path d="M44 10 a24 24 0 1 0 0 48 a18 18 0 1 1 0 -48 z"/>'],
    [/yıldız|gökyüzü|kayan/, 'yildiz', '<path d="M34 6 l7 18 h19 l-15 11 6 19 -17 -11 -17 11 6 -19 -15 -11 h19 z"/>'],
    [/kule|kale|saray|şato/, 'kule', '<path d="M22 58 V24 h24 v34 Z"/><path d="M18 24 L34 6 L50 24 Z"/><rect x="30" y="40" width="8" height="18" class="d"/>'],
    [/çiçek|zambak|gül|bahçe|lale/, 'cicek', '<circle cx="34" cy="24" r="7" class="d"/><ellipse cx="34" cy="12" rx="6" ry="9"/><ellipse cx="34" cy="36" rx="6" ry="9"/><ellipse cx="22" cy="24" rx="9" ry="6"/><ellipse cx="46" cy="24" rx="9" ry="6"/><path d="M34 42 V62"/>'],
    [/yağmur|bulut|fırtına|şemsiye/, 'bulut', '<path d="M16 40 a10 10 0 0 1 4 -19 a14 14 0 0 1 27 -2 a10 10 0 0 1 5 21 Z"/><path d="M22 48 l-3 8 M34 48 l-3 8 M46 48 l-3 8"/>'],
    [/güneş|sabah|ışık|gün doğ/, 'gunes', '<circle cx="34" cy="34" r="12"/><path d="M34 6 v10 M34 52 v10 M6 34 h10 M52 34 h10 M14 14 l7 7 M47 47 l7 7 M14 54 l7 -7 M47 21 l7 -7"/>'],
    [/kalp|sevgi|aşk|sevgili|öp/, 'kalp', '<path d="M34 56 C10 40 10 18 24 16 C30 15 34 20 34 24 C34 20 38 15 44 16 C58 18 58 40 34 56 Z"/>'],
    [/gemi|sandal|vapur|tekne|yelken/, 'gemi', '<path d="M10 44 h48 l-8 12 H18 Z"/><path d="M34 10 V44 M34 12 L52 38 H34"/>'],
    [/kuş|martı|güvercin|uç/, 'kus', '<path d="M8 30 q12 -12 26 2 q14 -14 26 -2"/><path d="M20 44 q8 -8 14 0 q6 -8 14 0"/>'],
    [/ağaç|orman|yaprak/, 'agac', '<circle cx="34" cy="26" r="18"/><path d="M34 44 V62"/>'],
    [/ev\b|evim|kapı|pencere/, 'ev', '<path d="M14 58 V30 L34 12 L54 30 V58 Z"/><rect x="28" y="40" width="12" height="18" class="d"/>'],
    [/prenses|taç|kraliçe|kral/, 'tac', '<path d="M10 48 L14 18 L26 32 L34 12 L42 32 L54 18 L58 48 Z"/>'],
    [/fiyonk|kurdele/, 'fiyonk', '<path d="M34 34 C20 18 6 22 10 34 C6 46 20 50 34 34 Z"/><path d="M34 34 C48 18 62 22 58 34 C62 46 48 50 34 34 Z"/><circle cx="34" cy="34" r="5" class="d"/>'],
    [/anahtar|kilit|sır/, 'anahtar', '<circle cx="20" cy="34" r="10"/><path d="M30 34 H60 M52 34 v8 M58 34 v6"/>'],
    [/kar\b|kış|buz|soğuk/, 'kar', '<path d="M34 8 V60 M12 21 L56 47 M12 47 L56 21"/><path d="M28 12 l6 6 6 -6 M28 56 l6 -6 6 6"/>'],
    [/dağ|tepe|kafkas/, 'dag', '<path d="M4 58 L26 18 L40 40 L50 26 L64 58 Z"/>'],
    [/kitap|mektup|yaz|masal/, 'kitap', '<path d="M8 16 Q22 10 34 18 Q46 10 60 16 V54 Q46 48 34 56 Q22 48 8 54 Z"/><path d="M34 18 V56"/>'],
  ];
  const pick = (text, i) => {
    const t = String(text || '').toLocaleLowerCase('tr');
    const hit = ART.find(([re]) => re.test(t));
    return hit || ART[(i * 7) % ART.length];
  };
  const svg = (a, cls = '') => `<svg class="sm-cizim ${cls}" viewBox="0 0 68 68" aria-hidden="true"><g>${a[2]}</g></svg>`;
  let books = [], lines = [], loaded = false, root = null, open = null;
  const linesOf = (bid) => lines.filter((l) => l.data.bid === bid).sort((a, b) => a.data.i - b.data.i || a.at - b.at);
  const doneB = (bid) => linesOf(bid).length >= LEN;
  const current = () => books.filter((b) => !doneB(b.data.bid)).pop() || null;
  const turnOf = (bid) => {
    const ls = linesOf(bid);
    if (!ls.length) return mine();
    return ls[ls.length - 1].who === 'me' ? 'her' : 'me';
  };
  function render() {
    if (!root || K.activeRoom !== 'siramasal') return;
    const b = current();
    const fin = books.filter((x) => doneB(x.data.bid));
    if (!b) {
      K.$('#smAktif', root).innerHTML = `<div class="sm-yeni"><p class="card-eyebrow">Yeni bir masal</p><p>Bir ad seç ya da kendin yaz; ilk cümleyi sen başlat.</p>
        <div class="sm-adlar">${K.shuffle(TITLES.slice()).slice(0, 4).map((t) => `<button type="button" class="btn soft small" data-sm-ad="${K.esc(t)}">${K.esc(t)}</button>`).join('')}</div>
        <input class="input" id="smAd" maxlength="50" placeholder="Masalın adı"><div class="row"><button type="button" class="btn red" data-sm-basla>📖 Masalı başlat</button></div></div>`;
    } else {
      const ls = linesOf(b.data.bid);
      const turn = turnOf(b.data.bid);
      K.$('#smAktif', root).innerHTML = `<p class="card-eyebrow">${ls.length}/${LEN} cümle</p><h2 class="sm-baslik">${K.esc(b.data.title)}</h2>
        <div class="sm-sayfalar">${ls.slice(-6).map((l, k) => `<div class="sm-cumle ${l.who}">${svg(pick(l.data.text, l.data.i))}<p>${K.esc(l.data.text)}</p><small>${K.esc(nameOf(l.who))}</small></div>`).join('')}</div>
        ${turn === mine() ? `<textarea class="input" id="smCumle" maxlength="220" rows="2" placeholder="${ls.length ? 'Masala bir cümle ekle...' : 'Bir varmış, bir yokmuş...'}"></textarea><div class="row"><button type="button" class="btn red" data-sm-ekle="${b.data.bid}">✍️ Cümlemi ekle</button></div>` : `<p class="sm-sira">🖊️ Kalem ${K.esc(K.ek(nameOf(turn), 'de'))}. O yazınca sıra sana gelecek.</p>`}`;
    }
    K.$('#smRaf', root).innerHTML = fin.length ? `<p class="card-eyebrow">Biten masallarımız</p><div class="sm-raf">${fin.map((x) => `<button type="button" class="sm-kitap" data-sm-oku="${x.data.bid}"><b>${K.esc(x.data.title)}</b><small>${LEN} cümle</small></button>`).join('')}</div>` : '';
  }
  async function start(btn) {
    const title = (K.$('#smAd', root).value || '').trim().slice(0, 50);
    if (!title) return K.$('#smAd', root).focus();
    btn.disabled = true;
    const r = await K.cloud.add('masalkitap', { bid: 'b' + Date.now().toString(36), title });
    if (r) books.push(r);
    render();
  }
  async function add(btn) {
    const ta = K.$('#smCumle', root);
    const text = (ta.value || '').trim().slice(0, 220);
    if (!text) return ta.focus();
    btn.disabled = true;
    const bid = btn.dataset.smEkle;
    const r = await K.cloud.add('masalcumle', { bid, i: linesOf(bid).length, text });
    if (!r) return (btn.disabled = false), K.fx.toast('Eklenemedi.');
    lines.push(r);
    K.audio.sfx.paper ? K.audio.sfx.paper() : K.audio.sfx.pop();
    const n = linesOf(bid).length;
    K.stickers.award('siramasal');
    const b = books.find((x) => x.data.bid === bid);
    if (n >= LEN) {
      K.fx.confetti({ count: 120 });
      K.ping(`📖 Masalımız bitti: ${b.data.title}`, `Otuzuncu cümleyi ${K.meName()} yazdı. Bu gece birlikte okuyalım mı?`, ['books'], { click: K.roomUrl('siramasal') });
    } else K.ping(`✍️ Kalem sende: ${b.data.title}`, `"${text.slice(0, 90)}"`, ['memo'], { click: K.roomUrl('siramasal') });
    render();
  }
  // Gece okuma ekranı (Uyku Masalları'ndan da açılır)
  function read(bid) {
    const b = books.find((x) => x.data.bid === bid);
    if (!b) return;
    const ls = linesOf(bid);
    const ov = K.el(`<div class="sm-oku" role="dialog" aria-modal="true" aria-label="${K.esc(b.data.title)}"><button type="button" class="icon-btn sm-x" aria-label="Kapat">${A.ui('close')}</button>
      <div class="sm-oku-ic"><p class="card-eyebrow">Sırayla Masal · ${K.esc(nameOf('her'))} ve ${K.esc(nameOf('me'))}</p><h2>${K.esc(b.data.title)}</h2>
      ${ls.map((l) => `<div class="sm-oku-c ${l.who}">${svg(pick(l.data.text, l.data.i))}<p>${K.esc(l.data.text)}</p></div>`).join('')}<p class="sm-son">Son.</p></div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    K.$('.sm-x', ov).addEventListener('click', () => (ov.classList.remove('in'), setTimeout(() => ov.remove(), 400)));
  }
  // Uyku Masalları rafına biten masallar
  K.on('room', ({ id, el }) => {
    if (id !== 'uyku' || !el) return;
    const fin = books.filter((x) => doneB(x.data.bid));
    let box = K.$('#smUyku', el);
    if (!fin.length) return box && box.remove();
    if (!box) {
      box = K.el('<section class="card sm-uyku" id="smUyku"></section>');
      el.appendChild(box);
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-sm-oku]');
        b && read(b.dataset.smOku);
      });
    }
    box.innerHTML = `<p class="card-eyebrow">Bizim yazdığımız masallar</p><div class="sm-raf">${fin.map((x) => `<button type="button" class="sm-kitap gece" data-sm-oku="${x.data.bid}"><b>${K.esc(x.data.title)}</b><small>Sırayla Masal</small></button>`).join('')}</div>`;
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [books, lines] = await Promise.all([K.cloud.list('masalkitap', 200), K.cloud.list('masalcumle', 3000)]);
    loaded = true;
    K.cloud.on('masalkitap', (r) => books.some((x) => x.id === r.id) || (books.push(r), render()));
    K.cloud.on('masalcumle', (r) => lines.some((x) => x.id === r.id) || (lines.push(r), render()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const b = loaded && current();
    if (!b || turnOf(b.data.bid) !== mine() || !linesOf(b.data.bid).length) return [];
    return [{ key: 'siramasal', icon: 'book', title: `🖊️ Kalem sende: ${b.data.title}`, text: `"${linesOf(b.data.bid).slice(-1)[0].data.text.slice(0, 90)}" Sıradaki cümle senin.`, room: 'siramasal', cta: 'Yaz' }];
  });
  K.room({
    id: 'siramasal',
    wing: 'oyun',
    title: 'Sırayla Masal',
    sub: 'Cümle cümle, Kitty\'nin çizimleriyle',
    icon: 'book',
    color: '#FFF3DF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => {
      const b = loaded && current();
      return b && turnOf(b.data.bid) === mine() && linesOf(b.data.bid).length ? '✍️' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Yeni masallar, cümle cümle ve sırayla: biri yazınca kalem öbürüne geçer. Kitty her cümleye küçük bir çizim yapıştırıyor. Otuz cümlede masal kitap oluyor; Uyku Masalları'nın rafında da duruyor.</p></div>
        <section class="card sm-aktif" id="smAktif"></section><section class="card" id="smRaf"></section>`;
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-sm-ad]');
        if (a) return (K.$('#smAd', el).value = a.dataset.smAd);
        const s = e.target.closest('[data-sm-basla]');
        if (s) return start(s);
        const x = e.target.closest('[data-sm-ekle]');
        if (x) return add(x);
        const o = e.target.closest('[data-sm-oku]');
        o && read(o.dataset.smOku);
      });
    },
    enter() {
      render();
    },
  });
  K.siramasal = { read, books: () => books.length, cizim: (text, i) => svg(pick(text, i)) };
})();
