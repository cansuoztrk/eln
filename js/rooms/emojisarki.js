/* Oda: Emoji Şarkı — şarkıyı emojilerle anlat, o tahmin etsin. Şarkı Defteri'nden bir şarkı seçilir, birkaç emojiyle
   anlatılır; öbürü dört seçenekten (şarkı azsa yazarak) bulur. Bilinirse ikinize de bir yıldız; sonra şarkı Kale
   Radyosu'nda birlikte açılabilir. Kayıtlar: emojisarki {song, title, artist, emoji} · emojicevap {ref, guess, ok} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const ES = () => D.emojisarki || { intro: [], tips: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const PAL = '❤️ 💔 💗 😍 🥺 😭 😂 🌙 ⭐ ☀️ 🌊 🌧️ ❄️ 🔥 🌹 🌸 🎀 👑 💃 🕺 🎶 🎸 🎹 🏃‍♀️ 💨 👀 👋 🤗 💋 🏠 ✈️ 🚗 🌍 🕰️ 📞 💌 🍷 ☕ 🌃 🌅'.split(' ');

  let rows = [], loaded = false, root = null, pick = null, q = '';
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const songs = () => (K.sarkidefteri ? K.sarkidefteri.songs() : []);
  const puzzles = () => rows.filter((r) => r.kind === 'emojisarki').sort((a, b) => b.at - a.at);
  const answer = (id) => rows.filter((r) => r.kind === 'emojicevap' && r.data.ref === id).sort((a, b) => a.at - b.at).pop() || null;
  const solved = (id) => rows.some((r) => r.kind === 'emojicevap' && r.data.ref === id && r.data.ok);
  const tries = (id) => rows.filter((r) => r.kind === 'emojicevap' && r.data.ref === id).length;
  const open = () => puzzles().filter((r) => r.who === other() && !solved(r.id) && tries(r.id) < 2);
  const label = (s) => `${s.title}${s.artist ? ' · ' + s.artist : ''}`;

  function options(r) {
    const all = songs().filter((s) => s.id !== r.data.song);
    if (all.length < 3) return null;
    const rnd = K.rng(K.hash(r.id));
    const opts = K.shuffle(all, rnd).slice(0, 3).map((s) => ({ id: s.id, t: label(s.data) }));
    opts.push({ id: r.data.song, t: label(r.data) });
    return K.shuffle(opts, rnd);
  }
  function card(r) {
    const a = answer(r.id), ok = solved(r.id), mineP = r.who === mine();
    const n = tries(r.id);
    const reveal = ok || n >= 2 || mineP;
    let body = '';
    if (!mineP && !ok && n < 2) {
      const o = options(r);
      body = o
        ? `<div class="es-opts">${o.map((x) => `<button type="button" class="es-opt" data-es-guess="${r.id}" data-id="${x.id}">${K.esc(x.t)}</button>`).join('')}</div>${n ? '<p class="muted small">Bir hakkın kaldı.</p>' : ''}`
        : `<div class="row"><input class="input" maxlength="60" placeholder="Şarkının adı..." data-es-in="${r.id}"><button type="button" class="btn red small" data-es-write="${r.id}">Tahmin</button></div>`;
    }
    return `<li class="es-card ${ok ? 'ok' : reveal && !mineP ? 'miss' : ''}"><p class="es-emo" aria-label="Emoji ipucu">${K.esc(r.data.emoji)}</p>
      <small>${K.esc(nameOf(r.who))} anlattı · ${K.esc(K.ago(r.at))}</small>
      ${reveal ? `<p class="es-ans">${ok ? '⭐' : mineP ? (a ? (ok ? '⭐' : '🤔') : '⏳') : '🙈'} <b>${K.esc(label(r.data))}</b>${mineP && !ok ? `<small>${a ? `${K.esc(nameOf(other()))} "${K.esc(a.data.guess)}" dedi` : 'henüz tahmin etmedi'}</small>` : ''}</p>` : ''}
      ${body}${reveal && K.radyo && songs().some((s) => s.id === r.data.song) ? `<button type="button" class="btn soft small" data-es-play="${K.esc(r.data.song)}">📻 Radyoda birlikte aç</button>` : ''}</li>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'emojisarki') return;
    const ok = rows.filter((r) => r.kind === 'emojicevap' && r.data.ok).length;
    const by = (w) => puzzles().filter((r) => r.who === w && solved(r.id)).length;
    K.$('#esScore', root).innerHTML = `<span><b class="tnum">${ok}</b><small>birlikte yıldız</small></span><span><b class="tnum">${by('her')}</b><small>${K.esc(nameOf('her'))} anlattı, bilindi</small></span><span><b class="tnum">${by('me')}</b><small>${K.esc(nameOf('me'))} anlattı, bilindi</small></span>`;
    const list = songs().filter((s) => !q || K.norm(label(s.data)).includes(K.norm(q)));
    K.$('#esSongs', root).innerHTML = songs().length
      ? list.slice(0, 40).map((s) => `<button type="button" class="chip ${pick === s.id ? 'on' : ''}" data-es-song="${K.esc(s.id)}">🎵 ${K.esc(label(s.data))}</button>`).join('') || '<p class="muted small">Bulunamadı.</p>'
      : '<p class="muted small">Şarkı Defteri boş. Önce oraya birkaç şarkı ekleyin.</p>';
    const o = open();
    K.$('#esOpen', root).innerHTML = o.length ? `<p class="card-eyebrow">🎧 Sana sorulan ${o.length > 1 ? `${o.length} şarkı` : 'şarkı'}</p><ul class="es-list">${o.map(card).join('')}</ul>` : '';
    K.$('#esOpen', root).hidden = !o.length;
    const past = puzzles().filter((r) => !o.includes(r));
    K.$('#esPast', root).innerHTML = past.length ? `<p class="card-eyebrow">Geçmiş</p><ul class="es-list">${past.slice(0, 30).map(card).join('')}</ul>` : '<p class="muted center">Henüz şarkı anlatılmadı. İlkini sen anlat.</p>';
  }
  async function send(btn) {
    const s = songs().find((x) => x.id === pick);
    const emoji = K.$('#esEmoji', root).value.trim();
    if (!s) return K.fx.toast('Önce bir şarkı seç.');
    if (!emoji || /[A-Za-zÇĞİÖŞÜçğıöşüƏə0-9]/.test(emoji)) return K.fx.toast('Sadece emoji kullan; harf yok!');
    btn.disabled = true;
    const r = await K.cloud.add('emojisarki', { song: s.id, title: s.data.title || '', artist: s.data.artist || '', emoji: [...emoji].slice(0, 24).join('') });
    btn.disabled = false;
    if (!r) return K.fx.toast('Gönderilemedi.');
    push(r);
    pick = null;
    K.$('#esEmoji', root).value = '';
    K.audio.sfx.whoosh();
    K.fx.toast('🎶 Gönderildi. Bakalım bilecek mi?');
    K.ping(`🎶 ${K.meName()} bir şarkıyı emojilerle anlattı`, r.data.emoji, ['notes'], { click: K.roomUrl('emojisarki') });
    render();
  }
  async function guess(id, gid, text) {
    const r = rows.find((x) => x.id === id);
    if (!r || solved(id) || tries(id) >= 2) return;
    const ok = gid ? gid === r.data.song : K.lev(K.norm(text), K.norm(r.data.title)) <= Math.max(1, Math.floor(r.data.title.length / 6));
    const g = gid ? (songs().find((s) => s.id === gid) || { data: { title: gid } }).data.title : text;
    const a = await K.cloud.add('emojicevap', { ref: id, guess: String(g || '').slice(0, 60), ok });
    push(a);
    if (ok) {
      K.fx.confetti({ count: 90 });
      K.audio.sfx.success();
      K.stickers.award('emojisarki');
      K.ping(`⭐ ${K.meName()} şarkını bildi!`, `${r.data.emoji} = ${r.data.title}`, ['star'], { click: K.roomUrl('emojisarki'), priority: 3 });
    } else {
      K.audio.sfx.fail();
      K.fx.toast(tries(id) >= 2 ? `Olmadı. Doğrusu: ${K.esc(r.data.title)}` : 'Olmadı! Bir hakkın daha var.');
      if (tries(id) >= 2) K.ping(`🙈 ${K.meName()} şarkını bilemedi`, `${r.data.emoji} · "${g}" dedi`, ['see_no_evil'], { click: K.roomUrl('emojisarki'), priority: 2 });
    }
    render();
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(['emojisarki', 'emojicevap'], { limit: 1500 });
    loaded = true;
    ['emojisarki', 'emojicevap'].forEach((k) =>
      K.cloud.on(k, (r) => {
        if (!push(r)) return;
        render();
        K.renderSpecials && !K.activeRoom && K.renderSpecials();
      })
    );
    render();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !D.emojisarki) return [];
    const o = open();
    return o.length ? [{ icon: 'music', title: `🎶 ${nameOf(other())} bir şarkıyı emojilerle anlattı`, text: `${o[0].data.emoji}  · Hangi şarkı?`, room: 'emojisarki', cta: 'Tahmin et' }] : [];
  });

  K.room({
    id: 'emojisarki',
    wing: 'oyun',
    title: 'Emoji Şarkı',
    sub: 'Şarkıyı emojilerle anlat',
    icon: 'music',
    color: '#FFF0D9',
    hidden: () => !D.emojisarki || !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && open().length ? String(open().length) : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(ES().intro || [])}</div>
        <div class="es-score" id="esScore"></div>
        <section class="card es-ask" id="esOpen" hidden></section>
        <section class="card es-new"><p class="card-eyebrow">Sen anlat</p>
          <input class="input" id="esQ" placeholder="🔎 Şarkı ara">
          <div class="es-songs" id="esSongs"></div>
          <input class="input es-in" id="esEmoji" maxlength="60" placeholder="${K.esc((ES().tips || ['🌙🌊💔'])[0])}" inputmode="text">
          <div class="es-pal">${PAL.map((e) => `<button type="button" data-es-e="${e}">${e}</button>`).join('')}<button type="button" class="wide" data-es-e="⌫">⌫</button></div>
          <button type="button" class="btn red" data-es-send>${A.ui('send')} Gönder</button></section>
        <section class="card es-pastcard" id="esPast"></section>`;
      el.addEventListener('input', (e) => {
        if (e.target.id === 'esQ') {
          q = e.target.value;
          render();
          K.$('#esQ', root).focus();
        }
      });
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-es-song]');
        if (s) return (pick = pick === s.dataset.esSong ? null : s.dataset.esSong), render();
        const em = e.target.closest('[data-es-e]');
        if (em) {
          const inp = K.$('#esEmoji', root);
          inp.value = em.dataset.esE === '⌫' ? [...inp.value].slice(0, -1).join('').replace(/‍$|️$/u, '') : inp.value + em.dataset.esE;
          return;
        }
        if (e.target.closest('[data-es-send]')) return send(e.target.closest('[data-es-send]'));
        const g = e.target.closest('[data-es-guess]');
        if (g) {
          K.$$(`[data-es-guess="${g.dataset.esGuess}"]`, root).forEach((b) => (b.disabled = true));
          return guess(g.dataset.esGuess, g.dataset.id);
        }
        const w = e.target.closest('[data-es-write]');
        if (w) {
          const v = K.$(`[data-es-in="${w.dataset.esWrite}"]`, root).value.trim();
          if (v) guess(w.dataset.esWrite, null, v);
          return;
        }
        const p = e.target.closest('[data-es-play]');
        if (p) {
          K.radyo.start(p.dataset.esPlay);
          K.go('radyo');
        }
      });
    },
    enter() {
      render();
    },
  });
})();
