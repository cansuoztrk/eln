/* Oda: Zor Gün Protokolü — onun zor günü için önceden hazırlanmış bir plan: önce şu şarkı, sonra şu ses, sonra şu söz,
   sonra küçük bir oyun. Tek tuşla adım adım başlar; başlayınca öbürüne hemen (sessiz saatleri aşan) bir bildirim gider.
   İkiniz de birbiriniz için hazırlarsınız. Adım türleri: şarkı (YouTube bağlantısı ya da kalenin melodisi), ses (60 sn),
   söz, nefes, oyun (bir oda), sarılma.
   Kayıtlar: protokol {icin, adimlar: [{tur, metin, link, audio, oda}]} (en son geçerli) · protokolbasla {icin} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const TUR = {
    sarki: ['🎵', 'Şarkı', 'YouTube bağlantısı ya da boş bırak: kalenin melodisi çalar'],
    ses: ['🎙️', 'Sesim', 'En fazla 60 saniye'],
    soz: ['💌', 'Söz', 'Ona söylemek istediğin'],
    nefes: ['🫧', 'Birlikte nefes', 'Nefes odasına götürür'],
    oyun: ['🎲', 'Küçük bir oyun', 'Bir oda seç'],
    sarilma: ['🤗', 'Sarılma', 'Sana anında bir sarılma gider'],
  };
  const OYUNLAR = [['angela', 'Konuşan Angela'], ['gartic', 'Çiz Bil'], ['labirent', 'Kalp Labirenti'], ['gece', 'Gece Lambası'], ['kavanoz', 'Kalp Kavanozu'], ['pinpon', 'İki Kıyı Pinpon'], ['uyku', 'Uyku Masalları']];
  let rows = [], root = null, taslak = null;

  const benim = () => rows.filter((r) => r.who === mine() && r.data.icin === other()).sort((a, b) => b.at - a.at)[0];
  const bana = () => rows.filter((r) => r.who === other() && r.data.icin === mine()).sort((a, b) => b.at - a.at)[0];
  const ytId = (u) => {
    const m = String(u || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
    return m ? m[1] : '';
  };

  /* ---------- Çalıştırıcı ---------- */
  function baslat(p) {
    if (!p || !p.data.adimlar.length) return;
    K.cloud.add('protokolbasla', { icin: mine() });
    K.ping(`💗 ${K.meName()} zor gün protokolünü başlattı`, 'Zor bir gün geçiriyor. Bir ses, bir mesaj, bir arama…', ['heart'], { click: K.roomUrl('protokol'), priority: 5 });
    let i = 0;
    const el = K.el(`<div class="pk-ekran" role="dialog" aria-label="Zor gün protokolü"><button type="button" class="pk-kapat" aria-label="Kapat">×</button><div class="pk-ust"></div><div class="pk-adim"></div><div class="pk-alt"><button class="btn" type="button" data-pk-ileri>Sonraki adım</button></div></div>`);
    document.body.appendChild(el);
    document.body.classList.add('bg-acik');
    const kapat = () => (K.medya.sus(), el.remove(), document.body.classList.remove('bg-acik'));
    const goster = () => {
      const a = p.data.adimlar[i];
      K.medya.sus();
      K.$('.pk-ust', el).innerHTML = p.data.adimlar.map((_, k) => `<i class="${k < i ? 'gecti' : k === i ? 'su' : ''}"></i>`).join('');
      const t = TUR[a.tur] || TUR.soz;
      let ic = '';
      if (a.tur === 'sarki') {
        const id = ytId(a.link);
        ic = id ? `<div class="pk-video"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1" allow="autoplay; encrypted-media" allowfullscreen title="Şarkı"></iframe></div>` : '<p class="muted">Kalenin melodisi çalıyor…</p>';
        id || (K.audio.music && K.audio.music.start && K.audio.music.start());
      }
      if (a.tur === 'ses') setTimeout(() => K.medya.cal(a.audio), 300), (ic = '<p class="pk-dalga">🎙️ 〰️〰️〰️</p><button class="btn soft small" type="button" data-pk-tekrar>Tekrar dinle</button>');
      if (a.tur === 'nefes') ic = '<button class="btn soft" type="button" data-pk-oda="nefes">🫧 Nefes odasını aç</button>';
      if (a.tur === 'oyun') ic = `<button class="btn soft" type="button" data-pk-oda="${K.esc(a.oda || 'angela')}">🎲 ${K.esc((OYUNLAR.find((o) => o[0] === a.oda) || ['', 'Oyunu aç'])[1])}</button>`;
      if (a.tur === 'sarilma') K.fx.confetti({ count: 50, shapes: ['heart'] }), (ic = `<p class="pk-sar">${A.icon('hug')}</p><p class="muted">${K.esc(nameOf(p.who))} bunu yazarken sana sarılıyordu. Şimdi de haberi var.</p>`);
      K.$('.pk-adim', el).innerHTML = `<p class="card-eyebrow">${i + 1}. adım · ${t[1]}</p><p class="pk-ikon">${t[0]}</p>${a.metin ? `<p class="pk-metin hand">${K.yazitipi ? K.yazitipi.html(a.metin, p.who) : K.esc(a.metin)}</p>` : ''}${ic}`;
      K.$('[data-pk-ileri]', el).textContent = i === p.data.adimlar.length - 1 ? 'Bitir 💗' : 'Sonraki adım';
    };
    el.addEventListener('click', (e) => {
      if (e.target.closest('.pk-kapat')) return kapat();
      if (e.target.closest('[data-pk-tekrar]')) return K.medya.cal(p.data.adimlar[i].audio);
      const o = e.target.closest('[data-pk-oda]');
      if (o) return kapat(), K.go(o.dataset.pkOda);
      if (e.target.closest('[data-pk-ileri]')) {
        if (i >= p.data.adimlar.length - 1) {
          kapat();
          K.fx.toast(`💗 Bitti. ${K.esc(nameOf(p.who))} birazdan yazacak; sen de ona yaz istersen.`, { duration: 5000 });
          return K.stickers.award('protokol');
        }
        i++;
        goster();
      }
    });
    goster();
  }

  /* ---------- Hazırlayıcı ---------- */
  function hazirla() {
    const box = K.$('#pkHazirla', root);
    if (!box) return;
    taslak = taslak || (benim() ? JSON.parse(JSON.stringify(benim().data.adimlar)) : []);
    box.innerHTML = `<ol class="pk-liste">${taslak.map((a, i) => `<li><span>${(TUR[a.tur] || TUR.soz)[0]}</span><div><b>${(TUR[a.tur] || TUR.soz)[1]}</b><small>${K.esc(a.metin || a.link || (a.audio ? 'ses kaydı' : '') || (a.oda ? (OYUNLAR.find((o) => o[0] === a.oda) || ['', a.oda])[1] : ''))}</small></div><button type="button" class="linkish" data-pk-yukari="${i}" ${i ? '' : 'disabled'}>↑</button><button type="button" class="linkish" data-pk-sil="${i}">sil</button></li>`).join('') || '<li class="muted">Henüz adım yok. Aşağıdan ekle.</li>'}</ol>
      <div class="pk-ekle">${Object.entries(TUR).map(([k, v]) => `<button type="button" class="chip" data-pk-ekle="${k}">${v[0]} ${v[1]}</button>`).join('')}</div>
      <div class="pk-form" id="pkForm"></div>
      <button class="btn" type="button" data-pk="kaydet" ${taslak.length ? '' : 'disabled'}>Protokolü kaydet</button>`;
  }
  function form(tur) {
    const f = K.$('#pkForm', root);
    const t = TUR[tur];
    f.innerHTML = `<p class="card-eyebrow">${t[0]} ${t[1]}</p><p class="muted small">${t[2]}</p>
      ${tur === 'sarki' ? '<input class="input" id="pkLink" placeholder="https://youtu.be/..."><input class="input" id="pkMetin" maxlength="120" placeholder="Bu şarkıyı neden seçtin? (isteğe bağlı)">' : ''}
      ${tur === 'soz' ? '<textarea class="textarea" id="pkMetin" rows="3" maxlength="400" placeholder="Ona söylemek istediğin"></textarea>' : ''}
      ${tur === 'oyun' ? `<select class="input" id="pkOda">${OYUNLAR.map(([id, ad]) => `<option value="${id}">${ad}</option>`).join('')}</select>` : ''}
      ${tur === 'nefes' || tur === 'sarilma' ? '<input class="input" id="pkMetin" maxlength="120" placeholder="Kısa bir not (isteğe bağlı)">' : ''}
      ${tur === 'ses' ? '<input class="input" id="pkMetin" maxlength="120" placeholder="Kısa bir not (isteğe bağlı)"><button class="btn soft" type="button" data-pk-kayit>🎙️ Kaydet (60 sn)</button>' : `<button class="btn soft small" type="button" data-pk-ok="${tur}">Adımı ekle</button>`}`;
  }
  async function kaydet() {
    if (!taslak.length) return;
    const r = await K.cloud.add('protokol', { icin: other(), adimlar: taslak });
    if (!r) return;
    rows.push(r);
    taslak = null;
    K.fx.toast(`💗 Protokol hazır. ${K.esc(nameOf(other()))} zor bir günde tek tuşla başlatabilir.`);
    K.stickers.award('protokolhazir');
    ciz();
  }
  function ciz() {
    if (!root || K.activeRoom !== 'protokol') return;
    const b = bana();
    K.$('#pkUst', root).innerHTML = b
      ? `<section class="card pk-bana"><p class="card-eyebrow">${K.esc(nameOf(other()))} senin için hazırladı</p><p>${b.data.adimlar.length} adım: ${b.data.adimlar.map((a) => (TUR[a.tur] || TUR.soz)[0]).join(' → ')}</p><button class="btn pk-buyuk" type="button" data-pk="basla">💗 Bugün zor bir gün</button><p class="muted small">Basınca ${K.esc(nameOf(other()))} hemen haber alır.</p></section>`
      : `<section class="card pk-bana bos"><p>${K.esc(nameOf(other()))} henüz senin için bir protokol hazırlamadı. Hazırlayınca burada tek bir büyük düğme olacak.</p></section>`;
    hazirla();
  }
  K.room({
    id: 'protokol',
    wing: 'kalp',
    title: 'Zor Gün Protokolü',
    sub: 'Tek tuşla, adım adım, önceden hazırlanmış bir sevgi',
    icon: 'shield',
    color: '#EFE9FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Zor bir gün için önceden hazırlanmış bir plan: önce şu şarkı, sonra şu ses, sonra şu söz, sonra küçük bir oyun. Zor gün gelince düşünmek gerekmesin diye.</p></div>
        <div id="pkUst"></div><h3 class="pk-h">${K.esc(K.ek(nameOf(other()), 'in'))} zor günü için hazırla</h3><section class="card" id="pkHazirla"></section>`;
      el.addEventListener('click', async (e) => {
        const ek = e.target.closest('[data-pk-ekle]');
        if (ek) return form(ek.dataset.pkEkle);
        const ok = e.target.closest('[data-pk-ok]');
        if (ok) {
          const v = (id) => (K.$(id, root) ? K.$(id, root).value.trim() : '');
          const a = { tur: ok.dataset.pkOk, metin: v('#pkMetin') };
          if (a.tur === 'sarki') a.link = v('#pkLink');
          if (a.tur === 'oyun') a.oda = v('#pkOda');
          if (a.tur === 'soz' && !a.metin) return K.fx.toast('Bir şey yaz.');
          taslak.push(a);
          return hazirla();
        }
        const kb = e.target.closest('[data-pk-kayit]');
        if (kb) {
          const r = await K.medya.kaydet(kb, 60);
          if (!r) return;
          taslak.push({ tur: 'ses', audio: r.audio, metin: K.$('#pkMetin', root) ? K.$('#pkMetin', root).value.trim() : '' });
          return hazirla();
        }
        const sil = e.target.closest('[data-pk-sil]');
        if (sil) return taslak.splice(+sil.dataset.pkSil, 1), hazirla();
        const yk = e.target.closest('[data-pk-yukari]');
        if (yk) {
          const i = +yk.dataset.pkYukari;
          [taslak[i - 1], taslak[i]] = [taslak[i], taslak[i - 1]];
          return hazirla();
        }
        const b = e.target.closest('[data-pk]');
        if (b && b.dataset.pk === 'kaydet') kaydet();
        if (b && b.dataset.pk === 'basla') baslat(bana());
      });
    },
    async enter() {
      rows = await K.cloud.list('protokol', 40);
      ciz();
    },
  });
  K.on('cloud', (ok) => {
    if (!ok) return;
    K.cloud.on('protokolbasla', (r) => {
      if (r.who === mine()) return;
      K.fx.toast(`💗 <b>${K.esc(nameOf(r.who))} zor gün protokolünü başlattı.</b> Ona bir ses bırak ya da ara.`, { duration: 9000 });
    });
  });
  K.protokol = { baslat: () => baslat(bana()), var: () => Boolean(bana()) };
})();
