/* Oda: Uyku Masalları — Ardoş'un sesinden on iki kısa masal (metinler kasada, sesler panelin ses stüdyosundan buluta).
   Raf: her masal bir kitap sırtı. Masal açılınca karanlık bir okuma ekranı: sesle birlikte ilerleyen satırlar, zamanlayıcı
   (masal bitince / 10 / 20 / 30 dk; süre dolunca ses yavaşça kısılır), "sıradaki masalla devam". Henüz kaydedilmemiş masal
   yazıyla okunur; Eln "Ardoş okusun" diyebilir, kale sahibinde o masal parlar ve tek dokunuşla stüdyo açılır.
   Kayıt: masalistek {id} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const UY = () => D.uyku || { intro: [], timers: [[0, 'Masal bitince']], goodnight: [] };
  const tales = () => (D.voices || []).filter((v) => v.uyku).sort((a, b) => a.uyku.n - b.uyku.n);
  const has = (id) => Boolean(K.voice && K.voice.exists(id));
  const heard = () => K.store.get('uykuHeard', {});
  let root = null, asks = [], player = null, timerMin = 0, deadline = 0, tm = null, fadeIv = null, chaining = false;
  const asked = (id) => asks.filter((r) => r.data.id === id);
  // Bu gecenin masalı: güne göre sırayla, kaydedilmiş olanlar önce
  function tonight() {
    const list = tales();
    if (!list.length) return null;
    const rec = list.filter((v) => has(v.id));
    const pool = rec.length ? rec : list;
    return pool[T.dayNumber(T.now()) % pool.length];
  }

  function render() {
    if (!root || K.activeRoom !== 'uyku') return;
    const list = tales();
    const n = list.filter((v) => has(v.id)).length;
    const own = K.isOwner();
    const h = heard();
    const t = tonight();
    K.$('#uyHead', root).innerHTML = `<div class="uy-sky" aria-hidden="true">${Array.from({ length: 22 }, (_, i) => `<i style="left:${(i * 41) % 100}%;top:${(i * 29) % 80}%;--d:${(i % 6) * 0.7}s"></i>`).join('')}<span class="uy-moon"></span></div>
      <div class="uy-head-tx"><p class="card-eyebrow">Bu gecenin masalı</p>${t ? `<h2>${t.uyku.emoji} ${K.esc(t.title)}</h2><p>${K.esc(t.uyku.ozet)}</p><button type="button" class="btn red" data-uy-open="${t.id}">${A.ui(has(t.id) ? 'play' : 'book')} ${has(t.id) ? 'Dinle' : 'Oku'}</button>` : ''}
      <p class="uy-count">${own ? `<b>${n}</b> / ${list.length} masal kaydedildi` : `<b>${n}</b> masal ${K.esc(K.ek(C.myPet, 'in'))} sesinden · ${Object.keys(h).length} dinlendi`}</p></div>`;
    K.$('#uyShelf', root).innerHTML = list
      .map((v, i) => {
        const rec = has(v.id), ask = asked(v.id).length;
        return `<button type="button" class="uy-book ${rec ? 'rec' : ''} ${h[v.id] ? 'heard' : ''} ${own && ask && !rec ? 'asked' : ''}" data-uy-open="${v.id}" style="--c:${v.uyku.color};--i:${i};--h:${132 + ((v.uyku.n * 37) % 34)}px">
          <span class="uy-spine"><span class="uy-emo" aria-hidden="true">${v.uyku.emoji}</span><b>${K.esc(v.title)}</b><small>${v.uyku.n}</small></span>
          <span class="uy-tag">${rec ? (h[v.id] ? '✓ dinlendi' : '🎙️ sesli') : own ? (ask ? '🙏 istedi' : 'kaydet') : 'yazıyla'}</span></button>`;
      })
      .join('');
    K.$('#uyOwner', root).hidden = !own;
  }

  /* ---------- Okuma / dinleme ekranı ---------- */
  function open(id) {
    const v = tales().find((x) => x.id === id);
    if (!v) return;
    stop(true);
    const rec = has(id);
    const own = K.isOwner();
    const m = K.ui.modal({
      label: v.title,
      cls: 'uy-reader',
      onClose: () => stop(true),
      html: `<div class="uy-r-top"><span class="uy-r-emo" aria-hidden="true">${v.uyku.emoji}</span><p class="card-eyebrow">Uyku masalı ${v.uyku.n} · ${K.esc(v.sure || '')}</p><h2>${K.esc(v.title)}</h2></div>
        <div class="uy-lines">${v.text.map((l) => `<p>${K.esc(K.fill(l))}</p>`).join('')}</div>
        <div class="uy-ctrl">${rec ? `<button type="button" class="uy-play" data-uy-play aria-label="Oynat">${A.ui('play')}</button><div class="uy-bar"><i></i></div><span class="uy-time tnum">0:00</span>` : `<p class="uy-nosound">${own ? 'Bu masalı henüz kaydetmedin.' : `${K.esc(C.myPet)} bu masalı henüz okumadı; şimdilik yazıyla.`}</p>`}</div>
        ${rec ? `<div class="uy-opts"><p class="uy-lab">Zamanlayıcı</p><div class="br-chips">${UY().timers.map(([mn, l]) => `<button type="button" class="chip ${mn === timerMin ? 'on' : ''}" data-uy-timer="${mn}">${K.esc(l)}</button>`).join('')}</div>
          <p class="muted small">Süre seçersen masallar arka arkaya çalar; süre dolunca ses yavaşça kısılır.</p></div>` : ''}
        <div class="row uy-acts">${own ? `<button type="button" class="btn ${rec ? 'soft' : 'red'} small" data-uy-rec="${id}">${A.ui('mic')} ${rec ? 'Yeniden kaydet' : 'Şimdi kaydet'}</button>` : rec ? '' : asked(id).some((r) => r.who === 'her') ? '<span class="muted small">🙏 İstedin; kaydedince haber gelecek.</span>' : `<button type="button" class="btn red small" data-uy-ask="${id}">🙏 ${K.esc(C.myPet)} okusun</button>`}<button type="button" class="btn ghost small" data-uy-dim>🌙 Ekranı kıs</button></div>`,
    });
    player = { id, m, v };
    m.body.addEventListener('click', (e) => {
      if (e.target.closest('[data-uy-play]')) return toggle();
      const tm = e.target.closest('[data-uy-timer]');
      if (tm) {
        timerMin = +tm.dataset.uyTimer;
        K.store.set('uykuTimer', timerMin);
        K.$$('[data-uy-timer]', m.body).forEach((b) => b.classList.toggle('on', b === tm));
        armTimer(true);
        return;
      }
      if (e.target.closest('[data-uy-dim]')) return m.el.classList.toggle('dim');
      const rc = e.target.closest('[data-uy-rec]');
      if (rc) {
        m.close();
        return setTimeout(() => (K.studio ? K.studio(rc.dataset.uyRec) : K.go('panel')), 320);
      }
      const ak = e.target.closest('[data-uy-ask]');
      if (ak) return ask(ak.dataset.uyAsk, ak);
    });
    const bar = K.$('.uy-bar', m.body);
    bar &&
      bar.addEventListener('click', (e) => {
        const a = player && player.audio;
        if (!a || !a.duration) return;
        const r = bar.getBoundingClientRect();
        a.currentTime = K.clamp((e.clientX - r.left) / r.width, 0, 1) * a.duration;
      });
    if (rec) toggle();
  }
  const urls = {};
  async function toggle() {
    if (!player) return;
    const a = player.audio;
    if (a) return a.paused ? a.play().catch(() => {}) : a.pause();
    const btn = K.$('[data-uy-play]', player.m.body);
    player.m.el.classList.add('loading');
    let url = urls[player.id];
    if (!url) {
      try {
        url = urls[player.id] = await K.voice.url(player.id);
      } catch (e) {}
    }
    if (!player) return;
    player.m.el.classList.remove('loading');
    if (!url) return K.fx.toast('Ses şu an açılamadı. İnterneti kontrol et.');
    if (K.audio.music.on) {
      K.audio.music.stop(false);
      player.music = true;
    }
    K.voice && K.voice.stop && K.voice.stop();
    const au = new Audio(url);
    player.audio = au;
    au.addEventListener('play', () => player && player.audio === au && ((btn.innerHTML = A.ui('pause')), player.m.el.classList.add('playing')));
    au.addEventListener('pause', () => player && player.audio === au && ((btn.innerHTML = A.ui('play')), player.m.el.classList.remove('playing')));
    au.addEventListener('ended', () => ended(player && player.v));
    au.play().catch(() => {});
    armTimer(false);
    sync();
  }
  function sync() {
    if (!player || !player.audio) return;
    const a = player.audio, d = a.duration || 0, t = a.currentTime || 0;
    const el = player.m.body;
    K.$('.uy-bar i', el).style.width = d ? (t / d) * 100 + '%' : '0%';
    K.$('.uy-time', el).textContent = d ? `${Math.floor((d - t) / 60)}:${K.pad(Math.floor((d - t) % 60))}` : '0:00';
    const lines = K.$$('.uy-lines p', el);
    const lens = lines.map((p) => p.textContent.length + 14);
    const total = lens.reduce((x, y) => x + y, 0);
    const at = d ? (t / d) * total : 0;
    let acc = 0;
    lines.forEach((p, i) => {
      const on = at >= acc && at < acc + lens[i];
      if (on && !p.classList.contains('on')) p.scrollIntoView({ block: 'center', behavior: K.reduced ? 'auto' : 'smooth' });
      p.classList.toggle('on', on);
      p.classList.toggle('past', at >= acc + lens[i]);
      acc += lens[i];
    });
    player.raf = requestAnimationFrame(sync);
  }
  function ended(v) {
    if (!v || !player || player.v !== v) return;
    const h = heard();
    const first = !h[v.id];
    if (!K.isOwner()) {
      h[v.id] = T.todayKey();
      K.store.set('uykuHeard', h);
      K.stickers.award('uyku');
      if (first) K.ntfyTo('me', `🌙 ${C.herName} "${v.title}" masalını dinledi`, 'Senin sesinle uykuya daldı.', ['crescent_moon'], { priority: 2 });
    }
    // Süre seçildiyse ve dolmadıysa sıradaki masal
    const nx = timerMin && deadline - Date.now() > 20000 ? nextOf(v.id) : null;
    if (nx) {
      const m = player.m;
      setTimeout(() => {
        if (!m.el.isConnected) return;
        chaining = true;
        m.close();
        setTimeout(() => {
          open(nx.id);
          chaining = false;
        }, 380);
      }, 2500);
      return;
    }
    K.fx.toast(`🌙 ${K.esc(K.pick(UY().goodnight || ['İyi uykular.']))}`, { duration: 4000, log: false });
  }
  const nextOf = (id) => {
    const rec = tales().filter((v) => has(v.id));
    const i = rec.findIndex((v) => v.id === id);
    return rec.length > 1 ? rec[(i + 1) % rec.length] : null;
  };
  // Zamanlayıcı: süre dolunca 30 sn'de yavaşça kısılır ve durur (iPhone'da ses seviyesi değişmez; orada doğrudan durur)
  function armTimer(reset) {
    clearTimeout(tm);
    if (!timerMin) return (deadline = 0);
    if (reset || !deadline) deadline = Date.now() + timerMin * 6e4;
    tm = setTimeout(fadeOut, Math.max(0, deadline - Date.now()));
  }
  function fadeOut() {
    deadline = Date.now();
    if (!player || !player.audio) return;
    const a = player.audio;
    const v0 = a.volume;
    let k = 0;
    clearInterval(fadeIv);
    fadeIv = setInterval(() => {
      k++;
      try {
        a.volume = Math.max(0, v0 * (1 - k / 30));
      } catch (e) {}
      if (k >= 30 || a.paused) {
        clearInterval(fadeIv);
        a.pause();
      }
    }, 1000);
  }
  function stop(close) {
    if (!player) return;
    cancelAnimationFrame(player.raf);
    clearInterval(fadeIv);
    if (!chaining) {
      clearTimeout(tm);
      deadline = 0;
    }
    if (player.audio) player.audio.pause();
    if (player.music && !chaining) K.audio.music.start();
    if (close) player = null;
    render();
  }
  async function ask(id, btn) {
    if (!K.cloud || !K.cloud.enabled) return;
    btn.disabled = true;
    const r = await K.cloud.add('masalistek', { id });
    if (!r) return (btn.disabled = false), K.fx.toast('Gönderilemedi.');
    asks.push(r);
    const v = tales().find((x) => x.id === id);
    K.ping(`🙏 ${K.meName()} "${v.title}" masalını senin sesinden dinlemek istiyor`, 'Uyku Masalları → Şimdi kaydet.', ['crescent_moon'], { click: K.roomUrl('uyku') });
    btn.outerHTML = '<span class="muted small">🙏 İstedin; kaydedince haber gelecek.</span>';
    K.fx.toast(`🙏 ${K.esc(C.myPet)} haber aldı.`, { duration: 2500 });
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    asks = await K.cloud.list('masalistek', 200);
    K.cloud.on('masalistek', (r) => {
      if (asks.some((x) => x.id === r.id)) return;
      asks.push(r);
      if (K.isOwner() && r.who === 'her') {
        const v = tales().find((x) => x.id === r.data.id);
        v && K.fx.toast(`🙏 <b>${K.esc(C.herPet)} "${K.esc(v.title)}" masalını senin sesinden istiyor.</b> <a href="#uyku">Kaydet</a>`, { duration: 9000 });
      }
      render();
    });
  });
  // Masal kaydedilince ona haber
  K.on('cloud-voice', (id) => {
    render();
    if (!id || K.isOwner()) return;
    const v = tales().find((x) => x.id === id);
    v && K.fx.toast(`🌙 <b>${K.esc(C.myPet)} "${K.esc(v.title)}" masalını okudu.</b> <a href="#uyku">Dinle</a>`, { duration: 8000 });
  });
  // Gece (kendi saatine göre 21:00–02:00) dinlenmemiş sesli masal varsa ana salonda kart
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (K.isOwner()) {
      const want = tales().filter((v) => !has(v.id) && asked(v.id).some((r) => r.who === 'her'));
      return want.length ? [{ icon: 'moon', title: `🙏 ${C.herPet} ${want.length > 1 ? `${want.length} masalı` : `"${want[0].title}" masalını`} senin sesinden istiyor`, text: 'İki dakika: metni oku, kaydet, onun kalesine düşsün.', room: 'uyku', cta: 'Kaydet' }] : [];
    }
    const h = T.parts(C.tzBaku).h;
    if (!(h >= 21 || h < 2)) return [];
    const t = tonight();
    if (!t || !has(t.id) || heard()[t.id] === T.todayKey()) return [];
    return [{ icon: 'moon', title: `🌙 Bu gecenin masalı: ${t.title}`, text: `${t.uyku.ozet} ${C.myPet}'un sesinden, yaklaşık iki dakika.`, run: () => (K.go('uyku'), setTimeout(() => open(t.id), 600)), cta: 'Dinle' }];
  });
  K.uyku = { open, count: () => tales().filter((v) => has(v.id)).length, total: () => tales().length };

  K.room({
    id: 'uyku',
    wing: 'kalp',
    title: 'Uyku Masalları',
    sub: () => `${C.myPet}'un sesinden on iki masal`,
    icon: 'moon',
    color: '#DCD6F7',
    hidden: () => !tales().length,
    badge: () => {
      if (K.isOwner()) return tales().some((v) => !has(v.id) && asked(v.id).length) ? 'İstek var' : '';
      const n = tales().filter((v) => has(v.id) && !heard()[v.id]).length;
      return n ? `${n} yeni` : '';
    },
    init(el) {
      root = el;
      timerMin = K.store.get('uykuTimer', 0);
      el.innerHTML = `<div class="room-intro">${K.paras(K.isOwner() ? UY().ownerIntro || UY().intro : UY().intro)}</div>
        <section class="uy-head" id="uyHead"></section>
        <div class="uy-shelf-wrap"><div class="uy-shelf" id="uyShelf"></div><div class="uy-plank" aria-hidden="true"></div></div>
        <section class="card uy-owner" id="uyOwner" hidden><p class="card-eyebrow">Kayıt ipuçları</p><p class="muted small">Gece, sessiz bir odada, telefonu ağzına bir karış uzakta tutarak kaydet. Yavaş oku; nefes aralarını bırak. Her masal en fazla dört dakika olabilir. Metni aynen okumak zorunda değilsin.</p></section>`;
      el.addEventListener('click', (e) => {
        const o = e.target.closest('[data-uy-open]');
        if (o) open(o.dataset.uyOpen);
      });
    },
    enter() {
      render();
    },
  });
})();
