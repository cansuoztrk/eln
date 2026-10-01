/* Oda: Hayal Listesi — artık ikimizin ortak listesi. İkimiz de hayal ekleriz, "ikimiz de istiyoruz" yıldızı veririz,
   gerçekleşince bir notla "Yaptık!" deriz. Bulut yoksa eski hâliyle bu cihazda çalışır; bulut gelince bu cihazdaki
   eski işaretler ve eklenen hayaller bir kez buluta taşınır.
   Kayıtlar: hayal {cat, text} · hayalyap {key, note, day} · hayalyildiz {key} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [], loaded = false, filter = 'all';
  const KINDS = ['hayal', 'hayalyap', 'hayalyildiz'];
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const cloud = () => Boolean(K.cloud && K.cloud.enabled && loaded);
  const localDone = () => K.store.get('bucketDone', {});
  const localCustom = () => K.store.get('bucketCustom', []);
  const CAT_IC = { 0: 'map', 1: 'crown', 2: 'plane', 3: 'heart' };
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const of = (kind) => rows.filter((r) => r.kind === kind);

  function all() {
    const cats = (D.bucket || []).map((c) => ({ cat: c.cat, items: c.items.map((t) => ({ key: c.cat + '|' + t, text: t })) }));
    const add = (cat, item) => {
      let c = cats.find((k) => k.cat === cat);
      if (!c) cats.push((c = { cat, items: [] }));
      c.items.push(item);
    };
    if (cloud()) of('hayal').sort((a, b) => a.at - b.at).forEach((r) => add(r.data.cat, { key: 'h|' + r.id, text: r.data.text, row: r }));
    else localCustom().forEach((x) => add(x.cat, { key: 'c|' + x.id, text: x.text, custom: x.id }));
    return cats;
  }
  // Gerçekleşti mi: bulutta hayalyap kaydı, yoksa bu cihazdaki işaret
  const doneRow = (key) => of('hayalyap').filter((r) => r.data.key === key).sort((a, b) => a.at - b.at)[0];
  const isDone = (key) => (cloud() ? Boolean(doneRow(key)) : Boolean(localDone()[key]));
  const stars = (key) => of('hayalyildiz').filter((r) => r.data.key === key);
  const starred = (key, w) => stars(key).some((r) => r.who === w);
  const both = (key) => starred(key, 'me') && starred(key, 'her');

  function progress() {
    const items = all().flatMap((c) => c.items);
    return { done: items.filter((i) => isDone(i.key)).length, total: items.length, stars: items.filter((i) => both(i.key)).length };
  }

  function itemHtml(i) {
    const d = isDone(i.key);
    const dr = cloud() && doneRow(i.key);
    const day = dr ? dr.data.day : localDone()[i.key];
    const me = starred(i.key, mine()), ot = starred(i.key, other());
    const own = i.row ? i.row.who === mine() : Boolean(i.custom);
    return `<li class="bk-item ${d ? 'done' : ''} ${me && ot ? 'both' : ''}" data-k="${K.esc(i.key)}">
      <button type="button" class="bk-check" data-bk-done aria-pressed="${d}" aria-label="${K.esc(K.fill(i.text))}">${A.ui('heart')}</button>
      <span class="bk-text">${K.esc(K.fill(i.text))}${i.row ? `<small>${K.esc(nameOf(i.row.who))} ekledi</small>` : ''}${d ? `<small>✓ ${day ? K.esc(T.fmt(day)) : 'Yaptık'}${dr && dr.data.note ? ` · “${K.esc(dr.data.note)}”` : ''}</small>` : ''}</span>
      ${cloud() && !d ? `<button type="button" class="bk-star ${me ? 'me' : ''} ${ot ? 'ot' : ''}" data-bk-star aria-pressed="${me}" aria-label="İkimiz de istiyoruz yıldızı" title="${ot ? `${K.esc(nameOf(other()))} yıldız verdi` : 'Yıldız ver'}"><span aria-hidden="true">${me && ot ? '🌟' : me || ot ? '⭐' : '☆'}</span></button>` : ''}
      ${own && !d ? `<button type="button" class="bk-del" data-bk-del aria-label="Sil">${A.ui('close')}</button>` : ''}
    </li>`;
  }
  function render() {
    if (!root) return;
    const cats = all();
    const p = progress();
    const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    K.$('#bkProg', root).innerHTML = `<div class="bk-ring" style="--p:${pct}"><span>%${pct}</span></div>
      <div><h3>Hayallerimizin ${p.done} tanesi gerçekleşti</h3><p class="muted">${p.total - p.done} hayal daha bizi bekliyor.${cloud() ? ` ${p.stars} tanesine ikimiz de yıldız verdik.` : ''} Acelemiz yok, ömrümüz var.</p></div>`;
    const F = [['all', 'Hepsi'], ['both', '🌟 İkimiz de istiyoruz'], ['todo', 'Bekleyenler'], ['done', '✓ Gerçekleşenler']];
    K.$('#bkFilter', root).innerHTML = cloud() ? F.map(([v, l]) => `<button type="button" class="chip ${filter === v ? 'on' : ''}" data-bk-f="${v}">${l}</button>`).join('') : '';
    const keep = (i) => filter === 'all' || (filter === 'both' && both(i.key)) || (filter === 'todo' && !isDone(i.key)) || (filter === 'done' && isDone(i.key));
    K.$('#bkList', root).innerHTML =
      cats
        .map((c, ci) => {
          const list = c.items.filter(keep);
          return list.length ? `<div class="card bk-cat"><h3 class="bk-h">${A.icon(CAT_IC[ci] || 'star')}${K.esc(c.cat)}</h3><ul>${list.map(itemHtml).join('')}</ul></div>` : '';
        })
        .join('') || '<p class="muted">Bu süzgeçte hayal yok.</p>';
    const sel = K.$('#bkCat', root);
    const cur = sel.value;
    sel.innerHTML = cats.map((c) => `<option>${K.esc(c.cat)}</option>`).join('');
    if (cur) sel.value = cur;
  }

  // "Yaptık!" penceresi: tarih bugünden, bir satır not
  function doneSheet(key, text, btn) {
    const m = K.ui.modal({
      label: 'Yaptık!',
      cls: 'bk-sheet',
      html: `<p class="card-eyebrow">Hayal gerçek oldu</p><h2>${K.esc(K.fill(text))}</h2>
        <input class="input" maxlength="140" placeholder="Bir satır not: nasıldı?"><button type="button" class="btn red" data-bk-yap>🎉 Yaptık!</button>`,
    });
    m.body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-bk-yap]');
      if (!b) return;
      b.disabled = true;
      const r = await K.cloud.add('hayalyap', { key, note: K.$('input', m.body).value.trim(), day: T.todayKey() });
      if (!r) return (b.disabled = false), K.fx.toast('Gönderilemedi.');
      push(r);
      m.close();
      celebrate(btn);
      K.stickers.award('hayalyap');
      K.ping(`🎉 Bir hayalimiz gerçek oldu`, `${K.fill(text)}${r.data.note ? `\n“${r.data.note}”` : ''}`, ['tada'], { click: K.roomUrl('hayaller') });
      render();
    });
  }
  function celebrate(btn) {
    const r = btn && btn.isConnected ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    K.fx.confetti({ x: r.left + r.width / 2, y: r.top, count: 50, power: 9 });
    K.audio.sfx.chime();
  }

  // Onun cihazındaki eski işaretleri ve eklediği hayalleri bir kez buluta taşı (liste ona yazılmıştı)
  async function migrate() {
    const flag = 'bucketMig-' + mine();
    if (K.isOwner() || K.store.get(flag)) return;
    K.store.set(flag, Date.now());
    const map = {};
    for (const x of localCustom()) {
      const r = await K.cloud.add('hayal', { cat: x.cat, text: x.text });
      if (r) push(r), (map['c|' + x.id] = 'h|' + r.id);
    }
    for (const [k, day] of Object.entries(localDone())) {
      const key = map[k] || k;
      if (key.startsWith('c|') || doneRow(key)) continue;
      const r = await K.cloud.add('hayalyap', { key, note: '', day: typeof day === 'string' ? day : T.todayKey() });
      push(r);
    }
    render();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(KINDS, { limit: 2000 });
    loaded = true;
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine()) {
          if (k === 'hayal') K.fx.toast(`💭 <b>${K.esc(nameOf(r.who))} yeni bir hayal ekledi:</b> ${K.esc(r.data.text)}`, { duration: 6000 });
          if (k === 'hayalyap') K.fx.toast(`🎉 <b>Bir hayalimiz gerçek oldu!</b> <a href="#hayaller">Bak</a>`, { duration: 6000 });
          if (k === 'hayalyildiz' && starred(r.data.key, mine())) K.fx.toast(`🌟 <b>İkimiz de istiyoruz.</b> ${K.esc(nameOf(r.who))} de yıldız verdi.`, { duration: 5000 });
        }
        render();
      })
    );
    K.cloud.on('deleted', ({ id }) => {
      if (!rows.some((r) => r.id === id)) return;
      rows = rows.filter((r) => r.id !== id);
      render();
    });
    migrate();
    render();
  });
  K.hayal = { progress };

  K.room({
    id: 'hayaller',
    wing: 'hazine',
    title: 'Hayal Listesi',
    sub: () => (cloud() ? 'İkimizin ortak listesi' : 'Birlikte yapacaklarımız'),
    icon: 'list',
    color: '#FFF3C4',
    badge: () => {
      const n = progress().done;
      return n ? `${n} gerçekleşti` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">${K.esc((D.hayal && D.hayal.intro) || 'İstanbul\'da, Bakü\'de ve dünyanın geri kalanında birlikte yapmak istediklerimiz.')}</p>
        <div class="card bk-prog" id="bkProg"></div>
        <div class="br-chips bk-filter" id="bkFilter"></div>
        <div class="bk-list" id="bkList"></div>
        <form class="card bk-add" id="bkAdd" autocomplete="off">
          <p class="card-eyebrow">Yeni hayal</p>
          <div class="bk-add-row">
            <input class="input" id="bkText" name="bkText" placeholder="Birlikte ... yapmak istiyorum" maxlength="90">
            <select class="input" id="bkCat" name="bkCat" aria-label="Kategori"></select>
            <button class="btn" type="submit">${A.ui('plus')} Ekle</button>
          </div>
        </form>`;
      el.addEventListener('click', async (e) => {
        const f = e.target.closest('[data-bk-f]');
        if (f) return (filter = f.dataset.bkF), render();
        const li = e.target.closest('.bk-item');
        if (!li) return;
        const key = li.dataset.k;
        const item = all().flatMap((c) => c.items).find((i) => i.key === key);
        if (!item) return;
        const c = e.target.closest('[data-bk-done]');
        if (c) {
          if (!cloud()) {
            const d = localDone();
            if (d[key]) delete d[key];
            else (d[key] = T.todayKey()), celebrate(c);
            K.store.set('bucketDone', d);
            return render();
          }
          const r = doneRow(key);
          if (!r) return doneSheet(key, item.text, c);
          if (r.who !== mine()) return K.fx.toast(`${K.esc(nameOf(r.who))} işaretledi; geri almayı o yapabilir.`, { duration: 2500 });
          await K.cloud.remove(r.id);
          rows = rows.filter((x) => x.id !== r.id);
          return render();
        }
        if (e.target.closest('[data-bk-star]')) {
          const mineStar = stars(key).find((r) => r.who === mine());
          if (mineStar) {
            await K.cloud.remove(mineStar.id);
            rows = rows.filter((x) => x.id !== mineStar.id);
          } else {
            const r = await K.cloud.add('hayalyildiz', { key });
            push(r);
            K.audio.sfx.sparkle();
            if (both(key)) K.fx.toast('🌟 <b>İkimiz de istiyoruz.</b>', { duration: 2500 });
            else K.ping(`⭐ ${K.meName()} bir hayale yıldız verdi`, `${K.fill(item.text)}\nSen de istiyorsan yıldız ver.`, ['star'], { click: K.roomUrl('hayaller') });
          }
          return render();
        }
        if (e.target.closest('[data-bk-del]')) {
          if (item.row) {
            await K.cloud.remove(item.row.id);
            rows = rows.filter((x) => x.id !== item.row.id);
          } else K.store.set('bucketCustom', localCustom().filter((x) => String(x.id) !== String(item.custom)));
          render();
        }
      });
      K.$('#bkAdd', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        const t = K.$('#bkText', el).value.trim();
        if (!t) return;
        const cat = K.$('#bkCat', el).value;
        if (cloud()) {
          const r = await K.cloud.add('hayal', { cat, text: t });
          if (!r) return K.fx.toast('Gönderilemedi.');
          push(r);
          K.ping(`💭 ${K.meName()} yeni bir hayal ekledi`, `${t}\nİstiyorsan yıldız ver.`, ['thought_balloon'], { click: K.roomUrl('hayaller') });
        } else {
          const list = localCustom();
          list.push({ id: Date.now(), cat, text: t });
          K.store.set('bucketCustom', list);
        }
        K.$('#bkText', el).value = '';
        K.audio.sfx.sparkle();
        K.stickers.award('hayal');
        render();
      });
      render();
    },
    enter() {
      render();
    },
  });
})();
