/* Oda: Yıl Dönümü Sözleri — her ilişki yılı için birbirimize üç söz veririz. Sözler o yıl boyunca mühürlü kalır,
   bir sonraki yıl dönümünde (sevgili olduğumuz günün yıl dönümü) "Tuttun mu?" kartlarıyla açılır: herkes öbürünün
   sözlerini işaretler; tutulan sözlere altın iplik işlenir.
   Kayıtlar: yilsoz {yil, i, text} (aynı yıl ve sıranın son kaydı geçerli) · yilsoztut {ref, tuttu} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], tut = [], root = null;
  const bas = () => C.togetherDate || T.todayKey();
  const yilKey = (n) => `${+bas().slice(0, 4) + n}${bas().slice(4)}`;
  // Şu an kaçıncı yıldayız (1'den başlar) ve açılış günleri
  function simdikiYil() {
    let n = 0;
    while (yilKey(n + 1) <= T.todayKey()) n++;
    return n + 1;
  }
  const acilis = (yil) => yilKey(yil);
  const sozler = (yil, w) => [0, 1, 2].map((i) => rows.filter((r) => r.data.yil === yil && r.data.i === i && r.who === w).sort((a, b) => b.at - a.at)[0]);
  const tutOf = (ref) => tut.filter((r) => r.data.ref === ref).sort((a, b) => b.at - a.at)[0];
  function render() {
    if (!root || K.activeRoom !== 'yilsoz') return;
    const y = simdikiYil();
    const benim = sozler(y, mine());
    K.$('#ysBu', root).innerHTML = `<p class="card-eyebrow">${y}. yılımız için sözlerin · ${K.esc(T.fmt(acilis(y), true))} günü açılacak</p>
      ${benim.map((r, i) => `<div class="ys-soz"><span>${i + 1}</span><input class="input" data-ys-i="${i}" maxlength="140" value="${K.esc(r ? r.data.text : '')}" placeholder="${['Sana söz veriyorum ki...', 'Bu yıl...', 'Her zaman...'][i]}"></div>`).join('')}
      <div class="row"><button type="button" class="btn red small" data-ys-kaydet>🔏 Sözlerimi mühürle</button></div>
      <p class="muted small">${sozler(y, other()).filter(Boolean).length ? `${K.esc(nameOf(other()))} da bu yıl için ${sozler(y, other()).filter(Boolean).length} söz mühürledi.` : `${K.esc(nameOf(other()))} henüz yazmadı.`} Sözler açılana kadar öbürü göremez.</p>`;
    const gecmis = [];
    for (let k = y - 1; k >= 1; k--) gecmis.push(k);
    K.$('#ysGecmis', root).innerHTML = gecmis.length
      ? gecmis
          .map((k) => {
            const kart = (w) =>
              sozler(k, w)
                .filter(Boolean)
                .map((r) => {
                  const t = tutOf(r.id);
                  const ben = w === other();
                  return `<div class="ys-kart ${t ? (t.data.tuttu ? 'tuttu' : 'tutmadi') : ''}"><p>${K.esc(r.data.text)}</p>${ben && !t ? `<div class="row"><button type="button" class="btn soft small" data-ys-tut="${r.id}" data-v="1">Tuttu 💛</button><button type="button" class="btn ghost small" data-ys-tut="${r.id}" data-v="0">Henüz değil</button></div>` : t ? `<small>${t.data.tuttu ? '✨ Tuttu' : 'Henüz değil'}</small>` : '<small>bekliyor</small>'}</div>`;
                })
                .join('') || '<p class="muted small">Söz yok.</p>';
            return `<section class="card"><p class="card-eyebrow">${k}. yıl · açıldı</p><div class="ys-iki"><div><b>${K.esc(nameOf(other()))}</b>${kart(other())}</div><div><b>${K.esc(nameOf(mine()))}</b>${kart(mine())}</div></div></section>`;
          })
          .join('')
      : `<p class="muted center small">İlk sözler ${K.esc(T.fmt(acilis(1), true))} günü açılacak.</p>`;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, tut] = await Promise.all([K.cloud.list('yilsoz', 300), K.cloud.list('yilsoztut', 300)]);
    K.cloud.on('yilsoz', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.on('yilsoztut', (r) => tut.some((x) => x.id === r.id) || (tut.push(r), render()));
  });
  K.room({
    id: 'yilsoz',
    wing: 'zaman',
    title: 'Yıl Dönümü Sözleri',
    sub: 'Her yıl üç söz',
    icon: 'letter',
    color: '#FFF1D6',
    hidden: () => !K.cloud || !K.cloud.enabled || !C.togetherDate,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Her yılımız için birbirimize üç söz veriyoruz. Sözler bir yıl mühürlü kalır; yıl dönümünde "Tuttun mu?" kartlarıyla açılır. Tutulan sözlere altın iplik işlenir.</p></div>
        <section class="card" id="ysBu"></section><div id="ysGecmis"></div>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-ys-kaydet]')) {
          const y = simdikiYil();
          let n = 0;
          for (const inp of K.$$('[data-ys-i]', root)) {
            const i = +inp.dataset.ysI, text = inp.value.trim();
            const old = sozler(y, mine())[i];
            if (!text || (old && old.data.text === text)) continue;
            const r = await K.cloud.add('yilsoz', { yil: y, i, text });
            r && !rows.some((x) => x.id === r.id) && rows.push(r);
            n++;
          }
          if (!n) return;
          K.stickers.award('yilsoz');
          K.ping(`🔏 ${K.meName()} ${y}. yılınız için sözlerini mühürledi`, `${T.fmt(acilis(y), true)} günü açılacak.`, ['scroll'], { click: K.roomUrl('yilsoz') });
          K.fx.toast('🔏 Sözlerin mühürlendi.', { duration: 2200 });
          return render();
        }
        const t = e.target.closest('[data-ys-tut]');
        if (t) {
          const r = await K.cloud.add('yilsoztut', { ref: t.dataset.ysTut, tuttu: t.dataset.v === '1' });
          r && !tut.some((x) => x.id === r.id) && tut.push(r);
          if (t.dataset.v === '1') K.fx.confetti({ count: 60, shapes: ['star'] }), K.stickers.award('yilsoztuttu');
          render();
        }
      });
    },
    enter() {
      render();
    },
  });
  K.yilsoz = { simdikiYil, acilis };
})();
