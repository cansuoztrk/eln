/* Kale 2.0 — Ana Salon 4.0: hikâyelerin altında üç sekme. "Bugün" (alev, Günün Çiçeği, sayaç, özel kartlar, bugünün
   kartları), "Biz" (ikinizin panosu: birlikte gün, alev, altın kalp, kavanoz, tahmin, kedi, telesekreter, minnet,
   hayaller, görevler, çıkartmalar; her kutu kendi odasına götürür) ve "Kale" (harita ve kanatlar). Seçim hatırlanır.
   Gece Modu: üst çubuktaki aydan otomatik (22:00–06:00) / açık / kapalı; gece kale kararır, kartlar loşlaşır. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const SL = () => D.salon || { tabs: [['bugun', '🌸', 'Bugün'], ['biz', '💞', 'Biz'], ['kale', '🏰', 'Kale']] };
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  let tab = K.store.get('salonTab', 'bugun');

  // Ana salondaki bölümler hangi sekmeye ait
  const MAP = [['#kalpBar', 'bugun'], ['#cicek', 'bugun'], ['.together', 'bugun'], ['#special', 'bugun'], ['.sec.today', 'bugun'], ['#install', 'bugun'], ['#gunbatimi', 'bugun'], ['#biz', 'biz'], ['.sec.castle', 'kale'], ['#anilar', 'anilar']];
  // Kale 4.0'da alttaki sekme çubuğu dördüncü bir sekme ekler: Anılar
  const TABS = () => SL().tabs.map((x) => x[0]).concat(['anilar']);
  function mark() {
    MAP.forEach(([sel, t]) => {
      const el = K.$(sel);
      if (el) el.classList.add('tp', 'tp-' + t);
    });
    const sp = K.$('#special');
    const nx = sp && sp.nextElementSibling;
    if (nx && nx.classList.contains('deck-dots')) nx.classList.add('tp', 'tp-bugun');
  }
  function set(t, opt = {}) {
    if (!TABS().includes(t)) t = 'bugun';
    tab = t;
    K.store.set('salonTab', t);
    mark();
    document.body.classList.remove('tab-bugun', 'tab-biz', 'tab-kale', 'tab-anilar');
    document.body.classList.add('tab-' + t);
    K.$$('.salon-tabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    if (t === 'biz') biz();
    K.emit('salonTab', t);
    if (opt.scroll) {
      const bar = K.$('.salon-tabs');
      bar && window.scrollTo({ top: Math.max(0, bar.getBoundingClientRect().top + window.scrollY - 70), behavior: K.reduced ? 'auto' : 'smooth' });
    }
    K.deste && K.deste.update();
  }
  // Tur ya da bir bağlantı gizli sekmedeki bir yeri gösterecekse önce o sekmeyi aç
  function reveal(el) {
    const p = el && el.closest && el.closest('.tp');
    if (!p) return;
    const t = ['bugun', 'biz', 'kale', 'anilar'].find((x) => p.classList.contains('tp-' + x));
    if (t && t !== tab) set(t);
  }

  /* ---------- Biz panosu ---------- */
  function tiles() {
    const out = [];
    const days = Math.max(0, T.daysSince(C.togetherDate));
    out.push({ room: 'ozet', ic: 'heart', n: K.num(days), u: 'gün', t: 'Birlikte', s: `Tanışalı ${K.num(Math.max(0, T.daysSince(C.metDate)))} gün` });
    if (K.kalp && K.cloud && K.cloud.enabled) {
      const s = K.kalp.streak();
      out.push({ room: '', run: () => K.kalp.alevSheet(), ic: 'candle', n: s.n, u: 'gün', t: 'Alevimiz', s: s.lit ? 'Bugün yandı 🔥' : 'Bugün ikiniz de uğrayınca yanar' });
    }
    if (K.baris) {
      const n = K.baris.done().length;
      out.push({ room: 'baris', ic: 'kintsugi', n, u: 'altın damar', t: 'Altın Kalp', s: K.baris.active() ? '☁️ Şu an küçük bir bulut var' : n ? `${n} kez küstük, ${n} kez barıştık` : 'Kalp tertemiz' });
    }
    if (K.kavanoz) out.push({ room: 'kavanoz', ic: 'jar', n: K.num(K.kavanoz.count()), u: 'kalp', t: 'Kalp Kavanozu', s: 'Her "seni seviyorum" bir kalp' });
    if (K.tahmin) {
      const a = K.tahmin.knows(other()), b = K.tahmin.knows(mine());
      out.push({ room: 'tahmin', ic: 'question', n: `%${a.pct}`, u: '', t: `${nameOf(other())} seni tanıyor`, s: `Sen onu %${b.pct} · ${a.n + b.n} soru` });
    }
    if (K.kedi && K.kedi.adopted()) out.push({ room: 'kedi', ic: 'paw', n: K.kedi.name(), u: '', t: 'Kedimiz', s: { mutlu: 'Mutlu 💗', ac: 'Acıktı 🍽️', ozlem: 'Birini özledi 🥺', uyku: 'Uyuyor 💤', kus: 'Barış istiyor 🕊️', sikilmis: 'Oyun istiyor 🧶' }[K.kedi.mood()] || '' });
    else if (K.kedi) out.push({ room: 'kedi', ic: 'paw', n: '?', u: '', t: 'Kapıdaki kutu', s: 'Henüz açılmadı' });
    if (K.telesekreter) out.push({ room: 'telesekreter', ic: 'radio', n: K.telesekreter.count(), u: 'mesaj', t: 'Telesekreter', s: K.telesekreter.unheard() ? `${K.telesekreter.unheard()} yeni` : 'Sesler burada' });
    if (K.minnet) out.push({ room: 'minnet', ic: 'note', n: K.minnet.count(), u: 'cümle', t: 'Minnet Defteri', s: K.minnet.todayDone() ? 'Bugünkü yazıldı ✓' : 'Bugünkü cümle bekliyor' });
    if (K.hayal) {
      const p = K.hayal.progress();
      out.push({ room: 'hayaller', ic: 'list', n: `${p.done}/${p.total}`, u: '', t: 'Hayallerimiz', s: `${p.stars} tanesine ikiniz de yıldız verdiniz` });
    }
    if (K.gorev) out.push({ room: 'gorev', ic: 'star', n: K.gorev.badges(), u: 'rozet', t: 'Haftalık görev', s: K.gorev.title() });
    if (K.cicek) {
      const sc = K.$('.cc-score');
      if (sc) out.push({ room: '', run: () => set('bugun', { scroll: true }), ic: 'lily', n: sc.firstChild ? sc.firstChild.textContent : '0', u: '/10', t: 'Günün Çiçeği', s: 'Bugünün ritüelleri' });
    }
    if (K.uyku && K.uyku.total()) out.push({ room: 'uyku', ic: 'moon', n: `${K.uyku.count()}/${K.uyku.total()}`, u: '', t: 'Uyku Masalları', s: K.uykubiz ? `${K.uykubiz.nights()} gece birlikte uyuduk` : 'Sesimle masallar' });
    if (K.harita) out.push({ room: 'harita', ic: 'map', n: K.harita.dreams(), u: 'hayal', t: 'Bizim Haritamız', s: K.harita.went() ? `${K.harita.went()} yere gittik` : 'Kuzey ışıkları, Paris, Roma...' });
    if (K.yarisma && K.cloud && K.cloud.enabled) {
      const w = K.yarisma.wins();
      out.push({ room: 'yarisma', ic: 'question', n: `${w.her}–${w.me}`, u: '', t: 'Bilgi Yarışması', s: K.yarisma.games() ? `${K.yarisma.games()} yarışma` : 'Kitty sunuyor' });
    }
    if (K.amiral && K.cloud && K.cloud.enabled) {
      const w = K.amiral.wins(), s = K.amiral.state();
      out.push({ room: 'amiral', ic: 'flag', n: `${w.her}–${w.me}`, u: '', t: 'Amiral Battı', s: s && !s.winner && s.ready ? (s.turn === (K.isOwner() ? 'me' : 'her') ? '🎯 Sıra sende' : 'Sıra onda') : 'Boğaz\'a karşı Hazar' });
    }
    if (K.onyil && K.cloud && K.cloud.enabled) out.push({ room: 'onyil', ic: 'hourglass', n: K.num(K.onyil.days()), u: 'gün', t: 'On Yıl Sonra', s: `Kapsülde ${K.onyil.count()} zarf` });
    const on = K.cloud && K.cloud.enabled;
    if (K.iyilik && on) out.push({ room: 'iyilik', ic: 'star', n: K.iyilik.streak(K.isOwner() ? 'me' : 'her'), u: 'gün seri', t: 'Bugün Senin İçin', s: `Toplam ${K.iyilik.count()} yıldız` });
    if (K.soz && on) out.push({ room: 'soz', ic: 'key', n: K.soz.kept(), u: 'söz tutuldu', t: 'Söz Defteri', s: K.soz.open() ? `${K.soz.open()} söz bekliyor` : 'Küçük sözler unutulmasın' });
    if (K.alarm && on) {
      const c = K.alarm.cfg(K.isOwner() ? 'me' : 'her');
      out.push({ room: 'alarm', ic: 'sun', n: c.on ? c.time : '—', u: '', t: 'Sesimle Uyan', s: `${K.alarm.pool().length} günaydın sesi` });
    }
    if (K.kisayol) out.push({ room: '', run: () => K.kisayol.open(), ic: 'hug', n: '🗣️', u: '', t: 'Siri ile Sarıl', s: `"Hey Siri, ${K.ek(K.otherName(), 'e')} sarıl"` });
    if (K.widget) out.push({ room: '', run: () => K.widget.open(), ic: 'frame', n: '📱', u: '', t: "Kale Widget'ı", s: 'Ana ekranda ve kilit ekranında kale' });
    if (K.kisayol && K.kisayol.nfc) out.push({ room: '', run: () => K.kisayol.nfc(), ic: 'key', n: '🏷️', u: '', t: 'NFC Anahtarlık', s: 'Etikete dokun, ona sarılma gitsin' });
    if (K.atolye) out.push({ room: '', run: () => K.atolye.open(), ic: 'palette', n: '🎨', u: '', t: 'Tema Atölyesi', s: 'Kaleni kendi renginle boya' });
    if (K.takvimabone && K.cloud && K.cloud.raw) out.push({ room: '', run: () => K.takvimabone.sheet(), ic: 'calendar', n: '📅', u: '', t: 'Takvim Aboneliği', s: 'Her 21\'i telefonunun takviminde' });
    if (K.faceid && window.PublicKeyCredential) out.push({ room: '', run: () => K.faceid.sheet(), ic: 'key', n: '🔐', u: '', t: 'Face ID ile Giriş', s: K.faceid.state() ? 'Kuruldu' : 'Şifresiz, güvenli giriş' });
    out.push({ room: 'album', ic: 'sticker', n: Object.keys(K.stickers.got()).length, u: 'pul', t: 'Pul Albümü', s: `Zorunlulardan ${K.stickers.done()}/${K.stickers.total}` });
    return out;
  }
  function biz() {
    const box = K.$('#biz');
    if (!box) return;
    const list = tiles();
    box.innerHTML = `<div class="biz-head"><h2 class="sec-title">İkimizin <span class="script">panosu</span></h2><p class="sec-sub">${K.esc(T.fmt(T.todayKey(), true))} · ${K.esc(C.herCity)} ${K.esc(T.hm(C.tzBaku))} · ${K.esc(C.myCity)} ${K.esc(T.hm(C.tzIstanbul))}</p></div>
      <div class="biz-grid">${list.map((x, i) => `<button type="button" class="biz-t" data-biz="${i}">${A.icon(x.ic)}<span class="biz-n">${K.esc(String(x.n))}${x.u ? `<small>${K.esc(x.u)}</small>` : ''}</span><b>${K.esc(x.t)}</b><span class="biz-s">${K.esc(x.s || '')}</span></button>`).join('')}</div>`;
    box._list = list;
  }

  /* ---------- Gece Modu ---------- */
  const GM = ['oto', 'acik', 'kapali'];
  const gmMode = () => K.store.get('geceModu', 'oto');
  function gmApply() {
    const m = gmMode();
    const h = new Date().getHours();
    const on = m === 'acik' || (m === 'oto' && (h >= 22 || h < 6));
    document.body.classList.toggle('gece-modu', on);
    const b = K.$('#geceBtn');
    if (b) {
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', `Gece modu: ${m === 'oto' ? 'otomatik' : m === 'acik' ? 'açık' : 'kapalı'}`);
      b.title = b.getAttribute('aria-label');
    }
  }
  function gmCycle() {
    const next = GM[(GM.indexOf(gmMode()) + 1) % GM.length];
    K.store.set('geceModu', next);
    gmApply();
    K.audio.sfx.tap();
    K.fx.toast(next === 'oto' ? '🌙 Gece modu otomatik: 22:00–06:00 arası.' : next === 'acik' ? '🌙 Gece modu açık.' : '☀️ Gece modu kapalı.', { duration: 2500, log: false });
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('.salon-tabs [data-tab]');
    if (t) {
      K.audio.sfx.tap();
      return set(t.dataset.tab);
    }
    const b = e.target.closest('[data-biz]');
    if (b) {
      const x = (K.$('#biz')._list || [])[+b.dataset.biz];
      if (!x) return;
      if (x.run) return x.run();
      if (x.room) K.go(x.room);
    }
    if (e.target.closest('#geceBtn')) gmCycle();
  });
  K.on('built', () => {
    setTimeout(() => {
      const st = K.$('#stories');
      if (st && !K.$('.salon-tabs')) {
        st.insertAdjacentHTML('afterend', `<nav class="wrap salon-tabs" role="tablist" aria-label="Ana salon">${SL().tabs.map(([id, e, l]) => `<button type="button" role="tab" data-tab="${id}" aria-selected="false"><span aria-hidden="true">${e}</span>${K.esc(l)}</button>`).join('')}</nav>`);
        const castle = K.$('.sec.castle');
        castle && castle.insertAdjacentHTML('beforebegin', '<section class="wrap sec biz" id="biz"></section>');
      }
      set(tab);
    }, 0);
    const acts = K.$('.top-actions');
    if (acts && !K.$('#geceBtn')) {
      const b = K.el(`<button type="button" class="icon-btn gece-btn" id="geceBtn" aria-label="Gece modu"><svg class="ic" viewBox="0 0 64 64" aria-hidden="true"><path d="M40 8 A24 24 0 1 0 56 44 A20 20 0 0 1 40 8 Z" fill="#FFD34E" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="40" r="3" fill="#F2B640"/><circle cx="32" cy="28" r="2.2" fill="#F2B640"/></svg></button>`);
      acts.insertBefore(b, acts.firstChild);
    }
    gmApply();
  });
  K.on('cloud', (ok) => ok && setTimeout(() => tab === 'biz' && biz(), 3000));
  K.on('room', () => setTimeout(mark, 0));
  window.addEventListener('hashchange', () => !K.activeRoom && tab === 'biz' && setTimeout(biz, 100));
  setInterval(() => {
    gmApply();
    if (tab === 'biz' && !K.activeRoom) biz();
  }, 60000);
  K.salon = { tab: set, reveal, current: () => tab, biz };
})();
