/* Oda: Şifreli Mektup — her hafta (Bakü pazartesisinden) şifreli bir cümle. Her harf bir simgeye dönüşmüş; anahtarın
   yarısı Eln'de, yarısı Ardoş'ta. Bir simgeye harf yazınca ikimizin tahtasında da görünür (son yazan kazanır). Bütün
   simgeler doğru olunca mektup açılır. Kayıtlar: bulmaca {week, sym, ch} · bulmacacoz {week} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const BM = () => D.bulmaca || { intro: [], sentences: [], solved: '' };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const SYM = ['🌙', '⭐', '🌸', '🎀', '🍓', '🐚', '🌊', '🍀', '🦋', '🌷', '🍒', '🐾', '☕', '🎈', '🧁', '🍭', '🔔', '🌻', '🍑', '🫧', '🪐', '🌈', '🔥', '🍯', '🐝', '🦢', '🌹', '💎', '🍬', '🧸', '🎵', '🗝', '🏰', '🐱', '🌼', '🍋', '🍩', '🪁'];
  const ABC = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZƏ'.split('');

  let rows = [], loaded = false, root = null, sel = null, flash = {};
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  function weekOf(k) {
    const d = new Date(k + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  const thisWeek = () => weekOf(T.todayKey());
  const weekNo = (w) => Math.round(Date.parse(w + 'T12:00:00Z') / (7 * 864e5));
  function puzzle(w) {
    const S = BM().sentences || [];
    if (!S.length) return null;
    const text = S[((weekNo(w) % S.length) + S.length) % S.length];
    const letters = [...new Set(text.replace(/ /g, '').split(''))];
    const r = K.rng(K.hash('bulmaca' + w));
    const syms = K.shuffle(SYM.slice(), r).slice(0, letters.length);
    const map = {}, rev = {};
    letters.forEach((ch, i) => ((map[ch] = i), (rev[i] = ch)));
    // Anahtar: harfler karışık sırayla ikiye bölünür
    const order = K.shuffle(letters.map((_, i) => i), r);
    const half = { her: order.filter((_, i) => i % 2 === 0), me: order.filter((_, i) => i % 2 === 1) };
    return { w, text, letters, syms, map, rev, half };
  }
  const guesses = (w) => {
    const g = {};
    rows.filter((r) => r.kind === 'bulmaca' && r.data.week === w).sort((a, b) => a.at - b.at).forEach((r) => (g[r.data.sym] = { ch: r.data.ch, who: r.who }));
    return g;
  };
  const solvedRow = (w) => rows.find((r) => r.kind === 'bulmacacoz' && r.data.week === w) || null;
  const isSolved = (p, g) => p.letters.every((ch, i) => g[i] && g[i].ch === ch);

  function board(p, g, solved) {
    let k = 0;
    return p.text
      .split(' ')
      .map(
        (word) =>
          `<span class="bm-word">${word
            .split('')
            .map((ch) => {
              const i = p.map[ch];
              const v = g[i];
              k++;
              return `<button type="button" class="bm-cell ${sel === i ? 'sel' : ''} ${v ? 'has ' + v.who : ''} ${flash[i] ? 'flash' : ''}" data-bm="${i}" style="--k:${k}" ${solved ? 'disabled' : ''}><i>${p.syms[i]}</i><b>${solved ? ch : v ? K.esc(v.ch) : ''}</b></button>`;
            })
            .join('')}</span>`
      )
      .join('');
  }
  function render() {
    if (!root || K.activeRoom !== 'bulmaca') return;
    const p = puzzle(thisWeek());
    if (!p) return;
    const g = guesses(p.w);
    const solved = solvedRow(p.w) || isSolved(p, g);
    const filled = p.letters.filter((_, i) => g[i]).length;
    const myKey = p.half[mine()];
    K.$('#bmHead', root).innerHTML = `<p class="card-eyebrow">Bu haftanın mektubu · ${K.esc(T.fmtShort(p.w))} haftası</p><p class="bm-prog"><b class="tnum">${filled}/${p.letters.length}</b> simge dolu${K.cloud && K.cloud.otherHere() ? ` · <span class="bm-here">${K.esc(nameOf(mine() === 'me' ? 'her' : 'me'))} şu an burada</span>` : ''}</p>`;
    K.$('#bmBoard', root).innerHTML = `<div class="bm-board ${solved ? 'solved' : ''}">${board(p, g, solved)}</div>${solved ? `<p class="bm-done hand">💌 ${K.esc(BM().solved || '')}</p>` : filled === p.letters.length ? '<p class="bm-err">Bütün simgeler dolu ama bir yerde hata var. Anahtarlarınızı karşılaştırın.</p>' : ''}`;
    K.$('#bmKey', root).innerHTML = `<p class="card-eyebrow">🔑 Senin anahtarın (yarısı)</p><div class="bm-keys">${myKey.map((i) => `<span><i>${p.syms[i]}</i>=<b>${p.rev[i]}</b></span>`).join('')}</div><p class="muted small">Öbür yarısı ${K.esc(nameOf(mine() === 'me' ? 'her' : 'me'))}'da. Birbirinize söyleyin ya da kendi yarınızı tahtaya yazın.</p>`;
    const kb = K.$('#bmKb', root);
    kb.hidden = sel == null || solved;
    if (sel != null) kb.innerHTML = `<p class="bm-kb-h"><i>${p.syms[sel]}</i> hangi harf?</p><div class="bm-abc">${ABC.map((ch) => `<button type="button" data-bm-ch="${ch}">${ch}</button>`).join('')}<button type="button" class="wide" data-bm-ch="">Sil</button></div>`;
    const past = rows.filter((r) => r.kind === 'bulmacacoz' && r.data.week !== p.w).sort((a, b) => b.at - a.at);
    K.$('#bmPast', root).innerHTML = past.length ? `<p class="card-eyebrow">Açılan mektuplar · ${past.length}</p><ul class="bm-past">${past.map((r) => `<li><small>${K.esc(T.fmtShort(r.data.week))}</small><span class="hand">${K.esc(puzzle(r.data.week).text)}</span></li>`).join('')}</ul>` : '';
  }
  async function setCh(ch) {
    const p = puzzle(thisWeek());
    if (sel == null || !p) return;
    const i = sel;
    const g = guesses(p.w);
    if ((g[i] ? g[i].ch : '') === ch) return (sel = null), render();
    sel = null;
    const r = await K.cloud.add('bulmaca', { week: p.w, sym: i, ch });
    push(r);
    K.audio.sfx.tap();
    render();
    check();
  }
  async function check() {
    const p = puzzle(thisWeek());
    const g = guesses(p.w);
    if (!isSolved(p, g) || solvedRow(p.w)) return;
    rows.push({ id: 'tmp', kind: 'bulmacacoz', data: { week: p.w }, at: Date.now() });
    const r = await K.cloud.add('bulmacacoz', { week: p.w });
    rows = rows.filter((x) => x.id !== 'tmp');
    push(r);
    celebrate(p);
  }
  function celebrate(p) {
    K.fx.confetti({ count: 120 });
    K.audio.sfx.success();
    K.stickers.award('bulmaca');
    if (K.store.get('bmToast') !== p.w) {
      K.store.set('bmToast', p.w);
      K.ping(`💌 Şifreli mektup açıldı`, p.text, ['love_letter'], { click: K.roomUrl('bulmaca'), priority: 3 });
    }
    render();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(['bulmaca', 'bulmacacoz'], { limit: 3000 });
    loaded = true;
    ['bulmaca', 'bulmacacoz'].forEach((k) =>
      K.cloud.on(k, (r) => {
        if (!push(r)) return;
        if (k === 'bulmaca' && r.who !== mine()) {
          flash[r.data.sym] = 1;
          setTimeout(() => delete flash[r.data.sym], 1200);
        }
        if (k === 'bulmacacoz' && r.who !== mine() && K.activeRoom === 'bulmaca') {
          K.fx.confetti({ count: 120 });
          K.stickers.award('bulmaca');
        }
        render();
        K.renderSpecials && !K.activeRoom && K.renderSpecials();
      })
    );
    render();
  });
  K.on('presence', () => render());
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !D.bulmaca) return [];
    const w = thisWeek();
    if (solvedRow(w) || K.store.get('bmCard') === w) return [];
    const p = puzzle(w);
    const n = p ? p.letters.filter((_, i) => guesses(w)[i]).length : 0;
    return [{ icon: 'letter', title: '🔐 Bu haftanın şifreli mektubu', text: n ? `${n}/${p.letters.length} simge dolu. Anahtarın yarısı sende.` : 'Yeni mektup geldi. Anahtarın yarısı sende, yarısı onda.', run: () => (K.store.set('bmCard', w), K.go('bulmaca')), cta: 'Çöz' }];
  });

  K.room({
    id: 'bulmaca',
    wing: 'oyun',
    title: 'Şifreli Mektup',
    sub: 'Anahtarın yarısı sende, yarısı onda',
    icon: 'letter',
    color: '#F1E6FF',
    hidden: () => !D.bulmaca || !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && !solvedRow(thisWeek()) ? 'Yeni' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(BM().intro || [])}</div>
        <section class="card bm-card"><div id="bmHead"></div><div id="bmBoard"></div><div class="bm-kb" id="bmKb" hidden></div></section>
        <section class="card bm-keycard" id="bmKey"></section>
        <section class="card bm-pastcard" id="bmPast"></section>`;
      el.addEventListener('click', (e) => {
        const c = e.target.closest('[data-bm]');
        if (c) {
          sel = sel === +c.dataset.bm ? null : +c.dataset.bm;
          render();
          if (sel != null) setTimeout(() => K.$('#bmKb', root).scrollIntoView({ block: 'nearest', behavior: K.reduced ? 'auto' : 'smooth' }), 30);
          return;
        }
        const k = e.target.closest('[data-bm-ch]');
        if (k) setCh(k.dataset.bmCh);
      });
    },
    enter() {
      sel = null;
      render();
    },
    leave() {
      sel = null;
    },
  });
})();
