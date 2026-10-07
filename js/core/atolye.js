/* Kale 2.0 — Tema Atölyesi: Eln kendi kalesini boyar. Ana renk (pembenin tonları ve yeni renkler: lavanta, nane,
   bulut), fiyonk rengi, arka plan deseni, oda kapakları ve kapı geçişi, sesler ve titreşim. Her şey bu cihazda
   hatırlanır; Ardoş'un kalesi ayrı renkte olabilir. Eski "Kalenin rengi" seçicisi (tema.js) buraya taşındı. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;

  const PALET = [
    ['pudra', 'Pudra', '#FF8FB8', '#FFD0E1'],
    ['seker', 'Şeker', '#FF5FA8', '#FFC4E1'],
    ['gul', 'Gül kurusu', '#C97A92', '#EFCAD3'],
    ['fusya', 'Fuşya', '#E0199A', '#FFC7EA'],
    ['seftali', 'Şeftali', '#F2706D', '#FFD3C8'],
    ['lavanta', 'Lavanta', '#9B7BE0', '#E3D8FF'],
    ['nane', 'Nane', '#3FB58A', '#CFF3E3'],
    ['bulut', 'Bulut', '#5B9BE6', '#D3E7FF'],
  ];
  const FIYONK = [['', 'Kırmızı', '#E3174D'], ['pembe', 'Pembe', '#FF5FA8'], ['mor', 'Mor', '#8F5BE6'], ['mavi', 'Mavi', '#3D8BE0'], ['altin', 'Altın', '#E8B23A'], ['siyah', 'Siyah', '#3A2A33']];
  const DESEN = [['', 'Düz'], ['puantiye', 'Puantiye'], ['kalp', 'Kalpler'], ['cizgi', 'Çizgili'], ['yildiz', 'Yıldızlar']];
  const DEF = { tema: 'pudra', fiyonk: '', desen: '', kapak: true, kapi: true, rehber: true, ses: true, titresim: true, kanatses: true, egbak: false, k3: true };
  const get = () => Object.assign({}, DEF, K.store.get('atolye', {}), { tema: K.store.get('tema', 'pudra') });

  function apply(o) {
    const s = o || get();
    const root = document.documentElement;
    if (s.tema && s.tema !== 'pudra') root.dataset.tema = s.tema;
    else delete root.dataset.tema;
    s.fiyonk ? (root.dataset.fiyonk = s.fiyonk) : delete root.dataset.fiyonk;
    s.desen ? (root.dataset.desen = s.desen) : delete root.dataset.desen;
    root.classList.toggle('kapaksiz', !s.kapak);
    root.classList.toggle('kapisiz', !s.kapi);
    // Kale 3.0 tasarımı varsayılan; kapatılınca klasik görünüm
    document.body && document.body.classList.toggle('k3', s.k3 !== false);
    const th = PALET.find((x) => x[0] === s.tema) || PALET[0];
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', th[3]);
  }
  function save(patch) {
    const cur = Object.assign(get(), patch);
    K.store.set('tema', cur.tema);
    const rest = Object.assign({}, cur);
    delete rest.tema;
    K.store.set('atolye', rest);
    apply(cur);
    return cur;
  }
  apply();

  // Sesler ve titreşim kapatılabilsin: efektler tek yerden susar
  const sfx = K.audio && K.audio.sfx;
  if (sfx) Object.keys(sfx).forEach((k) => {
    const f = sfx[k];
    if (typeof f !== 'function') return;
    sfx[k] = function () {
      if (get().ses === false) return;
      return f.apply(this, arguments);
    };
  });
  const vib = K.vibrate;
  K.vibrate = (p) => (get().titresim === false ? undefined : vib(p));

  function open() {
    let s = get();
    const m = K.ui.modal({
      label: 'Tema Atölyesi',
      cls: 'at-sheet',
      html: `<div class="at-preview" aria-hidden="true"><div class="at-mini"><span class="at-kitty">${A.kitty({ cls: 'at-k' })}</span><b>Kalenin yeni rengi</b><i class="at-btn">Bir kapı seç</i><span class="at-chip">♥ 21</span></div></div>
        <h2>Tema Atölyesi</h2><p class="muted">Kaleni kendi zevkine göre boya. Seçimler bu telefonda kalır; ${K.esc(K.otherName())} kendi kalesini başka renkte görebilir.</p>
        <p class="card-eyebrow">Ana renk</p><div class="at-row" data-g="tema">${PALET.map(([id, n, a, b]) => `<button type="button" class="at-sw" data-v="${id}" style="--a:${a};--b:${b}" aria-label="${n}"><i></i><small>${n}</small></button>`).join('')}</div>
        <p class="card-eyebrow">Fiyonk rengi</p><div class="at-row" data-g="fiyonk">${FIYONK.map(([id, n, c]) => `<button type="button" class="at-bow" data-v="${id}" aria-label="${n}"><svg viewBox="-60 -42 120 84" aria-hidden="true">${A.bowShape(c)}</svg><small>${n}</small></button>`).join('')}</div>
        <p class="card-eyebrow">Arka plan deseni</p><div class="at-row" data-g="desen">${DESEN.map(([id, n]) => `<button type="button" class="at-pat" data-v="${id}" data-desen-ornek="${id}"><i></i><small>${n}</small></button>`).join('')}</div>
        <p class="card-eyebrow">Hareket ve ses</p>
        <div class="at-toggles">${[['k3', 'Kale 3.0 tasarımı', 'Yeni görünüm. Kapatınca klasik puantiyeli kale'], ['kapak', 'Oda kapakları', 'Her odanın başında çizimli bir kapak'], ['kapi', 'Kapı geçişi', 'Odaya girerken kapı açılır'], ['rehber', 'Kitty Rehber', 'Yeni bir odada Kitty kısaca anlatır'], ['ses', 'Sesler', 'Dokunuş ve kutlama sesleri'], ['kanatses', 'Kanat sesleri', 'Her kanadın hafif arka plan sesi: kuşlar, saat, şömine'], ['egbak', 'Eğ ve bak', 'Telefonu eğince ana salon derinleşir'], ['titresim', 'Titreşim', 'Destekleyen telefonlarda']]
          .map(([k, t, d]) => `<label class="at-tg"><span><b>${t}</b><small>${d}</small></span><input type="checkbox" data-tg="${k}"><i aria-hidden="true"></i></label>`)
          .join('')}</div>
        <div class="row"><button type="button" class="btn ghost small" data-at-reset>Varsayılana dön</button></div>`,
    });
    const draw = () => {
      ['tema', 'fiyonk', 'desen'].forEach((g) => K.$$(`[data-g="${g}"] [data-v]`, m.body).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === (s[g] || '')))));
      K.$$('[data-tg]', m.body).forEach((c) => (c.checked = s[c.dataset.tg] !== false));
    };
    draw();
    m.body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (b) {
        const g = b.closest('[data-g]').dataset.g;
        s = save({ [g]: b.dataset.v || (g === 'tema' ? 'pudra' : '') });
        draw();
        K.audio.sfx.sparkle();
        if (g === 'tema' && s.tema !== 'pudra') K.stickers.award('pembe');
        K.stickers.award('atolye');
        return;
      }
      if (e.target.closest('[data-at-reset]')) {
        K.store.set('atolye', {});
        s = save({ tema: 'pudra' });
        draw();
      }
    });
    m.body.addEventListener('change', (e) => {
      const c = e.target.closest('[data-tg]');
      if (!c) return;
      s = save({ [c.dataset.tg]: c.checked });
      if (c.dataset.tg === 'ses' && c.checked) K.audio.sfx.chime();
      if (c.dataset.tg === 'titresim' && c.checked) K.vibrate(30);
      K.emit('atolyeTg', { k: c.dataset.tg, v: c.checked });
    });
  }

  // Eski renk seçicisinin yerine atölye kapısı
  K.on('built', () => {
    const box = K.$('#footTheme');
    if (!box) return;
    box.innerHTML = `<button type="button" class="at-open" data-at-open><span class="at-dots" aria-hidden="true">${PALET.slice(0, 5).map(([, , a]) => `<i style="--a:${a}"></i>`).join('')}</span>🎨 Tema Atölyesi</button>`;
    box.addEventListener('click', (e) => e.target.closest('[data-at-open]') && open());
  });
  K.atolye = { open, get, apply, save, PALET };
})();
