/* Oda: Amiral Battı — sırayla oynanan iki kişilik amiral battı. Ardoş'un filosu Boğaz'da, Eln'inki Hazar'da (8×8).
   Gemiler rastgele dizilir ("Karıştır"), "Hazırım" denince filo mühürlenir. Davet edilen ilk atışı yapar; isabet eden
   bir kez daha atar, ıskalayınca sıra geçer (o an öbürüne bildirim). Batan her gemiden küçük bir not çıkar.
   Kayıt (tek tür): amiral {t: 'yeni'} · {t: 'kur', g, ships: [[satır, sütun, boy, yön]]} · {t: 'atis', g, x, y} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;

  const AM = () => D.amiral || { intro: [], fleets: { me: { sea: 'Boğaz', ships: [] }, her: { sea: 'Hazar', ships: [] } }, sink: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const N = 8;
  const fleetDef = (w) => (AM().fleets[w] || { ships: [] }).ships;
  let rows = [], loaded = false, root = null, draft = null;
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);

  /* ---------- Durum ---------- */
  const games = () => rows.filter((r) => r.data.t === 'yeni').sort((a, b) => a.at - b.at);
  const cur = () => games().slice(-1)[0] || null;
  function state(gr) {
    if (!gr) return null;
    const g = gr.id;
    const of = (t) => rows.filter((r) => r.data.g === g && r.data.t === t).sort((a, b) => a.at - b.at);
    const fleets = {};
    of('kur').forEach((r) => (fleets[r.who] = r.data.ships));
    const cells = (w) => {
      const out = [];
      (fleets[w] || []).forEach(([r, c, len, dir], i) => {
        for (let k = 0; k < len; k++) out.push({ r: r + (dir ? k : 0), c: c + (dir ? 0 : k), ship: i });
      });
      return out;
    };
    const first = gr.who === 'me' ? 'her' : 'me';
    let turn = first, winner = null;
    const shots = { me: [], her: [] };
    const ready = Boolean(fleets.me && fleets.her);
    if (ready)
      of('atis').forEach((r) => {
        if (winner || r.who !== turn) return;
        const tgt = cells(r.who === 'me' ? 'her' : 'me');
        const hit = tgt.find((c) => c.r === r.data.y && c.c === r.data.x);
        if (shots[r.who].some((s) => s.x === r.data.x && s.y === r.data.y)) return;
        shots[r.who].push({ x: r.data.x, y: r.data.y, hit: hit ? hit.ship : -1, at: r.at });
        const hitsOn = shots[r.who].filter((s) => s.hit >= 0).length;
        if (hitsOn >= tgt.length) winner = r.who;
        else if (!hit) turn = turn === 'me' ? 'her' : 'me';
      });
    const sunk = (w) => (fleets[w] || []).map((s, i) => shots[w === 'me' ? 'her' : 'me'].filter((x) => x.hit === i).length >= s[2]);
    return { g, gr, fleets, cells, shots, turn, winner, ready, first, sunk };
  }
  function wins() {
    const w = { me: 0, her: 0 };
    games().forEach((gr) => {
      const s = state(gr);
      s.winner && w[s.winner]++;
    });
    return w;
  }

  /* ---------- Rastgele diziliş (gemiler birbirine değmez) ---------- */
  function randomFleet(w) {
    for (let tries = 0; tries < 400; tries++) {
      const taken = new Set(), out = [];
      let ok = true;
      for (const [, len] of fleetDef(w)) {
        let placed = false;
        for (let t = 0; t < 200 && !placed; t++) {
          const dir = Math.random() < 0.5 ? 0 : 1;
          const r = Math.floor(Math.random() * (dir ? N - len + 1 : N)), c = Math.floor(Math.random() * (dir ? N : N - len + 1));
          const cs = Array.from({ length: len }, (_, k) => [r + (dir ? k : 0), c + (dir ? 0 : k)]);
          if (cs.some(([y, x]) => [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => taken.has(`${y + dy},${x + dx}`))))) continue;
          cs.forEach(([y, x]) => taken.add(`${y},${x}`));
          out.push([r, c, len, dir]);
          placed = true;
        }
        if (!placed) {
          ok = false;
          break;
        }
      }
      if (ok) return out;
    }
    return [];
  }

  /* ---------- Çizim ---------- */
  function grid(w, s, opts) {
    // w: denizi çizilen kişi. opts.target: ateş edilebilir mi
    const ships = opts.ships || (s && s.fleets[w]) || [];
    const shots = s ? s.shots[w === 'me' ? 'her' : 'me'] : [];
    const sunk = s ? s.sunk(w) : [];
    const own = w === mine();
    const cellShip = {};
    ships.forEach(([r, c, len, dir], i) => {
      for (let k = 0; k < len; k++) cellShip[`${r + (dir ? k : 0)},${c + (dir ? 0 : k)}`] = { i, head: k === 0, tail: k === len - 1, dir };
    });
    let html = '';
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const sh = shots.find((q) => q.x === x && q.y === y);
        const cs = cellShip[`${y},${x}`];
        const show = cs && (own || sunk[cs.i]);
        const cls = ['am-c', show ? `ship ${cs.dir ? 'v' : 'h'} ${cs.head ? 'head' : ''} ${cs.tail ? 'tail' : ''} ${sunk[cs.i] ? 'sunk' : ''}` : '', sh ? (sh.hit >= 0 ? 'hit' : 'miss') : ''].join(' ');
        const can = opts.target && !sh;
        html += `<button type="button" class="${cls}" ${can ? `data-am="${x},${y}"` : 'tabindex="-1"'} aria-label="${'ABCDEFGH'[x]}${y + 1}">${sh ? (sh.hit >= 0 ? '💥' : '') : ''}</button>`;
      }
    return `<div class="am-sea sea-${w} ${opts.small ? 'small' : ''} ${opts.target ? 'target' : ''}"><div class="am-grid">${html}</div></div>`;
  }
  function legend(w, s) {
    const sunk = s ? s.sunk(w) : [];
    return `<ul class="am-legend">${fleetDef(w).map(([n, len], i) => `<li class="${sunk[i] ? 'sunk' : ''}"><span class="am-len">${'■'.repeat(len)}</span>${K.esc(n)}</li>`).join('')}</ul>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'amiral') return;
    const box = K.$('#amBody', root);
    const gr = cur();
    const s = state(gr);
    const w = wins();
    K.$('#amWins', root).innerHTML = `<span>${K.esc(C.herPet)} <b>${w.her}</b></span><i>⚓</i><span><b>${w.me}</b> ${K.esc(C.myPet)}</span>`;
    if (!s || s.winner) {
      box.innerHTML = `${s && s.winner ? `<div class="am-end"><p class="am-big">${s.winner === mine() ? '🏆' : '🌊'}</p><h2>${s.winner === mine() ? 'Kazandın!' : `${K.esc(nameOf(s.winner))} kazandı`}</h2><p class="hand">${K.esc(K.fill(AM().win || '').replace('{who}', nameOf(s.winner)))}</p></div>
        <div class="am-two">${grid(other(), s, { small: true })}${grid(mine(), s, { small: true })}</div>` : ''}
        <div class="center"><button type="button" class="btn red" data-am-new>⚓ Yeni oyun başlat</button></div>`;
      return;
    }
    const me = mine(), ot = other();
    if (!s.fleets[me]) {
      if (!draft || draft.g !== s.g) draft = { g: s.g, ships: randomFleet(me) };
      box.innerHTML = `<p class="card-eyebrow">${K.esc(AM().fleets[me].sea)} · filonu diz</p><p class="muted small">${s.gr.who === me ? `${K.esc(nameOf(ot))} da filosunu dizince savaş başlar.` : `${K.esc(nameOf(s.gr.who))} seni savaşa çağırdı! İlk atış senin.`}</p>
        ${grid(me, null, { ships: draft.ships })}${legend(me, null)}
        <div class="row center"><button type="button" class="btn soft" data-am-shuffle>🔀 Karıştır</button><button type="button" class="btn red" data-am-ready>⚓ Hazırım</button></div>`;
      return;
    }
    if (!s.fleets[ot]) {
      box.innerHTML = `<p class="am-turn wait">⏳ ${K.esc(nameOf(ot))} filosunu diziyor...</p>${grid(me, s, {})}${legend(me, s)}`;
      return;
    }
    const my = s.turn === me;
    box.innerHTML = `<p class="am-turn ${my ? 'myturn' : 'wait'}">${my ? '🎯 Sıra sende: onun denizine bir top at' : `⏳ Sıra ${K.esc(K.ek(nameOf(ot), 'de'))}`}</p>
      <p class="card-eyebrow">${K.esc(AM().fleets[ot].sea)} · ${K.esc(K.ek(nameOf(ot), 'in'))} filosu</p>${grid(ot, s, { target: my })}${legend(ot, s)}
      <p class="card-eyebrow am-mine-h">${K.esc(AM().fleets[me].sea)} · senin filon</p>${grid(me, s, { small: true })}
      <p class="muted small center">İsabet: ${s.shots[me].filter((x) => x.hit >= 0).length} · Atış: ${s.shots[me].length}</p>`;
  }

  /* ---------- Eylemler ---------- */
  async function add(data) {
    const r = await K.cloud.add('amiral', data);
    if (!r) K.fx.toast('Gönderilemedi.');
    push(r);
    return r;
  }
  async function shoot(x, y, btn) {
    const s = state(cur());
    if (!s || !s.ready || s.winner || s.turn !== mine()) return;
    btn && (btn.disabled = true);
    const r = await add({ t: 'atis', g: s.g, x, y });
    if (!r) return;
    const s2 = state(cur());
    const shot = s2.shots[mine()].find((q) => q.x === x && q.y === y);
    if (shot && shot.hit >= 0) {
      K.audio.sfx.success();
      K.vibrate([30, 40, 60]);
      if (s2.sunk(other())[shot.hit]) sunkNote(fleetDef(other())[shot.hit][0]);
    } else K.audio.sfx.whoosh();
    if (s2.winner === mine()) {
      K.fx.confetti({ count: 160 });
      K.stickers.award('amiral');
      K.ping(`⚓ ${K.meName()} amiral battıyı kazandı`, `Bütün filon battı. ${AM().win ? 'Borcunu öde 😘' : ''}`, ['anchor'], { click: K.roomUrl('amiral') });
    } else if (shot && shot.hit < 0) K.ping(`🎯 Sıra sende: ${K.meName()} ıskaladı`, 'Amiral Battı', ['anchor'], { click: K.roomUrl('amiral') });
    render();
  }
  function sunkNote(name) {
    K.fx.toast(`🚢 <b>${K.esc(name)} battı!</b> ${K.esc(K.pick(AM().sink || ['']))}`, { duration: 6000 });
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('amiral', 3000);
    loaded = true;
    K.cloud.on('amiral', (r) => {
      if (!push(r) || r.who === mine()) return;
      const s = state(cur());
      if (r.data.t === 'yeni') K.fx.toast(`⚓ <b>${K.esc(nameOf(r.who))} seni amiral battıya çağırıyor.</b> <a href="#amiral">Filonu diz</a>`, { duration: 9000 });
      if (r.data.t === 'kur' && s && s.ready) K.fx.toast(`⚓ <b>Savaş başladı!</b> ${s.turn === mine() ? 'İlk atış sende.' : ''} <a href="#amiral">Denize</a>`, { duration: 7000 });
      if (r.data.t === 'atis' && s) {
        const shot = s.shots[r.who].find((q) => q.x === r.data.x && q.y === r.data.y);
        if (shot && shot.hit >= 0) {
          K.vibrate([60, 40, 60]);
          if (s.sunk(mine())[shot.hit]) K.fx.toast(`🌊 <b>${K.esc(fleetDef(mine())[shot.hit][0])} battı.</b> ${K.esc(K.pick(AM().sink || ['']))}`, { duration: 6000 });
        }
        if (s.winner === r.who) K.fx.toast(`🌊 <b>${K.esc(nameOf(r.who))} kazandı.</b> Borcunu bir öpücükle öde.`, { duration: 8000 });
        else if (s.turn === mine() && K.activeRoom !== 'amiral') K.fx.toast(`🎯 <b>Amiral Battı: sıra sende.</b> <a href="#amiral">Ateş et</a>`, { duration: 7000 });
      }
      render();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    });
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const s = state(cur());
    if (!s || s.winner) return [];
    if (!s.fleets[mine()]) return s.gr.who !== mine() ? [{ icon: 'flag', title: `⚓ ${nameOf(s.gr.who)} seni amiral battıya çağırıyor`, text: `Filonu ${AM().fleets[mine()].sea}'a diz; ilk atış senin.`, room: 'amiral', cta: 'Filonu diz' }] : [];
    if (s.ready && s.turn === mine()) return [{ icon: 'flag', title: '🎯 Amiral Battı: sıra sende', text: `${nameOf(other())} senin denizine top attı. Şimdi sen.`, room: 'amiral', cta: 'Ateş et' }];
    return [];
  });
  K.amiral = { wins, state: () => state(cur()) };

  K.room({
    id: 'amiral',
    wing: 'oyun',
    title: 'Amiral Battı',
    sub: 'Boğaz\'a karşı Hazar',
    icon: 'flag',
    color: '#D6ECFF',
    hidden: () => !D.amiral || !K.cloud || !K.cloud.enabled,
    badge: () => {
      const s = loaded && state(cur());
      if (!s || s.winner) return '';
      return !s.fleets[mine()] ? 'Davet' : s.ready && s.turn === mine() ? 'Sıra sende' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(AM().intro || [])}</div>
        <div class="am-wins" id="amWins"></div>
        <section class="card am-card" id="amBody"></section>`;
      el.addEventListener('click', async (e) => {
        const c = e.target.closest('[data-am]');
        if (c) {
          const [x, y] = c.dataset.am.split(',').map(Number);
          return shoot(x, y, c);
        }
        if (e.target.closest('[data-am-new]')) {
          const r = await add({ t: 'yeni' });
          if (!r) return;
          draft = null;
          K.ping(`⚓ ${K.meName()} seni amiral battıya çağırıyor`, `Filonu ${AM().fleets[other()].sea}'a diz; ilk atış senin.`, ['anchor'], { click: K.roomUrl('amiral') });
          return render();
        }
        if (e.target.closest('[data-am-shuffle]') && draft) {
          draft.ships = randomFleet(mine());
          K.audio.sfx.tap();
          return render();
        }
        const rd = e.target.closest('[data-am-ready]');
        if (rd && draft) {
          rd.disabled = true;
          const s = state(cur());
          await add({ t: 'kur', g: s.g, ships: draft.ships });
          K.audio.sfx.chime();
          const s2 = state(cur());
          if (s2.ready) K.ping(`⚓ Savaş başladı`, s2.turn === other() ? 'İlk atış sende.' : `${K.meName()} filosunu dizdi.`, ['anchor'], { click: K.roomUrl('amiral') });
          return render();
        }
      });
    },
    enter() {
      render();
    },
  });
})();
