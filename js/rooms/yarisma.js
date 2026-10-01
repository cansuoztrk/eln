/* Oda: Bilgi Yarışması — iki ekranda aynı anda, Kitty'nin sunduğu canlı yarışma. Sorular hikâyemizden (kasada) ve
   kaleden (kaç gündür birlikteyiz, kedimizin adı...). Davet eden sunucu olur: soruları o seçer ve sırayı o yürütür;
   cevaplar canlı kanaldan gider. Her soruda 15 saniye; doğru cevap 500 + hız bonusu (en fazla 500). O kalede değilse
   Kitty ile antrenman. Kayıt: yarisma {gid, me, her, n} · Canlı: ys {t: davet|hazir|iptal|basla|soru|cevap|son|bye} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const YS = () => D.yarisma || { intro: [], questions: [], kitty: {} };
  const KT = () => YS().kitty || {};
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const Q_MS = 15000, REVEAL_MS = 4500, N = 8;
  let root = null, g = null, invite = null, incoming = null, accepted = null, hist = [], tick = 0;

  /* ---------- Soru havuzu ---------- */
  function pool() {
    const out = (YS().questions || []).map((x) => ({ q: x.q, o: x.o, a: x.a, n: x.n }));
    (D.quiz || []).forEach((x) => out.push({ q: x.q, o: x.options, a: x.answer, n: x.note }));
    return out;
  }
  function dynamic() {
    const out = [];
    const d = Math.max(1, T.daysSince(C.togetherDate));
    const opts = K.shuffle([d, d + 9, Math.max(1, d - 11), d + 30]);
    out.push({ q: 'Bugün birlikte kaçıncı günümüz?', o: opts.map((x) => K.num(x)), a: opts.indexOf(d), n: `${K.num(d)}. gün. Her biri sayılı.` });
    const m = Math.max(1, T.daysSince(C.metDate));
    const mo = K.shuffle([m, m + 15, Math.max(1, m - 20), m + 41]);
    out.push({ q: 'Tanışalı kaç gün oldu?', o: mo.map((x) => K.num(x)), a: mo.indexOf(m), n: `${K.num(m)} gün önce Nehir bizi gruba ekledi.` });
    if (K.kedi && K.kedi.adopted && K.kedi.adopted()) {
      const name = K.kedi.name();
      const others = K.shuffle(((D.kedi && D.kedi.names) || ['Fındık', 'Şeker', 'Lokum']).filter((x) => x !== name)).slice(0, 3);
      const ko = K.shuffle([name].concat(others));
      out.push({ q: 'Kalenin kapısında bulduğumuz kedinin adı?', o: ko, a: ko.indexOf(name), n: `${name}. Şu an bile ikimizi bekliyor.` });
    }
    return out;
  }
  function build() {
    const list = K.shuffle(pool()).slice(0, N - 1);
    const dy = K.pick(dynamic());
    list.splice(Math.floor(Math.random() * list.length), 0, dy);
    return list.slice(0, N);
  }
  const points = (q, ans) => (!ans || ans.c == null || ans.c < 0 ? 0 : q.a === -1 ? 800 : ans.c === q.a ? 500 + Math.round(500 * Math.max(0, 1 - ans.ms / Q_MS)) : 0);
  function score(w) {
    if (!g) return 0;
    let s = 0;
    // Puan yalnızca açıklanan sorulardan (cevabın doğru olup olmadığı önceden belli olmasın)
    g.qs.forEach((q, i) => (g.revealed[i] || g.over) && g.ans[w][i] && (s += points(q, g.ans[w][i])));
    return s;
  }

  /* ---------- Oyun akışı ---------- */
  function start(mode, gid, host, qs) {
    clearTimeout(tick);
    g = { mode, gid, host, qs: qs || build(), i: -1, ans: { me: {}, her: {} }, revealed: {}, shown: 0, over: false, line: K.pick(KT().start || ['Hoş geldiniz!']) };
    K.audio.sfx.chime();
    render();
    if (host) tick = setTimeout(() => next(), 3200);
  }
  function next() {
    if (!g) return;
    const i = g.i + 1;
    if (i >= g.qs.length) return finish();
    if (g.mode === 'duo' && g.host) K.cloud.send('ys', { t: 'soru', gid: g.gid, i });
    show(i);
  }
  function show(i) {
    if (!g || i <= g.i) return;
    g.i = i;
    g.shown = Date.now();
    g.line = i === 0 ? 'İlk soru geliyor!' : i === g.qs.length - 1 ? 'Ve son soru!' : `${i + 1}. soru!`;
    K.audio.sfx.tap();
    render();
    clearTimeout(tick);
    tick = setTimeout(() => maybeReveal(true), Q_MS + (g.mode === 'duo' ? 1200 : 0));
    timerLoop();
  }
  function answer(c) {
    if (!g || g.i < 0 || g.revealed[g.i] || g.ans[mine()][g.i]) return;
    const ms = Math.min(Q_MS, Date.now() - g.shown);
    if (ms >= Q_MS) return;
    g.ans[mine()][g.i] = { c, ms };
    if (g.mode === 'duo') K.cloud.send('ys', { t: 'cevap', gid: g.gid, i: g.i, c, ms });
    K.audio.sfx.pop();
    render();
    maybeReveal(false);
  }
  function maybeReveal(timeout) {
    if (!g || g.i < 0 || g.revealed[g.i]) return;
    const i = g.i;
    const both = g.mode === 'solo' ? Boolean(g.ans[mine()][i]) : Boolean(g.ans.me[i] && g.ans.her[i]);
    if (!both && !timeout) return;
    clearTimeout(tick);
    g.revealed[i] = true;
    const q = g.qs[i];
    const ok = (w) => points(q, g.ans[w][i]) > 0;
    if (g.mode === 'duo') g.line = ok('me') && ok('her') ? K.pick(KT().both || ['']) : !ok('me') && !ok('her') ? K.pick(KT().none || ['']) : `${nameOf(ok('me') ? 'me' : 'her')}: ${K.pick(KT().right || [''])}`;
    else g.line = ok(mine()) ? K.pick(KT().right || ['']) : K.pick(KT().wrong || ['']);
    K.audio.sfx[ok(mine()) ? 'success' : 'fail']();
    render();
    if (g.host) tick = setTimeout(next, REVEAL_MS);
  }
  async function finish() {
    if (!g || g.over) return;
    g.over = true;
    clearTimeout(tick);
    if (g.mode === 'duo' && g.host) K.cloud.send('ys', { t: 'son', gid: g.gid });
    const sm = score('me'), sh = score('her');
    g.line = K.pick(KT().end || ['Bitti!']);
    if (g.mode === 'duo') {
      const win = sm === sh ? null : sm > sh ? 'me' : 'her';
      if (win === mine() || !win) K.stickers.award('yarisma');
      if (win) K.fx.confetti({ count: 140, shapes: ['heart', 'spark'] });
      if (g.host) {
        const r = await K.cloud.add('yarisma', { gid: g.gid, me: sm, her: sh, n: g.qs.length });
        r && !hist.some((x) => x.id === r.id) && hist.push(r);
      }
    } else {
      const best = K.store.get('ysBest', 0);
      if (score(mine()) > best) K.store.set('ysBest', score(mine()));
      K.fx.confetti({ count: 60 });
    }
    K.audio.sfx.success();
    render();
  }
  function timerLoop() {
    if (!g || !root) return;
    const bar = K.$('.ys-timer i', root);
    if (bar && g.i >= 0 && !g.revealed[g.i]) {
      const left = Math.max(0, 1 - (Date.now() - g.shown) / Q_MS);
      bar.style.transform = `scaleX(${left})`;
      const s = K.$('.ys-sec', root);
      s && (s.textContent = Math.ceil(left * 15));
      requestAnimationFrame(timerLoop);
    }
  }

  /* ---------- Görünüm ---------- */
  function render() {
    if (!root || K.activeRoom !== 'yarisma') return;
    bar();
    const st = K.$('#ysStage', root);
    if (!g) {
      st.innerHTML = `<div class="ys-host"><div class="ys-kitty">${A.kitty({ crown: true, eyes: 'happy' })}</div><p class="ys-bub">${K.esc(KT().start ? KT().start[0] : 'Hoş geldiniz!')}</p></div>
        <p class="muted center">${pool().length + 1} soruluk havuzdan her yarışmada sekiz soru.</p>`;
      return hists();
    }
    const duo = g.mode === 'duo';
    const who = duo ? ['me', 'her'] : [mine()];
    const board = `<div class="ys-board">${who.map((w) => `<div class="ys-p ${w}">${K.avatar(w, 'ys-av')}<span><small>${K.esc(nameOf(w))}</small><b class="tnum">${K.num(score(w))}</b></span>${g.over && duo && score(w) > score(w === 'me' ? 'her' : 'me') ? '<i class="ys-crown">👑</i>' : ''}</div>`).join('')}</div>`;
    const host = `<div class="ys-host"><div class="ys-kitty">${A.kitty({ crown: true, eyes: g.over ? 'heart' : 'happy' })}</div><p class="ys-bub">${K.esc(g.line || '')}</p></div>`;
    if (g.over) {
      const sm = score('me'), sh = score('her');
      const res = duo ? (sm === sh ? KT().tie || 'Berabere!' : `Kazanan: ${nameOf(sm > sh ? 'me' : 'her')} 👑`) : `Puanın: ${K.num(score(mine()))} · En iyin: ${K.num(K.store.get('ysBest', 0))}`;
      st.innerHTML = `${host}${board}<div class="ys-end"><h2>${K.esc(res)}</h2><p class="muted">${g.qs.filter((q, i) => points(q, g.ans[mine()][i]) > 0).length} / ${g.qs.length} doğru</p>
        <div class="row center"><button type="button" class="btn red" data-ys-again>${duo ? 'Bir daha (davet)' : 'Bir daha'}</button><button type="button" class="btn ghost" data-ys-close>Bitir</button></div></div>`;
      return hists();
    }
    if (g.i < 0) {
      st.innerHTML = `${host}${board}<p class="ys-get">Hazır olun...</p>`;
      return;
    }
    const q = g.qs[g.i];
    const rv = g.revealed[g.i];
    const my = g.ans[mine()][g.i], ot = duo ? g.ans[other()][g.i] : null;
    st.innerHTML = `${host}${board}<div class="ys-q ${rv ? 'rv' : ''}"><div class="ys-qh"><span class="tnum">${g.i + 1} / ${g.qs.length}</span><span class="ys-sec tnum">${rv ? '' : 15}</span></div>
      <div class="ys-timer"><i></i></div><h2>${K.esc(q.q)}</h2>
      <div class="ys-opts">${q.o.map((o, k) => {
        const right = rv && (q.a === k || q.a === -1);
        const wrong = rv && my && my.c === k && q.a !== k && q.a !== -1;
        const marks = rv ? [my && my.c === k ? mine() : null, ot && ot.c === k ? other() : null].filter(Boolean) : my && my.c === k ? [mine()] : [];
        return `<button type="button" class="ys-o o${k} ${right ? 'right' : ''} ${wrong ? 'wrong' : ''} ${my && my.c === k ? 'picked' : ''}" data-ys-c="${k}" ${my || rv ? 'disabled' : ''}><b>${'ABCD'[k]}</b><span>${K.esc(o)}</span>${marks.map((w) => `<i class="ys-mark">${K.avatar(w, 'ys-mk')}</i>`).join('')}</button>`;
      }).join('')}</div>
      ${rv ? `<p class="ys-note">${K.esc(q.n || '')}${my && points(q, my) ? ` <b class="ys-plus">+${points(q, my)}</b>` : ''}</p>` : duo ? `<p class="ys-wait muted small">${my ? (ot ? '' : `${K.esc(nameOf(other()))} düşünüyor...`) : ot ? `${K.esc(nameOf(other()))} cevapladı!` : ''}</p>` : ''}</div>`;
    timerLoop();
  }
  function bar() {
    const b = K.$('#ysBar', root);
    const here = K.cloud && K.cloud.enabled && K.cloud.otherHere();
    const inRoom = here && K.yan && K.yan.where && K.yan.where().room === 'yarisma';
    let html = '';
    if (g && g.mode === 'duo' && !g.over) html = `<span class="dot on"></span> ${K.esc(nameOf(other()))} ile canlı yarışma`;
    else if (incoming) html = `<span>🎤 <b>${K.esc(nameOf(other()))} seni yarışmaya çağırıyor!</b></span><button type="button" class="btn red small" data-ys-accept>Kabul et</button>`;
    else if (invite) html = `<span>Davet gönderildi; ${K.esc(nameOf(other()))} bekleniyor...</span><button type="button" class="btn ghost small" data-ys-cancel>İptal</button>`;
    else html = `<span>${inRoom ? `<span class="dot on"></span> ${K.esc(nameOf(other()))} da burada` : here ? `${K.esc(nameOf(other()))} kalede` : `${K.esc(nameOf(other()))} şu an kalede değil`}</span>
      <div class="row">${K.cloud && K.cloud.enabled ? `<button type="button" class="btn red small" data-ys-invite>🎤 Yarışmaya davet et</button>` : ''}<button type="button" class="btn soft small" data-ys-solo>Kitty ile antrenman</button></div>`;
    b.innerHTML = html;
  }
  function hists() {
    const box = K.$('#ysHist', root);
    const list = hist.slice().sort((a, b) => b.at - a.at);
    if (!list.length) return (box.hidden = true);
    box.hidden = false;
    const wins = { me: 0, her: 0 };
    list.forEach((r) => (r.data.me > r.data.her ? wins.me++ : r.data.her > r.data.me ? wins.her++ : 0));
    box.innerHTML = `<p class="card-eyebrow">Yarışma geçmişi</p><div class="ys-wins"><span>${K.esc(C.herPet)} <b>${wins.her}</b></span><i>👑</i><span><b>${wins.me}</b> ${K.esc(C.myPet)}</span></div>
      <ul class="ys-hl">${list.slice(0, 6).map((r) => `<li><span>${K.esc(T.fmtShort(new Date(r.at)))}</span><b class="tnum">${K.num(r.data.her)} – ${K.num(r.data.me)}</b><small>${r.data.me === r.data.her ? 'Berabere' : `${K.esc(nameOf(r.data.me > r.data.her ? 'me' : 'her'))} kazandı`}</small></li>`).join('')}</ul>`;
  }

  /* ---------- Canlı kanal ---------- */
  function onLive(m) {
    if (!m || m.who === mine()) return;
    if (m.t === 'davet') {
      incoming = { gid: m.gid, at: Date.now() };
      if (K.activeRoom !== 'yarisma') K.fx.toast(`🎤 <b>${K.esc(nameOf(m.who))} seni bilgi yarışmasına çağırıyor!</b> <a href="#yarisma">Stüdyoya geç</a>`, { duration: 12000 });
      else K.audio.sfx.chime();
      return render();
    }
    if (m.t === 'iptal' && incoming && incoming.gid === m.gid) return (incoming = null), render();
    if (m.t === 'hazir' && invite && invite.gid === m.gid) {
      invite = null;
      start('duo', m.gid, true);
      K.cloud.send('ys', { t: 'basla', gid: m.gid, qs: g.qs });
      return;
    }
    if (!g || g.gid !== m.gid) {
      if (m.t === 'basla' && incoming === null && K.activeRoom === 'yarisma' && accepted === m.gid) start('duo', m.gid, false, m.qs);
      return;
    }
    if (m.t === 'soru') return show(m.i);
    if (m.t === 'cevap') {
      g.ans[m.who][m.i] = { c: m.c, ms: m.ms };
      if (m.i === g.i) maybeReveal(false);
      return render();
    }
    if (m.t === 'son') return finish();
    if (m.t === 'bye' && !g.over) {
      K.fx.toast(`${K.esc(nameOf(m.who))} stüdyodan çıktı.`);
      g.over = true;
      clearTimeout(tick);
      render();
    }
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    K.cloud.onLive('ys', onLive);
    hist = await K.cloud.list('yarisma', 200);
    K.cloud.on('yarisma', (r) => hist.some((x) => x.id === r.id) || (hist.push(r), hists && root && hists()));
  });
  K.on('presence', () => K.activeRoom === 'yarisma' && bar());
  K.yarisma = { wins: () => { const w = { me: 0, her: 0 }; hist.forEach((r) => (r.data.me > r.data.her ? w.me++ : r.data.her > r.data.me ? w.her++ : 0)); return w; }, games: () => hist.length, now: () => g };

  K.room({
    id: 'yarisma',
    wing: 'oyun',
    title: 'Bilgi Yarışması',
    sub: 'Kitty sunuyor: ikimizin yarışması',
    icon: 'question',
    color: '#FFE9B8',
    hidden: () => !D.yarisma,
    badge: () => (incoming && Date.now() - incoming.at < 90000 ? 'Davet var' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(YS().intro || [])}</div>
        <div class="card pp-bar ys-bar" id="ysBar"></div>
        <section class="ys-stage" id="ysStage"></section>
        <section class="card ys-hist" id="ysHist" hidden></section>`;
      el.addEventListener('click', (e) => {
        const c = e.target.closest('[data-ys-c]');
        if (c) return answer(+c.dataset.ysC);
        if (e.target.closest('[data-ys-solo]')) return start('solo', 's' + Date.now(), true);
        if (e.target.closest('[data-ys-invite]') || (e.target.closest('[data-ys-again]') && g && g.mode === 'duo')) {
          invite = { gid: 'y' + Date.now().toString(36) };
          g = null;
          K.cloud.send('ys', { t: 'davet', gid: invite.gid });
          K.ping(`🎤 ${K.meName()} seni bilgi yarışmasına çağırıyor`, 'Kitty sunuyor. Stüdyoya gel!', ['microphone'], { click: K.roomUrl('yarisma') });
          return render();
        }
        if (e.target.closest('[data-ys-again]')) return start('solo', 's' + Date.now(), true);
        if (e.target.closest('[data-ys-cancel]')) {
          invite && K.cloud.send('ys', { t: 'iptal', gid: invite.gid });
          invite = null;
          return render();
        }
        if (e.target.closest('[data-ys-accept]') && incoming) {
          accepted = incoming.gid;
          K.cloud.send('ys', { t: 'hazir', gid: incoming.gid });
          incoming = null;
          g = null;
          return render();
        }
        if (e.target.closest('[data-ys-close]')) return (g = null), render();
      });
    },
    enter() {
      render();
    },
    leave() {
      if (g && g.mode === 'duo' && !g.over) K.cloud.send('ys', { t: 'bye', gid: g.gid });
      if (invite) K.cloud.send('ys', { t: 'iptal', gid: invite.gid });
      invite = null;
      clearTimeout(tick);
      if (g && g.mode === 'solo') g = null;
      else if (g && g.mode === 'duo') g = null;
    },
  });
})();
