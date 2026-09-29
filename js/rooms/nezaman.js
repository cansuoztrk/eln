/* Oda: Ne Zaman? — Bakü'ye gidiş tarihi henüz belli değil; bu takvimde ikisi de önümüzdeki aylara
   "uygun / belki / olmaz" işaretler. İkisinin de uygun olduğu günler parlar, kale en iyi aralıkları bulur,
   kumbaranın bu hızla hangi gün dolacağını uçakla gösterir. Bir aralık iki taraf da seçince "hedef" olur;
   kumbara o güne yetişmek için günde ne kadar gerektiğini söyler. Bulutla iki yönlü. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [], tgts = [], brush = 'ok', range = false, anchor = null, saveT = null;
  const NZ = () => D.nezaman || { intro: [], marks: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const MONTHS_AHEAD = 9;
  const LEAD = 14; // bilet almak için en az iki hafta

  /* ---------- Veri ---------- */
  let local = null; // benim düzenlediğim (henüz kaydedilmemiş olabilir)
  const latest = (who) => {
    const r = rows.filter((x) => x.who === who).pop();
    return (r && r.data && r.data.days) || {};
  };
  const days = (who) => (who === mine() && local ? local : latest(who));
  const target = () => {
    const a = tgts.filter((r) => r.who === 'me').pop();
    const b = tgts.filter((r) => r.who === 'her').pop();
    const agreed = a && b && a.data.from && a.data.from === b.data.from && a.data.to === b.data.to;
    return { agreed: agreed ? { from: a.data.from, to: a.data.to } : null, me: a && a.data.from ? a.data : null, her: b && b.data.from ? b.data : null };
  };

  const key = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const addDays = (k, n) => {
    const [y, m, d] = k.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return key(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  };
  const between = (a, b) => {
    const out = [];
    for (let k = a <= b ? a : b, end = a <= b ? b : a; k <= end; k = addDays(k, 1)) out.push(k);
    return out;
  };
  const score = (k) => {
    const x = days('her')[k], y = days('me')[k];
    if (x === 'no' || y === 'no') return -1;
    return (x === 'ok' ? 2 : x === 'maybe' ? 1 : 0) + (y === 'ok' ? 2 : y === 'maybe' ? 1 : 0);
  };

  // İkisinin de işaretlediği, "olmaz" içermeyen en az 3 günlük aralıklar
  function windows() {
    const start = addDays(T.todayKey(), LEAD);
    const end = addDays(T.todayKey(), MONTHS_AHEAD * 31);
    const out = [];
    let cur = null;
    for (let k = start; k <= end; k = addDays(k, 1)) {
      const s = score(k);
      if (s >= 3) {
        if (!cur) cur = { from: k, to: k, both: 0, sum: 0 };
        cur.to = k;
        cur.sum += s;
        if (s === 4) cur.both++;
      } else if (cur) {
        out.push(cur);
        cur = null;
      }
    }
    if (cur) out.push(cur);
    const fc = K.kumbara && K.kumbara.forecast ? K.kumbara.forecast() : null;
    const etaKey = fc && fc.eta ? T.key(T.baku(new Date(fc.eta))) : null;
    return out
      .map((w) => Object.assign(w, { len: between(w.from, w.to).length, afford: !etaKey || w.from >= etaKey }))
      .filter((w) => w.len >= 3)
      .sort((a, b) => b.afford - a.afford || b.both - a.both || b.len - a.len || (a.from < b.from ? -1 : 1))
      .slice(0, 3);
  }

  /* ---------- Çizim ---------- */
  const marks = () => Object.fromEntries((NZ().marks || []).map(([k, t]) => [k, t]));
  function month(y, m, ctx) {
    const first = new Date(Date.UTC(y, m - 1, 1));
    const lead = (first.getUTCDay() + 6) % 7; // pazartesi başlar
    const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<span class="nz-c pad"></span>');
    for (let d = 1; d <= n; d++) {
      const k = key(y, m, d);
      const h = days('her')[k] || '', me = days('me')[k] || '';
      const past = k < ctx.today;
      const both = h === 'ok' && me === 'ok';
      const cls = ['nz-c', past ? 'past' : '', both ? 'both' : '', h === 'no' || me === 'no' ? 'no' : '', ctx.tgt && k >= ctx.tgt.from && k <= ctx.tgt.to ? 'tgt' : '', ctx.win.has(k) ? 'win' : '', k === ctx.today ? 'today' : '', anchor === k ? 'anchor' : '', ctx.marks[k] ? 'mark' : ''].filter(Boolean).join(' ');
      cells.push(`<button type="button" class="${cls}" data-day="${k}" ${past ? 'disabled' : ''} aria-label="${d} ${K.MONTHS[m - 1]}: ${K.esc(C.herPet)} ${lbl(h)}, ${K.esc(C.myPet)} ${lbl(me)}${ctx.marks[k] ? ', ' + K.esc(ctx.marks[k]) : ''}">
        <b>${d}</b><span class="nz-dots"><i class="her ${h}"></i><i class="me ${me}"></i></span>${k === ctx.eta ? `<span class="nz-plane" title="Kumbara bu hızla bugün doluyor">${A.icon('plane')}</span>` : ''}${ctx.marks[k] ? '<span class="nz-star" aria-hidden="true">★</span>' : ''}</button>`);
    }
    return `<section class="nz-month"><h3>${K.MONTHS[m - 1]} ${y}</h3><div class="nz-wd">${['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((x) => `<span>${x}</span>`).join('')}</div><div class="nz-grid">${cells.join('')}</div></section>`;
  }
  const lbl = (s) => (s === 'ok' ? 'uygun' : s === 'maybe' ? 'belki' : s === 'no' ? 'olmaz' : 'işaretsiz');

  function render() {
    if (!root) return;
    const today = T.todayKey();
    const ws = windows();
    const tg = target();
    const fc = K.kumbara && K.kumbara.forecast ? K.kumbara.forecast() : null;
    const ctx = { today, tgt: tg.agreed, marks: marks(), eta: fc && fc.eta ? T.key(T.baku(new Date(fc.eta))) : '', win: new Set(ws.flatMap((w) => between(w.from, w.to))) };
    const p = T.baku();
    let y = p.y, m = p.mo;
    const html = [];
    for (let i = 0; i < MONTHS_AHEAD; i++) {
      html.push(month(y, m, ctx));
      if (++m > 12) (m = 1), y++;
    }
    K.$('#nzCal', root).innerHTML = html.join('');

    // Özet
    const cnt = (who, s) => Object.entries(days(who)).filter(([k, v]) => v === s && k >= today).length;
    const bothDays = Object.keys(days('her')).filter((k) => k >= today && days('her')[k] === 'ok' && days('me')[k] === 'ok').length;
    K.$('#nzStat', root).innerHTML = `<span><i class="her ok"></i>${K.esc(C.herPet)}: ${cnt('her', 'ok')} uygun · ${cnt('her', 'maybe')} belki</span><span><i class="me ok"></i>${K.esc(C.myPet)}: ${cnt('me', 'ok')} uygun · ${cnt('me', 'maybe')} belki</span><span class="both">${A.icon('heart')} İkinizin de uygun olduğu ${bothDays} gün</span>`;

    // Kumbara tahmini
    const kc = K.kumbara ? K.kumbara.cfg() : null;
    K.$('#nzFc', root).innerHTML = !K.kumbara
      ? ''
      : fc && fc.done
      ? `${A.icon('plane')}<p><b>Kumbara doldu.</b> Bilet için sadece tarih kaldı.</p>`
      : fc
      ? `${A.icon('plane')}<p>Kumbara bu hızla (günde ~${K.num(Math.round(fc.perDay))} ${K.esc(kc.currency)}) <b>${K.esc(T.fmt(new Date(fc.eta)))}</b> civarı doluyor. Takvimde uçakla işaretli.${tg.agreed && fc.need ? (fc.onTrack ? ' Hedefe rahat yetişiyor.' : ` Hedefe yetişmek için günde <b>${K.num(Math.ceil(fc.need))} ${K.esc(kc.currency)}</b> gerekiyor.`) : ''}</p>`
      : `${A.icon('jar')}<p>Kumbaraya ilk para atılınca, bu hızla hangi gün dolacağını burada göstereceğim.</p>`;

    // Hedef
    const mt = tg[mine()], ot = tg[other()];
    K.$('#nzTarget', root).innerHTML = tg.agreed
      ? `<div class="nz-agreed"><p class="card-eyebrow">Hedef</p><p class="nz-big">${K.esc(T.fmtShort(tg.agreed.from))} – ${K.esc(T.fmt(tg.agreed.to))}</p><p class="muted small">İkiniz de seçtiniz. ${T.daysUntil(tg.agreed.from) > 0 ? `${T.daysUntil(tg.agreed.from)} gün var.` : ''} Bileti alınca Kale Paneli'nden Biniş Kartı'nı gir.</p><button type="button" class="btn soft small" data-tclear>${A.ui('close')} Hedefi kaldır</button></div>`
      : ot && (!mt || mt.from !== ot.from || mt.to !== ot.to)
      ? `<div class="nz-prop"><p><b>${K.esc(nameOf(other()))}</b> şu aralığı önerdi: <b>${K.esc(T.fmtShort(ot.from))} – ${K.esc(T.fmt(ot.to))}</b></p><button type="button" class="btn red small" data-take="${ot.from}|${ot.to}">${A.ui('check')} Kabul</button></div>`
      : mt
      ? `<p class="muted small">Önerin: <b>${K.esc(T.fmtShort(mt.from))} – ${K.esc(T.fmt(mt.to))}</b>. ${K.esc(nameOf(other()))} kabul edince hedef olur.</p>`
      : '';

    // En iyi aralıklar
    K.$('#nzBest', root).innerHTML = ws.length
      ? ws
          .map((w) => `<li><div><b>${K.esc(T.fmtShort(w.from))} – ${K.esc(T.fmtShort(w.to))}</b><small>${w.len} gün · ${w.both === w.len ? 'ikiniz de her gün uygun' : `${w.both} gün ikiniz de uygun`}${w.afford ? '' : ' · kumbara o güne dolmayabilir'}</small></div><button type="button" class="chip" data-take="${w.from}|${w.to}">Bunu öner</button></li>`)
          .join('')
      : `<li class="muted small">İkiniz de en az üç gün yan yana "uygun" ya da "belki" işaretleyince en iyi aralıklar burada çıkar. Bilet için en az ${LEAD} gün sonrasına bakıyorum.</li>`;

    K.$$('[data-brush]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.brush === brush)));
    K.$('#nzRange', root).setAttribute('aria-pressed', String(range));
    K.$('#nzHint', root).textContent = range ? (anchor ? `Başlangıç: ${T.fmtShort(anchor)}. Şimdi bitiş gününe dokun.` : 'Aralığın ilk gününe dokun.') : 'Bir güne dokun; aynı fırçayla yeniden dokunursan silinir.';
  }

  /* ---------- Boyama ve kayıt ---------- */
  function paint(list) {
    local = Object.assign({}, days(mine()));
    const same = list.length === 1 && local[list[0]] === brush;
    list.forEach((k) => {
      if (brush === 'clear' || same) delete local[k];
      else local[k] = brush;
    });
    // Geçmiş günleri taşıma
    const today = T.todayKey();
    Object.keys(local).forEach((k) => k < today && delete local[k]);
    K.audio.sfx.pop();
    render();
    clearTimeout(saveT);
    saveT = setTimeout(save, 1200);
  }
  async function save() {
    if (!local) return;
    const r = await K.cloud.add('mdays', { days: local });
    if (!r) return K.fx.toast('Kaydedilemedi. İnterneti kontrol et.');
    local = null;
    if (!K.isOwner() && !K.store.get('nzNotified')) {
      K.store.set('nzNotified', T.todayKey());
      K.notify(`${C.herName} buluşma takvimine işaret koydu`, 'Ne Zaman? odasına bak.', ['calendar']);
    }
  }
  async function propose(from, to) {
    const r = await K.cloud.add('mtarget', { from, to });
    if (!r) return K.fx.toast('Gönderilemedi.');
    const t = target();
    if (t.agreed) {
      K.stickers.award('nezaman');
      K.fx.confetti({ count: 160, shapes: ['heart', 'star'] });
      K.fx.toast(`<b>Hedef belli:</b> ${T.fmtShort(from)} – ${T.fmt(to)}`, { icon: A.icon('plane'), duration: 8000 });
      if (!K.isOwner()) K.notify(`${C.herName} hedef tarihi kabul etti`, `${T.fmtShort(from)} – ${T.fmt(to)}`, ['airplane', 'heart'], { priority: 5 });
    } else {
      K.fx.toast(`Önerildi. ${K.esc(nameOf(other()))} kabul edince hedef olur.`, { icon: A.icon('plane') });
      if (!K.isOwner()) K.notify(`${C.herName} bir buluşma aralığı önerdi`, `${T.fmtShort(from)} – ${T.fmt(to)}`, ['airplane']);
    }
    render();
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    [rows, tgts] = await Promise.all([K.cloud.list('mdays', 400), K.cloud.list('mtarget', 200)]);
    K.cloud.on('mdays', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (K.activeRoom === 'nezaman') render();
    });
    K.cloud.on('mtarget', (r) => {
      if (tgts.some((x) => x.id === r.id)) return;
      tgts.push(r);
      if (r.who !== mine() && r.data.from) {
        const t = target();
        K.fx.toast(t.agreed ? `<b>Hedef belli:</b> ${T.fmtShort(t.agreed.from)} – ${T.fmt(t.agreed.to)}` : `<b>${K.esc(nameOf(r.who))} bir aralık önerdi:</b> ${T.fmtShort(r.data.from)} – ${T.fmt(r.data.to)}`, { icon: A.icon('plane'), duration: 8000 });
        if (t.agreed) {
          K.fx.confetti({ count: 120, shapes: ['heart', 'star'] });
          K.stickers.award('nezaman');
        }
      }
      if (K.activeRoom === 'nezaman' || K.activeRoom === 'kumbara') K.emit('nezaman');
      if (K.activeRoom === 'nezaman') render();
    });
  });
  K.nezaman = { target: () => target().agreed };

  K.room({
    id: 'nezaman',
    wing: 'kalp',
    title: 'Ne Zaman?',
    sub: 'Bakü tarihini birlikte bulalım',
    icon: 'week',
    color: '#FFF0C9',
    hidden: () => !D.nezaman || !K.cloud || !K.cloud.enabled,
    badge: () => {
      const t = target().agreed;
      return t ? `${Math.max(0, T.daysUntil(t.from))} gün` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(NZ().intro)}</div>
        <div class="nz-fc card" id="nzFc"></div>
        <div id="nzTarget"></div>
        <div class="nz-tools card">
          <div class="nz-brushes" role="group" aria-label="Fırça">
            <button type="button" class="chip nz-b ok" data-brush="ok"><i></i>Uygun</button>
            <button type="button" class="chip nz-b maybe" data-brush="maybe"><i></i>Belki</button>
            <button type="button" class="chip nz-b no" data-brush="no"><i></i>Olmaz</button>
            <button type="button" class="chip nz-b clear" data-brush="clear"><i></i>Sil</button>
            <button type="button" class="chip nz-range" id="nzRange">${A.ui('plus')} Aralık</button>
          </div>
          <p class="muted small" id="nzHint"></p>
          <div class="nz-legend"><span><i class="her ok"></i>${K.esc(C.herPet)}</span><span><i class="me ok"></i>${K.esc(C.myPet)}</span><span><i class="lg-both"></i>İkiniz de uygun</span><span><i class="lg-tgt"></i>Hedef</span><span>${A.icon('plane')} Kumbara dolar</span></div>
        </div>
        <div class="nz-stat" id="nzStat"></div>
        <div class="nz-cal" id="nzCal"></div>
        <section class="card nz-best"><p class="card-eyebrow">En iyi aralıklar</p><ul id="nzBest"></ul></section>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-brush]');
        if (b) {
          brush = b.dataset.brush;
          return render();
        }
        if (e.target.closest('#nzRange')) {
          range = !range;
          anchor = null;
          return render();
        }
        const d = e.target.closest('[data-day]');
        if (d) {
          const k = d.dataset.day;
          const mk = marks()[k];
          if (mk) K.fx.toast(`<b>${K.esc(T.fmtShort(k))}:</b> ${K.esc(mk)}`, { icon: A.icon('star'), duration: 2500 });
          if (range) {
            if (!anchor) {
              anchor = k;
              return render();
            }
            const list = between(anchor, k);
            anchor = null;
            return paint(list);
          }
          return paint([k]);
        }
        const tk = e.target.closest('[data-take]');
        if (tk) {
          const [from, to] = tk.dataset.take.split('|');
          return propose(from, to);
        }
        if (e.target.closest('[data-tclear]')) {
          const x = e.target.closest('[data-tclear]');
          if (x.dataset.armed !== '1') {
            x.dataset.armed = '1';
            x.textContent = 'Emin misin? Bir daha dokun';
            return;
          }
          await K.cloud.add('mtarget', { from: '', to: '' });
          render();
        }
      });
      K.on('nezaman', render);
    },
    enter() {
      render();
    },
    leave() {
      if (local) {
        clearTimeout(saveT);
        save();
      }
    },
  });
})();
