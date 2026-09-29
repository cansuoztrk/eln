/* Oda: Nərd — Bakü'de nərd, İstanbul'da tavla. İki kişilik, yazışmalı ya da canlı oynanan klasik tavla:
   her hamle buluta bir satır (nerd {gid, n, st, mv, dice}), sıra kimdeyse o oynar; ikiniz de oradaysanız
   pullar karşı tarafta canlı kayar. Mars iki sayı. Tek başına Kitty'ye karşı alıştırma da var.
   Tahta: me pulları pozitif, idx 23→0 yönünde; her pulları negatif, idx 0→23 yönünde. Herkes kendi evini sağ altta görür. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const ND = () => D.nerd || { intro: [], rules: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const opp = (w) => (w === 'me' ? 'her' : 'me');
  const nameOf = (w) => (w === 'bot' ? 'Kitty' : w === 'me' ? C.myPet : C.herPet);
  const NUM = ['', 'yek', 'dü', 'se', 'cihar', 'penç', 'şeş'];
  const DOUBLES = ['', 'Hep yek', 'Dubara', 'Dü se', 'Dört cihar', 'Dü beş', 'Düşeş'];
  const call = (d) => {
    if (!d) return '';
    const [a, b] = d[0] >= d[1] ? d : [d[1], d[0]];
    if (a === b) return DOUBLES[a];
    if (a === 6 && b === 5) return 'Şeş beş';
    const s = `${NUM[a]} ${NUM[b]}`;
    return s[0].toLocaleUpperCase('tr-TR') + s.slice(1);
  };

  /* ---------- Kurallar ---------- */
  function fresh() {
    const p = new Array(24).fill(0);
    p[23] = 2; p[12] = 5; p[7] = 3; p[5] = 5;
    p[0] = -2; p[11] = -5; p[16] = -3; p[18] = -5;
    return { p, bar: { me: 0, her: 0 }, off: { me: 0, her: 0 }, turn: 'me', dice: null, winner: null };
  }
  const clone = (s) => ({ p: s.p.slice(), bar: Object.assign({}, s.bar), off: Object.assign({}, s.off), turn: s.turn, dice: s.dice ? s.dice.slice() : null, winner: s.winner || null, pts: s.pts || 0, resigned: s.resigned || null });
  const cnt = (s, i, w) => (w === 'me' ? Math.max(0, s.p[i]) : Math.max(0, -s.p[i]));
  const home = (w, i) => (w === 'me' ? i <= 5 : i >= 18);
  const allHome = (s, w) => {
    if (s.bar[w]) return false;
    for (let i = 0; i < 24; i++) if (cnt(s, i, w) && !home(w, i)) return false;
    return true;
  };
  const blocked = (s, i, w) => cnt(s, i, opp(w)) >= 2;
  function singles(s, w, d) {
    const out = [];
    if (s.bar[w]) {
      const to = w === 'me' ? 24 - d : d - 1;
      if (!blocked(s, to, w)) out.push({ from: 'bar', to, d });
      return out;
    }
    const canOff = allHome(s, w);
    for (let i = 0; i < 24; i++) {
      if (!cnt(s, i, w)) continue;
      const to = w === 'me' ? i - d : i + d;
      if (to >= 0 && to <= 23) {
        if (!blocked(s, to, w)) out.push({ from: i, to, d });
      } else if (canOff) {
        const exact = w === 'me' ? i === d - 1 : i === 24 - d;
        let higher = false;
        if (w === 'me') for (let j = i + 1; j <= 5; j++) higher = higher || cnt(s, j, w) > 0;
        else for (let j = 18; j < i; j++) higher = higher || cnt(s, j, w) > 0;
        if (exact || !higher) out.push({ from: i, to: 'off', d });
      }
    }
    return out;
  }
  function apply(s0, m, w) {
    const s = clone(s0);
    const sg = w === 'me' ? 1 : -1;
    if (m.from === 'bar') s.bar[w]--;
    else s.p[m.from] -= sg;
    if (m.to === 'off') s.off[w]++;
    else {
      if (cnt(s, m.to, opp(w)) === 1) {
        s.p[m.to] = 0;
        s.bar[opp(w)]++;
        m.hit = true;
      }
      s.p[m.to] += sg;
    }
    return s;
  }
  const keyOf = (s, left) => `${s.p.join(',')}|${s.bar.me},${s.bar.her}|${s.off.me},${s.off.her}|${left.join('')}`;
  function best(s, w, left, memo) {
    if (!left.length) return 0;
    const key = keyOf(s, left);
    if (key in memo) return memo[key];
    let b = 0;
    const tried = {};
    outer: for (let k = 0; k < left.length; k++) {
      const d = left[k];
      if (tried[d]) continue;
      tried[d] = 1;
      const rest = left.slice(0, k).concat(left.slice(k + 1));
      for (const m of singles(s, w, d)) {
        b = Math.max(b, 1 + best(apply(s, m, w), w, rest, memo));
        if (b === left.length) break outer;
      }
    }
    memo[key] = b;
    return b;
  }
  // Şu an oynanabilecek tek hamleler (en çok zarı kullanan yollardan biri olmalı; tek zar oynanabiliyorsa büyüğü)
  function legal(s, w, left, memo, first) {
    const target = best(s, w, left, memo);
    if (!target) return [];
    let out = [];
    const tried = {};
    for (let k = 0; k < left.length; k++) {
      const d = left[k];
      if (tried[d]) continue;
      tried[d] = 1;
      const rest = left.slice(0, k).concat(left.slice(k + 1));
      singles(s, w, d).forEach((m) => {
        if (1 + best(apply(s, m, w), w, rest, memo) === target) out.push(m);
      });
    }
    if (first && target === 1 && left.length === 2 && left[0] !== left[1]) {
      const hi = Math.max(left[0], left[1]);
      if (out.some((m) => m.d === hi)) out = out.filter((m) => m.d === hi);
    }
    return out;
  }
  const expand = (d) => (d[0] === d[1] ? [d[0], d[0], d[0], d[0]] : d.slice());
  const roll = () => [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
  const pip = (s, w) => {
    let t = s.bar[w] * 25;
    for (let i = 0; i < 24; i++) t += cnt(s, i, w) * (w === 'me' ? i + 1 : 24 - i);
    return t;
  };
  function finishState(s, w) {
    const n = clone(s);
    n.dice = null;
    n.turn = opp(w);
    if (n.off[w] === 15) {
      n.winner = w;
      n.pts = n.off[opp(w)] === 0 ? 2 : 1;
    }
    return n;
  }

  /* ---------- Kitty (alıştırma rakibi) ---------- */
  function exposed(s, i, w) {
    const o = opp(w);
    if (s.bar[o]) {
      if (w === 'me' && i <= 11) return true;
      if (w === 'her' && i >= 12) return true;
    }
    for (let j = 0; j < 24; j++) {
      if (!cnt(s, j, o)) continue;
      const dist = o === 'me' ? j - i : i - j;
      if (dist >= 1 && dist <= 11) return true;
    }
    return false;
  }
  function score(s, w) {
    const o = opp(w);
    let v = (pip(s, o) - pip(s, w)) + s.off[w] * 4 + s.bar[o] * 14;
    for (let i = 0; i < 24; i++) {
      const c = cnt(s, i, w);
      if (c >= 2) v += home(w, i) ? 7 : 3;
      if (c === 1 && exposed(s, i, w)) v -= 9 + (home(w, i) ? 4 : 0);
    }
    return v;
  }
  function botPlan(s, w, dice) {
    const memo = {};
    const plans = [];
    const seen = {};
    (function rec(st, left, path, first) {
      const ms = legal(st, w, left, memo, first);
      if (!ms.length) {
        const k = keyOf(st, []);
        if (!seen[k]) {
          seen[k] = 1;
          plans.push({ path, v: score(st, w) });
        }
        return;
      }
      ms.forEach((m) => {
        const k = left.indexOf(m.d);
        const mm = Object.assign({}, m);
        rec(apply(st, mm, w), left.slice(0, k).concat(left.slice(k + 1)), path.concat([mm]), false);
      });
    })(s, expand(dice), [], true);
    plans.sort((a, b) => b.v - a.v);
    if (plans.length > 1 && Math.random() < 0.22) return plans[1].path;
    return plans.length ? plans[0].path : [];
  }

  /* ---------- Durum ---------- */
  let root, mode = K.store.get('nerdMode', 'duo'), rows = [], wins = [], game = null, live = null;
  let turn = null, sel = null, anim = false, botT = null;
  let bot = K.store.get('nerdBot', null);
  const side = () => mine();
  const botSide = () => opp(mine());
  const persp = () => mine();

  function latest() {
    if (!rows.length) return null;
    const gid = rows.reduce((a, r) => (r.at > a.at ? r : a)).data.gid;
    const gs = rows.filter((r) => r.data.gid === gid);
    const maxN = Math.max(...gs.map((r) => r.data.n));
    return gs.filter((r) => r.data.n === maxN).sort((a, b) => a.at - b.at)[0];
  }
  const cur = () => (mode === 'bot' ? bot && bot.st : game && game.data.st);
  const myTurn = () => {
    const s = cur();
    return Boolean(s && !s.winner && s.turn === side());
  };

  /* ---------- Tahta çizimi ---------- */
  const BX = 18, BY = 18, PW = 55, BAR = 44, TH = 210, R = 23;
  const view = (i) => (persp() === 'me' ? i : 23 - i);
  const colOf = (v) => (v >= 12 ? v - 12 : 11 - v);
  const colX = (c) => (c < 6 ? BX + c * PW : BX + 6 * PW + BAR + (c - 6) * PW) + PW / 2;
  const isTop = (v) => v >= 12;
  function stackY(v, k, n) {
    const step = n > 5 ? Math.min(46, (240 - 2 * R) / (n - 1)) : 46;
    return isTop(v) ? BY + R + 2 + k * step : 542 - R - 2 - k * step;
  }
  const barX = BX + 6 * PW + BAR / 2;
  const barY = (w, k) => (w === persp() ? 330 + R + k * 30 : 230 - R - k * 30);
  const offY = (w, k) => (w === persp() ? 534 - k * 13 : 26 + k * 13);
  function xyOf(s, where, w, top) {
    if (where === 'bar') return [barX, barY(w, Math.max(0, s.bar[w] - (top ? 1 : 0)))];
    if (where === 'off') return [774, offY(w, Math.max(0, s.off[w] - (top ? 1 : 0)))];
    const v = view(where);
    const n = cnt(s, where, w);
    return [colX(colOf(v)), stackY(v, Math.max(0, n - (top ? 1 : 0)), Math.max(n, 1))];
  }
  const checker = (w, x, y, cls = '') =>
    w === 'me'
      ? `<g class="nd-c me ${cls}" transform="translate(${x} ${y})"><circle r="${R}" fill="#FFFDF8" stroke="#2B2024" stroke-width="2.5"/><circle r="16" fill="none" stroke="#F6C9DA" stroke-width="2"/><path d="M0 7 C-10 -1 -10 -11 -4 -11 C-1.3 -11 0 -9 0 -7.6 C0 -9 1.3 -11 4 -11 C10 -11 10 -1 0 7 Z" fill="#E3174D" stroke="#2B2024" stroke-width="1.4"/></g>`
      : `<g class="nd-c her ${cls}" transform="translate(${x} ${y})"><circle r="${R}" fill="#FF8FB8" stroke="#2B2024" stroke-width="2.5"/><circle r="16" fill="none" stroke="#FFD0E1" stroke-width="2"/><g fill="#fff" stroke="#2B2024" stroke-width="1.4"><path d="M0 0 C-3 -8 -12 -8 -11 0 C-12 8 -3 8 0 0 Z"/><path d="M0 0 C3 -8 12 -8 11 0 C12 8 3 8 0 0 Z"/><circle r="3.2"/></g></g>`;
  const pipDots = {
    1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  const die = (n, x, y, used, red, cls = '') => `<g class="nd-die ${used ? 'used' : ''} ${cls}" transform="translate(${x} ${y})"><rect x="-22" y="-22" width="44" height="44" rx="9" fill="${red ? '#E3174D' : '#fff'}" stroke="#2B2024" stroke-width="2.5"/>${(pipDots[n] || []).map(([a, b]) => `<circle cx="${a * 11}" cy="${b * 11}" r="4.4" fill="${red ? '#fff' : '#2B2024'}"/>`).join('')}</g>`;

  function boardSVG(s, ui = {}) {
    const P = persp();
    let h = `<rect x="0" y="0" width="740" height="560" rx="18" fill="#E3174D"/><rect x="${BX}" y="${BY}" width="704" height="524" rx="6" fill="#FFF6EE"/>`;
    // Üçgenler ve numaralar
    for (let v = 0; v < 24; v++) {
      const c = colOf(v), x = colX(c), top = isTop(v);
      const fill = (c + (top ? 0 : 1)) % 2 ? '#CDB8FF' : '#FF8FB8';
      const y0 = top ? BY : 542, y1 = top ? BY + TH : 542 - TH;
      const idx = P === 'me' ? v : 23 - v;
      const tgt = ui.targets && ui.targets.has(idx);
      h += `<path d="M${x - PW / 2 + 2} ${y0} L${x} ${y1} L${x + PW / 2 - 2} ${y0} Z" fill="${fill}" opacity="${tgt ? 1 : 0.78}" ${tgt ? 'class="nd-tgt"' : ''}/>`;
      h += `<text x="${x}" y="${top ? 13 : 555}" text-anchor="middle" class="nd-num">${v + 1}</text>`;
    }
    h += `<rect x="${BX + 6 * PW}" y="${BY}" width="${BAR}" height="524" fill="#FFD0E1"/><path d="M${barX - 14} 280 C${barX - 30} 262 ${barX - 30} 298 ${barX - 14} 280 Z M${barX + 14} 280 C${barX + 30} 262 ${barX + 30} 298 ${barX + 14} 280 Z" fill="#E3174D" stroke="#2B2024" stroke-width="2"/><circle cx="${barX}" cy="280" r="7" fill="#E3174D" stroke="#2B2024" stroke-width="2"/>`;
    // Kenardaki toplama kutusu
    h += `<rect x="748" y="${BY}" width="52" height="524" rx="10" fill="#FFE7F0" stroke="#E3174D" stroke-width="3" ${ui.targets && ui.targets.has('off') ? 'class="nd-tgt-off"' : ''}/>`;
    ['me', 'her'].forEach((w) => {
      for (let k = 0; k < s.off[w]; k++) h += `<rect x="754" y="${offY(w, k) - 5}" width="40" height="10" rx="4" fill="${w === 'me' ? '#FFFDF8' : '#FF8FB8'}" stroke="#2B2024" stroke-width="1.6"/>`;
    });
    // Pullar
    for (let i = 0; i < 24; i++) {
      const w = s.p[i] > 0 ? 'me' : s.p[i] < 0 ? 'her' : null;
      if (!w) continue;
      const n = Math.abs(s.p[i]);
      const v = view(i);
      const src = ui.sources && ui.sources.has(i);
      for (let k = 0; k < n; k++) {
        const topOne = k === n - 1;
        h += checker(w, colX(colOf(v)), stackY(v, k, n), `${src && topOne ? 'src' : ''} ${ui.sel === i && topOne ? 'sel' : ''}`);
      }
      if (n > 5) h += `<text x="${colX(colOf(v))}" y="${stackY(v, n - 1, n) + 6}" text-anchor="middle" class="nd-cnt">${n}</text>`;
    }
    ['me', 'her'].forEach((w) => {
      for (let k = 0; k < s.bar[w]; k++) h += checker(w, barX, barY(w, k), ui.sources && ui.sources.has('bar') && w === side() && k === s.bar[w] - 1 ? `src ${ui.sel === 'bar' ? 'sel' : ''}` : '');
    });
    // Zarlar
    if (ui.dice) {
      const mineSide = ui.diceBy === P;
      const cx = mineSide ? BX + 6 * PW + BAR + 165 : BX + 165;
      const used = ui.used || [];
      const ds = ui.dice[0] === ui.dice[1] ? [ui.dice[0], ui.dice[0]] : ui.dice;
      h += die(ds[0], cx - 30, 280, used[0], ui.diceBy === 'her', ui.rolling ? 'roll' : '') + die(ds[1], cx + 30, 280, used[1], ui.diceBy === 'her', ui.rolling ? 'roll' : '');
      if (ui.dice[0] === ui.dice[1] && ui.left != null) h += `<text x="${cx}" y="330" text-anchor="middle" class="nd-left">${ui.left} hamle</text>`;
    }
    // Dokunma alanları
    for (let v = 0; v < 24; v++) {
      const c = colOf(v), x = colX(c), top = isTop(v);
      const idx = P === 'me' ? v : 23 - v;
      h += `<rect class="nd-hit" data-pt="${idx}" x="${x - PW / 2}" y="${top ? BY : 280}" width="${PW}" height="262" fill="transparent"/>`;
    }
    h += `<rect class="nd-hit" data-pt="bar" x="${BX + 6 * PW}" y="${BY}" width="${BAR}" height="524" fill="transparent"/><rect class="nd-hit" data-pt="off" x="746" y="${BY}" width="56" height="524" fill="transparent"/>`;
    return `<svg class="nd-board" viewBox="0 0 800 560" role="img" aria-label="Tavla tahtası">${h}<g id="ndFly"></g></svg>`;
  }

  /* ---------- Hamle animasyonu ---------- */
  function fly(s, m, w) {
    return new Promise((res) => {
      const svg = root && K.$('.nd-board', root);
      if (!svg || K.reduced || document.hidden) return res();
      const [x0, y0] = xyOf(s, m.from, w, true);
      const after = apply(s, Object.assign({}, m), w);
      const [x1, y1] = m.to === 'off' ? [774, offY(w, after.off[w] - 1)] : xyOf(after, m.to, w, true);
      // Kaynaktaki en üst pulu gizle
      const tops = K.$$('.nd-c', svg);
      const g = K.$('#ndFly', svg);
      g.innerHTML = checker(w, x0, y0, 'fly');
      const el = g.firstChild;
      let hide = null;
      tops.forEach((t) => {
        const tr = t.getAttribute('transform');
        if (tr === `translate(${x0} ${y0})`) hide = t;
      });
      if (hide) hide.style.opacity = '0';
      const t0 = performance.now(), dur = 380;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const lift = Math.sin(k * Math.PI) * 26;
        el.setAttribute('transform', `translate(${x0 + (x1 - x0) * e} ${y0 + (y1 - y0) * e - lift})`);
        if (k < 1) requestAnimationFrame(step);
        else res();
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Oynama ---------- */
  function beginTurn(s, dice) {
    turn = { base: clone(s), st: clone(s), dice: dice.slice(), left: expand(dice), moves: [], memo: {} };
    turn.legal = legal(turn.st, side(), turn.left, turn.memo, true);
    sel = turn.st.bar[side()] ? 'bar' : null;
  }
  function recompute() {
    turn.legal = legal(turn.st, side(), turn.left, turn.memo, turn.moves.length === 0);
    sel = turn.st.bar[side()] && turn.legal.length ? 'bar' : null;
  }
  async function doMove(m) {
    anim = true;
    await fly(turn.st, m, side());
    const mm = Object.assign({}, m);
    turn.st = apply(turn.st, mm, side());
    turn.moves.push(mm);
    turn.left.splice(turn.left.indexOf(m.d), 1);
    recompute();
    anim = false;
    K.audio.sfx.tap();
    if (mm.hit) {
      K.audio.sfx.pop();
      K.vibrate(20);
    }
    if (mode === 'duo') K.cloud.send('nd', { t: 'mv', gid: game.data.gid, n: game.data.n, mv: turn.moves, dice: turn.dice });
    render();
  }
  function undo() {
    if (!turn || !turn.moves.length || anim) return;
    const ms = turn.moves.slice(0, -1);
    turn.st = clone(turn.base);
    turn.left = expand(turn.dice);
    turn.moves = [];
    ms.forEach((m) => {
      const mm = Object.assign({}, m);
      turn.st = apply(turn.st, mm, side());
      turn.moves.push(mm);
      turn.left.splice(turn.left.indexOf(m.d), 1);
    });
    recompute();
    if (mode === 'duo') K.cloud.send('nd', { t: 'mv', gid: game.data.gid, n: game.data.n, mv: turn.moves, dice: turn.dice });
    render();
  }
  function rollDice() {
    if (!myTurn() || turn || anim) return;
    const s = cur();
    const d = roll();
    if (mode === 'duo') {
      K.store.set('nerdRoll', { gid: game.data.gid, n: game.data.n, dice: d });
      K.cloud.send('nd', { t: 'roll', gid: game.data.gid, n: game.data.n, dice: d });
    }
    beginTurn(s, d);
    K.audio.sfx.whoosh();
    render(true);
    announce(d);
  }
  function announce(d, who) {
    const c = K.$('#ndCall', root);
    if (!c) return;
    c.textContent = `${who ? nameOf(who) + ': ' : ''}${call(d)}!`;
    c.classList.remove('go');
    void c.offsetWidth;
    c.classList.add('go');
    if (d[0] === 6 && d[1] === 6 && !who) K.fx.confetti({ count: 50, shapes: ['star'] });
  }
  async function endTurn() {
    if (!turn || anim) return;
    if (turn.legal.length) return;
    const w = side();
    const next = finishState(turn.st, w);
    const moves = turn.moves.map((m) => ({ from: m.from, to: m.to, d: m.d }));
    const dice = turn.dice;
    if (mode === 'bot') {
      bot = { st: next, last: { by: w, mv: moves, dice } };
      K.store.set('nerdBot', bot);
      turn = null;
      sel = null;
      if (next.winner) return over(next);
      render();
      botT = setTimeout(botTurn, 700);
      return;
    }
    const gid = game.data.gid, n = game.data.n + 1;
    const btn = K.$('[data-nd-end]', root);
    if (btn) btn.disabled = true;
    const r = await K.cloud.add('nerd', { gid, n, st: next, mv: moves, dice });
    if (!r) {
      if (btn) btn.disabled = false;
      return K.fx.toast('Hamle gönderilemedi. İnterneti kontrol et.');
    }
    K.store.set('nerdRoll', null);
    turn = null;
    sel = null;
    if (next.winner) {
      await K.cloud.add('nerdwin', { gid, winner: w, pts: next.pts });
      if (!K.isOwner()) K.notify(`${C.herName} nərdde kazandı${next.pts === 2 ? ' (mars!)' : ''}`, 'Rövanş için kaleye gel.', ['game_die']);
    } else if (!K.isOwner() && !K.cloud.otherHere()) K.notify(`${C.herName} nərdde oynadı: ${call(dice)}`, 'Sıra sende.', ['game_die']);
    if (next.winner) over(next);
    else render();
  }
  async function botTurn() {
    if (mode !== 'bot' || !bot || bot.st.winner || bot.st.turn !== botSide() || !root) return;
    const w = botSide();
    const d = bot.st.dice || roll();
    render(false, { dice: d, diceBy: w, rolling: true });
    announce(d, 'bot');
    await K.wait(900);
    const plan = botPlan(bot.st, w, d);
    let s = bot.st;
    for (const m of plan) {
      if (mode !== 'bot' || K.activeRoom !== 'nerd') break;
      render(false, { st: s, dice: d, diceBy: w });
      await fly(s, m, w);
      s = apply(s, Object.assign({}, m), w);
      K.audio.sfx.tap();
    }
    s = plan.reduce((a, m) => apply(a, Object.assign({}, m), w), bot.st);
    const next = finishState(s, w);
    bot = { st: next, last: { by: w, mv: plan, dice: d } };
    K.store.set('nerdBot', bot);
    if (next.winner) return over(next);
    render();
  }
  function over(s) {
    const meWon = s.winner === side();
    if (mode === 'bot') {
      const st = K.store.get('nerdBotScore', { me: 0, bot: 0 });
      st[meWon ? 'me' : 'bot'] += s.pts;
      K.store.set('nerdBotScore', st);
    }
    if (meWon) {
      K.fx.confetti({ count: 140, shapes: ['heart', 'star'] });
      K.audio.sfx.success();
      K.stickers.award('nerd');
    }
    render();
  }
  async function newGame() {
    if (mode === 'bot') {
      clearTimeout(botT);
      const s = fresh();
      let a, b;
      do {
        a = 1 + Math.floor(Math.random() * 6);
        b = 1 + Math.floor(Math.random() * 6);
      } while (a === b);
      s.turn = a > b ? side() : botSide();
      s.dice = [a, b];
      bot = { st: s, last: null };
      K.store.set('nerdBot', bot);
      turn = null;
      render();
      K.fx.toast(`Açılış zarları: sen ${a}, Kitty ${b}. ${a > b ? 'Sen başlıyorsun.' : 'Kitty başlıyor.'}`, { icon: A.icon('dice') });
      if (s.turn === botSide()) botT = setTimeout(botTurn, 1400);
      return;
    }
    const s = fresh();
    let a, b;
    do {
      a = 1 + Math.floor(Math.random() * 6);
      b = 1 + Math.floor(Math.random() * 6);
    } while (a === b);
    s.turn = a > b ? 'me' : 'her';
    s.dice = [a, b];
    const gid = 'g' + Date.now().toString(36);
    const r = await K.cloud.add('nerd', { gid, n: 0, st: s, mv: [], dice: null, open: { me: a, her: b } });
    if (!r) return K.fx.toast('Oyun başlatılamadı.');
    K.fx.toast(`Açılış zarları: ${C.myPet} ${a}, ${C.herPet} ${b}. ${nameOf(s.turn)} başlıyor.`, { icon: A.icon('dice'), duration: 6000 });
    if (!K.isOwner()) K.notify(`${C.herName} yeni bir nərd oyunu açtı`, `${nameOf(s.turn)} başlıyor.`, ['game_die']);
  }
  async function resign() {
    if (mode === 'bot') {
      const s = clone(bot.st);
      s.winner = botSide();
      s.pts = 1;
      s.resigned = side();
      bot = { st: s, last: bot.last };
      K.store.set('nerdBot', bot);
      return over(s);
    }
    const s = clone(game.data.st);
    s.winner = opp(side());
    s.pts = 1;
    s.resigned = side();
    await K.cloud.add('nerd', { gid: game.data.gid, n: game.data.n + 1, st: s, mv: [], dice: null });
    await K.cloud.add('nerdwin', { gid: game.data.gid, winner: s.winner, pts: 1, resign: true });
    turn = null;
    render();
  }

  /* ---------- Arayüz ---------- */
  function score2() {
    const t = { me: 0, her: 0 }, g = { me: 0, her: 0 };
    wins.forEach((w) => {
      t[w.data.winner] += w.data.pts || 1;
      g[w.data.winner]++;
    });
    return { t, g };
  }
  function render(rolled, o = {}) {
    if (!root) return;
    const s0 = o.st || (turn ? turn.st : cur());
    const board = K.$('#ndBoard', root);
    const info = K.$('#ndInfo', root);
    const acts = K.$('#ndActs', root);
    K.$$('[data-nd-mode]', root).forEach((b) => b.setAttribute('aria-pressed', b.dataset.ndMode === mode));
    const sc = K.$('#ndScore', root);
    if (mode === 'duo') {
      const { t, g } = score2();
      sc.innerHTML = `<span class="me">${K.esc(C.myPet)} <b>${t.me}</b></span><span class="vs">${g.me + g.her} oyun</span><span class="her"><b>${t.her}</b> ${K.esc(C.herPet)}</span>`;
    } else {
      const b = K.store.get('nerdBotScore', { me: 0, bot: 0 });
      sc.innerHTML = `<span class="${side()}">Sen <b>${b.me}</b></span><span class="vs">alıştırma</span><span class="${botSide()}"><b>${b.bot}</b> Kitty</span>`;
    }
    if (!s0) {
      board.innerHTML = boardSVG(fresh());
      info.innerHTML = mode === 'duo' ? `<p>Henüz oyun yok. Açılış zarlarını kale atar; büyük gelen başlar.</p>` : '<p>Kitty hazır. Başlamak için yeni oyun aç.</p>';
      acts.innerHTML = `<button type="button" class="btn red" data-nd-new>${A.icon('dice')} Yeni oyun</button>`;
      return;
    }
    const w = side();
    const ui = {};
    if (turn) {
      ui.sources = new Set(turn.legal.map((m) => m.from));
      ui.sel = sel;
      if (sel != null) ui.targets = new Set(turn.legal.filter((m) => m.from === sel).map((m) => m.to));
      ui.dice = turn.dice;
      ui.diceBy = w;
      if (turn.dice[0] === turn.dice[1]) {
        ui.used = [turn.left.length < 3, turn.left.length < 1];
        ui.left = turn.left.length;
      } else ui.used = [!turn.left.includes(turn.dice[0]), !turn.left.includes(turn.dice[1])];
      ui.rolling = rolled;
    } else if (o.dice) Object.assign(ui, { dice: o.dice, diceBy: o.diceBy, rolling: o.rolling });
    else if (s0.dice && !s0.winner && s0.turn === w) Object.assign(ui, { dice: s0.dice, diceBy: w });
    else if (mode === 'duo' && live && game && live.n === game.data.n && live.dice) Object.assign(ui, { dice: live.dice, diceBy: opp(w) });
    else if (mode === 'duo' && game && game.data.dice && !s0.winner && s0.turn === w) Object.assign(ui, { dice: game.data.dice, diceBy: opp(w), used: [true, true] });
    else if (mode === 'bot' && bot && bot.last && bot.last.by !== w && !s0.winner) Object.assign(ui, { dice: bot.last.dice, diceBy: bot.last.by, used: [true, true] });
    const shown = mode === 'duo' && live && game && live.n === game.data.n && !turn ? live.st : s0;
    board.innerHTML = boardSVG(shown, ui);
    // Bilgi ve düğmeler
    const s = cur();
    const oName = mode === 'bot' ? 'Kitty' : nameOf(opp(w));
    let txt = '', btns = '';
    if (s.winner) {
      const won = s.winner === w;
      txt = `<p class="nd-win ${won ? 'me' : ''}"><b>${won ? 'Kazandın!' : `${K.esc(oName)} kazandı.`}</b> ${s.resigned ? (s.resigned === w ? 'Pes ettin.' : `${K.esc(oName)} pes etti.`) : s.pts === 2 ? 'Mars! İki sayı.' : 'Bir sayı.'}</p>`;
      btns = `<button type="button" class="btn red" data-nd-new>${A.icon('dice')} ${won ? 'Yeni oyun' : 'Rövanş'}</button>`;
    } else if (turn) {
      const noMove = !turn.legal.length;
      txt = `<p><b>${K.esc(call(turn.dice))}.</b> ${noMove ? (turn.moves.length ? 'Hamlen tamam.' : 'Oynayacak hamle yok, sıra geçer.') : turn.st.bar[w] ? 'Önce kırılan pulunu oyuna sok.' : sel == null ? 'Oynatacağın pula dokun.' : 'Nereye gideceğine dokun.'}</p>`;
      btns = `${turn.moves.length ? `<button type="button" class="btn ghost small" data-nd-undo>${A.ui('undo')} Geri al</button>` : ''}${noMove ? `<button type="button" class="btn red" data-nd-end>${turn.moves.length ? 'Hamleyi bitir' : 'Sırayı geçir'}</button>` : ''}`;
    } else if (s.turn === w) {
      const pre = s.dice;
      txt = pre ? `<p>Açılış zarı senin: <b>${K.esc(call(pre))}</b>.</p>` : `<p><b>Sıra sende.</b>${mode === 'duo' && game.data.mv && game.data.mv.length ? ` ${K.esc(oName)} ${K.esc(call(game.data.dice))} attı.` : ''}</p>`;
      btns = pre ? `<button type="button" class="btn red" data-nd-open>${A.icon('dice')} Oyna</button>` : `<button type="button" class="btn red" data-nd-roll>${A.icon('dice')} Zar at</button>`;
    } else {
      txt = mode === 'bot' ? '<p>Kitty düşünüyor...</p>' : `<p><b>Sıra ${K.esc(K.ek(oName, 'de'))}.</b> ${K.cloud.otherHere() ? 'Şu an kalede; hamlesini canlı göreceksin.' : 'Oynayınca burada görürsün; istersen kapatıp sonra gel.'}</p>`;
    }
    const pips = `<p class="nd-pip">Pip: sen ${pip(shown, w)} · ${K.esc(oName)} ${pip(shown, opp(w))}</p>`;
    info.innerHTML = txt + pips;
    acts.innerHTML = btns + (s.winner ? '' : `<button type="button" class="btn ghost small nd-resign" data-nd-resign>Pes et</button>`);
  }
  function tap(pt) {
    if (!turn || anim) return;
    const p = pt === 'bar' || pt === 'off' ? pt : Number(pt);
    const forced = turn.st.bar[side()] > 0;
    if (forced) sel = 'bar';
    if (sel != null) {
      const opts = turn.legal.filter((m) => m.from === sel && m.to === p).sort((a, b) => a.d - b.d);
      if (opts.length) return doMove(opts[0]);
    }
    if (forced) return render();
    if (turn.legal.some((m) => m.from === p)) {
      sel = sel === p ? null : p;
      // Tek gidilecek yer varsa doğrudan oyna
      const opts = sel == null ? [] : turn.legal.filter((m) => m.from === sel);
      const tos = new Set(opts.map((m) => m.to));
      if (tos.size === 1 && K.store.get('nerdQuick', true)) return doMove(opts.sort((a, b) => a.d - b.d)[0]);
      K.audio.sfx.tap();
    } else {
      // Doğrudan hedefe dokunduysa ve oraya tek bir pul gidebiliyorsa
      const to = turn.legal.filter((m) => m.to === p).sort((a, b) => a.d - b.d);
      if (to.length && new Set(to.map((m) => m.from)).size === 1) return doMove(to[0]);
      sel = null;
    }
    render();
  }

  /* ---------- Bulut ---------- */
  async function applyRow(r) {
    const prev = game;
    game = r;
    if (mode !== 'duo') return;
    const byOther = r.who !== mine();
    const liveShown = live && prev && live.n === prev.data.n && live.mv && r.data.mv && live.mv.length === r.data.mv.length;
    live = null;
    if (byOther && prev && prev.data.gid === r.data.gid && r.data.n === prev.data.n + 1 && r.data.mv && r.data.mv.length && K.activeRoom === 'nerd' && !liveShown) {
      let s = prev.data.st;
      const w = r.who;
      anim = true;
      render(false, { st: s, dice: r.data.dice, diceBy: w });
      for (const m of r.data.mv) {
        await fly(s, m, w);
        s = apply(s, Object.assign({}, m), w);
        render(false, { st: s, dice: r.data.dice, diceBy: w });
      }
      anim = false;
    }
    turn = null;
    sel = null;
    // Kaydedilmiş zar (sayfa yenilendiyse aynı zar)
    const saved = K.store.get('nerdRoll', null);
    if (saved && saved.gid === r.data.gid && saved.n === r.data.n && myTurn() && !r.data.st.dice) beginTurn(r.data.st, saved.dice);
    const s = r.data.st;
    if (s.winner && byOther && K.activeRoom === 'nerd') over(s);
    else render();
  }
  function onLive(m) {
    if (!m || m.who === mine() || mode !== 'duo' || !game || m.gid !== game.data.gid || m.n !== game.data.n) return;
    const w = m.who;
    if (m.t === 'roll') {
      live = { n: m.n, dice: m.dice, mv: [], st: game.data.st };
      if (K.activeRoom === 'nerd') {
        render();
        announce(m.dice, w);
      }
      return;
    }
    if (m.t === 'mv') {
      const before = live && live.n === m.n ? live.mv.length : 0;
      let s = game.data.st;
      m.mv.forEach((x) => (s = apply(s, Object.assign({}, x), w)));
      const prevSt = live && live.st;
      live = { n: m.n, dice: m.dice, mv: m.mv, st: s };
      if (K.activeRoom !== 'nerd') return;
      if (m.mv.length === before + 1 && prevSt) {
        anim = true;
        fly(prevSt, m.mv[m.mv.length - 1], w).then(() => {
          anim = false;
          render();
        });
      } else render();
    }
  }

  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!game || !game.data.st || game.data.st.winner || game.data.st.turn !== mine() || game.who === mine()) return [];
    if (Date.now() - game.at > 10 * 864e5) return [];
    const d = game.data.dice;
    return [{ icon: 'dice', title: 'Nərd: sıra sende', text: d ? `${nameOf(game.who)} ${call(d).toLocaleLowerCase('tr-TR')} attı ve oynadı. Zarlar seni bekliyor.` : `${nameOf(game.who)} yeni bir oyun açtı.`, room: 'nerd' }];
  });

  K.on('cloud', async (on) => {
    if (!on) return;
    const [r1, r2] = await Promise.all([K.cloud.list('nerd', 12), K.cloud.list('nerdwin', 1000)]);
    rows = r1;
    wins = r2;
    game = latest();
    K.cloud.onLive('nd', onLive);
    K.cloud.on('nerd', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (rows.length > 40) rows = rows.slice(-40);
      const l = latest();
      if (l && l.id === r.id) applyRow(r);
      if (r.who !== mine() && K.activeRoom !== 'nerd' && !r.data.st.winner && r.data.st.turn === mine()) K.fx.toast(`<b>Nərd:</b> ${K.esc(nameOf(r.who))} ${r.data.n === 0 ? 'yeni oyun açtı' : 'oynadı'}. <a href="#nerd">Sıra sende</a>`, { icon: A.icon('dice'), duration: 7000 });
      if (!K.activeRoom && K.renderSpecials) K.renderSpecials();
    });
    K.cloud.on('nerdwin', (r) => {
      if (wins.some((x) => x.id === r.id)) return;
      wins.push(r);
      if (K.activeRoom === 'nerd') render();
    });
    const saved = K.store.get('nerdRoll', null);
    if (game && saved && saved.gid === game.data.gid && saved.n === game.data.n && myTurn() && !game.data.st.dice) beginTurn(game.data.st, saved.dice);
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.on('presence', () => K.activeRoom === 'nerd' && !anim && render());
  K.nerd = { score: () => score2(), call, now: () => ({ turn, game, mode, bot }), rules: { fresh, singles, apply, legal, expand, finishState, botPlan, pip, cnt } };

  K.room({
    id: 'nerd',
    wing: 'oyun',
    title: 'Nərd',
    sub: 'Bakü\'de nərd, İstanbul\'da tavla',
    icon: 'dice',
    color: '#FFE3E3',
    hidden: () => !D.nerd,
    badge: () => (game && game.data.st && !game.data.st.winner && game.data.st.turn === mine() ? 'Sıra sende' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(ND().intro)}</div>
        <div class="nd-top"><div class="seg" role="group" aria-label="Rakip"><button type="button" data-nd-mode="duo">${K.esc(K.otherName())} ile</button><button type="button" data-nd-mode="bot">Kitty ile</button></div>
          <p class="nd-score" id="ndScore"></p></div>
        <div class="nd-wrap"><div id="ndBoard"></div><div class="nd-call" id="ndCall" aria-live="polite"></div></div>
        <div class="nd-info" id="ndInfo"></div>
        <div class="nd-acts" id="ndActs"></div>
        <details class="nd-rules"><summary>Nasıl oynanır?</summary>${K.paras(ND().rules || [])}</details>`;
      el.addEventListener('click', (e) => {
        const p = e.target.closest('[data-pt]');
        if (p) return tap(p.dataset.pt);
        const md = e.target.closest('[data-nd-mode]');
        if (md) {
          if (md.dataset.ndMode === 'duo' && !(K.cloud && K.cloud.enabled)) return K.fx.toast('İki kişilik oyun için bulut bağlı olmalı.');
          clearTimeout(botT);
          mode = md.dataset.ndMode;
          K.store.set('nerdMode', mode);
          turn = null;
          sel = null;
          anim = false;
          if (mode === 'duo') {
            const saved = K.store.get('nerdRoll', null);
            if (game && saved && saved.gid === game.data.gid && saved.n === game.data.n && myTurn() && !game.data.st.dice) beginTurn(game.data.st, saved.dice);
          } else if (bot && !bot.st.winner && bot.st.turn === botSide()) botT = setTimeout(botTurn, 600);
          return render();
        }
        if (e.target.closest('[data-nd-new]')) return newGame();
        if (e.target.closest('[data-nd-roll]')) return rollDice();
        if (e.target.closest('[data-nd-open]')) {
          const s = cur();
          beginTurn(s, s.dice);
          const n = clone(turn.st);
          n.dice = null;
          turn.base = clone(n);
          turn.st = n;
          return render();
        }
        if (e.target.closest('[data-nd-undo]')) return undo();
        if (e.target.closest('[data-nd-end]')) return endTurn();
        const rs = e.target.closest('[data-nd-resign]');
        if (rs) {
          if (rs.dataset.armed !== '1') {
            rs.dataset.armed = '1';
            rs.textContent = 'Emin misin? Bir daha dokun';
            return;
          }
          return resign();
        }
      });
    },
    enter() {
      if (mode === 'duo' && !(K.cloud && K.cloud.enabled)) mode = 'bot';
      render();
      if (mode === 'bot' && bot && !bot.st.winner && bot.st.turn === botSide()) botT = setTimeout(botTurn, 800);
    },
    leave() {
      clearTimeout(botT);
      if (mode === 'bot') turn = null;
      anim = false;
    },
  });
})();
