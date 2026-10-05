/* Oda: Söz Defteri — küçük sözler unutulmasın. Söz verirken istersen bir gün seçilir; o sabah söz verene bildirim
   düşer (K.planla). Söz verilen "hatırlat" diyebilir; söz veren "tuttum" der, öbürü bir kalple teşekkür eder.
   Kayıtlar: soz {text, due} · soztut {ref} · soztesekkur {ref} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const SZ = () => D.soz || { intro: [], ideas: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const tzOf = (w) => (w === 'me' ? C.tzIstanbul : C.tzBaku);
  const KINDS = ['soz', 'soztut', 'soztesekkur'];

  let rows = [], loaded = false, root = null, tab = 'acik';
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const promises = () => rows.filter((r) => r.kind === 'soz').sort((a, b) => b.at - a.at);
  const kept = (id) => rows.find((r) => r.kind === 'soztut' && r.data.ref === id) || null;
  const thanked = (id) => rows.some((r) => r.kind === 'soztesekkur' && r.data.ref === id);
  // Söz verenin şehrinde bugün
  const todayOf = (w) => {
    const p = T.parts(tzOf(w));
    return `${p.y}-${K.pad(p.mo)}-${K.pad(p.d)}`;
  };
  const dueState = (r) => {
    if (kept(r.id)) return 'kept';
    if (!r.data.due) return 'open';
    const t = todayOf(r.who);
    return r.data.due < t ? 'late' : r.data.due === t ? 'today' : 'open';
  };
  const dueText = (r) => {
    if (!r.data.due) return 'Tarihsiz';
    const n = T.dayNumber(T.at(r.data.due)) - T.dayNumber(T.at(todayOf(r.who)));
    return n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : n > 1 ? `${n} gün sonra · ${T.fmtShort(r.data.due)}` : `${-n} gün geçti · ${T.fmtShort(r.data.due)}`;
  };

  function schedule() {
    if (!loaded || !K.planla) return;
    const items = promises()
      .filter((r) => r.data.due && !kept(r.id))
      .map((r) => {
        const [y, m, d] = r.data.due.split('-').map(Number);
        return { key: `soz-${r.id}`, to: r.who, at: Date.UTC(y, m - 1, d, 9, 30) - tzOf(r.who) * 36e5, title: `🤞 Bugün bir sözün var`, msg: `"${r.data.text}" · ${nameOf(r.who === 'me' ? 'her' : 'me')} bekliyor`, tags: ['crossed_fingers'], click: K.roomUrl('soz') };
      });
    if (items.length) K.planla(items);
  }

  function card(r) {
    const st = dueState(r);
    const k = kept(r.id);
    const mineP = r.who === mine();
    const acts = [];
    if (!k && mineP) acts.push(`<button type="button" class="btn red small" data-sz="tut" data-id="${r.id}">✓ Tuttum</button>`, `<button type="button" class="icon-btn" data-sz="sil" data-id="${r.id}" aria-label="Sözü sil">${A.ui('trash')}</button>`);
    if (!k && !mineP) acts.push(`<button type="button" class="btn soft small" data-sz="hatirlat" data-id="${r.id}">🔔 Nazikçe hatırlat</button>`);
    if (k && !mineP && !thanked(r.id)) acts.push(`<button type="button" class="btn red small" data-sz="tesekkur" data-id="${r.id}">💗 Teşekkür et</button>`);
    return `<li class="sz-card ${st}"><span class="sz-seal" aria-hidden="true">${st === 'kept' ? '✓' : '🤞'}</span>
      <div class="sz-b"><p class="sz-t hand">${K.esc(r.data.text)}</p><small>${K.esc(nameOf(r.who))} söz verdi · ${K.esc(T.fmtShort(new Date(r.at)))}${st === 'kept' ? ` · ${K.esc(K.ago(k.at))} tutuldu${thanked(r.id) ? ' · 💗' : ''}` : ` · <b class="sz-due">${K.esc(dueText(r))}</b>`}</small></div>
      ${acts.length ? `<div class="sz-acts">${acts.join('')}</div>` : ''}</li>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'soz') return;
    const all = promises();
    const open = all.filter((r) => !kept(r.id)), done = all.filter((r) => kept(r.id));
    const list = tab === 'acik' ? open.sort((a, b) => (a.data.due || '9').localeCompare(b.data.due || '9')) : done;
    K.$('#szStats', root).innerHTML = `<span><b class="tnum">${done.length}</b><small>tutulan söz</small></span><span><b class="tnum">${open.length}</b><small>bekleyen</small></span><span><b class="tnum">${rows.filter((r) => r.kind === 'soztesekkur').length}</b><small>teşekkür kalbi</small></span>`;
    K.$('#szTabs', root).innerHTML = [['acik', `Bekleyen (${open.length})`], ['tutuldu', `Tutulan (${done.length})`]].map(([id, l]) => `<button type="button" class="chip ${tab === id ? 'on' : ''}" data-sz-tab="${id}">${l}</button>`).join('');
    K.$('#szList', root).innerHTML = list.length ? list.map(card).join('') : `<li class="muted center">${tab === 'acik' ? 'Bekleyen söz yok. İlk sözü sen ver.' : 'Henüz tutulan söz yok.'}</li>`;
  }
  async function give(btn) {
    const ta = K.$('#szText', root);
    const text = ta.value.trim();
    if (text.length < 3) return ta.focus();
    const due = K.$('#szDue', root).value || '';
    btn.disabled = true;
    const r = await K.cloud.add('soz', { text: text.slice(0, 160), due });
    btn.disabled = false;
    if (!r) return K.fx.toast('Kaydedilemedi.');
    push(r);
    ta.value = '';
    K.$('#szDue', root).value = '';
    tab = 'acik';
    K.audio.sfx.paper();
    K.fx.toast('🤞 Söz deftere yazıldı.');
    K.ping(`🤞 ${K.meName()} sana bir söz verdi`, `"${r.data.text}"${due ? ` · ${T.fmtShort(due)}` : ''}`, ['crossed_fingers'], { click: K.roomUrl('soz') });
    schedule();
    render();
  }
  async function act(a, id, btn) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    if (a === 'sil') {
      if (btn.dataset.sure !== '1') {
        btn.dataset.sure = '1';
        return K.fx.toast('Silmek için bir kez daha dokun.');
      }
      await K.cloud.remove(id);
      rows = rows.filter((x) => x.id !== id);
      return render();
    }
    btn.disabled = true;
    if (a === 'tut') {
      const k = await K.cloud.add('soztut', { ref: id });
      if (!k) return (btn.disabled = false), K.fx.toast('Kaydedilemedi.');
      push(k);
      K.fx.confetti({ count: 70 });
      K.audio.sfx.success();
      K.stickers.award('soz');
      K.ping(`✓ ${K.meName()} sözünü tuttu`, `"${r.data.text}" · teşekkür etmeyi unutma`, ['white_check_mark'], { click: K.roomUrl('soz') });
    } else if (a === 'tesekkur') {
      const t = await K.cloud.add('soztesekkur', { ref: id });
      if (!t) return (btn.disabled = false), K.fx.toast('Gönderilemedi.');
      push(t);
      const bb = btn.getBoundingClientRect();
      K.fx.burst(bb.left + bb.width / 2, bb.top + bb.height / 2, { count: 14 });
      K.audio.sfx.chime();
      K.ping(`💗 ${K.meName()} tuttuğun söz için teşekkür etti`, `"${r.data.text}"`, ['heart'], { click: K.roomUrl('soz'), priority: 3 });
    } else if (a === 'hatirlat') {
      const key = 'sozHat-' + id;
      if (K.store.get(key) === T.todayKey()) return K.fx.toast('Bugün zaten hatırlattın.');
      K.store.set(key, T.todayKey());
      K.ping(`🔔 ${K.meName()} nazikçe hatırlatıyor`, `Sözün: "${r.data.text}"`, ['bell'], { click: K.roomUrl('soz'), priority: 3 });
      K.fx.toast('🔔 Nazikçe hatırlattın.');
    }
    render();
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(KINDS, { limit: 1500 });
    loaded = true;
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (!push(r)) return;
        render();
        K.renderSpecials && !K.activeRoom && K.renderSpecials();
      })
    );
    K.cloud.on('deleted', ({ id }) => {
      rows = rows.filter((r) => r.id !== id);
      render();
    });
    setTimeout(schedule, 5000);
    render();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !D.soz) return [];
    const out = [];
    const due = promises().filter((r) => r.who === mine() && ['today', 'late'].includes(dueState(r)));
    if (due.length) out.push({ icon: 'key', title: due.length > 1 ? `🤞 ${due.length} sözün bekliyor` : `🤞 ${dueState(due[0]) === 'today' ? 'Bugün' : 'Tarihi geçmiş'} bir sözün var`, text: `"${due[0].data.text}"`, room: 'soz', cta: 'Söz Defteri' });
    const th = promises().filter((r) => r.who === other() && kept(r.id) && !thanked(r.id) && Date.now() - kept(r.id).at < 7 * 864e5);
    if (th.length) out.push({ icon: 'heart', title: `✓ ${nameOf(other())} sözünü tuttu`, text: `"${th[0].data.text}" · bir teşekkür kalbi gönder`, room: 'soz', cta: 'Teşekkür et' });
    return out;
  });
  K.soz = { kept: () => rows.filter((r) => r.kind === 'soztut').length, open: () => promises().filter((r) => !kept(r.id)).length };

  K.room({
    id: 'soz',
    wing: 'kalp',
    title: 'Söz Defteri',
    sub: 'Küçük sözler unutulmasın',
    icon: 'key',
    color: '#FFE8EC',
    hidden: () => !D.soz || !K.cloud || !K.cloud.enabled,
    badge: () => (loaded ? (promises().filter((r) => r.who === mine() && ['today', 'late'].includes(dueState(r))).length ? 'Bugün' : '') : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(SZ().intro || [])}</div>
        <section class="card sz-new"><p class="card-eyebrow">Söz veriyorum ki...</p>
          <textarea class="input sz-in" id="szText" rows="2" maxlength="160" placeholder="Pazar akşamı seni arayacağım"></textarea>
          <div class="sz-ideas">${(SZ().ideas || []).map((x) => `<button type="button" class="chip" data-sz-idea>${K.esc(x)}</button>`).join('')}</div>
          <div class="row"><label class="sz-date">📅 <input type="date" class="input" id="szDue"></label><button type="button" class="btn red" data-sz="ver">🤞 Söz ver</button></div></section>
        <div class="sz-stats" id="szStats"></div>
        <div class="sz-tabs" id="szTabs"></div>
        <ul class="sz-list" id="szList"></ul>`;
      el.addEventListener('click', (e) => {
        const i = e.target.closest('[data-sz-idea]');
        if (i) return (K.$('#szText', root).value = i.textContent), K.$('#szText', root).focus();
        const t = e.target.closest('[data-sz-tab]');
        if (t) return (tab = t.dataset.szTab), render();
        const b = e.target.closest('[data-sz]');
        if (!b) return;
        if (b.dataset.sz === 'ver') return give(b);
        act(b.dataset.sz, b.dataset.id, b);
      });
    },
    enter() {
      const d = K.$('#szDue', root);
      if (d) d.min = todayOf(mine());
      render();
    },
  });
})();
