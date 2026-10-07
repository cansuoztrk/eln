/* Oda: Minnet Defteri — her gün tek cümle: "Bugün sana minnettarım çünkü...". Onunki, sen kendi cümleni yazınca açılır.
   Haftanın sonunda (pazar 18:00, Bakü saatiyle) onun bütün haftalık cümleleri tek bir mektup olur; geçmiş haftaların
   mektupları burada kalır. Kayıt: minnet {day, text} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;
  const yz = (t, w) => (K.yazitipi ? K.yazitipi.html(t, w) : K.esc(t));

  const MN = () => D.minnet || { intro: [], ideas: [], placeholder: 'Bugün sana minnettarım çünkü...' };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], loaded = false, root = null;
  const day = () => T.todayKey();
  const of = (k, w) => rows.filter((r) => r.data.day === k && r.who === w).sort((a, b) => a.at - b.at).pop();
  // Haftanın pazartesisi (Bakü günü)
  function weekOf(k) {
    const d = new Date(k + 'T12:00:00Z');
    const wd = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - wd);
    return d.toISOString().slice(0, 10);
  }
  const addDays = (k, n) => {
    const d = new Date(k + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  // Mektup pazar 18:00 Bakü'de açılır
  const letterOpen = (wk) => T.at(addDays(wk, 6)).getTime() + 18 * 36e5 <= T.now().getTime();
  const weekRows = (wk, w) => rows.filter((r) => r.who === w && weekOf(r.data.day) === wk).sort((a, b) => (a.data.day < b.data.day ? -1 : 1));

  function render() {
    if (!root || K.activeRoom !== 'minnet') return;
    const k = day(), me = mine(), o = other();
    const m = of(k, me), t = of(k, o);
    K.$('#mnToday', root).innerHTML = `<p class="card-eyebrow">${K.esc(T.fmt(k, true))}</p>
      ${m ? `<div class="mn-pair"><div class="mn-line me"><small>Sen</small><p class="hand">${yz('Bugün sana minnettarım çünkü ' + m.data.text, m.who)}</p></div>
        <div class="mn-line ${t ? '' : 'wait'}"><small>${K.esc(nameOf(o))}</small>${t ? `<p class="hand">${yz('Bugün sana minnettarım çünkü ' + t.data.text, t.who)}</p>` : `<p>${K.esc(nameOf(o))} henüz yazmadı. Yazınca burada açılır.</p>`}</div></div>`
        : `<form class="mn-form" autocomplete="off"><label class="mn-lead" for="mnText">Bugün sana minnettarım çünkü...</label><textarea class="textarea" id="mnText" rows="2" maxlength="200" placeholder="${K.esc(MN().placeholder || '')}"></textarea>
          <div class="br-chips">${(MN().ideas || []).map((x) => `<button type="button" class="chip" data-mn-idea>${K.esc(x)}</button>`).join('')}</div>
          <button class="btn red" type="submit">${A.ui('heart')} Yaz ve mühürle</button>${t ? `<p class="mn-note">🔒 ${K.esc(nameOf(o))} bugünkünü yazdı; seninki gelince açılır.</p>` : ''}</form>`}`;
    // Bu hafta ve önceki mektuplar
    const wk = weekOf(k);
    const weeks = [...new Set(rows.map((r) => weekOf(r.data.day)))].sort().reverse();
    const cur = weekRows(wk, o);
    K.$('#mnWeek', root).innerHTML = `<p class="card-eyebrow">${K.esc(MN().letterTitle || 'Bu haftanın minnet mektubu')}</p>
      ${letterOpen(wk) ? letter(wk) : `<div class="mn-seal"><span aria-hidden="true">💌</span><p><b>${cur.length}</b> cümle birikti. Pazar akşamı (Bakü 18:00) tek bir mektup olarak açılacak.</p></div>`}`;
    const past = weeks.filter((w) => w !== wk && letterOpen(w) && weekRows(w, o).length);
    K.$('#mnPast', root).innerHTML = past.length ? `<p class="card-eyebrow">Önceki mektuplar</p><div class="mn-past">${past.map((w) => `<button type="button" class="mn-env" data-mn-week="${w}"><span>💌</span><b>${K.esc(T.fmtShort(w))} haftası</b><small>${weekRows(w, o).length} cümle</small></button>`).join('')}</div>` : '';
    K.$('#mnPast', root).hidden = !past.length;
  }
  function letter(wk) {
    const o = other();
    const list = weekRows(wk, o).filter((r) => of(r.data.day, mine()));
    const hidden = weekRows(wk, o).length - list.length;
    return `<div class="br-paper open mn-letter"><p class="card-eyebrow">${K.esc(T.fmtShort(wk))} – ${K.esc(T.fmtShort(addDays(wk, 6)))}</p>
      <p class="hand">${K.esc(K.ek(nameOf(mine()), 'e'))},</p>${list.map((r) => `<p class="hand">${K.esc(T.dayName(T.baku(T.at(r.data.day))))}: sana minnettarım çünkü ${K.esc(r.data.text)}</p>`).join('') || '<p class="hand">Bu hafta mektuba sığmayacak kadar sessizdik. Bir dahaki hafta.</p>'}
      ${hidden ? `<p class="muted small">${hidden} cümle, sen o günler yazmadığın için mühürlü kaldı.</p>` : ''}<p class="br-sign">— ${K.esc(nameOf(o))}</p></div>`;
  }
  async function save(text) {
    text = text.trim().replace(/^bugün sana minnettarım çünkü\s*/i, '');
    if (!text) return;
    if (of(day(), mine())) return render();
    const r = await K.cloud.add('minnet', { day: day(), text });
    if (!r) return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    K.audio.sfx.chime();
    K.stickers.award('minnet');
    const t = of(day(), other());
    K.fx.toast(t ? '🔓 <b>Açıldı.</b> Onun bugünkü cümlesi de burada.' : '🔒 Mühürlendi. O yazınca ikisi yan yana açılır.', { duration: 3500 });
    K.ping(`🙏 ${K.meName()} bugün sana minnettar`, t ? 'Cümlen ve onunki yan yana açıldı.' : 'Sen de yazınca cümlesi açılır.', ['pray'], { click: K.roomUrl('minnet') });
    render();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('minnet', 1500);
    loaded = true;
    K.cloud.on('minnet', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine() && r.data.day === day()) K.fx.toast(`🙏 <b>${K.esc(nameOf(r.who))} bugün sana minnettar.</b> ${of(day(), mine()) ? '<a href="#minnet">Oku</a>' : '<a href="#minnet">Sen de yaz, açılsın</a>'}`, { duration: 7000 });
      render();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    });
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const k = day();
    const wk = weekOf(k);
    if (letterOpen(wk) && weekRows(wk, other()).length && K.store.get('mnLetter-' + mine()) !== wk) return [{ icon: 'note', title: `💌 ${nameOf(other())} bu haftanın minnet mektubunu bıraktı`, text: `${weekRows(wk, other()).length} cümle, tek bir mektupta.`, run: () => (K.store.set('mnLetter-' + mine(), wk), K.go('minnet')), cta: 'Oku' }];
    if (of(k, other()) && !of(k, mine())) return [{ icon: 'note', title: `🙏 ${nameOf(other())} bugün sana minnettar`, text: 'Sen de bir cümle yaz; ikisi yan yana açılsın.', room: 'minnet', cta: 'Yaz' }];
    return [];
  });
  K.minnet = { count: () => rows.length, todayDone: () => Boolean(of(day(), mine())) };

  K.room({
    id: 'minnet',
    wing: 'kalp',
    title: 'Minnet Defteri',
    sub: 'Bugün sana minnettarım çünkü...',
    icon: 'note',
    color: '#FFF4D9',
    hidden: () => !D.minnet || !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && !of(day(), mine()) ? 'Bugün' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(MN().intro || [])}</div>
        <section class="card mn-today" id="mnToday"></section>
        <section class="card mn-week" id="mnWeek"></section>
        <section class="card" id="mnPast" hidden></section>`;
      el.addEventListener('submit', (e) => {
        if (!e.target.closest('.mn-form')) return;
        e.preventDefault();
        save(K.$('#mnText', el).value);
      });
      el.addEventListener('click', (e) => {
        const i = e.target.closest('[data-mn-idea]');
        if (i) {
          K.$('#mnText', el).value = i.textContent;
          return;
        }
        const w = e.target.closest('[data-mn-week]');
        if (w) K.ui.modal({ label: 'Minnet mektubu', cls: 'br-sheet br-read', html: letter(w.dataset.mnWeek) });
      });
    },
    enter() {
      render();
    },
  });
})();
