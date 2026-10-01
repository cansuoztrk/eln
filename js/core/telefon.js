/* Kale 2.0 — Telefonuna bildirim: Eln'in iPhone'una ntfy uygulamasıyla anında bildirim.
   Ardoş bir şey gönderince (dürt, sarıl, zamanlı sürpriz, hikâye, beyaz bayrak, kalpten mektup...) kilit ekranına düşer.
   Kurulum üç adım: App Store'dan ntfy → kanala abone ol → deneme gönder. "Geldi" denince Ardoş'a haber gider.
   Kale sahibi kendi panelinden onun kurulumunu görür ve deneme gönderebilir. Kayıt: ntfyok {} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const APP = 'https://apps.apple.com/app/ntfy/id1625396347';
  const PLAY = 'https://play.google.com/store/apps/details?id=io.heckel.ntfy';
  const isAndroid = /Android/i.test(navigator.userAgent);
  const BL = () => D.bildirim || { steps: [] };
  let oks = [];
  const okRow = () => oks.filter((r) => r.who === 'her').sort((a, b) => a.at - b.at).pop();
  const done = () => Boolean(okRow() || K.store.get('telOk'));

  function sheet() {
    if (K.isOwner()) return ownerSheet();
    const topic = C.ntfyTopicHer;
    if (!topic) return K.fx.toast('Bildirim kanalı henüz ayarlanmadı.');
    const st = BL().steps || [];
    const m = K.ui.modal({
      label: BL().title || 'Telefonuna bildirim',
      cls: 'tel-sheet',
      html: `<div class="tel-phone" aria-hidden="true"><p class="tel-clock">${K.esc(K.time.hm(C.tzBaku))}</p>
          <div class="tel-notif"><span class="tel-app">${A.icon('bow')}</span><div><b>🕊️ ${K.esc(C.myPet)} beyaz bayrak kaldırdı</b><small>Köprünün yarısı indi. Öbür yarısı sende.</small></div><small class="tel-now">şimdi</small></div>
          <div class="tel-notif two"><span class="tel-app">${A.icon('bow')}</span><div><b>🎁 ${K.esc(K.ek(C.myPet, 'den'))} zamanlı bir sürpriz</b><small>Mühür açıldı; zarf seni bekliyor.</small></div></div></div>
        <p class="card-eyebrow">${isAndroid ? 'Android' : 'iPhone'} · ntfy</p><h2>${K.esc(BL().title || '')}</h2><p class="muted">${K.esc(K.fill(BL().text || ''))}</p>
        <ol class="tel-steps">
          <li><b>1</b><div><p>${K.esc(st[0] || '')}</p><a class="btn soft small" href="${isAndroid ? PLAY : APP}" target="_blank" rel="noopener">${A.ui('download')} ${isAndroid ? 'Google Play\'de aç' : 'App Store\'da aç'}</a></div></li>
          <li><b>2</b><div><p>${K.esc(st[1] || '')}</p><div class="tel-topic"><code>${K.esc(topic)}</code><button type="button" class="btn red small" data-tel-copy>${A.ui('copy')} Kopyala</button></div><small class="muted">Sunucu ntfy.sh olarak kalsın; başka bir şeyi değiştirme.</small></div></li>
          <li><b>3</b><div><p>${K.esc(st[2] || '')}</p><div class="row"><button type="button" class="btn soft small" data-tel-test>${A.ui('send')} Deneme gönder</button><button type="button" class="btn red small" data-tel-ok>${A.ui('check')} Geldi</button></div></div></li>
        </ol>
        <p class="muted small">Uygulama bildirim izni isterse "İzin Ver" de. Bildirime dokununca kale açılır. Kanal adı sadece sende ve onda; kimseyle paylaşma.</p>
        ${K.kisayol ? '<button type="button" class="btn ghost small ky-link" data-tel-siri>🗣️ Bonus: Siri ile Sarıl kestirmesi</button>' : ''}`,
    });
    K.store.set('telLater', Date.now() + 3 * 864e5);
    m.body.addEventListener('click', async (e) => {
      if (e.target.closest('[data-tel-siri]')) return m.close(), setTimeout(() => K.kisayol.open(), 320);
      if (e.target.closest('[data-tel-copy]')) {
        const ok = await K.copy(topic);
        return K.fx.toast(ok ? 'Kopyalandı. Şimdi ntfy\'da "+" ile yapıştır.' : 'Kopyalanamadı; kanal adını elle yaz.', { duration: 3000 });
      }
      const t = e.target.closest('[data-tel-test]');
      if (t) {
        t.disabled = true;
        const ok = await K.pingSelf('Kale sana ulaşıyor 💗', `Bu bir deneme. ${C.myPet} bir şey gönderince böyle gelecek.`, ['heart']);
        t.disabled = false;
        return K.fx.toast(ok ? 'Gönderildi. Telefonuna birkaç saniye içinde düşer.' : 'Gönderilemedi. İnternet bağlantını kontrol et.', { duration: 3500 });
      }
      if (e.target.closest('[data-tel-ok]')) {
        K.store.set('telOk', Date.now());
        if (K.cloud && K.cloud.enabled) {
          const r = await K.cloud.add('ntfyok', { ua: isAndroid ? 'android' : 'ios' });
          if (r) oks.push(r);
        }
        K.notify(`📱 ${C.herName} telefon bildirimlerini açtı`, 'Artık sen bir şey gönderince onun kilit ekranına düşecek.', ['iphone']);
        m.close();
        K.audio.sfx.success();
        K.stickers.award('telefon');
        K.fx.toast(`📱 <b>Tamam!</b> Artık ${K.esc(C.myPet)} bir şey gönderince telefonuna düşecek.`, { duration: 4500 });
        K.zil && K.zil.badge();
        K.renderSpecials && K.renderSpecials();
      }
    });
  }
  function ownerSheet() {
    const r = okRow();
    const m = K.ui.modal({
      label: 'Telefon bildirimleri',
      cls: 'tel-sheet',
      html: `<p class="card-eyebrow">${K.esc(K.ek(C.herPet, 'in'))} telefonu</p><h2>${r ? 'Bildirimler açık ✓' : 'Henüz kurulmadı'}</h2>
        <p class="muted">${r ? `${K.esc(K.ago(r.at))} kurdu. Sen dürtünce, sarılınca, sürpriz, hikâye ya da Barış Köprüsü'nden bir şey gönderince ${K.esc(K.ek(C.herPet, 'in'))} kilit ekranına düşüyor.` : `Ana salonunda ona bir kurulum kartı çıkıyor (App Store'dan ntfy, bir kanal adı, bir deneme). Kurunca burada görürsün.`}</p>
        <div class="row"><button type="button" class="btn soft small" data-tel-test>${A.ui('send')} Ona deneme gönder</button>${K.kisayol ? '<button type="button" class="btn ghost small" data-tel-siri>🗣️ Siri ile Sarıl</button>' : ''}</div>`,
    });
    m.body.addEventListener('click', async (e) => {
      if (e.target.closest('[data-tel-siri]')) return m.close(), setTimeout(() => K.kisayol.open(), 320);
      if (!e.target.closest('[data-tel-test]')) return;
      const ok = await K.pingHer(`${C.myPet} sana el sallıyor 👋`, 'Kale bildirimleri çalışıyor.', ['wave']);
      K.fx.toast(ok ? 'Gönderildi. Kurduysa telefonuna düştü.' : 'Gönderilemedi.', { duration: 3000 });
    });
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    oks = await K.cloud.list('ntfyok', 10);
    K.cloud.on('ntfyok', (r) => {
      if (oks.some((x) => x.id === r.id)) return;
      oks.push(r);
      if (K.isOwner() && r.who === 'her') K.fx.toast(`📱 <b>${K.esc(K.ek(C.herPet, 'in'))} telefonu artık bildirim alıyor.</b>`, { duration: 7000 });
    });
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (K.isOwner() || !C.ntfyTopicHer || done() || K.store.get('telLater', 0) > Date.now()) return [];
    return [{ icon: 'bow', title: `📱 ${C.myPet} bir şey gönderince telefonuna düşsün`, text: 'Dürtünce, sarılınca, sürpriz bırakınca, beyaz bayrak kaldırınca. Üç adımlık kurulum, bir dakika sürer.', run: sheet, cta: 'Kur' }];
  });
  K.telefon = { sheet, done };
})();
