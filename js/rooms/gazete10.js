/* Oda: Geleceğin Gazetesi — on yıl sonrasının gazetesini birlikte yazarız: manşet, hava durumu, evimizden haberler,
   küçük ilanlar, köşe yazısı, spor. Gazete yazılırken eski bir gazete gibi dizilir; biri "Mühürle" deyince sararır,
   mumla mühürlenir ve tam on yıl sonra aynı gün açılır. O güne kadar kapakta geri sayım durur.
   Kayıtlar: gazete10 {field, text} (her alanın son kaydı geçerli) · gazete10muhur {open} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const ALAN = [
    ['manset', 'Manşet', 'Kocaman bir başlık. On yıl sonra hayatımızdaki en büyük haber ne?', 90],
    ['spot', 'Manşetin altı', 'Haberin ilk cümlesi', 220],
    ['ev', 'Evimizden haberler', 'Hangi şehirde, nasıl bir evde, pencereden ne görünüyor?', 600],
    ['hava', 'Hava durumu', 'O günün havası (iki şehrin değil, tek şehrin)', 140],
    ['kose', 'Köşe yazısı', 'On yıl sonraki sen, bugünkü bize ne yazar?', 900],
    ['ilan', 'Küçük ilanlar', 'Satılık, aranıyor, kayıp... şaka da olur', 400],
    ['spor', 'Spor', 'Mesela: Pamuk koltuğa zıplama rekorunu kırdı', 260],
  ];
  let rows = [], muhur = [], root = null;
  const son = (f) => rows.filter((r) => r.data.field === f).sort((a, b) => b.at - a.at)[0];
  const muhurlu = () => muhur.slice().sort((a, b) => a.at - b.at)[0];
  const tarih10 = (from) => {
    const d = new Date(from);
    return T.key(T.baku(new Date(Date.UTC(d.getUTCFullYear() + 10, d.getUTCMonth(), d.getUTCDate(), 12))));
  };
  function gazete(preview) {
    const t = (f) => (son(f) ? K.esc(son(f).data.text) : `<span class="gz-bos">${K.esc(ALAN.find((a) => a[0] === f)[2])}</span>`);
    const by = (f) => (son(f) ? `<small class="gz-imza">— ${K.esc(nameOf(son(f).who))}</small>` : '');
    const gun = muhurlu() ? T.fmt(muhurlu().data.open, true) : T.fmt(tarih10(Date.now()), true);
    return `<article class="gz10 ${preview ? '' : 'acik'}"><header><small>Sayı 1 · ${K.esc(gun)}</small><h2>Bizim Gazete</h2><small>İstanbul · Bakü · ${K.esc(C.herPet)} & ${K.esc(C.myPet)}</small></header>
      <h3 class="gz-manset">${t('manset')}</h3>${by('manset')}<p class="gz-spot">${t('spot')}</p>
      <div class="gz-sutun"><section><h4>Evimizden haberler</h4><p>${t('ev')}</p>${by('ev')}</section><section><h4>Köşe yazısı</h4><p>${t('kose')}</p>${by('kose')}</section>
      <section><h4>Hava durumu</h4><p>${t('hava')}</p>${by('hava')}</section><section><h4>Küçük ilanlar</h4><p>${t('ilan')}</p>${by('ilan')}</section><section><h4>Spor</h4><p>${t('spor')}</p>${by('spor')}</section></div></article>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'gazete10') return;
    const m = muhurlu();
    const acik = m && T.daysUntil(m.data.open) <= 0;
    if (m && !acik) {
      const g = T.daysUntil(m.data.open);
      K.$('#gzAna', root).innerHTML = `<div class="gz-muhurlu"><div class="gz-kagit">${gazete(true)}</div>${K.muhur ? `<div class="gz-muhur">${K.muhur.svg(m.who, 'gz-mh')}</div>` : ''}<p class="center"><b>${K.num(g)} gün</b> sonra açılacak<br><small class="muted">${K.esc(T.fmt(m.data.open, true))} · ${K.esc(nameOf(m.who))} mühürledi</small></p></div>`;
      K.$('#gzYaz', root).hidden = true;
      return;
    }
    K.$('#gzAna', root).innerHTML = gazete(!acik);
    const yaz = K.$('#gzYaz', root);
    yaz.hidden = Boolean(acik);
    if (acik) return K.stickers.award('gazete10ac');
    yaz.innerHTML = `<p class="card-eyebrow">Gazeteye yaz</p><label class="gz-sec"><span>Alan</span><select class="input" id="gzAlan">${ALAN.map(([id, n]) => `<option value="${id}">${K.esc(n)}${son(id) ? ' ✓' : ''}</option>`).join('')}</select></label>
      <textarea class="textarea" id="gzMetin" maxlength="900" placeholder="${K.esc(ALAN[0][2])}"></textarea><div class="row"><button type="button" class="btn red small" data-gz-yaz>Yaz</button><button type="button" class="btn ghost small" data-gz-muhur ${rows.length >= 3 ? '' : 'disabled'}>🔏 Mühürle (10 yıl)</button></div>
      <p class="muted small">Mühürlenince gazete on yıl açılmaz. İkiniz de yazmayı bitirince mühürleyin.</p>`;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, muhur] = await Promise.all([K.cloud.list('gazete10', 200), K.cloud.list('gazete10muhur', 10)]);
    K.cloud.on('gazete10', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.on('gazete10muhur', (r) => muhur.some((x) => x.id === r.id) || (muhur.push(r), render()));
  });
  K.room({
    id: 'gazete10',
    wing: 'zaman',
    title: 'Geleceğin Gazetesi',
    sub: 'On yıl sonra açılacak',
    icon: 'news',
    color: '#F3EEE3',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>On yıl sonrasının gazetesini birlikte yazıyoruz. Bitince mühürlüyoruz; gazete tam on yıl sonra aynı gün açılacak.</p></div>
        <section id="gzAna"></section><section class="card" id="gzYaz"></section>`;
      el.addEventListener('change', (e) => {
        if (e.target.id !== 'gzAlan') return;
        const a = ALAN.find((x) => x[0] === e.target.value);
        const ta = K.$('#gzMetin', root);
        ta.placeholder = a[2];
        ta.maxLength = a[3];
        ta.value = son(a[0]) ? son(a[0]).data.text : '';
      });
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-gz-yaz]')) {
          const field = K.$('#gzAlan', root).value, text = K.$('#gzMetin', root).value.trim();
          if (!text) return;
          const r = await K.cloud.add('gazete10', { field, text });
          if (!r) return;
          rows.some((x) => x.id === r.id) || rows.push(r);
          K.stickers.award('gazete10');
          render();
          return;
        }
        if (e.target.closest('[data-gz-muhur]')) {
          const m = K.ui.modal({ label: 'Mühürle', html: `<h3>Gazete on yıl mühürlensin mi?</h3><p>${K.esc(T.fmt(tarih10(Date.now()), true))} gününe kadar kimse açamayacak; bir daha yazılamayacak.</p><div class="row"><button type="button" class="btn red" data-gz-evet>🔏 Mühürle</button><button type="button" class="btn ghost" data-close>Vazgeç</button></div>` });
          m.el.addEventListener('click', async (ev) => {
            if (!ev.target.closest('[data-gz-evet]')) return;
            const r = await K.cloud.add('gazete10muhur', { open: tarih10(Date.now()) });
            m.close();
            if (!r) return;
            muhur.some((x) => x.id === r.id) || muhur.push(r);
            K.fx.confetti({ count: 80, shapes: ['star'] });
            K.stickers.award('gazete10muhur');
            K.ping(`🔏 Geleceğin Gazetesi mühürlendi`, `${T.fmt(tarih10(Date.now()), true)} günü açılacak.`, ['newspaper'], { click: K.roomUrl('gazete10') });
            render();
          });
        }
      });
    },
    enter() {
      render();
    },
  });
})();
