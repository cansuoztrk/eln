/* Oda: On Yıl Sonra — birlikte olduğumuz günün onuncu yıldönümünde açılacak ortak kapsül. İkimiz de istediğimiz
   kadar yazarız; o güne kadar kimse okuyamaz, kendi yazdığını bile. Görünen yalnızca zarfların sayısı ve tarihleri.
   Her yıldönümünde ana salonda "bu yıl bir cümle" kartı belirir. Kayıt: onyil {text, q} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const OY = () => D.onyil || { intro: [], prompts: [], placeholder: '' };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const openKey = () => `${+C.togetherDate.slice(0, 4) + 10}${C.togetherDate.slice(4)}`;
  const isOpen = () => T.daysUntil(openKey()) <= 0;
  let rows = [], loaded = false, root = null, q = '';
  const thisYear = (w) => rows.some((r) => r.who === w && T.baku(new Date(r.at)).y === T.baku().y);

  function countdown() {
    const ms = T.at(openKey()).getTime() - T.now().getTime();
    const days = Math.max(0, Math.ceil(ms / 864e5));
    const y = Math.floor(days / 365.2425);
    return { days, y, d: Math.round(days - y * 365.2425) };
  }
  function render() {
    if (!root || K.activeRoom !== 'onyil') return;
    const cd = countdown();
    const mineN = rows.filter((r) => r.who === 'me').length, herN = rows.filter((r) => r.who === 'her').length;
    K.$('#oyCap', root).innerHTML = `<div class="oy-capsule ${isOpen() ? 'open' : ''}" aria-hidden="true"><span class="oy-lid"></span><span class="oy-body">${rows
      .slice(-14)
      .map((r, i) => `<i class="${r.who}" style="--i:${i}"></i>`)
      .join('')}</span></div>
      <div class="oy-count">${isOpen() ? `<b>Açıldı</b><small>${K.esc(T.fmt(openKey()))}</small>` : `<b>${cd.y ? `${cd.y} yıl ` : ''}${K.num(cd.d)} gün</b><small>${K.esc(T.fmt(openKey()))} tarihinde açılacak</small>`}</div>
      <div class="oy-who"><span>💌 ${K.esc(C.herPet)}: <b>${herN}</b></span><span>💌 ${K.esc(C.myPet)}: <b>${mineN}</b></span></div>`;
    if (isOpen()) {
      K.$('#oyForm', root).hidden = true;
      K.$('#oyList', root).innerHTML = rows
        .slice()
        .sort((a, b) => a.at - b.at)
        .map((r) => `<article class="br-paper open oy-letter ${r.who}"><p class="card-eyebrow">${K.esc(T.fmt(new Date(r.at)))} · ${K.esc(nameOf(r.who))}</p>${r.data.q ? `<p class="muted small">${K.esc(r.data.q)}</p>` : ''}<p class="hand">${K.esc(r.data.text)}</p></article>`)
        .join('');
      return;
    }
    const my = rows.filter((r) => r.who === mine()).sort((a, b) => b.at - a.at);
    K.$('#oyList', root).innerHTML = my.length
      ? `<p class="card-eyebrow">Senin zarfların</p><div class="oy-envs">${my.map((r) => `<span class="oy-env" title="Mühürlü"><span aria-hidden="true">✉️</span><small>${K.esc(T.fmtShort(new Date(r.at)))} ${T.baku(new Date(r.at)).y}</small></span>`).join('')}</div><p class="muted small">Ne yazdığını sen de göremezsin. On yıl sonra ikiniz birlikte okuyacaksınız.</p>`
      : '';
  }
  async function save() {
    const ta = K.$('#oyText', root);
    const text = ta.value.trim();
    if (!text) return;
    const btn = K.$('#oyForm button[type=submit]', root);
    btn.disabled = true;
    const r = await K.cloud.add('onyil', { text, q });
    btn.disabled = false;
    if (!r) return K.fx.toast('Gönderilemedi.');
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    ta.value = '';
    q = '';
    K.$$('[data-oy-q]', root).forEach((x) => x.classList.remove('on'));
    K.audio.sfx.paper();
    K.stickers.award('onyil');
    K.fx.toast(`✉️ Mühürlendi. ${K.esc(T.fmt(openKey()))} tarihine kadar kimse okuyamaz.`, { duration: 4000 });
    K.ping(`⏳ ${K.meName()} on yıl sonraki size bir zarf bıraktı`, `${T.fmt(openKey())} tarihinde açılacak.`, ['hourglass_flowing_sand'], { click: K.roomUrl('onyil') });
    render();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('onyil', 2000);
    loaded = true;
    K.cloud.on('onyil', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine()) K.fx.toast(`⏳ <b>${K.esc(nameOf(r.who))} kapsüle bir zarf bıraktı.</b> ${K.esc(T.fmt(openKey()))} tarihinde açılacak.`, { duration: 6000 });
      render();
    });
  });
  // Yıldönümü günü: bu yıl yazmadıysan kapsül bir cümle bekler; açılış günü büyük kart
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const p = T.baku();
    const md = `${K.pad(p.mo)}-${K.pad(p.d)}`;
    if (isOpen() && !K.store.get('oyOpened')) return [{ icon: 'hourglass', title: '⏳ On yıl doldu. Kapsül açıldı.', text: `${rows.length} zarf sizi bekliyor.`, run: () => (K.store.set('oyOpened', 1), K.go('onyil')), cta: 'Aç' }];
    if (md === C.togetherDate.slice(5) && !thisYear(mine())) return [{ icon: 'hourglass', title: '⏳ Kapsül bu yıl bir cümle bekliyor', text: 'Yıldönümümüz kutlu olsun. On yıl sonraki bize bir şey yaz.', room: 'onyil', cta: 'Yaz' }];
    return [];
  });

  K.onyil = { count: () => rows.length, openKey, days: () => countdown().days };

  K.room({
    id: 'onyil',
    wing: 'zaman',
    title: 'On Yıl Sonra',
    sub: () => `${T.fmt(openKey())} tarihinde açılacak`,
    icon: 'hourglass',
    color: '#E6E0FF',
    hidden: () => !D.onyil || !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(OY().intro || [])}</div>
        <section class="card oy-head" id="oyCap"></section>
        <form class="card oy-form" id="oyForm" autocomplete="off"><p class="card-eyebrow">Yeni zarf</p>
          <div class="br-chips">${(OY().prompts || []).map((x) => `<button type="button" class="chip" data-oy-q>${K.esc(x)}</button>`).join('')}</div>
          <textarea class="textarea" id="oyText" rows="4" maxlength="2000" placeholder="${K.esc(OY().placeholder || '')}"></textarea>
          <button class="btn red" type="submit">${A.ui('lock')} Mühürle</button></form>
        <section class="oy-list" id="oyList"></section>`;
      el.addEventListener('submit', (e) => {
        if (e.target.id !== 'oyForm') return;
        e.preventDefault();
        save();
      });
      el.addEventListener('click', (e) => {
        const c = e.target.closest('[data-oy-q]');
        if (!c) return;
        q = c.classList.contains('on') ? '' : c.textContent;
        K.$$('[data-oy-q]', el).forEach((x) => x.classList.toggle('on', x === c && Boolean(q)));
        q && K.$('#oyText', el).focus();
      });
    },
    enter() {
      render();
    },
  });
})();
