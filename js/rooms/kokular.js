/* Oda: Kokular ve Tatlar Defteri — birbirinize anlatmak istediğiniz kokular ve tatlar: annesinin mutfağı, Bakü'de yağmur,
   simit. Her biri bir kart; "kavuşunca birlikte" işaretlenenler ortak bir listede durur, aynı şehirde tadılınca "tadıldı".
   Kayıtlar: koku {tur: koku|tat, ad, anlatim, emoji, sehir, birlikte} · kokutadildi {ref, not} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const EMOJI = { koku: ['🌸', '🌧️', '☕', '🍋', '🌿', '🕯️', '🧺', '🌊', '🍂', '🧴'], tat: ['🥯', '🍯', '🫖', '🍰', '🍲', '🥟', '🍓', '🍫', '🧀', '🍇'] };
  let rows = [], tadildi = [], root = null, filtre = 'hepsi';

  const tadi = (id) => tadildi.find((r) => r.data.ref === id);
  function kart(r) {
    const t = tadi(r.id);
    return `<article class="kk-kart ${r.data.tur} ${r.who}"><span class="kk-emoji">${K.esc(r.data.emoji || '✨')}</span><div><p class="card-eyebrow">${r.data.tur === 'tat' ? 'Tat' : 'Koku'} · ${K.esc(nameOf(r.who))}${r.data.sehir ? ' · ' + K.esc(r.data.sehir) : ''}</p><h3>${K.esc(r.data.ad)}</h3><p class="kk-anlatim">${K.yazitipi ? K.yazitipi.html(r.data.anlatim, r.who) : K.esc(r.data.anlatim)}</p>
      ${r.data.birlikte ? (t ? `<p class="kk-tadildi">✓ ${K.esc(T.fmtShort(t.data.day || T.todayKey()))} birlikte ${r.data.tur === 'tat' ? 'tadıldı' : 'koklandı'}${t.data.not ? ' · ' + K.esc(t.data.not) : ''}</p>` : `<button type="button" class="chip" data-kk-tat="${r.id}">🤝 Birlikte ${r.data.tur === 'tat' ? 'tadıldı' : 'koklandı'}</button>`) : ''}</div></article>`;
  }
  function ciz() {
    if (!root || K.activeRoom !== 'kokular') return;
    const l = rows.filter((r) => filtre === 'hepsi' || (filtre === 'birlikte' ? r.data.birlikte && !tadi(r.id) : r.data.tur === filtre)).sort((a, b) => b.at - a.at);
    const bekleyen = rows.filter((r) => r.data.birlikte && !tadi(r.id)).length;
    K.$$('[data-kk-f]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kkF === filtre)));
    K.$('#kkSay', root).textContent = bekleyen ? `Kavuşunca birlikte: ${bekleyen}` : '';
    K.$('#kkListe', root).innerHTML = l.map(kart).join('') || '<p class="muted center">Defter boş. Sana bir koku anlat: neye benziyor, nerede, ne zaman?</p>';
  }
  function yaz(tur) {
    const m = K.ui.modal({
      label: tur === 'tat' ? 'Bir tat' : 'Bir koku',
      cls: 'kk-yaz',
      html: `<h2>${tur === 'tat' ? 'Bir tat anlat' : 'Bir koku anlat'}</h2><div class="kk-emojiler">${EMOJI[tur].map((e, i) => `<button type="button" class="${i ? '' : 'on'}" data-kk-e>${e}</button>`).join('')}</div>
        <input class="input" id="kkAd" maxlength="50" placeholder="${tur === 'tat' ? 'ör. Annemin dolması' : 'ör. Bakü\'de yağmurdan sonra'}"><input class="input" id="kkSehir" maxlength="30" placeholder="Nerede? (isteğe bağlı)">
        <textarea class="textarea" id="kkAnlat" rows="4" maxlength="400" placeholder="Neye benziyor? Hangi anı geliyor aklına?"></textarea>
        <label class="kk-onay"><input type="checkbox" id="kkBirlikte" checked> Kavuşunca birlikte ${tur === 'tat' ? 'tadalım' : 'koklayalım'}</label><button class="btn" type="button" data-kk-ok>Deftere yaz</button>`,
    });
    m.el.addEventListener('click', async (e) => {
      const em = e.target.closest('[data-kk-e]');
      if (em) return K.$$('[data-kk-e]', m.el).forEach((b) => b.classList.toggle('on', b === em));
      if (!e.target.closest('[data-kk-ok]')) return;
      const ad = K.$('#kkAd', m.el).value.trim(), anlatim = K.$('#kkAnlat', m.el).value.trim();
      if (!ad || !anlatim) return K.fx.toast('Adını ve neye benzediğini yaz.');
      const r = await K.cloud.add('koku', { tur, ad, anlatim, sehir: K.$('#kkSehir', m.el).value.trim(), emoji: K.$('[data-kk-e].on', m.el).textContent, birlikte: K.$('#kkBirlikte', m.el).checked });
      m.close();
      if (!r) return;
      rows.push(r);
      K.stickers.award('kokular');
      K.ping(`${r.data.emoji} ${K.meName()} sana bir ${tur === 'tat' ? 'tat' : 'koku'} anlattı`, ad, ['blossom'], { click: K.roomUrl('kokular') });
      ciz();
    });
  }
  K.room({
    id: 'kokular',
    wing: 'kalp',
    title: 'Kokular ve Tatlar',
    sub: 'Anlatmak istediğimiz kokular, kavuşunca tadılacaklar',
    icon: 'tea',
    color: '#FFEDE2',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Ekrandan geçmeyen şeyler: kokular ve tatlar. Anlat; neye benziyor, hangi anıyı getiriyor? "Kavuşunca birlikte" dediklerin ortak listede bekler.</p></div>
        <div class="cl-dugmeler"><button class="btn" type="button" data-kk-yaz="koku">🌸 Bir koku anlat</button><button class="btn soft" type="button" data-kk-yaz="tat">🍯 Bir tat anlat</button></div>
        <div class="k4-seg kk-seg" role="group">${[['hepsi', 'Hepsi'], ['koku', 'Kokular'], ['tat', 'Tatlar'], ['birlikte', 'Kavuşunca']].map(([k, a]) => `<button type="button" data-kk-f="${k}">${a}</button>`).join('')}</div><p class="muted small" id="kkSay"></p>
        <div class="kk-liste" id="kkListe"></div>`;
      el.addEventListener('click', async (e) => {
        const y = e.target.closest('[data-kk-yaz]');
        if (y) return yaz(y.dataset.kkYaz);
        const f = e.target.closest('[data-kk-f]');
        if (f) return (filtre = f.dataset.kkF), ciz();
        const t = e.target.closest('[data-kk-tat]');
        if (t) {
          const r = await K.cloud.add('kokutadildi', { ref: t.dataset.kkTat, day: T.todayKey() });
          r && tadildi.push(r), K.fx.confetti({ count: 50, shapes: ['heart'] }), K.stickers.award('kokutadildi'), ciz();
        }
      });
    },
    async enter() {
      [rows, tadildi] = await Promise.all([K.cloud.list('koku', 300), K.cloud.list('kokutadildi', 300)]);
      ciz();
    },
  });
  K.on('cloud', (ok) => ok && K.cloud.on('koku', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), ciz())));
})();
