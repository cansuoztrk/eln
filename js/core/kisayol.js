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
  const fillP = (s) =>
    K.fill(String(s || ''))
      .replace(/\{otherPet\}'a/g, K.ek(otherPet(), 'e'))
      .replace(/\{otherPet\}/g, otherPet())
      .replace(/\{mePet\}/g, myPet());
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
  K.kisayol = { open };
})();
