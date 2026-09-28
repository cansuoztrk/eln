/* Oda: İki Kule Masalı — hikâyemiz, sayfaları çevrilen bir masal kitabı */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
  const sparkle = (x, y, s = 1, c = '#FFD34E') =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path class="tw" d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="${c}"/></g>`;
  const waves = (y, color, amp = 5) => `<path d="M0 ${y} Q20 ${y - amp} 40 ${y} T80 ${y} T120 ${y} T160 ${y} T200 ${y} T240 ${y} T280 ${y} T320 ${y} V200 H0 Z" fill="${color}"/>`;
  const sky = (a, b) => {
    const id = 'sk' + Math.random().toString(36).slice(2, 7);
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="200" fill="url(#${id})"/>`;
  };
  const heart = (x, y, k, c = '#E3174D') => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="${c}"/>`;

  const SCENES = {
    cover: () => `${sky('#FFD0E1', '#FFF3F7')}
      ${sparkle(40, 30)}${sparkle(280, 26, 0.8)}${sparkle(160, 18, 1.2, '#fff')}${sparkle(230, 60, 0.6, '#fff')}
      ${place(A.garland(), 40, 6, 240, 60)}
      ${waves(178, '#BFE6FF')}
      ${place(A.kizKulesi(), 6, 46, 104, 144)}${place(A.qizQalasi(), 210, 46, 104, 144)}
      ${place(A.kitty({ crown: true }), 104, 82, 112, 94)}`,
    baku: () => `${sky('#CDE9FF', '#FFE6EF')}
      <circle cx="262" cy="42" r="20" fill="#FFE08A" opacity=".9"/>
      ${place(A.flameTowers('#F2B8CF'), 14, 70, 70, 70)}
      <g stroke="#9FC9E8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"><path d="M20 40 q14 -6 28 0"/><path d="M60 26 q12 -5 24 0"/></g>
      ${waves(150, '#9FD8FF', 6)}${waves(170, '#7EC8F5', 5)}
      ${place(A.qizQalasi(), 186, 22, 124, 170)}
      ${place(A.kitty({ crown: true }), 44, 102, 118, 98)}
      ${place(A.angela({}), 140, 128, 56, 56)}`,
    istanbul: () => `${sky('#FFE1C9', '#FFE9F2')}
      <circle cx="70" cy="56" r="24" fill="#FFC08A" opacity=".8"/>
      ${waves(160, '#BFE6FF', 5)}
      ${place(A.kizKulesi(), 10, 30, 124, 170)}
      <g transform="translate(176 40)">
        <path d="M20 118 L40 20 M100 118 L80 20 M60 20 V124" stroke="#B9869C" stroke-width="5" stroke-linecap="round"/>
        <rect x="0" y="12" width="120" height="82" rx="6" fill="#fff" stroke="#4A2138" stroke-width="3"/>
        <path d="M60 78 C30 58 34 34 48 34 C54 34 58 38 60 44 C62 38 66 34 72 34 C86 34 90 58 60 78 Z" fill="none" stroke="#E3174D" stroke-width="4" stroke-linejoin="round" stroke-dasharray="210" class="draw"/>
        <rect x="26" y="98" width="68" height="18" rx="9" fill="#4A2138"/>
        <text x="60" y="111" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="#fff">${K.esc(C.myNick)}</text>
      </g>
      <g transform="translate(290 118) rotate(30)"><rect x="-4" y="-30" width="8" height="46" rx="2" fill="#FFD34E" stroke="#4A2138" stroke-width="2.5"/><path d="M-4 16 L0 26 L4 16 Z" fill="#FFE2C4" stroke="#4A2138" stroke-width="2.5" stroke-linejoin="round"/></g>`,
    nehir: () => `${sky('#E6DCFF', '#FFF3F7')}
      <ellipse cx="44" cy="150" rx="70" ry="54" fill="#BFE6FF"/><ellipse cx="282" cy="140" rx="64" ry="62" fill="#9FD8FF"/>
      <text x="30" y="160" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="#4A6B8A">Boğaz</text>
      <text x="262" y="150" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="#35607F">Hazar</text>
      <path id="riverPath" d="M92 140 C130 60 170 180 200 110 S250 90 232 130" fill="none" stroke="#8FD3FF" stroke-width="16" stroke-linecap="round"/>
      <path d="M92 140 C130 60 170 180 200 110 S250 90 232 130" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 10" class="flow"/>
      <text font-family="Great Vibes, cursive" font-size="26" fill="#8F73E6"><textPath href="#riverPath" startOffset="22%">${K.esc(C.friendName)}</textPath></text>
      <g transform="translate(160 44) rotate(-20)"><rect x="-2" y="0" width="4" height="40" rx="2" fill="#B9869C"/>${sparkle(0, -4, 1.8)}</g>
      ${sparkle(126, 36, 0.8, '#fff')}${sparkle(196, 30, 0.7)}${sparkle(214, 64, 0.5, '#fff')}${sparkle(104, 70, 0.6)}`,
    winter: () => `${sky('#DDE8FF', '#F6F0FF')}
      <g class="snow" fill="#fff">${Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 53) % 320}" cy="${(i * 37) % 190}" r="${2 + (i % 3)}" style="animation-delay:-${i * 0.7}s"/>`).join('')}</g>
      <g transform="translate(110 14)">
        <rect x="0" y="0" width="100" height="178" rx="16" fill="#4A2138"/>
        <rect x="6" y="10" width="88" height="160" rx="10" fill="#FFF7FA"/>
        <rect x="6" y="10" width="88" height="22" rx="10" fill="#FFD0E1"/>
        <text x="50" y="25" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="9" font-weight="600" fill="#4A2138">Grup</text>
        <rect x="14" y="40" width="72" height="16" rx="8" fill="#EDE6F2"/>
        <text x="50" y="51" text-anchor="middle" font-family="Nunito, sans-serif" font-size="6.5" fill="#86566F">${K.esc(C.friendName)} sizi gruba ekledi</text>
        <rect x="14" y="66" width="46" height="18" rx="9" fill="#fff" stroke="#F6C9DA"/>
        <text x="20" y="78" font-family="Nunito, sans-serif" font-size="8" fill="#4A2138">merhaba</text>
        <rect x="40" y="92" width="46" height="18" rx="9" fill="#FF8FB8"/>
        <text x="46" y="104" font-family="Nunito, sans-serif" font-size="8" fill="#fff">selam :)</text>
        <rect x="14" y="118" width="58" height="18" rx="9" fill="#fff" stroke="#F6C9DA"/>
        ${heart(28, 128, 0.45)}${heart(40, 128, 0.45)}${heart(52, 128, 0.45)}
        <text x="50" y="160" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="8" font-weight="600" fill="#F0578F">${K.time.fmt(C.metDate)}</text>
      </g>
      ${place(A.kitty({ cls: 'is-happy' }), 10, 118, 90, 76)}
      <path d="M232 170 q10 -40 40 -46" fill="none" stroke="#C9B6FF" stroke-width="3" stroke-dasharray="3 6"/>${heart(276, 118, 1.3, '#FF6FA3')}`,
    crush: () => `${sky('#FFE6EF', '#FFF7E6')}
      ${sparkle(34, 30, 0.8)}${sparkle(292, 40, 0.7, '#fff')}${sparkle(160, 16, 0.9)}
      <g transform="translate(24 22)">
        <path d="M0 10 Q0 0 10 0 H118 Q128 0 128 10 V50 Q128 60 118 60 H40 L22 76 L26 60 H10 Q0 60 0 50 Z" fill="#fff" stroke="#4A2138" stroke-width="3"/>
        ${heart(40, 32, 1.1, '#E3174D')}${heart(64, 32, 1.1, '#FF6FA3')}${heart(88, 32, 1.1, '#FFB3CE')}
      </g>
      <g transform="translate(180 60)">
        <path d="M0 10 Q0 0 10 0 H106 Q116 0 116 10 V44 Q116 54 106 54 H86 L96 70 L68 54 H10 Q0 54 0 44 Z" fill="#FFD0E1" stroke="#4A2138" stroke-width="3"/>
        <text x="58" y="34" text-anchor="middle" font-family="Caveat, cursive" font-size="22" font-weight="700" fill="#4A2138">hmm...</text>
      </g>
      ${place(A.kitty({ cls: 'is-heart', bow: '#4FA3E3' }), 16, 108, 110, 90)}
      ${place(A.kitty({ cls: 'is-wink', crown: true }), 196, 110, 110, 90)}
      <g class="blushpulse">${heart(160, 150, 1.2, '#FF8FB8')}</g>`,
    notes: () => {
      const r = K.rng(508);
      const cols = ['#FFE08A', '#FFB3CE', '#A9DDFF', '#A8E6C4', '#D9CCFF', '#FFC9A8', '#fff'];
      const bits = Array.from({ length: 64 }, (_, i) => {
        const x = (i % 11) * 30 - 6 + r() * 10,
          y = Math.floor(i / 11) * 34 - 4 + r() * 10;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="28" height="28" rx="2" fill="${cols[i % cols.length]}" transform="rotate(${(r() * 16 - 8).toFixed(1)} ${x + 14} ${y + 14})" opacity=".92"/>`;
      }).join('');
      return `<rect width="320" height="200" fill="#EFE3D6"/>${bits}
      <rect width="320" height="200" fill="#4A2138" opacity=".18"/>
      <g transform="translate(160 100) rotate(-4)" class="note-glow">
        <rect x="-44" y="-40" width="88" height="80" rx="4" fill="#8FD3FF" stroke="#4A2138" stroke-width="3"/>
        <text x="0" y="4" text-anchor="middle" font-family="Caveat, cursive" font-size="30" font-weight="700" fill="#2B2F6B">${K.esc(C.notesMark || '♡')}</text>
        <text x="0" y="28" text-anchor="middle" font-family="Caveat, cursive" font-size="13" font-weight="700" fill="#2B2F6B">${K.esc(C.notesDate ? C.notesDate.split('-').reverse().join('.') : '')}</text>
      </g>
      ${sparkle(106, 52, 1.1, '#fff')}${sparkle(214, 150, 0.9, '#FFD34E')}${sparkle(222, 56, 0.6, '#fff')}`;
    },
    azeri: () => `${sky('#E1F4FF', '#FFF3F7')}
      <g transform="translate(40 34)">
        <path d="M0 8 Q60 -6 120 8 V150 Q60 136 0 150 Z" fill="#fff" stroke="#4A2138" stroke-width="3"/>
        <path d="M120 8 Q180 -6 240 8 V150 Q180 136 120 150 Z" fill="#FFFDF4" stroke="#4A2138" stroke-width="3"/>
        <path d="M120 8 V150" stroke="#4A2138" stroke-width="3"/>
        <g stroke="#CFE3F2" stroke-width="1.5">${[40, 62, 84, 106, 128].map((y) => `<path d="M12 ${y} H110 M130 ${y} H228"/>`).join('')}</g>
        <text x="60" y="56" text-anchor="middle" font-family="Caveat, cursive" font-size="17" font-weight="700" fill="#E3174D">Mən səni</text>
        <text x="60" y="78" text-anchor="middle" font-family="Caveat, cursive" font-size="17" font-weight="700" fill="#E3174D">sevirəm</text>
        <text x="60" y="118" text-anchor="middle" font-family="Caveat, cursive" font-size="15" fill="#4A6B8A">Ürəyim ♡</text>
        <text x="180" y="56" text-anchor="middle" font-family="Caveat, cursive" font-size="16" fill="#4A2138">Gözəlim</text>
        <text x="180" y="82" text-anchor="middle" font-family="Caveat, cursive" font-size="16" fill="#4A2138">Əzizim</text>
        <text x="180" y="118" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="20" font-weight="700" fill="#3FA37A">A+</text>
      </g>
      <g transform="translate(262 128) rotate(24)"><rect x="-4" y="-34" width="8" height="50" rx="2" fill="#FFD34E" stroke="#4A2138" stroke-width="2.5"/><path d="M-4 16 L0 26 L4 16 Z" fill="#FFE2C4" stroke="#4A2138" stroke-width="2.5" stroke-linejoin="round"/></g>
      ${place(A.kitty({ cls: 'is-happy', crown: true }), 4, 128, 84, 70)}`,
    question: () => `${sky('#FFF3C4', '#FFE6EF')}
      <text x="160" y="118" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="110" font-weight="700" fill="#FFD0E1">?</text>
      ${place(A.kitty({}), 18, 84, 120, 100)}
      ${place(A.kitty({ cls: 'is-happy', bow: '#8F73E6' }), 184, 84, 120, 100)}
      ${heart(150, 60, 0.8, '#FF8FB8')}${heart(170, 44, 0.6, '#FFB3CE')}${heart(160, 84, 1, '#E3174D')}
      <text x="160" y="192" text-anchor="middle" font-family="Caveat, cursive" font-size="16" fill="#86566F">biz neyiz? ...ama çok güzeliz</text>`,
    birthday: () => `${sky('#FFE6EF', '#FFF3C4')}
      ${[
        [44, 50, '#FF8FB8'],
        [78, 34, '#C9B6FF'],
        [250, 40, '#8FD3FF'],
        [282, 60, '#FFD34E'],
      ]
        .map(([x, y, c]) => `<path d="M${x} ${y + 22} q-4 30 6 60" fill="none" stroke="#B9869C" stroke-width="1.5"/><ellipse cx="${x}" cy="${y}" rx="16" ry="20" fill="${c}"/><ellipse cx="${x - 5}" cy="${y - 7}" rx="4" ry="6" fill="#fff" opacity=".5"/>`)
        .join('')}
      <g transform="translate(160 118)">
        <rect x="-70" y="10" width="140" height="44" rx="10" fill="#FFB3CE" stroke="#4A2138" stroke-width="3"/>
        <rect x="-50" y="-24" width="100" height="36" rx="8" fill="#fff" stroke="#4A2138" stroke-width="3"/>
        <path d="M-50 -10 q12 10 20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#FF8FB8" stroke-width="4"/>
        <path d="M-70 26 q14 12 23 0 t23 0 t23 0 t23 0 t23 0 t23 0" fill="none" stroke="#fff" stroke-width="4"/>
        ${[-24, 0, 24].map((x) => `<rect x="${x - 3}" y="-44" width="6" height="20" rx="2" fill="#8FD3FF" stroke="#4A2138" stroke-width="2"/><path class="flame" d="M${x} -58 c-5 6 -5 10 0 12 c5 -2 5 -6 0 -12 z" fill="#FFB547"/>`).join('')}
      </g>
      <text x="160" y="40" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="30" font-weight="700" fill="#E3174D">${+C.herBirthday.slice(3)} ${K.MONTHS[+C.herBirthday.slice(0, 2) - 1]}</text>`,
    together: () => `${sky('#FFD0E1', '#FFF3F7')}
      ${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 71) % 320}" cy="${(i * 43) % 200}" r="${2 + (i % 3)}" fill="${['#FF8FB8', '#FFD34E', '#C9B6FF', '#8FD3FF'][i % 4]}"/>`).join('')}
      <g transform="translate(160 100)">
        <g transform="translate(-26 0) rotate(-12)">${heart(0, 0, 4.4, '#FF6FA3')}</g>
        <g transform="translate(26 4) rotate(12)">${heart(0, 0, 4.4, '#E3174D')}</g>
      </g>
      <g transform="translate(236 128) rotate(8)">
        <rect x="0" y="0" width="64" height="62" rx="8" fill="#fff" stroke="#4A2138" stroke-width="3"/>
        <rect x="0" y="0" width="64" height="18" rx="8" fill="#E3174D"/>
        <text x="32" y="13" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="10" font-weight="600" fill="#fff">MAYIS</text>
        <text x="32" y="50" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="28" font-weight="700" fill="#4A2138">21</text>
      </g>
      ${place(A.kitty({ cls: 'is-heart', crown: true }), 16, 110, 100, 84)}`,
    distance: () => `${sky('#D6F1FF', '#FFF3F7')}
      <path d="M50 150 Q160 20 270 150" fill="none" stroke="#FF8FB8" stroke-width="3" stroke-dasharray="4 8" class="flow"/>
      <g class="plane-fly">${place(A.icon('plane'), 140, 42, 44, 44)}</g>
      <path d="M50 176 C40 162 34 154 34 146 A16 16 0 0 1 66 146 C66 154 60 162 50 176 Z" fill="#FF8FB8" stroke="#4A2138" stroke-width="3"/><circle cx="50" cy="146" r="6" fill="#fff"/>
      <path d="M270 176 C260 162 254 154 254 146 A16 16 0 0 1 286 146 C286 154 280 162 270 176 Z" fill="#8FD3FF" stroke="#4A2138" stroke-width="3"/><circle cx="270" cy="146" r="6" fill="#fff"/>
      <text x="50" y="194" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="12" font-weight="600" fill="#4A2138">${K.esc(C.myCity)}</text>
      <text x="270" y="194" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="12" font-weight="600" fill="#4A2138">${K.esc(C.herCity)}</text>
      <rect x="112" y="118" width="96" height="30" rx="15" fill="#fff" stroke="#F6C9DA" stroke-width="2"/>
      <text x="160" y="138" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="14" font-weight="700" fill="#E3174D">${K.num(C.distanceKm)} km</text>
      <text x="160" y="166" text-anchor="middle" font-family="Caveat, cursive" font-size="17" fill="#86566F">+1 saat = gelecek</text>`,
    future: () => `${sky('#2A1D57', '#C0739E')}
      ${Array.from({ length: 30 }, (_, i) => `<circle class="tw" cx="${(i * 97) % 320}" cy="${(i * 29) % 110}" r="${0.8 + (i % 3) * 0.6}" fill="#fff" style="animation-delay:-${i * 0.3}s"/>`).join('')}
      <path d="M130 200 Q150 150 160 110 Q170 150 190 200 Z" fill="#FFD0E1" opacity=".5"/>
      ${place(A.kizKulesi(), 20, 70, 90, 124)}${place(A.qizQalasi(), 210, 70, 90, 124)}
      <g transform="translate(160 84)"><circle r="30" fill="#FFF4C7" opacity=".25"/><text y="12" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="40" font-weight="700" fill="#FFF4C7">∞</text></g>
      ${sparkle(120, 40, 0.8, '#FFF4C7')}${sparkle(206, 30, 1, '#FFF4C7')}`,
  };

  K.scenes = SCENES;
  let page = 0;
  let root;

  function render(dir) {
    const p = D.story[page];
    const book = K.$('.book-page', root);
    const apply = () => {
      K.$('.book-art', root).innerHTML = `<svg viewBox="0 0 320 200" role="img" aria-label="${K.esc(K.fill(p.title))}">${SCENES[p.scene] ? SCENES[p.scene]() : ''}</svg>`;
      K.$('.book-title', root).textContent = K.fill(p.title);
      K.$('.book-text', root).innerHTML = K.paras(p.text);
      K.$('.book-num', root).textContent = page === 0 ? 'Kapak' : `Sayfa ${page} / ${D.story.length - 1}`;
      K.$('.book-page', root).classList.toggle('is-cover', page === 0);
      K.$('#bkPrev').disabled = page === 0;
      const last = page === D.story.length - 1;
      K.$('#bkNext').innerHTML = last ? `Baştan oku ${A.ui('refresh')}` : page === 0 ? `Masalı aç ${A.ui('next')}` : `Sonraki ${A.ui('next')}`;
      K.$$('.book-dots button', root).forEach((d, i) => d.setAttribute('aria-current', i === page ? 'true' : 'false'));
      K.$('.book-end', root).hidden = !last;
      if (last) {
        K.stickers.award('masal');
        K.store.set('masalDone', true);
      }
      K.store.set('masalPage', page);
    };
    if (!dir || K.reduced) return apply();
    book.classList.add(dir > 0 ? 'out-next' : 'out-prev');
    K.audio.sfx.paper();
    setTimeout(() => {
      apply();
      book.classList.remove('out-next', 'out-prev');
      book.classList.add(dir > 0 ? 'in-next' : 'in-prev');
      setTimeout(() => book.classList.remove('in-next', 'in-prev'), 380);
    }, 260);
  }
  function goTo(i) {
    const n = D.story.length;
    const next = ((i % n) + n) % n;
    if (next === page) return;
    const dir = next > page ? 1 : -1;
    page = next;
    render(dir);
    const view = document.getElementById('roomView');
    if (view && view.scrollTop > 80) view.scrollTo({ top: 0, behavior: K.reduced ? 'auto' : 'smooth' });
  }

  K.room({
    id: 'masal',
    wing: 'anilar',
    title: 'İki Kule Masalı',
    sub: 'Hikâyemiz, bir masal kitabında',
    icon: 'book',
    color: '#FFE9B8',
    badge: () => (K.store.get('masalDone') ? 'Okundu' : ''),
    init(el) {
      root = el;
      page = K.store.get('masalPage', 0);
      if (page >= D.story.length) page = 0;
      el.innerHTML = `
        <div class="book">
          <div class="book-spine" aria-hidden="true"></div>
          <article class="book-page" aria-live="polite">
            <div class="book-art"></div>
            <div class="book-copy">
              <p class="book-num"></p>
              <h3 class="book-title"></h3>
              <div class="book-text"></div>
            </div>
          </article>
        </div>
        <div class="book-nav">
          <button class="btn soft" id="bkPrev">${A.ui('back')} Önceki</button>
          <div class="book-dots">${D.story.map((s, i) => `<button aria-label="${i === 0 ? 'Kapak' : 'Sayfa ' + i}"></button>`).join('')}</div>
          <button class="btn" id="bkNext"></button>
        </div>
        <div class="book-end card" hidden>
          <p class="hand" style="font-size:24px">Masal burada bitmiyor. Her gün bir sayfa daha yazıyoruz.</p>
          <div class="actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
            <a class="btn" href="#ozel">Sıradaki sayfalar: Özel Günler</a>
            <a class="btn soft" href="#son">Son sayfaya git</a>
            <button class="btn ghost" id="bkFilm">${A.ui('play')} Açılış filmini tekrar izle</button>
            ${K.voice ? K.voice.btn('masal', 'Masalı benim sesimden dinle') : ''}
          </div>
        </div>`;
      K.$('#bkPrev').addEventListener('click', () => goTo(page - 1));
      K.$('#bkFilm', el).addEventListener('click', () => K.prologue && K.prologue.play(D.prologue));
      K.$('#bkNext').addEventListener('click', () => goTo(page === D.story.length - 1 ? 0 : page + 1));
      K.$$('.book-dots button', el).forEach((b, i) => b.addEventListener('click', () => goTo(i)));
      // Kaydırarak sayfa çevirme
      let sx = null;
      const pg = K.$('.book-page', el);
      pg.addEventListener('pointerdown', (e) => (sx = e.clientX));
      pg.addEventListener('pointerup', (e) => {
        if (sx == null) return;
        const dx = e.clientX - sx;
        sx = null;
        if (Math.abs(dx) > 50) goTo(page + (dx < 0 ? 1 : -1));
      });
      this.keys = (e) => {
        if (K.activeRoom !== 'masal') return;
        if (e.key === 'ArrowRight') goTo(page + 1);
        if (e.key === 'ArrowLeft') goTo(page - 1);
      };
      document.addEventListener('keydown', this.keys);
      render(0);
    },
  });
})();
