/* Oda: Sesli Kitabımız — en sevdiği kitabı bölüm bölüm kendi sesiyle okur. Kale onu sesli kitap gibi çalar, kaldığı
   yeri (saniyesine kadar) hatırlar, uyku zamanlayıcısıyla sesi yavaşça kısıp durdurur. Gece 21:00'den sonra ana salonda
   "kaldığın yerden" kartı çıkar. Bir kayıt en fazla 6 dakika; uzun bölümler kısım kısım okunur.
   Kayıtlar: kitap {ad, yazar, renk} · kitapbolum {kitap, no, kisim, baslik, audio, dur} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const RENKLER = ['#FFB3CC', '#9FD8FF', '#FFE27A', '#9FE5C4', '#CDBBFF', '#FFC6A6'];
  let kitaplar = [], bolumler = [], root = null, acikKitap = null;
  let ses = null, simdi = null, uyku = 0, uykuT = null, uykuSec = 0;
  const yer = () => K.store.get('skYer', {});
  const sure = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const kitabin = (id) => bolumler.filter((b) => b.data.kitap === id).sort((a, b) => a.data.no - b.data.no || (a.data.kisim || 1) - (b.data.kisim || 1));
  function devam() {
    const son = K.store.get('skSon', null);
    if (!son) return null;
    const b = bolumler.find((x) => x.id === son);
    if (!b) return null;
    const l = kitabin(b.data.kitap);
    const t = yer()[b.id] || 0;
    if (t < (b.data.dur || 0) - 5) return { b, t };
    const i = l.indexOf(b);
    return l[i + 1] ? { b: l[i + 1], t: yer()[l[i + 1].id] || 0 } : null;
  }
  async function cal(id, bas) {
    const b = bolumler.find((x) => x.id === id);
    if (!b) return;
    dur();
    const url = await K.medya.rowUrl(b.data.audio, 'b64');
    if (!url) return K.fx.toast('Bölüm açılamadı.');
    K.audio.music && K.audio.music.on && K.audio.music.stop(false);
    ses = new Audio(url);
    simdi = b;
    ses.currentTime = bas != null ? bas : yer()[b.id] || 0;
    ses.playbackRate = K.store.get('skHiz', 1);
    ses.play().catch(() => {});
    K.store.set('skSon', b.id);
    ses.ontimeupdate = () => {
      const y = yer();
      y[b.id] = Math.floor(ses.currentTime);
      K.store.set('skYer', y);
      oynatici();
    };
    ses.onended = () => {
      const l = kitabin(b.data.kitap);
      const n = l[l.indexOf(b) + 1];
      K.stickers.award('seslikitap');
      if (n && !uykuBitti()) cal(n.id, 0);
      else oynatici();
    };
    oynatici();
  }
  const uykuBitti = () => uyku && Date.now() > uyku;
  function dur() {
    ses && (ses.pause(), (ses.ontimeupdate = null));
  }
  function uykuKur(dk) {
    clearInterval(uykuT);
    uyku = dk ? Date.now() + dk * 6e4 : 0;
    if (!dk) return oynatici();
    uykuT = setInterval(() => {
      if (!ses || ses.paused) return;
      const kal = uyku - Date.now();
      if (kal < 30000) ses.volume = Math.max(0, kal / 30000);
      if (kal <= 0) dur(), clearInterval(uykuT), (uyku = 0), (uykuSec = 0), (ses.volume = 1), oynatici(), K.fx.toast('🌙 İyi uykular. Kaldığın yer saklandı.');
    }, 500);
    K.fx.toast(`🌙 ${dk} dakika sonra ses yavaşça kısılacak.`);
    oynatici();
  }
  function oynatici() {
    const el = root && K.$('#skOyn', root);
    if (!el) return;
    if (!simdi) return (el.hidden = true);
    el.hidden = false;
    const k = kitaplar.find((x) => x.id === simdi.data.kitap);
    const t = ses ? ses.currentTime : 0, d = simdi.data.dur || (ses && ses.duration) || 1;
    el.innerHTML = `<div class="sk-kapak mini" style="--k:${(k && k.data.renk) || '#FFB3CC'}"><b>${K.esc(k ? k.data.ad : '')}</b></div>
      <div class="sk-bilgi"><b>${simdi.data.no}. bölüm${simdi.data.kisim > 1 ? ` · ${simdi.data.kisim}. kısım` : ''}</b><small>${K.esc(simdi.data.baslik || '')} · ${K.esc(nameOf(simdi.who))} okuyor</small>
        <div class="sk-cubuk"><i style="width:${Math.min(100, (t / d) * 100)}%"></i></div><small class="tnum">${sure(t)} / ${sure(d)}${uyku ? ` · 🌙 ${Math.max(0, Math.ceil((uyku - Date.now()) / 6e4))} dk` : ''}</small></div>
      <div class="sk-tuslar"><button type="button" data-sk="geri" aria-label="15 saniye geri">↺15</button><button type="button" class="ana" data-sk="oynat" aria-label="${ses && !ses.paused ? 'Duraklat' : 'Oynat'}">${ses && !ses.paused ? '❚❚' : '▶'}</button><button type="button" data-sk="ileri" aria-label="15 saniye ileri">15↻</button>
        <button type="button" data-sk="hiz">${K.store.get('skHiz', 1)}×</button><button type="button" data-sk="uyku">🌙</button></div>`;
  }
  function ciz() {
    if (!root || K.activeRoom !== 'seslikitap') return;
    const d = devam();
    const box = K.$('#skIcerik', root);
    if (acikKitap) {
      const k = kitaplar.find((x) => x.id === acikKitap);
      const l = kitabin(acikKitap);
      const sonNo = l.length ? l[l.length - 1].data.no : 0;
      box.innerHTML = `<button class="room-back-link linkish" type="button" data-sk="kitaplar">‹ Kitaplar</button>
        <div class="sk-baslik"><div class="sk-kapak" style="--k:${k.data.renk}"><b>${K.esc(k.data.ad)}</b><small>${K.esc(k.data.yazar || '')}</small></div><div><h3>${K.esc(k.data.ad)}</h3><p class="muted small">${l.length} kayıt · ${K.esc(nameOf(k.who))} okuyor</p></div></div>
        <ol class="sk-bolumler">${l.map((b) => { const t = yer()[b.id] || 0, bitti = t >= (b.data.dur || 0) - 5; return `<li><button type="button" data-sk-cal="${b.id}" class="${bitti ? 'bitti' : t ? 'yarim' : ''}"><b>${b.data.no}. bölüm${b.data.kisim > 1 ? ` · ${b.data.kisim}` : ''}</b><small>${K.esc(b.data.baslik || '')} · ${sure(b.data.dur || 0)}${bitti ? ' · dinlendi ✓' : t ? ` · ${sure(t)}'de kaldın` : ''}</small></button></li>`; }).join('') || '<li class="muted">Henüz bölüm yok.</li>'}</ol>
        ${k.who === mine() ? `<section class="card sk-kayit"><p class="card-eyebrow">Yeni kayıt</p><div class="hc-alanlar"><input class="input" id="skNo" type="number" min="1" value="${sonNo || 1}" aria-label="Bölüm no"><input class="input" id="skKisim" type="number" min="1" value="${l.filter((b) => b.data.no === (sonNo || 1)).length + 1}" aria-label="Kısım"><input class="input" id="skBas" maxlength="60" placeholder="Bölümün adı (isteğe bağlı)"></div><button class="btn" type="button" data-sk="kaydet">🎙️ Okumaya başla (en fazla 6 dk)</button><p class="muted small">Sessiz bir yerde, telefonu ağzından bir karış uzakta tut. Uzun bölümleri kısım kısım oku; kale arka arkaya çalar.</p></section>` : ''}`;
      return oynatici();
    }
    box.innerHTML = `${d ? `<button type="button" class="card sk-devam" data-sk-cal="${d.b.id}"><p class="card-eyebrow">Kaldığın yerden</p><b>${K.esc((kitaplar.find((x) => x.id === d.b.data.kitap) || { data: {} }).data.ad || '')} · ${d.b.data.no}. bölüm</b><small>${sure(d.t)}'den devam et ▶</small></button>` : ''}
      <div class="sk-raf">${kitaplar.map((k) => `<button type="button" class="sk-kapak" style="--k:${k.data.renk}" data-sk-kitap="${k.id}"><b>${K.esc(k.data.ad)}</b><small>${K.esc(k.data.yazar || '')}</small><i>${kitabin(k.id).length} kayıt</i></button>`).join('')}
        <button type="button" class="sk-kapak yeni" data-sk="yeni"><b>+</b><small>Yeni kitap</small></button></div>`;
    oynatici();
  }
  async function yeniKitap() {
    const m = K.ui.modal({ label: 'Yeni kitap', html: `<h2>Hangi kitabı okuyacaksın?</h2><input class="input" id="skAd" maxlength="60" placeholder="Kitabın adı"><input class="input" id="skYazar" maxlength="60" placeholder="Yazarı"><button class="btn" type="button" data-sk-ok>Rafa koy</button>` });
    m.el.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-sk-ok]')) return;
      const ad = K.$('#skAd', m.el).value.trim();
      if (!ad) return;
      const r = await K.cloud.add('kitap', { ad, yazar: K.$('#skYazar', m.el).value.trim(), renk: RENKLER[kitaplar.length % RENKLER.length] });
      m.close();
      if (r) kitaplar.push(r), (acikKitap = r.id), ciz();
    });
  }
  K.room({
    id: 'seslikitap',
    wing: 'kalp',
    title: 'Sesli Kitabımız',
    sub: 'En sevdiği kitap, bölüm bölüm, kendi sesimle',
    icon: 'headphones',
    color: '#EFE9FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kitabı ${K.esc(nameOf(other()))} için bölüm bölüm kendi sesinle oku. Kale onu sesli kitap gibi çalar, kaldığı yeri hatırlar ve uyku saatinde sesi yavaşça kısar.</p></div><div id="skIcerik"></div><div class="sk-oyn" id="skOyn" hidden></div>`;
      el.addEventListener('click', async (e) => {
        const c = e.target.closest('[data-sk-cal]');
        if (c) return cal(c.dataset.skCal);
        const kt = e.target.closest('[data-sk-kitap]');
        if (kt) return (acikKitap = kt.dataset.skKitap), ciz();
        const b = e.target.closest('[data-sk]');
        if (!b) return;
        const k = b.dataset.sk;
        if (k === 'kitaplar') (acikKitap = null), ciz();
        if (k === 'yeni') yeniKitap();
        if (k === 'oynat') ses ? (ses.paused ? ses.play() : ses.pause(), oynatici()) : simdi && cal(simdi.id);
        if (k === 'geri' && ses) ses.currentTime = Math.max(0, ses.currentTime - 15);
        if (k === 'ileri' && ses) ses.currentTime += 15;
        if (k === 'hiz') {
          const h = { 1: 1.25, 1.25: 1.5, 1.5: 0.9, 0.9: 1 }[K.store.get('skHiz', 1)] || 1;
          K.store.set('skHiz', h);
          ses && (ses.playbackRate = h);
          oynatici();
        }
        if (k === 'uyku') (uykuSec = { 0: 15, 15: 30, 30: 60, 60: 0 }[uykuSec] || 0), uykuKur(uykuSec);
        if (k === 'kaydet') {
          const r = await K.medya.kaydet(b, 360);
          if (!r) return;
          const row = await K.cloud.add('kitapbolum', { kitap: acikKitap, no: +K.$('#skNo', root).value || 1, kisim: +K.$('#skKisim', root).value || 1, baslik: K.$('#skBas', root).value.trim(), audio: r.audio, dur: r.dur });
          if (row) {
            bolumler.push(row);
            K.ping(`🎧 ${K.meName()} kitabımıza yeni bir bölüm okudu`, 'Uyumadan önce dinlemek istersin belki.', ['headphones'], { click: K.roomUrl('seslikitap') });
            K.stickers.award('seslikitap');
          }
          ciz();
        }
      });
    },
    async enter() {
      [kitaplar, bolumler] = await Promise.all([K.cloud.list('kitap', 60), K.cloud.list('kitapbolum', 500)]);
      ciz();
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [kitaplar, bolumler] = await Promise.all([K.cloud.list('kitap', 60), K.cloud.list('kitapbolum', 500)]);
    K.cloud.on('kitapbolum', (r) => bolumler.some((x) => x.id === r.id) || (bolumler.push(r), ciz(), K.renderSpecials && K.renderSpecials()));
    K.cloud.on('kitap', (r) => kitaplar.some((x) => x.id === r.id) || (kitaplar.push(r), ciz()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const h = new Date().getHours();
    if (!(h >= 21 || h < 2)) return [];
    const d = devam();
    const yeni = bolumler.filter((b) => b.who === other() && !(yer()[b.id] > 0)).sort((a, b) => a.at - b.at)[0];
    if (d) return [{ key: 'seslikitap', icon: 'headphones', title: '🎧 Kaldığın yerden', text: `${d.b.data.no}. bölüm, ${nameOf(d.b.who)}'ın sesiyle. Uyku zamanlayıcısı hazır.`, run: () => (K.go('seslikitap'), setTimeout(() => cal(d.b.id), 600)), cta: 'Dinle', mini: true }];
    if (yeni) return [{ key: 'seslikitap', icon: 'headphones', title: '🎧 Kitabınıza yeni bölüm', text: `${nameOf(yeni.who)} senin için ${yeni.data.no}. bölümü okudu.`, room: 'seslikitap', cta: 'Dinle', mini: true }];
    return [];
  });
})();
