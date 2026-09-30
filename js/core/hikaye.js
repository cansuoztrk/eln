/* Kale 2.0 — Hikâyeler: ana salonun üstünde halkalar. Onun son iki günü (sesi, havası, kartpostalı, fotoğrafları...)
   tam ekran, dokunarak ilerleyen bir hikâye olarak oynar. İkiniz de fotoğraf ya da yazıyla kendi hikâyenizi paylaşırsınız;
   onun hikâyesine tepki (❤️ 🥹 😂 😍 🤗) ya da yanıt bırakırsınız, o da "gördü" bilgisini görür.
   Öne çıkanlar: kartpostallar, Bakü Günlüğü, kabin şeritleri, sahneler, ilkler ve hikâye arşivi.
   Kayıtlar: hikaye {thumb, full, text, bg} + hkimg {img} · hkgor {ref} · hktepki {ref, r} · hkyanit {ref, text} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const HK = () => D.hikaye || { prompts: [], reactions: ['❤️', '🥹', '😂', '😍', '🤗'], highlights: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const BGS = ['linear-gradient(160deg,#FF8FB8,#E3174D)', 'linear-gradient(160deg,#C9B6FF,#6E54D6)', 'linear-gradient(160deg,#8FD3FF,#3E7FD9)', 'linear-gradient(160deg,#FFD34E,#F2706D)', 'linear-gradient(160deg,#7ED6A5,#2E8B6A)', 'linear-gradient(160deg,#2B2024,#5B2A3E)'];
  const KIND_BG = { hava: 2, hvcare: 2, dakika: 5, song: 1, page: 3, live: 0, letter: 0, tale: 3, pigeon: 2, coin: 3, hug: 0, answer: 1, luck: 4, bloom: 4, bouquet: 0, nerdwin: 4, sleep: 5, filmview: 1, flight: 2, cark: 3, ev: 0, kletter: 1, knote: 3, dvoice: 1, pb: 0, sofra: 3, ilk: 3, r36: 5, opened: 0 };

  // Avatarlar: İstanbul'daki kule Ardoş, Bakü'deki kule Elnoş
  K.avatar = (w, cls = '') => `<span class="k-av ${w} ${cls}" aria-hidden="true">${w === 'me' ? A.kizKulesi('k-av-t') : A.qizQalasi('k-av-t')}</span>`;
  K.ago = (at) => {
    const s = (Date.now() - at) / 1000;
    if (s < 60) return 'az önce';
    if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
    if (s < 86400 && T.key(T.baku(new Date(at))) === T.todayKey()) return `${Math.floor(s / 3600)} sa önce`;
    const p = T.baku(new Date(at));
    return `${s < 172800 ? 'dün' : T.fmtShort(new Date(at))} ${K.pad(p.h)}:${K.pad(p.mi)}`;
  };

  let rows = { gor: [], tepki: [], yanit: [] };
  let hl = {};
  const seen = () => K.store.get('hkSeen', {});
  const markSeen = (id) => {
    const s = seen();
    if (s[id]) return;
    s[id] = Date.now();
    const keys = Object.keys(s);
    if (keys.length > 600) keys.sort((a, b) => s[a] - s[b]).slice(0, keys.length - 500).forEach((k) => delete s[k]);
    K.store.set('hkSeen', s);
  };

  /* ---------- Listeler ---------- */
  function theirs() {
    const list = K.akis.recent().filter((x) => x.who === other());
    const strong = list.filter((x) => x.weight >= 2);
    return (list.length > 24 ? strong : list).slice(-30);
  }
  const myStories = () => K.akis.recent().filter((x) => x.who === mine() && x.kind === 'hikaye' && Date.now() - x.at < 864e5);
  const unseen = (list) => list.filter((x) => !seen()[x.id]);

  /* ---------- Halkalar ---------- */
  function bar() {
    const box = K.$('#stories');
    if (!box) return;
    if (!K.cloud || !K.cloud.enabled) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const t = theirs(), m = myStories();
    const ring = (cls, inner, label, attr) => `<button type="button" class="hk-item" ${attr}><span class="hk-ring ${cls}">${inner}</span><span class="hk-lbl">${label}</span></button>`;
    const hls = (HK().highlights || [])
      .map(([id, label]) => {
        const h = hl[id];
        if (!h || !h.n) return '';
        return ring('hl', h.img ? `<img src="${h.img}" alt="">` : `<span class="hk-emo">${h.emoji || '♥'}</span>`, K.esc(label), `data-hk-hl="${id}"`);
      })
      .join('');
    box.innerHTML = `<div class="hk-bar" role="list">
      <span class="hk-me">${ring(m.length ? (unseen(m).length ? 'new' : 'seen') : 'add', K.avatar(mine()), 'Hikâyen', `data-hk-mine aria-label="Senin hikâyen"`)}<button type="button" class="hk-plus" data-hk-add aria-label="Hikâye ekle">${A.ui('plus')}</button></span>
      ${ring(t.length ? (unseen(t).length ? 'new' : 'seen') : 'empty', K.avatar(other()), K.esc(nameOf(other())), `data-hk-them aria-label="${K.esc(nameOf(other()))} hikâyeleri"`)}
      ${hls}
    </div>`;
  }

  /* ---------- Oynatıcı ---------- */
  let V = null;
  function open(items, opt = {}) {
    if (!items.length) return;
    close(true);
    const start = opt.start != null ? opt.start : Math.max(0, items.findIndex((x) => !seen()[x.id]));
    const el = K.el(`<div class="hk-view" role="dialog" aria-modal="true" aria-label="Hikâyeler">
      <div class="hk-bg" aria-hidden="true"></div>
      <div class="hk-top"><div class="hk-segs">${items.map(() => '<i><b></b></i>').join('')}</div>
        <div class="hk-head"><span class="hk-who"></span><span class="hk-meta"><b class="hk-name"></b><small class="hk-time"></small></span><button type="button" class="hk-x" aria-label="Kapat">${A.ui('close')}</button></div></div>
      <div class="hk-stage"></div>
      <button type="button" class="hk-nav prev" aria-label="Önceki"></button><button type="button" class="hk-nav next" aria-label="Sonraki"></button>
      <div class="hk-foot"></div></div>`);
    document.body.appendChild(el);
    document.body.classList.add('has-story');
    requestAnimationFrame(() => el.classList.add('in'));
    V = { el, items, i: -1, t0: 0, dur: 6000, paused: false, raf: 0, pos: 0, own: Boolean(opt.own), title: opt.title };
    bind(el);
    show(start);
    if (K.audio.music.on) {
      V.music = true;
      K.audio.music.stop(false);
    }
  }
  function close(silent) {
    if (!V) return;
    const v = V;
    V = null;
    cancelAnimationFrame(v.raf);
    v.el.classList.remove('in');
    setTimeout(() => v.el.remove(), 320);
    document.body.classList.remove('has-story');
    if (v.music) K.audio.music.start();
    if (!silent) bar();
  }
  function frame() {
    if (!V) return;
    const now = performance.now();
    if (!V.paused) V.pos += now - V.last;
    V.last = now;
    const segs = K.$$('.hk-segs b', V.el);
    if (segs[V.i]) segs[V.i].style.width = Math.min(100, (V.pos / V.dur) * 100) + '%';
    if (V.pos >= V.dur) return next();
    V.raf = requestAnimationFrame(frame);
  }
  function next() {
    if (!V) return;
    if (V.i >= V.items.length - 1) return close();
    show(V.i + 1);
  }
  function prev() {
    if (!V) return;
    show(Math.max(0, V.i - 1));
  }
  const reacts = (id) => rows.tepki.filter((r) => r.data.ref === id);
  const replies = (id) => rows.yanit.filter((r) => r.data.ref === id);
  const seenBy = (id) => rows.gor.find((r) => r.data.ref === id && r.who !== mine());

  async function show(i) {
    if (!V) return;
    V.i = i;
    const x = V.items[i];
    cancelAnimationFrame(V.raf);
    K.$$('.hk-segs b', V.el).forEach((b, j) => (b.style.width = j < i ? '100%' : '0%'));
    V.pos = 0;
    V.last = performance.now();
    V.dur = x.img ? 7000 : x.text && x.text.length > 90 ? 8000 : 5500;
    K.$('.hk-who', V.el).innerHTML = x.who ? K.avatar(x.who) : `<span class="k-av hl">${x.emoji || '♥'}</span>`;
    K.$('.hk-name', V.el).textContent = x.who ? nameOf(x.who) : V.title || '';
    K.$('.hk-time', V.el).textContent = `${x.at ? K.ago(x.at) : ''}${x.kind !== 'hikaye' && x.title ? ' · ' + x.title.split(':')[0] : ''}`;
    const bg = x.img ? `url("${x.img}")` : BGS[KIND_BG[x.kind] != null ? KIND_BG[x.kind] : x.bg != null ? x.bg : 0];
    const bgEl = K.$('.hk-bg', V.el);
    bgEl.style.background = x.img ? '' : bg;
    bgEl.style.backgroundImage = x.img ? bg : bgEl.style.backgroundImage;
    bgEl.classList.toggle('img', Boolean(x.img));
    const st = K.$('.hk-stage', V.el);
    if (x.img) {
      st.innerHTML = `<figure class="hk-photo"><img src="${x.img}" alt=""></figure>${x.kind !== 'hikaye' ? `<p class="hk-cap"><b>${K.esc(x.title)}</b>${x.text ? '<br>' + K.esc(x.text) : ''}</p>` : x.text ? `<p class="hk-cap">${K.esc(x.text)}</p>` : ''}`;
      // Büyük hâli sonradan
      if (x.kind === 'hikaye' && x.row && x.row.data.full) {
        const h = await K.cloud.get(x.row.data.full);
        if (V && V.items[V.i] === x && h && h.data && h.data.img) K.$('.hk-photo img', st).src = h.data.img;
      }
    } else if (x.kind === 'hikaye') {
      st.innerHTML = `<div class="hk-card text"><p>${K.esc(x.text || '')}</p></div>`;
    } else {
      st.innerHTML = `<div class="hk-card"><span class="hk-big">${x.emoji || '♥'}</span><h3>${K.esc(x.title)}</h3>${x.text ? `<p>${K.esc(x.text)}</p>` : ''}</div>`;
    }
    foot(x);
    markSeen(x.id);
    if (x.kind === 'hikaye' && x.who !== mine() && !rows.gor.some((r) => r.data.ref === x.id && r.who === mine())) {
      K.cloud.add('hkgor', { ref: x.id }).then((r) => r && rows.gor.push(r));
    }
    // Bir sonrakinin fotoğrafını önceden yükle
    const nx = V.items[i + 1];
    if (nx && nx.img) new Image().src = nx.img;
    V.raf = requestAnimationFrame(frame);
  }
  function foot(x) {
    const f = K.$('.hk-foot', V.el);
    const room = x.room && K.rooms.find((r) => r.id === x.room);
    const go = room ? `<a class="hk-go" href="#${x.room}" data-hk-go>${K.esc(K.val(room.title))} ${A.ui('next')}</a>` : '';
    if (x.who === mine()) {
      const sb = seenBy(x.id);
      const rs = reacts(x.id), ys = replies(x.id);
      f.innerHTML = `${go}<div class="hk-stats">${x.kind === 'hikaye' ? `<span>${sb ? `${A.ui('check')} ${K.esc(nameOf(other()))} gördü · ${K.ago(sb.at)}` : 'Henüz görmedi'}</span>` : ''}${rs.length ? `<span class="hk-rs">${rs.map((r) => r.data.r).join(' ')}</span>` : ''}</div>${ys.length ? `<ul class="hk-replies">${ys.map((r) => `<li><b>${K.esc(nameOf(r.who))}:</b> ${K.esc(r.data.text)}</li>`).join('')}</ul>` : ''}`;
      return;
    }
    if (!x.who) {
      f.innerHTML = go;
      return;
    }
    const mineR = reacts(x.id).filter((r) => r.who === mine()).map((r) => r.data.r);
    f.innerHTML = `${go}<form class="hk-reply" autocomplete="off"><input class="hk-in" name="t" maxlength="200" placeholder="${K.esc(HK().replyPh || 'Yanıt yaz...')}"><button type="submit" aria-label="Gönder">${A.ui('send')}</button></form>
      <div class="hk-reacts">${(HK().reactions || []).map((e) => `<button type="button" class="${mineR.includes(e) ? 'on' : ''}" data-hk-r="${e}">${e}</button>`).join('')}</div>`;
  }
  function bind(el) {
    let down = 0, sx = 0, sy = 0, held = false, holdT = 0, justHeld = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.hk-foot, .hk-x, .hk-head')) return;
      down = Date.now();
      sx = e.clientX;
      sy = e.clientY;
      holdT = setTimeout(() => {
        held = true;
        if (V) V.paused = true;
        el.classList.add('paused');
      }, 220);
    });
    const up = (e) => {
      clearTimeout(holdT);
      if (!down) return;
      const dy = e.clientY - sy, dx = e.clientX - sx;
      down = 0;
      if (held) {
        held = false;
        justHeld = Date.now();
        if (V) V.paused = false;
        el.classList.remove('paused');
        return;
      }
      if (dy > 90 && Math.abs(dx) < 80) return close();
      if (Math.abs(dx) > 60) return dx < 0 ? next() : prev();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', (e) => {
      if (e.target.closest('.hk-x')) return close();
      if (Date.now() - justHeld < 300) return;
      if (e.target.closest('.hk-nav.next')) return next();
      if (e.target.closest('.hk-nav.prev')) return prev();
      if (e.target.closest('[data-hk-go]')) return close(true);
      const r = e.target.closest('[data-hk-r]');
      if (r && V) return react(V.items[V.i], r.dataset.hkR, r);
    });
    el.addEventListener('focusin', (e) => {
      if (e.target.closest('.hk-reply') && V) V.paused = true;
    });
    el.addEventListener('focusout', (e) => {
      if (e.target.closest('.hk-reply') && V) V.paused = false;
    });
    el.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!V) return;
      const x = V.items[V.i];
      const text = String(e.target.t.value || '').trim();
      if (!text) return;
      e.target.t.value = '';
      e.target.t.blur();
      const r = await K.cloud.add('hkyanit', { ref: x.id, text });
      if (r) rows.yanit.push(r);
      K.audio.sfx.pop();
      K.fx.toast(`Yanıtın ${K.esc(K.ek(nameOf(other()), 'e'))} gitti.`, { icon: A.icon('chat'), duration: 2500 });
      if (!K.isOwner()) K.notify(`${C.herName} hikâyene yanıt verdi`, `${x.title ? x.title + ' → ' : ''}${text}`, ['speech_balloon']);
    });
    el.addEventListener('keydown', (e) => {
      if (e.target.closest('input')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
    el.tabIndex = -1;
    setTimeout(() => el.focus({ preventScroll: true }), 50);
  }
  async function react(x, emo, btn) {
    btn.classList.add('on', 'pop');
    const rect = btn.getBoundingClientRect();
    K.fx.burst(rect.left + rect.width / 2, rect.top, { count: 8, power: 5 });
    K.vibrate(20);
    const r = await K.cloud.add('hktepki', { ref: x.id, r: emo });
    if (r) rows.tepki.push(r);
    if (!K.isOwner()) K.notify(`${C.herName} ${emo}`, `${x.title || 'Hikâyene'} tepki bıraktı`, ['heart']);
  }

  /* ---------- Paylaş ---------- */
  function shrink(file, max, q) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => res(null);
      img.src = URL.createObjectURL(file);
    });
  }
  function compose() {
    const pr = K.pick(HK().prompts || ['Şu an ne görüyorsun?']);
    let file = null, bg = 0;
    const m = K.ui.modal({
      label: 'Hikâye paylaş',
      cls: 'hk-compose',
      html: `<p class="card-eyebrow">Hikâyen · 24 saat halkada, sonra arşivde</p><h2>${K.esc(pr)}</h2>
        <div class="hk-prev" style="background:${BGS[0]}"><img alt="" hidden><p class="hk-prev-t"></p></div>
        <div class="row hk-src"><label class="btn soft small">${A.ui('camera')} Fotoğraf<input type="file" accept="image/*" hidden></label><span class="hk-bgs">${BGS.map((b, i) => `<button type="button" style="background:${b}" data-bg="${i}" aria-label="Arka plan ${i + 1}"></button>`).join('')}</span></div>
        <textarea class="textarea" rows="2" maxlength="220" placeholder="Bir cümle ekle (isteğe bağlı)"></textarea>
        <button type="button" class="btn red" data-hk-post>${A.ui('send')} ${K.esc(nameOf(other()))} görsün</button>`,
    });
    const pv = K.$('.hk-prev', m.body), im = K.$('img', pv), pt = K.$('.hk-prev-t', pv), ta = K.$('textarea', m.body);
    ta.addEventListener('input', () => (pt.textContent = ta.value));
    m.body.addEventListener('change', async (e) => {
      if (e.target.type !== 'file' || !e.target.files[0]) return;
      file = e.target.files[0];
      im.src = URL.createObjectURL(file);
      im.hidden = false;
      pv.classList.add('has-img');
    });
    m.body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-bg]');
      if (b) {
        bg = +b.dataset.bg;
        pv.style.background = BGS[bg];
        return;
      }
      const post = e.target.closest('[data-hk-post]');
      if (!post) return;
      const text = ta.value.trim();
      if (!file && !text) return ta.focus();
      post.disabled = true;
      post.classList.add('loading');
      let data = { text, bg };
      if (file) {
        const [full, thumb] = await Promise.all([shrink(file, 1280, 0.82), shrink(file, 420, 0.72)]);
        const big = full && (await K.cloud.add('hkimg', { img: full }));
        if (!big) {
          post.disabled = false;
          post.classList.remove('loading');
          return K.fx.toast('Fotoğraf gönderilemedi. İnternet bağlantını kontrol et.');
        }
        data = { text, thumb, full: big.id };
      }
      const r = await K.cloud.add('hikaye', data);
      if (!r) {
        post.disabled = false;
        post.classList.remove('loading');
        return K.fx.toast('Paylaşılamadı. İnternet bağlantını kontrol et.');
      }
      m.close();
      K.audio.sfx.success();
      K.fx.toast(`<b>Hikâyen paylaşıldı.</b> ${K.esc(nameOf(other()))} halkayı görünce açacak.`, { icon: A.icon('camera') });
      K.stickers.award('hikaye');
      if (!K.isOwner()) K.notify(`${C.herName} bir hikâye paylaştı`, text || 'Bir fotoğraf', ['camera_with_flash']);
      bar();
    });
  }

  /* ---------- Öne çıkanlar ---------- */
  const HL = {
    kartpostal: { kinds: ['postcard'], emoji: '💌' },
    gunluk: { kinds: ['kphoto'], emoji: '📷' },
    sahne: { kinds: ['sahne'], emoji: '🎬' },
    arsiv: { kinds: ['hikaye'], emoji: '📚' },
  };
  async function loadHighlights() {
    const got = await K.cloud.many(['postcard', 'kphoto', 'sahne', 'hikaye'], { limit: 60 });
    Object.entries(HL).forEach(([id, h]) => {
      const list = got.filter((r) => h.kinds.includes(r.kind) && (id !== 'arsiv' || Date.now() - r.at > 864e5));
      const last = list[list.length - 1];
      hl[id] = { n: list.length, img: last && last.data.thumb, emoji: h.emoji };
    });
    const strips = K.kabin && K.kabin.strips ? K.kabin.strips().filter((s) => s.me && s.her) : [];
    hl.kabin = { n: strips.length, img: strips.length ? strips[strips.length - 1].her.data.thumb : null, emoji: '📸' };
    const firsts = K.ilkler && K.ilkler.scenes ? K.ilkler.scenes() : [];
    hl.ilk = { n: firsts.length, emoji: '🥇' };
    bar();
  }
  async function openHighlight(id) {
    const label = ((HK().highlights || []).find((h) => h[0] === id) || [])[1] || '';
    let items = [];
    if (HL[id]) {
      const rs = await K.cloud.many(HL[id].kinds, { limit: 120 });
      items = rs.map(K.akis.norm).filter((x) => x && (id !== 'arsiv' || Date.now() - x.at > 864e5));
    } else if (id === 'kabin') {
      // Her şeridin iki yarısı art arda: önce İstanbul, sonra Bakü
      items = K.kabin.strips().filter((s) => s.me && s.her).flatMap((s) => [
        { id: 'kb-' + s.me.id, who: 'me', at: s.me.at, img: s.me.data.thumb, title: 'Fotoğraf Kabini', text: 'İstanbul yarısı', room: 'kabin', kind: 'kabinhl' },
        { id: 'kb-' + s.her.id, who: 'her', at: s.her.at, img: s.her.data.thumb, title: 'Fotoğraf Kabini', text: 'Bakü yarısı', room: 'kabin', kind: 'kabinhl' },
      ]);
    } else if (id === 'ilk') {
      items = K.ilkler.scenes().flatMap((f) => [f.me, f.her].filter(Boolean).map((r) => ({ id: 'il-' + r.id, who: r.who, at: r.at, emoji: '🥇', title: f.title, text: r.data.forgot ? 'Hatırlamıyor.' : r.data.text, room: 'ilkler', kind: 'ilkhl' })));
    }
    if (!items.length) return;
    open(items.slice(-60), { start: 0, title: label });
  }

  /* ---------- Bulut ---------- */
  K.on('cloud', async (on) => {
    if (!on) return;
    const [g, t, y] = await Promise.all(['hkgor', 'hktepki', 'hkyanit'].map((k) => K.cloud.list(k, 200)));
    rows = { gor: g, tepki: t, yanit: y };
    [['hkgor', 'gor'], ['hktepki', 'tepki'], ['hkyanit', 'yanit']].forEach(([k, key]) =>
      K.cloud.on(k, (r) => {
        if (rows[key].some((x) => x.id === r.id)) return;
        rows[key].push(r);
        if (r.who === mine()) return;
        const x = K.akis.recent().find((i) => i.id === r.data.ref);
        const what = x && x.kind === 'hikaye' ? 'hikâyene' : x ? `"${x.title}" hikâyene` : 'hikâyene';
        if (k === 'hktepki') K.fx.toast(`<b>${K.esc(nameOf(r.who))}</b> ${K.esc(what)} ${r.data.r} bıraktı.`, { icon: A.icon('heart'), duration: 5000 });
        if (k === 'hkyanit') K.fx.toast(`<b>${K.esc(nameOf(r.who))} ${K.esc(what)} yanıt verdi:</b> ${K.esc(r.data.text)}`, { icon: A.icon('chat'), duration: 9000 });
        if (V && V.items[V.i] && V.items[V.i].id === r.data.ref) foot(V.items[V.i]);
      })
    );
    K.cloud.on('hikaye', (r) => {
      if (r.who !== mine()) {
        K.audio.sfx.sparkle();
        K.fx.toast(`<b>${K.esc(nameOf(r.who))} bir hikâye paylaştı.</b> Halkası yandı.`, { icon: A.icon('camera'), duration: 6000 });
      }
    });
    setTimeout(loadHighlights, 3500);
  });
  K.akis.onChange(() => bar());
  K.on('built', () => {
    const box = K.$('#stories');
    if (!box) return;
    bar();
    box.addEventListener('click', (e) => {
      if (e.target.closest('[data-hk-add]')) return compose();
      if (e.target.closest('[data-hk-mine]')) {
        const m = myStories();
        return m.length ? open(m, { own: true, start: 0 }) : compose();
      }
      if (e.target.closest('[data-hk-them]')) {
        const t = theirs();
        if (!t.length) return K.fx.toast(K.fill((HK().empty || '').replace('{other}', nameOf(other()))), { icon: A.icon('camera'), duration: 5000 });
        return open(t);
      }
      const h = e.target.closest('[data-hk-hl]');
      if (h) return openHighlight(h.dataset.hkHl);
    });
  });
  window.addEventListener('hashchange', () => V && close(true));
  K.stories = { open, compose, bar, unseenCount: () => unseen(theirs()).length };
})();
