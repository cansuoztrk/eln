/* Oda: Sabah Perdesi — kim önce uyanırsa öbürünün kalesinin perdesini o açar. Açan tek bir cümle bırakır; öbürü
   kaleyi o sabah ilk açtığında perdeler kapalı bir ekranla karşılaşır, dokununca perde aralanır, odasına gün ışığı
   girer ve cümle görünür. Sabah: kendi saatinle 05:00–12:00. Odada son otuz sabahın kaydı: kim önce uyandı, ne yazdı.
   Kayıt: perde {day (alıcının günü), to, cumle} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const tz = (w) => (w === 'me' ? C.tzIstanbul : C.tzBaku);
  const gunOf = (w) => T.key(T.parts(tz(w)));
  const sabah = (w) => {
    const h = T.parts(tz(w)).h;
    return h >= 5 && h < 12;
  };
  const ONERI = ['Günaydın uykucu, bugün de seni seviyorum.', 'Gözlerini açtığın ilk an benim olsun.', 'Güneş senden önce kalkmış, bana söyledi.', 'Kahveni benim için de iç.', 'Bugün güzel bir gün olacak, hissediyorum.'];
  let rows = [], root = null;

  const banaAcilan = () => rows.find((r) => r.data.to === mine() && r.data.day === gunOf(mine()));
  const onaAcilan = () => rows.find((r) => r.data.to === other() && r.data.day === gunOf(other()));

  async function ac(cumle) {
    if (banaAcilan() || onaAcilan()) return;
    const r = await K.cloud.add('perde', { day: gunOf(other()), to: other(), cumle: cumle.slice(0, 140) });
    if (!r) return K.fx.toast('Perde açılamadı; internetini kontrol et.');
    rows.push(r);
    K.ping(`☀️ ${K.meName()} perdeni açtı`, 'Kaleyi açınca odana gün ışığı girecek.', ['sunrise'], { click: K.roomUrl('') });
    K.stickers.award('perde');
    K.renderSpecials && K.renderSpecials();
    ciz();
  }
  function acmaPenceresi() {
    const m = K.ui.modal({
      label: 'Perdeyi aç',
      cls: 'pr-yaz',
      html: `<p class="card-eyebrow">Önce sen uyandın ☀️</p><h2>${K.esc(K.ek(nameOf(other()), 'in'))} perdesini aç</h2><p class="muted">Tek bir cümle bırak. Kaleyi açınca perdesi aralanacak ve ilk bunu görecek.</p>
        <textarea class="textarea" id="prCumle" maxlength="140" rows="3" placeholder="${K.esc(ONERI[K.hash(T.todayKey()) % ONERI.length])}"></textarea>
        <div class="pr-oneriler">${ONERI.slice(0, 3).map((o) => `<button type="button" class="chip" data-pr-oneri>${K.esc(o)}</button>`).join('')}</div>
        <button class="btn" type="button" data-pr-ac>☀️ Perdesini aç</button>`,
    });
    m.el.addEventListener('click', (e) => {
      const o = e.target.closest('[data-pr-oneri]');
      if (o) K.$('#prCumle', m.el).value = o.textContent;
      if (e.target.closest('[data-pr-ac]')) {
        const t = K.$('#prCumle', m.el).value.trim() || K.$('#prCumle', m.el).placeholder;
        m.close();
        ac(t);
      }
    });
  }
  // Alıcı tarafı: perdeler kapalı bir karşılama
  function karsila(r) {
    if (K.store.get('perdeGor') === r.id || K.$('.pr-ekran')) return;
    K.store.set('perdeGor', r.id);
    const el = K.el(`<div class="pr-ekran" role="dialog" aria-label="Sabah perdesi">
      <div class="pr-gun"><div class="pr-gunes"></div><p class="pr-cumle hand">${K.yazitipi ? K.yazitipi.html(r.data.cumle, r.who) : K.esc(r.data.cumle)}</p><p class="pr-kim">— ${K.esc(nameOf(r.who))}, ${K.esc(T.hm ? new Date(r.at).toTimeString().slice(0, 5) : '')}</p><button class="btn" type="button" data-pr-kapat>Günaydın 💗</button></div>
      <div class="pr-perde sol"></div><div class="pr-perde sag"></div>
      <p class="pr-ipucu">${K.esc(nameOf(r.who))} senden önce uyandı ve perdeni açmak istiyor.<br><b>Dokun</b></p></div>`);
    document.body.appendChild(el);
    const kapat = () => (el.classList.add('git'), setTimeout(() => el.remove(), 500));
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-pr-kapat]')) return kapat();
      if (!el.classList.contains('acik')) {
        el.classList.add('acik');
        K.audio.sfx.sparkle && K.audio.sfx.sparkle();
        K.vibrate && K.vibrate([20, 40, 20]);
      }
    });
  }
  function denetle() {
    if (!K.cloud || !K.cloud.enabled || K.activeRoom) return;
    const r = banaAcilan();
    r && sabah(mine()) && karsila(r);
  }
  function ciz() {
    if (!root || K.activeRoom !== 'perde') return;
    const b = banaAcilan(), o = onaAcilan();
    const ust = b
      ? `<p class="card-eyebrow">Bu sabah</p><p>${K.esc(nameOf(other()))} senden önce uyandı ve perdeni açtı:</p><p class="hand pr-alinti">${K.esc(b.data.cumle)}</p>`
      : o
        ? `<p class="card-eyebrow">Bu sabah</p><p>Sen önce uyandın ve ${K.esc(K.ek(nameOf(other()), 'in'))} perdesini açtın:</p><p class="hand pr-alinti">${K.esc(o.data.cumle)}</p>`
        : sabah(mine())
          ? `<p class="card-eyebrow">Günaydın ☀️</p><p>Bu sabah henüz kimse perde açmadı. Önce sen uyandıysan onunkini sen aç.</p><button class="btn" type="button" data-pr-yaz>☀️ ${K.esc(K.ek(nameOf(other()), 'in'))} perdesini aç</button>`
          : `<p class="card-eyebrow">Perde saati</p><p>Perdeler sabah 05:00 ile 12:00 arasında açılır. Yarın sabah önce kim uyanacak?</p>`;
    const son = rows.slice().sort((a, b2) => b2.at - a.at).slice(0, 30);
    const say = (w) => rows.filter((r) => r.who === w).length;
    K.$('#prIcerik', root).innerHTML = `<section class="card pr-ust">${ust}</section>
      <div class="pr-skor"><div><b>${say('me')}</b><small>${K.esc(nameOf('me'))} önce uyandı</small></div><div><b>${say('her')}</b><small>${K.esc(nameOf('her'))} önce uyandı</small></div></div>
      ${son.length ? `<h3 class="pr-baslik">Sabahlar</h3><ul class="pr-liste">${son.map((r) => `<li class="${r.who}"><time>${K.esc(T.fmtShort(r.data.day))}</time><p class="hand">${K.esc(r.data.cumle)}</p><small>${K.esc(nameOf(r.who))} açtı · ${new Date(r.at).toTimeString().slice(0, 5)}</small></li>`).join('')}</ul>` : ''}`;
  }
  K.room({
    id: 'perde',
    wing: 'kalp',
    title: 'Sabah Perdesi',
    sub: 'Önce uyanan öbürünün perdesini açar',
    icon: 'curtain',
    color: '#FFF3C4',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kim önce uyanırsa öbürünün kalesinin perdesini o açar. Perde açılınca odasına gün ışığı girer ve açanın bıraktığı tek cümle görünür.</p></div><div id="prIcerik"></div>`;
      el.addEventListener('click', (e) => e.target.closest('[data-pr-yaz]') && acmaPenceresi());
    },
    async enter() {
      rows = await K.cloud.list('perde', 200);
      ciz();
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('perde', 200);
    K.cloud.on('perde', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      ciz();
      K.renderSpecials && K.renderSpecials();
      setTimeout(denetle, 800);
    });
    setTimeout(denetle, 2500);
  });
  window.addEventListener('hashchange', () => setTimeout(denetle, 400));
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!K.cloud || !K.cloud.enabled || !sabah(mine()) || banaAcilan() || onaAcilan()) return [];
    return [{ key: 'perde', icon: 'curtain', title: '☀️ Önce sen uyandın', text: `${nameOf(other())} henüz uyumuyor olabilir. Perdesini aç, tek bir cümle bırak.`, run: acmaPenceresi, cta: 'Perdesini aç' }];
  });
  K.perde = { banaAcilan, onaAcilan, karsila };
})();
