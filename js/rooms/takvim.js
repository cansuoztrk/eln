/* Oda: İki Takvim — Ardoş'un ders programı, onun kendi dersleri ve ikisinin ortak boş saatleri.
   Ana salondaki "Ardoş şu an derste / teneffüste / boşta" çipi de buradan beslenir (K.where). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const WEEK = [1, 2, 3, 4, 5];
  const toMin = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const hhmm = (m) => `${K.pad(Math.floor((((m % 1440) + 1440) % 1440) / 60))}:${K.pad(((m % 60) + 60) % 60)}`;
  const gap = () => (C.tzBaku - C.tzIstanbul) * 60; // Bakü, İstanbul'dan bu kadar dakika ileride
  const sc = () => C.schedule || { classes: [] };
  let root, herCloud = null, tick = null, zone = 'baku';

  /* ---------- Programlar (hepsi Bakü dakikasına çevrilir) ---------- */
  // Ardoş'un dersleri İstanbul saatiyle yazılı
  const hisBaku = () => sc().classes.map((c) => ({ ...c, a: toMin(c.from) + gap(), b: toMin(c.to) + gap(), who: 'me' }));
  // Onun dersleri Bakü saatiyle (kendi telefonunda girer; kale sahibi buluttan görür)
  const herList = () => (K.isOwner() ? (herCloud || []) : K.store.get('myClasses', []));
  const hersBaku = () => herList().map((c) => ({ ...c, a: toMin(c.from), b: toMin(c.to), who: 'her' }));

  function termOn(p) {
    const s = sc();
    const key = T.key(p);
    if (C.classMode === 'off') return false;
    if (s.from && key < s.from) return false;
    if (s.to && key > s.to) return false;
    return !(s.holidays || []).includes(key);
  }

  /* ---------- Şu an ne yapıyor? ---------- */
  function arda() {
    if (!sc().classes.length) return null;
    const p = T.ist();
    const m = p.h * 60 + p.mi;
    const name = C.myPet;
    const bakuAt = (min) => hhmm(min + gap());
    const nextText = () => {
      for (let i = 0; i < 7; i++) {
        const wd = (p.wd + i) % 7;
        const list = sc().classes.filter((c) => c.day === wd && (i > 0 || toMin(c.from) > m)).sort((x, y) => toMin(x.from) - toMin(y.from));
        if (list.length) return `Sıradaki dersi: ${i === 0 ? 'bugün' : i === 1 ? 'yarın' : DAYS[wd]} ${bakuAt(toMin(list[0].from))} (Bakü) · ${list[0].name}`;
      }
      return '';
    };
    if (C.classMode === 'sinav') return { state: 'exam', icon: 'cap', text: `${name} sınav haftasında`, sub: 'Ona güç ver: bir kalp, bir "yapabilirsin".' };
    if (!termOn(p)) return { state: 'off', icon: 'sun', text: `${name} bugün tatilde`, sub: 'Ders yok; bütün gün senin.' };
    if (m >= 90 && m < 480) return { state: 'sleep', icon: 'moon', text: `${name} muhtemelen uyuyor`, sub: 'Rüyasında kimi gördüğünü tahmin edebilirsin.' };
    if (p.wd === 0 || p.wd === 6) return { state: 'weekend', icon: 'sun', text: 'Hafta sonu: ders yok', sub: `${name} bugün bütünüyle boşta.` };
    const today = sc().classes.filter((c) => c.day === p.wd).sort((x, y) => toMin(x.from) - toMin(y.from));
    const cur = today.find((c) => m >= toMin(c.from) && m < toMin(c.to));
    if (cur) {
      if (m % 60 >= 50) return { state: 'break', icon: 'radio', text: `${name} teneffüste`, sub: `${60 - (m % 60)} dakikası var. Telsizle yakala!`, cls: cur };
      return { state: 'class', icon: 'cap', text: `${name} şu an derste`, sub: `${cur.name}${cur.online ? ' (çevrimiçi)' : ''} · Bakü saatiyle ${bakuAt(toMin(cur.to))}'de çıkıyor`, say: cur.say, cls: cur };
    }
    const just = today.filter((c) => m >= toMin(c.to) && m - toMin(c.to) < 45).pop();
    if (just) {
      const lines = sc().after || [];
      const t = lines.length ? K.fill(lines[(T.dayNumber(T.now()) + toMin(just.to)) % lines.length]).replace(/\{class\}/g, just.name) : '';
      return { state: 'after', icon: 'heart', text: `${name} dersten yeni çıktı`, sub: t || just.name, cls: just };
    }
    const soon = today.find((c) => toMin(c.from) > m && toMin(c.from) - m <= 60);
    if (soon) return { state: 'soon', icon: 'plane', text: `${name} birazdan derse giriyor`, sub: `${soon.name} · Bakü saatiyle ${bakuAt(toMin(soon.from))}`, cls: soon };
    if (!today.length && p.wd === 3 && sc().free) return { state: 'free', icon: 'heart', text: `Bugün ${name}'un hiç dersi yok`, sub: K.fill(sc().free) };
    return { state: 'free', icon: 'heart', text: `${name} şu an boşta`, sub: nextText() || 'Telsiz açık.' };
  }
  function elnos() {
    const list = hersBaku();
    if (!list.length) return null;
    const p = T.baku();
    const m = p.h * 60 + p.mi;
    const cur = list.find((c) => c.day === p.wd && m >= c.a && m < c.b);
    if (cur) return { state: 'class', icon: 'apple', text: `${C.herPet} şu an derste`, sub: `${cur.name} · İstanbul saatiyle ${hhmm(cur.b - gap())}'de çıkıyor`, cls: cur };
    return { state: 'free', icon: 'heart', text: `${C.herPet} şu an derste değil`, sub: '' };
  }
  // Ana salon için: kale sahibine onu, ona Ardoş'u anlatır
  K.where = () => (K.isOwner() ? elnos() : (K.bilet && K.bilet.where()) || arda());
  K.whereArda = arda;

  /* ---------- Ortak boş saatler (Bakü saatiyle, 09:00–24:00) ---------- */
  function freeWindows(wd) {
    const busy = hisBaku()
      .concat(hersBaku())
      .filter((c) => c.day === wd)
      .map((c) => [c.a, c.b])
      .sort((x, y) => x[0] - y[0]);
    const out = [];
    let t = 9 * 60;
    busy.forEach(([a, b]) => {
      if (a - t >= 45) out.push([t, a]);
      t = Math.max(t, b + 10);
    });
    if (24 * 60 - t >= 45) out.push([t, 24 * 60]);
    return out;
  }

  /* ---------- Çizim ---------- */
  const fmtZone = (bakuMin, end) => (end && bakuMin >= 24 * 60 ? 'gece yarısı' : hhmm(zone === 'baku' ? bakuMin : bakuMin - gap()));
  function grid() {
    const from = 8 * 60, to = 22 * 60, H = 30; // saat başına 30 piksel
    const hours = [];
    for (let h = from; h <= to; h += 60) hours.push(h);
    const all = hisBaku().concat(hersBaku());
    const todayWd = T.baku().wd;
    return `<div class="tk-grid" style="--rows:${(to - from) / 60};--h:${H}px">
      <div class="tk-hours">${hours.map((h) => `<span style="top:${((h - from) / 60) * H}px">${fmtZone(h)}</span>`).join('')}</div>
      ${WEEK.map((wd) => `<div class="tk-col ${wd === todayWd ? 'today' : ''}"><b class="tk-day">${DAYS[wd].slice(0, 3)}</b><div class="tk-lane">
        ${all
          .filter((c) => c.day === wd && c.b > from && c.a < to)
          .map((c) => `<i class="tk-blk ${c.who} ${all.some((o) => o.who !== c.who && o.day === c.day && o.a < c.b && c.a < o.b) ? 'half' : ''}" style="top:${((Math.max(c.a, from) - from) / 60) * H}px;height:${((Math.min(c.b, to) - Math.max(c.a, from)) / 60) * H}px" title="${K.esc(c.name)}"><span>${K.esc(c.name)}</span></i>`)
          .join('')}
        ${wd === todayWd ? nowLine(from, H) : ''}
      </div></div>`).join('')}
    </div>`;
  }
  function nowLine(from, H) {
    const p = T.baku();
    const m = p.h * 60 + p.mi;
    if (m < from || m > 22 * 60) return '';
    return `<i class="tk-nowline" style="top:${((m - from) / 60) * H}px"></i>`;
  }
  function statusCard(s, who) {
    if (!s) return `<div class="tk-st empty"><p class="card-eyebrow">${K.esc(who)}</p><p class="muted small">${who === C.herPet ? 'Ders programını aşağıdan ekleyince burada görünür.' : 'Program yok.'}</p></div>`;
    return `<div class="tk-st st-${s.state}">${A.icon(s.icon)}<div><p class="card-eyebrow">${K.esc(who)}</p><b>${K.esc(s.text)}</b>${s.sub ? `<p class="small">${K.esc(s.sub)}</p>` : ''}${s.say ? `<p class="hand tk-say">${K.esc(s.say)}</p>` : ''}</div></div>`;
  }
  function render() {
    if (!root) return;
    K.$('#tkNow', root).innerHTML = statusCard(arda(), C.myPet) + statusCard(elnos(), C.herPet);
    K.$('#tkGrid', root).innerHTML = grid();
    const bp = T.baku();
    const wd = bp.wd;
    const nowM = bp.h * 60 + bp.mi;
    K.$('#tkFree', root).innerHTML = WEEK.map((d) => {
      const w = freeWindows(d);
      // Bugün için: henüz bitmemiş ilk boşluk (başlamışsa şimdiden itibaren)
      const next = d === wd ? w.find(([, b]) => b - nowM >= 30) : null;
      const at = next ? Math.max(next[0], Math.ceil((nowM + 15) / 15) * 15) : null;
      return `<li class="${d === wd ? 'today' : ''}"><b>${DAYS[d]}</b><span>${w.length ? w.map(([a, b]) => `${fmtZone(a)}–${fmtZone(b, true)}`).join(' · ') : 'Ortak boşluk yok'}</span>${next ? `<button class="btn small soft" data-call="${at}">${A.ui('send')} ${fmtZone(at)} için görüşme öner</button>` : ''}</li>`;
    }).join('');
    const mine = herList();
    const ed = K.$('#tkMine', root);
    if (ed)
      ed.innerHTML = mine.length
        ? mine
            .slice()
            .sort((x, y) => x.day - y.day || toMin(x.from) - toMin(y.from))
            .map((c) => `<li><b>${DAYS[c.day]}</b> ${K.esc(c.from)}–${K.esc(c.to)} · ${K.esc(c.name)}${K.isOwner() ? '' : `<button class="wn-x" data-rm="${K.esc(c.id)}" aria-label="Sil">${A.ui('close')}</button>`}</li>`)
            .join('')
        : `<li class="muted">${K.isOwner() ? 'Henüz ders programını eklememiş.' : 'Henüz ders eklemedin.'}</li>`;
  }

  function saveMine(list) {
    K.store.set('myClasses', list);
    if (K.cloud && K.cloud.enabled) K.cloud.add('classes', { list });
    render();
    homeChip();
  }

  /* ---------- Ana salon çipi ---------- */
  function homeChip() {
    const chip = K.$('#whereChip');
    if (!chip) return;
    const s = K.where();
    chip.hidden = !s || (K.isOwner() && s.state !== 'class');
    if (!s) return;
    chip.className = `where-chip st-${s.state}`;
    chip.setAttribute('href', '#' + (s.room || 'takvim'));
    chip.innerHTML = `${A.icon(s.chipIcon || 'week')}<span><b>${K.esc(s.text)}</b>${s.cls && s.state === 'class' ? ` · ${K.esc(s.cls.name)}` : s.chipSub ? ` · ${K.esc(s.chipSub)}` : ''}</span>`;
  }
  K.homeChip = homeChip;
  K.on('built', () => {
    homeChip();
    clearInterval(tick);
    tick = setInterval(() => {
      if (!K.activeRoom) homeChip();
      else if (K.activeRoom === 'takvim') render();
    }, 30e3);
  });
  K.on('cloud', async (on) => {
    if (!on) return;
    const rows = (await K.cloud.list('classes')).filter((r) => r.who === 'her');
    if (rows.length) herCloud = rows[rows.length - 1].data.list || [];
    K.cloud.on('classes', (r) => {
      if (r.who !== 'her') return;
      herCloud = r.data.list || [];
      render();
      homeChip();
    });
    // Kale sahibi panelden "tatil / sınav" durumunu değiştirebilir
    const cfg = await K.cloud.list('config');
    cfg.forEach((r) => 'classMode' in r.data && (C.classMode = r.data.classMode));
    K.cloud.on('config', (r) => {
      if ('classMode' in r.data) C.classMode = r.data.classMode;
      homeChip();
    });
    homeChip();
  });

  K.room({
    id: 'takvim',
    wing: 'hazine',
    title: 'İki Takvim',
    sub: () => (K.isOwner() ? `Senin derslerin, ${C.herPet}'un dersleri, ortak boş saatler` : `${C.myPet} şu an nerede? Dersler ve ortak boş saatler`),
    icon: 'week',
    color: '#DDEBFF',
    hidden: () => !C.schedule,
    badge: () => {
      const s = arda();
      return s && s.state === 'class' ? 'Derste' : s && s.state === 'break' ? 'Teneffüs' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Aramızda bir saat fark var; derslerimiz de birbirini tutmuyor. Bu oda ikisini üst üste koyuyor: Ben şu an derste miyim, teneffüste miyim, yoksa telefona bakıyor muyum? Ve en önemlisi: ikimizin de boş olduğu saatler hangileri?</p>
        <div class="tk-now" id="tkNow"></div>
        <section class="card tk-week">
          <div class="tk-head"><p class="card-eyebrow">Haftamız</p>
            <div class="tk-zone" role="group" aria-label="Saat dilimi"><button class="chip" data-z="baku" aria-pressed="true">Bakü saati</button><button class="chip" data-z="ist" aria-pressed="false">İstanbul saati</button></div></div>
          <div class="tk-legend"><span class="me">${K.esc(C.myPet)}</span><span class="her">${K.esc(C.herPet)}</span></div>
          <div id="tkGrid"></div>
          <p class="muted small">${K.esc(sc().term || '')}${sc().term ? ' · ' : ''}${K.esc(C.myPet)}'un 1. sınıf programı. Resmî tatillerde ve dönem dışında "tatilde" görünür.</p>
        </section>
        <section class="card tk-free-card">
          <p class="card-eyebrow">İkimizin de boş olduğu saatler</p>
          <ul class="tk-free" id="tkFree"></ul>
        </section>
        <section class="card tk-ed">
          <p class="card-eyebrow">${K.isOwner() ? `${K.esc(C.herPet)}'un dersleri` : 'Senin derslerin (Bakü saatiyle)'}</p>
          ${K.isOwner() ? '' : `<p class="muted small">Derslerini ekle; ortak boş saatler kendiliğinden hesaplansın. ${K.esc(C.myPet)} da derste olduğunu görüp sana yazmak için teneffüsünü bekler.</p>
          <form class="tk-form" id="tkForm" autocomplete="off">
            <select class="input" id="tkDay" name="tkDay" aria-label="Gün">${[1, 2, 3, 4, 5, 6].map((d) => `<option value="${d}">${DAYS[d]}</option>`).join('')}</select>
            <input class="input" type="time" id="tkFrom" name="tkFrom" value="09:00" aria-label="Başlangıç">
            <input class="input" type="time" id="tkTo" name="tkTo" value="10:30" aria-label="Bitiş">
            <input class="input" id="tkName" name="tkName" maxlength="40" placeholder="Ders adı (ör. Phonetics)">
            <button class="btn small" type="submit">${A.ui('plus')} Ekle</button>
          </form>`}
          <ul class="tk-mine" id="tkMine"></ul>
        </section>`;
      el.addEventListener('click', async (e) => {
        const z = e.target.closest('[data-z]');
        if (z) {
          zone = z.dataset.z;
          K.$$('[data-z]', el).forEach((b) => b.setAttribute('aria-pressed', String(b === z)));
          render();
        }
        const rm = e.target.closest('[data-rm]');
        if (rm) saveMine(K.store.get('myClasses', []).filter((c) => c.id !== rm.dataset.rm));
        const call = e.target.closest('[data-call]');
        if (call) {
          const at = +call.dataset.call;
          const txt = `Bugün ${hhmm(at)}'de (Bakü) / ${hhmm(at - gap())}'de (İstanbul) ikimiz de boşuz. Arayalım mı?`;
          let ok = false;
          if (K.cloud && K.cloud.enabled) ok = Boolean(await K.cloud.add('live', { text: txt }));
          if (!K.isOwner()) ok = (await K.notify(`${C.herName} görüşme öneriyor`, txt, ['telephone_receiver'])) || ok;
          K.fx.toast(ok ? 'Öneri gönderildi.' : 'Şu an gönderilemedi; telsizden yazabilirsin.', { icon: A.icon('radio') });
        }
      });
      const f = K.$('#tkForm', el);
      f &&
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const from = K.$('#tkFrom', el).value, to = K.$('#tkTo', el).value, name = K.$('#tkName', el).value.trim();
          if (!from || !to || !name || toMin(to) <= toMin(from)) return K.fx.toast('Gün, saat ve ders adını kontrol et.');
          saveMine(K.store.get('myClasses', []).concat({ id: 'c' + Date.now(), day: +K.$('#tkDay', el).value, from, to, name }));
          K.$('#tkName', el).value = '';
          K.audio.sfx.pop();
          K.stickers.award('takvim');
        });
    },
    enter() {
      render();
    },
  });
})();
