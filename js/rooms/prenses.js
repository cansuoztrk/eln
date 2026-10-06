/* Oda: Prenses ve User155 — haftalık etkileşimli hikâye, sezon sezon. Her bölümde Prenses ve User155 kendi iki
   seçeneğinden birini seçer; öbürünün seçimi gizli kalır, ikisi de seçince sonuç (dört ihtimalden biri) açılır.
   Bir bölüm bitince bir sonraki bölüm takip eden pazartesi (Bakü) açılır.
   Sezon 2 (romantik komedi) ile gelenler:
   - Ortak Çanta: sonuçlardan eşyalar çıkar; biri bir eşyayı kullanınca ikisinin çantasından da eksilir.
   - Gardırop: her bölümün başında Prenses'in ve User155'in kıyafeti seçilir; bazı kıyafetler sonuçlarla açılır.
   - Sezon Haritası: Boğaz'dan Hazar'a bir masa oyunu yolu; seçimler iz bırakır. Sezon bitince yeniden oynanabilir.
   - Fragman: sezonun başında yirmi saniyelik çizimli bir fragman.
   - Senin Bölümün: biriniz üç sahnelik bir yan bölüm yazar, öbürü oynar; yazan, hangi kapının seçildiğini canlı görür.
   Kayıtlar: prenses {ch, c, s?, run?}, prtekrar {s, run}, prcanta {s, run, item}, prgiyim {s, run, ch, k},
   yanbolum {bid, title, scenes:[{t, a, b, ra, rb}]}, yanoyna {bid, sc, c} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const ROLE = { her: 'Prenses', me: 'User155' };
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  // Sezonlar: 1 = D.prenses, 2 = D.prenses2
  const SEZ = () => [D.prenses, D.prenses2].map((x, i) => x && Object.assign({ s: i + 1 }, x)).filter((x) => x && (x.chapters || []).length);
  const S = (s) => SEZ().find((x) => x.s === s) || { s, chapters: [], intro: [] };
  let rows = [], loaded = false, root = null, view = null, sez = 0, side = [], plays = [];
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const sOf = (r) => r.data.s || 1;
  const runOf = (r) => r.data.run || 0;
  const run = (s) => Math.max(0, ...rows.filter((r) => r.kind === 'prtekrar' && r.data.s === s).map((r) => r.data.run));
  const choice = (s, ch, w, rn = run(s)) => rows.filter((r) => r.kind === 'prenses' && sOf(r) === s && runOf(r) === rn && r.data.ch === ch && r.who === w).sort((a, b) => a.at - b.at)[0] || null;
  const both = (s, ch, rn) => choice(s, ch, 'her', rn) && choice(s, ch, 'me', rn);
  const seasonDone = (s) => (S(s).chapters || []).length > 0 && S(s).chapters.every((_, i) => both(s, i));
  function nextMonday(at) {
    const p = T.baku(new Date(at));
    const d = new Date(Date.UTC(p.y, p.mo - 1, p.d));
    d.setUTCDate(d.getUTCDate() + (((8 - d.getUTCDay()) % 7) || 7));
    return T.at(d.toISOString().slice(0, 10)).getTime();
  }
  function opensAt(s, ch) {
    if (s > 1 && !seasonDone(s - 1) && run(s - 1) === 0) return Infinity;
    if (ch === 0) return 0;
    if (!both(s, ch - 1)) return Infinity;
    // Yeniden oynanan sezonda bölümler beklemeden açılır
    if (run(s) > 0) return 0;
    return nextMonday(Math.max(choice(s, ch - 1, 'her').at, choice(s, ch - 1, 'me').at));
  }
  function current(s) {
    const n = (S(s).chapters || []).length;
    for (let i = 0; i < n; i++) if (!both(s, i)) return opensAt(s, i) <= T.now().getTime() ? { i, open: true } : { i, open: false, at: opensAt(s, i) };
    return { i: n, done: true };
  }
  const outIdx = (s, ch) => choice(s, ch, 'her').data.c * 2 + choice(s, ch, 'me').data.c;
  const outcome = (s, ch) => S(s).chapters[ch].out[outIdx(s, ch)];
  const avail = () => SEZ().filter((x) => x.s === 1 || seasonDone(x.s - 1) || run(x.s - 1) > 0);
  const curS = () => sez || (avail().slice(-1)[0] || { s: 1 }).s;
  // Sezon 1'in eski 'görüldü' kaydıyla uyumlu
  const seenKey = (s, last) => (s === 1 && !run(s) ? last : `${s}-${run(s)}-${last}`);

  /* ---------- Ortak Çanta ---------- */
  function bag(s) {
    const ch = S(s).chapters || [];
    const got = [];
    ch.forEach((c, i) => {
      if (!both(s, i) || !c.items) return;
      const it = c.items[outIdx(s, i)];
      it && got.push({ id: `${i}-${outIdx(s, i)}`, name: it[0], use: it[1] || '' });
    });
    const used = rows.filter((r) => r.kind === 'prcanta' && r.data.s === s && runOf(r) === run(s)).map((r) => r.data.item);
    return got.map((x) => Object.assign(x, { used: used.includes(x.id) }));
  }
  async function useItem(s, id) {
    const it = bag(s).find((x) => x.id === id);
    if (!it || it.used) return;
    const r = await K.cloud.add('prcanta', { s, run: run(s), item: id });
    push(r);
    K.audio.sfx.sparkle();
    K.ui.modal({ label: it.name, cls: 'pr-esya', html: `<p class="card-eyebrow">Ortak çantadan kullanıldı</p><h2>${K.esc(it.name)}</h2><p class="hand">${K.esc(K.fill(it.use || 'İşe yaradı!'))}</p><p class="muted small">Artık ikinizin çantasında da yok.</p>` });
    K.ping(`🎒 ${ROLE[mine()]} çantadan bir eşya kullandı`, `${it.name}: ${it.use || ''}`.slice(0, 140), ['school_satchel'], { click: K.roomUrl('prenses') });
    render();
  }
  /* ---------- Gardırop ---------- */
  const DOLAP = () => S(curS()).dolap || null;
  const giyim = (s, ch, w) => rows.filter((r) => r.kind === 'prgiyim' && r.data.s === s && runOf(r) === run(s) && r.data.ch <= ch && r.who === w).sort((a, b) => a.data.ch - b.data.ch || a.at - b.at).pop() || null;
  function figure(w, k, s) {
    const d = (S(s).dolap || {})[w] || [];
    const o = d[k] || d[0];
    if (!o) return '';
    const [name, renk, ek] = o;
    return `<span class="pr-fig ${w}" title="${K.esc(name)}"><svg viewBox="0 0 40 56" aria-hidden="true"><circle cx="20" cy="12" r="8" fill="#ffe1cf" stroke="#4a2138" stroke-width="1.5"/>${w === 'her' ? `<path d="M12 6 q8 -7 16 0" fill="none" stroke="#4a2138" stroke-width="2"/><path d="M26 4 l6 -3 v6 z M26 4 l-2 -5" fill="#e3174d"/>` : '<path d="M11 10 q9 -12 18 0 v-3 q-9 -8 -18 0 z" fill="#2b2024"/>'}<path d="M${w === 'her' ? '8 54 L14 22 H26 L32 54 Z' : '11 54 V24 H29 V54 Z'}" fill="${renk}" stroke="#4a2138" stroke-width="1.5"/>${ek ? `<text x="20" y="44" text-anchor="middle" font-size="10">${ek}</text>` : ''}</svg><small>${K.esc(name)}</small></span>`;
  }
  /* ---------- Sezon Haritası ---------- */
  function map(s) {
    const ch = S(s).chapters || [];
    const n = ch.length;
    const cur = current(s);
    const pts = ch.map((c, i) => [40 + (i * 520) / Math.max(1, n), 64 + (i % 2 ? -26 : 26)]);
    pts.push([580, 64]);
    const d = pts.map((p, i) => (i ? `L${p[0]} ${p[1]}` : `M${p[0]} ${p[1]}`)).join(' ');
    return `<svg class="pr-harita" viewBox="0 0 620 128" role="img" aria-label="Sezon haritası"><path d="M0 110 Q60 96 120 110 T240 110 T360 110 T480 110 T620 110 V128 H0 Z" fill="#bfe6ff"/><text x="12" y="122" class="pr-h-s">Boğaz</text><text x="606" y="122" text-anchor="end" class="pr-h-s">Hazar</text>
      <path d="${d}" class="pr-h-yol"/>
      ${pts.map((p, i) => {
        const done = i < n && both(s, i);
        const here = i === cur.i && !cur.done;
        const mark = done ? `${choice(s, i, 'her').data.c ? 'B' : 'A'}${choice(s, i, 'me').data.c ? 'B' : 'A'}` : i === n ? '👑' : i + 1;
        return `<g class="pr-h-dur ${done ? 'done' : ''} ${here ? 'here' : ''}" transform="translate(${p[0]} ${p[1]})"><circle r="15"/><text y="4" text-anchor="middle">${mark}</text>${here ? '<text y="-22" text-anchor="middle" class="pr-h-pul">🎀</text>' : ''}</g>`;
      }).join('')}</svg>`;
  }
  /* ---------- Sayfa ---------- */
  function chapterHtml(s, i, live) {
    const c = S(s).chapters[i];
    const done = both(s, i);
    const sideHtml = (w) => {
      const my = choice(s, i, w);
      const opts = c[w] || [];
      if (w === mine() && !my && live) return `<div class="pr-ch my"><p class="card-eyebrow">${K.esc(ROLE[w])} ne yapsın?</p>${opts.map((o, k) => `<button type="button" class="pr-opt" data-pr-c="${k}" data-ch="${i}">${k ? '🅑' : '🅐'} ${K.esc(o)}</button>`).join('')}</div>`;
      if (my && (done || w === mine())) return `<div class="pr-ch ${w}"><p class="card-eyebrow">${K.esc(ROLE[w])} seçti</p><p class="pr-picked">${my.data.c ? '🅑' : '🅐'} ${K.esc(opts[my.data.c])}</p></div>`;
      return `<div class="pr-ch ${w} wait"><p class="card-eyebrow">${K.esc(ROLE[w])}</p><p class="muted">${my ? '✓ Seçimini yaptı · gizli' : '⏳ Henüz seçmedi'}</p></div>`;
    };
    const dolap = S(s).dolap;
    const fig = dolap ? `<div class="pr-figs">${['her', 'me'].map((w) => {
      const g = giyim(s, i, w);
      return figure(w, g ? g.data.k : 0, s);
    }).join('<span class="pr-kalp" aria-hidden="true">💗</span>')}${live && !done ? `<button type="button" class="btn soft small" data-pr-dolap="${i}">👗 Gardırop</button>` : ''}</div>` : '';
    return `<article class="pr-page ${done ? 'done' : ''}"><p class="pr-no">Bölüm ${i + 1}</p><h3 class="pr-title">${K.esc(c.title)}</h3>${fig}
      <div class="pr-text">${c.text.map((p) => `<p>${K.esc(K.fill(p))}</p>`).join('')}</div>
      <div class="pr-choices">${sideHtml('her')}${sideHtml('me')}</div>
      ${done ? `<div class="pr-out"><span aria-hidden="true">✨</span><p>${K.esc(K.fill(outcome(s, i)))}</p>${c.items && c.items[outIdx(s, i)] ? `<p class="pr-kazanc">🎒 Çantaya girdi: <b>${K.esc(c.items[outIdx(s, i)][0])}</b></p>` : ''}</div>` : ''}</article>`;
  }
  function ending(s) {
    const se = S(s);
    if (se.endings) {
      const a = se.chapters.reduce((n, _, i) => n + (choice(s, i, 'her').data.c === 0) + (choice(s, i, 'me').data.c === 0), 0);
      const key = a >= 6 ? 'fiyonk' : a >= 3 ? 'gozyasi' : 'kahkaha';
      return se.endings[key] || se.end || '';
    }
    return se.end || '';
  }
  function render() {
    if (!root || K.activeRoom !== 'prenses') return;
    const s = curS();
    const se = S(s);
    const cur = current(s);
    const n = (se.chapters || []).length;
    const show = view != null ? view : cur.done ? n - 1 : cur.open ? cur.i : Math.max(0, cur.i - 1);
    const lock = !cur.done && !cur.open ? `<div class="pr-lock"><span aria-hidden="true">🔒</span><p><b>Bölüm ${cur.i + 1}</b> ${isFinite(cur.at) ? `${K.esc(T.fmt(new Date(cur.at), true))} sabahı açılacak.` : 'önceki sezon bitince açılacak.'}</p><p class="muted small">O zamana kadar bu sonucu birlikte konuşun.</p></div>` : '';
    const tabs = avail().length > 1 ? `<div class="pr-sezonlar">${avail().map((x) => `<button type="button" data-pr-s="${x.s}" class="${x.s === s ? 'on' : ''}">Sezon ${x.s}${seasonDone(x.s) ? ' ✓' : ''}</button>`).join('')}</div>` : '';
    const b = bag(s);
    K.$('#prBook', root).innerHTML = `${tabs}<header class="pr-cover"><span class="pr-bow" aria-hidden="true">${A.bow('#E3174D')}</span><p>${K.esc(se.season || '')}${run(s) ? ` · ${run(s) + 1}. oynayış` : ''}</p>
        <div class="pr-steps">${se.chapters.map((c, k) => `<button type="button" class="${k === show ? 'on' : ''} ${both(s, k) ? 'done' : ''}" data-pr-v="${k}" ${k > cur.i || (k === cur.i && !cur.open && !both(s, k)) ? 'disabled' : ''} aria-label="Bölüm ${k + 1}">${both(s, k) ? '✓' : k + 1}</button>`).join('')}</div>${se.trailer ? '<button type="button" class="btn ghost small pr-fragman-btn" data-pr-fragman>🎬 Fragman</button>' : ''}</header>
      ${s > 1 ? map(s) : ''}
      ${n ? chapterHtml(s, show, show === cur.i && cur.open) : ''}${lock}
      ${cur.done && show === n - 1 ? `<p class="pr-end hand">👑 ${K.esc(K.fill(ending(s)))}</p>${s > 1 ? '<div class="row center"><button type="button" class="btn soft small" data-pr-tekrar>🔁 Sezonu yeniden oyna (başka bir yol)</button></div>' : ''}` : ''}
      ${b.length ? `<section class="pr-canta"><p class="card-eyebrow">🎒 Ortak çanta</p><div>${b.map((x) => `<button type="button" class="pr-esya-b ${x.used ? 'used' : ''}" data-pr-esya="${x.id}" ${x.used ? 'disabled' : ''}>${K.esc(x.name)}${x.used ? '<small>kullanıldı</small>' : '<small>kullan</small>'}</button>`).join('')}</div></section>` : ''}`;
    renderSide();
  }
  function dolapSheet(ch) {
    const s = curS();
    const d = ((S(s).dolap || {})[mine()]) || [];
    const unlocked = (k) => !d[k][3] || bag(s).some((x) => x.name === d[k][3]) || S(s).chapters.some((c, i) => both(s, i) && (c.items || [])[outIdx(s, i)] && c.items[outIdx(s, i)][0] === d[k][3]);
    const m = K.ui.modal({ label: 'Gardırop', cls: 'pr-dolap', html: `<p class="card-eyebrow">${K.esc(ROLE[mine()])} bu bölümde ne giysin?</p><div class="pr-dolap-g">${d.map((o, k) => `<button type="button" data-pr-giy="${k}" ${unlocked(k) ? '' : 'disabled'}>${figure(mine(), k, s)}${unlocked(k) ? '' : `<small>🔒 ${K.esc(o[3])} ile açılır</small>`}</button>`).join('')}</div>` });
    m.body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-pr-giy]');
      if (!b) return;
      push(await K.cloud.add('prgiyim', { s, run: run(s), ch, k: +b.dataset.prGiy }));
      K.audio.sfx.pop();
      m.close();
      render();
    });
  }
  /* ---------- Fragman ---------- */
  function trailer(s) {
    const tr = S(s).trailer;
    if (!tr || !tr.length) return;
    K.store.set('prFragman' + s, 1);
    const ov = K.el(`<div class="pr-fragman" role="dialog" aria-modal="true" aria-label="Fragman"><button type="button" class="icon-btn pr-fr-x" aria-label="Kapat">${A.ui('close')}</button>${tr.map(([e, t], i) => `<div class="pr-fr-kart" style="--i:${i}"><span class="pr-fr-e">${e}</span><p>${K.esc(K.fill(t))}</p></div>`).join('')}<div class="pr-fr-son" style="--i:${tr.length}"><b>${K.esc(S(s).season || '')}</b><small>Pazar günü kalede</small></div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    // Küçük, hoplayan bir romantik komedi müziği
    try {
      K.audio.ensure && K.audio.ensure();
      const c = K.audio.ctx;
      if (c && (!K.atolye || K.atolye.get().ses !== false)) {
        const notes = [523, 659, 784, 659, 698, 880, 784, 0, 587, 698, 880, 698, 784, 988, 1047, 0];
        notes.forEach((f, i) => {
          if (!f) return;
          const t = c.currentTime + 0.2 + i * 0.32 + Math.floor(i / 8) * 0.6;
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          o.connect(g).connect(c.destination);
          o.start(t);
          o.stop(t + 0.3);
        });
      }
    } catch (e) {}
    const close = () => (ov.classList.remove('in'), setTimeout(() => ov.remove(), 400));
    K.$('.pr-fr-x', ov).addEventListener('click', close);
    setTimeout(close, (tr.length + 1) * 3600 + 1200);
  }
  /* ---------- Senin Bölümün (yan bölümler) ---------- */
  const playsOf = (bid) => plays.filter((p) => p.data.bid === bid).sort((a, b) => a.data.sc - b.data.sc);
  function renderSide() {
    const box = K.$('#prYan', root);
    if (!box) return;
    const forMe = side.filter((b) => b.who === other());
    const mineB = side.filter((b) => b.who === mine());
    box.innerHTML = `<p class="card-eyebrow">✍️ Senin Bölümün</p><p class="muted small">Biriniz üç sahnelik bir yan bölüm yazar; öbürü oynar. Yazan, hangi kapının seçildiğini canlı görür.</p>
      ${forMe.map((b) => `<button type="button" class="pr-yb" data-pr-oyna="${b.data.bid}"><b>${K.esc(b.data.title)}</b><small>${K.esc(nameOf(b.who))} yazdı · ${playsOf(b.data.bid).length >= 3 ? 'oynandı ✓' : `${playsOf(b.data.bid).length}/3 sahne`}</small></button>`).join('')}
      ${mineB.map((b) => `<div class="pr-yb benim"><b>${K.esc(b.data.title)}</b><small>Senin yazdığın · ${playsOf(b.data.bid).map((p) => `${p.data.sc + 1}. sahne: ${p.data.c ? '🅑' : '🅐'}`).join(' · ') || 'henüz oynanmadı'}</small></div>`).join('')}
      <div class="row"><button type="button" class="btn soft small" data-pr-yaz>＋ Bir yan bölüm yaz</button></div>`;
  }
  function writeSide() {
    const m = K.ui.modal({
      label: 'Yan bölüm yaz',
      cls: 'pr-yaz',
      html: `<h2>Senin Bölümün</h2><p class="muted small">Üç sahne; her sahnede iki kapı ve her kapının ardında ne olduğu.</p>
        <input class="input" id="pyT" maxlength="50" placeholder="Bölümün adı">
        ${[0, 1, 2].map((i) => `<fieldset class="pr-sahne"><legend>${i + 1}. sahne</legend><textarea class="input" data-py="t${i}" maxlength="400" rows="2" placeholder="Ne oluyor?"></textarea><input class="input" data-py="a${i}" maxlength="60" placeholder="🅐 kapısı"><input class="input" data-py="ra${i}" maxlength="240" placeholder="🅐 seçilirse ne olur?"><input class="input" data-py="b${i}" maxlength="60" placeholder="🅑 kapısı"><input class="input" data-py="rb${i}" maxlength="240" placeholder="🅑 seçilirse ne olur?"></fieldset>`).join('')}
        <div class="row"><button type="button" class="btn red" data-py-ok>💌 Gönder</button></div>`,
    });
    m.body.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-py-ok]')) return;
      const v = (k) => ((K.$(`[data-py="${k}"]`, m.body) || {}).value || '').trim();
      const title = (K.$('#pyT', m.body).value || '').trim();
      const scenes = [0, 1, 2].map((i) => ({ t: v('t' + i), a: v('a' + i), b: v('b' + i), ra: v('ra' + i), rb: v('rb' + i) }));
      if (!title || scenes.some((x) => !x.t || !x.a || !x.b)) return K.fx.toast('Ad, üç sahne ve her sahnede iki kapı gerekli.', { duration: 2400 });
      const r = await K.cloud.add('yanbolum', { bid: 'y' + Date.now().toString(36), title, scenes });
      if (!r) return K.fx.toast('Gönderilemedi.');
      side.push(r);
      m.close();
      K.stickers.award('yanbolum');
      K.ping(`✍️ ${K.meName()} senin için bir bölüm yazdı`, `"${title}" · üç sahne. Oynarken o seni izleyecek.`, ['scroll'], { click: K.roomUrl('prenses') });
      renderSide();
    });
  }
  function playSide(bid) {
    const b = side.find((x) => x.data.bid === bid);
    if (!b) return;
    const m = K.ui.modal({ label: b.data.title, cls: 'pr-oyna', html: '<div data-po></div>' });
    const draw = () => {
      const done = playsOf(bid);
      const i = done.length;
      const box = K.$('[data-po]', m.body);
      const past = done.map((p) => {
        const sc = b.data.scenes[p.data.sc];
        return `<div class="pr-po-gecmis"><p>${K.esc(sc.t)}</p><p class="pr-picked">${p.data.c ? '🅑' : '🅐'} ${K.esc(p.data.c ? sc.b : sc.a)}</p>${(p.data.c ? sc.rb : sc.ra) ? `<p class="hand">${K.esc(p.data.c ? sc.rb : sc.ra)}</p>` : ''}</div>`;
      }).join('');
      const sc = b.data.scenes[i];
      box.innerHTML = `<p class="card-eyebrow">${K.esc(nameOf(b.who))} yazdı</p><h2>${K.esc(b.data.title)}</h2>${past}${sc ? `<div class="pr-po-sahne"><p class="pr-no">${i + 1}. sahne</p><p>${K.esc(sc.t)}</p><button type="button" class="pr-opt" data-po-c="0">🅐 ${K.esc(sc.a)}</button><button type="button" class="pr-opt" data-po-c="1">🅑 ${K.esc(sc.b)}</button></div>` : '<p class="pr-end hand">Son. 💗</p>'}`;
    };
    draw();
    m.body.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-po-c]');
      if (!c) return;
      const sc = playsOf(bid).length;
      const r = await K.cloud.add('yanoyna', { bid, sc, c: +c.dataset.poC });
      r && plays.push(r);
      K.cloud.send('yanoyna', { bid, sc, c: +c.dataset.poC });
      K.audio.sfx.paper();
      draw();
      renderSide();
    });
  }

  async function choose(ch, c) {
    const s = curS();
    if (choice(s, ch, mine())) return;
    K.$$('.pr-opt', root).forEach((b) => (b.disabled = true));
    const r = await K.cloud.add('prenses', Object.assign({ ch, c }, s > 1 ? { s } : {}, run(s) ? { run: run(s) } : {}));
    if (!r) {
      K.$$('.pr-opt', root).forEach((b) => (b.disabled = false));
      return K.fx.toast('Kaydedilemedi.');
    }
    push(r);
    K.audio.sfx.paper();
    if (both(s, ch)) {
      K.fx.confetti({ count: 80, shapes: ['bow', 'heart', 'star'] });
      K.audio.sfx.success();
      K.stickers.award(s > 1 ? 'prenses2' : 'prenses');
      K.ping(`📖 Hikâye ilerledi: ${S(s).chapters[ch].title}`, 'İkiniz de seçtiniz; sonuç açıldı.', ['book'], { click: K.roomUrl('prenses') });
    } else K.ping(`📖 ${ROLE[mine()]} seçimini yaptı`, `"${S(s).chapters[ch].title}" · sıra sende. Seçimi gizli.`, ['book'], { click: K.roomUrl('prenses') });
    render();
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    const [a, b, c, d, e2, f] = await Promise.all(['prenses', 'prtekrar', 'prcanta', 'prgiyim', 'yanbolum', 'yanoyna'].map((k) => K.cloud.list(k, 800)));
    rows = a.concat(b, c, d);
    side = e2;
    plays = f;
    loaded = true;
    ['prenses', 'prtekrar', 'prcanta', 'prgiyim'].forEach((k) => K.cloud.on(k, (r) => {
      if (!push(r)) return;
      if (k === 'prenses' && r.who !== mine() && both(sOf(r), r.data.ch) && K.activeRoom === 'prenses') {
        K.fx.confetti({ count: 80, shapes: ['bow', 'heart', 'star'] });
        K.stickers.award(sOf(r) > 1 ? 'prenses2' : 'prenses');
      }
      render();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    }));
    K.cloud.on('yanbolum', (r) => side.some((x) => x.id === r.id) || (side.push(r), renderSide()));
    K.cloud.on('yanoyna', (r) => plays.some((x) => x.id === r.id) || (plays.push(r), renderSide()));
    K.cloud.onLive('yanoyna', (m) => {
      if (m.who === mine()) return;
      const b = side.find((x) => x.data.bid === m.bid && x.who === mine());
      if (!b) return;
      const sc = b.data.scenes[m.sc];
      K.fx.toast(`🎭 ${K.esc(nameOf(m.who))}, "${K.esc(b.data.title)}" · ${m.sc + 1}. sahnede <b>${m.c ? '🅑' : '🅐'} ${K.esc(m.c ? sc.b : sc.a)}</b> kapısını seçti`, { duration: 6000 });
    });
    render();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !D.prenses) return [];
    const s = (avail().slice(-1)[0] || { s: 1 }).s;
    const se = S(s);
    const cur = current(s);
    if (se.trailer && !K.store.get('prFragman' + s) && cur.open && cur.i === 0 && !choice(s, 0, mine())) return [{ key: 'prenses', icon: 'story', big: true, title: `🎬 ${se.season} başlıyor`, text: 'Yirmi saniyelik fragman hazır. Sonra ilk bölüm seni bekliyor.', run: () => (K.go('prenses'), setTimeout(() => trailer(s), 500)), cta: 'Fragmanı izle' }];
    if (cur.done || !cur.open) {
      const last = cur.done ? se.chapters.length - 1 : cur.i - 1;
      if (last >= 0 && both(s, last) && K.store.get('prSeen') !== seenKey(s, last)) return [{ icon: 'story', title: `📖 Bölüm ${last + 1} sonucu açıldı`, text: `"${se.chapters[last].title}" · ikiniz de seçtiniz.`, run: () => (K.store.set('prSeen', seenKey(s, last)), (sez = s), (view = last), K.go('prenses')), cta: 'Oku' }];
      return [];
    }
    if (choice(s, cur.i, mine())) return [];
    const ot = choice(s, cur.i, other());
    return [{ icon: 'story', title: `📖 Prenses ve User155${s > 1 ? ` · Sezon ${s}` : ''} · Bölüm ${cur.i + 1}`, text: ot ? `${ROLE[other()]} seçimini yaptı. Sıra sende.` : `"${se.chapters[cur.i].title}" seni bekliyor.`, room: 'prenses', cta: 'Oku ve seç' }];
  });

  K.room({
    id: 'prenses',
    wing: 'oyun',
    title: 'Prenses ve User155',
    sub: 'Haftalık etkileşimli hikâye',
    icon: 'story',
    color: '#FFE6F0',
    hidden: () => !D.prenses || !K.cloud || !K.cloud.enabled,
    badge: () => {
      if (!loaded) return '';
      const s = (avail().slice(-1)[0] || { s: 1 }).s;
      const cur = current(s);
      return !cur.done && cur.open && !choice(s, cur.i, mine()) ? 'Sıra sende' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(S(curS()).intro || (D.prenses || {}).intro || [])}</div><section class="pr-book" id="prBook"></section><section class="card pr-yan" id="prYan"></section>`;
      el.addEventListener('click', async (e) => {
        const sb = e.target.closest('[data-pr-s]');
        if (sb) return (sez = +sb.dataset.prS), (view = null), render();
        const v = e.target.closest('[data-pr-v]');
        if (v) return (view = +v.dataset.prV), render();
        const c = e.target.closest('[data-pr-c]');
        if (c) return choose(+c.dataset.ch, +c.dataset.prC);
        const es = e.target.closest('[data-pr-esya]');
        if (es) return useItem(curS(), es.dataset.prEsya);
        const dl = e.target.closest('[data-pr-dolap]');
        if (dl) return dolapSheet(+dl.dataset.prDolap);
        if (e.target.closest('[data-pr-fragman]')) return trailer(curS());
        if (e.target.closest('[data-pr-tekrar]')) {
          const s = curS();
          push(await K.cloud.add('prtekrar', { s, run: run(s) + 1 }));
          view = null;
          K.audio.sfx.whoosh();
          return render();
        }
        if (e.target.closest('[data-pr-yaz]')) return writeSide();
        const o = e.target.closest('[data-pr-oyna]');
        o && playSide(o.dataset.prOyna);
      });
    },
    enter() {
      const s = curS();
      const cur = current(s);
      if (view == null || view > cur.i) view = null;
      const last = cur.done ? S(s).chapters.length - 1 : cur.i - 1;
      if (last >= 0 && both(s, last)) K.store.set('prSeen', seenKey(s, last));
      render();
      if (S(s).trailer && !K.store.get('prFragman' + s) && cur.open && cur.i === 0) setTimeout(() => trailer(s), 600);
    },
    leave() {
      view = null;
    },
  });
  K.prenses = { current, seasons: () => avail().map((x) => x.s), bag };
})();
