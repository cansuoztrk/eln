/* Oda: Sınav Kalkanı — ikisi de sınav tarihlerini girer (onunkiler Aralık'ta açıklanıyor).
   Sınavlar Ne Zaman? takvimine kendiliğinden düşer. Öbürü sınavdan önce bir şans tılsımı ve not gönderir;
   sınav sabahı ana salonda kart ve sesli "başarılar", önceki akşam "erken uyu" hatırlatması; sınavdan sonra "Nasıl geçti?". */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [];
  const KK = () => D.kalkan || { intro: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const CHARMS = [
    ['nazar', 'Nazar boncuğu', '<circle cx="32" cy="32" r="24" fill="#1E5AA8" stroke="#2B2024" stroke-width="3"/><circle cx="32" cy="32" r="16" fill="#fff"/><circle cx="32" cy="32" r="10" fill="#8FD3FF"/><circle cx="32" cy="32" r="5" fill="#2B2024"/>'],
    ['yonca', 'Dört yapraklı yonca', '<g fill="#5CC28D" stroke="#2B2024" stroke-width="2.4"><path d="M32 30 C22 18 12 26 20 32 C12 38 22 46 32 34 Z"/><path d="M32 30 C42 18 52 26 44 32 C52 38 42 46 32 34 Z"/><path d="M30 32 C18 22 26 12 32 20 C38 12 46 22 34 32 Z"/><path d="M30 32 C18 42 26 52 32 44 C38 52 46 42 34 32 Z"/></g><path d="M34 40 Q40 52 36 60" stroke="#3FA37A" stroke-width="3" fill="none" stroke-linecap="round"/>'],
    ['fiyonk', 'Uğurlu fiyonk', null, 'bow'],
    ['kalem', 'Şanslı kalem', null, 'pencil'],
    ['yildiz', 'Kayan yıldız', null, 'star'],
    ['opucuk', 'Şans öpücüğü', null, 'heart'],
  ];
  const charmSvg = (id) => {
    const c = CHARMS.find((x) => x[0] === id) || CHARMS[5];
    return c[2] ? `<svg class="kk-charm" viewBox="0 0 64 64" aria-hidden="true">${c[2]}</svg>` : A.icon(c[3], 'kk-charm');
  };
  const charmName = (id) => (CHARMS.find((x) => x[0] === id) || CHARMS[5])[1];
  const MOODS = [
    ['iyi', 'Çok iyi geçti', '#3FA37A'],
    ['orta', 'İdare eder', '#F5B83D'],
    ['kotu', 'Kötü geçti', '#E3174D'],
  ];

  const exams = (who) => rows.filter((r) => r.kind === 'exam' && (!who || r.who === who)).sort((a, b) => (a.data.date + (a.data.time || '')).localeCompare(b.data.date + (b.data.time || '')));
  const charmsFor = (e) => rows.filter((r) => r.kind === 'luck' && r.data.exam === e.id);
  const resultOf = (e) => rows.filter((r) => r.kind === 'examres' && r.data.exam === e.id).pop();
  const daysTo = (e) => T.daysUntil(e.data.date);
  // Sınav bitti mi? (saat onun şehrine göre; saat yoksa öğleden sonra)
  const over = (e) => {
    const d = daysTo(e);
    if (d !== 0) return d < 0;
    const p = e.who === 'me' ? T.ist() : T.baku();
    const now = `${K.pad(p.h)}:${K.pad(p.mi)}`;
    return now >= (e.data.time || '12:00');
  };
  const when = (e) => {
    const d = daysTo(e);
    return d > 1 ? `${d} gün` : d === 1 ? 'Yarın' : d === 0 ? 'Bugün' : 'Bitti';
  };

  /* ---------- Çizim ---------- */
  function examCard(e) {
    const own = e.who === mine();
    const d = daysTo(e);
    const cs = charmsFor(e);
    const res = resultOf(e);
    const sent = cs.find((c) => c.who === mine());
    const mood = res && MOODS.find((m) => m[0] === res.data.mood);
    return `<article class="kk-exam ${d === 0 ? 'today' : d < 0 ? 'past' : ''} ${e.who}">
      <header><span class="kk-when">${K.esc(when(e))}</span><div><b>${K.esc(e.data.name)}</b><small>${K.esc(T.fmt(e.data.date, true))}${e.data.time ? ` · ${K.esc(e.data.time)}` : ''}</small></div>
        ${own && d > 0 ? `<button type="button" class="dv-x" data-del="${e.id}" aria-label="Sil">${A.ui('close')}</button>` : ''}</header>
      ${cs.length ? `<div class="kk-charms">${cs.map((c) => `<span title="${K.esc(charmName(c.data.charm))}">${charmSvg(c.data.charm)}${c.data.note ? `<em class="hand">"${K.esc(c.data.note)}"</em>` : ''}</span>`).join('')}</div>` : ''}
      ${!own && d >= 0 && !sent ? `<div class="kk-send"><p class="small">${K.esc(K.ek(nameOf(e.who), 'e'))} bir şans tılsımı gönder:</p><div class="kk-pick">${CHARMS.map(([id, n]) => `<button type="button" class="kk-c" data-charm="${id}" data-exam="${e.id}" aria-label="${K.esc(n)}">${charmSvg(id)}</button>`).join('')}</div><input class="input" data-note="${e.id}" name="kkNote" maxlength="90" placeholder="Bir not (isteğe bağlı)"></div>` : ''}
      ${own && over(e) && !res ? `<div class="kk-res"><p class="small"><b>Nasıl geçti?</b></p><div class="kk-moods">${MOODS.map(([id, n, c]) => `<button type="button" class="chip" style="--c:${c}" data-mood="${id}" data-exam="${e.id}">${K.esc(n)}</button>`).join('')}</div></div>` : ''}
      ${mood ? `<p class="kk-mood" style="--c:${mood[2]}">${K.esc(mood[1])}${res.data.note ? ` · <span class="hand">${K.esc(res.data.note)}</span>` : ''}</p>` : ''}
      ${own && d === 0 && mine() === 'her' && K.voice && K.voice.has('sinav') ? K.voice.btn('sinav', 'Sesimle başarılar') : ''}
    </article>`;
  }
  function render() {
    if (!root) return;
    const col = (w) => {
      const list = exams(w);
      const up = list.filter((e) => daysTo(e) >= -3);
      const old = list.length - up.length;
      return `<section class="kk-col ${w}"><h3>${K.esc(K.ek(nameOf(w), 'in'))} sınavları</h3>
        ${up.length ? up.map(examCard).join('') : `<p class="muted small">${w === mine() ? 'Henüz sınav eklemedin.' : 'Henüz sınav eklenmedi.'}</p>`}
        ${old ? `<p class="muted small">${old} geçmiş sınav</p>` : ''}
        ${w === mine() ? `<form class="kk-add" data-add autocomplete="off"><p class="card-eyebrow">Sınav ekle</p><input class="input" name="kkName" maxlength="60" placeholder="Ders (ör. Phonetics)" required><div class="kk-row"><input class="input" type="date" name="kkDate" required aria-label="Tarih"><input class="input" type="time" name="kkTime" aria-label="Saat (isteğe bağlı)"></div><button class="btn red small" type="submit">${A.ui('plus')} Ekle</button></form>` : ''}
      </section>`;
    };
    K.$('#kkCols', root).innerHTML = col(mine()) + col(other());
  }

  /* ---------- Ana salon kartları ---------- */
  function hooks() {
    const out = [];
    exams(mine()).forEach((e) => {
      const d = daysTo(e);
      const cs = charmsFor(e).filter((c) => c.who !== mine());
      if (d === 0) out.push({ icon: 'cap', title: `Bugün ${e.data.name} sınavın var`, text: `${cs.length ? `${nameOf(other())} sana ${cs.map((c) => charmName(c.data.charm).toLocaleLowerCase('tr-TR')).join(', ')} gönderdi. ` : ''}${mine() === 'her' ? 'Salona girmeden Sınav Kalkanı\'nda sesimi dinle. Sen bunu biliyorsun.' : 'Başarılar!'}`, room: 'kalkan', big: true });
      if (d === 1) out.push({ icon: 'moon', title: `Yarın ${e.data.name} sınavın var`, text: 'Bu gece erken uyu. Gece Lambası\'nda istersen sesimle uyu.', room: mine() === 'her' ? 'gece' : 'kalkan' });
    });
    exams(other()).forEach((e) => {
      const d = daysTo(e);
      const sent = charmsFor(e).some((c) => c.who === mine());
      if (d === 0) out.push({ icon: 'cap', title: `Bugün ${K.ek(nameOf(other()), 'in')} ${e.data.name} sınavı var`, text: sent ? 'Tılsımın yanında. Sınav bitince nasıl geçtiğini sor.' : 'Ona bir şans tılsımı gönder; sınava girmeden görsün.', room: 'kalkan' });
    });
    return out;
  }
  K.specialHooks = (K.specialHooks || []).concat(hooks);

  /* ---------- Eylemler ---------- */
  async function addExam(form) {
    const f = new FormData(form);
    const name = String(f.get('kkName') || '').trim();
    const date = String(f.get('kkDate') || '');
    const time = String(f.get('kkTime') || '');
    if (!name || !date) return;
    if (date < T.todayKey()) return K.fx.toast('Geçmiş bir tarih seçtin.');
    const r = await K.cloud.add('exam', { name, date, time });
    if (!r) return K.fx.toast('Eklenemedi. İnterneti kontrol et.');
    K.audio.sfx.pop();
    if (!K.isOwner()) K.notify(`${C.herName} sınav tarihi ekledi`, `${name}: ${T.fmt(date)}${time ? ' ' + time : ''}`, ['books']);
    render();
  }
  async function sendCharm(examId, charm) {
    const e = rows.find((x) => x.id === examId);
    if (!e) return;
    const inp = K.$(`[data-note="${examId}"]`, root);
    const note = inp ? inp.value.trim() : '';
    const r = await K.cloud.add('luck', { exam: examId, charm, note });
    if (!r) return K.fx.toast('Gönderilemedi.');
    K.fx.confetti({ count: 60, shapes: ['star', 'heart'] });
    K.stickers.award('kalkan');
    K.fx.toast(`${charmName(charm)} yola çıktı.`, { icon: A.icon('star') });
    if (!K.isOwner()) K.notify(`${C.herName} sana ${charmName(charm).toLocaleLowerCase('tr-TR')} gönderdi`, `${e.data.name} sınavın için${note ? `: ${note}` : ''}`, ['four_leaf_clover']);
    render();
  }
  async function setMood(examId, mood) {
    const e = rows.find((x) => x.id === examId);
    const r = await K.cloud.add('examres', { exam: examId, mood });
    if (!r) return;
    if (mood === 'iyi') K.fx.confetti({ count: 120, shapes: ['star'] });
    if (!K.isOwner()) K.notify(`${C.herName}: ${e ? e.data.name : 'sınav'} ${MOODS.find((m) => m[0] === mood)[1].toLocaleLowerCase('tr-TR')}`, 'Sınav Kalkanı', ['books']);
    render();
  }

  const KINDS = ['exam', 'luck', 'examres'];
  K.on('cloud', async (on) => {
    if (!on) return;
    const got = await Promise.all(KINDS.map((k) => K.cloud.list(k, 500)));
    rows = got.flat().sort((a, b) => a.at - b.at);
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
    // Günde bir kez: öbürünün yarın/bugün sınavı varsa haber ver
    const key = 'kkSeen-' + T.todayKey();
    if (!K.store.get(key)) {
      const soon = exams(other()).filter((e) => daysTo(e) === 0 || daysTo(e) === 1);
      if (soon.length) {
        K.store.set(key, true);
        const e = soon[0];
        setTimeout(() => K.fx.toast(`<b>${K.esc(K.ek(nameOf(other()), 'in'))} ${daysTo(e) ? 'yarın' : 'bugün'} ${K.esc(e.data.name)} sınavı var.</b> Sınav Kalkanı'ndan bir tılsım gönder.`, { icon: A.icon('cap'), duration: 8000 }), 3000);
      }
    }
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine()) {
          const e = rows.find((x) => x.id === r.data.exam);
          if (k === 'exam') K.fx.toast(`<b>${K.esc(nameOf(r.who))} sınav ekledi:</b> ${K.esc(r.data.name)}, ${K.esc(T.fmtShort(r.data.date))}`, { icon: A.icon('cap'), duration: 6000 });
          if (k === 'luck') K.fx.toast(`<b>${K.esc(nameOf(r.who))} sana ${K.esc(charmName(r.data.charm).toLocaleLowerCase('tr-TR'))} gönderdi</b>${e ? ` (${K.esc(e.data.name)})` : ''}`, { icon: A.icon('star'), duration: 7000 });
          if (k === 'examres') K.fx.toast(`<b>${K.esc(nameOf(r.who))}:</b> ${e ? K.esc(e.data.name) + ' ' : ''}${K.esc(MOODS.find((m) => m[0] === r.data.mood)[1].toLocaleLowerCase('tr-TR'))}`, { icon: A.icon('cap'), duration: 7000 });
        }
        if (K.activeRoom === 'kalkan') render();
        if (!K.activeRoom && K.renderSpecials) K.renderSpecials();
        if (k === 'exam') K.emit('nezaman');
      })
    );
    K.cloud.on('deleted', ({ id }) => {
      if (!rows.some((r) => r.id === id)) return;
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'kalkan') render();
    });
  });
  // Ne Zaman? takvimi için: sınav günleri (kesikli çizgi)
  K.kalkan = { ranges: () => exams().map((e) => [e.data.date, e.data.date, `${nameOf(e.who)}: ${e.data.name} sınavı${e.data.time ? ' ' + e.data.time : ''}`, e.who, 'busy']) };

  K.room({
    id: 'kalkan',
    wing: 'kalp',
    title: 'Sınav Kalkanı',
    sub: 'Sınav tarihleri, şans tılsımları, başarılar',
    icon: 'cap',
    color: '#E3F0FF',
    hidden: () => !D.kalkan || !K.cloud || !K.cloud.enabled,
    badge: () => {
      const all = exams().filter((e) => daysTo(e) >= 0);
      if (!all.length) return '';
      const n = daysTo(all[0]);
      return n === 0 ? 'Bugün sınav' : n === 1 ? 'Yarın sınav' : `${n} gün`;
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(KK().intro)}</div><div class="kk-cols" id="kkCols"></div>`;
      el.addEventListener('submit', (e) => {
        const f = e.target.closest('[data-add]');
        if (!f) return;
        e.preventDefault();
        addExam(f);
      });
      el.addEventListener('click', async (e) => {
        const c = e.target.closest('[data-charm]');
        if (c) return sendCharm(c.dataset.exam, c.dataset.charm);
        const m = e.target.closest('[data-mood]');
        if (m) return setMood(m.dataset.exam, m.dataset.mood);
        const d = e.target.closest('[data-del]');
        if (d) {
          if (d.dataset.armed !== '1') {
            d.dataset.armed = '1';
            d.classList.add('armed');
            return;
          }
          await K.cloud.remove(d.dataset.del);
          render();
        }
      });
    },
    enter() {
      render();
    },
  });
})();
