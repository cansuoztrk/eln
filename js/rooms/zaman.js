/* Oda: Zaman Yolcusu — yedi bölümlük bir görev. Her gün bir bölüm açılır; her bölümde geçmişteki bir ana inilir,
   küçük bir bulmaca çözülür ve karşılığında o anın İstanbul'daki, benim tarafımdaki hâli okunur. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, cur = null, cleanup = null;
  const Z = () => D.zaman || { intro: [], chapters: [] };
  const done = () => K.store.get('zyDone', []);
  function start() {
    let s = K.store.get('zyStart');
    if (!s) {
      s = T.todayKey();
      K.store.set('zyStart', s);
    }
    return s;
  }
  // i. bölüm: bir öncekini bitirmiş ve i gün geçmiş olmalı (kale sahibi hepsini görür)
  function state(i) {
    const ch = Z().chapters[i];
    if (done().includes(ch.id)) return { open: true, solved: true };
    if (K.isOwner()) return { open: true };
    if (i > 0 && !done().includes(Z().chapters[i - 1].id)) return { open: false, why: 'Önce bir önceki kapı' };
    const wait = i - T.daysSince(start());
    if (wait > 0) return { open: false, why: wait === 1 ? 'Yarın açılır' : `${wait} gün sonra açılır` };
    return { open: true };
  }

  /* ---------------- Liste ---------------- */
  function renderList() {
    const list = Z().chapters;
    K.$('#zyList', root).innerHTML = list
      .map((ch, i) => {
        const s = state(i);
        return `<button class="zy-tk ${s.solved ? 'solved' : s.open ? 'open' : 'locked'}" data-ch="${i}" ${s.open ? '' : 'aria-disabled="true"'}>
          <span class="zy-n">${K.pad(i + 1)}</span>
          <span class="zy-t"><small>${K.esc(ch.date)}</small><b>${s.open ? K.esc(ch.title) : '• • •'}</b></span>
          <span class="zy-s">${s.solved ? A.ui('check') : s.open ? A.icon('door') : A.ui('lock')}<em>${s.solved ? 'Görüldü' : s.open ? 'Açık' : K.esc(s.why)}</em></span>
        </button>`;
      })
      .join('');
    const n = done().length;
    K.$('#zyProg', root).style.setProperty('--p', n / list.length);
    K.$('#zyCount', root).textContent = `${n} / ${list.length} an`;
  }

  /* ---------------- Bölüm ---------------- */
  function openChapter(i) {
    const ch = Z().chapters[i];
    cur = i;
    cleanup && cleanup();
    cleanup = null;
    const box = K.$('#zyStage', root);
    box.hidden = false;
    box.innerHTML = `<article class="zy-ch">
      <header><small>${K.esc(ch.date)}</small><h3>${K.esc(ch.title)}</h3></header>
      <p class="zy-intro">${K.esc(ch.intro)}</p>
      <div class="zy-puzzle" id="zyPuzzle"></div>
      <div class="zy-reveal" id="zyReveal" hidden></div>
    </article>`;
    const pz = K.$('#zyPuzzle', box);
    const solved = () => reveal(i);
    if (done().includes(ch.id)) {
      pz.hidden = true;
      reveal(i, true);
    } else (PUZZLES[ch.type] || PUZZLES.word)(pz, ch, solved);
    box.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'start' });
  }
  function reveal(i, again) {
    const ch = Z().chapters[i];
    const box = K.$('#zyStage', root);
    const pz = K.$('#zyPuzzle', box);
    const rv = K.$('#zyReveal', box);
    if (!again) {
      K.audio.sfx.success();
      K.fx.burst && K.fx.burst(window.innerWidth / 2, window.innerHeight / 2, { count: 40 });
      K.store.set('zyDone', Array.from(new Set(done().concat(ch.id))));
      setTimeout(() => (pz.hidden = true), 700);
    }
    rv.hidden = false;
    if (ch.spoiler && K.spoilerOk && !K.spoilerOk()) {
      rv.innerHTML = `<p class="card-eyebrow">Spoiler kalkanı</p><p>Bu kapının metni, dizinin sonunu anlatıyor. İzleme Kulübü'nde son bölümü birlikte bitirene kadar senden saklı.</p>`;
      renderList();
      return;
    }
    rv.innerHTML = `<p class="card-eyebrow">O an, İstanbul'da</p>${(ch.reveal || []).map((p, k) => `<p style="--d:${k * (again ? 0.1 : 0.9)}s">${K.esc(K.fill(p))}</p>`).join('')}
      <div class="actions">${i + 1 < Z().chapters.length ? `<button class="btn soft small" data-next>${state(i + 1).open ? 'Sıradaki kapı' : 'Sıradaki kapı ' + state(i + 1).why.toLocaleLowerCase('tr')}</button>` : `<a class="btn red small" href="#dans">${A.icon('dance')} Dans pistine git</a>`}</div>`;
    renderList();
    if (!again && done().length === Z().chapters.length) {
      K.stickers.award('zaman');
      K.fx.confetti({ count: 160, shapes: ['heart', 'star'] });
      K.notify(`${C.herName} zaman yolculuğunu bitirdi`, 'Yedi anın hepsine indi ve şimdiki zamana döndü.', ['hourglass_flowing_sand']);
    } else if (!again) K.notify(`${C.herName} geçmişe indi`, `Zaman Yolcusu: "${ch.title}" bölümünü çözdü.`, ['hourglass_flowing_sand']);
  }

  /* ---------------- Bulmacalar ---------------- */
  const shake = (el) => {
    el.classList.remove('zy-shake');
    void el.offsetWidth;
    el.classList.add('zy-shake');
    K.vibrate(60);
  };
  const PUZZLES = {
    // Kadran: gün / ay / yıl
    dial(el, ch, ok) {
      const v = [1, 1, 2024];
      const lim = [[1, 31], [1, 12], [2024, 2027]];
      const lab = ['Gün', 'Ay', 'Yıl'];
      el.innerHTML = `<div class="zy-dial">${v.map((x, k) => `<div class="zy-wheel"><small>${lab[k]}</small><button class="icon-btn" data-w="${k}" data-s="1" aria-label="${lab[k]} artır">${A.ui('plus')}</button><b id="zyW${k}">${x}</b><button class="icon-btn" data-w="${k}" data-s="-1" aria-label="${lab[k]} azalt">−</button></div>`).join('')}</div>
        <div class="actions"><button class="btn red" id="zyRun">${A.icon('hourglass')} Makineyi çalıştır</button><button class="btn ghost small" id="zyHint">İpucu</button></div><p class="zy-msg" id="zyMsg"></p>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-w]');
        if (b) {
          const k = +b.dataset.w;
          const [lo, hi] = lim[k];
          v[k] = v[k] + +b.dataset.s;
          if (v[k] > hi) v[k] = lo;
          if (v[k] < lo) v[k] = hi;
          K.$('#zyW' + k, el).textContent = k === 1 ? K.MONTHS[v[k] - 1].slice(0, 3) : v[k];
          K.audio.sfx.tick && K.audio.sfx.tick();
        }
        if (e.target.closest('#zyHint')) K.$('#zyMsg', el).textContent = ch.hint || '';
        if (e.target.closest('#zyRun')) {
          if (v.every((x, k) => x === ch.target[k])) ok();
          else {
            shake(K.$('.zy-dial', el));
            K.$('#zyMsg', el).textContent = 'Kadranlar titredi ama kapı açılmadı. Bu tarih değil.';
          }
        }
      });
      K.$('#zyW1', el).textContent = K.MONTHS[0].slice(0, 3);
    },
    // Sohbet: prensesin cevaplarını doğru sırayla seç
    chat(el, ch, ok) {
      let step = 0;
      const log = (ch.mine || []).map((t) => `<p class="zy-b me">${K.esc(t)}</p>`).join('');
      el.innerHTML = `<div class="zy-phone"><div class="zy-bubbles" id="zyB">${log}<p class="zy-typing"><i></i><i></i><i></i></p></div><div class="zy-opts" id="zyO"></div></div>`;
      const draw = () => {
        const s = ch.steps[step];
        K.$('#zyO', el).innerHTML = K.shuffle([s.right].concat(s.wrong)).map((t) => `<button class="chip" data-o="${K.esc(t)}">${K.esc(t)}</button>`).join('');
      };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-o]');
        if (!b) return;
        if (b.dataset.o === ch.steps[step].right) {
          K.$('.zy-typing', el).insertAdjacentHTML('beforebegin', `<p class="zy-b her">${K.esc(b.dataset.o)}</p>`);
          K.audio.sfx.pop();
          step++;
          if (step >= ch.steps.length) {
            K.$('#zyO', el).innerHTML = '';
            K.$('.zy-typing', el).remove();
            return setTimeout(ok, 600);
          }
          draw();
        } else {
          shake(b);
          K.fx.toast('Geçmiş öyle demiyor...', { icon: A.icon('chat'), duration: 1600 });
        }
      });
      draw();
    },
    // Yıldızlar: sırayla birleştir, kalp çıksın
    stars(el, ch, ok) {
      const N = 12;
      const pts = Array.from({ length: N }, (_, k) => {
        const t = (k / N) * Math.PI * 2;
        return [160 + 7 * 16 * Math.pow(Math.sin(t), 3), 110 - 7 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
      });
      let next = 0;
      const lines = [];
      el.innerHTML = `<svg class="zy-sky" viewBox="0 0 320 250" role="img" aria-label="Yıldızları sırayla birleştir">
        <rect width="320" height="250" rx="18" fill="#1E1640"/>
        ${Array.from({ length: 40 }, (_, k) => `<circle cx="${(k * 83) % 320}" cy="${(k * 47) % 250}" r="${0.6 + (k % 3) * 0.4}" fill="#fff" opacity=".5"/>`).join('')}
        <g id="zyL"></g>
        ${pts.map(([x, y], k) => `<g class="zy-st" data-st="${k}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="14" fill="transparent"/><path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill="#FFF4C7"/><text y="-10" text-anchor="middle" font-size="8" font-family="Fredoka, sans-serif" fill="#C9B6FF">${k + 1}</text></g>`).join('')}
      </svg><p class="zy-msg" id="zyMsg">1'den başla.</p>`;
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-st]');
        if (!s) return;
        const k = +s.dataset.st;
        if (k !== next) {
          shake(K.$('svg', el));
          K.$('#zyMsg', el).textContent = `${next + 1} numaralı yıldızı ara.`;
          return;
        }
        s.classList.add('on');
        K.audio.sfx.note(['C5', 'D5', 'E5', 'G5', 'A5', 'C6'][k % 6], 0.12);
        if (k > 0) lines.push(`<line x1="${pts[k - 1][0]}" y1="${pts[k - 1][1]}" x2="${pts[k][0]}" y2="${pts[k][1]}"/>`);
        next++;
        if (next === N) lines.push(`<line x1="${pts[N - 1][0]}" y1="${pts[N - 1][1]}" x2="${pts[0][0]}" y2="${pts[0][1]}"/>`);
        K.$('#zyL', el).innerHTML = lines.join('');
        if (next === N) {
          K.$('svg', el).classList.add('won');
          K.$('#zyMsg', el).textContent = 'Akşam yıldızı.';
          setTimeout(ok, 900);
        } else K.$('#zyMsg', el).textContent = `${next + 1}...`;
      });
    },
    // Balonlar: Kitty'nin çaldığı sırayı tekrar et (3 tur)
    simon(el, ch, ok) {
      const COL = ['#FF6FA3', '#FFD34E', '#8FD3FF', '#C9B6FF'];
      const NOTES = ['C5', 'E5', 'G5', 'C6'];
      let seq = [], input = [], round = 0, busy = false;
      el.innerHTML = `<div class="zy-balloons">${COL.map((c, k) => `<button class="zy-bal" data-b="${k}" style="--c:${c}" aria-label="Balon ${k + 1}"><svg viewBox="0 0 60 90"><path d="M30 4 C12 4 4 20 4 32 C4 50 20 62 30 64 C40 62 56 50 56 32 C56 20 48 4 30 4 Z" fill="${c}" stroke="#4A2138" stroke-width="3"/><path d="M26 64 L30 70 L34 64 Z" fill="${c}" stroke="#4A2138" stroke-width="2"/><path d="M30 70 Q24 78 30 86" fill="none" stroke="#4A2138" stroke-width="2"/><ellipse cx="20" cy="22" rx="5" ry="8" fill="#fff" opacity=".45"/></svg></button>`).join('')}</div>
        <div class="actions" style="justify-content:center"><button class="btn red" id="zySimon">Kitty çalsın</button></div><p class="zy-msg" id="zyMsg">Tur 1 / 3</p>`;
      const flash = (k) => {
        const b = K.$(`[data-b="${k}"]`, el);
        b.classList.add('lit');
        K.audio.sfx.note(NOTES[k], 0.2);
        setTimeout(() => b.classList.remove('lit'), 380);
      };
      const play = () => {
        busy = true;
        input = [];
        seq.forEach((k, j) => setTimeout(() => flash(k), 300 + j * 560));
        setTimeout(() => (busy = false), 300 + seq.length * 560);
      };
      const newRound = () => {
        seq = seq.concat(Array.from({ length: round === 0 ? 3 : 1 }, () => Math.floor(Math.random() * 4)));
        K.$('#zyMsg', el).textContent = `Tur ${round + 1} / 3 · ${seq.length} nota`;
        play();
      };
      K.$('#zySimon', el).addEventListener('click', () => {
        if (busy) return;
        K.$('#zySimon', el).textContent = 'Tekrar çal';
        if (!seq.length) newRound();
        else play();
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-b]');
        if (!b || busy || !seq.length) return;
        const k = +b.dataset.b;
        flash(k);
        input.push(k);
        const at = input.length - 1;
        if (input[at] !== seq[at]) {
          shake(K.$('.zy-balloons', el));
          K.$('#zyMsg', el).textContent = 'Geçmiş direndi! Aynı turu tekrar dinle.';
          input = [];
          setTimeout(play, 900);
          return;
        }
        if (input.length === seq.length) {
          round++;
          if (round >= 3) {
            K.$('#zyMsg', el).textContent = 'İyi ki doğdun!';
            return setTimeout(ok, 700);
          }
          setTimeout(newRound, 800);
        }
      });
    },
    // Duvar: pembe A+E notunu bul. Geçmiş notları bir kez karıştırır.
    find(el, ch, ok) {
      const COL = ['#FFE08A', '#8FD3FF', '#7ED6A5', '#C9B6FF', '#FFB38A', '#FFF3C4', '#B8F0E0', '#FFD0E1'];
      let pushed = false;
      const draw = () => {
        const target = Math.floor(Math.random() * 30);
        // Aynı pembede birkaç yalancı not: A+E yazısını okumak gerekiyor
        const decoys = K.shuffle(Array.from({ length: 30 }, (_, k) => k).filter((k) => k !== target)).slice(0, 4);
        el.querySelector('.zy-wall').innerHTML = Array.from({ length: 30 }, (_, k) => {
          const t = k === target;
          const c = t || decoys.includes(k) ? '#FF8FB8' : COL[(k * 7 + Math.floor(Math.random() * 3)) % COL.length];
          const r = Math.round(Math.random() * 16 - 8);
          return `<button class="zy-note ${t ? 'it' : ''}" data-n="${t ? 1 : 0}" style="--c:${c};--r:${r}deg" aria-label="Not">${t ? '<b>A+E</b><small>08.05.2026</small>' : `<i style="width:${40 + Math.random() * 50}%"></i><i style="width:${30 + Math.random() * 60}%"></i><i style="width:${20 + Math.random() * 50}%"></i>`}</button>`;
        }).join('');
      };
      el.innerHTML = `<div class="zy-wall"></div><p class="zy-msg" id="zyMsg">Pembe olanı ara. Ama dikkat: Duvarda başka pembeler de olabilir.</p>`;
      draw();
      el.addEventListener('click', (e) => {
        const n = e.target.closest('[data-n]');
        if (!n) return;
        if (n.dataset.n !== '1') {
          shake(n);
          return;
        }
        if (!pushed) {
          pushed = true;
          K.$('#zyMsg', el).textContent = 'Geçmiş direndi! Notlar karıştı. Bir kez daha bul.';
          K.audio.sfx.whoosh();
          el.querySelector('.zy-wall').classList.add('zy-shuffle');
          setTimeout(() => {
            draw();
            el.querySelector('.zy-wall').classList.remove('zy-shuffle');
          }, 500);
          return;
        }
        n.classList.add('found');
        K.$('#zyMsg', el).textContent = 'Buldun: A+E.';
        setTimeout(ok, 800);
      });
    },
    // Kelime: harflere doğru sırayla dokun
    word(el, ch, ok) {
      const word = (ch.word || 'OLALIM').toLocaleUpperCase('tr');
      let got = '';
      let tiles = K.shuffle(word.split('').map((l, k) => ({ l, k })));
      if (tiles.map((t) => t.l).join('') === word) tiles = tiles.reverse();
      el.innerHTML = `<div class="zy-slots" id="zyS">${word.split('').map(() => '<span></span>').join('')}</div><div class="zy-tiles">${tiles.map((t) => `<button class="zy-tile" data-l="${t.l}">${t.l}</button>`).join('')}</div><p class="zy-msg" id="zyMsg"></p>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-l]');
        if (!b || b.disabled) return;
        if (b.dataset.l === word[got.length]) {
          K.$$('#zyS span', el)[got.length].textContent = b.dataset.l;
          got += b.dataset.l;
          b.disabled = true;
          K.audio.sfx.tap && K.audio.sfx.tap();
          if (got === word) {
            K.$('#zyS', el).classList.add('won');
            setTimeout(ok, 800);
          }
        } else {
          shake(K.$('#zyS', el));
          got = '';
          K.$$('#zyS span', el).forEach((s) => (s.textContent = ''));
          K.$$('.zy-tile', el).forEach((t) => (t.disabled = false));
          K.$('#zyMsg', el).textContent = 'Harfler geri kaçtı. Baştan.';
        }
      });
    },
    // Kaydırmalı resim: iki Kitty, bir sarılma
    slide(el, ch, ok) {
      const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
      const img = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD0E1"/><stop offset="1" stop-color="#FFF4F8"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/><circle cx="150" cy="120" r="90" fill="#fff" opacity=".6"/>${place(A.kitty({ crown: true, eyes: 'heart' }), 22, 70, 150, 150)}${place(A.kitty({ eyes: 'happy', bow: '#4FA3E3' }), 128, 70, 150, 150)}<path d="M150 70 C130 44 100 60 116 84 L150 112 L184 84 C200 60 170 44 150 70 Z" fill="#E3174D"/><text x="150" y="262" text-anchor="middle" font-family="Caveat, 'Snell Roundhand', 'Segoe Script', 'Brush Script MT', cursive" font-style="italic" font-size="30" fill="#C7386F">bir gün, bir yerde</text></svg>`;
      const data = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(img)}`;
      const url = `url("${data}")`; // JS ile atamak için
      const urlAttr = `url(&quot;${data}&quot;)`; // style="" içinde
      let tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 8 = boşluk
      const nb = (k) => [k - 3, k + 3, k % 3 ? k - 1 : -1, k % 3 < 2 ? k + 1 : -1].filter((x) => x >= 0 && x < 9);
      for (let s = 0, last = -1; s < 80; s++) {
        const e = tiles.indexOf(8);
        const opts = nb(e).filter((x) => x !== last);
        const m = opts[Math.floor(Math.random() * opts.length)];
        [tiles[e], tiles[m]] = [tiles[m], tiles[e]];
        last = e;
      }
      if (tiles.every((t, k) => t === k)) [tiles[6], tiles[7]] = [tiles[7], tiles[6]], [tiles[3], tiles[4]] = [tiles[4], tiles[3]];
      const draw = () => {
        K.$('.zy-slide', el).innerHTML = tiles.map((t, k) => (t === 8 ? `<span class="zy-gap"></span>` : `<button class="zy-pc" data-k="${k}" style="background-image:${urlAttr};background-position:${(t % 3) * 50}% ${Math.floor(t / 3) * 50}%" aria-label="Parça"></button>`)).join('');
      };
      el.innerHTML = `<div class="zy-slide"></div><p class="zy-msg" id="zyMsg">Boşluğun yanındaki parçaya dokun.</p><div class="actions" style="justify-content:center"><button class="btn ghost small" id="zyPeek">Resme bak</button></div>`;
      draw();
      el.addEventListener('click', (e) => {
        if (e.target.closest('#zyPeek')) {
          const s = K.$('.zy-slide', el);
          s.classList.add('peek');
          s.style.backgroundImage = url;
          setTimeout(() => s.classList.remove('peek'), 1500);
          return;
        }
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = +b.dataset.k;
        const g = tiles.indexOf(8);
        if (!nb(g).includes(k)) return shake(b);
        [tiles[g], tiles[k]] = [tiles[k], tiles[g]];
        K.audio.sfx.tap && K.audio.sfx.tap();
        draw();
        if (tiles.every((t, j) => t === j)) {
          const s = K.$('.zy-slide', el);
          s.classList.add('won');
          s.style.backgroundImage = url;
          setTimeout(ok, 1000);
        }
      });
    },
  };

  K.room({
    id: 'zaman-yolcusu',
    wing: 'zaman',
    title: 'Zaman Yolcusu',
    sub: 'Yedi an, yedi kapı, her gün bir tane',
    icon: 'hourglass',
    color: '#EFE0C8',
    hidden: () => !D.zaman,
    badge: () => {
      if (!D.zaman) return '';
      const i = Z().chapters.findIndex((ch, k) => !done().includes(ch.id) && state(k).open);
      return i >= 0 ? 'Yeni kapı açık' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="zy-top">
          <div class="zy-film" aria-hidden="true">${A.icon('hourglass')}</div>
          <div>${K.paras(Z().intro)}</div>
        </div>
        <div class="zy-prog" id="zyProg"><i></i><span id="zyCount"></span></div>
        <div class="zy-list" id="zyList"></div>
        <div class="zy-stage" id="zyStage" hidden></div>`;
      el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-ch]');
        if (t) {
          const i = +t.dataset.ch;
          const s = state(i);
          if (!s.open) return K.fx.toast(`Bu kapı henüz kilitli: ${s.why.toLocaleLowerCase('tr')}. Geçmiş acele etmeyi sevmez.`, { icon: A.icon('hourglass') });
          openChapter(i);
        }
        if (e.target.closest('[data-next]') && cur != null && cur + 1 < Z().chapters.length) {
          const s = state(cur + 1);
          if (s.open) openChapter(cur + 1);
          else K.fx.toast(`Sıradaki kapı ${s.why.toLocaleLowerCase('tr')}.`, { icon: A.icon('hourglass') });
        }
      });
    },
    enter() {
      start();
      renderList();
    },
    leave() {
      cleanup && cleanup();
    },
  });
})();
