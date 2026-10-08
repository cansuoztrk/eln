/* Oda: Fiyonk Lambası — Bakü'deki odada gerçek bir akıllı lamba: Ardoş "seni düşünüyorum" deyince (ya da sarılınca,
   kavanoza kalp atınca; hangileri seçilirse) lamba bir kez pembe yanıp söner. Kale lambayla bir "webhook" adresi
   üzerinden konuşur: IFTTT, Home Assistant, Smart Life/Tuya ya da Hue için kurulumu odada adım adım anlatılır.
   İstek gönderenin telefonundan doğrudan gider (no-cors POST); adres kasada mühürlü kayıtta durur.
   Kayıt: lamba {url, yontem, govde, olaylar: {dusun, kucak, kalpk, selam}, kimin} (en son geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const OLAY = [['dusun', '💭 "Seni düşünüyorum"'], ['kucak', '🤗 Sarılma'], ['kalpk', '💗 Kavanoza kalp'], ['selam', '👋 Selam']];
  let ayar = null, root = null, son = 0;

  async function yak(neden) {
    if (!ayar || !ayar.url) return false;
    if (Date.now() - son < 20000 && neden !== 'deneme') return false;
    son = Date.now();
    try {
      const govde = (ayar.govde || '').replace(/\{olay\}/g, neden).replace(/\{kim\}/g, nameOf(mine()));
      await fetch(ayar.url, { method: ayar.yontem || 'POST', mode: 'no-cors', body: (ayar.yontem || 'POST') === 'GET' ? undefined : govde || JSON.stringify({ value1: neden, value2: nameOf(mine()) }), headers: govde && govde.trim().startsWith('{') ? { 'Content-Type': 'text/plain' } : undefined });
      return true;
    } catch (e) {
      return false;
    }
  }
  async function yukle() {
    const l = await K.cloud.list('lamba', 20);
    const r = l.sort((a, b) => b.at - a.at)[0];
    ayar = r ? r.data : null;
  }
  function sar() {
    if (!K.cloud || K.cloud._lamba) return;
    K.cloud._lamba = true;
    const add0 = K.cloud.add.bind(K.cloud);
    K.cloud.add = async (kind, obj) => {
      const r = await add0(kind, obj);
      if (r && ayar && ayar.olaylar && ayar.olaylar[kind] && mine() !== (ayar.kimin || 'her')) yak(kind);
      return r;
    };
  }
  function ciz() {
    if (!root || K.activeRoom !== 'lamba') return;
    const a = ayar || { url: '', yontem: 'POST', govde: '', olaylar: { dusun: true }, kimin: 'her' };
    K.$('#lmIcerik', root).innerHTML = `<section class="card lm-durum ${a.url ? 'kurulu' : ''}"><div class="lm-lamba ${a.url ? 'on' : ''}">${A.icon('lamp')}</div><div><p class="card-eyebrow">${a.url ? 'Lamba bağlı' : 'Henüz lamba yok'}</p><p>${a.url ? `${K.esc(nameOf(a.kimin === 'me' ? 'me' : 'her'))}'ın lambası; ${OLAY.filter(([k]) => a.olaylar && a.olaylar[k]).map(([, ad]) => ad).join(', ') || 'hiçbir olay'} gelince yanıp söner.` : 'Aşağıdaki adımlarla bir akıllı lambayı kaleye bağla.'}</p>${a.url ? '<button class="btn soft small" type="button" data-lm="dene">✨ Şimdi yakıp söndür</button>' : ''}</div></section>
      <section class="card lm-ayar"><p class="card-eyebrow">Ayarlar</p>
        <label>Lamba kimin odasında?<select class="input" id="lmKimin"><option value="her" ${a.kimin !== 'me' ? 'selected' : ''}>${K.esc(nameOf('her'))} (${K.esc(C.herCity)})</option><option value="me" ${a.kimin === 'me' ? 'selected' : ''}>${K.esc(nameOf('me'))} (${K.esc(C.myCity)})</option></select></label>
        <label>Webhook adresi<input class="input" id="lmUrl" value="${K.esc(a.url)}" placeholder="https://maker.ifttt.com/trigger/fiyonk/with/key/..."></label>
        <label>Yöntem<select class="input" id="lmYontem">${['POST', 'GET', 'PUT'].map((y) => `<option ${a.yontem === y ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
        <label>Gövde (isteğe bağlı; {olay} ve {kim} yerine yazılır)<input class="input" id="lmGovde" value="${K.esc(a.govde || '')}" placeholder='{"renk":"pembe","olay":"{olay}"}'></label>
        <p class="card-eyebrow">Hangi olaylarda yansın?</p><div class="lm-olaylar">${OLAY.map(([k, ad]) => `<label class="kk-onay"><input type="checkbox" data-lm-olay="${k}" ${a.olaylar && a.olaylar[k] ? 'checked' : ''}> ${ad}</label>`).join('')}</div>
        <button class="btn" type="button" data-lm="kaydet">Kaydet</button></section>
      <details class="card lm-rehber" open><summary>Kurulum rehberi</summary>
        <p><b>En kolayı: IFTTT + lambanın uygulaması.</b> Philips Hue, Smart Life/Tuya, TP-Link Kasa ve çoğu Wi-Fi lamba IFTTT'ye bağlanır.</p>
        <ol><li>IFTTT'de yeni bir applet: <i>If</i> → <b>Webhooks</b> → "Receive a web request", olay adı <code>fiyonk</code>.</li>
          <li><i>Then</i> → lambanın servisi → "Blink lights" ya da "Change color" (pembe, sonra eski hâline dön).</li>
          <li>Webhooks ayarlarındaki anahtarla adres: <code>https://maker.ifttt.com/trigger/fiyonk/with/key/ANAHTAR</code>. Yukarıya yapıştır, Kaydet, "Şimdi yakıp söndür".</li></ol>
        <p><b>Home Assistant varsa:</b> bir otomasyon tetikleyicisi olarak "Webhook" seç; adres <code>https://SENIN-HA-ADRESIN/api/webhook/fiyonk</code>. Eylem: lambayı pembe yak, 2 saniye sonra eski hâline getir.</p>
        <p class="muted small">Adres kalenin mühürlü kasasında durur; yalnızca ikiniz görürsünüz. Lamba en fazla 20 saniyede bir yanar.</p></details>`;
  }
  K.room({
    id: 'lamba',
    wing: 'kalp',
    title: 'Fiyonk Lambası',
    sub: 'Seni düşündüğümde odanda bir ışık',
    icon: 'lamp',
    color: '#FFE3EC',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bakü'deki odada gerçek bir lamba: "seni düşünüyorum" dendiğinde bir kez pembe yanıp söner. Ekrana bakmasa bile bilir.</p></div><div id="lmIcerik"></div>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-lm]');
        if (!b) return;
        if (b.dataset.lm === 'dene') {
          const ok = await yak('deneme');
          K.fx.toast(ok ? '✨ İstek gönderildi. Lamba yanıp söndüyse her şey hazır.' : 'İstek gönderilemedi; adresi kontrol et.');
        }
        if (b.dataset.lm === 'kaydet') {
          const olaylar = {};
          K.$$('[data-lm-olay]', root).forEach((c) => (olaylar[c.dataset.lmOlay] = c.checked));
          const yeni = { url: K.$('#lmUrl', root).value.trim(), yontem: K.$('#lmYontem', root).value, govde: K.$('#lmGovde', root).value.trim(), olaylar, kimin: K.$('#lmKimin', root).value };
          if (yeni.url && !/^https:\/\//.test(yeni.url)) return K.fx.toast('Adres https:// ile başlamalı.');
          await K.cloud.add('lamba', yeni);
          ayar = yeni;
          K.stickers.award('lamba');
          K.fx.toast('💡 Lamba ayarlandı.');
          ciz();
        }
      });
    },
    async enter() {
      await yukle();
      ciz();
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    sar();
    await yukle();
    K.cloud.on('lamba', (r) => (ayar = r.data));
  });
  K.lamba = { yak, ayar: () => ayar };
})();
