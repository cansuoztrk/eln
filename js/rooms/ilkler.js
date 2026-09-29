/* Oda: İlklerimiz — "şu an anı gelmiyor" diyenler için sorularla hatırlama. Otuz "ilk": ilk mesaj, ilk görüntülü arama,
   ilk küslük... İkisi de kendi hatırladığını yazar; karşı tarafınki sen de yazana kadar mühürlü kalır. Açılınca iki hatıra yan yana.
   İkisinin de yazdığı ilkler Bizim Filmimiz'in "Biz" bölümüne sahne olarak girer.
   Kayıt: ilk {key, text, date, forgot} — aynı kişinin aynı ilk için son kaydı geçerlidir (düzeltme = yeni kayıt). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const IL = () => D.ilkler || { intro: [], items: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const item = (key) => IL().items.find((x) => x[0] === key);

  let root, rows = [], filter = 'hepsi', loaded = null;

  const latest = (key, w) => rows.filter((r) => r.data.key === key && r.who === w).sort((a, b) => a.at - b.at).pop();
  const state = (key) => {
    const a = latest(key, mine()), b = latest(key, other());
    return { a, b, both: Boolean(a && b), key };
  };
  const seen = () => K.store.get('ilkSeen', {});
  const markSeen = (key) => {
    const s = seen();
    s[key] = 1;
    K.store.set('ilkSeen', s);
  };
  const opened = () => IL().items.filter((x) => state(x[0]).both);
  const waitingMe = () => IL().items.filter((x) => {
    const s = state(x[0]);
    return s.b && !s.a;
  });

  /* ---------- Kartlar ---------- */
  function memo(r, w) {
    if (!r) return '';
    const d = r.data;
    return `<div class="il-mem ${w === mine() ? 'own' : 'other'}"><small>${K.esc(nameOf(w))} hatırlıyor</small>${d.forgot ? `<p class="muted"><em>Hatırlamıyorum.</em></p>` : `<p class="hand">${K.esc(d.text)}</p>`}${d.date ? `<span class="il-date">${K.esc(T.fmt(d.date))}</span>` : ''}</div>`;
  }
  function card([key, title, prompt, known], idx) {
    const s = state(key);
    const n = K.pad(idx + 1);
    let body, cls = '';
    if (s.both && !seen()[key]) {
      cls = 'ready';
      body = `<p class="il-p">İkiniz de yazdınız. Mühür hazır.</p><button type="button" class="btn red small" data-il-open="${key}">${A.ui('sparkle')} İkisini birden aç</button>`;
    } else if (s.both) {
      cls = 'done';
      const forgotBoth = s.a.data.forgot && s.b.data.forgot;
      body = `<div class="il-pair">${memo(s.a, mine())}${memo(s.b, other())}</div>${forgotBoth ? `<p class="il-forgot">${K.esc(IL().forgot || '')}</p>` : ''}<button type="button" class="linkish small" data-il-edit="${key}">Benimkini düzelt</button>`;
    } else if (s.b) {
      cls = 'sealed';
      body = `<p class="il-p">${K.esc(nameOf(other()))} hatırladığını yazdı; mühürlü. Sen de yaz, ikisi yan yana açılsın.</p><div class="il-seal" aria-hidden="true">${A.icon('letter')}</div><button type="button" class="btn red small" data-il-edit="${key}">Ben de yazayım</button>`;
    } else if (s.a) {
      cls = 'mine';
      body = `${memo(s.a, mine())}<p class="il-p muted">${K.esc(nameOf(other()))} henüz yazmadı; yazınca ikisi yan yana açılır.</p><button type="button" class="linkish small" data-il-edit="${key}">Düzelt</button>`;
    } else {
      body = `<p class="il-q">${K.esc(K.fill(prompt))}</p><button type="button" class="btn soft small" data-il-edit="${key}">Hatırlıyor musun?</button>`;
    }
    return `<article class="il-card ${cls}" id="il-${key}"><header><span class="il-n">${n}</span><h3>${K.esc(title)}</h3></header>${known ? `<p class="il-known"><span>Kale hatırlıyor</span>${K.esc(K.fill(known))}</p>` : ''}${body}</article>`;
  }
  function visible() {
    return IL().items.filter(([key]) => {
      const s = state(key);
      if (filter === 'bekleyen') return !s.a;
      if (filter === 'acilan') return s.both;
      if (filter === 'muhurlu') return s.b && !s.a;
      return true;
    });
  }
  function render() {
    if (!root) return;
    const all = IL().items;
    const op = opened().length, wm = waitingMe().length, myN = all.filter(([k]) => latest(k, mine())).length;
    K.$('#ilHead', root).innerHTML = `<div class="il-meter"><div class="il-bar"><i style="width:${(op / all.length) * 100}%"></i></div>
      <p><b>${op}</b> / ${all.length} ilk birlikte hatırlandı · sen ${myN} tanesini yazdın${wm ? ` · <b class="il-hot">${wm} mühür seni bekliyor</b>` : ''}</p></div>
      <div class="seg il-seg" role="tablist">${[['hepsi', 'Hepsi'], ['bekleyen', 'Bekleyen'], ['muhurlu', 'Mühürlü'], ['acilan', 'Açılan']].map(([id, t]) => `<button type="button" role="tab" class="${filter === id ? 'on' : ''}" data-il-f="${id}">${t}</button>`).join('')}</div>
      <button type="button" class="btn ghost small il-rand" data-il-rand>${A.ui('shuffle')} Bana rastgele bir ilk sor</button>`;
    const list = visible();
    K.$('#ilList', root).innerHTML = list.length ? list.map((it) => card(it, all.indexOf(it))).join('') : `<p class="muted center">Bu listede şu an hiçbir şey yok.</p>`;
  }

  /* ---------- Yazma ---------- */
  function editor(key) {
    const it = item(key);
    if (!it) return;
    const [, title, prompt, known] = it;
    const mineR = latest(key, mine());
    const m = K.ui.modal({
      label: title,
      cls: 'il-modal',
      html: `<p class="card-eyebrow">İlklerimiz</p><h2>${K.esc(title)}</h2><p class="il-q">${K.esc(K.fill(prompt))}</p>${known ? `<p class="il-known"><span>Kale hatırlıyor</span>${K.esc(K.fill(known))}</p>` : ''}
        <form class="il-form" autocomplete="off">
          <textarea class="textarea" name="t" rows="5" maxlength="600" placeholder="Aklına ne geliyorsa. Yarım hatıra da olur." autofocus>${mineR && !mineR.data.forgot ? K.esc(mineR.data.text) : ''}</textarea>
          <label class="il-dl">Yaklaşık tarih (bilmiyorsan boş bırak)<input class="input" type="date" name="d" value="${mineR ? K.esc(mineR.data.date || '') : ''}" max="${T.todayKey()}"></label>
          <div class="row"><button class="btn red" type="submit">${A.ui('send')} Mühürle</button><button class="btn ghost" type="button" data-il-forgot>Hatırlamıyorum</button></div>
          <p class="muted small">${K.esc(nameOf(other()))}, kendi hatırladığını yazana kadar seninkini göremez.</p>
        </form>`,
    });
    const save = async (forgot) => {
      const f = K.$('.il-form', m.body);
      const text = String(f.t.value || '').trim();
      if (!forgot && !text) {
        f.t.focus();
        return;
      }
      K.$$('button', f).forEach((b) => (b.disabled = true));
      const r = await K.cloud.add('ilk', { key, text: forgot ? '' : text, date: f.d.value || '', forgot: Boolean(forgot) });
      if (!r) {
        K.$$('button', f).forEach((b) => (b.disabled = false));
        return K.fx.toast('Kaydedilemedi. İnternet bağlantını kontrol et.');
      }
      if (!rows.some((x) => x.id === r.id)) rows.push(r);
      m.close();
      const s = state(key);
      if (!K.isOwner()) K.notify(`${C.herName} bir ilki hatırladı`, `${title}: ${forgot ? 'hatırlamıyor' : text.slice(0, 140)}`, ['sparkles']);
      if (s.both) setTimeout(() => reveal(key), 350);
      else {
        K.audio.sfx.pop();
        K.fx.toast(`<b>Mühürlendi.</b> ${K.esc(nameOf(other()))} yazınca ikisi birden açılır.`, { icon: A.icon('first') });
      }
      render();
      K.renderSpecials && K.renderSpecials();
    };
    m.body.addEventListener('submit', (e) => {
      e.preventDefault();
      save(false);
    });
    m.body.addEventListener('click', (e) => e.target.closest('[data-il-forgot]') && save(true));
  }

  /* ---------- Mühür açılışı ---------- */
  function reveal(key) {
    const it = item(key);
    const s = state(key);
    if (!it || !s.both) return;
    markSeen(key);
    const forgotBoth = s.a.data.forgot && s.b.data.forgot;
    const m = K.ui.modal({
      label: it[1],
      cls: 'il-modal il-reveal',
      html: `<p class="card-eyebrow">Mühür açıldı</p><h2>${K.esc(it[1])}</h2><div class="il-pair big">${memo(s.a, mine())}${memo(s.b, other())}</div>${forgotBoth ? `<p class="il-forgot">${K.esc(IL().forgot || '')}</p>` : '<p class="muted small center">Bu ilk artık Bizim Filmimiz\'de bir sahne.</p>'}<div class="row center"><button type="button" class="btn red" data-close>Kapat</button></div>`,
    });
    K.audio.sfx.chime();
    K.fx.burst(window.innerWidth / 2, window.innerHeight / 3, { count: 26, power: 6 });
    K.stickers.award('ilkler');
    if (opened().length === IL().items.length) setTimeout(() => K.fx.confetti({ count: 200 }), 600);
    render();
    K.renderSpecials && K.renderSpecials();
  }

  /* ---------- Film ve özet için ---------- */
  function scenes() {
    return IL().items
      .map(([key, title]) => {
        const s = state(key);
        if (!s.both || (s.a.data.forgot && s.b.data.forgot)) return null;
        const byW = { [s.a.who]: s.a, [s.b.who]: s.b };
        return { key, title, date: s.a.data.date || s.b.data.date || '', me: byW.me, her: byW.her };
      })
      .filter(Boolean);
  }

  /* ---------- Bulut ---------- */
  function loadAll() {
    if (!K.cloud || !K.cloud.enabled) return Promise.resolve();
    return (loaded = loaded || (async () => {
      const got = await K.cloud.list('ilk', 500);
      got.forEach((r) => rows.some((x) => x.id === r.id) || rows.push(r));
      if (K.activeRoom === 'ilkler') render();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    })());
  }
  K.on('cloud', (on) => {
    if (!on) return;
    loadAll();
    K.cloud.on('ilk', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine()) {
        const it = item(r.data.key);
        const s = it && state(it[0]);
        if (it) K.fx.toast(s && s.both ? `<b>${K.esc(nameOf(r.who))} de yazdı:</b> ${K.esc(it[1])}. <a href="#ilkler">Mührü aç</a>` : `<b>${K.esc(nameOf(r.who))} bir ilki hatırladı:</b> ${K.esc(it[1])}. <a href="#ilkler">Sen de yaz</a>`, { icon: A.icon('first'), duration: 9000 });
      }
      if (K.activeRoom === 'ilkler') render();
      else K.renderSpecials && K.renderSpecials();
    });
  });

  // Ana salon: açılmayı bekleyen mühür ya da onun yazıp senin yazmadığın bir ilk
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const ready = IL().items.find(([k]) => state(k).both && !seen()[k]);
    if (ready) return [{ icon: 'first', title: `Bir mühür açılmaya hazır: ${ready[1]}`, text: `İkiniz de yazdınız. Bakalım aynı şeyi mi hatırlıyorsunuz?`, room: 'ilkler', cta: 'Mührü aç' }];
    const w = waitingMe();
    if (w.length) return [{ icon: 'first', title: `${nameOf(other())} bir ilki hatırladı`, text: `${w[w.length - 1][1]}. Sen de yaz; ikisi yan yana açılsın.${w.length > 1 ? ` (${w.length} mühür bekliyor)` : ''}`, room: 'ilkler', cta: 'Hatırla' }];
    return [];
  });

  K.ilkler = { scenes, opened: () => opened().length, total: () => IL().items.length, load: loadAll };

  K.room({
    id: 'ilkler',
    wing: 'anilar',
    title: 'İlklerimiz',
    sub: 'Sorularla hatırlamak: ilk mesaj, ilk arama...',
    icon: 'first',
    color: '#FFF1C9',
    hidden: () => !D.ilkler || !K.cloud || !K.cloud.enabled,
    badge: () => {
      const n = waitingMe().length + IL().items.filter(([k]) => state(k).both && !seen()[k]).length;
      return n ? `${n} mühür` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(IL().intro)}</div><div id="ilHead" class="card il-head"></div><div id="ilList" class="il-list"></div>`;
      el.addEventListener('click', (e) => {
        const f = e.target.closest('[data-il-f]');
        if (f) {
          filter = f.dataset.ilF;
          return render();
        }
        const ed = e.target.closest('[data-il-edit]');
        if (ed) return editor(ed.dataset.ilEdit);
        const op = e.target.closest('[data-il-open]');
        if (op) return reveal(op.dataset.ilOpen);
        if (e.target.closest('[data-il-rand]')) {
          const pool = IL().items.filter(([k]) => !latest(k, mine()));
          if (!pool.length) return K.fx.toast('Hepsini yazdın. Şimdi onun yazmasını bekle.');
          return editor(K.pick(pool)[0]);
        }
      });
    },
    enter() {
      render();
      loadAll();
    },
  });
})();
