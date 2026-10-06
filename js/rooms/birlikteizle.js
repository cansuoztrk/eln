/* Oda: Birlikte İzle (Film Gecesi Senkronu) — bir YouTube bağlantısı yapıştır; video iki telefonda aynı saniyede oynar.
   Biri oynatınca, durdurunca ya da ileri sarınca öbüründe de olur; beş saniyede bir saatler karşılaştırılır, bir
   saniyeden fazla kayma düzeltilir. Ekranın altında tepkiler (😂 😭 😍 😱 💗) iki ekranda da uçuşur.
   Kayıtlar: izle {vid, title} (açılan video; öbürü sonradan girince aynı videoya katılır). Canlı: izle (komutlar) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const TEPKI = ['😂', '😭', '😍', '😱', '💗', '🍿'];
  let rows = [], root = null, player = null, vid = '', ready = false, applying = 0, tick = 0, seq = 0;
  const now = () => Date.now();
  const cur = () => rows.slice().sort((a, b) => a.at - b.at).pop() || null;
  const send = (m) => K.cloud && K.cloud.send && K.cloud.send('izle', Object.assign({ vid }, m));
  const pos = () => {
    try {
      return player && player.getCurrentTime ? player.getCurrentTime() : 0;
    } catch (e) {
      return 0;
    }
  };
  const playing = () => {
    try {
      return player && player.getPlayerState && player.getPlayerState() === 1;
    } catch (e) {
      return false;
    }
  };
  async function load(id, autoplay) {
    if (!root) return;
    vid = id;
    ready = false;
    const box = K.$('#izEkran', root);
    const fid = 'izf' + ++seq;
    box.innerHTML = `<div class="iz-ekran"><iframe id="${fid}" src="https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(location.origin)}" title="Birlikte izle" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><p class="muted small center">İlk seferde videoya bir kez dokun; sonra ikiniz için de birlikte oynar.</p>`;
    if (K.audio.music.on) K.audio.music.stop(false);
    const YT = K.pikap && (await K.pikap.api());
    if (!YT || !document.getElementById(fid)) return (K.$('#izDurum', root).textContent = 'YouTube yüklenemedi; internetini kontrol et.');
    player = new YT.Player(fid, {
      events: {
        onReady: () => {
          ready = true;
          autoplay && safe(() => player.playVideo());
          status();
        },
        onStateChange: (e) => {
          status();
          if (applying > now()) return;
          if (e.data === 1) send({ t: 'oynat', at: pos(), ts: now() });
          if (e.data === 2) send({ t: 'dur', at: pos(), ts: now() });
        },
      },
    });
  }
  const safe = (fn) => {
    try {
      fn();
    } catch (e) {}
  };
  function apply(m) {
    if (!player || !ready || m.vid !== vid) return;
    applying = now() + 900;
    const lag = Math.max(0, (now() - (m.ts || now())) / 1000);
    if (m.t === 'oynat') {
      safe(() => player.seekTo(m.at + lag, true));
      safe(() => player.playVideo());
    } else if (m.t === 'dur') {
      safe(() => player.pauseVideo());
      safe(() => player.seekTo(m.at, true));
    } else if (m.t === 'zaman') {
      const want = m.at + (m.playing ? lag : 0);
      if (Math.abs(pos() - want) > 1.2) safe(() => player.seekTo(want, true));
      if (m.playing && !playing()) safe(() => player.playVideo());
      if (!m.playing && playing()) safe(() => player.pauseVideo());
    }
    status();
  }
  function status() {
    const el = K.$('#izDurum', root);
    if (!el) return;
    const here = K.cloud && K.cloud.otherHere && K.cloud.otherHere();
    el.textContent = !vid ? 'Bir video bağlantısı yapıştır.' : here ? `🍿 ${nameOf(other())} da kalede; aynı saniyedesiniz.` : `${nameOf(other())} gelince aynı yerden katılır.`;
  }
  function react(e, who) {
    const el = K.el(`<span class="iz-tepki ${who === mine() ? 'ben' : 'o'}" style="left:${10 + Math.random() * 80}%">${e}</span>`);
    (K.$('#izSahne', root) || document.body).appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
  function render() {
    if (!root || K.activeRoom !== 'birlikteizle') return;
    const c = cur();
    if (c && c.data.vid !== vid) load(c.data.vid, false);
    K.$('#izBaslik', root).textContent = c ? c.data.title || 'Birlikte izliyoruz' : '';
    status();
  }
  async function open(btn) {
    const inp = K.$('#izLink', root);
    const id = K.pikap ? K.pikap.idOf(inp.value) : '';
    if (!id) return K.fx.toast('Bir YouTube bağlantısı yapıştır (youtube.com/watch?v=... ya da youtu.be/...).', { duration: 3000 });
    btn.disabled = true;
    const title = (K.$('#izAd', root).value || '').trim().slice(0, 60);
    const r = await K.cloud.add('izle', { vid: id, title });
    btn.disabled = false;
    if (!r) return K.fx.toast('Açılamadı.');
    rows.push(r);
    inp.value = '';
    K.$('#izBaslik', root).textContent = title || 'Birlikte izliyoruz';
    load(id, true);
    K.stickers.award('birlikteizle');
    send({ t: 'yukle', title });
    K.ping(`🍿 ${K.meName()} birlikte izlemek için bir video açtı`, title || 'Gel, aynı saniyede başlayalım.', ['popcorn'], { click: K.roomUrl('birlikteizle') });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('izle', 50);
    K.cloud.on('izle', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.onLive('izle', (m) => {
      if (m.who === mine()) return;
      if (m.t === 'tepki') return K.activeRoom === 'birlikteizle' && react(m.e, m.who);
      if (m.t === 'yukle') {
        if (K.activeRoom === 'birlikteizle') return m.vid !== vid && load(m.vid, false);
        return K.fx.toast(`🍿 ${K.esc(nameOf(m.who))} birlikte izlemek için bir video açtı. <a href="#birlikteizle">Katıl</a>`, { duration: 8000 });
      }
      if (m.t === 'sor' && player && ready && m.vid === vid) return send({ t: 'zaman', at: pos(), ts: now(), playing: playing() });
      apply(m);
    });
  });
  K.room({
    id: 'birlikteizle',
    wing: 'kalp',
    title: 'Birlikte İzle',
    sub: 'Aynı video, aynı saniye',
    icon: 'film',
    color: '#E9E4FF',
    hidden: () => !K.cloud || !K.cloud.enabled || !K.pikap,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bir YouTube bağlantısı yapıştır: video iki telefonda aynı saniyede oynar. Biri durdurunca öbüründe de durur, ileri sarınca o da sarar. Tepkiler iki ekranda da uçuşur.</p></div>
        <section class="card iz-kart" id="izSahne"><p class="iz-baslik" id="izBaslik"></p><div id="izEkran"></div><p class="muted small center" id="izDurum"></p>
          <div class="iz-tepkiler">${TEPKI.map((t) => `<button type="button" data-iz-t="${t}">${t}</button>`).join('')}</div></section>
        <section class="card iz-ac"><p class="card-eyebrow">Yeni video</p><input class="input" id="izLink" inputmode="url" placeholder="YouTube bağlantısı"><input class="input" id="izAd" maxlength="60" placeholder="Ne izliyoruz? (istersen)"><div class="row"><button type="button" class="btn red" data-iz-ac>🍿 Birlikte aç</button></div>
          <p class="muted small">Netflix gibi uygulamalardaki filmler için Film Gecesi odasındaki ortak geri sayımı kullanın.</p></section>`;
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-iz-ac]');
        if (a) return open(a);
        const t = e.target.closest('[data-iz-t]');
        if (t) {
          react(t.dataset.izT, mine());
          send({ t: 'tepki', e: t.dataset.izT });
        }
      });
    },
    enter() {
      render();
      // Öbürü izliyorsa nerede olduğunu sor; sonra beş saniyede bir saatleri karşılaştır
      setTimeout(() => vid && send({ t: 'sor' }), 2500);
      clearInterval(tick);
      tick = setInterval(() => player && ready && vid && playing() && send({ t: 'zaman', at: pos(), ts: now(), playing: true }), 5000);
    },
    leave() {
      clearInterval(tick);
      safe(() => player && player.pauseVideo());
    },
  });
})();
