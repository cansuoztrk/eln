/* Oda: Bakü'de İlk Gün — kumbara dolup uçak Bakü'ye indiğinde yaşanacak ilk günün ortak planı.
   Stilize bir Bakü haritası üzerinde yerler; ikisi de kalp atar, yerleri sabah/öğleden sonra/akşam/gece dilimlerine koyar,
   kendi yerini ekler. Onun şehri: rehber o. Bulutla canlı. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  let root, rows = [], sel = null;
  const IG = () => D.ilkgun || { intro: [], slots: [], places: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const cloudOn = () => Boolean(K.cloud && K.cloud.enabled);

  // Kayıtlar: 'igheart' {id, on}, 'igslot' {id, slot}, 'igplace' {id, name, text, x, y}
  const lastOf = (kind, id, who) => rows.filter((r) => r.kind === kind && r.data.id === id && (!who || r.who === who)).pop();
  const custom = () => rows.filter((r) => r.kind === 'igplace').map((r) => ({ ...r.data, custom: r.who }));
  const places = () => IG().places.concat(custom());
  const hearts = (id) => ['her', 'me'].filter((w) => {
    const r = lastOf('igheart', id, w);
    return r && r.data.on;
  });
  const slotOf = (p) => {
    const r = lastOf('igslot', p.id);
    return r ? r.data.slot : p.slot || '';
  };

  function map() {
    const ps = places();
    return `<svg class="ig-map" viewBox="0 0 100 80" role="img" aria-label="Stilize Bakü haritası">
      <rect width="100" height="80" rx="4" fill="#FFF6EC"/>
      <path d="M0 80 L0 74 C12 70 22 78 34 76 C46 74 52 80 64 77 C76 74 84 64 100 66 L100 80 Z" fill="#BFE6FF"/>
      <path d="M0 74 C12 70 22 78 34 76 C46 74 52 80 64 77 C76 74 84 64 100 66" fill="none" stroke="#8FD3FF" stroke-width=".8"/>
      <text x="80" y="76" font-size="3.4" fill="#4FA3E3" font-style="italic">Hazar</text>
      <g class="ig-deco" aria-hidden="true">
        <path d="M6 40 C20 34 30 44 44 40 S70 30 96 34 M10 58 C24 52 34 50 48 46 S72 40 92 44 M28 20 C32 34 36 48 40 70 M60 14 C58 30 60 46 58 66" fill="none" stroke="#EADCC8" stroke-width=".7" stroke-dasharray="1.6 1.2"/>
        <text x="6" y="11" font-size="5.2" fill="#E3174D" font-family="Pacifico, cursive">Bakı</text>
        <text x="6" y="16" font-size="2.3" fill="#B07A4F" letter-spacing=".3">İLK GÜNÜN HARİTASI</text>
        <g transform="translate(90 11)"><circle r="4.6" fill="#fff" stroke="#EADCC8" stroke-width=".5"/><path d="M0 -3.6 L1.1 0 L0 3.6 L-1.1 0 Z" fill="#E3174D"/><text y="-5.6" font-size="2.2" text-anchor="middle" fill="#B07A4F">K</text></g>
        <g transform="translate(78 22) rotate(-20)"><path d="M-4 0 L4 0 M0 -3 L1.2 0 L0 3 M-4 0 L-5 -1.6 M-4 0 L-5 1.6" stroke="#8FD3FF" stroke-width=".8" fill="none" stroke-linecap="round"/></g>
        <path d="M18 30 C30 22 52 18 76 22" fill="none" stroke="#FFB3CB" stroke-width=".5" stroke-dasharray="1 1.4"/>
      </g>
      <path d="M38 55 L50 55 L50 67 L38 67 Z" fill="#F3E3CF" stroke="#D9BF98" stroke-width=".5"/>
      <text x="39" y="58.5" font-size="2.2" fill="#B07A4F">İçərişəhər</text>
      ${ps
        .map((p) => {
          const h = hearts(p.id);
          const s = slotOf(p);
          const cls = [h.length === 2 ? 'both' : h.length ? 'one' : '', s ? 'slotted' : '', sel === p.id ? 'sel' : '', visited()[p.id] ? 'visited' : ''].join(' ');
          return `<g class="ig-pin ${cls}" data-pin="${K.esc(p.id)}" transform="translate(${(+p.x || 50).toFixed(1)} ${(+p.y || 50).toFixed(1)})" tabindex="0" role="button" aria-label="${K.esc(p.name)}">
            <circle r="3.4" class="ig-halo"/><path d="M0 2.4 C-3.6 -0.4 -3.6 -4.2 -1.5 -4.2 C-0.5 -4.2 0 -3.3 0 -2.8 C0 -3.3 0.5 -4.2 1.5 -4.2 C3.6 -4.2 3.6 -0.4 0 2.4 Z" class="ig-heart"/>
          </g>`;
        })
        .join('')}
      ${(() => {
        const p = sel && ps.find((x) => x.id === sel);
        if (!p) return '';
        const x = K.clamp(+p.x || 50, 14, 86), y = (+p.y || 50) - 6.5;
        const w = Math.min(60, p.name.length * 1.55 + 5);
        return `<g class="ig-lblg" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" pointer-events="none"><rect x="${(-w / 2).toFixed(1)}" y="-3.6" width="${w.toFixed(1)}" height="4.8" rx="2.4" fill="#4A2735"/><text y="0" text-anchor="middle" class="ig-lbl">${K.esc(p.name)}</text></g>`;
      })()}
    </svg>`;
  }
  // Bakü Günlüğü'nde bu yere iğnelenmiş fotoğraflar (gittiğimiz yerler)
  const visited = () => (K.gunluk ? K.gunluk.visited() : {});
  function card(p) {
    const h = hearts(p.id);
    const v = visited()[p.id];
    const s = slotOf(p);
    const my = h.includes(mine());
    return `<article class="ig-card ${sel === p.id ? 'sel' : ''}" data-card="${K.esc(p.id)}">
      <header><b>${K.esc(p.name)}</b>${v ? '<span class="ig-went">Gittik ✓</span>' : ''}${p.custom ? `<span class="ig-by">${K.esc(p.custom === 'me' ? C.myPet : C.herPet)} ekledi</span>` : ''}</header>
      ${v ? `<div class="ig-thumbs">${v.slice(0, 4).map((t) => `<img src="${t}" alt="">`).join('')}</div>` : ''}
      <p class="hand">${K.esc(K.fill(p.text || ''))}</p>
      <div class="ig-acts">
        <button type="button" class="chip ${my ? 'on' : ''}" data-heart="${K.esc(p.id)}" aria-pressed="${my}">${A.ui('heart')} ${h.length === 2 ? 'İkimiz de' : h.length ? (h[0] === 'me' ? C.myPet : C.herPet) : 'Kalp at'}</button>
        <select class="input ig-slot" data-slot="${K.esc(p.id)}" aria-label="Günün hangi vakti">${[['', 'Plana ekle...']].concat(IG().slots).map(([k, t]) => `<option value="${k}" ${k === s ? 'selected' : ''}>${K.esc(t)}</option>`).join('')}</select>
      </div>
    </article>`;
  }
  function render() {
    if (!root) return;
    K.$('#igMap', root).innerHTML = map();
    const ps = places();
    K.$('#igDay', root).innerHTML = IG()
      .slots.map(([k, t]) => {
        const list = ps.filter((p) => slotOf(p) === k);
        return `<div class="ig-slotcol"><p class="card-eyebrow">${K.esc(t)}</p>${list.length ? list.map((p) => `<button type="button" class="ig-chip ${hearts(p.id).length === 2 ? 'both' : ''}" data-go="${K.esc(p.id)}">${K.esc(p.name)}</button>`).join('') : '<p class="muted small">Boş</p>'}</div>`;
      })
      .join('');
    const both = ps.filter((p) => hearts(p.id).length === 2).length;
    K.$('#igStat', root).textContent = `${ps.length} yer · ${both} tanesinde ikimiz de kalp attık · plana ${ps.filter((p) => slotOf(p)).length} yer girdi`;
    const sorted = ps.slice().sort((a, b) => (sel === b.id) - (sel === a.id) || hearts(b.id).length - hearts(a.id).length);
    K.$('#igList', root).innerHTML = sorted.map(card).join('');
  }

  async function add(kind, data) {
    if (!cloudOn()) {
      rows.push({ id: 'l' + Date.now(), kind, who: mine(), at: Date.now(), data });
      K.store.set('ilkgun', rows);
      return true;
    }
    return K.cloud.add(kind, data);
  }

  K.on('built', () => {
    if (!cloudOn()) rows = K.store.get('ilkgun', []);
  });
  K.on('gunluk', () => K.activeRoom === 'ilkgun' && render());
  K.on('cloud', async (on) => {
    if (!on) return;
    const kinds = ['igheart', 'igslot', 'igplace'];
    const got = await Promise.all(kinds.map((k) => K.cloud.list(k)));
    rows = got.flat().sort((a, b) => a.at - b.at);
    kinds.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine() && k !== 'igslot') {
          const p = places().find((x) => x.id === r.data.id);
          if (p && (k === 'igplace' || r.data.on)) K.fx.toast(`<b>${K.esc(K.otherName())}</b> ${k === 'igplace' ? 'plana yeni bir yer ekledi' : 'bir yere kalp attı'}: ${K.esc(p.name)}`, { icon: A.icon('map') });
        }
        if (K.activeRoom === 'ilkgun') render();
      })
    );
  });

  K.room({
    id: 'ilkgun',
    wing: 'kalp',
    title: 'Bakü\'de İlk Gün',
    sub: 'Uçak indiğinde: ikimizin ilk günü',
    icon: 'map',
    color: '#FFEFD9',
    hidden: () => !D.ilkgun,
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(IG().intro)}</div>
        <div class="ig-top"><div class="ig-mapwrap" id="igMap"></div>
          <div class="ig-dayw"><p class="card-eyebrow">O günün planı</p><div class="ig-day" id="igDay"></div></div></div>
        <p class="muted small" id="igStat"></p>
        <div class="ig-list" id="igList"></div>
        <form class="card ig-add" id="igAdd" autocomplete="off">
          <p class="card-eyebrow">Senin bildiğin bir yer ekle</p>
          <input class="input" id="igName" name="igName" maxlength="40" placeholder="Yerin adı (ör. Sevdiğin kafe)">
          <input class="input" id="igText" name="igText" maxlength="160" placeholder="Neden orası?">
          <p class="muted small">Haritada yerini seçmek için haritaya dokun (isteğe bağlı).</p>
          <button class="btn small" type="submit">${A.ui('plus')} Ekle</button>
        </form>`;
      let pick = null;
      el.addEventListener('click', async (e) => {
        const pin = e.target.closest('[data-pin]') || e.target.closest('[data-go]');
        if (pin) {
          sel = pin.dataset.pin || pin.dataset.go;
          render();
          const c = K.$(`[data-card="${sel}"]`, root);
          c && c.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center' });
          return;
        }
        const svg = e.target.closest('.ig-map');
        if (svg) {
          const r = svg.getBoundingClientRect();
          pick = [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 80];
          K.fx.toast('Yer seçildi. Şimdi adını yaz.', { icon: A.icon('map'), duration: 2000 });
        }
        const h = e.target.closest('[data-heart]');
        if (h) {
          const id = h.dataset.heart;
          const on = !hearts(id).includes(mine());
          await add('igheart', { id, on });
          if (on) K.audio.sfx.pop();
          render();
        }
      });
      el.addEventListener('change', async (e) => {
        const s = e.target.closest('[data-slot]');
        if (!s) return;
        await add('igslot', { id: s.dataset.slot, slot: s.value });
        render();
      });
      K.$('#igAdd', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = K.$('#igName', el).value.trim();
        if (!name) return K.$('#igName', el).focus();
        const id = 'c' + Date.now().toString(36);
        await add('igplace', { id, name, text: K.$('#igText', el).value.trim(), x: pick ? pick[0] : 20 + Math.random() * 60, y: pick ? pick[1] : 20 + Math.random() * 40 });
        await add('igheart', { id, on: true });
        pick = null;
        K.$('#igName', el).value = '';
        K.$('#igText', el).value = '';
        sel = id;
        K.audio.sfx.chime();
        render();
      });
    },
    enter() {
      render();
    },
  });
})();
