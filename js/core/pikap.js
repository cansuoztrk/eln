/* Kale Pikabı — şarkıları site içinde çalar, YouTube'a yönlendirmeden.
   Neden gerekli: site "Referrer-Policy: same-origin" gönderiyor; YouTube 2025'ten beri adresini göremediği
   gömülü oynatıcıyı "Hata 153" ile durduruyor. Oynatıcı çerçevesine kendi referrer ayarını veriyoruz.
   Bir video bu sitede açılmazsa (hata 100/101/150/153) sıradaki yedek videoya geçer.
   YouTube kuralı gereği oynatıcı görünür kalır (en az 200 piksel yükseklik). */
(function () {
  'use strict';
  const K = window.K;

  let apiP = null;
  function api() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (apiP) return apiP;
    apiP = new Promise((res) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        try {
          prev && prev();
        } catch (e) {}
        res(window.YT);
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = () => res(null);
      document.head.appendChild(s);
      setTimeout(() => res(window.YT && window.YT.Player ? window.YT : null), 9000);
    });
    return apiP;
  }
  // "https://youtu.be/ID", "youtube.com/watch?v=ID", "/shorts/ID", "music.youtube.com/...", ya da doğrudan kimlik
  function idOf(s) {
    if (!s) return '';
    s = String(s).trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  const idsOf = (song) => [...new Set([song.youtube, ...(song.alt || []), song.yt].map(idOf).filter(Boolean))];

  let seq = 0;
  function mount(box, song, o = {}) {
    const ids = idsOf(song || {});
    let i = 0, player = null, dead = false;
    box.classList.add('pk');
    if (!ids.length) {
      box.innerHTML = '<p class="pk-msg">Bu şarkının bağlantısı henüz yok.</p>';
      return { stop() {} };
    }
    const fail = () => {
      if (dead) return;
      if (++i < ids.length) return start();
      box.innerHTML = `<p class="pk-msg">Bu şarkı şu an burada açılamadı. İnternetini kontrol edip bir daha dene.</p>`;
      o.onFail && o.onFail();
    };
    async function start() {
      const fid = 'pk' + ++seq;
      const auto = o.autoplay === false ? 0 : 1;
      box.innerHTML = `<div class="pk-screen"><iframe id="${fid}" src="https://www.youtube-nocookie.com/embed/${ids[i]}?enablejsapi=1&autoplay=${auto}&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(location.origin)}" title="${K.esc([song.artist, song.title].filter(Boolean).join(' · '))}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>${o.hint === false ? '' : '<p class="pk-hint">Başlamazsa videoya bir kez dokun.</p>'}`;
      if (K.audio.music.on) K.audio.music.stop(false);
      const YT = await api();
      if (dead || !YT || !document.getElementById(fid)) return;
      try {
        player = new YT.Player(fid, {
          events: {
            onReady: (e) => {
              if (auto) {
                try {
                  e.target.playVideo();
                } catch (x) {}
              }
            },
            onError: () => fail(),
            onStateChange: (e) => {
              if (e.data === 1) {
                if (K.audio.music.on) K.audio.music.stop(false);
                const h = K.$('.pk-hint', box);
                if (h) h.hidden = true;
                o.onPlay && o.onPlay();
              }
              if (e.data === 0) o.onEnd && o.onEnd();
            },
          },
        });
      } catch (e) {}
    }
    start();
    return {
      stop() {
        dead = true;
        try {
          player && player.stopVideo && player.stopVideo();
        } catch (e) {}
        box.innerHTML = '';
      },
      get player() {
        return player;
      },
    };
  }
  K.pikap = { mount, idOf, idsOf, api };
})();
