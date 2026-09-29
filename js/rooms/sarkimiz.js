/* Oda: Bizim Şarkımız — pikapta dönen bir plak, kapak içi notu ve anılarımızın kasetleri */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  let root, playing = false, side = 'A';
  // Plağın A yüzü bizim şarkımız, B yüzü onun şarkısı
  const cur = () => (side === 'B' && C.song2 ? C.song2 : C.song || {});
  const CAS = ['#FF8FB8', '#FFD34E', '#8FD3FF', '#C9B6FF', '#7ED6A5', '#FFB3CE', '#FFC9A8'];

  function turntable() {
    const s = cur();
    const grooves = [96, 88, 80, 72, 64, 56, 48].map((r) => `<circle cx="150" cy="130" r="${r}" fill="none" stroke="#3A2E36" stroke-width="1.2"/>`).join('');
    return `<svg class="tt" viewBox="0 0 360 262" role="img" aria-label="Pikap: ${K.esc(s.title || '')}">
      <defs><radialGradient id="ttShine" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <rect x="6" y="10" width="348" height="246" rx="26" fill="#C9577F"/>
      <rect x="6" y="4" width="348" height="242" rx="26" fill="#FFB3CE" stroke="#8C3A5C" stroke-width="5"/>
      <g fill="#fff" opacity=".35">${[[40, 30], [80, 222], [330, 150], [300, 228], [24, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
      <circle cx="150" cy="130" r="112" fill="#E88DAF" stroke="#8C3A5C" stroke-width="5"/>
      <g class="tt-vinyl">
        <circle cx="150" cy="130" r="104" fill="#241B21"/>
        ${grooves}
        <circle cx="150" cy="130" r="104" fill="url(#ttShine)"/>
        <circle cx="150" cy="130" r="40" fill="#FF6FA3"/>
        <circle cx="150" cy="130" r="40" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 5"/>
        <g transform="translate(150 104) scale(.3)">${A.bowShape('#E3174D', '#8C3A5C')}</g>
        <text x="150" y="152" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="13" fill="#fff">${K.esc(s.title || '')}</text>
        <text x="150" y="162" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="6.5" fill="#FFE6EF">${K.esc(s.artist || '')}</text>
      </g>
      <circle cx="150" cy="130" r="4.5" fill="#EDE3E8" stroke="#8C3A5C" stroke-width="2"/>
      <circle cx="300" cy="52" r="24" fill="#FFE6EF" stroke="#8C3A5C" stroke-width="5"/>
      <g class="tt-arm">
        <path d="M300 52 L300 150 Q300 176 262 196" fill="none" stroke="#8C3A5C" stroke-width="12" stroke-linecap="round"/>
        <path d="M300 52 L300 150 Q300 176 262 196" fill="none" stroke="#FFF1F6" stroke-width="6" stroke-linecap="round"/>
        <rect x="244" y="186" width="30" height="18" rx="5" transform="rotate(-30 259 195)" fill="#E3174D" stroke="#8C3A5C" stroke-width="4"/>
      </g>
      <circle cx="300" cy="52" r="10" fill="#E3174D" stroke="#8C3A5C" stroke-width="4"/>
      <g class="tt-knob"><circle cx="318" cy="214" r="16" fill="#FFE6EF" stroke="#8C3A5C" stroke-width="4"/><circle cx="318" cy="214" r="6" fill="#E3174D"/></g>
    </svg>`;
  }

  function cassette(m, i, big) {
    const c = CAS[i % CAS.length];
    return `<svg class="cas-svg" viewBox="0 0 200 128" aria-hidden="true">
      <rect x="4" y="4" width="192" height="120" rx="12" fill="${m.empty ? '#F4EEF1' : c}" stroke="#4A2138" stroke-width="5"/>
      <rect x="20" y="14" width="160" height="58" rx="6" fill="#FFFDF8" stroke="#4A2138" stroke-width="3"/>
      <path d="M26 26 H174" stroke="${c}" stroke-width="3"/>
      <text x="100" y="${big ? 46 : 48}" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="${big ? 17 : 19}" fill="#4A2138">${K.esc(trim(m.title, big ? 26 : 18))}</text>
      <text x="100" y="64" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="9" fill="#9A6A80">${K.esc(m.date)}</text>
      <rect x="52" y="80" width="96" height="30" rx="15" fill="#3A2E36" stroke="#4A2138" stroke-width="3"/>
      <g class="cas-reel l"><circle cx="72" cy="95" r="10" fill="#FFF1F6"/><path d="M72 87 V103 M64 95 H80" stroke="#4A2138" stroke-width="3"/></g>
      <g class="cas-reel r"><circle cx="128" cy="95" r="10" fill="#FFF1F6"/><path d="M128 87 V103 M120 95 H136" stroke="#4A2138" stroke-width="3"/></g>
      <path d="M40 124 L52 112 H148 L160 124" fill="none" stroke="#4A2138" stroke-width="4"/>
    </svg>`;
  }
  const trim = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  function shelf() {
    K.$('#casShelf', root).innerHTML = D.memories
      .map((m, i) => `<button class="cas ${m.empty ? 'empty' : ''}" data-i="${i}" style="--r:${[-3, 2, -1, 3, -2][i % 5]}deg" aria-label="${K.esc(m.title)}">${cassette(m, i)}</button>`)
      .join('');
  }
  function insert(i) {
    const m = D.memories[i];
    const deck = K.$('#casDeck', root);
    K.$$('.cas', root).forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
    deck.classList.remove('in');
    void deck.offsetWidth;
    deck.innerHTML = `
      <div class="deck-slot">${cassette(m, i, true)}</div>
      <div class="deck-text">
        <p class="card-eyebrow">${K.esc(m.date)}</p>
        <h3 class="hand">${K.esc(m.title)}</h3>
        <p>${K.esc(K.fill(m.text))}</p>
        ${m.empty ? `<a class="btn small" href="#ilk-sarilma">${A.ui('heart')} O güne git</a>` : ''}
      </div>`;
    deck.classList.add('in');
    deck.classList.toggle('spin', !m.empty);
    K.audio.sfx.tap();
  }

  function setPlaying(on) {
    const s = cur();
    playing = on;
    const tt = K.$('.tt-wrap', root);
    tt.classList.toggle('playing', on);
    const btn = K.$('#ttPlay', root);
    btn.innerHTML = on ? `${A.ui('pause')} Durdur` : `${A.ui('play')} ${side === 'B' ? 'Onun şarkısını çal' : 'Şarkımızı çal'}`;
    const tv = K.$('#ttVideo', root);
    if (on && !s.youtube) {
      // B yüzü: şarkı YouTube/Spotify'da açılır, pikap dönmeye devam eder
      if (K.audio.music.on) K.audio.music.stop(false);
      window.open(s.youtubeUrl || s.spotifyUrl, '_blank', 'noopener');
      K.stickers.award('bside');
      return;
    }
    if (on) {
      if (K.audio.music.on) K.audio.music.stop(false);
      tv.hidden = false;
      tv.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(s.youtube)}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${K.esc(s.artist)} - ${K.esc(s.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
      K.stickers.award('anilar');
    } else {
      tv.innerHTML = '';
      tv.hidden = true;
    }
  }

  K.room({
    id: 'sarkimiz',
    wing: 'anilar',
    title: 'Bizim Şarkımız',
    sub: () => (C.song ? `${C.song.artist} · ${C.song.title}` : 'Pikap ve kasetler'),
    icon: 'vinyl',
    color: '#FFD6E5',
    init(el) {
      root = el;
      const s = C.song || {};
      el.innerHTML = `
        <div class="song">
          <div class="tt-wrap">
            ${turntable()}
            <div class="tt-notes" aria-hidden="true"><i>♪</i><i>♫</i><i>♪</i><i>♥</i></div>
          </div>
          <div class="song-side">
            <p class="card-eyebrow" id="ttSide">Şu an pikapta · A yüzü</p>
            <h3 class="song-title" id="ttTitle">${K.esc(s.title || '')}</h3>
            <p class="song-artist" id="ttArtist">${K.esc(s.artist || '')}</p>
            <div class="actions">
              <button class="btn red" id="ttPlay">${A.ui('play')} Şarkımızı çal</button>
              ${C.song2 ? `<button class="btn soft" id="ttFlip">${A.ui('refresh')} Plağı çevir</button>` : ''}
            </div>
            <p class="muted small" id="ttLinks">Açılmazsa: <a href="${K.esc(s.youtubeUrl || '#')}" target="_blank" rel="noopener">YouTube'da aç</a> · <a href="${K.esc(s.spotifyUrl || '#')}" target="_blank" rel="noopener">Spotify'da ara</a></p>
          </div>
        </div>
        <div class="tt-video" id="ttVideo" hidden></div>
        <article class="liner">
          <p class="card-eyebrow">Plak kapağının içinden</p>
          <div class="liner-text" id="ttLiner">${K.paras(D.songLetter)}</div>
          <p class="hand liner-sign">— ${K.esc(C.myPet)}</p>
        </article>
        <section class="tapes">
          <h3 class="sub-h">Anılarımızın kasetleri</h3>
          <p class="muted">Bir kaset seç, çalara tak. Sonuncusu henüz boş; onu birlikte dolduracağız.</p>
          <div class="deck card" id="casDeck"><p class="muted">Çalar boş. Aşağıdan bir kaset seç.</p></div>
          <div class="cas-shelf" id="casShelf"></div>
        </section>`;
      shelf();
      K.$('#ttPlay', el).addEventListener('click', () => {
        K.audio.sfx.tap();
        setPlaying(!playing);
      });
      K.$('.tt-knob', el).addEventListener('click', () => setPlaying(!playing));
      const flip = K.$('#ttFlip', el);
      flip &&
        flip.addEventListener('click', () => {
          if (playing) setPlaying(false);
          side = side === 'A' ? 'B' : 'A';
          const s2 = cur();
          const wrap = K.$('.tt-wrap', el);
          wrap.classList.add('flipping');
          K.audio.sfx.whoosh();
          setTimeout(() => {
            K.$('.tt', el).outerHTML = turntable();
            K.$('.tt-knob', el).addEventListener('click', () => setPlaying(!playing));
            wrap.classList.remove('flipping');
          }, 350);
          K.$('#ttSide', el).textContent = `Şu an pikapta · ${side} yüzü${side === 'B' ? ': onun şarkısı' : ''}`;
          K.$('#ttTitle', el).textContent = s2.title || '';
          K.$('#ttArtist', el).textContent = s2.artist || '';
          K.$('#ttPlay', el).innerHTML = `${A.ui('play')} ${side === 'B' ? 'Onun şarkısını çal' : 'Şarkımızı çal'}`;
          K.$('#ttLinks', el).innerHTML = `${side === 'B' ? '' : 'Açılmazsa: '}<a href="${K.esc(s2.youtubeUrl || '#')}" target="_blank" rel="noopener">YouTube'da aç</a> · <a href="${K.esc(s2.spotifyUrl || '#')}" target="_blank" rel="noopener">Spotify'da ${side === 'B' ? 'aç' : 'ara'}</a>${side === 'B' ? ' · <a href="#labirent">Bu şarkının labirenti</a>' : ''}`;
          K.$('#ttLiner', el).innerHTML = K.paras(side === 'B' ? s2.note || [] : D.songLetter);
        });
      K.$('#casShelf', el).addEventListener('click', (e) => {
        const b = e.target.closest('.cas');
        if (b) insert(+b.dataset.i);
      });
    },
    leave() {
      if (playing) setPlaying(false);
    },
  });
})();
