/* Oda: Gün Gün Biz — tanıştığımız günden bugüne her gün bir kare. Kare ne kadar koyuysa o gün kalede o kadar çok an var
   (sesler, kartpostallar, yıldızlar, hava durumları, sofralar...). Bir kareye dokununca o günün bütün anları sırayla açılır.
   Kale, kimse bir şey yazmadan kendi günlüğünü tutar. Veri: K.akis.all() (bütün hafif bulut kayıtları) + önemli günler. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const GG = () => D.gungun || { intro: [], days: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  // Tek renk, açıktan koyuya (az → çok); boş gün nötr
  const RAMP = ['#FFE3EE', '#FFB9D3', '#FF8AB6', '#E9508C', '#B8235F'];
  const STEPS = [[1, '1'], [2, '2–3'], [4, '4–6'], [7, '7–10'], [11, '11+']];
  const level = (n) => (n <= 0 ? -1 : n === 1 ? 0 : n <= 3 ? 1 : n <= 6 ? 2 : n <= 10 ? 3 : 4);
  const WD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const MONTHS = K.MONTHS || ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  let root, items = [], byDay = {}, loaded = false, tip = null;

  const key = (d) => `${d.getUTCFullYear()}-${K.pad(d.getUTCMonth() + 1)}-${K.pad(d.getUTCDate())}`;
  const utc = (k) => new Date(k + 'T00:00:00Z');
  const addDays = (k, n) => key(new Date(utc(k).getTime() + n * 864e5));

  // Önemli günler: içerikteki sabit günler + ayarlardaki tarihler + her yılın doğum günleri
  function milestones() {
    const m = {};
    const add = (k, title, text) => k && (m[k] = m[k] || []).push({ title, text });
    (GG().days || []).forEach(([k, t, x]) => add(k, t, x));
    if (C.firstMeetDate) add(C.firstMeetDate, 'İlk sarılma', 'Ekranlar bitti.');
    const y0 = +C.metDate.slice(0, 4), y1 = +T.todayKey().slice(0, 4);
    for (let y = y0; y <= y1; y++) {
      if (C.herBirthday && y > 2026) add(`${y}-${C.herBirthday}`, `${C.herPet}'un doğum günü`, '');
      if (C.myBirthday) add(`${y}-${C.myBirthday}`, `${C.myPet}'un doğum günü`, '');
      if (y > +C.togetherDate.slice(0, 4)) add(`${y}${C.togetherDate.slice(4)}`, `${y - +C.togetherDate.slice(0, 4)}. yıldönümümüz`, '');
    }
    return m;
  }

  function group() {
    byDay = {};
    items.forEach((x) => (byDay[x.day] = byDay[x.day] || []).push(x));
    Object.values(byDay).forEach((l) => l.sort((a, b) => a.at - b.at));
  }
  function stats() {
    const today = T.todayKey();
    let best = null, streak = 0, run = 0, total = 0;
    for (let k = C.metDate; k <= today; k = addDays(k, 1)) {
      const n = (byDay[k] || []).length;
      total += n;
      if (n) {
        run++;
        streak = Math.max(streak, run);
        if (!best || n > best[1]) best = [k, n];
      } else run = 0;
    }
    const both = Object.keys(byDay).filter((k) => byDay[k].some((x) => x.who === 'me') && byDay[k].some((x) => x.who === 'her')).length;
    return { days: Math.max(0, T.daysSince(C.metDate)) + 1, total, best, streak, both };
  }

  /* ---------- Takvim ---------- */
  function calendar() {
    const ms = milestones();
    const today = T.todayKey();
    const first = C.metDate.slice(0, 7);
    const months = [];
    for (let m = first; m <= today.slice(0, 7); ) {
      months.push(m);
      const [y, mo] = m.split('-').map(Number);
      m = mo === 12 ? `${y + 1}-01` : `${y}-${K.pad(mo + 1)}`;
    }
    return months
      .reverse()
      .map((m) => {
        const [y, mo] = m.split('-').map(Number);
        const d1 = `${m}-01`;
        const lead = (utc(d1).getUTCDay() + 6) % 7;
        const len = new Date(Date.UTC(y, mo, 0)).getUTCDate();
        let n = 0;
        const cells = [];
        for (let i = 0; i < lead; i++) cells.push('<i class="gg-pad"></i>');
        for (let d = 1; d <= len; d++) {
          const k = `${m}-${K.pad(d)}`;
          if (k < C.metDate || k > today) {
            cells.push(`<i class="gg-pad ${k > today ? 'fut' : ''}">${d}</i>`);
            continue;
          }
          const c = (byDay[k] || []).length;
          n += c;
          const lv = level(c);
          const mk = ms[k];
          cells.push(`<button type="button" class="gg-d ${k === today ? 'today' : ''} ${mk ? 'mk' : ''} ${lv >= 3 ? 'dark' : ''}" data-gg="${k}" style="${lv >= 0 ? `--c:${RAMP[lv]}` : ''}" aria-label="${K.esc(T.fmt(k))}: ${c ? `${c} an` : 'sessiz'}${mk ? ', ' + K.esc(mk[0].title) : ''}">${d}${mk ? '<b aria-hidden="true">♥</b>' : ''}</button>`);
        }
        return `<section class="gg-m"><header><h3>${MONTHS[mo - 1]} ${y}</h3><small>${n ? `${K.num(n)} an` : ''}</small></header><div class="gg-wd">${WD.map((w) => `<span>${w}</span>`).join('')}</div><div class="gg-grid">${cells.join('')}</div></section>`;
      })
      .join('');
  }
  function render() {
    if (!root) return;
    const s = stats();
    K.$('#ggStats', root).innerHTML = `<div class="gg-stat"><b>${K.num(s.days)}</b><span>gün</span></div>
      <div class="gg-stat"><b>${K.num(s.total)}</b><span>an</span></div>
      <div class="gg-stat"><b>${K.num(s.both)}</b><span>ikimizin de iz bıraktığı gün</span></div>
      <div class="gg-stat"><b>${K.num(s.streak)}</b><span>günlük en uzun seri</span></div>
      ${s.best ? `<button type="button" class="gg-stat best" data-gg="${s.best[0]}"><b>${K.esc(T.fmtShort(s.best[0]))}</b><span>en dolu gün · ${s.best[1]} an</span></button>` : ''}`;
    K.$('#ggBack', root).innerHTML = backCard();
    K.$('#ggLegend', root).innerHTML = `<span>Az</span>${RAMP.map((c, i) => `<i style="background:${c}" title="${STEPS[i][1]} an"></i>`).join('')}<span>Çok</span><em><b>♥</b> önemli gün</em><em><i class="lg-empty"></i> sessiz gün</em>`;
    K.$('#ggCal', root).innerHTML = loaded ? calendar() : '<p class="muted center">Kale günlüğü açılıyor...</p>';
  }
  // Bir ay / bir yıl önce bugün
  function backCard() {
    const t = T.todayKey();
    const [y, m, d] = t.split('-').map(Number);
    const monthAgo = m === 1 ? `${y - 1}-12-${K.pad(d)}` : `${y}-${K.pad(m - 1)}-${K.pad(d)}`;
    const yearAgo = `${y - 1}-${K.pad(m)}-${K.pad(d)}`;
    const pick = [[yearAgo, GG().onThisYear || 'Bir yıl önce bugün'], [monthAgo, GG().onThisDay || 'Bir ay önce bugün']].find(([k]) => (byDay[k] || []).length || milestones()[k]);
    if (!pick) return '';
    const [k, label] = pick;
    const l = byDay[k] || [];
    const pr = l.find((x) => x.img) || l.find((x) => x.weight >= 2) || l[0];
    const mk = milestones()[k];
    return `<button type="button" class="gg-back" data-gg="${k}">${pr && pr.img ? `<img src="${pr.img}" alt="">` : `<span class="gg-back-e">${mk ? '♥' : (pr && pr.emoji) || '♥'}</span>`}<span><small>${K.esc(label)} · ${K.esc(T.fmt(k))}</small><b>${K.esc(mk ? mk[0].title : pr ? pr.title : '')}</b>${l.length ? `<em>${l.length} an</em>` : ''}</span></button>`;
  }

  /* ---------- Günün anları ---------- */
  function day(k) {
    const l = byDay[k] || [];
    const mk = milestones()[k];
    const d = utc(k);
    const wd = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][d.getUTCDay()];
    const since = Math.round((utc(k) - utc(C.metDate)) / 864e5);
    const wx = (w) => l.filter((x) => x.kind === 'hava' && x.who === w).pop();
    const wme = wx('me'), wher = wx('her');
    const prev = addDays(k, -1), next = addDays(k, 1);
    const m = K.ui.modal({
      label: T.fmt(k),
      cls: 'gg-day',
      html: `<p class="card-eyebrow">${K.esc(wd)} · tanışmamızın ${K.num(since + 1)}. günü</p><h2>${K.esc(T.fmt(k))}</h2>
        ${mk ? mk.map((x) => `<p class="gg-mk"><b>♥ ${K.esc(K.fill(x.title))}</b>${x.text ? ` ${K.esc(K.fill(x.text))}` : ''}</p>`).join('') : ''}
        ${wme || wher ? `<p class="gg-wx">${wme ? `<span>${K.avatar('me')} ${wme.emoji || ''}</span>` : ''}${wher ? `<span>${K.avatar('her')} ${wher.emoji || ''}</span>` : ''}</p>` : ''}
        ${l.length ? `<ol class="gg-list">${l
          .map((x) => {
            const p = T.baku(new Date(x.at));
            const r = x.room && K.rooms.find((q) => q.id === x.room && !(typeof q.hidden === 'function' ? q.hidden() : q.hidden));
            return `<li class="${x.who}"><time>${K.pad(p.h)}:${K.pad(p.mi)}</time>${K.avatar(x.who)}<div class="gg-it">${x.img ? `<img src="${x.img}" alt="" loading="lazy">` : `<span class="gg-emo">${x.emoji || '♥'}</span>`}<p><b>${K.esc(nameOf(x.who))}</b> · ${K.esc(x.title)}${x.text ? `<br><span>${K.esc(x.text)}</span>` : ''}</p>${r ? `<a href="#${r.id}" data-close class="gg-go" aria-label="${K.esc(K.val(r.title))}">${A.ui('next')}</a>` : ''}</div></li>`;
          })
          .join('')}</ol>` : `<p class="gg-quiet">${K.esc(GG().quiet || '')}</p>`}
        <div class="gg-nav"><button type="button" class="btn ghost small" data-gg-go="${prev}" ${prev < C.metDate ? 'disabled' : ''}>${A.ui('back')} Önceki gün</button><button type="button" class="btn ghost small" data-gg-go="${next}" ${next > T.todayKey() ? 'disabled' : ''}>Sonraki gün ${A.ui('next')}</button></div>`,
    });
    m.body.addEventListener('click', (e) => {
      const g = e.target.closest('[data-gg-go]');
      if (g && !g.disabled) {
        m.close();
        setTimeout(() => day(g.dataset.ggGo), 200);
      }
    });
    K.stickers.award('gungun');
  }

  /* ---------- İpucu (masaüstü) ---------- */
  function hover(e) {
    const b = e.target.closest && e.target.closest('.gg-d');
    if (!b) {
      if (tip) tip.hidden = true;
      return;
    }
    const k = b.dataset.gg;
    const l = byDay[k] || [];
    const mk = milestones()[k];
    tip = tip || document.body.appendChild(K.el('<div class="gg-tip" role="tooltip"></div>'));
    const whoN = (w) => l.filter((x) => x.who === w).length;
    tip.innerHTML = `<b>${K.esc(T.fmt(k))}</b>${mk ? `<span>♥ ${K.esc(K.fill(mk[0].title))}</span>` : ''}<span>${l.length ? `${l.length} an · ${K.esc(C.myPet)} ${whoN('me')}, ${K.esc(C.herPet)} ${whoN('her')}` : 'Sessiz gün'}</span>`;
    tip.hidden = false;
    const r = b.getBoundingClientRect();
    const tw = tip.offsetWidth;
    tip.style.left = K.clamp(r.left + r.width / 2 - tw / 2, 8, window.innerWidth - tw - 8) + 'px';
    tip.style.top = r.top - tip.offsetHeight - 8 + 'px';
  }

  async function load() {
    items = await K.akis.all();
    group();
    loaded = true;
    render();
  }

  // Ana salon: "Bir ay önce bugün" (ya da bir yıl) — o günden bir an geri gelir
  let back = null;
  async function loadBack() {
    const t = T.todayKey();
    const [y, m, d] = t.split('-').map(Number);
    const cands = [[`${y - 1}-${K.pad(m)}-${K.pad(d)}`, GG().onThisYear || 'Bir yıl önce bugün'], [m === 1 ? `${y - 1}-12-${K.pad(d)}` : `${y}-${K.pad(m - 1)}-${K.pad(d)}`, GG().onThisDay || 'Bir ay önce bugün']];
    for (const [k, label] of cands) {
      if (k < C.metDate) continue;
      const since = T.at(k).getTime();
      const rows = await K.cloud.many(['hikaye', 'postcard', 'kphoto', 'sahne', 'hava', 'dvoice', 'song', 'page', 'tale', 'knote', 'bouquet', 'flight', 'sofra', 'coin'], { since, before: since + 864e5, limit: 60 });
      const list = rows.map(K.akis.norm).filter(Boolean);
      const mk = milestones()[k];
      if (!list.length && !mk) continue;
      const best = list.find((x) => x.img) || list.find((x) => x.weight >= 2) || list[0];
      back = { k, label, n: list.length, title: mk ? K.fill(mk[0].title) : best ? `${nameOf(best.who)}: ${best.title}` : '', text: best && best.text ? best.text : '' };
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
      return;
    }
  }
  K.on('cloud', (on) => on && setTimeout(loadBack, 5000));
  K.specialHooks = (K.specialHooks || []).concat(() =>
    back && K.store.get('ggBackSeen') !== T.todayKey()
      ? [{ icon: 'calendar', title: `${back.label}: ${back.title}`, text: `${T.fmt(back.k)}${back.n ? ` · o gün kalede ${back.n} an` : ''}${back.text ? `. "${back.text.slice(0, 90)}"` : ''}`, room: 'gungun', cta: 'O güne dön' }]
      : []
  );
  K.gungun = { open: day, load };

  K.room({
    id: 'gungun',
    wing: 'anilar',
    title: 'Gün Gün Biz',
    sub: 'Tanıştığımız günden beri her gün bir kare',
    icon: 'calendar',
    color: '#FFD9E6',
    hidden: () => !D.gungun || !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(GG().intro || [])}</div>
        <div class="gg-stats" id="ggStats"></div>
        <div id="ggBack"></div>
        <div class="gg-legend" id="ggLegend"></div>
        <div class="gg-cal" id="ggCal"></div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-gg]');
        if (b) {
          if (tip) tip.hidden = true;
          day(b.dataset.gg);
        }
      });
      if (!K.touch) {
        el.addEventListener('pointerover', hover);
        el.addEventListener('pointerleave', () => tip && (tip.hidden = true));
      }
    },
    enter() {
      render();
      load().then(() => {
        if (back && K.store.get('ggBackSeen') !== T.todayKey()) {
          K.store.set('ggBackSeen', T.todayKey());
          day(back.k);
        }
      });
    },
    leave() {
      if (tip) tip.hidden = true;
    },
  });
})();
