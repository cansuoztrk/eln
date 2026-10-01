/* Oda: Haftalık Ortak Görev — her pazartesi (Bakü saatiyle) iki kişilik küçük bir görev. Sırayla gelir, yirmi
   hafta boyunca hiçbiri tekrarlanmaz. İkiniz de "yaptım" deyince haftanın rozeti kazanılır; seri, rozet duvarı ve
   her görevin altında ikinizin notu. Kayıt: gorev {week, i, note} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const GV = () => D.gorev || { intro: [], list: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], loaded = false, root = null;

  function weekOf(k) {
    const d = new Date(k + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  const wk = () => weekOf(T.todayKey());
  const prevWeek = (w) => {
    const d = new Date(w + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  };
  // Görev sırası birlikte olduğumuz haftadan sayılır
  const idx = (w) => {
    const n = GV().list.length || 1;
    const i = Math.round((new Date(w + 'T12:00:00Z') - new Date(weekOf(C.togetherDate) + 'T12:00:00Z')) / (7 * 864e5));
    return ((i % n) + n) % n;
  };
  const quest = (w) => GV().list[idx(w)] || ['⭐', 'Görev', ''];
  const of = (w, who) => rows.filter((r) => r.data.week === w && r.who === who).sort((a, b) => a.at - b.at).pop();
  const done = (w) => Boolean(of(w, 'me') && of(w, 'her'));
  const weeks = () => [...new Set(rows.map((r) => r.data.week))].filter(done).sort();
  function streak() {
    let w = done(wk()) ? wk() : prevWeek(wk()), n = 0;
    while (done(w)) n++, (w = prevWeek(w));
    return n;
  }

  function render() {
    if (!root || K.activeRoom !== 'gorev') return;
    const w = wk();
    const [e, t, txt] = quest(w);
    const m = of(w, mine()), o = of(w, other());
    const end = new Date(T.at(w).getTime() + 7 * 864e5);
    const left = Math.max(0, Math.ceil((end - T.now()) / 864e5));
    K.$('#gvNow', root).innerHTML = `<div class="gv-quest ${done(w) ? 'done' : ''}"><span class="gv-emoji" aria-hidden="true">${e}</span>
        <p class="card-eyebrow">${K.esc(T.fmtShort(w))} haftası · ${done(w) ? 'tamamlandı' : `${left} gün kaldı`}</p><h2>${K.esc(t)}</h2><p>${K.esc(txt)}</p></div>
      <div class="gv-pair">${[mine(), other()].map((x) => {
        const r = of(w, x);
        return `<div class="gv-p ${r ? 'on' : ''}"><small>${x === mine() ? 'Sen' : K.esc(nameOf(x))}</small><b>${r ? '✓ Yaptı' : 'Henüz değil'}</b>${r && r.data.note ? `<p class="hand">${K.esc(r.data.note)}</p>` : ''}</div>`;
      }).join('')}</div>
      ${m ? (done(w) ? `<p class="gv-badge">🏅 ${K.esc(GV().badge || 'Bu haftanın rozeti')}: <b>${K.esc(t)}</b></p>` : `<p class="muted">${K.esc(nameOf(other()))} da yapınca rozet kazanılır.</p>`) : `<form class="gv-form" autocomplete="off"><input class="input" id="gvNote" maxlength="160" placeholder="Bir satır not (isteğe bağlı): nasıl geçti?"><button class="btn red" type="submit">${A.ui('check')} Yaptım</button></form>`}`;
    const ws = weeks().reverse();
    K.$('#gvStats', root).innerHTML = `<div class="ss-stat"><b>${ws.length}</b><small>rozet</small></div><div class="ss-stat"><b>${streak()}</b><small>hafta seri</small></div><div class="ss-stat"><b>${GV().list.length}</b><small>görev</small></div>`;
    K.$('#gvWall', root).innerHTML = ws.length
      ? `<p class="card-eyebrow">Rozet duvarı</p><div class="gv-wall">${ws.map((x) => `<button type="button" class="gv-b" data-gv-week="${x}"><span aria-hidden="true">${quest(x)[0]}</span><b>${K.esc(quest(x)[1])}</b><small>${K.esc(T.fmtShort(x))}</small></button>`).join('')}</div>`
      : '<p class="muted">İlk rozet bu hafta kazanılabilir.</p>';
  }
  async function save() {
    const w = wk();
    if (of(w, mine())) return;
    const note = (K.$('#gvNote', root) || {}).value || '';
    const r = await K.cloud.add('gorev', { week: w, i: idx(w), note: note.trim() });
    if (!r) return K.fx.toast('Gönderilemedi.');
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    const both = done(w);
    K.audio.sfx[both ? 'success' : 'chime']();
    if (both) {
      K.stickers.award('gorev');
      K.fx.confetti && K.fx.confetti();
    }
    K.fx.toast(both ? `🏅 <b>Rozet kazanıldı!</b> ${K.esc(quest(w)[1])}` : `✓ İşaretlendi. ${K.esc(nameOf(other()))} da yapınca rozet sizin.`, { duration: 4000 });
    K.ping(both ? `🏅 Haftanın rozeti kazanıldı: ${quest(w)[1]}` : `${quest(w)[0]} ${K.meName()} haftanın görevini yaptı`, both ? 'İkiniz de yaptınız.' : `"${quest(w)[1]}" Sıra sende.`, ['medal'], { click: K.roomUrl('gorev') });
    render();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('gorev', 600);
    loaded = true;
    K.cloud.on('gorev', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine() && r.data.week === wk()) {
        if (done(wk())) K.stickers.award('gorev');
        K.fx.toast(done(wk()) ? `🏅 <b>${K.esc(nameOf(r.who))} da yaptı.</b> Haftanın rozeti sizin!` : `${quest(wk())[0]} <b>${K.esc(nameOf(r.who))} haftanın görevini yaptı.</b> <a href="#gorev">Bak</a>`, { duration: 7000 });
      }
      render();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    });
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !GV().list.length) return [];
    const w = wk();
    if (of(w, mine())) return [];
    const [e, t, txt] = quest(w);
    const wd = T.baku().wd;
    if (of(w, other())) return [{ icon: 'star', title: `${e} ${nameOf(other())} haftanın görevini yaptı`, text: `"${t}" Sen de yapınca rozet sizin.`, room: 'gorev', cta: 'Bak' }];
    if (wd === 1 || wd === 2) return [{ icon: 'star', title: `${e} Haftanın görevi: ${t}`, text: txt, room: 'gorev', cta: 'Göreve bak' }];
    return [];
  });
  K.gorev = { badges: () => weeks().length, title: () => `${quest(wk())[0]} ${quest(wk())[1]}${done(wk()) ? ' ✓' : ''}`, streak };

  K.room({
    id: 'gorev',
    wing: 'oyun',
    title: 'Haftalık Görev',
    sub: 'Her pazartesi iki kişilik küçük bir görev',
    icon: 'star',
    color: '#FFF1C9',
    hidden: () => !D.gorev || !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && !of(wk(), mine()) ? 'Yeni' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(GV().intro || [])}</div>
        <section class="card gv-now" id="gvNow"></section>
        <section class="card"><div class="ss-stats" id="gvStats"></div><div id="gvWall"></div></section>`;
      el.addEventListener('submit', (e) => {
        if (!e.target.closest('.gv-form')) return;
        e.preventDefault();
        save();
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-gv-week]');
        if (!b) return;
        const w = b.dataset.gvWeek;
        const [em, t, txt] = quest(w);
        K.ui.modal({
          label: t,
          cls: 'gv-sheet',
          html: `<span class="gv-emoji big" aria-hidden="true">${em}</span><p class="card-eyebrow">${K.esc(T.fmtShort(w))} haftası · 🏅</p><h2>${K.esc(t)}</h2><p class="muted">${K.esc(txt)}</p>
            ${['her', 'me'].map((x) => { const r = of(w, x); return r ? `<div class="gv-p on"><small>${K.esc(nameOf(x))} · ${K.esc(K.ago(r.at))}</small>${r.data.note ? `<p class="hand">${K.esc(r.data.note)}</p>` : '<p class="muted">Not bırakmadı.</p>'}</div>` : ''; }).join('')}`,
        });
      });
    },
    enter() {
      render();
    },
  });
})();
