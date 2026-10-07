/* Oda: Boş Çerçeveler — henüz yaşanmamış anlar için duvarda boş çerçeveler: "İlk birlikte kahvaltı", "Vapurda ilk
   çay"... İkimiz de yeni çerçeve asabiliriz. O an yaşanınca fotoğrafı çerçeveye koyarız; altına tarihi düşer, boş
   duvar zamanla dolar. Dolu çerçeveler Kale Müzesi'ne ve Kalp Mozaiği'ne de girer.
   Kayıtlar: cerceve {title} · cercevefoto {key, thumb, full, day, note} + cerceveimg {img} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const VARSAYILAN = () =>
    (D.cerceveler && D.cerceveler.length && D.cerceveler) || [
      'Havaalanında ilk sarılma', 'İlk birlikte kahvaltı', 'Vapurda ilk çay', 'Bakü bulvarında ilk yürüyüş', 'Kız Kulesi\'ne karşı ilk akşam', 'Qız Qalası\'nın tepesinde',
      'İlk birlikte yağmur', 'İlk birlikte kar', 'İlk birlikte pişirdiğimiz yemek', 'İlk dansımız', 'Aynı şehirde ilk 21\'imiz', 'İlk birlikte gün batımı',
    ];
  let cer = [], foto = [], root = null, hedef = null;
  const liste = () => VARSAYILAN().map((t, i) => ({ key: 'd' + i, title: t, by: null })).concat(cer.map((r) => ({ key: r.id, title: r.data.title, by: r.who })));
  const fotoOf = (key) => foto.filter((r) => r.data.key === key).sort((a, b) => b.at - a.at)[0];
  function render() {
    if (!root || K.activeRoom !== 'cerceveler') return;
    const l = liste();
    const dolu = l.filter((c) => fotoOf(c.key)).length;
    K.$('#cfUst', root).innerHTML = `<b>${dolu}</b><span>/ ${l.length} çerçeve doldu</span><i style="--p:${l.length ? dolu / l.length : 0}"></i>`;
    K.$('#cfDuvar', root).innerHTML = l
      .map((c) => {
        const f = fotoOf(c.key);
        const tilt = ((K.hash(c.key) % 5) - 2) * 0.8;
        return `<figure class="cf-cerceve ${f ? 'dolu' : 'bos'}" style="--tilt:${tilt}deg"><button type="button" class="cf-ic" data-cf="${K.esc(c.key)}">${f ? `<img src="${f.data.thumb}" alt="">` : `<span class="cf-bos">${A.icon('frame')}<small>henüz</small></span>`}</button>
          <figcaption><b>${K.esc(c.title)}</b><small>${f ? `${K.esc(T.fmt(f.data.day))}${f.data.note ? ` · ${K.esc(f.data.note)}` : ''}` : c.by ? `${K.esc(nameOf(c.by))} astı` : 'bekliyor'}</small></figcaption></figure>`;
      })
      .join('');
  }
  async function yukle(file, key, note) {
    const [full, thumb] = await Promise.all([K.medya.image(file, 1400, 0.82), K.medya.thumb(file, 360)]);
    const big = await K.cloud.add('cerceveimg', { img: full });
    if (!big) return K.fx.toast('Fotoğraf yüklenemedi.');
    const r = await K.cloud.add('cercevefoto', { key, thumb, full: big.id, day: T.todayKey(), note: note || '' });
    if (!r) return;
    foto.some((x) => x.id === r.id) || foto.push(r);
    const c = liste().find((x) => x.key === key);
    K.fx.confetti({ count: 120, shapes: ['heart', 'star'] });
    K.stickers.award('cerceve');
    K.ping(`🖼 Bir çerçeve doldu: ${c ? c.title : ''}`, 'Duvardaki boş bir yer artık bir anı.', ['framed_picture'], { click: K.roomUrl('cerceveler') });
    K.arsiv && K.arsiv.clear();
    render();
  }
  function ac(key) {
    const c = liste().find((x) => x.key === key);
    const f = fotoOf(key);
    if (f) {
      const m = K.ui.modal({ label: c.title, cls: 'cf-modal', html: `<img class="cf-buyuk" src="${f.data.thumb}" alt=""><h3>${K.esc(c.title)}</h3><p class="muted">${K.esc(T.fmt(f.data.day))} · ${K.esc(nameOf(f.who))}${f.data.note ? `<br>"${K.esc(f.data.note)}"` : ''}</p>` });
      K.medya.rowUrl(f.data.full, 'img').then((u) => u && K.$('.cf-buyuk', m.el) && (K.$('.cf-buyuk', m.el).src = u));
      return;
    }
    hedef = key;
    const m = K.ui.modal({ label: c.title, cls: 'cf-modal', html: `<p class="card-eyebrow">Boş çerçeve</p><h3>${K.esc(c.title)}</h3><p class="muted">Bu an yaşandıysa fotoğrafını çerçeveye koy.</p><input class="input" id="cfNot" maxlength="80" placeholder="Bir cümle (istersen)"><div class="row"><label class="btn red">📷 Fotoğraf seç<input type="file" accept="image/*" hidden data-cf-dosya></label></div>` });
    m.el.addEventListener('change', async (e) => {
      const f2 = e.target.closest('[data-cf-dosya]');
      if (f2 && f2.files[0]) {
        const note = K.$('#cfNot', m.el).value.trim();
        m.close();
        await yukle(f2.files[0], hedef, note);
      }
    });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [cer, foto] = await Promise.all([K.cloud.list('cerceve', 200), K.cloud.list('cercevefoto', 300)]);
    K.cloud.on('cerceve', (r) => cer.some((x) => x.id === r.id) || (cer.push(r), render()));
    K.cloud.on('cercevefoto', (r) => foto.some((x) => x.id === r.id) || (foto.push(r), render()));
  });
  K.room({
    id: 'cerceveler',
    wing: 'zaman',
    title: 'Boş Çerçeveler',
    sub: 'Henüz yaşanmamış anlar',
    icon: 'frame',
    color: '#F6EBDD',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Duvarda henüz yaşanmamış anlar için boş çerçeveler var. O an gelince fotoğrafını çerçeveye koyarız, altına tarihi düşer. Sen de yeni bir çerçeve asabilirsin.</p></div>
        <div class="cf-ust" id="cfUst"></div><section class="cf-duvar" id="cfDuvar"></section>
        <section class="card"><p class="card-eyebrow">Yeni çerçeve as</p><div class="row"><input class="input" id="cfYeni" maxlength="60" placeholder="Mesela: İlk birlikte sinema"><button type="button" class="btn red small" data-cf-as>As</button></div></section>`;
      el.addEventListener('click', async (e) => {
        const c = e.target.closest('[data-cf]');
        if (c) return ac(c.dataset.cf);
        if (e.target.closest('[data-cf-as]')) {
          const inp = K.$('#cfYeni', root);
          const title = inp.value.trim();
          if (!title) return inp.focus();
          const r = await K.cloud.add('cerceve', { title });
          if (!r) return;
          cer.some((x) => x.id === r.id) || cer.push(r);
          inp.value = '';
          K.ping(`🖼 ${K.meName()} duvara yeni bir boş çerçeve astı`, title, ['framed_picture'], { click: K.roomUrl('cerceveler') });
          render();
        }
      });
    },
    enter() {
      render();
      K.stickers.award('cerceveler');
    },
  });
})();
