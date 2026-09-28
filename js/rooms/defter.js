/* Oda: Bizim Defter — ikisinin de yazdığı ortak günlük. Onun mürekkebi pembe, seninki mavi. Canlı. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, pages = [];
  const STICKERS = ['heart', 'star', 'bow', 'moon', 'sun', 'hugs', 'note', 'cake'];
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);

  function render() {
    const list = pages.slice().sort((a, b) => b.at - a.at);
    const box = K.$('#dfPages', root);
    if (!list.length) {
      box.innerHTML = `<p class="df-empty hand">Defterin ilk sayfası boş. İlk satırı kim yazacak?</p>`;
      return;
    }
    let lastDay = '';
    box.innerHTML = list
      .map((r, i) => {
        const p = T.baku(new Date(r.at));
        const day = `${p.d} ${K.MONTHS[p.mo - 1]} ${p.y}, ${T.dayName(p)}`;
        const head = day !== lastDay ? `<p class="df-day">${day}</p>` : '';
        lastDay = day;
        const own = r.who === mine();
        return `${head}<article class="df-page ${r.who === 'me' ? 'ink-me' : 'ink-her'}" style="--r:${[-1.2, 0.8, -0.6, 1.1][i % 4]}deg">
          <span class="df-tape"></span>
          <header><span class="df-who">${K.esc(nameOf(r.who))}</span><span class="df-time">${K.pad(p.h)}:${K.pad(p.mi)}</span>${own ? `<button class="wn-x" data-del="${r.id}" aria-label="Sayfayı sil">${A.ui('close')}</button>` : ''}</header>
          <div class="df-text">${K.esc(r.data.text).replace(/\n/g, '<br>')}</div>
          ${r.data.sticker ? `<span class="df-sticker">${A.icon(r.data.sticker)}</span>` : ''}
        </article>`;
      })
      .join('');
    const both = new Set(list.filter((r) => T.daysSince(T.key(T.baku(new Date(r.at)))) === 0).map((r) => r.who)).size === 2;
    K.$('#dfToday', root).hidden = !both;
  }

  async function load() {
    pages = await K.cloud.list('page');
    render();
  }

  K.on('cloud', (on) => {
    if (!on) return;
    K.cloud.on('page', (r) => {
      if (!pages.some((p) => p.id === r.id)) pages.push(r);
      if (K.activeRoom === 'defter') render();
      if (r.who !== mine()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} deftere yazdı.</b> Bizim Defter'de yeni bir sayfa var.`, { icon: A.icon('book') });
    });
    K.cloud.on('deleted', ({ id }) => {
      pages = pages.filter((p) => p.id !== id);
      if (K.activeRoom === 'defter') render();
    });
  });

  K.room({
    id: 'defter',
    wing: 'kalp',
    title: 'Bizim Defter',
    sub: () => `${C.herPet} ve ${C.myPet}'un ortak günlüğü`,
    icon: 'book',
    color: '#FFF3C4',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Aynı defter, iki şehir, iki kalem. Buraya ne yazarsan ${K.esc(K.otherName())} anında görür; ${K.esc(K.otherName())} yazınca da sayfa senin önüne düşer. ${K.esc(C.herPet)}'un mürekkebi pembe, ${K.esc(C.myPet)}'unki mavi.</p>
        <form class="card df-form ${K.isOwner() ? 'ink-me' : 'ink-her'}" id="dfForm" autocomplete="off">
          <p class="card-eyebrow">${T.fmt(T.todayKey(), true)}</p>
          <textarea class="textarea df-area" id="dfText" name="dfText" maxlength="2000" placeholder="Bugün..."></textarea>
          <div class="df-stickers" id="dfStickers">${STICKERS.map((s) => `<button type="button" data-s="${s}" aria-pressed="false" aria-label="Çıkartma">${A.icon(s)}</button>`).join('')}</div>
          <button class="btn" type="submit">${A.ui('send')} Deftere yaz</button>
        </form>
        <p class="df-both hand" id="dfToday" hidden>Bugün ikiniz de yazdınız ♥</p>
        <div class="df-pages" id="dfPages"></div>`;
      let sticker = '';
      K.$('#dfStickers', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-s]');
        if (!b) return;
        sticker = sticker === b.dataset.s ? '' : b.dataset.s;
        K.$$('#dfStickers button', el).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.s === sticker)));
      });
      K.$('#dfForm', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = K.$('#dfText', el).value.trim();
        if (!text) return K.$('#dfText', el).focus();
        const r = await K.cloud.add('page', { text, sticker });
        if (!r) return K.fx.toast('Sayfa gönderilemedi. İnterneti kontrol et.');
        K.$('#dfText', el).value = '';
        sticker = '';
        K.$$('#dfStickers button', el).forEach((x) => x.setAttribute('aria-pressed', 'false'));
        K.audio.sfx.paper();
        K.notify(`${C.herName} deftere yazdı`, text.slice(0, 500), ['notebook']);
      });
      el.addEventListener('click', async (e) => {
        const d = e.target.closest('[data-del]');
        if (!d) return;
        if (d.dataset.armed !== '1') {
          d.dataset.armed = '1';
          d.classList.add('armed');
          return;
        }
        await K.cloud.remove(d.dataset.del);
        pages = pages.filter((p) => p.id !== d.dataset.del);
        render();
      });
    },
    enter() {
      load();
    },
  });
})();
