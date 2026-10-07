/* Oda: Dilek Fenerleri — her ayın 21'inde ikimiz birer dilek yazıp bir fener bırakırız. Fenerler kalenin gece
   gökyüzünde birikir; bir yıl sonra gökyüzü dileklerimizle doludur. Gerçekleşen dilek yıldıza dönüşür. 21'ini kaçıran,
   ay bitene kadar fenerini geç de olsa bırakabilir.
   Kayıtlar: dilekfener {ay: 'YYYY-MM', text} · fenergercek {ref} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], gercek = [], root = null, yeni = null;
  const ay = () => T.todayKey().slice(0, 7);
  const gun = () => +T.todayKey().slice(8, 10);
  const acik = () => gun() >= 21;
  const benimBuAy = () => rows.find((r) => r.who === mine() && r.data.ay === ay());
  const yildizMi = (r) => gercek.some((g) => g.data.ref === r.id);
  function gok() {
    const l = rows.slice().sort((a, b) => a.at - b.at);
    const W = 360, H = 460;
    const bg = Array.from({ length: 60 }, (_, i) => { const r = K.rng(i + 77); return `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H * 0.9).toFixed(0)}" r="${(0.4 + r() * 1.1).toFixed(1)}" fill="#fff" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`; }).join('');
    const ogeler = l.map((f, i) => {
      const r = K.rng(K.hash(f.id));
      const x = 24 + r() * (W - 48), y = 30 + r() * (H - 140);
      const sc = 0.7 + r() * 0.5;
      if (yildizMi(f)) return `<g class="fn-yildiz" data-fn="${f.id}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${sc.toFixed(2)})"><path d="M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4 Z" fill="#FFE27A"/><circle r="22" fill="transparent"/></g>`;
      const c = f.who === 'me' ? '#FFB86B' : '#FF8FB8';
      return `<g class="fn-fener ${f.id === yeni ? 'yeni' : ''}" data-fn="${f.id}" style="--d:${(r() * 4).toFixed(2)}s" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${sc.toFixed(2)})"><ellipse cx="0" cy="4" rx="22" ry="26" fill="${c}" opacity=".25"/><path d="M-11 -14 Q0 -20 11 -14 L9 12 Q0 16 -9 12 Z" fill="${c}"/><path d="M-6 12 h12 v3 h-12z" fill="#7a3b2e"/><circle cx="0" cy="8" r="3" fill="#FFF3B0"/><circle r="24" fill="transparent"/></g>`;
    }).join('');
    return `<svg class="fn-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dilek fenerleri"><defs><linearGradient id="fnGokGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0c2e"/><stop offset=".7" stop-color="#2b1f5c"/><stop offset="1" stop-color="#5b3b7a"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#fnGokGr)"/>${bg}<path d="M0 ${H - 40} Q${W * 0.25} ${H - 70} ${W * 0.5} ${H - 48} T${W} ${H - 56} V${H} H0 Z" fill="#1b1438"/>${ogeler}</svg>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'fenerler') return;
    const fen = rows.length, yil = gercek.length;
    K.$('#fnUst', root).innerHTML = `<b>${fen}</b> fener · <b>${yil}</b> yıldız`;
    K.$('#fnGok', root).innerHTML = gok();
    const b = benimBuAy();
    K.$('#fnBirak', root).innerHTML = b
      ? `<p class="muted small center">Bu ayın fenerini bıraktın: "${K.esc(b.data.text)}"</p>`
      : acik()
        ? `<p class="card-eyebrow">${gun() === 21 ? 'Bu gece fener gecesi' : 'Bu ayın fenerini geç de olsa bırak'}</p><div class="row"><input class="input" id="fnMetin" maxlength="120" placeholder="Bir dilek..."><button type="button" class="btn red small" data-fn-birak>🏮 Bırak</button></div>`
        : `<p class="muted small center">Bir sonraki fener gecesi ${21 - gun()} gün sonra (ayın 21'i).</p>`;
  }
  function goster(id) {
    const f = rows.find((r) => r.id === id);
    if (!f) return;
    const y = yildizMi(f);
    const m = K.ui.modal({ label: 'Dilek', cls: 'fn-modal', html: `<p class="card-eyebrow">${K.esc(K.MONTHS[+f.data.ay.slice(5) - 1])} ${f.data.ay.slice(0, 4)} · ${K.esc(nameOf(f.who))}</p><h3>${y ? '⭐ ' : '🏮 '}${K.esc(f.data.text)}</h3>${y ? '<p class="muted">Bu dilek gerçekleşti; artık bir yıldız.</p>' : '<button type="button" class="btn soft" data-fn-oldu>✨ Gerçekleşti</button>'}` });
    m.el.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-fn-oldu]')) return;
      const r = await K.cloud.add('fenergercek', { ref: id });
      m.close();
      if (!r) return;
      gercek.some((x) => x.id === r.id) || gercek.push(r);
      K.fx.confetti({ count: 100, shapes: ['star'] });
      K.stickers.award('fenergercek');
      K.ping(`⭐ Bir dileğimiz gerçekleşti`, f.data.text, ['star2'], { click: K.roomUrl('fenerler') });
      render();
    });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, gercek] = await Promise.all([K.cloud.list('dilekfener', 400), K.cloud.list('fenergercek', 400)]);
    K.cloud.on('dilekfener', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.on('fenergercek', (r) => gercek.some((x) => x.id === r.id) || (gercek.push(r), render()));
    K.renderSpecials && K.renderSpecials();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (gun() !== 21 || !K.cloud || !K.cloud.enabled || benimBuAy()) return [];
    return [{ key: 'fener', icon: 'candle', title: '🏮 Bu gece fener gecesi', text: 'Ayın 21\'i. Bir dilek yaz, fenerini gökyüzüne bırak.', room: 'fenerler', cta: 'Fener bırak' }];
  });
  K.room({
    id: 'fenerler',
    wing: 'mevsim',
    title: 'Dilek Fenerleri',
    sub: 'Her ayın 21\'inde',
    icon: 'candle',
    color: '#2B1F5C',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Her ayın 21'inde ikimiz birer dilek yazıp bir fener bırakıyoruz. Fenerler bu gökyüzünde birikiyor; gerçekleşen dilekler yıldıza dönüşüyor.</p></div>
        <p class="fn-ust center" id="fnUst"></p><div class="fn-gok" id="fnGok"></div><section class="card" id="fnBirak"></section>`;
      el.addEventListener('click', async (e) => {
        const f = e.target.closest('[data-fn]');
        if (f) return goster(f.dataset.fn);
        if (!e.target.closest('[data-fn-birak]')) return;
        const inp = K.$('#fnMetin', root), text = inp.value.trim();
        if (!text) return inp.focus();
        const r = await K.cloud.add('dilekfener', { ay: ay(), text });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        yeni = r.id;
        K.stickers.award('fener');
        K.ping(`🏮 ${K.meName()} bu ayın dilek fenerini bıraktı`, 'Gökyüzüne bak.', ['izakaya_lantern'], { click: K.roomUrl('fenerler') });
        render();
        K.renderSpecials && K.renderSpecials();
      });
    },
    enter() {
      render();
    },
  });
})();
