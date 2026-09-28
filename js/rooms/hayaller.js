/* Oda: Hayal Listesi — birlikte yapacaklarımız; işaretle, kendi hayalini ekle */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const T = K.time;

  let root;
  const done = () => K.store.get('bucketDone', {});
  const custom = () => K.store.get('bucketCustom', []);
  const CAT_IC = { 0: 'map', 1: 'crown', 2: 'plane', 3: 'heart' };

  function all() {
    const cats = D.bucket.map((c) => ({ cat: c.cat, items: c.items.map((t) => ({ key: c.cat + '|' + t, text: t })) }));
    custom().forEach((x) => {
      let c = cats.find((k) => k.cat === x.cat);
      if (!c) cats.push((c = { cat: x.cat, items: [] }));
      c.items.push({ key: 'c|' + x.id, text: x.text, custom: x.id });
    });
    return cats;
  }
  function render() {
    const d = done();
    const cats = all();
    const total = cats.reduce((a, c) => a + c.items.length, 0);
    const n = cats.reduce((a, c) => a + c.items.filter((i) => d[i.key]).length, 0);
    const pct = total ? Math.round((n / total) * 100) : 0;
    K.$('#bkProg', root).innerHTML = `<div class="bk-ring" style="--p:${pct}"><span>%${pct}</span></div>
      <div><h3>Hayallerimizin ${n} tanesi gerçekleşti</h3><p class="muted">${total - n} hayal daha bizi bekliyor. Acelemiz yok, ömrümüz var.</p></div>`;
    K.$('#bkList', root).innerHTML = cats
      .map(
        (c, ci) => `<div class="card bk-cat"><h3 class="bk-h">${A.icon(CAT_IC[ci] || 'star')}${K.esc(c.cat)}</h3><ul>${c.items
          .map(
            (i) => `<li class="bk-item ${d[i.key] ? 'done' : ''}">
            <button class="bk-check" data-key="${K.esc(i.key)}" aria-pressed="${d[i.key] ? 'true' : 'false'}" aria-label="${K.esc(i.text)}">${A.ui('heart')}</button>
            <span class="bk-text">${K.esc(K.fill(i.text))}${d[i.key] ? `<small>${T.fmt(d[i.key])}</small>` : ''}</span>
            ${i.custom ? `<button class="bk-del" data-del="${i.custom}" aria-label="Sil">${A.ui('close')}</button>` : ''}
          </li>`
          )
          .join('')}</ul></div>`
      )
      .join('');
    const sel = K.$('#bkCat', root);
    const cur = sel.value;
    sel.innerHTML = cats.map((c) => `<option>${K.esc(c.cat)}</option>`).join('');
    if (cur) sel.value = cur;
  }

  K.room({
    id: 'hayaller',
    title: 'Hayal Listesi',
    sub: 'Birlikte yapacaklarımız',
    icon: 'list',
    color: '#FFF3C4',
    badge: () => {
      const n = Object.keys(done()).length;
      return n ? `${n} gerçekleşti` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">İstanbul'da, Bakü'de ve dünyanın geri kalanında birlikte yapmak istediklerim. Gerçekleşenleri kalbe dokunarak işaretle; tarihini ben hatırlarım.</p>
        <div class="card bk-prog" id="bkProg"></div>
        <div class="bk-list" id="bkList"></div>
        <form class="card bk-add" id="bkAdd" autocomplete="off">
          <p class="card-eyebrow">Senin hayalin</p>
          <div class="bk-add-row">
            <input class="input" id="bkText" name="bkText" placeholder="Birlikte ... yapmak istiyorum" maxlength="90">
            <select class="input" id="bkCat" name="bkCat" aria-label="Kategori"></select>
            <button class="btn" type="submit">${A.ui('plus')} Ekle</button>
          </div>
        </form>`;
      el.addEventListener('click', (e) => {
        const c = e.target.closest('.bk-check');
        if (c) {
          const d = done();
          const key = c.dataset.key;
          if (d[key]) delete d[key];
          else {
            d[key] = T.todayKey();
            const r = c.getBoundingClientRect();
            K.fx.confetti({ x: r.left + r.width / 2, y: r.top, count: 50, power: 9 });
            K.audio.sfx.chime();
          }
          K.store.set('bucketDone', d);
          render();
        }
        const del = e.target.closest('.bk-del');
        if (del) {
          K.store.set('bucketCustom', custom().filter((x) => String(x.id) !== del.dataset.del));
          render();
        }
      });
      K.$('#bkAdd', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const t = K.$('#bkText', el).value.trim();
        if (!t) return;
        const list = custom();
        list.push({ id: Date.now(), cat: K.$('#bkCat', el).value, text: t });
        K.store.set('bucketCustom', list);
        K.$('#bkText', el).value = '';
        K.audio.sfx.sparkle();
        K.stickers.award('hayal');
        render();
      });
      render();
    },
  });
})();
