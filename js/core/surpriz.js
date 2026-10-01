/* Kale 2.0 — Zamanlı Sürpriz: bir not yaz, ne zaman açılacağını seç (onun saatiyle yarın sabah, bu gece, bir saat sonra
   ya da istediğin an). O saate kadar mühürlü; ana salonda sadece "sana 08:00'de açılacak bir not var" diye bekler.
   Zamanı gelince zarf onun ekranında açılır; açtığında sana haber gelir.
   Kayıtlar: zamanli {to, at, text, emoji} · zamanliac {ref} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const SP = () => D.surpriz || { ideas: [], emojis: ['💌'] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const tzOf = (w) => (w === 'her' ? C.tzBaku : C.tzIstanbul);
  const cityOf = (w) => (w === 'her' ? C.herCity || 'Bakü' : C.myCity || 'İstanbul');

  let rows = [], opens = [];
  const opened = (id) => opens.some((r) => r.data.ref === id);
  const forMe = () => rows.filter((r) => r.data.to === mine() && !opened(r.id));
  const due = () => forMe().filter((r) => r.data.at <= Date.now());
  const waiting = () => forMe().filter((r) => r.data.at > Date.now()).sort((a, b) => a.data.at - b.data.at);
  const mineSent = () => rows.filter((r) => r.who === mine()).sort((a, b) => b.at - a.at);

  // Alıcının saat diliminde "YYYY-MM-DD HH:MM" → zaman damgası
  const atIn = (w, y, mo, d, h, mi) => Date.UTC(y, mo - 1, d, h, mi) - tzOf(w) * 36e5;
  const hmIn = (w, at) => {
    const p = T.parts(tzOf(w), new Date(at));
    return `${K.pad(p.h)}:${K.pad(p.mi)}`;
  };
  const whenText = (w, at) => {
    const p = T.parts(tzOf(w), new Date(at));
    const t = T.parts(tzOf(w));
    const same = p.y === t.y && p.mo === t.mo && p.d === t.d;
    const tom = new Date(Date.UTC(t.y, t.mo - 1, t.d + 1));
    const isTom = p.y === tom.getUTCFullYear() && p.mo === tom.getUTCMonth() + 1 && p.d === tom.getUTCDate();
    return `${same ? 'bugün' : isTom ? 'yarın' : `${p.d} ${K.MONTHS[p.mo - 1]}`} ${K.pad(p.h)}:${K.pad(p.mi)}`;
  };
  function presets() {
    const o = other();
    const t = T.parts(tzOf(o));
    const out = [];
    const morning = atIn(o, t.y, t.mo, t.d + (t.h >= 8 ? 1 : 0), 8, 0);
    out.push(['sabah', `${t.h >= 8 ? 'Yarın' : 'Bu'} sabah 08:00`, morning]);
    const night = atIn(o, t.y, t.mo, t.d + (t.h >= 23 ? 1 : 0), 23, 0);
    out.push(['gece', `${t.h >= 23 ? 'Yarın' : 'Bu'} gece 23:00`, night]);
    out.push(['saat', '1 saat sonra', Date.now() + 36e5]);
    out.push(['dk', '10 dakika sonra', Date.now() + 6e5]);
    return out;
  }

  function compose() {
    const o = other();
    const ps = presets();
    let when = ps[0][2], emoji = (SP().emojis || ['💌'])[0];
    const sent = mineSent().filter((r) => !opened(r.id));
    const m = K.ui.modal({
      label: 'Zamanlı sürpriz',
      cls: 'sp-sheet',
      html: `<p class="card-eyebrow">Zamanlı sürpriz · ${K.esc(K.ek(nameOf(o), 'e'))}</p><h2>Ne zaman açılsın?</h2><p class="muted small">${K.esc(SP().intro || '')}</p>
        <div class="sp-when">${ps.map(([id, label, at], i) => `<button type="button" class="${i ? '' : 'on'}" data-sp-at="${at}"><b>${K.esc(label)}</b><small>${K.esc(cityOf(o))} saatiyle</small></button>`).join('')}
          <label class="sp-custom"><small>Başka bir an (${K.esc(cityOf(o))} saatiyle)</small><input type="datetime-local" class="input" data-sp-custom></label></div>
        <div class="sp-emo">${(SP().emojis || []).map((e, i) => `<button type="button" class="${i ? '' : 'on'}" data-sp-e="${e}">${e}</button>`).join('')}</div>
        <textarea class="textarea" rows="3" maxlength="300" placeholder="Notun... (ör. ${K.esc((SP().ideas || [''])[0])})"></textarea>
        <div class="sp-ideas">${(SP().ideas || []).slice(0, 4).map((x) => `<button type="button" class="chip" data-sp-idea>${K.esc(x)}</button>`).join('')}</div>
        <button type="button" class="btn red" data-sp-send>${A.icon('hourglass')} Mühürle</button>
        ${sent.length ? `<p class="card-eyebrow" style="margin-top:14px">Bekleyen sürprizlerin</p><ul class="sp-sent">${sent.map((r) => `<li><span>${r.data.emoji}</span><div><b>${K.esc(r.data.text.slice(0, 60))}${r.data.text.length > 60 ? '…' : ''}</b><small>${r.data.at > Date.now() ? `${K.esc(whenText(o, r.data.at))} açılacak` : 'zamanı geldi, henüz açmadı'}</small></div><button type="button" class="linkish" data-sp-del="${r.id}">İptal</button></li>`).join('')}</ul>` : ''}`,
    });
    const b = m.body;
    const ta = K.$('textarea', b);
    b.addEventListener('click', async (e) => {
      const w = e.target.closest('[data-sp-at]');
      if (w) {
        when = +w.dataset.spAt;
        K.$$('[data-sp-at]', b).forEach((x) => x.classList.toggle('on', x === w));
        K.$('[data-sp-custom]', b).value = '';
        return;
      }
      const em = e.target.closest('[data-sp-e]');
      if (em) {
        emoji = em.dataset.spE;
        K.$$('[data-sp-e]', b).forEach((x) => x.classList.toggle('on', x === em));
        return;
      }
      if (e.target.closest('[data-sp-idea]')) {
        ta.value = e.target.closest('[data-sp-idea]').textContent;
        return ta.focus();
      }
      const del = e.target.closest('[data-sp-del]');
      if (del) {
        await K.cloud.remove(del.dataset.spDel);
        rows = rows.filter((r) => r.id !== del.dataset.spDel);
        del.closest('li').remove();
        return;
      }
      if (e.target.closest('[data-sp-send]')) {
        const text = ta.value.trim();
        if (!text) return ta.focus();
        if (when < Date.now() - 6e4) return K.fx.toast('Bu an geçmişte kaldı; ileri bir zaman seç.');
        const r = await K.cloud.add('zamanli', { to: o, at: when, text, emoji });
        if (!r) return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
        rows.push(r);
        // Açılış anında onun telefonuna da düşsün (ntfy en fazla üç gün ileriye zamanlayabilir)
        const lt = K.later(when);
        if (lt || when - Date.now() <= 9e4) K.ping(`${emoji} ${K.ek(K.meName(), 'den')} zamanlı bir sürpriz`, 'Mühür açıldı; zarf seni bekliyor.', ['gift'], lt || {});
        else K.ping(`${emoji} ${K.meName()} sana mühürlü bir not bıraktı`, `Açılış: ${whenText(o, when)}`, ['gift']);
        m.close();
        K.audio.sfx.chime();
        K.stickers.award('surpriz');
        K.fx.toast(`${emoji} <b>Mühürlendi.</b> Açılış: ${K.esc(whenText(o, when))} (${K.esc(cityOf(o))} saatiyle).`, { icon: A.icon('hourglass'), duration: 4000 });
      }
    });
    K.$('[data-sp-custom]', b).addEventListener('change', (e) => {
      const v = e.target.value;
      if (!v) return;
      const [d, t] = v.split('T');
      const [y, mo, dd] = d.split('-').map(Number);
      const [h, mi] = t.split(':').map(Number);
      when = atIn(o, y, mo, dd, h, mi);
      K.$$('[data-sp-at]', b).forEach((x) => x.classList.remove('on'));
    });
  }

  function reveal(r) {
    const m = K.ui.modal({
      label: 'Sürpriz',
      cls: 'sp-reveal',
      html: `<div class="sp-env" aria-hidden="true"><span class="sp-flap"></span><span class="sp-seal">${r.data.emoji}</span></div>
        <div class="sp-letter"><p class="card-eyebrow">${K.esc(nameOf(r.who))} · ${K.esc(T.fmtShort(new Date(r.at)))}'de yazdı</p><p class="hand">${K.esc(r.data.text)}</p></div>`,
    });
    requestAnimationFrame(() => setTimeout(() => m.el.classList.add('open'), 300));
    K.audio.sfx.paper ? K.audio.sfx.paper() : K.audio.sfx.chime();
    setTimeout(() => K.fx.burst(window.innerWidth / 2, window.innerHeight / 3, { count: 18, power: 6 }), 700);
    K.cloud.add('zamanliac', { ref: r.id }).then((a) => {
      if (a) opens.push(a);
      bar();
      K.renderSpecials && K.renderSpecials();
    });
    K.ping(`${K.meName()} zamanlı notunu açtı`, r.data.text.slice(0, 120), ['love_letter']);
  }

  // Ana salondaki çip: bekleyen sürpriz (içeriği gizli) ya da açılmaya hazır olan
  function bar() {
    const box = K.$('#kalpBar');
    if (!box) return;
    let chip = K.$('.kb-chip.sp', box);
    const d = due(), w = waiting();
    const html = d.length ? `🎁 <b>${d.length > 1 ? `${d.length} sürpriz` : 'Bir sürpriz'}</b> açılmayı bekliyor` : w.length ? `🎁 ${K.esc(nameOf(w[0].who))} sana mühürlü bir not bıraktı · açılış <b>${K.esc(whenText(mine(), w[0].data.at))}</b>` : '';
    if (!html) return chip && chip.remove();
    if (!chip) {
      chip = K.el(`<button type="button" class="kb-chip sp" data-sp-open></button>`);
      box.prepend(chip);
    }
    chip.classList.toggle('due', Boolean(d.length));
    chip.innerHTML = html;
    box.hidden = false;
  }
  let dueN = 0;
  function tick() {
    const d = due();
    if (d.length !== dueN) {
      dueN = d.length;
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    }
    d.forEach((r) => {
      const k = 'spNoted-' + r.id;
      if (K.store.get(k)) return;
      K.store.set(k, 1);
      K.audio.sfx.chime();
      K.fx.toast(`${r.data.emoji} <b>${K.esc(K.ek(nameOf(r.who), 'den'))} zamanlı bir not açıldı.</b> <button type="button" class="linkish" data-sp-open>Oku</button>`, { icon: A.icon('letter'), duration: 10000 });
    });
    bar();
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-sp-open]')) return;
    const d = due();
    if (d.length) reveal(d[0]);
    else if (waiting().length) K.fx.toast('Mühür henüz açılmadı. Biraz sabır ♥', { duration: 2500 });
  });
  K.on('cloud', async (on) => {
    if (!on) return;
    [rows, opens] = await Promise.all([K.cloud.list('zamanli', 200), K.cloud.list('zamanliac', 200)]);
    K.cloud.on('zamanli', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      tick();
    });
    K.cloud.on('zamanliac', (r) => {
      if (opens.some((x) => x.id === r.id)) return;
      opens.push(r);
      const s = rows.find((x) => x.id === r.data.ref);
      if (s && s.who === mine() && r.who !== mine()) K.fx.toast(`${s.data.emoji} <b>${K.esc(nameOf(r.who))} zamanlı notunu açtı.</b>`, { icon: A.icon('letter'), duration: 6000 });
    });
    K.cloud.on('deleted', ({ id }) => {
      rows = rows.filter((r) => r.id !== id);
      bar();
    });
    tick();
    setInterval(tick, 20000);
  });
  K.on('built', () => setTimeout(bar, 500));
  K.on('kalpbar', bar);
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const d = due();
    return d.length ? [{ icon: 'letter', title: `${d[0].data.emoji} ${K.ek(nameOf(d[0].who), 'den')} zamanlı bir not`, text: 'Mühürlü kalmıştı; zamanı geldi.', run: () => reveal(d[0]), cta: 'Aç' }] : [];
  });
  K.surpriz = { compose, due, waiting };
})();
