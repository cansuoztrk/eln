/* Oda: Kart Atölyesi (Hareketli Tebrik Kartı) — animasyonlu kartını kendin yap: zemin, çıkartmalar (dokun, sürükle,
   büyüt), başlık ve mesaj, yazı tipi, küçük bir müzik ve bir yağmur (konfeti, kalp, kar, yıldız). Gönderilen kart onun
   ekranında mühürlü bir zarf olarak durur; mühür kırılınca kart açılır, çıkartmalar sırayla gelir, yazı yazılır, müzik
   çalar. Kayıtlar: tebrik {bg, items:[{e, x, y, s}], title, msg, font, muzik, anim} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const BG = [['pembe', 'Pembe bulut', 'linear-gradient(160deg,#ffe1ec,#fff7fb 55%,#e9e1ff)'], ['gece', 'Yıldızlı gece', 'radial-gradient(circle at 70% 10%,#5a46a8,#1b1440 70%)'], ['bahar', 'Zambak bahçesi', 'linear-gradient(180deg,#d8f5e8,#fffdf3 70%)'], ['kis', 'Kar', 'linear-gradient(180deg,#dcecff,#ffffff 70%)'], ['dogum', 'Kutlama', 'linear-gradient(160deg,#fff1c9,#ffd6e5)']];
  const STK = ['🎀', '💗', '💌', '🌸', '🌷', '⭐', '🌙', '☀️', '🎂', '🎈', '🎁', '🐱', '🐶', '🍫', '🧸', '👑', '🦋', '❄️', '🌹', '🕊️'];
  const FONT = [['el', 'El yazısı'], ['zarif', 'Zarif'], ['yuvarlak', 'Yuvarlak']];
  const ANIM = [['konfeti', 'Konfeti'], ['kalp', 'Kalpler'], ['kar', 'Kar'], ['yildiz', 'Yıldız']];
  // Küçük müzikler: [nota (Hz), süre (vuruş)]
  const N = { C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784 };
  const MUZIK = {
    dogum: ['Mutlu yıllar', [['C4', 0.75], ['C4', 0.25], ['D4', 1], ['C4', 1], ['F4', 1], ['E4', 2], ['C4', 0.75], ['C4', 0.25], ['D4', 1], ['C4', 1], ['G4', 1], ['F4', 2]]],
    ninni: ['Ninni', [['E4', 1], ['G4', 1], ['E4', 2], ['E4', 1], ['G4', 1], ['E4', 2], ['F4', 1], ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 2]]],
    nese: ['Neşeli', [['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['E5', 0.5], ['F5', 0.5], ['D5', 0.5], ['E5', 1], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['C5', 0.5], ['G4', 1.5]]],
    ask: ['Romantik', [['A4', 1.5], ['C5', 0.5], ['E5', 2], ['D5', 1], ['C5', 1], ['B4', 2], ['A4', 1.5], ['B4', 0.5], ['C5', 1], ['E5', 1], ['A4', 3]]],
    yok: ['Sessiz', []],
  };
  let rows = [], loaded = false, root = null, draft = null, sel = -1, player = null;
  const fresh = () => ({ bg: 'pembe', items: [{ e: '🎀', x: 0.2, y: 0.18, s: 1.4 }, { e: '💗', x: 0.78, y: 0.8, s: 1.2 }], title: 'Sana', msg: '', font: 'el', muzik: 'ask', anim: 'kalp' });
  function play(key) {
    stop();
    const m = MUZIK[key];
    if (!m || !m[1].length || (K.atolye && K.atolye.get().ses === false)) return;
    K.audio.ensure && K.audio.ensure();
    const c = K.audio.ctx;
    if (!c) return;
    const beat = 0.42;
    let t = c.currentTime + 0.15;
    const nodes = [];
    m[1].forEach(([n, d]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.value = N[n];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d * beat * 0.95);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + d * beat);
      nodes.push(o);
      t += d * beat;
    });
    player = nodes;
  }
  function stop() {
    (player || []).forEach((o) => {
      try {
        o.stop();
      } catch (e) {}
    });
    player = null;
  }
  const bgOf = (id) => (BG.find((b) => b[0] === id) || BG[0])[2];
  function cardHtml(d, cls = '') {
    return `<div class="tb-kart ${cls} font-${d.font} bg-${d.bg}" style="background:${bgOf(d.bg)}">
      ${d.items.map((it, i) => `<span class="tb-st ${i === sel && cls === 'duzen' ? 'sec' : ''}" data-tb-i="${i}" style="left:${(it.x * 100).toFixed(1)}%;top:${(it.y * 100).toFixed(1)}%;--s:${it.s};--d:${(0.5 + i * 0.25).toFixed(2)}s">${it.e}</span>`).join('')}
      <div class="tb-yazi"><h3>${K.esc(d.title || '')}</h3><p>${K.esc(d.msg || '')}</p></div></div>`;
  }
  function editor() {
    if (!draft) draft = fresh();
    const d = draft;
    K.$('#tbDuzen', root).innerHTML = `<div class="tb-sahne" id="tbSahne">${cardHtml(d, 'duzen')}</div>
      <p class="muted small center">Çıkartmaya dokunup sürükle; seçiliyken aşağıdan büyüt ya da sil.</p>
      <div class="tb-st-ara">${sel >= 0 ? `<button type="button" class="btn soft small" data-tb="buyut">＋ Büyüt</button><button type="button" class="btn soft small" data-tb="kucult">－ Küçült</button><button type="button" class="btn ghost small" data-tb="sil">Sil</button>` : ''}</div>
      <p class="card-eyebrow">Çıkartma ekle</p><div class="tb-paleti">${STK.map((e) => `<button type="button" data-tb-ekle="${e}">${e}</button>`).join('')}</div>
      <p class="card-eyebrow">Zemin</p><div class="tb-sec">${BG.map(([id, n]) => `<button type="button" class="btn ${d.bg === id ? 'red' : 'soft'} small" data-tb-set="bg:${id}">${n}</button>`).join('')}</div>
      <input class="input" id="tbBaslik" maxlength="40" value="${K.esc(d.title)}" placeholder="Başlık">
      <textarea class="input" id="tbMesaj" maxlength="280" rows="3" placeholder="Mesajın...">${K.esc(d.msg)}</textarea>
      <p class="card-eyebrow">Yazı</p><div class="tb-sec">${FONT.map(([id, n]) => `<button type="button" class="btn ${d.font === id ? 'red' : 'soft'} small" data-tb-set="font:${id}">${n}</button>`).join('')}</div>
      <p class="card-eyebrow">Müzik</p><div class="tb-sec">${Object.entries(MUZIK).map(([id, [n]]) => `<button type="button" class="btn ${d.muzik === id ? 'red' : 'soft'} small" data-tb-set="muzik:${id}">${n}</button>`).join('')}</div>
      <p class="card-eyebrow">Yağmur</p><div class="tb-sec">${ANIM.map(([id, n]) => `<button type="button" class="btn ${d.anim === id ? 'red' : 'soft'} small" data-tb-set="anim:${id}">${n}</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn soft" data-tb="onizle">▶ Önizle</button><button type="button" class="btn red" data-tb="gonder">💌 ${K.esc(K.ek(nameOf(other()), 'e'))} gönder</button></div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'tebrik') return;
    editor();
    const got = rows.filter((r) => r.who === other()).sort((a, b) => b.at - a.at);
    const seen = K.store.get('tbSeen', []);
    K.$('#tbGelen', root).innerHTML = got.length ? `<p class="card-eyebrow">Sana gelen kartlar</p><div class="tb-zarflar">${got.map((r) => `<button type="button" class="tb-zarf ${seen.includes(r.id) ? '' : 'yeni'}" data-tb-ac="${r.id}">${K.muhur ? K.muhur.mini(r.who) : '💌'}<b>${K.esc(r.data.title || 'Bir kart')}</b><small>${K.esc(T.fmtShort(new Date(r.at)))}</small></button>`).join('')}</div>` : `<p class="muted center">${K.esc(nameOf(other()))} henüz bir kart göndermedi.</p>`;
  }
  // Kartı aç: mühür kırılır, kart açılır, çıkartmalar sırayla gelir, yazı yazılır, müzik ve yağmur
  function show(d, who) {
    const ov = K.el(`<div class="tb-goster" role="dialog" aria-modal="true" aria-label="Kart"><button type="button" class="icon-btn tb-x" aria-label="Kapat">${A.ui('close')}</button><div class="tb-goster-ic"></div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    const ic = K.$('.tb-goster-ic', ov);
    const open = () => {
      ic.innerHTML = cardHtml(d, 'acilis');
      const p = K.$('.tb-yazi p', ic);
      const full = d.msg || '';
      p.textContent = '';
      let i = 0;
      const typer = setInterval(() => {
        p.textContent = full.slice(0, ++i);
        if (i >= full.length) clearInterval(typer);
      }, 38);
      play(d.muzik);
      const shapes = { konfeti: ['star', 'heart', 'bow'], kalp: ['heart'], kar: ['star'], yildiz: ['star'] }[d.anim] || ['heart'];
      const colors = d.anim === 'kar' ? ['#ffffff', '#dcecff', '#bfe6ff'] : d.anim === 'yildiz' ? ['#FFE38A', '#FFD34E', '#ffffff'] : ['#FF8FB8', '#E3174D', '#FFD6E5', '#CDB8FF'];
      setTimeout(() => K.fx.rain({ count: 50, shapes, colors, duration: 2600 }), 600);
    };
    if (K.muhur && who) K.muhur.breakOpen(ic, who, open);
    else open();
    K.$('.tb-x', ov).addEventListener('click', () => {
      stop();
      ov.classList.remove('in');
      setTimeout(() => ov.remove(), 350);
    });
  }
  // Sürükle
  let drag = null;
  function onDown(e) {
    const st = e.target.closest('.tb-kart.duzen .tb-st');
    if (!st) return;
    e.preventDefault();
    sel = +st.dataset.tbI;
    const box = st.parentNode.getBoundingClientRect();
    drag = { st, box };
    st.setPointerCapture && st.setPointerCapture(e.pointerId);
    K.$$('.tb-st.sec', root).forEach((x) => x.classList.remove('sec'));
    st.classList.add('sec');
  }
  function onMove(e) {
    if (!drag) return;
    const x = K.clamp((e.clientX - drag.box.left) / drag.box.width, 0.04, 0.96), y = K.clamp((e.clientY - drag.box.top) / drag.box.height, 0.04, 0.96);
    draft.items[sel].x = x;
    draft.items[sel].y = y;
    drag.st.style.left = `${(x * 100).toFixed(1)}%`;
    drag.st.style.top = `${(y * 100).toFixed(1)}%`;
  }
  function onUp() {
    if (!drag) return;
    drag = null;
    editor();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('tebrik', 300);
    loaded = true;
    K.cloud.on('tebrik', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), K.activeRoom === 'tebrik' && render(), K.renderSpecials && !K.activeRoom && K.renderSpecials()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const seen = K.store.get('tbSeen', []);
    const n = rows.filter((r) => r.who === other() && !seen.includes(r.id));
    return n.length ? [{ key: 'tebrik', icon: 'letter', title: `💌 ${nameOf(other())} sana bir kart gönderdi`, text: `"${n[0].data.title || 'Bir kart'}" · mührü kırınca açılacak.`, run: () => (K.go('tebrik'), setTimeout(() => openRow(n[0].id), 600)), cta: 'Mührü kır' }] : [];
  });
  function openRow(id) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    const seen = K.store.get('tbSeen', []);
    seen.includes(id) || (seen.push(id), K.store.set('tbSeen', seen.slice(-200)));
    show(r.data, r.who);
    render();
  }
  K.room({
    id: 'tebrik',
    wing: 'kalp',
    title: 'Kart Atölyesi',
    sub: 'Hareketli tebrik kartları',
    icon: 'letter',
    color: '#FFE9F2',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (loaded ? String(rows.filter((r) => r.who === other() && !K.store.get('tbSeen', []).includes(r.id)).length || '') : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kendi animasyonlu kartını yap: zemin, çıkartmalar, bir mesaj, küçük bir müzik ve bir yağmur. Gönderdiğin kart onun ekranında mühürlü bir zarf olarak bekler; mührü kırınca açılır.</p></div>
        <section class="card" id="tbGelen"></section><section class="card tb-duzen" id="tbDuzen"></section>`;
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      el.addEventListener('input', (e) => {
        if (e.target.id === 'tbBaslik') (draft.title = e.target.value), (K.$('.tb-kart.duzen h3', el).textContent = e.target.value);
        if (e.target.id === 'tbMesaj') (draft.msg = e.target.value), (K.$('.tb-kart.duzen .tb-yazi p', el).textContent = e.target.value);
      });
      el.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-tb-ac]');
        if (a) return openRow(a.dataset.tbAc);
        const add = e.target.closest('[data-tb-ekle]');
        if (add) {
          draft.items.push({ e: add.dataset.tbEkle, x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4, s: 1.2 });
          sel = draft.items.length - 1;
          K.audio.sfx.pop();
          return editor();
        }
        const st = e.target.closest('[data-tb-set]');
        if (st) {
          const [k, v] = st.dataset.tbSet.split(':');
          draft[k] = v;
          if (k === 'muzik') play(v);
          return editor();
        }
        const b = e.target.closest('[data-tb]');
        if (!b) return;
        const act = b.dataset.tb;
        if (act === 'buyut' && sel >= 0) draft.items[sel].s = Math.min(3, draft.items[sel].s + 0.25);
        if (act === 'kucult' && sel >= 0) draft.items[sel].s = Math.max(0.6, draft.items[sel].s - 0.25);
        if (act === 'sil' && sel >= 0) draft.items.splice(sel, 1), (sel = -1);
        if (act === 'onizle') return show(draft, mine());
        if (act === 'gonder') {
          if (!draft.msg.trim() && !draft.title.trim()) return K.fx.toast('Bir başlık ya da mesaj yaz.', { duration: 2000 });
          b.disabled = true;
          const r = await K.cloud.add('tebrik', draft);
          b.disabled = false;
          if (!r) return K.fx.toast('Gönderilemedi.');
          rows.push(r);
          draft = null;
          sel = -1;
          K.audio.sfx.whoosh();
          K.stickers.award('tebrik');
          K.ping(`💌 ${K.meName()} sana bir kart yaptı`, `"${r.data.title || 'Bir kart'}" · mührü kırınca açılacak.`, ['love_letter'], { click: K.roomUrl('tebrik') });
          K.fx.toast('💌 Kart mühürlendi ve gönderildi.', { duration: 2400 });
          return render();
        }
        editor();
      });
    },
    enter() {
      render();
    },
    leave() {
      stop();
    },
  });
})();
