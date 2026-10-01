/* Oda: Kale Radyosu — aynı şarkıyı aynı saniyede dinlemek. Biri bir şarkı açar; kayıt "şu şarkı şu anda başladı" der,
   öbürü odaya girince şarkı onda da ortak saate göre tam kaldığı yerden çalar. Şarkı bitince sıradaki başlar.
   Liste: Şarkı Defteri'nde bağlantısı olan bütün şarkılar. Tepkiler (❤️ 🥹 🎶 💃) iki ekranda da uçar.
   Kayıt: radyo {sid, song, at, state} (son kayıt geçerli) · canlı: radyo {t: 'tepki', r} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const RY = () => D.radyo || { intro: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const MAXLEN = 12 * 6e4;
  const REACTS = ['❤️', '🥹', '🎶', '💃', '😍'];

  let root, rows = [], pk = null, playingAt = 0, advancing = false;

  const list = () => (K.sarkidefteri ? K.sarkidefteri.songs() : []);
  const state = () => rows.slice().sort((a, b) => a.at - b.at).pop();
  const live = () => {
    const s = state();
    return s && s.data.state === 'play' && Date.now() - s.data.at < MAXLEN ? s : null;
  };
  const pos = () => {
    const s = live();
    return s ? Math.max(0, (Date.now() - s.data.at) / 1000) : 0;
  };

  function render() {
    if (!root) return;
    const s = live();
    const o = other();
    const w = K.yan && K.yan.where();
    const together = w && w.room === 'radyo';
    K.$('#ryNow', root).innerHTML = s
      ? `<div class="ry-disc spin" aria-hidden="true"><span></span></div><div class="ry-meta"><p class="card-eyebrow">Şimdi çalıyor · ${K.esc(nameOf(s.who))} açtı</p><h3>${K.esc(s.data.song.title)}</h3><p class="ry-artist">${K.esc(s.data.song.artist || '')}</p>
        <p class="ry-with">${together ? `<span class="dot on"></span>${K.esc(nameOf(o))} da şu an dinliyor` : `${K.esc(nameOf(o))} odaya girince onda da buradan çalar`}</p>
        <div class="row"><button type="button" class="btn soft small" data-ry-next>${A.ui('next')} Sıradaki</button><button type="button" class="btn ghost small" data-ry-stop>${A.ui('pause')} Durdur</button></div></div>`
      : `<div class="ry-disc" aria-hidden="true"><span></span></div><div class="ry-meta"><p class="card-eyebrow">Radyo sessiz</p><h3>Bir şarkı aç</h3><p class="muted">Aşağıdan bir şarkı seç; ${K.esc(nameOf(o))} girince onda da aynı saniyeden çalar.</p></div>`;
    K.$('#ryReacts', root).hidden = !s;
    const songs = list();
    K.$('#ryList', root).innerHTML = songs.length
      ? songs
          .map((x) => {
            const cur = s && s.data.sid === x.id;
            return `<li class="${cur ? 'on' : ''}"><button type="button" data-ry-play="${K.esc(x.id)}" aria-label="${K.esc(x.data.title)} çal">${A.ui(cur ? 'music' : 'play')}</button><div><b>${K.esc(x.data.title)}</b><span>${K.esc(x.data.artist || '')}</span></div><small>${K.esc(nameOf(x.who || 'me'))}</small></li>`;
          })
          .join('')
      : `<li class="empty">${K.esc(RY().empty || '')} <a href="#sarkidefteri">Şarkı Defteri</a></li>`;
  }
  // Oynatıcıyı ortak duruma göre kur
  function sync() {
    if (!root || K.activeRoom !== 'radyo') return;
    const s = live();
    const tv = K.$('#ryTv', root);
    if (!s) {
      if (pk) pk.stop();
      pk = null;
      playingAt = 0;
      tv.hidden = true;
      return render();
    }
    if (playingAt === s.data.at && pk) return render();
    if (pk) pk.stop();
    playingAt = s.data.at;
    tv.hidden = false;
    pk = K.pikap.mount(tv, s.data.song, { sync: pos, onEnd: () => ended(s) });
    render();
  }
  async function start(id) {
    const x = list().find((q) => q.id === id);
    if (!x) return;
    const r = await K.cloud.add('radyo', { sid: x.id, song: x.song, at: Date.now(), state: 'play' });
    if (!r) return K.fx.toast('Radyo açılamadı. İnternet bağlantını kontrol et.');
    if (!rows.some((q) => q.id === r.id)) rows.push(r);
    K.audio.sfx.tap();
    K.stickers.award('radyo');
    if (!advancing) K.ping(`${K.meName()} Kale Radyosu'nda bir şarkı açtı`, `${x.data.title} · ${x.data.artist || ''}`, ['radio'], { click: K.roomUrl('radyo') });
    sync();
  }
  function nextOf(sid) {
    const l = list();
    const i = l.findIndex((q) => q.id === sid);
    return l.length ? l[(i + 1) % l.length] : null;
  }
  async function ended(s) {
    // Şarkı bitti: son durumu yazan (ya da o yoksa dinleyen) sıradakini açar
    const cur = state();
    if (advancing || !cur || cur.id !== s.id) return;
    if (cur.who !== mine() && K.yan && K.yan.where() && K.yan.where().room === 'radyo') return;
    advancing = true;
    const n = nextOf(s.data.sid);
    if (n) await start(n.id);
    advancing = false;
  }
  async function stop() {
    const r = await K.cloud.add('radyo', { sid: '', song: null, at: Date.now(), state: 'stop' });
    if (r && !rows.some((q) => q.id === r.id)) rows.push(r);
    sync();
  }
  function float(r) {
    const box = K.$('#ryFly', root);
    if (!box) return;
    const el = K.el(`<i style="--x:${10 + Math.random() * 80}%">${r}</i>`);
    box.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('radyo', 20);
    K.cloud.on('radyo', (r) => {
      if (rows.some((q) => q.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine() && r.data.state === 'play' && K.activeRoom !== 'radyo') K.fx.toast(`<b>${K.esc(nameOf(r.who))} Kale Radyosu'nda bir şarkı açtı:</b> ${K.esc(r.data.song.title)}. <a href="#radyo">Birlikte dinle</a>`, { icon: A.icon('vinyl'), duration: 9000 });
      if (K.activeRoom === 'radyo') sync();
      else K.renderSpecials && K.renderSpecials();
    });
    K.cloud.onLive('radyo', (m) => {
      if (m.who === mine() || K.activeRoom !== 'radyo') return;
      if (m.t === 'tepki') float(m.r);
    });
  });
  K.on('presence', () => K.activeRoom === 'radyo' && render());
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const s = live();
    return s && s.who === other() ? [{ icon: 'vinyl', title: `${nameOf(s.who)} şu an radyoda: ${s.data.song.title}`, text: `${s.data.song.artist || ''}. Girersen sende de aynı saniyeden çalar.`, room: 'radyo', cta: 'Birlikte dinle' }] : [];
  });
  K.radyo = { live, start };

  K.room({
    id: 'radyo',
    wing: 'oyun',
    title: 'Kale Radyosu',
    sub: 'Aynı şarkı, aynı saniye',
    icon: 'vinyl',
    color: '#E9E0FF',
    hidden: () => !D.radyo || !K.cloud || !K.cloud.enabled,
    badge: () => (live() ? 'Çalıyor' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(RY().intro)}</div>
        <section class="card ry-now" id="ryNow"></section>
        <div class="ry-tv pk" id="ryTv" hidden></div>
        <div class="ry-reacts" id="ryReacts" hidden>${REACTS.map((r) => `<button type="button" data-ry-r="${r}">${r}</button>`).join('')}<div class="ry-fly" id="ryFly" aria-hidden="true"></div></div>
        <section class="card"><p class="card-eyebrow">Liste · Şarkı Defteri</p><ul class="ry-list" id="ryList"></ul>
          <form class="ry-add" id="ryAdd" autocomplete="off"><p class="card-eyebrow">Listeye şarkı ekle</p>
            <input class="input" name="t" maxlength="80" placeholder="Şarkının adı"><input class="input" name="a" maxlength="60" placeholder="Sanatçı">
            <input class="input" name="y" maxlength="200" placeholder="YouTube bağlantısı (Paylaş → Bağlantıyı kopyala)">
            <button class="btn red small" type="submit">${A.ui('plus')} Ekle</button></form></section>`;
      el.addEventListener('submit', async (e) => {
        if (!e.target.closest('#ryAdd')) return;
        e.preventDefault();
        const f = e.target;
        const title = f.t.value.trim(), artist = f.a.value.trim(), yt = K.pikap.idOf(f.y.value);
        if (!title || !yt) return K.fx.toast(!title ? 'Şarkının adını yaz.' : 'Bu bir YouTube bağlantısına benzemiyor.');
        const r = await K.cloud.add('song', { title, artist: artist || '', note: '', yt });
        if (!r) return K.fx.toast('Eklenemedi. İnterneti kontrol et.');
        f.reset();
        K.audio.sfx.chime();
        K.fx.toast(`<b>${K.esc(title)}</b> listeye ve Şarkı Defteri'ne eklendi.`, { icon: A.icon('vinyl') });
        setTimeout(render, 300);
      });
      el.addEventListener('click', (e) => {
        const p = e.target.closest('[data-ry-play]');
        if (p) return start(p.dataset.ryPlay);
        if (e.target.closest('[data-ry-next]')) {
          const s = live();
          const n = s && nextOf(s.data.sid);
          return n && start(n.id);
        }
        if (e.target.closest('[data-ry-stop]')) return stop();
        const r = e.target.closest('[data-ry-r]');
        if (r) {
          float(r.dataset.ryR);
          K.cloud.send('radyo', { t: 'tepki', r: r.dataset.ryR });
        }
      });
    },
    enter() {
      sync();
      render();
    },
    leave() {
      if (pk) pk.stop();
      pk = null;
      playingAt = 0;
      const tv = root && K.$('#ryTv', root);
      if (tv) tv.hidden = true;
    },
  });
})();
