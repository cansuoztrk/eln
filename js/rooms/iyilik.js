/* Oda: Bugün Senin İçin — her gün ikimize birer küçük iyilik önerisi (ikimizinki farklı). Yapınca o günün takvim
   karesine bir yıldız düşer, istersen ne yaptığını bir cümleyle yazarsın; öbürü "bugün senin için bunu yaptı" diye görür.
   Günde bir kez "başka öner" hakkı var. Kayıtlar: iyilik {day, i, note} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const IY = () => D.iyilik || { intro: '', list: [] };
  // Liste: kasadaki iyilikler + Sevgi Dilimiz'in dile göre iyilikleri (sıra sabit: kayıtlar sıra numarası tutar)
  const LIST = () => (IY().list || []).concat(K.sevgidili ? K.sevgidili.extra().map((x) => x.t) : []);
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);

  let rows = [], loaded = false, root = null, month = null;
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const doneOn = (w, day) => rows.find((r) => r.kind === 'iyilik' && r.who === w && r.data.day === day) || null;
  // Günün önerisi: ikimize farklı; "başka öner" tuzu yerel
  function pickFor(w, day) {
    const L = LIST();
    if (!L.length) return -1;
    // Haftanın yarısı: iyiliği yapılacak kişinin sevgi diline göre (ikisi de Sevgi Dilimiz'i çözdüyse)
    const to = w === 'me' ? 'her' : 'me', lang = K.sevgidili && K.sevgidili.topOf(to);
    if (lang && K.hash(day + 'dil' + w) % 2 === 0) {
      const base = (IY().list || []).length;
      const idx = K.sevgidili.extra().map((x, i) => (x.lang === lang ? base + i : -1)).filter((i) => i >= 0);
      if (idx.length) return idx[(K.hash(day + w) + (w === mine() ? K.store.get('iyilikSalt-' + day, 0) : 0)) % idx.length];
    }
    const salt = w === mine() ? K.store.get('iyilikSalt-' + day, 0) : 0;
    const a = (K.hash(day + 'me') + salt * 7) % L.length;
    if (w === 'me') return a;
    const b = (K.hash(day + 'her') + salt * 11) % L.length;
    return b === (K.hash(day + 'me') % L.length) ? (b + 1) % L.length : b;
  }
  function streak(w) {
    let n = 0;
    const d = new Date(T.at(T.todayKey()).getTime() + 12 * 36e5);
    if (!doneOn(w, T.todayKey())) d.setTime(d.getTime() - 864e5);
    for (;;) {
      const k = T.key(T.baku(d));
      if (!doneOn(w, k)) break;
      n++;
      d.setTime(d.getTime() - 864e5);
    }
    return n;
  }

  function calendar() {
    const m = month || T.todayKey().slice(0, 7);
    const [y, mo] = m.split('-').map(Number);
    const first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
    const len = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    const cells = [];
    for (let i = 0; i < (first + 6) % 7; i++) cells.push('<span class="iy-c pad"></span>');
    const today = T.todayKey();
    for (let d = 1; d <= len; d++) {
      const k = `${m}-${K.pad(d)}`;
      const h = doneOn('her', k), me = doneOn('me', k);
      cells.push(`<button type="button" class="iy-c ${k === today ? 'today' : ''} ${k > today ? 'future' : ''} ${h && me ? 'both' : ''}" data-iy-day="${k}" ${k > today ? 'disabled' : ''} aria-label="${d} ${K.MONTHS[mo - 1]}"><b>${d}</b><i class="her ${h ? 'on' : ''}">★</i><i class="me ${me ? 'on' : ''}">★</i></button>`);
    }
    const prev = new Date(Date.UTC(y, mo - 2, 1)), next = new Date(Date.UTC(y, mo, 1));
    const pk = `${prev.getUTCFullYear()}-${K.pad(prev.getUTCMonth() + 1)}`, nk = `${next.getUTCFullYear()}-${K.pad(next.getUTCMonth() + 1)}`;
    const cnt = (w) => rows.filter((r) => r.kind === 'iyilik' && r.who === w && r.data.day.startsWith(m)).length;
    return `<div class="iy-mnav"><button type="button" class="icon-btn" data-iy-m="${pk}" aria-label="Önceki ay">‹</button><b>${K.MONTHS[mo - 1]} ${y}</b><button type="button" class="icon-btn" data-iy-m="${nk}" aria-label="Sonraki ay" ${nk > today.slice(0, 7) ? 'disabled' : ''}>›</button></div>
      <div class="iy-wd">${['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((x) => `<span>${x}</span>`).join('')}</div>
      <div class="iy-grid">${cells.join('')}</div>
      <p class="iy-leg"><span><i class="her on">★</i> ${K.esc(nameOf('her'))}: ${cnt('her')}</span><span><i class="me on">★</i> ${K.esc(nameOf('me'))}: ${cnt('me')}</span></p>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'iyilik') return;
    const day = T.todayKey();
    const L = LIST();
    const i = pickFor(mine(), day);
    const d = doneOn(mine(), day);
    const od = doneOn(other(), day);
    const salt = K.store.get('iyilikSalt-' + day, 0);
    K.$('#iyToday', root).innerHTML = `<p class="card-eyebrow">Bugün ${K.esc(K.ek(nameOf(other()), 'i'))} mutlu etmek için</p>
      <p class="iy-task hand">${K.esc(K.fill(L[d ? d.data.i : i] || ''))}</p>
      ${d ? `<p class="iy-done">⭐ Yaptın${d.data.note ? `: <i>${K.esc(d.data.note)}</i>` : ''}</p>` : `<input class="input" id="iyNote" maxlength="120" placeholder="Ne yaptın? (istersen)">
      <div class="row"><button type="button" class="btn red" data-iy="yap">⭐ Yaptım</button>${salt < 1 ? `<button type="button" class="btn ghost small" data-iy="baska">🔀 Başka öner</button>` : ''}</div>`}
      <p class="muted small">Seri: <b>${streak(mine())}</b> gün${streak(other()) ? ` · ${K.esc(nameOf(other()))}: ${streak(other())} gün` : ''}</p>`;
    K.$('#iyOther', root).innerHTML = od
      ? `<p class="card-eyebrow">💌 ${K.esc(nameOf(other()))} bugün senin için</p><p class="hand">${K.esc(K.fill(L[od.data.i] || ''))}</p>${od.data.note ? `<p class="iy-note">"${K.esc(od.data.note)}"</p>` : ''}<small class="muted">${K.esc(K.ago(od.at))}</small>`
      : `<p class="muted">${K.esc(nameOf(other()))} bugünkü iyiliğini henüz işaretlemedi. Ona ne önerildiği sürpriz.</p>`;
    K.$('#iyCal', root).innerHTML = calendar();
  }
  async function done(btn) {
    const day = T.todayKey();
    if (doneOn(mine(), day)) return;
    btn.disabled = true;
    const note = (K.$('#iyNote', root).value || '').trim().slice(0, 120);
    const r = await K.cloud.add('iyilik', { day, i: pickFor(mine(), day), note });
    if (!r) return (btn.disabled = false), K.fx.toast('Kaydedilemedi.');
    push(r);
    K.fx.rain({ count: 26, shapes: ['star'], colors: ['#FFD34E', '#FFC21A', '#FFE38A', '#FF8FB8'] });
    K.audio.sfx.sparkle();
    K.stickers.award('iyilik');
    if (streak(mine()) >= 7) K.stickers.award('iyilik7');
    K.ping(`⭐ ${K.meName()} bugün senin için küçük bir iyilik yaptı`, note || K.fill(LIST()[r.data.i] || ''), ['star'], { click: K.roomUrl('iyilik'), priority: 3 });
    render();
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }
  function showDay(k) {
    const L = LIST();
    const items = ['her', 'me'].map((w) => {
      const d = doneOn(w, k);
      return `<li>${K.avatar(w, 'rp-av')}<div><b>${K.esc(nameOf(w))}</b>${d ? `<p class="hand">${K.esc(K.fill(L[d.data.i] || ''))}</p>${d.data.note ? `<p class="iy-note">"${K.esc(d.data.note)}"</p>` : ''}` : '<p class="muted">Bu gün yıldız yok.</p>'}</div></li>`;
    });
    K.ui.modal({ label: 'Gün', cls: 'iy-day', html: `<p class="card-eyebrow">${K.esc(T.fmt(k, true))}</p><ul class="iy-dl">${items.join('')}</ul>` });
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('iyilik', 2000);
    loaded = true;
    K.cloud.on('iyilik', (r) => {
      if (!push(r)) return;
      render();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    });
    render();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !D.iyilik) return [];
    const day = T.todayKey();
    const out = [];
    const od = doneOn(other(), day);
    if (od && K.store.get('iyilikSeen') !== od.id) out.push({ icon: 'star', title: `⭐ ${nameOf(other())} bugün senin için bir iyilik yaptı`, text: od.data.note ? `"${od.data.note}"` : K.fill(LIST()[od.data.i] || ''), run: () => (K.store.set('iyilikSeen', od.id), K.go('iyilik')), cta: 'Gör' });
    const h = T.parts(K.isOwner() ? C.tzIstanbul : C.tzBaku).h;
    if (!doneOn(mine(), day) && h >= 9) out.push({ icon: 'star', title: `💡 Bugün ${K.ek(nameOf(other()), 'i')} mutlu etmek için`, text: K.fill(LIST()[pickFor(mine(), day)] || ''), room: 'iyilik', cta: 'Yaptım' });
    return out;
  });
  K.iyilik = { streak, count: (w) => rows.filter((r) => r.kind === 'iyilik' && (!w || r.who === w)).length };

  K.room({
    id: 'iyilik',
    wing: 'kalp',
    title: 'Bugün Senin İçin',
    sub: 'Her gün küçük bir iyilik',
    icon: 'star',
    color: '#FFF4CC',
    hidden: () => !D.iyilik || !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && !doneOn(mine(), T.todayKey()) ? '1' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras([IY().intro || ''])}</div>
        <section class="card iy-today" id="iyToday"></section>
        <section class="card iy-other" id="iyOther"></section>
        <section class="card iy-cal" id="iyCal"></section>`;
      el.addEventListener('click', (e) => {
        const m = e.target.closest('[data-iy-m]');
        if (m) return (month = m.dataset.iyM), render();
        const dd = e.target.closest('[data-iy-day]');
        if (dd) return showDay(dd.dataset.iyDay);
        const b = e.target.closest('[data-iy]');
        if (!b) return;
        if (b.dataset.iy === 'yap') return done(b);
        if (b.dataset.iy === 'baska') {
          K.store.set('iyilikSalt-' + T.todayKey(), 1);
          K.audio.sfx.whoosh();
          render();
        }
      });
    },
    enter() {
      month = null;
      const od = doneOn(other(), T.todayKey());
      if (od) K.store.set('iyilikSeen', od.id);
      render();
    },
  });
})();
