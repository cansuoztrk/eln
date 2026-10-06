/* Oda: Kavuşma Kutusu — ilk buluşmada vereceğim gerçek kutunun hazırlık masası ve dijital ikizi.
   Ben: kavanozdan 21 not seçerim (ya da Kitty yılın her yerinden seçer), kutuya girecek sesi seçer ya da kaydederim,
   kutunun içindekiler listesini işaretlerim; sonra 21 not kartını, Pamuk'un çizimini ve QR'lı ses kartını A5 olarak
   basarım. Ses kartındaki QR (ya da kartın arkasına yapıştırılan NFC etiketi) onu bu odaya getirir: kart okutulunca
   oda onun için de açılır; kutudaki ses büyük bir düğmeyle çalar, 21 not çevrilen kartlar olarak durur.
   "Kutuyu verdim" deyince de açılır. Kayıtlar: kutu {notes, voice, items, given, msg} (son hâli geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const ITEMS = ['21 not kartı', "Pamuk'un çizimi", 'Ses kartı (QR + NFC etiketi)', 'Kurdeleli kutu', 'Kurutulmuş zambak', 'Kırmızı fiyonk', 'Bir avuç şeker', 'İlk buluşmanın biletleri'];
  const URL_ = () => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}#kutu`;
  let root = null, state = null, notes = [], voices = [], loaded = false, recVoice = null, flipped = new Set();
  const cur = () => state || { notes: [], voice: '', items: ITEMS.map((n) => [n, false]), given: false, msg: '' };
  const open = () => K.isOwner() || K.store.get('kutuLink') || (state && state.given);
  async function save(patch) {
    const s = Object.assign({}, cur(), patch);
    const r = await K.cloud.add('kutu', s);
    if (r) state = s;
    render();
    return r;
  }
  function autoPick() {
    const pool = notes.filter((n) => n.text.length > 3 && n.text.length < 140);
    if (pool.length <= 21) return pool.map((n) => n.id);
    return Array.from({ length: 21 }, (_, i) => pool[Math.floor((i * pool.length) / 21)].id);
  }
  function card(n, i) {
    return `<div class="ku-kart"><span class="ku-no">${i + 1}/21</span>${A.bow('#E3174D', 'ku-fiyonk')}<p>${K.esc(n.text)}</p><small>— ${K.esc(nameOf(n.who))} · ${K.esc(T.fmt(n.day))}</small></div>`;
  }
  function printPages() {
    const s = cur();
    const chosen = s.notes.map((id) => notes.find((n) => n.id === id)).filter(Boolean);
    const pages = [];
    for (let i = 0; i < chosen.length; i += 6) pages.push(`<section class="kb-page ku-sayfa"><div class="ku-izgara">${chosen.slice(i, i + 6).map((n, j) => card(n, i + j)).join('')}</div><p class="kb-sub">Kesme çizgilerinden kes · ${Math.floor(i / 6) + 1}. sayfa</p></section>`);
    pages.push(`<section class="kb-page ku-sayfa ku-pamuk"><p class="kb-kicker">Kutudan bir çizim</p><div class="ku-kedi">${K.kedi && K.kedi.svg ? K.kedi.svg() : A.kitty({ eyes: 'happy' })}</div><h2 class="hand">${K.esc(K.kedi && K.kedi.name ? K.kedi.name() || 'Pamuk' : 'Pamuk')} seni bekliyordu</h2><p class="kb-sub">Kalede birlikte büyüttüğümüz kedi, şimdi kâğıtta.</p></section>`);
    pages.push(`<section class="kb-page ku-sayfa ku-seskart"><p class="kb-kicker">Ses kartı</p><div class="ku-qr">${K.qr.svg(URL_(), { px: 240, fg: '#4A2138', label: 'Kutunun sesi' })}</div><h2 class="hand">Telefonunu dokundur ya da okut</h2><p>${K.esc(s.msg || 'Bu kutunun içinde bir de sesim var.')}</p><p class="kb-sub">${K.esc(URL_())}</p></section>`);
    return pages.join('');
  }
  function doPrint() {
    const kb = K.el(`<div class="kb ku-baski" role="dialog" aria-modal="true" aria-label="Kutu kartları"><div class="kb-bar"><button class="btn red small" data-ku-yazdir>${A.ui('download')} Yazdır / PDF</button><span class="kb-hint">A5 kâğıt. Not kartlarını kesip kutuya koy.</span><button class="btn ghost small" data-ku-kapat>Kapat</button></div><div class="kb-pages">${printPages()}</div></div>`);
    document.body.appendChild(kb);
    document.body.classList.add('has-book');
    kb.addEventListener('click', (e) => {
      if (e.target.closest('[data-ku-yazdir]')) {
        document.body.classList.add('printing-book');
        K.stickers.award('kutubaski');
        setTimeout(() => {
          window.print();
          setTimeout(() => document.body.classList.remove('printing-book'), 500);
        }, 100);
      }
      if (e.target.closest('[data-ku-kapat]')) {
        kb.remove();
        document.body.classList.remove('has-book', 'printing-book');
      }
    });
  }
  function renderOwner() {
    const s = cur();
    const sel = new Set(s.notes);
    K.$('#kuIcerik', root).innerHTML = `<p class="card-eyebrow">Kutunun içi</p><ul class="ku-liste">${s.items.map(([n, d], i) => `<li><label><input type="checkbox" data-ku-i="${i}" ${d ? 'checked' : ''}> ${K.esc(n)}</label></li>`).join('')}</ul>
      <div class="row"><input class="input" id="kuYeni" maxlength="50" placeholder="Başka bir şey ekle"><button type="button" class="btn soft small" data-ku-ekle>Ekle</button></div>`;
    K.$('#kuNotlar', root).innerHTML = `<p class="card-eyebrow">21 not · ${sel.size}/21 seçildi</p><div class="row"><button type="button" class="btn soft small" data-ku-kitty>✨ Kitty seçsin (yılın her yerinden)</button></div>
      <div class="ku-notlar">${notes.length ? notes.slice().reverse().map((n) => `<label class="ku-not ${sel.has(n.id) ? 'on' : ''}"><input type="checkbox" data-ku-n="${n.id}" ${sel.has(n.id) ? 'checked' : ''}><span>${K.esc(n.text)}<small>${K.esc(nameOf(n.who))} · ${K.esc(T.fmt(n.day))}</small></span></label>`).join('') : '<p class="muted">Kavanozda henüz not yok.</p>'}</div>`;
    K.$('#kuSesler', root).innerHTML = `<p class="card-eyebrow">Kutunun sesi</p>${voices.length ? voices.slice(-10).reverse().map((v) => `<div class="ku-ses ${s.voice === v.audio ? 'on' : ''}"><button type="button" class="btn soft small" data-ku-dinle="${v.audio}">▶</button><span>${K.esc(nameOf(v.who))} · ${Math.round(v.dur)} sn · ${K.esc(K.ago(v.at))}</span><button type="button" class="btn ${s.voice === v.audio ? 'red' : 'soft'} small" data-ku-sec="${v.audio}">${s.voice === v.audio ? '✓ Kutuda' : 'Seç'}</button></div>`).join('') : ''}
      <div class="row"><button type="button" class="btn soft small" data-ku-kayit>${recVoice ? '⏹ Bitir' : '⏺ Kutuya özel ses kaydet'}</button></div>
      <label class="dg-etiket">Ses kartına bir cümle</label><div class="row"><input class="input" id="kuMsg" maxlength="90" value="${K.esc(s.msg || '')}" placeholder="Bu kutunun içinde bir de sesim var."><button type="button" class="btn soft small" data-ku-msg>Kaydet</button></div>`;
    K.$('#kuBaski', root).innerHTML = `<p class="card-eyebrow">Ses kartı ve baskı</p><div class="ku-qr-on">${K.qr.svg(URL_(), { px: 150, fg: '#4A2138' })}<div><p>Bu QR (ya da kartın arkasına yapıştıracağın bir NFC etiketi) onu doğrudan bu odaya getirir ve kutunun sesini çalar.</p><p class="muted small">NFC için: NTAG213 etiket al, "NFC Tools" uygulamasıyla etikete bu adresi URL olarak yaz: <b>${K.esc(URL_())}</b></p></div></div>
      <div class="row center"><button type="button" class="btn red" data-ku-bas ${sel.size ? '' : 'disabled'}>🖨 Kartları hazırla (A5)</button><button type="button" class="btn ${s.given ? 'soft' : 'red'}" data-ku-verdim ${s.given ? 'disabled' : ''}>${s.given ? '✓ Kutu verildi' : '📦 Kutuyu verdim'}</button></div>`;
  }
  function renderHer() {
    const s = cur();
    const chosen = s.notes.map((id) => notes.find((n) => n.id === id)).filter(Boolean);
    K.$('#kuOnun', root).innerHTML = `<div class="ku-kapak">${A.bow('#E3174D', 'ku-buyuk-fiyonk')}<h3>Kavuşma Kutusu</h3><p>${K.esc(s.msg || 'Bu kutunun içinde bir de sesim var.')}</p>${s.voice ? '<button type="button" class="ku-cal" data-ku-cal aria-label="Sesi çal">▶</button>' : ''}</div>
      <p class="card-eyebrow">${chosen.length} not · dokun, çevir</p><div class="ku-cevir">${chosen.map((n, i) => `<button type="button" class="ku-c ${flipped.has(i) ? 'acik' : ''}" data-ku-c="${i}"><span class="on">${i + 1}</span><span class="arka">${K.esc(n.text)}<small>— ${K.esc(nameOf(n.who))}</small></span></button>`).join('')}</div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'kutu') return;
    const own = K.isOwner();
    K.$$('.ku-sahip', root).forEach((x) => (x.hidden = !own));
    K.$('#kuOnun', root).hidden = own;
    if (!loaded) return;
    own ? renderOwner() : renderHer();
  }
  async function load() {
    if (!K.cloud || !K.cloud.enabled) return;
    const [rows, nt, vs] = await Promise.all([K.cloud.list('kutu', 20), K.arsiv.notes(), K.arsiv.voices()]);
    const last = rows.sort((a, b) => a.at - b.at).pop();
    state = last ? last.data : null;
    notes = nt.filter((n) => n.kind === 'kalpk' || n.kind === 'minnet');
    voices = vs.slice();
    const own = state && state.voice;
    if (own && !voices.some((v) => v.audio === own)) voices.push({ id: own, who: 'me', at: last.at, audio: own, dur: 0, tag: 'kutu' });
    loaded = true;
    render();
  }
  K.on('cloud', (ok) => ok && K.cloud.on('kutu', (r) => ((state = r.data), render())));
  K.room({
    id: 'kutu',
    wing: 'kalp',
    title: 'Kavuşma Kutusu',
    sub: 'Gerçek bir kutu, dijital bir ikiz',
    icon: 'gift',
    color: '#FFE6EC',
    hidden: () => !K.cloud || !K.cloud.enabled || !open(),
    unlockByLink() {
      if (K.isOwner() || K.store.get('kutuLink')) return;
      K.store.set('kutuLink', Date.now());
      K.stickers.award('kutu');
      K.ping(`📦 ${K.meName()} kutudaki kartı okuttu`, 'Kutunun sesi şu an çalıyor.', ['gift'], { click: K.roomUrl('kutu') });
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>${K.isOwner() ? 'İlk buluşmada vereceğin gerçek kutunun hazırlık masası: 21 not, Pamuk\'un çizimi ve QR\'lı bir ses kartı. Kartları A5 bas, kes, kutuya koy.' : 'Elindeki kutunun dijital ikizi: içindeki ses ve 21 not.'}</p></div>
        <section class="card ku-sahip" id="kuIcerik"></section><section class="card ku-sahip" id="kuNotlar"></section><section class="card ku-sahip" id="kuSesler"></section><section class="card ku-sahip" id="kuBaski"></section>
        <section class="card" id="kuOnun" hidden></section>`;
      el.addEventListener('change', async (e) => {
        const it = e.target.closest('[data-ku-i]');
        if (it) {
          const items = cur().items.map((x, i) => (i === +it.dataset.kuI ? [x[0], it.checked] : x));
          return save({ items });
        }
        const n = e.target.closest('[data-ku-n]');
        if (n) {
          let list = cur().notes.filter((id) => id !== n.dataset.kuN);
          if (n.checked) {
            if (list.length >= 21) {
              n.checked = false;
              return K.fx.toast('Kutuya 21 not sığar.');
            }
            list.push(n.dataset.kuN);
          }
          return save({ notes: list });
        }
      });
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-ku-ekle]')) {
          const inp = K.$('#kuYeni', root);
          const v = inp.value.trim();
          if (!v) return;
          return save({ items: cur().items.concat([[v, false]]) });
        }
        if (e.target.closest('[data-ku-kitty]')) {
          K.fx.confetti({ count: 30, shapes: ['heart'] });
          return save({ notes: autoPick() });
        }
        const d = e.target.closest('[data-ku-dinle]');
        if (d) {
          const url = await K.medya.rowUrl(d.dataset.kuDinle, 'b64');
          return url && new Audio(url).play().catch(() => {});
        }
        const sv = e.target.closest('[data-ku-sec]');
        if (sv) return save({ voice: sv.dataset.kuSec });
        const rb = e.target.closest('[data-ku-kayit]');
        if (rb) {
          if (recVoice) return recVoice.stop();
          recVoice = await K.mikrofon.start(90, (s) => (rb.textContent = `⏹ Bitir (${Math.round(s)} sn)`));
          if (!recVoice) return;
          const res = await recVoice.done;
          recVoice = null;
          const au = await K.mikrofon.upload(res.blob);
          if (!au) return K.fx.toast('Ses kaydedilemedi.'), render();
          // Telesekretere düşmesin: yalnızca ses kaydı, kutunun seçimi olarak tutulur
          voices.push({ id: au.id, who: 'me', at: Date.now(), audio: au.id, dur: res.dur, tag: 'kutu' });
          return save({ voice: au.id });
        }
        if (e.target.closest('[data-ku-msg]')) return save({ msg: K.$('#kuMsg', root).value.trim() });
        if (e.target.closest('[data-ku-bas]')) return doPrint();
        if (e.target.closest('[data-ku-verdim]')) {
          await save({ given: true });
          K.fx.confetti({ count: 120, shapes: ['heart', 'bow'] });
          K.ping(`📦 Kavuşma Kutusu artık kalede de açık`, 'Elindeki kutunun dijital ikizi: içindeki ses ve 21 not.', ['gift'], { click: K.roomUrl('kutu') });
          return;
        }
        if (e.target.closest('[data-ku-cal]')) {
          const url = await K.medya.rowUrl(cur().voice, 'b64');
          if (!url) return K.fx.toast('Ses açılamadı.');
          K.audio.music.on && K.audio.music.stop(false);
          new Audio(url).play().catch(() => {});
          K.fx.burst && K.fx.burst(innerWidth / 2, innerHeight / 2, { count: 26, power: 6 });
          return;
        }
        const c = e.target.closest('[data-ku-c]');
        if (c) {
          const i = +c.dataset.kuC;
          flipped.has(i) ? flipped.delete(i) : flipped.add(i);
          c.classList.toggle('acik');
          if (flipped.size === cur().notes.length) K.stickers.award('kutunotlar');
        }
      });
    },
    enter() {
      render();
      load().then(() => {
        if (!K.isOwner() && K.store.get('kutuLink') && !K.store.get('kutuCaldi') && cur().voice) {
          K.store.set('kutuCaldi', 1);
          setTimeout(() => K.$('[data-ku-cal]', root) && K.$('[data-ku-cal]', root).classList.add('nabiz'), 300);
        }
      });
    },
    leave() {
      recVoice && recVoice.stop();
    },
  });
})();
