/* Oda: Şarkı Defteri — ortak çalma listesi. Bir şarkı birini hatırlatınca adı, sanatçısı ve "neden"i yazılır.
   Her gün bir şarkı "bugünün şarkısı" olur. Şarkılar defterin içindeki küçük ekranda çalar (YouTube'a gitmez);
   bunun için şarkıya bir YouTube bağlantısı yapıştırılır (eklerken ya da sonradan). Bulutla iki yönlü. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [], links = [], pk = null, playingId = null, linking = null;
  const SD = () => D.sarkidefteri || { intro: [], seed: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  // Hazır şarkılar bizim iki şarkımızsa kimliklerini ayarlardan al
  const known = (s) => [C.song, C.song2].find((x) => x && K.norm(x.title || '') === K.norm(s.title || ''));
  const songs = () =>
    SD()
      .seed.map((s, i) => ({ id: 's' + i, at: 0, who: s.who, data: s }))
      .concat(rows)
      .map((s) => {
        const l = links.filter((x) => x.data.song === s.id).pop();
        const k = known(s.data);
        const song = Object.assign({}, s.data, k ? { youtube: k.youtube, alt: k.alt } : {}, l ? { yt: l.data.yt } : {});
        return Object.assign({}, s, { song, playable: K.pikap.idsOf(song).length > 0 });
      });
  const COL = ['#FF8FB8', '#8FD3FF', '#FFD34E', '#C9B6FF', '#7ED6A5', '#FFB38A'];

  function render() {
    if (!root) return;
    const list = songs();
    const today = list.length ? list[T.dayNumber(T.now()) % list.length] : null;
    K.$('#sdToday', root).innerHTML = today
      ? `<div class="sd-disc ${playingId === today.id ? 'spin' : ''}" aria-hidden="true"><span></span></div><div><p class="card-eyebrow">Bugünün şarkısı</p><h3>${K.esc(today.data.title)}</h3><p class="sd-artist">${K.esc(today.data.artist)}</p>${today.data.note ? `<p class="hand">"${K.esc(today.data.note)}" <small>— ${K.esc(nameOf(today.who))}</small></p>` : ''}
        <div class="actions">${today.playable ? `<button type="button" class="btn red small" data-play="${today.id}">${A.ui(playingId === today.id ? 'pause' : 'play')} ${playingId === today.id ? 'Durdur' : 'Burada çal'}</button>` : `<button type="button" class="btn soft small" data-link="${today.id}">${A.ui('plus')} Bağlantı ekle</button>`}</div></div>`
      : '';
    K.$('#sdList', root).innerHTML = list
      .slice()
      .reverse()
      .map(
        (s, i) => `<li class="${s.who} ${playingId === s.id ? 'on' : ''}" style="--c:${COL[i % COL.length]}"><span class="sd-sp" aria-hidden="true"></span><div><b>${K.esc(s.data.title)}</b><span>${K.esc(s.data.artist)}</span>${s.data.note ? `<p class="hand">${K.esc(s.data.note)}</p>` : ''}<small>${K.esc(nameOf(s.who))}${s.at ? ` · ${T.fmtShort(new Date(s.at))}` : ''}</small>
          ${linking === s.id ? `<form class="sd-linkf" data-linkform="${s.id}" autocomplete="off"><input class="input" name="sdLink" placeholder="YouTube bağlantısını yapıştır" aria-label="YouTube bağlantısı"><button class="btn small" type="submit">${A.ui('check')} Kaydet</button></form>` : ''}</div>
        <div class="sd-links">${s.playable ? `<button type="button" data-play="${s.id}" aria-label="${playingId === s.id ? 'Durdur' : 'Burada çal'}">${A.ui(playingId === s.id ? 'pause' : 'play')}</button>` : `<button type="button" data-link="${s.id}" aria-label="Bağlantı ekle">${A.ui('plus')}</button>`}${s.who === mine() && s.at ? `<button class="wn-x" data-del="${s.id}" aria-label="Sil">${A.ui('close')}</button>` : ''}</div></li>`
      )
      .join('');
    const by = { her: 0, me: 0 };
    list.forEach((s) => by[s.who]++);
    K.$('#sdCount', root).textContent = `${list.length} şarkı · ${C.herPet} ${by.her} · ${C.myPet} ${by.me}`;
  }
  function play(id) {
    const tv = K.$('#sdTv', root);
    if (pk) {
      pk.stop();
      pk = null;
    }
    if (!id || playingId === id) {
      playingId = null;
      tv.hidden = true;
      return render();
    }
    const s = songs().find((x) => x.id === id);
    if (!s || !s.playable) return;
    playingId = id;
    tv.hidden = false;
    K.$('#sdTvTitle', tv).textContent = `${s.data.artist} · ${s.data.title}`;
    pk = K.pikap.mount(K.$('#sdTvScreen', tv), s.song, { onEnd: () => play(null) });
    render();
    tv.scrollIntoView({ block: 'nearest', behavior: K.reduced ? 'auto' : 'smooth' });
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    const [a, b] = await Promise.all([K.cloud.list('song'), K.cloud.list('songlink')]);
    rows = a;
    links = b;
    K.cloud.on('song', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} bir şarkı ekledi:</b> ${K.esc(r.data.artist)} · ${K.esc(r.data.title)}`, { icon: A.icon('music') });
      if (K.activeRoom === 'sarkidefteri') render();
    });
    K.cloud.on('songlink', (r) => {
      if (links.some((x) => x.id === r.id)) return;
      links.push(r);
      if (K.activeRoom === 'sarkidefteri') render();
    });
    K.cloud.on('deleted', ({ id }) => {
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'sarkidefteri') render();
    });
  });

  // Kale Radyosu için: çalınabilen bütün şarkılar
  K.sarkidefteri = { songs: () => songs().filter((s) => s.playable) };

  K.room({
    id: 'sarkidefteri',
    wing: 'anilar',
    title: 'Şarkı Defteri',
    sub: 'Seni hatırlatan şarkılar',
    icon: 'music',
    color: '#EDE3FF',
    hidden: () => !D.sarkidefteri || !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(SD().intro)}</div>
        <section class="card sd-today" id="sdToday"></section>
        <section class="card sd-tv" id="sdTv" hidden><div class="sd-tv-top"><p class="card-eyebrow">Şimdi çalıyor</p><b id="sdTvTitle"></b><button type="button" class="btn ghost small" data-play-stop>${A.ui('pause')} Durdur</button></div><div id="sdTvScreen"></div></section>
        <form class="card sd-form" id="sdForm" autocomplete="off">
          <p class="card-eyebrow">Bir şarkı ekle</p>
          <div class="row"><input class="input" id="sdTitle" name="sdTitle" maxlength="80" placeholder="Şarkının adı"><input class="input" id="sdArtist" name="sdArtist" maxlength="60" placeholder="Sanatçı"></div>
          <input class="input" id="sdNote" name="sdNote" maxlength="160" placeholder="Neden bu şarkı? (ör. Şu satırda seni düşündüm)">
          <input class="input" id="sdYt" name="sdYt" maxlength="200" placeholder="YouTube bağlantısı (şarkı burada çalsın diye)">
          <p class="muted small">Bağlantıyı almak için: YouTube'da şarkıyı aç → Paylaş → Bağlantıyı kopyala → buraya yapıştır. Şarkı sonra hep bu defterin içinde çalar.</p>
          <button class="btn red small" type="submit">${A.ui('plus')} Deftere yaz</button>
        </form>
        <p class="muted small" id="sdCount"></p>
        <ul class="sd-list" id="sdList"></ul>`;
      K.$('#sdForm', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = K.$('#sdTitle', el).value.trim();
        const artist = K.$('#sdArtist', el).value.trim();
        const raw = K.$('#sdYt', el).value.trim();
        const yt = K.pikap.idOf(raw);
        if (!title || !artist) return K.fx.toast('Şarkının adı ve sanatçısı gerekli.');
        if (raw && !yt) return K.fx.toast('Bu bir YouTube bağlantısına benzemiyor. Paylaş → Bağlantıyı kopyala ile dene.');
        const r = await K.cloud.add('song', { title, artist, note: K.$('#sdNote', el).value.trim(), yt });
        if (!r) return K.fx.toast('Eklenemedi. İnterneti kontrol et.');
        ['sdTitle', 'sdArtist', 'sdNote', 'sdYt'].forEach((id) => (K.$('#' + id, el).value = ''));
        K.audio.sfx.chime();
        if (!K.isOwner()) K.notify(`${C.herName} şarkı defterine yazdı`, `${artist} · ${title}${r.data.note ? `: ${r.data.note}` : ''}`, ['musical_note']);
        render();
      });
      el.addEventListener('submit', async (e) => {
        const f = e.target.closest('[data-linkform]');
        if (!f) return;
        e.preventDefault();
        const yt = K.pikap.idOf(new FormData(f).get('sdLink'));
        if (!yt) return K.fx.toast('Bu bir YouTube bağlantısına benzemiyor.');
        const r = await K.cloud.add('songlink', { song: f.dataset.linkform, yt });
        if (!r) return K.fx.toast('Kaydedilemedi.');
        const id = f.dataset.linkform;
        linking = null;
        render();
        play(id);
      });
      el.addEventListener('click', async (e) => {
        const p = e.target.closest('[data-play]');
        if (p) return play(p.dataset.play);
        if (e.target.closest('[data-play-stop]')) return play(null);
        const l = e.target.closest('[data-link]');
        if (l) {
          linking = linking === l.dataset.link ? null : l.dataset.link;
          render();
          const inp = K.$('[data-linkform] input', root);
          inp && inp.focus();
          return;
        }
        const d = e.target.closest('[data-del]');
        if (!d) return;
        if (d.dataset.armed !== '1') {
          d.dataset.armed = '1';
          d.classList.add('armed');
          return;
        }
        await K.cloud.remove(d.dataset.del);
        render();
      });
    },
    enter() {
      render();
    },
    leave() {
      if (pk) {
        pk.stop();
        pk = null;
      }
      playingId = null;
      const tv = root && K.$('#sdTv', root);
      if (tv) tv.hidden = true;
    },
  });
})();
