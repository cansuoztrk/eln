/* Oda: Bizim Özetimiz — kaledeki her şeyin sayılarla hikâyesi, tam ekran, dokunarak ilerleyen kartlar */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const count = (k) => Object.keys(K.store.get(k, {})).length;
  const len = (k) => (K.store.get(k, []) || []).length;

  function stats() {
    const together = T.daysSince(C.togetherDate);
    const answers = K.store.get('answers', {});
    const lastAns = Object.values(answers).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const hearts = Object.values(K.store.get('portraitHearts', {})).reduce((a, b) => a + b, 0);
    const live = K.store.get('liveInbox', []);
    return {
      months: T.monthsTogether(),
      together,
      hours: together * 24 + T.baku().h,
      met: T.daysSince(C.metDate),
      visits: len('visits') || 1,
      rooms: count('visited'),
      roomsTotal: K.rooms.length,
      letters: count('lettersRead'),
      lettersTotal: D.letters.length,
      hugs: K.store.get('hugs', 0),
      debt: K.hugDebt(),
      answers: Object.keys(answers).length,
      lastAns,
      stickers: K.stickers.done(),
      stickersTotal: K.stickers.total,
      treats: K.store.get('kopusTreats', 0),
      chats: count('chatsSeen'),
      notes: len('myWallNotes'),
      hearts,
      voices: count('voicesHeard'),
      liveIn: live.filter((m) => m.dir === 'in').length,
      liveOut: live.filter((m) => m.dir === 'out').length,
      drawings: len('drawings'),
    };
  }

  function slides(s) {
    const out = [];
    out.push({ bg: 'a', kicker: s.months ? `${s.months}. ayımız` : 'İlk ayımız', big: 'Bizim Özetimiz', text: `Kalede geçen günlerin, sayılarla. Dokun ve ilerle.`, kitty: true });
    out.push({ bg: 'b', kicker: 'Birlikte', big: K.num(s.together), unit: 'gün', text: `Yani yaklaşık ${K.num(s.hours)} saat. Tanışalı ise ${K.num(s.met)} gün oldu.` });
    out.push({ bg: 'c', kicker: 'Kaleye uğradın', big: K.num(s.visits), unit: 'farklı gün', text: `${s.roomsTotal} odanın ${s.rooms} tanesini gezdin.${s.rooms < s.roomsTotal ? ' Bazı kapılar hâlâ seni bekliyor.' : ' Bütün kaleyi dolaştın!'}` });
    out.push({ bg: 'd', kicker: 'Açılan zarflar', big: `${s.letters}/${s.lettersTotal}`, unit: 'mektup', text: s.letters ? 'Her birini okurken yüzünü hayal ettim.' : 'Zarflar hâlâ mühürlü. Bir tanesini aç, sonra bu sayı değişsin.' });
    if (s.chats) out.push({ bg: 'e', kicker: 'Sohbetimizden', big: K.num(s.chats), unit: 'bölüm izledin', text: '"Ben daha ciddiyim" kaç kere tekrar izlendi, bilmiyorum. Ama ben saymayı bıraktım.' });
    out.push({ bg: 'f', kicker: 'Sarılma borcu', big: K.num(s.debt), unit: 'sarılma', text: s.hugs ? `${K.num(s.hugs)} tanesini uzaktan sen gönderdin. Hepsini faiziyle ödeyeceğim.` : 'Her gün bir tane birikiyor. Faiziyle ödeyeceğim.' });
    if (s.answers) out.push({ bg: 'b', kicker: 'Soru kutusu', big: K.num(s.answers), unit: 'cevap', text: s.lastAns ? `En son cevabın: "${s.lastAns.a.slice(0, 120)}"` : '' });
    if (s.liveIn + s.liveOut) out.push({ bg: 'c', kicker: 'Telsiz', big: K.num(s.liveIn + s.liveOut), unit: 'mesaj', text: `${K.num(s.liveOut)} tanesini sen gönderdin, ${K.num(s.liveIn)} tanesi bana ait.` });
    if (s.voices) out.push({ bg: 'd', kicker: 'Sesim', big: K.num(s.voices), unit: 'sesli not dinledin', text: 'Kulaklığından kalbine giden yol, en kısa yol.' });
    if (s.treats) out.push({ bg: 'e', kicker: 'Gizli kulübe', big: K.num(s.treats), unit: 'ödül maması', text: `${C.herDog} teşekkür ediyor. Kuyruğu hâlâ sallanıyor.` });
    if (s.hearts + s.notes) out.push({ bg: 'f', kicker: 'Kalede iz bıraktın', big: K.num(s.hearts + s.notes), unit: 'iz', text: `${s.hearts} portreye kalp, ${s.notes} not duvara.` });
    out.push({ bg: 'a', kicker: 'Çıkartma albümü', big: `${s.stickers}/${s.stickersTotal}`, unit: 'çıkartma', text: s.stickers >= s.stickersTotal ? 'Albüm tamam! Gizli mektup senin.' : `${s.stickersTotal - s.stickers} tane daha; gizli mektup yaklaşıyor.` });
    out.push({ bg: 'end', kicker: 'Ve', big: 'Seni seviyorum', text: K.fill(K.pick(D.wrapClosers.length ? D.wrapClosers : ['Ve bu daha başlangıç.'])), end: true });
    return out;
  }

  function play() {
    const list = slides(stats());
    const el = K.el(`<div class="wr" role="dialog" aria-modal="true" aria-label="Bizim Özetimiz">
      <div class="wr-bars">${list.map(() => '<i><b></b></i>').join('')}</div>
      <button class="wr-x" aria-label="Kapat">${A.ui('close')}</button>
      <div class="wr-slide" aria-live="polite"></div>
      <button class="wr-nav prev" aria-label="Geri"></button><button class="wr-nav next" aria-label="İleri"></button>
    </div>`);
    document.body.appendChild(el);
    document.body.classList.add('gate-open');
    requestAnimationFrame(() => el.classList.add('in'));
    let i = -1, t = null, closed = false;
    const bars = K.$$('.wr-bars b', el);
    const slide = K.$('.wr-slide', el);
    const DUR = 5600;
    function show(n) {
      clearTimeout(t);
      i = K.clamp(n, 0, list.length - 1);
      const s = list[i];
      el.dataset.bg = s.bg;
      bars.forEach((b, j) => {
        b.style.transition = 'none';
        b.style.width = j < i ? '100%' : '0%';
      });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          bars[i].style.transition = `width ${DUR}ms linear`;
          bars[i].style.width = s.end ? '100%' : '100%';
        })
      );
      slide.classList.remove('in');
      void slide.offsetWidth;
      slide.innerHTML = `${s.kitty ? `<div class="wr-kitty">${A.kitty({ crown: true, cls: 'is-happy' })}</div>` : ''}
        <p class="wr-kicker">${K.esc(s.kicker)}</p>
        <p class="wr-big ${String(s.big).length > 9 ? 'long' : ''}">${K.esc(s.big)}</p>
        ${s.unit ? `<p class="wr-unit">${K.esc(s.unit)}</p>` : ''}
        ${s.text ? `<p class="wr-text">${K.esc(s.text)}</p>` : ''}
        ${s.end ? `<div class="actions"><button class="btn red" data-again>${A.ui('refresh')} Bir daha izle</button><button class="btn soft" data-close>Kapat</button></div>` : ''}`;
      slide.classList.add('in');
      K.audio.sfx.note(['C5', 'E5', 'G5', 'A5', 'C6'][i % 5], 0.12);
      if (s.end) {
        K.stickers.award('ozet');
        K.fx.confetti({ count: 140 });
        return;
      }
      t = setTimeout(() => show(i + 1), DUR);
    }
    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(t);
      el.classList.remove('in');
      setTimeout(() => {
        el.remove();
        document.body.classList.remove('gate-open');
      }, 400);
    }
    el.addEventListener('click', (e) => {
      if (e.target.closest('.wr-x') || e.target.closest('[data-close]')) return close();
      if (e.target.closest('[data-again]')) return show(0);
      if (e.target.closest('.wr-nav.prev')) return show(i - 1);
      if (e.target.closest('.wr-nav.next')) return show(i + 1);
    });
    const onKey = (e) => {
      if (closed) return document.removeEventListener('keydown', onKey);
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    };
    document.addEventListener('keydown', onKey);
    show(0);
  }

  function render() {
    const s = stats();
    const tiles = [
      ['Birlikte', `${K.num(s.together)} gün`],
      ['Kaleye uğradığın gün', K.num(s.visits)],
      ['Açılan mektup', `${s.letters}/${s.lettersTotal}`],
      ['Sarılma borcu', K.num(s.debt)],
      ['Cevaplanan soru', K.num(s.answers)],
      ['Çıkartma', `${s.stickers}/${s.stickersTotal}`],
    ];
    K.$('#wrTiles', root).innerHTML = tiles.map(([k, v]) => `<div class="wr-tile"><b class="tnum">${v}</b><span>${k}</span></div>`).join('');
  }

  K.room({
    id: 'ozet',
    wing: 'hazine',
    title: 'Bizim Özetimiz',
    sub: 'Kaledeki günlerin, bir hikâye gibi',
    icon: 'story',
    color: '#E6DCFF',
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="wr-hero card">
          <div class="wr-hero-art">${A.icon('story')}</div>
          <div>
            <p class="card-eyebrow">Her ayın 21'inde yenilenir</p>
            <h3>Kalede geçirdiğin zamanın hikâyesi</h3>
            <p class="muted">Okuduğun mektuplar, gönderdiğin sarılmalar, cevapladığın sorular... Hepsi senin telefonunda, sadece senin için sayıldı.</p>
            <button class="btn red big" id="wrPlay">${A.ui('play')} Özeti izle</button>
          </div>
        </div>
        <div class="wr-tiles" id="wrTiles"></div>`;
      K.$('#wrPlay', el).addEventListener('click', play);
    },
    enter() {
      render();
    },
  });
  K.playWrap = play;
})();
