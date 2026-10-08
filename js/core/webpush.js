/* Kalenin Kendi Bildirimleri (Web Push, Faz 30). Ana ekrana eklenmiş kale (iOS 16.4+) doğrudan iPhone bildirimi alır;
   ntfy uygulamasına gerek kalmaz. Akış: "Bildirimleri aç" → izin → push aboneliği → /push/abone (Pages işlevi, R2'de
   saklar) → bulutta küçük bir işaret (pushabone) ki öbür telefon "bu kişiye kalenin kendi bildirimiyle yaz" desin.
   Gönderirken: K.ping ve K.ntfyTo sarılır; alıcının push aboneliği varsa bildirim /push/gonder ile gider, ntfy yalnız
   zamanlı (ileri tarihli) bildirimler ve yedek olarak kalır. Kale sahibi VAPID anahtar çiftini buradan üretir.
   Ayar: kasada config.arsivKey (Sonsuz Arşiv ile aynı erişim anahtarı) · Pages gizlileri: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUB.
   Kayıt: pushabone {who, at} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const kok = () => location.pathname.replace(/[^/]*$/, '');
  const yol = (p) => kok() + 'push/' + p;
  const destek = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const anaEkran = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let isaret = { me: 0, her: 0 }, durum = null;

  const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ub = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

  async function hazirMi() {
    if (durum !== null) return durum;
    if (!C.arsivKey) return (durum = false);
    try {
      const r = await fetch(yol('anahtar'), { cache: 'no-store' });
      durum = r.ok ? (await r.text()).trim() : false;
    } catch (e) {
      durum = false;
    }
    return durum;
  }
  async function abone() {
    if (!destek()) return K.fx.toast('Bu tarayıcı kalenin kendi bildirimlerini desteklemiyor. iPhone\'da kaleyi Safari\'den "Ana Ekrana Ekle" ile kurup oradan aç.', { duration: 6000 }), false;
    const pub = await hazirMi();
    if (!pub) return K.fx.toast('Kale bildirim sunucusu henüz kurulmamış. Kale sahibi Kale Paneli\'nden kurabilir.', { duration: 5000 }), false;
    const izin = await Notification.requestPermission();
    if (izin !== 'granted') return K.fx.toast('Bildirim izni verilmedi. Ayarlar → Bildirimler → Eln\'in Krallığı\'ndan açabilirsin.', { duration: 6000 }), false;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: ub(pub) });
    const r = await fetch(yol('abone'), { method: 'POST', headers: { 'content-type': 'application/json', 'x-kale': C.arsivKey }, body: JSON.stringify({ who: mine(), sub: sub.toJSON() }) });
    if (!r.ok) return K.fx.toast('Abonelik kaydedilemedi.'), false;
    K.cloud && K.cloud.enabled && (await K.cloud.add('pushabone', { who: mine() }));
    K.store.set('webpushAcik', true);
    K.stickers.award('webpush');
    K.fx.toast('🔔 <b>Kalenin kendi bildirimleri açık.</b> Artık ntfy uygulaması olmadan da haber alırsın.', { duration: 5000 });
    return true;
  }
  // Bildirimi kalenin kendi yolundan gönder; olmazsa false (çağıran ntfy'ye düşer)
  async function gonder(to, title, body, extra = {}) {
    if (!isaret[to] || !C.arsivKey) return false;
    try {
      const url = extra.click ? String(extra.click).replace(location.origin, '') : kok();
      const r = await fetch(yol('gonder'), { method: 'POST', headers: { 'content-type': 'application/json', 'x-kale': C.arsivKey }, body: JSON.stringify({ to, title, body, url, tag: extra.tag || '', acil: (extra.priority || 0) >= 5 }) });
      const j = r.ok ? await r.json() : null;
      return Boolean(j && j.ok);
    } catch (e) {
      return false;
    }
  }
  // K.ping (öbürüne) ve K.ntfyTo (belirli kişiye) sarılır: anında olanlar önce kalenin kendi yolundan
  function sar() {
    if (K._webpushSarildi || !K.ping) return;
    K._webpushSarildi = true;
    const ping0 = K.ping, to0 = K.ntfyTo;
    K.ping = (title, msg, tags, extra) => {
      const x = extra || {};
      if (x.delay) return ping0(title, msg, tags, extra);
      const to = mine() === 'me' ? 'her' : 'me';
      return gonder(to, title, msg, x).then((ok) => (ok ? true : ping0(title, msg, tags, extra)));
    };
    K.ntfyTo = (who, title, msg, tags, extra) => {
      const x = extra || {};
      if (x.delay) return to0(who, title, msg, tags, extra);
      return gonder(who, title, msg, x).then((ok) => (ok ? true : to0(who, title, msg, tags, extra)));
    };
  }
  /* ---------- Kale sahibi: VAPID anahtar çifti üret ---------- */
  async function anahtarUret() {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = b64u(await crypto.subtle.exportKey('raw', kp.publicKey));
    const prv = JSON.stringify(await crypto.subtle.exportKey('jwk', kp.privateKey));
    return { pub, prv };
  }
  async function sheet() {
    const hazir = await hazirMi();
    const acik = destek() && Notification.permission === 'granted' && K.store.get('webpushAcik');
    const m = K.ui.modal({
      label: 'Kalenin kendi bildirimleri',
      cls: 'wp-sheet',
      html: `<p class="card-eyebrow">Bildirimler</p><h2>Kalenin kendi bildirimleri</h2>
        <p>Kale, ana ekrana eklenmiş hâliyle iPhone'a doğrudan bildirim gönderir. ntfy uygulaması gerekmez; zamanlı hatırlatmalar yine de ntfy'den de gelebilir.</p>
        <ul class="wp-durum"><li>${destek() ? '✓' : '✕'} Tarayıcı destekliyor</li><li>${anaEkran() ? '✓' : '•'} Ana ekrandan açıldı ${anaEkran() ? '' : '<small>(iPhone\'da şart: Safari → Paylaş → Ana Ekrana Ekle)</small>'}</li><li>${hazir ? '✓' : '✕'} Kale sunucusu hazır</li>
          <li>${isaret[mine()] ? '✓' : '•'} Sen abonesin</li><li>${isaret[mine() === 'me' ? 'her' : 'me'] ? '✓' : '•'} ${K.esc(nameOf(mine() === 'me' ? 'her' : 'me'))} abone</li></ul>
        <button class="btn" type="button" data-wp="ac" ${hazir && destek() ? '' : 'disabled'}>${acik ? 'Aboneliği yenile' : '🔔 Bildirimleri aç'}</button>
        ${acik ? '<button class="btn ghost small" type="button" data-wp="dene">Kendime deneme bildirimi</button>' : ''}
        ${K.isOwner() ? `<details class="wp-kur"><summary>Kale sahibi: sunucuyu kur</summary><ol class="small"><li>Önce Sonsuz Arşiv (R2) kurulu olmalı: ARSIV bağı ve ARSIV_KEY.</li><li>Aşağıdan bir anahtar çifti üret.</li><li>Cloudflare → Pages → kale → Settings → Variables and Secrets: <code>VAPID_PUBLIC</code>, <code>VAPID_PRIVATE</code> (gizli), <code>VAPID_SUB</code> = mailto:adresin. Kaydet ve yeniden yayınla.</li></ol>
          <button class="btn soft small" type="button" data-wp="uret">Anahtar çifti üret</button><div id="wpAnahtar"></div></details>` : ''}`,
    });
    m.el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-wp]');
      if (!b) return;
      if (b.dataset.wp === 'ac') (await abone()) && m.close();
      if (b.dataset.wp === 'dene') {
        isaret[mine()] = isaret[mine()] || Date.now();
        const ok = await gonder(mine(), '🔔 Deneme', 'Kalenin kendi bildirimi çalışıyor.', { click: K.roomUrl('') });
        K.fx.toast(ok ? 'Gönderildi; birkaç saniyede gelmeli.' : 'Gönderilemedi.');
      }
      if (b.dataset.wp === 'uret') {
        const k = await anahtarUret();
        K.$('#wpAnahtar', m.el).innerHTML = `<label class="small">VAPID_PUBLIC<textarea class="textarea" rows="2" readonly>${K.esc(k.pub)}</textarea></label><label class="small">VAPID_PRIVATE (gizli tut)<textarea class="textarea" rows="4" readonly>${K.esc(k.prv)}</textarea></label><p class="muted small">Bu anahtarlar yalnız bu ekranda üretildi; hiçbir yere gönderilmedi.</p>`;
      }
    });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    const l = await K.cloud.list('pushabone', 30);
    l.forEach((r) => (isaret[r.data.who] = Math.max(isaret[r.data.who] || 0, r.at)));
    K.cloud.on('pushabone', (r) => (isaret[r.data.who] = r.at));
    sar();
  });
  K.webpush = { abone, gonder, sheet, hazirMi, destek, anahtarUret, isaret: () => isaret };
})();
