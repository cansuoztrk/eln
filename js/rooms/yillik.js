/* Oda: Yıllık Kitabı — bir yılın kalesi tek kitapta, basılı bir hediye olarak. Yıl seçilir (sevgili olduğumuz günden
   itibaren 1. yıl, 2. yıl...); kitap ay ay kurulur: her ayın açılış sayfası ve sayıları, o ayın kareleri (tarih,
   şehir, kimden), kavanozdan notlar, barış sözleri ve minnetler, telesekreter dökümü (kim, ne zaman, kaç saniye).
   Sonunda elle yazılsın diye iki boş "gelecek yıla mektup" sayfası. Kale Kitabı'nın A5 baskı düzenini kullanır:
   Yazdır → PDF olarak kaydet ya da bir kırtasiyede bastır. Yeni kayıt tutmaz. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const cityOf = (w) => (w === 'me' ? C.myCity : C.herCity);
  let root = null, pick = 0;
  const page = (cls, html) => `<section class="kb-page ${cls}">${html}</section>`;
  const addYears = (key, n) => `${+key.slice(0, 4) + n}${key.slice(4)}`;
  function years() {
    const start = C.togetherDate || C.metDate || T.todayKey();
    const out = [];
    for (let i = 0; i < 20; i++) {
      const from = addYears(start, i), to = addYears(start, i + 1);
      if (from > T.todayKey()) break;
      out.push({ n: i + 1, from, to, done: to <= T.todayKey() });
    }
    return out;
  }
  async function build(y) {
    const since = T.at(y.from).getTime(), until = T.at(y.to).getTime();
    const inY = (x) => x.at >= since && x.at < until;
    const [ph, nt, vs, cnt] = await Promise.all([K.arsiv.photos(), K.arsiv.notes(), K.arsiv.voices(), K.arsiv.counts(since, until)]);
    const photos = ph.filter(inY), notes = nt.filter(inY), voices = vs.filter(inY);
    const toc = [];
    const out = [];
    const opener = (title, sub, extra = '') => {
      toc.push(title);
      return page('kb-opener', `<p class="kb-n">${K.pad(toc.length)}</p><h2>${K.esc(title)}</h2>${sub ? `<p class="kb-sub">${K.esc(sub)}</p>` : ''}${extra}<div class="kb-orn">${A.bow('#E3174D')}</div>`);
    };
    const cover = page('kb-cover yk-kapak', `<p class="kb-top">Bizim Yıllığımız · ${y.n}. yıl</p><div class="kb-kitty">${A.kitty({ crown: true, eyes: 'heart' })}</div><h1>${K.esc(C.herPet)} & ${K.esc(C.myPet)}</h1><p class="kb-for">${K.esc(C.myCity)} – ${K.esc(C.herCity)}</p><p class="kb-date">${T.fmt(y.from)} – ${T.fmt(y.to)}</p>`);
    const stat = (n, l) => (n ? `<div><b>${K.num(n)}</b><span>${K.esc(l)}</span></div>` : '');
    out.push(opener('Yılın sayıları', `${T.fmt(y.from)} – ${T.fmt(y.to)}`, `<div class="yk-sayilar">${stat(cnt.kalpk || 0, 'kalp kavanoza düştü')}${stat((cnt.kucak || 0) + (cnt.selam || 0), 'uzaktan sarılma')}${stat(cnt.tsmesaj || 0, 'sesli mesaj')}${stat(photos.length, 'kare')}${stat(cnt.minnet || 0, 'minnet')}${stat(cnt.barissoz || 0, 'barış sözü')}</div>`));
    const months = [...new Set([...photos, ...notes, ...voices].map((x) => T.key(T.baku(new Date(x.at))).slice(0, 7)))].sort();
    for (const ym of months) {
      const inM = (x) => T.key(T.baku(new Date(x.at))).slice(0, 7) === ym;
      const mp = photos.filter(inM), mn = notes.filter(inM), mv = voices.filter(inM);
      out.push(opener(K.arsiv.monthName(ym), `${mp.length} kare · ${mn.filter((n) => n.kind === 'kalpk').length} not · ${mv.length} ses`));
      for (let i = 0; i < mp.length; i += 6)
        out.push(page('yk-foto', `<p class="kb-kicker">${K.esc(K.arsiv.monthName(ym))} · kareler</p><div class="yk-ph6">${mp.slice(i, i + 6).map((p) => `<figure><img src="${p.thumb}" alt=""><figcaption>${K.esc(T.fmtShort ? T.fmtShort(p.day) : T.fmt(p.day))} · ${K.esc(cityOf(p.who))}${p.text ? `<br><i>${K.esc(p.text.slice(0, 60))}</i>` : ''}</figcaption></figure>`).join('')}</div>`));
      const jar = mn.filter((n) => n.kind === 'kalpk');
      for (let i = 0; i < jar.length; i += 12)
        out.push(page('yk-not', `<p class="kb-kicker">${K.esc(K.arsiv.monthName(ym))} · kavanozdan</p>${jar.slice(i, i + 12).map((n) => `<p class="hand yk-${n.who}">"${K.esc(n.text)}" <small>— ${K.esc(nameOf(n.who))}</small></p>`).join('')}`));
      const words = mn.filter((n) => n.kind !== 'kalpk');
      for (let i = 0; i < words.length; i += 8)
        out.push(page('yk-soz', `<p class="kb-kicker">${K.esc(K.arsiv.monthName(ym))} · sözler, minnetler</p>${words.slice(i, i + 8).map((n) => `<blockquote><p>${K.esc(n.text)}</p><cite>${K.esc(n.label)} · ${K.esc(nameOf(n.who))} · ${K.esc(T.fmt(n.day))}</cite></blockquote>`).join('')}`));
      if (mv.length)
        out.push(page('yk-ses', `<p class="kb-kicker">${K.esc(K.arsiv.monthName(ym))} · telesekreter dökümü</p><table><tbody>${mv.map((v) => `<tr><td>${K.esc(T.fmt(T.key(T.baku(new Date(v.at)))))}</td><td>${K.esc(nameOf(v.who))}</td><td>${Math.round(v.dur)} sn</td><td>${K.esc(v.tag === 'sadece' ? '' : v.tag || '')}</td></tr>`).join('')}</tbody></table><p class="kb-sub">Seslerin kendisi kalede; bu sayfa onların izi.</p>`));
    }
    out.push(opener('Gelecek yıla mektup', 'Bu iki sayfayı kalemle doldurun'));
    ['me', 'her'].forEach((w) => out.push(page('yk-mektup', `<p class="kb-kicker">${K.esc(nameOf(w))} yazıyor · ${y.n + 1}. yılımıza</p><div class="yk-cizgi"></div><p class="kb-sub">${K.esc(cityOf(w))}, ...... / ...... / ............</p>`)));
    out.push(page('kb-back', `<div class="kb-kitty">${A.kitty({ cls: 'is-wink' })}</div><p class="hand">${y.n + 1}. yıl başlıyor...</p><p class="kb-sub">Her gün bir sayfa daha yazıyoruz.</p>`));
    const tocHtml = toc.map((t, i) => `<li><span>${K.pad(i + 1)}</span>${K.esc(t)}</li>`).join('');
    return [cover, page('kb-toc', `<h2>İçindekiler</h2><ol>${tocHtml}</ol><p class="kb-ded hand">Bir yıl, iki şehir, tek bir kale.</p>`)].concat(out).join('');
  }
  async function open(btn) {
    const y = years()[pick];
    if (!y) return;
    btn.disabled = true;
    btn.textContent = 'Kitap hazırlanıyor...';
    const kb = K.el(`<div class="kb yk" role="dialog" aria-modal="true" aria-label="Yıllık Kitabı">
      <div class="kb-bar"><button class="btn red small" id="ykPrint" disabled>${A.ui('download')} Yazdır / PDF</button><span class="kb-hint">Telefonda: Yazdır → PDF olarak kaydet. Kâğıt boyutu A5.</span><button class="btn ghost small" id="ykClose">Kapat</button></div>
      <div class="kb-pages">${await build(y)}</div></div>`);
    document.body.appendChild(kb);
    document.body.classList.add('has-book');
    const imgs = K.$$('img', kb);
    await Promise.all(imgs.map((img) => new Promise((res) => (img.complete && img.naturalWidth ? res() : ((img.onload = res), (img.onerror = res), setTimeout(res, 8000))))));
    K.$('#ykPrint', kb).disabled = false;
    btn.disabled = false;
    btn.innerHTML = `${A.icon('book')} Yıllığı hazırla`;
    K.$('#ykPrint', kb).addEventListener('click', () => {
      document.body.classList.add('printing-book');
      K.stickers.award('yillik');
      setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('printing-book'), 500);
      }, 100);
    });
    K.$('#ykClose', kb).addEventListener('click', () => {
      kb.remove();
      document.body.classList.remove('has-book', 'printing-book');
    });
    K.audio.sfx.paper && K.audio.sfx.paper();
  }
  function render() {
    if (!root || K.activeRoom !== 'yillik') return;
    const ys = years();
    pick = Math.min(pick, Math.max(0, ys.length - 1));
    K.$('#ykYil', root).innerHTML = ys.length
      ? ys.map((y, i) => `<button type="button" class="yk-yil ${i === pick ? 'on' : ''}" data-yk="${i}"><b>${y.n}. yıl</b><small>${K.esc(T.fmt(y.from))} – ${K.esc(T.fmt(y.to))}</small><span>${y.done ? 'Tamamlandı' : `${K.num(T.daysUntil(y.to))} gün kaldı`}</span></button>`).join('')
      : '<p class="muted">Henüz bir yıl başlamadı.</p>';
  }
  K.room({
    id: 'yillik',
    wing: 'anilar',
    title: 'Yıllık Kitabı',
    sub: 'Bir yıl, basılı bir kitap',
    icon: 'book',
    color: '#FFF0E0',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bir yılın kalesi tek kitapta: ay ay kareler, kavanoz notları, barış sözleri, minnetler ve telesekreter dökümü. Sonunda elle yazmanız için iki boş "gelecek yıla mektup" sayfası var. Yazdır'dan PDF olarak kaydet ya da bir kırtasiyede A5 bastır.</p></div>
        <div class="yk-yillar" id="ykYil"></div><div class="row center"><button type="button" class="btn red big" data-yk-ac>${A.icon('book')} Yıllığı hazırla</button></div>
        <p class="muted small center">Yıl bitmeden de hazırlanabilir; kitap o güne kadarki sayfaları içerir.</p>`;
      el.addEventListener('click', (e) => {
        const y = e.target.closest('[data-yk]');
        if (y) return (pick = +y.dataset.yk), render();
        const b = e.target.closest('[data-yk-ac]');
        b && open(b);
      });
    },
    enter() {
      pick = Math.max(0, years().length - 1);
      render();
    },
  });
})();
