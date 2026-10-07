/* Oda: Kitty'nin Günlüğü — Kitty her akşam kalede olanları kendi ağzından iki satırla yazar: "Bugün Elnoş üç kalp attı,
   Ardoş biraz geç geldi ama telafi etti." Günlük o günün kayıtlarından kendiliğinden kurulur (iki telefonda aynı metin);
   akşam 20:00'den sonra ana salonda küçük bir kart olarak da görünür. Odada son otuz günün sayfaları.
   Yeni kayıt tutmaz; okunanlar: kalpk, kucak, selam, dusun, ozlem, tsmesaj, kare, minnet, gunbatimi, elele, nefes, hava,
   postcard, gulus, fisilti, halka, dilekfener, bina, mektup */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const TUR = {
    kalpk: ['kalp attı', 'kalp'], kucak: ['kez sarıldı', 'sarılma'], selam: ['kez selam verdi', 'selam'], dusun: ['kez "seni düşünüyorum" dedi', 'düşünme'],
    ozlem: ['kez özlediğini söyledi', 'özlem'], tsmesaj: ['sesli mesaj bıraktı', 'ses'], kare: ['günün karesini çekti', 'kare'], minnet: ['minnet cümlesi yazdı', 'minnet'],
    postcard: ['kartpostal gönderdi', 'kart'], gulus: ['gülüş bıraktı', 'gülüş'], fisilti: ['fısıltı bıraktı', 'fısıltı'], elyazisi: ['el yazısıyla mektup yazdı', 'mektup'],
  };
  const SAYILAR = ['bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on'];
  const sayi = (n) => (n <= 10 ? SAYILAR[n - 1] : K.num(n));
  const gunBas = (gun) => T.at(gun).getTime();
  let cache = {}, root = null;

  async function kayitlar(since, before) {
    if (!K.cloud || !K.cloud.enabled) return [];
    return K.cloud.many(Object.keys(TUR).concat(['gunbatimi', 'elele', 'nefes', 'hava', 'halka', 'dilekfener', 'bina']), { since, before, limit: 3000 });
  }
  // Bir günün iki satırı (aynı veriden iki telefonda aynı metin)
  function yaz(gun, rows) {
    const r = K.rng(K.hash('kg' + gun));
    const say = (w, k) => rows.filter((x) => x.who === w && x.kind === k).length;
    const ilk = (w) => Math.min(...rows.filter((x) => x.who === w).map((x) => x.at), Infinity);
    const olaylar = [];
    ['her', 'me'].forEach((w) => {
      Object.keys(TUR).forEach((k) => {
        const n = say(w, k);
        if (n) olaylar.push({ w, k, n, txt: `${nameOf(w)} ${['kalpk', 'kucak', 'selam', 'dusun', 'ozlem'].includes(k) ? sayi(n) + ' ' : n > 1 ? sayi(n) + ' ' : ''}${TUR[k][0]}` });
      });
    });
    olaylar.sort((a, b) => b.n - a.n || (a.w === 'her' ? -1 : 1));
    const sec = [];
    olaylar.forEach((o) => sec.length < 2 && !sec.some((x) => x.w === o.w) && sec.push(o));
    olaylar.forEach((o) => sec.length < 2 && !sec.includes(o) && sec.push(o));
    if (!sec.length) return null;
    const satir1 = `Bugün ${sec.map((o) => o.txt).join(sec.length > 1 && sec[0].w !== sec[1].w ? ', ' : ' ve ')}.`;
    // İkinci satır: günün küçük bir gözlemi
    const gb = rows.filter((x) => x.kind === 'gunbatimi');
    const hv = rows.filter((x) => x.kind === 'hava');
    const kotu = hv.find((x) => ['yagmur', 'firtina', 'sis', 'kar'].includes(x.data && x.data.type));
    const p = (at) => T.baku(new Date(at));
    const gec = ['me', 'her'].find((w) => ilk(w) !== Infinity && p(ilk(w)).h >= 21);
    const yalniz = ['me', 'her'].find((w) => ilk(w) === Infinity);
    const notlar = [];
    if (gb.some((x) => x.who === 'me') && gb.some((x) => x.who === 'her')) notlar.push('Güneşi birlikte uğurladılar; gökyüzü iki şehirde de pembeydi.');
    if (rows.some((x) => x.kind === 'elele')) notlar.push('Bir ara el ele tuttular. Ben gördüm, kimseye söylemem.');
    if (rows.some((x) => x.kind === 'nefes')) notlar.push('Birlikte nefes aldılar; ben de onlarla aldım.');
    if (kotu) {
      const o = kotu.who === 'me' ? 'her' : 'me';
      notlar.push(rows.some((x) => x.who === o && ['gulus', 'kucak', 'tsmesaj', 'fisilti'].includes(x.kind)) ? `${nameOf(kotu.who)} içi bulutluydu; ${nameOf(o)} hemen yanına koştu.` : `${nameOf(kotu.who)} içi biraz bulutluydu. Yarın güneşli olsun.`);
    }
    if (gec) notlar.push(`${nameOf(gec)} biraz geç geldi ama telafi etti.`);
    if (yalniz) notlar.push(`${nameOf(yalniz)} bugün pek uğrayamadı; kale onu özledi.`);
    if (rows.some((x) => x.kind === 'halka')) notlar.push('Kâğıt zincirden bir halka daha koptu. Az kaldı.');
    if (rows.some((x) => x.kind === 'dilekfener')) notlar.push('Gökyüzüne yeni bir fener yükseldi.');
    if (rows.some((x) => x.kind === 'bina')) notlar.push('Şehirlerine yeni bir bina eklendi.');
    const genel = ['Kale bugün de sıcacıktı.', 'Ben bütün gün fiyonkumu düzelttim, onlar birbirini düşündü.', 'Pamuk da selam söyledi.', 'Kavanoz biraz daha doldu.', 'Bugün de birbirlerini çok sevdiler.'];
    const satir2 = notlar.length ? notlar[Math.floor(r() * notlar.length)] : genel[Math.floor(r() * genel.length)];
    return { gun, satir1, satir2, n: rows.length };
  }
  async function gunluk(gun) {
    if (cache[gun] && (gun !== T.todayKey() || Date.now() - cache[gun].t < 10 * 60e3)) return cache[gun].v;
    const s = gunBas(gun);
    const v = yaz(gun, await kayitlar(s, s + 864e5));
    cache[gun] = { t: Date.now(), v };
    return v;
  }
  async function kart() {
    const box = K.$('#k4Gunluk');
    if (!box) return;
    const h = new Date().getHours();
    const g = h >= 20 || h < 3 ? (h < 3 ? T.key(T.baku(new Date(Date.now() - 864e5))) : T.todayKey()) : null;
    const v = g && (await gunluk(g));
    box.hidden = !v;
    if (!v) return;
    box.innerHTML = `<article class="card kg-kart"><div class="kg-kitty" aria-hidden="true">${K.art.kitty({ cls: 'is-happy kg-k' })}</div><div><p class="card-eyebrow">Kitty'nin günlüğü · ${K.esc(T.fmtShort(g))}</p><p class="kg-yazi">${K.esc(v.satir1)}<br>${K.esc(v.satir2)}</p><a class="k4-link" href="#kittygunluk">Bütün sayfalar ›</a></div></article>`;
  }
  async function render() {
    if (!root || K.activeRoom !== 'kittygunluk') return;
    const box = K.$('#kgListe', root);
    box.innerHTML = '<p class="muted center">Kitty sayfaları karıştırıyor...</p>';
    const bugun = T.todayKey();
    const since = gunBas(T.key(T.baku(new Date(Date.now() - 30 * 864e5))));
    const tum = await kayitlar(since, Date.now() + 864e5);
    const gunler = {};
    tum.forEach((x) => (gunler[T.key(T.baku(new Date(x.at)))] = gunler[T.key(T.baku(new Date(x.at)))] || []).push(x));
    const l = Object.keys(gunler).sort().reverse().map((g) => yaz(g, gunler[g])).filter(Boolean);
    box.innerHTML = l.length
      ? l.map((v) => `<article class="kg-sayfa ${v.gun === bugun ? 'bugun' : ''}"><time>${K.esc(T.fmt(v.gun, true))}</time><p>${K.esc(v.satir1)}</p><p class="hand">${K.esc(v.satir2)}</p></article>`).join('')
      : '<p class="muted center">Günlük henüz boş. Kalede bir şey olunca Kitty yazmaya başlar.</p>';
    K.stickers.award('kittygunluk');
  }
  K.on('built', () => {
    const sp = K.$('#special');
    if (sp && !K.$('#k4Gunluk')) sp.insertAdjacentHTML('afterend', '<section class="wrap k4-gunluk" id="k4Gunluk" hidden></section>');
  });
  K.on('cloud', (ok) => ok && setTimeout(kart, 4000));
  setInterval(() => !K.activeRoom && kart(), 15 * 60e3);
  K.room({
    id: 'kittygunluk',
    wing: 'anilar',
    title: 'Kitty\'nin Günlüğü',
    sub: 'Her akşam iki satır',
    icon: 'book',
    color: '#FFF1F6',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kitty her akşam kalede olanları kendi ağzından iki satırla yazıyor. Son otuz günün sayfaları burada.</p></div><div class="kg-liste" id="kgListe"></div>`;
    },
    enter() {
      render();
    },
  });
  K.kittygunluk = { gunluk, yaz, kart };
})();
