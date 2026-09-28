/* Oda (mevsimlik): Ters Kale — onun doğum gününden önceki hafta kale ters döner: bu sefer kartı Eln hazırlar */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const COLORS = ['#FFD6E5', '#D6F1FF', '#FFF3C4', '#E6DCFF', '#D8F5E8'];
  const ARTS = {
    kitty: () => A.kitty({ crown: true, eyes: 'happy' }),
    kule: () => A.kizKulesi(),
    kopek: () => A.kopus({ label: C.herDog }),
    kek: () => `<svg viewBox="0 0 64 64">${A.ICONS.cake}</svg>`,
  };
  const IDEAS = () => [
    `İyi ki doğdun ${C.myPet}!`,
    'Yeni yaşında da en kötü gartic çizimleri senden olsun.',
    'Bu sefer kale benden sana.',
    'Mən səni sevirəm, ad günün mübarək!',
    `Pastanın en büyük dilimi senin, ikincisi ${C.herDog}'ün.`,
  ];
  const state = () => Object.assign({ art: 'kitty', color: COLORS[0], text: '' }, K.store.get('tersCard', {}));

  function wrap(text, n) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const w of para.split(' ')) {
        if ((line + ' ' + w).trim().length > n) {
          out.push(line.trim());
          line = w;
        } else line += ' ' + w;
      }
      out.push(line.trim());
    }
    return out.filter((l, i, a) => l || (i > 0 && i < a.length - 1));
  }
  function cardSvg(st) {
    const art = ARTS[st.art]().replace(/^\s*<svg class="[^"]*"/, '<svg').replace('<svg ', '<svg x="110" y="60" width="180" height="170" ');
    const lines = wrap(st.text || IDEAS()[0], 30).slice(0, 8);
    return `<svg class="tk-card" viewBox="0 0 400 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Doğum günü kartı">
      <rect width="400" height="540" rx="28" fill="${st.color}"/>
      <rect x="14" y="14" width="372" height="512" rx="20" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/>
      ${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 71) % 380 + 10}" cy="${(i * 53) % 60 + 10}" r="${3 + (i % 3)}" fill="${['#FF8FB8', '#FFD34E', '#8FD3FF', '#C9B6FF'][i % 4]}"/>`).join('')}
      ${art}
      <text x="200" y="274" text-anchor="middle" font-family="'Great Vibes', cursive" font-size="44" fill="#E3174D">İyi ki doğdun</text>
      <text x="200" y="306" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="20" fill="#4A2138">${K.esc(C.myPet)}</text>
      <g font-family="Caveat, cursive" font-size="23" fill="#3d1a2e" text-anchor="middle">${lines.map((l, i) => `<text x="200" y="${344 + i * 24}">${K.esc(l)}</text>`).join('')}</g>
      <text x="360" y="514" text-anchor="end" font-family="Caveat, cursive" font-weight="700" font-size="26" fill="#E3174D">— ${K.esc(C.herPet)}</text>
    </svg>`;
  }

  function render() {
    const st = state();
    K.$('#tkPreview', root).innerHTML = cardSvg(st);
    K.$$('[data-art]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.art === st.art)));
    K.$$('[data-color]', root).forEach((b) => b.classList.toggle('on', b.dataset.color === st.color));
    const n = T.nextAnnual(C.myBirthday).days;
    K.$('#tkCount', root).textContent = n === 0 ? 'Bugün onun doğum günü!' : n < 300 ? `Doğum gününe ${n} gün` : 'Doğum günü dündü; kartın hâlâ gönderilebilir.';
  }
  const save = (patch) => {
    K.store.set('tersCard', Object.assign(state(), patch));
    render();
  };

  async function send() {
    const st = state();
    const text = st.text.trim() || IDEAS()[0];
    const ok = await K.notify(`${C.herName}'den doğum günü kartı`, `İyi ki doğdun ${C.myPet}!\n\n${text}\n\n— ${C.herPet}`, ['birthday', 'gift'], { priority: 5 });
    K.stickers.award('ters');
    K.fx.confetti({ count: 150 });
    K.audio.sfx.chime();
    const svg = K.$('#tkPreview svg', root);
    const img = svg && (await A.toImage(svg.outerHTML.replace(' xmlns="http://www.w3.org/2000/svg"', ''), 800, 1080));
    if (img) {
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 1080;
      c.getContext('2d').drawImage(img, 0, 0);
      const url = c.toDataURL('image/png');
      const file = await K.dataUrlToFile(url, 'dogum-gunu-karti.png');
      const r = await K.share({ title: 'Doğum günü kartı', text, file });
      if (r !== 'shared' && r !== 'cancelled') K.download(url, 'dogum-gunu-karti.png');
    }
    K.fx.toast(ok ? `Kartın ${K.esc(C.myName)}'in telefonuna gitti.` : 'Kart hazır; resmini ona gönderebilirsin.', { icon: A.icon('party') });
  }

  K.room({
    id: 'ters',
    wing: 'mevsim',
    title: 'Ters Kale',
    sub: () => `${C.myPet}'a doğum günü kartı hazırla`,
    icon: 'party',
    color: '#FFE9B8',
    hidden: () => {
      const n = T.nextAnnual(C.myBirthday).days;
      return !(n <= 7 || n >= 364);
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="tk-banner"><span>Bu hafta kale ters döndü!</span><b id="tkCount"></b></div>
        <p class="room-intro">Aylardır bu kale sana sürpriz yapıyor. Bu hafta sıra sende: ${K.esc(C.myPet)}'un doğum günü yaklaşıyor. Aşağıda ona bir kart tasarla; gönderdiğinde yazın doğrudan telefonuna gider, kartın resmi de ona gönderebileceğin şekilde hazırlanır. (İlk mesajı sen atacaktın, unutmadık.)</p>
        <div class="tk">
          <figure class="tk-preview" id="tkPreview"></figure>
          <div class="tk-tools card">
            <p class="card-eyebrow">Kartın resmi</p>
            <div class="kc-presets">${[['kitty', 'Kitty'], ['kule', 'Kız Kulesi'], ['kopek', C.herDog], ['kek', 'Pasta']].map(([k, l]) => `<button type="button" class="chip" data-art="${k}">${K.esc(l)}</button>`).join('')}</div>
            <p class="card-eyebrow">Renk</p>
            <div class="nw-colors">${COLORS.map((c) => `<button type="button" class="nw-sw" data-color="${c}" style="--c:${c}" aria-label="Kart rengi"></button>`).join('')}</div>
            <label class="card-eyebrow" for="tkText">Mesajın</label>
            <textarea class="textarea hand-area" id="tkText" name="tkText" maxlength="240" placeholder="Sevgili ${K.esc(C.myPet)}..."></textarea>
            <div class="tk-ideas">${IDEAS().map((t) => `<button type="button" class="tk-idea" data-idea="${K.esc(t)}">${K.esc(t)}</button>`).join('')}</div>
            <button class="btn red big" id="tkSend">${A.icon('gift')} Kartı gönder</button>
          </div>
        </div>`;
      const ta = K.$('#tkText', el);
      ta.value = state().text;
      ta.addEventListener('input', () => save({ text: ta.value }));
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-art]');
        const c = e.target.closest('[data-color]');
        const idea = e.target.closest('[data-idea]');
        if (a) save({ art: a.dataset.art });
        if (c) save({ color: c.dataset.color });
        if (idea) {
          ta.value = (ta.value ? ta.value.trim() + '\n' : '') + idea.dataset.idea;
          save({ text: ta.value });
        }
      });
      K.$('#tkSend', el).addEventListener('click', send);
    },
    enter() {
      render();
    },
  });
})();
