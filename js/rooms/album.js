/* Oda: Pul Albümü (eski adıyla Çıkartma Albümü) — başarımlar dişli kenarlı pullar olarak; kazanılanın üstünde o günün
   damgası, eksiklerin yeri ipucuyla bekleyen boş bir çerçeve. Zorunlu pulların hepsi toplanınca gizli mektup açılır. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;

  function render() {
    const got = K.stickers.got();
    const n = K.stickers.done();
    const total = K.stickers.total;
    const all = n >= total;
    K.$('#albumHead', root).innerHTML = `<div class="bk-ring" style="--p:${Math.round((n / total) * 100)}"><span>${n}/${total}</span></div>
      <div><h3>${all ? 'Albüm tamamlandı!' : `${total - n} pul daha`}</h3>
      <p class="muted">${all ? 'Gizli mektup artık senin.' : 'Hepsini topladığında albümün son sayfasında gizli bir mektup açılacak. İpuçları boş çerçevelerin altında.'}</p></div>`;
    // Pul Albümü: her çıkartma dişli kenarlı bir pul; kazanılanın üstünde o günün damgası, eksiklerin yeri boş çerçeve
    const page = (title, sub, list) => `<section class="pul-sayfa"><header><b>${K.esc(title)}</b><small>${K.esc(sub)}</small></header><div class="pul-grid">${list
      .map((d, i) => {
        const date = got[d.id];
        const val = [5, 10, 21, 25, 50, 100][K.hash(d.id) % 6];
        if (!date) return `<div class="pul-yuva" title="${K.esc(d.hint)}"><span class="pul-bos">${A.icon(d.icon)}</span><small>${K.esc(d.hint)}</small></div>`;
        const [py, pm, pd] = String(date).split('-').map(Number);
        const p = { y: py, mo: pm || 1, d: pd || 1 };
        return `<div class="pul-yuva has" style="--pc:${d.color};--r:${[-3, 2, -1, 3, -2, 1][i % 6]}deg"><span class="pul"><span class="pul-yuz"><span class="pul-ust">TR · AZ</span>${K.stickers.art(d, 'pul-art')}<span class="pul-alt"><b>${val}</b><i>kr</i></span></span></span>
          <svg class="pul-damga" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="30"/><circle cx="40" cy="40" r="20"/><text x="40" y="38" text-anchor="middle">${p.d} ${K.MONTHS[p.mo - 1].slice(0, 3).toLocaleUpperCase('tr')}</text><text x="40" y="49" text-anchor="middle" class="y">${p.y}</text><path d="M68 30 q5 -4 10 0 M68 40 q5 -4 10 0 M68 50 q5 -4 10 0"/></svg>
          <b>${K.esc(d.name)}</b></div>`;
      })
      .join('')}</div></section>`;
    const req = K.stickers.DEFS.filter((d) => !d.bonus), bon = K.stickers.DEFS.filter((d) => d.bonus);
    const n1 = req.filter((d) => got[d.id]).length, n2 = bon.filter((d) => got[d.id]).length;
    K.$('#albumGrid', root).innerHTML = page('Seri I · Kale Pulları', `${n1}/${req.length} · gizli mektubun anahtarı`, req) + page('Seri II · Hatıra Pulları', `${n2}/${bon.length} · bonus`, bon);
    const s = K.$('#albumSecret', root);
    s.innerHTML = all
      ? `<div>${A.icon('key')}</div><div><h3>Gizli mektup</h3><p>Bütün pulları topladın. Bu kapı sadece senin için açıldı.</p><button class="btn red" id="secretBtn">${A.ui('heart')} Mektubu aç</button></div>`
      : `<div class="locked-ic">${A.ui('lock')}</div><div><h3>Gizli mektup</h3><p>Kilitli. Anahtarı: ${total} pulun hepsi.</p></div>`;
    const b = K.$('#secretBtn', root);
    b &&
      b.addEventListener('click', () => {
        K.audio.sfx.chime();
        K.fx.confetti({ count: 120 });
        K.ui.modal({
          cls: 'letter-modal opened',
          label: 'Gizli mektup',
          html: `<div class="la"><article class="la-paper"><p class="la-kicker">Gizli mektup</p><div class="la-text">${K.paras(D.secretLetter)}</div></article></div>`,
        });
      });
  }

  K.room({
    id: 'album',
    wing: 'hazine',
    title: 'Pul Albümü',
    sub: 'Kalede topladıkların',
    icon: 'sticker',
    color: '#FFF3C4',
    badge: () => `${K.stickers.done()}/${K.stickers.total}`,
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Kalede gezdikçe, oynadıkça ve farklı saatlerde uğradıkça yeni bir pul kazanırsın; Kale Postanesi üstüne o günün damgasını vurur. Bazıları kolay, bazıları sabır ister, biri de iyi saklanmış bir sır.</p>
        <div class="card album-head" id="albumHead"></div>
        <div class="album-grid" id="albumGrid"></div>
        <div class="card album-secret" id="albumSecret"></div>`;
      K.on('sticker', () => K.activeRoom === 'album' && render());
    },
    enter() {
      render();
    },
  });
})();
