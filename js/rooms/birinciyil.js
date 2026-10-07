/* Oda: Birinci Yıl Töreni — sevgili olduğumuz günün ilk yıl dönümü (21 Mayıs 2027): bir yılın tamamı tek gecede.
   O güne kadar ikimiz de birbirimize bir "yıl mektubu" yazarız; mektuplar törene kadar mühürlü kalır. Tören günü açılış
   filmi gibi akar: yılın sayıları, yılın en güzel kareleri, kavanozdan cümleler, bir ses ve en sonda iki yıl mektubu.
   Kayıtlar: yilmektup {yil, text} (kişi başına son kayıt geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], root = null;
  const torenGun = () => (C.togetherDate ? `${+C.togetherDate.slice(0, 4) + 1}${C.togetherDate.slice(4)}` : null);
  const geldi = () => Boolean(torenGun() && T.todayKey() >= torenGun());
  const mektup = (w) => rows.filter((r) => r.who === w && r.data.yil === 1).sort((a, b) => b.at - a.at)[0];
  const ETIKET = { kalpk: 'kavanoz kalbi', kucak: 'uzaktan sarılma', tsmesaj: 'sesli mesaj', kare: 'günün karesi', postcard: 'kartpostal', mektup: 'mektup', minnet: 'minnet', selam: 'selam' };
  async function sahneler(prova) {
    const bas = T.at(C.togetherDate).getTime(), bit = T.at(torenGun()).getTime();
    const [ph, nt, vs, cn] = await Promise.all([K.arsiv.photos(), K.arsiv.notes(), K.arsiv.voices(), K.arsiv.counts(bas, bit)]);
    const yil = (x) => x.at >= bas && x.at < bit;
    const p = ph.filter(yil), n = nt.filter(yil), v = vs.filter(yil);
    const sc = [{ t: 'baslik', eyebrow: 'Birinci Yıl', title: 'Bir yılın tamamı', sub: `${T.fmt(C.togetherDate)} – ${T.fmt(torenGun())}` }];
    const items = [[365, 'gün'], ...Object.keys(ETIKET).filter((k) => cn[k]).map((k) => [cn[k], ETIKET[k]])].slice(0, 6);
    sc.push({ t: 'sayi', title: 'Bir yılda', items });
    const secP = p.length <= 8 ? p : Array.from({ length: 8 }, (_, i) => p[Math.floor((i * (p.length - 1)) / 7)]);
    secP.forEach((x) => sc.push({ t: 'foto', src: x.thumb, full: x.full, caption: x.text || x.label, sub: `${T.fmt(x.day)} · ${nameOf(x.who)}` }));
    n.filter((x) => x.text.length > 20 && x.text.length < 180).sort((a, b) => K.hash(a.id) - K.hash(b.id)).slice(0, 3).forEach((x) => sc.push({ t: 'yazi', text: x.text, by: `${nameOf(x.who)} · ${x.label}` }));
    if (v.length) {
      const x = v[K.hash(torenGun()) % v.length];
      sc.push({ t: 'ses', audio: x.audio, by: nameOf(x.who), text: 'Bu yıldan bir ses' });
    }
    ['her', 'me'].forEach((w) => {
      const m = mektup(w);
      if (prova && w !== mine()) return sc.push({ t: 'yazi', text: `(${nameOf(w)} yıl mektubu tören günü burada açılacak.)`, by: nameOf(w) });
      if (m) sc.push({ t: 'yazi', text: m.data.text, by: `${nameOf(w)} · yıl mektubu` });
    });
    sc.push({ t: 'kapanis', text: 'İkinci yıla', sub: 'Aynı şehirde olsun.' });
    return sc;
  }
  async function baslat(prova) {
    if (!K.belgesel || !K.arsiv) return;
    const sc = await sahneler(prova);
    K.belgesel.play(sc, { mood: 'kutlama', label: 'Birinci Yıl Töreni', onEnd: () => (prova ? null : (K.fx.fireworks && K.fx.fireworks(6000), K.stickers.award('birinciyil'))) });
  }
  function render() {
    if (!root || K.activeRoom !== 'birinciyil') return;
    const g = torenGun();
    const kalan = g ? T.daysUntil(g) : 0;
    const ben = mektup(mine()), o = mektup(other());
    K.$('#byUst', root).innerHTML = geldi()
      ? `<p class="by-buyuk">Bir yıl oldu.</p><button type="button" class="btn red" data-by-baslat>🎬 Töreni başlat</button>`
      : `<p class="by-buyuk"><b>${K.num(kalan)}</b> gün</p><p class="muted">${K.esc(T.fmt(g, true))} gecesi</p>${K.isOwner() ? '<button type="button" class="btn ghost small" data-by-prova>Prova (onun mektubu gizli kalır)</button>' : ''}`;
    K.$('#byMektup', root).innerHTML = `<p class="card-eyebrow">${K.esc(nameOf(other()))} için yıl mektubun</p>${geldi() && ben ? `<p class="by-metin">${K.esc(ben.data.text)}</p>` : `<textarea class="textarea" id="byMetin" maxlength="4000" placeholder="Bu yıl bana ne öğrettin, en çok neyi sevdim, ikinci yıldan ne diliyorum...">${ben ? K.esc(ben.data.text) : ''}</textarea><div class="row"><button type="button" class="btn red small" data-by-yaz>🔏 Mühürle</button><span class="muted small">${ben ? 'Mühürlü · törene kadar değiştirebilirsin' : ''}</span></div>`}
      <p class="muted small">${o ? `${K.esc(nameOf(other()))} yıl mektubunu yazdı ve mühürledi.` : `${K.esc(nameOf(other()))} henüz yazmadı.`}</p>`;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('yilmektup', 40);
    K.cloud.on('yilmektup', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!torenGun() || T.todayKey() !== torenGun()) return [];
    return [{ key: 'birinciyil', icon: 'cake', title: '🎬 Bu gece Birinci Yıl Töreni', text: 'Bir yılın tamamı tek gecede: sayılar, kareler ve iki yıl mektubu.', room: 'birinciyil', big: true, cta: 'Töreni aç' }];
  });
  K.room({
    id: 'birinciyil',
    wing: 'zaman',
    title: 'Birinci Yıl Töreni',
    sub: () => (geldi() ? 'Bir yıl oldu' : `${K.num(torenGun() ? T.daysUntil(torenGun()) : 0)} gün kaldı`),
    icon: 'cake',
    color: '#FFE9F1',
    hidden: () => !K.cloud || !K.cloud.enabled || !C.togetherDate,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Sevgili olduğumuz günün ilk yıl dönümünde bir yılın tamamı tek gecede: yılın sayıları, en güzel kareleri ve birbirimize yazdığımız yıl mektupları. Mektuplar törene kadar mühürlü.</p></div>
        <section class="card by-ust center" id="byUst"></section><section class="card" id="byMektup"></section>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-by-baslat]')) return baslat(false);
        if (e.target.closest('[data-by-prova]')) return baslat(true);
        if (!e.target.closest('[data-by-yaz]')) return;
        const text = K.$('#byMetin', root).value.trim();
        if (!text) return;
        const r = await K.cloud.add('yilmektup', { yil: 1, text });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        K.stickers.award('yilmektup');
        K.ping(`🔏 ${K.meName()} yıl mektubunu mühürledi`, `${T.fmt(torenGun(), true)} gecesi açılacak.`, ['scroll'], { click: K.roomUrl('birinciyil') });
        render();
      });
    },
    enter() {
      render();
    },
  });
  K.birinciyil = { torenGun, sahneler, baslat };
})();
