/* Oda: Kitty Gazetesi — her sabah yeni sayı: manşet, iki şehrin havası, aşk falı, sayılarla bugün ve bir bulmaca */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const WORDS = [
    ['FIYONK', 'Kitty\'nin başında, senin saçında'],
    ['SARILMA', 'Borcum her gün artıyor'],
    ['ANILAR', 'Bizim şarkımız'],
    ['GARTIC', 'Tanıştığımız oyun'],
    ['OZLEM', 'Mesafenin öbür adı'],
    ['BAKU', 'Rüzgârlar şehri'],
    ['PRENSES', 'Sen'],
    ['KULE', 'İki tane var, biri sende biri bende'],
    ['KALP', 'Bin yedi yüz kilometre öteden atıyor'],
    ['DOLUNAY', 'İkimizin ortak lambası'],
    ['MEKTUP', 'Bu kalede on dokuz tane var'],
    ['OGRETMEN', 'Gelecekteki mesleğin'],
  ];
  const shuffleWord = (w, seed) => {
    let s = K.shuffle(w.split(''), K.rng(seed)).join('');
    if (s === w) s = w.slice(1) + w[0];
    return s;
  };

  async function render() {
    const p = T.baku();
    const today = T.todayKey();
    const issue = Math.max(1, T.daysSince(C.togetherDate) + 1);
    const g = D.gazette;
    const head = K.daily(g.headlines, 1);
    const star = K.daily(g.stars, 4);
    const tip = K.daily(g.tips, 7);
    const word = K.daily(D.dictionary, 3) || ['', '', ''];
    const [pz, hint] = K.daily(WORDS, 5);
    const moon = A.moonPhase(T.now());
    const fullIn = Math.round(((0.5 - moon.p + 1) % 1) * 29.53);
    K.$('#gz', root).innerHTML = `
      <header class="gz-mast">
        <p class="gz-top"><span>Sayı ${K.num(issue)}</span><span>${p.d} ${K.MONTHS[p.mo - 1]} ${p.y}, ${T.dayName(p)}</span><span>Fiyatı: 1 öpücük</span></p>
        <h2 class="gz-name">Kitty Gazetesi</h2>
        <p class="gz-motto">Boğaz'dan Hazar'a, her sabah, sadece bir okur için</p>
      </header>
      <div class="gz-grid">
        <article class="gz-lead">
          <p class="gz-kicker">Son dakika</p>
          <h3 class="gz-head">${K.esc(K.fill(head))}</h3>
          <div class="gz-photo">${A.kitty({ crown: true, cls: 'is-happy' })}<span>Kitty olay yerinde. (Arşiv)</span></div>
          <p class="gz-body">Muhabirimizin aktardığına göre olay ${K.esc(C.myCity)} ile ${K.esc(C.herCity)} arasında yaşandı. Görgü tanıkları bir kalbin ${K.num(C.distanceKm)} kilometre öteden duyulduğunu söyledi. Yetkililer açıklamasında "Bu kadar sevilmek normal değil ama güzel" dedi.</p>
        </article>
        <aside class="gz-side">
          <section class="gz-box" id="gzWx"><h4>Hava durumu</h4><p class="muted small">Gökyüzüne bakılıyor...</p></section>
          <section class="gz-box"><h4>Aşk falı · ${K.esc(C.herSign || 'Boğa')} & ${K.esc(C.mySign || 'Akrep')}</h4><p>${K.esc(K.fill(star))}</p></section>
          <section class="gz-box"><h4>Kitty'nin tavsiyesi</h4><p>${K.esc(K.fill(tip))}</p></section>
        </aside>
      </div>
      <div class="gz-row">
        <section class="gz-box gz-nums"><h4>Sayılarla bugün</h4>
          <dl>
            <div><dt>Birlikte</dt><dd>${K.num(T.daysSince(C.togetherDate))} gün</dd></div>
            <div><dt>Tanışalı</dt><dd>${K.num(T.daysSince(C.metDate))} gün</dd></div>
            <div><dt>Sarılma borcu</dt><dd>${K.num(K.hugDebt())}</dd></div>
            <div><dt>Dolunaya</dt><dd>${moon.illum > 0.97 ? 'Bu gece!' : `${fullIn} gün`}</dd></div>
            <div><dt>Doğum gününe</dt><dd>${K.num(T.nextAnnual(C.herBirthday).days)} gün</dd></div>
          </dl>
        </section>
        <section class="gz-box"><h4>Günün kelimesi</h4><p class="gz-word">${K.esc(word[1])}</p><p class="muted small">${K.esc(word[0])} · ${K.esc(word[2])}</p></section>
        <section class="gz-box gz-puzzle"><h4>Bulmaca</h4>
          <p class="gz-scr tnum">${shuffleWord(pz, K.hash(today)).split('').map((c) => `<span>${c}</span>`).join('')}</p>
          <p class="muted small">İpucu: ${K.esc(hint)}</p>
          <form class="row" id="gzForm" autocomplete="off"><input class="input" id="gzGuess" name="gzGuess" placeholder="Cevap" maxlength="12"><button class="btn small" type="submit">Dene</button></form>
          <p class="gz-res" id="gzRes" aria-live="polite"></p>
        </section>
      </div>
      <footer class="gz-foot">Kitty Gazetesi · Genel yayın yönetmeni: ${K.esc(C.myPet)} · Tek abone: Prenses ${K.esc(C.herPet)}</footer>`;
    K.$('#gzForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = K.norm(K.$('#gzGuess', root).value).replace(/ /g, '');
      const ok = v === K.norm(pz).replace(/ /g, '');
      const res = K.$('#gzRes', root);
      res.textContent = ok ? 'Bildin! Kitty Gazetesi bulmaca şampiyonu: sen.' : 'Olmadı, bir daha dene.';
      res.className = 'gz-res ' + (ok ? 'ok' : 'no');
      if (ok) {
        K.audio.sfx.success();
        K.fx.confetti({ count: 50 });
      } else K.audio.sfx.fail();
    });
    K.store.set('newsRead', today);
    K.stickers.award('gazete');
    const w = K.weather ? await K.weather() : null;
    const box = K.$('#gzWx', root);
    if (!box) return;
    box.innerHTML = w
      ? `<h4>Hava durumu</h4><p><b>${K.esc(C.herCity)}</b> ${w.baku.temp}°, rüzgâr ${w.baku.wind} km/sa</p><p><b>${K.esc(C.myCity)}</b> ${w.ist.temp}°, rüzgâr ${w.ist.wind} km/sa</p><p class="muted small">Aşk havası: her iki şehirde de sıcak.</p>`
      : `<h4>Hava durumu</h4><p>Veri gelmedi ama aşk havası her iki şehirde de sıcak.</p>`;
  }

  K.room({
    id: 'gazete',
    wing: 'hazine',
    title: 'Kitty Gazetesi',
    sub: 'Her sabah yeni sayı',
    icon: 'news',
    color: '#E6DCFF',
    badge: () => (K.store.get('newsRead') === T.todayKey() ? '' : 'Yeni sayı'),
    init(el) {
      root = el;
      el.innerHTML = `<article class="gz" id="gz"></article>`;
    },
    enter() {
      render();
    },
  });
})();
