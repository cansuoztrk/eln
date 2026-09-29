/* Oda: Şarkı Defteri — ortak çalma listesi. Bir şarkı birini hatırlatınca adı, sanatçısı ve "neden"i yazılır.
   Her gün bir şarkı "bugünün şarkısı" olur; şarkılar YouTube ve Spotify aramasıyla açılır (dosya yok). Bulutla iki yönlü. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [];
  const SD = () => D.sarkidefteri || { intro: [], seed: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const songs = () => SD().seed.map((s, i) => ({ id: 's' + i, at: 0, who: s.who, data: s })).concat(rows);
  const q = (s) => encodeURIComponent(`${s.artist} ${s.title}`);
  const yt = (s) => `https://www.youtube.com/results?search_query=${q(s)}`;
  const sp = (s) => `https://open.spotify.com/search/${q(s)}`;
  const COL = ['#FF8FB8', '#8FD3FF', '#FFD34E', '#C9B6FF', '#7ED6A5', '#FFB38A'];

  function render() {
    if (!root) return;
    const list = songs();
    const today = list.length ? list[T.dayNumber(T.now()) % list.length] : null;
    K.$('#sdToday', root).innerHTML = today
      ? `<div class="sd-disc" aria-hidden="true"><span></span></div><div><p class="card-eyebrow">Bugünün şarkısı</p><h3>${K.esc(today.data.title)}</h3><p class="sd-artist">${K.esc(today.data.artist)}</p>${today.data.note ? `<p class="hand">"${K.esc(today.data.note)}" <small>— ${K.esc(nameOf(today.who))}</small></p>` : ''}
        <div class="actions"><a class="btn red small" href="${yt(today.data)}" target="_blank" rel="noopener">${A.ui('play')} YouTube</a><a class="btn soft small" href="${sp(today.data)}" target="_blank" rel="noopener">Spotify</a></div></div>`
      : '';
    K.$('#sdList', root).innerHTML = list
      .slice()
      .reverse()
      .map((s, i) => `<li class="${s.who}" style="--c:${COL[i % COL.length]}"><span class="sd-sp" aria-hidden="true"></span><div><b>${K.esc(s.data.title)}</b><span>${K.esc(s.data.artist)}</span>${s.data.note ? `<p class="hand">${K.esc(s.data.note)}</p>` : ''}<small>${K.esc(nameOf(s.who))}${s.at ? ` · ${T.fmtShort(new Date(s.at))}` : ''}</small></div>
        <div class="sd-links"><a href="${yt(s.data)}" target="_blank" rel="noopener" aria-label="YouTube'da aç">${A.ui('play')}</a>${s.who === mine() && s.at ? `<button class="wn-x" data-del="${s.id}" aria-label="Sil">${A.ui('close')}</button>` : ''}</div></li>`)
      .join('');
    const by = { her: 0, me: 0 };
    list.forEach((s) => by[s.who]++);
    K.$('#sdCount', root).textContent = `${list.length} şarkı · ${C.herPet} ${by.her} · ${C.myPet} ${by.me}`;
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    rows = await K.cloud.list('song');
    K.cloud.on('song', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} bir şarkı ekledi:</b> ${K.esc(r.data.artist)} · ${K.esc(r.data.title)}`, { icon: A.icon('music') });
      if (K.activeRoom === 'sarkidefteri') render();
    });
    K.cloud.on('deleted', ({ id }) => {
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'sarkidefteri') render();
    });
  });

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
        <form class="card sd-form" id="sdForm" autocomplete="off">
          <p class="card-eyebrow">Bir şarkı ekle</p>
          <div class="row"><input class="input" id="sdTitle" name="sdTitle" maxlength="80" placeholder="Şarkının adı"><input class="input" id="sdArtist" name="sdArtist" maxlength="60" placeholder="Sanatçı"></div>
          <input class="input" id="sdNote" name="sdNote" maxlength="160" placeholder="Neden bu şarkı? (ör. Şu satırda seni düşündüm)">
          <button class="btn red small" type="submit">${A.ui('plus')} Deftere yaz</button>
        </form>
        <p class="muted small" id="sdCount"></p>
        <ul class="sd-list" id="sdList"></ul>`;
      K.$('#sdForm', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = K.$('#sdTitle', el).value.trim();
        const artist = K.$('#sdArtist', el).value.trim();
        if (!title || !artist) return K.fx.toast('Şarkının adı ve sanatçısı gerekli.');
        const r = await K.cloud.add('song', { title, artist, note: K.$('#sdNote', el).value.trim() });
        if (!r) return K.fx.toast('Eklenemedi. İnterneti kontrol et.');
        ['sdTitle', 'sdArtist', 'sdNote'].forEach((id) => (K.$('#' + id, el).value = ''));
        K.audio.sfx.chime();
        if (!K.isOwner()) K.notify(`${C.herName} şarkı defterine yazdı`, `${artist} · ${title}${r.data.note ? `: ${r.data.note}` : ''}`, ['musical_note']);
        render();
      });
      el.addEventListener('click', async (e) => {
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
  });
})();
