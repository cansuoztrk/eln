/* Kale 2.0 — Akış: kaledeki bütün bulut kayıtlarını tek bir anı diline çevirir.
   Hikâyeler (son iki gün) ve Gün Gün Biz (tanıştığımız günden beri) bunu kullanır.
   Mühürlü şeylerin (ilkler, 36 soru, kabin yarım şeridi, günün sesi) içeriği burada asla açılmaz; sadece "bir şey bıraktı" denir. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const dayOf = (at) => T.key(T.baku(new Date(at)));
  const cut = (s, n = 140) => {
    s = String(s || '').trim();
    return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
  };

  // Her tür: kayıt → {icon, room, title, text, img, emoji, weight} ya da null (gösterilmez)
  const N = {
    hikaye: (r) => ({ icon: r.data.audio ? 'mic' : 'camera', room: '', emoji: r.data.audio ? '🎙️' : '', title: r.data.audio ? 'Sesli hikâye' : 'Hikâye', text: r.data.text || '', img: r.data.thumb, bg: r.data.bg, story: true, weight: 3 }),
    dvoice: (r) => ({ icon: 'mic', room: 'gunses', emoji: '🎙️', title: 'Günün Sesi\'ni bıraktı', text: `${Math.round(r.data.dur || 0)} saniyelik bir ses. Seninkini bırakınca açılır.`, weight: 3 }),
    hava: (r) => {
      const t = K.hava && K.hava.type(r.data.type);
      return t ? { icon: 'cloud', room: 'hava', emoji: K.hava.emo[t[0]], title: `İçinin havası: ${t[1]}`, text: r.data.note || t[2], weight: 2 } : null;
    },
    hvcare: (r) => {
      const c = K.hava && K.hava.care(r.data.kind);
      if (!c) return null;
      const toMe = r.data.to === mine();
      return { icon: 'cloud', room: 'hava', emoji: K.hava.careEmo[r.data.kind] || '♥', title: toMe ? `Sana ${c[1].toLocaleLowerCase('tr')} gönderdi` : `${nameOf(r.data.to)} için ${c[1].toLocaleLowerCase('tr')} gönderdi`, text: c[2], weight: 3 };
    },
    postcard: (r) => ({ icon: 'frame', room: 'kartpostal', title: 'Kartpostal', text: r.data.text || '', img: r.data.thumb, weight: 3 }),
    kphoto: (r) => ({ icon: 'camera', room: 'gunluk', title: r.data.place ? `Bakü Günlüğü · ${r.data.place}` : 'Bakü Günlüğü', text: r.data.cap || '', img: r.data.thumb, weight: 3 }),
    pb: (r) => ({ icon: 'camera', room: 'kabin', emoji: '📸', title: 'Fotoğraf Kabini\'nde yarım bir şerit', text: 'Senin yarını bekliyor; sen çekince ikisi birleşir.', weight: 2 }),
    sfplate: (r) => ({ icon: 'pot', room: 'sofra', title: 'Aynı Sofra · tabağı', text: '', img: r.data.thumb, weight: 2 }),
    sofra: (r) => ({ icon: 'pot', room: 'sofra', emoji: '🍽️', title: 'Sofrayı kurdu', text: 'Aynı akşam, aynı yemek.', weight: 2 }),
    sahne: (r) => ({ icon: 'clapper', room: 'sinema', title: 'Filmimize bir sahne', text: r.data.text || '', img: r.data.thumb, weight: 3 }),
    ilk: (r) => {
      const it = D.ilkler && D.ilkler.items.find((x) => x[0] === r.data.key);
      return it ? { icon: 'first', room: 'ilkler', emoji: '🔏', title: `Bir ilki hatırladı: ${it[1]}`, text: 'Mühürlü. Sen de yazınca ikisi yan yana açılır.', weight: 2 } : null;
    },
    dakika: () => ({ icon: 'star', room: 'dakika', emoji: '⭐', title: '21:21\'de kalbe bastı', text: 'Aynı dakikada, iki şehirden.', weight: 1 }),
    song: (r) => ({ icon: 'vinyl', room: 'sarkidefteri', emoji: '🎵', title: 'Şarkı Defteri\'ne bir şarkı', text: `${r.data.title}${r.data.artist ? ' · ' + r.data.artist : ''}${r.data.note ? '. ' + r.data.note : ''}`, weight: 2 }),
    page: (r) => ({ icon: 'book', room: 'defter', emoji: '📖', title: 'Bizim Defter\'e yazdı', text: cut(r.data.text), weight: 2 }),
    live: (r) => ({ icon: 'letter', room: '', emoji: '💌', title: 'Canlı not', text: cut(r.data.text, 200), weight: 2 }),
    letter: (r) => (r.data.open && T.daysUntil(r.data.open) > 0 ? null : { icon: 'letter', room: 'mektuplar', emoji: '💌', title: `Mektup: ${r.data.title}`, text: 'Açılınca Oku\'da seni bekliyor.', weight: 3 }),
    tale: (r) => ({ icon: 'story', room: 'devam', emoji: '📜', title: 'Masala bir cümle ekledi', text: cut(r.data.text), weight: 2 }),
    pigeon: (r) => (r.data.arrive > Date.now() ? null : { icon: 'pigeon', room: 'guvercin', emoji: '🕊️', title: 'Bir güvercin kondu', text: cut(r.data.text), weight: 2, at: r.data.arrive }),
    coin: (r) => ({ icon: 'jar', room: 'kumbara', emoji: '🪙', title: `Kumbaraya ${K.num(r.data.amount)} ${r.data.cur || ''} attı`, text: r.data.note || 'Bilete bir adım daha.', weight: 2 }),
    hug: () => ({ icon: 'hugs', room: 'birlikte', emoji: '🤗', title: 'Sarıldı', text: 'Uzaktan ama sımsıkı.', weight: 1 }),
    answer: (r) => ({ icon: 'question', room: 'sorular', emoji: '💬', title: 'Günün sorusunu cevapladı', text: cut(r.data.a), weight: 2 }),
    luck: () => ({ icon: 'cap', room: 'kalkan', emoji: '🍀', title: 'Sınavına şans tılsımı', text: 'Sınav Kalkanı\'nda.', weight: 2 }),
    exam: (r) => ({ icon: 'cap', room: 'kalkan', emoji: '📚', title: `Sınav: ${r.data.name}`, text: r.data.date ? T.fmt(r.data.date) : '', weight: 1 }),
    bloom: () => ({ icon: 'lily', room: 'zambak', emoji: '🌷', title: 'Zambak açtı', text: 'Yedi gün sulandı, sonunda açtı.', weight: 2 }),
    bouquet: (r) => ({ icon: 'lily', room: 'zambak', emoji: '💐', title: `${r.data.count || ''} zambaklık buket`.trim(), text: r.data.note || '', weight: 3 }),
    nerdwin: (r) => ({ icon: 'dice', room: 'nerd', emoji: '🎲', title: `Nərdde ${nameOf(r.data.winner)} kazandı`, text: r.data.pts > 1 ? 'Hem de mars!' : '', weight: 1 }),
    sleep: () => ({ icon: 'moon', room: 'gece', emoji: '🌙', title: 'Uyudu', text: 'Gece Lambası\'nı kapattı. İyi geceler.', weight: 1 }),
    filmview: (r) => (r.data.done ? { icon: 'clapper', room: 'sinema', emoji: '🎬', title: 'Bizim Filmimiz\'i izledi', text: r.data.together ? 'Birlikte.' : 'Jeneriğe kadar.', weight: 2 } : null),
    flight: (r) => (r.data.date ? { icon: 'plane', room: 'bilet', emoji: '✈️', title: 'Biniş kartı!', text: T.fmt(r.data.date), weight: 4 } : null),
    cark: (r) => {
      const it = D.randevu && D.randevu.cark.find((c) => c[0] === r.data.pick);
      return it ? { icon: 'candle', room: 'randevu', emoji: '🎡', title: `Akşamın randevusu: ${it[1]}`, text: it[2], weight: 1 } : null;
    },
    r36: (r) => ({ icon: 'candle', room: 'randevu', emoji: '🕯️', title: `36 Soru · ${r.data.i + 1}. soru`, text: 'Cevabı mühürlü; sen de cevaplayınca açılır.', weight: 1 }),
    ev: (r) => {
      const d = K.ev && K.ev.def(r.data.it);
      return d && !r.data.gone ? { icon: 'house', room: 'ev', emoji: d[2].startsWith('svg:') ? '🏠' : d[2], title: `Evimize: ${d[1]}`, text: r.data.note || K.ev.roomName(r.data.room), weight: 1, uid: r.data.uid } : null;
    },
    kletter: () => ({ icon: 'letter', room: 'gunluk', emoji: '✉️', title: 'Kavuşunca açılacak bir mektup yazdı', text: 'Mühürlü.', weight: 2 }),
    knote: (r) => ({ icon: 'note', room: 'gunluk', emoji: '📝', title: 'Günün cümlesi', text: cut(r.data.text), weight: 2 }),
    promise: () => ({ icon: 'ticket', room: 'kuponlar', emoji: '🎟️', title: 'Bir kupon', text: 'Aşk Kuponları\'nda.', weight: 1 }),
    opened: () => ({ icon: 'bow', room: '', emoji: '🎀', title: 'Kurdeleyi kesti', text: 'Kalenin kapıları açıldı.', weight: 5 }),
    round: (r) => ({ icon: 'pencil', room: 'gartic', emoji: '✏️', title: 'Gartic turu', text: r.data.win ? `"${r.data.word}" bilindi.` : 'Bilinemedi.', weight: 1 }),
    filmline: () => ({ icon: 'clapper', room: 'sinema', emoji: '🎞️', title: 'Filmdeki bir soruya cevap', text: 'Sen de cevaplayınca açılır.', weight: 1 }),
    hangi: () => null,
    kare: (r) => {
      const open = r.who === (K.isOwner() ? 'me' : 'her') || (K.kare && K.kare.mineDone(r.data.day));
      return { icon: 'camera', room: 'kare', emoji: '🖼️', title: `Günün Karesi: ${r.data.p}`, text: open ? '' : 'Seninkini koyunca açılır.', img: open ? r.data.thumb : null, weight: 3 };
    },
    zamanli: () => null,
    durum: (r) => (r.data.k ? { icon: 'chat', room: '', emoji: r.data.emoji, title: `Durumu: ${r.data.text}`, text: '', weight: 1 } : null),
    selam: (r) => ({ icon: r.data.k === 'gece' ? 'moon' : 'sun', room: '', emoji: r.data.k === 'gece' ? '🌙' : '☀️', title: r.data.k === 'gece' ? 'İyi geceler' : 'Günaydın', text: r.data.text || '', weight: 2 }),
    kucak: () => ({ icon: 'hugs', room: '', emoji: '🤗', title: 'Sana sarıldı', text: 'Kalp menüsünden, sımsıkı.', weight: 2 }),
    dusun: () => ({ icon: 'heart', room: '', emoji: '💭', title: 'Seni düşündü', text: '', weight: 0 }),
    ozlem: () => ({ icon: 'heart', room: '', emoji: '🥺', title: 'Seni özledi', text: '', weight: 0 }),
    radyo: (r) => (r.data.state === 'play' && r.data.song ? { icon: 'vinyl', room: 'radyo', emoji: '📻', title: `Radyoda: ${r.data.song.title}`, text: r.data.song.artist || '', weight: 2 } : null),
    ppwin: (r) => ({ icon: 'heart', room: 'pinpon', emoji: '🏓', title: `Pinpon: ${nameOf(r.data.winner)} kazandı`, text: r.data.score ? `${r.data.score.me}–${r.data.score.her}` : '', weight: 2 }),
    baristi: (r) => {
      const m = Math.max(1, Math.round((r.data.dur || 0) / 6e4));
      const d = m < 60 ? `${m} dakika` : m < 1440 ? `${Math.round(m / 60)} saat` : `${Math.round(m / 1440)} gün`;
      return { icon: 'kintsugi', room: 'baris', emoji: '🕊️', title: 'Barıştık', text: `${d} sürdü. Kalbe bir altın damar daha.`, weight: 4, uid: 'b' + r.data.ep };
    },
    barissoz: (r) => ({ icon: 'kintsugi', room: 'baris', emoji: '💛', title: 'Bir barış sözü', text: cut(r.data.text), weight: 3 }),
    kural: (r) => ({ icon: 'note', room: 'baris', emoji: '📜', title: 'Barış Antlaşması\'na bir madde', text: cut(r.data.text), weight: 2 }),
    kedisahip: () => ({ icon: 'paw', room: 'kedi', emoji: '🐾', title: 'Kalenin kapısındaki yavru kediyi sahiplendi', text: 'Artık ikimizin bir kedisi var.', weight: 4 }),
    kedionay: () => ({ icon: 'paw', room: 'kedi', emoji: '🎀', title: `Kedimizin adı: ${K.kedi ? K.kedi.name() : ''}`, text: 'Biri önerdi, öbürü onayladı.', weight: 3 }),
    kalpk: (r) => ({ icon: 'jar', room: 'kavanoz', emoji: '💗', title: 'Kavanoza kalp attı', text: r.data.note ? 'İçinde küçük bir not var.' : '', weight: 1, uid: 'k' + r.who + dayOf(r.at) }),
    tsmesaj: (r) => ({ icon: 'radio', room: 'telesekreter', emoji: '📼', title: 'Telesekretere sesli mesaj bıraktı', text: `${Math.round(r.data.dur || 0)} saniye. Dinlemek için telesekretere.`, weight: 3 }),
    tahmin: (r) => ({ icon: 'question', room: 'tahmin', emoji: '🤔', title: r.data.t === 'cevap' ? 'Tahmin Et Beni: kendi sorusunu cevapladı' : 'Tahmin Et Beni: senin hakkında tahmin etti', text: 'İkiniz de yazınca açılır.', weight: 1, uid: 't' + r.who + r.data.day }),
    ozur: () => ({ icon: 'lily', room: 'baris', emoji: '🌷', title: 'Özür diledi', text: '', weight: 1 }),
    bayrak: () => ({ icon: 'flag', room: 'baris', emoji: '🕊️', title: 'Beyaz bayrak kaldırdı', text: '', weight: 1 }),
    kelime: (r) => ({ icon: 'cards', room: 'kelime', emoji: '🔤', title: r.data.won ? `Günün Kelimesi: ${r.data.guesses.length}. denemede buldu` : 'Günün Kelimesi: bulamadı', text: 'Harfler, sen de çözünce açılır.', weight: 1 }),
  };
  // Hikâyelerde gösterilen türler (son iki gün, onun yaptıkları)
  const STORY = ['hikaye', 'dvoice', 'hava', 'hvcare', 'postcard', 'kphoto', 'pb', 'sfplate', 'sofra', 'sahne', 'ilk', 'dakika', 'song', 'page', 'live', 'letter', 'tale', 'pigeon', 'coin', 'hug', 'answer', 'luck', 'bloom', 'bouquet', 'nerdwin', 'sleep', 'filmview', 'flight', 'cark', 'ev', 'kletter', 'knote', 'selam', 'kucak', 'radyo', 'ppwin', 'kelime', 'durum', 'kare', 'baristi', 'barissoz', 'kural', 'kedisahip', 'kedionay', 'kalpk', 'tsmesaj'];
  // Gün Gün Biz: büyük fotoğrafları taşımayan bütün türler
  const ALL = STORY.concat(['exam', 'promise', 'opened', 'round', 'filmline', 'r36', 'dusun', 'ozlem', 'ozur', 'bayrak', 'tahmin']);

  function norm(r) {
    const f = N[r.kind];
    if (!f) return null;
    let x = null;
    try {
      x = f(r);
    } catch (e) {}
    if (!x) return null;
    const at = x.at || r.at;
    return Object.assign({ id: r.id, kind: r.kind, who: r.who, at, day: dayOf(at), row: r }, x);
  }
  // Aynı eşyanın her sürüklenişi ayrı bir kayıt; akışta tek sayılır
  function dedupe(items) {
    const seen = new Set();
    return items.filter((x) => {
      if (!['ev', 'baristi', 'kalpk', 'tahmin'].includes(x.kind)) return true;
      if (seen.has(x.uid)) return false;
      seen.add(x.uid);
      return true;
    });
  }

  let recent = [], ready = false;
  const subs = [];
  const changed = () => subs.forEach((fn) => fn());

  async function loadRecent() {
    const rows = await K.cloud.many(STORY, { since: Date.now() - 50 * 36e5, limit: 400 });
    recent = dedupe(rows.map(norm).filter(Boolean));
    ready = true;
    changed();
  }
  // Bütün zamanlar (Gün Gün Biz): 1000'erlik sayfalarla geriye doğru
  let allP = null;
  function loadAll() {
    if (!K.cloud || !K.cloud.enabled) return Promise.resolve([]);
    return (allP = allP || (async () => {
      let out = [], before = Date.now() + 6e4;
      for (let page = 0; page < 12; page++) {
        const rows = await K.cloud.many(ALL, { before, limit: 1000 });
        out = rows.concat(out);
        if (rows.length < 1000) break;
        before = rows[0].at;
      }
      const seen = new Set();
      return dedupe(out.filter((r) => !seen.has(r.id) && seen.add(r.id)).map(norm).filter(Boolean));
    })());
  }

  K.on('cloud', (on) => {
    if (!on) return;
    // Odalar kendi kayıtlarını alsın diye biraz sonra
    setTimeout(loadRecent, 1200);
    ALL.forEach((k) =>
      K.cloud.on(k, (r) => {
        const x = norm(r);
        if (!x) return;
        if (allP) allP = allP.then((arr) => (arr.some((y) => y.id === x.id) ? arr : dedupe(arr.concat([x]))));
        if (STORY.includes(k) && !recent.some((y) => y.id === x.id)) {
          recent = dedupe(recent.concat([x]));
          changed();
        }
      })
    );
    K.cloud.on('deleted', ({ id }) => {
      if (recent.some((x) => x.id === id)) {
        recent = recent.filter((x) => x.id !== id);
        changed();
      }
    });
  });

  K.akis = {
    recent: () => recent.slice().sort((a, b) => a.at - b.at),
    ready: () => ready,
    all: loadAll,
    norm,
    onChange: (fn) => subs.push(fn),
    dayOf,
    nameOf,
  };
})();
