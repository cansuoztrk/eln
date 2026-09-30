/* Oda: Günün Kelimesi — her gün beş harfli bir kelime, hepsi bizim hikâyemizden (Köpüş, Hazar, Boğaz, özlem...).
   Altı hak; yeşil doğru yer, sarı başka yerde, gri yok. İkiniz de aynı kelimeyi çözer: sen bitirmeden onun tahtası
   sadece renk olarak görünür (harfler gizli), bitirince harfleriyle açılır. Seri ve kim kaç denemede bildi.
   Kayıt: kelime {day, guesses, won} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const KL = () => D.kelime || { intro: [], words: ['KİTTY'], notes: {} };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const ROWS = [['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'], ['↵', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', '⌫']];
  const LETTERS = new Set(ROWS.flat().filter((k) => k.length === 1));

  let root, rows = [], cur = '', busy = false;

  const day = () => T.todayKey();
  const word = (k = day()) => {
    const w = KL().words || ['KİTTY'];
    const n = T.dayNumber(T.at(k));
    return [...w[((n % w.length) + w.length) % w.length]];
  };
  const store = () => K.store.get(`kelime-${mine()}-${day()}`, { g: [], done: false, won: false });
  const save = (s) => K.store.set(`kelime-${mine()}-${day()}`, s);

  // Wordle puanlaması (tekrarlanan harfler doğru sayılır)
  function score(guess, ans) {
    const res = Array(5).fill('x');
    const left = {};
    ans.forEach((c, i) => {
      if (guess[i] === c) res[i] = 'g';
      else left[c] = (left[c] || 0) + 1;
    });
    guess.forEach((c, i) => {
      if (res[i] === 'g') return;
      if (left[c]) {
        res[i] = 'y';
        left[c]--;
      }
    });
    return res;
  }
  const theirs = (k = day()) => rows.filter((r) => r.who === other() && r.data.day === k).pop();
  const mineRow = (k = day()) => rows.filter((r) => r.who === mine() && r.data.day === k).pop();

  function board(guesses, ans, opt = {}) {
    const out = [];
    for (let r = 0; r < 6; r++) {
      const g = guesses[r];
      const isCur = !opt.readonly && r === guesses.length;
      const letters = g ? [...g] : isCur ? [...cur] : [];
      const sc = g ? score([...g], ans) : null;
      out.push(`<div class="kl-row ${isCur ? 'cur' : ''}">${Array.from({ length: 5 }, (_, i) => {
        const ch = letters[i] || '';
        const cls = sc ? sc[i] : ch ? 'typed' : '';
        return `<span class="kl-t ${cls}" style="--i:${i}">${opt.hide && sc ? '' : K.esc(ch)}</span>`;
      }).join('')}</div>`);
    }
    return `<div class="kl-board ${opt.small ? 'small' : ''}">${out.join('')}</div>`;
  }
  function keyboard(guesses, ans) {
    const state = {};
    guesses.forEach((g) => {
      const sc = score([...g], ans);
      [...g].forEach((c, i) => {
        const v = sc[i];
        if (v === 'g' || (v === 'y' && state[c] !== 'g') || (!state[c] && v === 'x')) state[c] = v;
      });
    });
    return `<div class="kl-kb">${ROWS.map((r) => `<div>${r.map((k) => `<button type="button" class="${state[k] || ''} ${k.length > 1 || k === '↵' || k === '⌫' ? 'wide' : ''}" data-k="${k}" aria-label="${k === '↵' ? 'Gönder' : k === '⌫' ? 'Sil' : k}">${k}</button>`).join('')}</div>`).join('')}</div>`;
  }
  function stats() {
    const byDay = {};
    rows.forEach((r) => {
      byDay[r.data.day] = byDay[r.data.day] || {};
      byDay[r.data.day][r.who] = r.data;
    });
    let mw = 0, hw = 0, streak = 0;
    Object.values(byDay).forEach((d) => {
      if (d.me && d.her && d.me.won && d.her.won) {
        if (d.me.guesses.length < d.her.guesses.length) mw++;
        else if (d.her.guesses.length < d.me.guesses.length) hw++;
      }
    });
    // Benim serim: bugünden (ya da dünden) geriye ardışık kazanılan günler
    let k = day();
    const prev = (x) => {
      const d = new Date(x + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    };
    if (!(byDay[k] && byDay[k][mine()])) k = prev(k);
    while (byDay[k] && byDay[k][mine()] && byDay[k][mine()].won) {
      streak++;
      k = prev(k);
    }
    return { mw, hw, streak, played: rows.filter((r) => r.who === mine()).length };
  }
  function render() {
    if (!root) return;
    const s = store();
    const ans = word();
    const t = theirs();
    const st = stats();
    K.$('#klMine', root).innerHTML = `${board(s.g, ans)}${s.done ? `<p class="kl-res ${s.won ? 'won' : ''}">${s.won ? `${s.g.length}. denemede buldun!` : `Bugünün kelimesi: <b>${ans.join('')}</b>`}${KL().notes && KL().notes[ans.join('')] ? `<br><span class="hand">${K.esc(KL().notes[ans.join('')])}</span>` : ''}</p>` : ''}`;
    K.$('#klKb', root).innerHTML = s.done ? '' : keyboard(s.g, ans);
    K.$('#klThem', root).innerHTML = t
      ? `<p class="card-eyebrow">${K.esc(nameOf(other()))} · ${t.data.won ? `${t.data.guesses.length}. denemede buldu` : 'bulamadı'}</p>${board(t.data.guesses, ans, { readonly: true, hide: !s.done, small: true })}${s.done ? '' : '<p class="muted small">Harfleri sen bitirince açılır.</p>'}`
      : `<p class="card-eyebrow">${K.esc(nameOf(other()))}</p><p class="muted small">Bugünkünü henüz çözmedi.</p>`;
    K.$('#klStats', root).innerHTML = `<span><b>${st.streak}</b> günlük serin</span><span><b>${st.played}</b> gün oynadın</span>${st.mw + st.hw ? `<span>Daha az denemede bulan: ${K.esc(C.myPet)} <b>${st.mw}</b> · ${K.esc(C.herPet)} <b>${st.hw}</b></span>` : ''}`;
  }
  async function submit() {
    const s = store();
    if (s.done || busy) return;
    if ([...cur].length < 5) {
      const row = K.$('.kl-row.cur', root);
      if (row) {
        row.classList.remove('shake');
        void row.offsetWidth;
        row.classList.add('shake');
      }
      return;
    }
    busy = true;
    const ans = word();
    s.g.push(cur);
    const sc = score([...cur], ans);
    cur = '';
    const won = sc.every((x) => x === 'g');
    if (won || s.g.length >= 6) {
      s.done = true;
      s.won = won;
    }
    save(s);
    render();
    const row = K.$$('.kl-row', root)[s.g.length - 1];
    if (row) row.classList.add('flip');
    K.audio.sfx.tap();
    await K.wait(900);
    if (s.done) {
      if (won) {
        K.audio.sfx.success();
        K.fx.confetti({ count: 110 });
        K.stickers.award('kelime');
      } else K.audio.sfx.fail();
      if (K.cloud && K.cloud.enabled && !mineRow()) {
        const r = await K.cloud.add('kelime', { day: day(), guesses: s.g, won });
        if (r) rows.push(r);
        if (!K.isOwner()) K.notify(`Günün Kelimesi: ${C.herName} ${won ? `${s.g.length}. denemede buldu` : 'bulamadı'}`, '', ['abc']);
      }
      render();
    }
    busy = false;
  }
  function press(k) {
    const s = store();
    if (s.done) return;
    if (k === '↵' || k === 'ENTER') return submit();
    if (k === '⌫' || k === 'BACKSPACE') cur = [...cur].slice(0, -1).join('');
    else if (LETTERS.has(k) && [...cur].length < 5) cur += k;
    else return;
    const row = K.$('.kl-row.cur', root);
    if (row)
      K.$$('.kl-t', row).forEach((t, i) => {
        const ch = [...cur][i] || '';
        t.textContent = ch;
        t.classList.toggle('typed', Boolean(ch));
      });
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    rows = await K.cloud.list('kelime', 400);
    K.cloud.on('kelime', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine() && r.data.day === day()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} günün kelimesini ${r.data.won ? `${r.data.guesses.length}. denemede buldu` : 'bulamadı'}.</b> <a href="#kelime">Sen de dene</a>`, { icon: A.icon('cards'), duration: 7000 });
      if (K.activeRoom === 'kelime') render();
    });
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const t = theirs();
    return t && !store().done ? [{ icon: 'cards', title: `${nameOf(t.who)} günün kelimesini ${t.data.won ? `${t.data.guesses.length}. denemede buldu` : 'bulamadı'}`, text: 'Aynı kelime sende de. Sen kaçta bulacaksın?', room: 'kelime', cta: 'Oyna' }] : [];
  });

  K.room({
    id: 'kelime',
    wing: 'oyun',
    title: 'Günün Kelimesi',
    sub: 'Her gün beş harf, hepsi bizden',
    icon: 'cards',
    color: '#E3F6EC',
    hidden: () => !D.kelime,
    badge: () => (store().done ? '' : 'Bugünkü seni bekliyor'),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(KL().intro)}</div>
        <div class="kl-wrap"><section class="kl-main"><div id="klMine"></div><div id="klKb"></div></section>
        <aside class="kl-side"><div class="card" id="klThem"></div><div class="kl-stats" id="klStats"></div></aside></div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k]');
        if (b) press(b.dataset.k);
      });
      document.addEventListener('keydown', (e) => {
        if (K.activeRoom !== 'kelime' || e.ctrlKey || e.metaKey || e.altKey || document.body.classList.contains('has-modal')) return;
        if (e.target.closest && e.target.closest('input, textarea')) return;
        const k = e.key === 'Enter' ? 'ENTER' : e.key === 'Backspace' ? 'BACKSPACE' : e.key.toLocaleUpperCase('tr');
        if (k === 'ENTER' || k === 'BACKSPACE' || LETTERS.has(k)) {
          e.preventDefault();
          press(k);
        }
      });
    },
    enter() {
      render();
    },
  });
  K.kelime = { word: () => word().join(''), score };
})();
