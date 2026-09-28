/* Oda: Son Sayfa — uzun mektup ve kaçan "Hayır" butonlu soru */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, timers = [];

  function reveal(all) {
    timers.forEach(clearTimeout);
    timers = [];
    const ps = K.$$('.fl-text p', root);
    const q = K.$('#finalQ', root);
    if (all || K.reduced) {
      ps.forEach((p) => p.classList.add('in'));
      K.$('.fl-sign', root).classList.add('in');
      q.hidden = false;
      K.$('#flSkip', root).hidden = true;
      return;
    }
    ps.forEach((p, i) => timers.push(setTimeout(() => p.classList.add('in'), 150 + i * 1100)));
    timers.push(
      setTimeout(() => {
        K.$('.fl-sign', root).classList.add('in');
        q.hidden = false;
        K.$('#flSkip', root).hidden = true;
      }, 150 + ps.length * 1100)
    );
  }

  function answered(date, anim) {
    const box = K.$('#finalQ', root);
    box.innerHTML = `<div class="forever">
        <div class="forever-kitty">${A.kitty({ cls: 'is-heart', crown: true })}</div>
        <h3 class="script">Sonsuza kadar</h3>
        <p class="forever-langs"><span>Seni seviyorum</span><span>Mən səni sevirəm</span><span>I love you</span></p>
        <p>Cevabın ${T.fmt(date)} tarihinde kalbime kaydedildi. Bu ekranın görüntüsünü al ve bana gönder; telefonumun duvar kâğıdı olacak.</p>
        <button class="btn soft small" id="flAgain">${A.ui('refresh')} Havai fişekleri tekrar izle</button>
      </div>`;
    K.$('#flAgain', box).addEventListener('click', () => {
      K.fx.fireworks(3500);
      K.audio.sfx.chime();
    });
    if (anim) {
      K.fx.fireworks(5500);
      setTimeout(() => K.fx.rain({ count: 90 }), 1200);
      K.audio.sfx.chime();
      setTimeout(() => K.audio.play('waltz', {}), 800);
    }
  }

  function question() {
    const box = K.$('#finalQ', root);
    let tries = 0,
      grow = 1;
    box.innerHTML = `<h3 class="fq-title">${K.esc(K.fill(D.finalQuestion))}</h3>
      <div class="fq-area" id="fqArea">
        <button class="btn big red fq-yes" id="fqYes">${A.ui('heart')} Evet</button>
        <button class="btn big soft fq-no" id="fqNo">${K.esc(D.noButtonTexts[0])}</button>
      </div>`;
    const area = K.$('#fqArea', box);
    const no = K.$('#fqNo', box);
    const yes = K.$('#fqYes', box);
    const run = (e) => {
      if (e) e.preventDefault();
      tries++;
      grow = Math.min(2, grow + 0.12);
      yes.style.transform = `scale(${grow})`;
      no.textContent = D.noButtonTexts[Math.min(tries, D.noButtonTexts.length - 1)];
      const a = area.getBoundingClientRect();
      const b = no.getBoundingClientRect();
      const maxX = Math.max(0, a.width - b.width);
      const maxY = Math.max(0, a.height - b.height);
      no.style.position = 'absolute';
      no.style.left = Math.random() * maxX + 'px';
      no.style.top = Math.random() * maxY + 'px';
      no.style.transform = `scale(${Math.max(0.55, 1 - tries * 0.05)}) rotate(${(Math.random() - 0.5) * 20}deg)`;
      K.audio.sfx.pop();
      if (tries >= D.noButtonTexts.length + 2) no.hidden = true;
    };
    no.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && run());
    no.addEventListener('pointerdown', run);
    no.addEventListener('click', (e) => e.detail === 0 && run(e));
    no.addEventListener('focus', () => tries && run());
    yes.addEventListener('click', () => {
      const d = T.todayKey();
      K.store.set('forever', d);
      K.stickers.award('son');
      K.notify(`${C.herName} "Evet" dedi`, 'Masalın sonsuza kadar sürmesini istiyor.', ['ring', 'heart']);
      answered(d, true);
    });
  }

  K.room({
    id: 'son',
    title: 'Son Sayfa',
    sub: 'Sana mektubum',
    icon: 'heart',
    color: '#FFE0E0',
    init(el) {
      root = el;
      el.innerHTML = `
        <article class="final-letter">
          <div class="fl-seal">${A.bow()}</div>
          <div class="fl-text">${K.paras(D.finalLetter)}</div>
          <p class="fl-sign">${K.esc(K.fill(D.finalSign))}</p>
          <button class="btn ghost small" id="flSkip">Hepsini göster</button>
        </article>
        <div class="card final-q" id="finalQ" hidden></div>`;
      K.$('#flSkip', el).addEventListener('click', () => reveal(true));
      const d = K.store.get('forever');
      if (d) answered(d, false);
      else question();
      reveal(Boolean(d));
    },
    leave() {
      timers.forEach(clearTimeout);
      K.$$('.fl-text p', root).forEach((p) => p.classList.add('in'));
      if (K.$('.fl-sign', root)) K.$('.fl-sign', root).classList.add('in');
      K.$('#finalQ', root).hidden = false;
      K.$('#flSkip', root).hidden = true;
    },
  });
})();
