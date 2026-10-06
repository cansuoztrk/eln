/* Kale 2.0 — Siri ile Sarıl: telefonun Kestirmeler uygulamasıyla tek dokunuşluk (ya da "Hey Siri, ...'a sarıl") bir
   sarılma. Kestirme ntfy.sh'e doğrudan JSON gönderir; kale açık olmasa bile öbürünün kilit ekranına düşer.
   Rehber: adımlar + kopyalanacak adres ve alanlar (iPhone) ya da hazır JSON (Android). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const KY = () => D.kisayol || { title: 'Siri ile Sarıl', iphone: [], android: [] };
  const isAndroid = /Android/i.test(navigator.userAgent);
  const myPet = () => (K.isOwner() ? C.myPet : C.herPet);
  const otherPet = () => (K.isOwner() ? C.herPet : C.myPet);
  const topic = () => (K.isOwner() ? C.ntfyTopicHer : C.ntfyTopic);
  // Ekli kalıplar K.fill'den önce: {otherPet} ondan sonra düz ada dönüşüyor
  const fillP = (s) =>
    K.fill(
      String(s || '')
        .replace(/\{otherPet\}'a/g, K.ek(otherPet(), 'e'))
        .replace(/\{otherPet\}'ın/g, K.ek(otherPet(), 'in'))
        .replace(/\{otherPet\}/g, otherPet())
        .replace(/\{mePet\}/g, myPet())
    );
  const fields = () => [
    ['topic', topic()],
    ['title', fillP(KY().titleText || '🤗 {mePet} sana sarıldı')],
    ['message', fillP(KY().message || '')],
    ['click', K.roomUrl('')],
  ];
  const json = () => JSON.stringify(Object.assign(Object.fromEntries(fields()), { tags: ['hugging_face'], priority: 4 }), null, 2);

  function open() {
    if (!topic()) return K.fx.toast('Bildirim kanalı henüz ayarlanmadı.');
    K.kalp && K.kalp.closeMenu && K.kalp.closeMenu();
    let os = isAndroid ? 'android' : 'iphone';
    const m = K.ui.modal({
      label: KY().title,
      cls: 'ky-sheet',
      html: `<div class="ky-hero" aria-hidden="true"><span class="ky-wave"><i></i><i></i><i></i></span><b>“Hey Siri, ${K.esc(K.ek(otherPet(), 'e'))} sarıl”</b></div>
        <h2>${K.esc(KY().title)}</h2><p class="muted">${K.esc(fillP(KY().text))}</p>
        <div class="ky-os" role="tablist"><button type="button" role="tab" data-ky-os="iphone">iPhone</button><button type="button" role="tab" data-ky-os="android">Android</button></div>
        <div data-ky-body></div>
        <div class="row"><button type="button" class="btn soft small" data-ky-test>${A.ui('send')} Şimdi bir sarılma gönder</button></div>
        <p class="muted small">Kanal adı yalnızca ikinizde; kestirmeyi kimseyle paylaşma.</p>`,
    });
    const body = K.$('[data-ky-body]', m.body);
    const copyRow = (label, val, i) => `<div class="ky-field"><small>${K.esc(label)}</small><code>${K.esc(val)}</code><button type="button" class="btn ghost small" data-ky-copy="${i}">${A.ui('copy')}<span class="sr-only">Kopyala</span></button></div>`;
    function draw() {
      K.$$('[data-ky-os]', m.body).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.kyOs === os)));
      const steps = (os === 'iphone' ? KY().iphone : KY().android) || [];
      const vals = os === 'iphone' ? [['URL', 'https://ntfy.sh/'], ...fields().map(([k, v]) => [`Anahtar: ${k} · Tür: Metin`, v])] : [['URL', 'https://ntfy.sh/'], ['İstek gövdesi (JSON)', json()]];
      body._vals = vals.map((x) => x[1]);
      body.innerHTML = `<ol class="ky-steps">${steps.map((s, i) => `<li><b>${i + 1}</b><p>${K.esc(fillP(s))}</p></li>`).join('')}</ol>
        <div class="ky-fields">${vals.map(([l, v], i) => copyRow(l, v, i)).join('')}</div>`;
    }
    draw();
    m.body.addEventListener('click', async (e) => {
      const o = e.target.closest('[data-ky-os]');
      if (o) {
        os = o.dataset.kyOs;
        return draw();
      }
      const c = e.target.closest('[data-ky-copy]');
      if (c) {
        const ok = await K.copy(body._vals[+c.dataset.kyCopy]);
        return K.fx.toast(ok ? 'Kopyalandı.' : 'Kopyalanamadı; elle seç.', { duration: 1800, log: false });
      }
      const t = e.target.closest('[data-ky-test]');
      if (t) {
        t.disabled = true;
        const f = Object.fromEntries(fields());
        const ok = await K.ping(f.title, f.message, ['hugging_face']);
        t.disabled = false;
        K.fx.toast(ok ? `🤗 Gönderildi. Kestirme de tam olarak bunu yapacak.` : 'Gönderilemedi.', { duration: 3000 });
      }
    });
  }
  // NFC Anahtarlık: bir NFC etiketine dokununca telefon ona "sana sarıldı" gönderir (iPhone Kestirmeler otomasyonu)
  function nfc() {
    if (!topic()) return K.fx.toast('Bildirim kanalı henüz ayarlanmadı.');
    const NF = D.nfc || {};
    const steps = NF.steps || [
      'Bir NFC etiketi al (NTAG213 yazan küçük yuvarlak çıkartmalar; kırtasiyede ya da internette birkaç liraya). Anahtarlığına, yastığına ya da telefon kılıfına yapıştır.',
      'iPhone\'da Kestirmeler uygulamasını aç → alttan Otomasyon → sağ üstte + → NFC.',
      '"Tara"ya dokun, etiketi telefonun üst arkasına yaklaştır. Adını "{otherPet}\'a sarıl" koy.',
      '"Hemen Çalıştır"ı seç ve "Çalıştırınca bildir"i kapat; böylece sormadan gönderir.',
      'Yeni boş kestirme → Eylem ekle → "URL\'nin İçeriğini Al". URL olarak aşağıdakini yapıştır.',
      'Yöntem: POST, İstek Gövdesi: JSON. Aşağıdaki her alanı "Metin" türünde, anahtarıyla birlikte ekle.',
      'Bitti. Artık etikete dokununca {otherPet}\'ın telefonuna sarılman düşer.',
    ];
    const vals = [['URL', 'https://ntfy.sh/'], ...fields().map(([k, v]) => [`Anahtar: ${k} · Tür: Metin`, k === 'title' ? fillP(NF.title || '🏷️ {mePet} anahtarlığa dokundu: sana sarıldı') : v])];
    const m = K.ui.modal({
      label: 'NFC Anahtarlık',
      cls: 'ky-sheet nfc-sheet',
      html: `<div class="ky-hero nfc-hero" aria-hidden="true"><span class="nfc-tag">🏷️</span><span class="ky-wave"><i></i><i></i><i></i></span><b>Dokun, sarılsın</b></div>
        <h2>NFC Anahtarlık</h2><p class="muted">${K.esc(fillP(NF.text || 'Küçük bir etikete telefonunu dokundurunca {otherPet}\'ın kilit ekranına "sana sarıldı" düşer. Kale açık olmasa bile çalışır.'))}</p>
        <ol class="ky-steps">${steps.map((x, i) => `<li><b>${i + 1}</b><p>${K.esc(fillP(x))}</p></li>`).join('')}</ol>
        <div class="ky-fields">${vals.map(([l, v], i) => `<div class="ky-field"><small>${K.esc(l)}</small><code>${K.esc(v)}</code><button type="button" class="btn ghost small" data-nfc-copy="${i}">${A.ui('copy')}<span class="sr-only">Kopyala</span></button></div>`).join('')}</div>
        <p class="muted small">Android'de "NFC Tools" uygulamasıyla etikete aynı isteği yazabilirsin. Kanal adı yalnız ikinizde; kimseyle paylaşma.</p>`,
    });
    m.body.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-nfc-copy]');
      if (!c) return;
      const ok = await K.copy(vals[+c.dataset.nfcCopy][1]);
      K.fx.toast(ok ? 'Kopyalandı.' : 'Kopyalanamadı; elle seç.', { duration: 1600, log: false });
      ok && K.stickers.award('nfc');
    });
  }
  K.kisayol = { open, nfc };
})();
