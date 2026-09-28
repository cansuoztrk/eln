/* Oda: Bakü'deki İzlerin — duvara yazdığın notların fotoğrafları, bir büyüteç ve cevap yazabileceğin dijital bir not duvarı */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const COLORS = ['#FFB3CE', '#FFE08A', '#A8E6C4', '#A9DDFF', '#D9CCFF', '#FFC9A8'];
  const mine = () => K.store.get('myWallNotes', []);

  function cork() {
    K.$('#izCork', root).innerHTML = D.traces
      .map(
        (t, i) => `<button class="iz-pol" data-i="${i}" style="--rot:${[-3, 2.5, -1.5, 3.5, -2.5][i % 5]}deg">
          <span class="iz-tape" style="--tape:${COLORS[i % COLORS.length]}"></span>
          <span class="iz-media"><img data-vault="${K.esc(t.id)}" data-thumb alt="${K.esc(t.title)}"></span>
          <span class="iz-cap hand">${K.esc(t.title)}</span>
          <span class="iz-where">${K.esc(t.where)}</span>
        </button>`
      )
      .join('');
    K.vault.fill(K.$('#izCork', root));
  }

  function open(i) {
    const m = K.ui.modal({ cls: 'trace-modal', label: 'İz', html: '<div class="tr"></div>' });
    const box = K.$('.tr', m.el);
    const show = () => {
      const t = D.traces[i];
      box.innerHTML = `
        <div class="tr-photo" style="--x:${t.x * 100}%;--y:${t.y * 100}%">
          <img data-vault="${K.esc(t.id)}" alt="${K.esc(t.title)}">
          <span class="tr-ring"><span>Burada!</span></span>
          <span class="tr-loupe" aria-hidden="true"></span>
        </div>
        <div class="tr-text">
          <p class="card-eyebrow">${K.esc(t.where)}</p>
          <h3 class="hand">${K.esc(t.title)}</h3>
          <p>${K.esc(K.fill(t.text))}</p>
          <p class="muted small">${K.touch ? 'Fotoğrafın üstünde parmağını gezdir: büyüteç açılır.' : 'Fareyi fotoğrafın üstünde gezdir: büyüteç açılır.'}</p>
          <div class="actions">
            <button class="icon-btn" data-nav="-1" aria-label="Önceki">${A.ui('back')}</button>
            <span class="muted small tnum">${i + 1} / ${D.traces.length}</span>
            <button class="icon-btn" data-nav="1" aria-label="Sonraki">${A.ui('next')}</button>
          </div>
        </div>`;
      K.vault.fill(box);
      loupe(K.$('.tr-photo', box));
    };
    show();
    box.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (!nav) return;
      i = (i + +nav.dataset.nav + D.traces.length) % D.traces.length;
      K.audio.sfx.paper();
      show();
    });
  }

  // Büyüteç: fotoğrafın 2.6 katı büyütülmüş hâli, imlecin altında bir daire içinde
  function loupe(ph) {
    const img = K.$('img', ph);
    const lp = K.$('.tr-loupe', ph);
    const Z = 2.6;
    const move = (e) => {
      if (!img.src) return;
      const r = img.getBoundingClientRect();
      const x = e.clientX - r.left,
        y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return hide();
      ph.classList.add('zoom');
      lp.style.backgroundImage = `url("${img.src}")`;
      lp.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      lp.style.left = x + 'px';
      lp.style.top = y + 'px';
      lp.style.backgroundPosition = `${-(x * Z - lp.offsetWidth / 2)}px ${-(y * Z - lp.offsetHeight / 2)}px`;
    };
    const hide = () => ph.classList.remove('zoom');
    ph.addEventListener('pointermove', move);
    ph.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') ph.setPointerCapture(e.pointerId);
      move(e);
    });
    ph.addEventListener('pointerleave', hide);
    ph.addEventListener('pointerup', (e) => e.pointerType === 'touch' && hide());
    ph.addEventListener('pointercancel', hide);
    ph.style.touchAction = 'none';
  }

  /* ---------------- Dijital not duvarı ---------------- */
  function noteHTML(n, own, i) {
    return `<div class="wn ${own ? 'own' : ''}" style="--nc:${n.color};--rot:${n.rot || 0}deg;--d:${(i % 6) * 0.08}s">
      <span class="wn-pin"></span>
      <p class="hand">${K.esc(n.text).replace(/\n/g, '<br>')}</p>
      <span class="wn-by">${own ? `${K.esc(C.herPet)} · ${T.fmtShort(n.date)}` : K.esc(C.myPet)}</span>
      ${own ? `<button class="wn-x" data-del="${n.id}" aria-label="Notu kaldır">${A.ui('close')}</button>` : ''}
    </div>`;
  }
  function wall() {
    const his = D.wallNotes.map((n, i) => noteHTML(n, false, i));
    const hers = mine().map((n, i) => noteHTML(n, true, i + his.length));
    // İki listeyi karıştırarak yan yana göster: bir onun, bir benim
    const out = [];
    for (let i = 0; i < Math.max(his.length, hers.length); i++) {
      if (hers[i]) out.push(hers[i]);
      if (his[i]) out.push(his[i]);
    }
    K.$('#nwBoard', root).innerHTML = out.join('');
  }
  function initForm() {
    let color = COLORS[0];
    const sw = K.$('#nwColors', root);
    sw.innerHTML = COLORS.map((c, i) => `<button class="nw-sw ${i ? '' : 'on'}" data-c="${c}" style="--c:${c}" aria-label="Not rengi ${i + 1}"></button>`).join('');
    const ta = K.$('#nwText', root);
    const prev = K.$('#nwPreview', root);
    const sync = () => {
      prev.style.setProperty('--nc', color);
      K.$('p', prev).textContent = ta.value || `${C.herPet} ♡ ${C.myPet}`;
    };
    sw.addEventListener('click', (e) => {
      const b = e.target.closest('.nw-sw');
      if (!b) return;
      color = b.dataset.c;
      K.$$('.nw-sw', sw).forEach((x) => x.classList.toggle('on', x === b));
      sync();
    });
    ta.addEventListener('input', sync);
    sync();
    K.$('#nwForm', root).addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = ta.value.trim();
      if (!text) return ta.focus();
      const list = mine();
      list.push({ id: Date.now(), text: text.slice(0, 80), color, rot: Math.round(Math.random() * 10 - 5), date: T.todayKey() });
      K.store.set('myWallNotes', list.slice(-30));
      ta.value = '';
      sync();
      wall();
      const last = K.$$('.wn.own', root).pop();
      last && last.classList.add('drop');
      K.audio.sfx.paper();
      K.stickers.award('duvar');
      const ok = await K.notify(`${C.herName} duvara not yapıştırdı`, text, ['memo']);
      K.fx.toast(ok ? `Notun duvara yapıştı ve ${K.ek(C.myName, 'in')} telefonuna ulaştı.` : 'Notun duvara yapıştı.', { icon: A.icon('note') });
    });
    K.$('#nwBoard', root).addEventListener('click', (e) => {
      const d = e.target.closest('[data-del]');
      if (!d) return;
      K.store.set('myWallNotes', mine().filter((n) => String(n.id) !== d.dataset.del));
      wall();
    });
  }

  K.room({
    id: 'izler',
    wing: 'anilar',
    title: () => `${C.herCity}'deki İzlerin`,
    sub: 'Bir duvara yazdığın notlar',
    icon: 'note',
    color: '#FFF3C4',
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Ben ${K.esc(C.myCity)}'dayken sen ${K.esc(C.herCity)}'de, binlerce notun arasına ikimizin adını yazdın. Daha sevgili bile değildik. Bu oda o notların müzesi. Fotoğraflara dokun; büyüteçle notunu bul.</p>
        <div class="iz-cork" id="izCork"></div>
        <section class="nw">
          <div class="nw-head">
            <h3 class="sub-h">Bu sefer duvar burada</h3>
            <p class="muted">Senin notlarına cevaplarım bu duvarda. Sen de bir not yapıştır; ${K.esc(K.ek(C.myName, 'in'))} telefonuna da düşer.</p>
          </div>
          <div class="nw-board" id="nwBoard"></div>
          <form class="nw-form card" id="nwForm" autocomplete="off">
            <div class="wn nw-preview" id="nwPreview" style="--rot:-2deg"><span class="wn-pin"></span><p class="hand"></p></div>
            <div class="nw-fields">
              <label class="card-eyebrow" for="nwText">Notun</label>
              <textarea class="textarea hand-area" id="nwText" name="nwText" maxlength="80" rows="2" placeholder="${K.esc(C.herPet)} ♡ ${K.esc(C.myPet)}"></textarea>
              <div class="nw-colors" id="nwColors"></div>
              <button class="btn" type="submit">${A.icon('note')} Duvara yapıştır</button>
            </div>
          </form>
        </section>`;
      cork();
      wall();
      initForm();
      K.$('#izCork', el).addEventListener('click', (e) => {
        const b = e.target.closest('.iz-pol');
        if (b) {
          K.audio.sfx.paper();
          open(+b.dataset.i);
        }
      });
    },
    enter() {
      wall();
    },
  });
})();
