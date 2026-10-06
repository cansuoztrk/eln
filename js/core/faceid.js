/* Kale 2.0 — Face ID ile Giriş: kasa anahtarı telefonun geçiş anahtarına (passkey) bağlanır.
   - Destekleyen telefonlarda (iPhone, iOS 17 ve sonrası) anahtarın kendisi passkey'in içinde saklanır (largeBlob):
     tarayıcı verileri silinse bile kale Face ID ile yeniden açılır, şifreyi hatırlamak gerekmez.
   - Olmazsa passkey'den türetilen gizli bir anahtarla (PRF) bu cihazdaki kayıt şifrelenir.
   - İstenirse "Kale her açılışta Face ID sorsun": telefonu başkası açsa bile kale kilitli kalır.
   Şifre hiçbir yere gitmez; passkey yalnız bu telefonda (ve aynı Apple hesabının anahtar zincirinde) durur. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (u8) => btoa(String.fromCharCode.apply(null, new Uint8Array(u8))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const rnd = (n) => crypto.getRandomValues(new Uint8Array(n));
  const st = () => K.store.get('faceid', null);
  const PRF_SALT = enc.encode('eln-krallik-faceid-prf-v1-------').slice(0, 32);

  async function supported() {
    try {
      return Boolean(window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()));
    } catch (e) {
      return false;
    }
  }
  async function prfKey(bytes) {
    return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  const getOpts = (id, ext) => ({
    publicKey: {
      challenge: rnd(32),
      rpId: location.hostname,
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: id ? [{ type: 'public-key', id: unb64(id) }] : [],
      extensions: ext,
    },
  });

  // Kurulum: kale açıkken (kasa anahtarı elde) çağrılır
  async function setup() {
    const saved = K.vault.saved();
    if (!K.vault.ok || !saved) throw new Error('kale-kilitli');
    const who = K.isOwner() ? C.myPet : C.herPet;
    const cred = await navigator.credentials.create({
      publicKey: {
        rp: { name: `${C.herName}'in Krallığı`, id: location.hostname },
        user: { id: rnd(16), name: who, displayName: who },
        challenge: rnd(32),
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', requireResidentKey: true, userVerification: 'required' },
        timeout: 60000,
        extensions: { largeBlob: { support: 'preferred' }, prf: {} },
      },
    });
    if (!cred) throw new Error('iptal');
    const id = b64(cred.rawId);
    const ext = (cred.getClientExtensionResults && cred.getClientExtensionResults()) || {};
    const payload = enc.encode(JSON.stringify(saved));
    if (ext.largeBlob && ext.largeBlob.supported) {
      const a = await navigator.credentials.get(getOpts(id, { largeBlob: { write: payload } }));
      const e2 = (a && a.getClientExtensionResults()) || {};
      if (e2.largeBlob && e2.largeBlob.written) {
        K.store.set('faceid', { id, mode: 'blob', lock: (st() || {}).lock || false, at: Date.now() });
        return 'blob';
      }
    }
    const a = await navigator.credentials.get(getOpts(id, { prf: { eval: { first: PRF_SALT } } }));
    const e3 = (a && a.getClientExtensionResults()) || {};
    const out = e3.prf && e3.prf.results && e3.prf.results.first;
    if (!out) throw new Error('desteklenmiyor');
    const key = await prfKey(new Uint8Array(out).slice(0, 32));
    const iv = rnd(12);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload));
    K.store.set('faceid', { id, mode: 'prf', iv: b64(iv), ct: b64(ct), lock: (st() || {}).lock || false, at: Date.now() });
    return 'prf';
  }
  // Açılış: kayıtlı passkey'le (ya da veriler silindiyse telefonun önerdiği passkey'le) kasa anahtarını geri al
  async function unlock() {
    const s = st();
    const ext = s && s.mode === 'prf' ? { prf: { eval: { first: PRF_SALT } } } : { largeBlob: { read: true }, prf: { eval: { first: PRF_SALT } } };
    const a = await navigator.credentials.get(getOpts(s && s.id, ext));
    if (!a) return false;
    const e = a.getClientExtensionResults() || {};
    let saved = null;
    if (e.largeBlob && e.largeBlob.blob) saved = JSON.parse(dec.decode(e.largeBlob.blob));
    else if (s && s.mode === 'prf' && e.prf && e.prf.results && e.prf.results.first) {
      const key = await prfKey(new Uint8Array(e.prf.results.first).slice(0, 32));
      saved = JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(s.iv) }, key, unb64(s.ct))));
    }
    if (!saved) return false;
    if (!s) K.store.set('faceid', { id: b64(a.rawId), mode: 'blob', lock: false, at: Date.now() });
    if (K.vault.ok) return true;
    return K.vault.fromSaved(saved);
  }
  // Kilit açıkken yalnız doğrulama (kale zaten açık; "her açılışta sor" için)
  async function verify() {
    const s = st();
    if (!s) return true;
    try {
      const a = await navigator.credentials.get(getOpts(s.id, {}));
      return Boolean(a);
    } catch (e) {
      return false;
    }
  }
  function sheet() {
    const s = st();
    const m = K.ui.modal({
      label: 'Face ID ile Giriş',
      cls: 'fi-sheet',
      html: `<div class="fi-hero" aria-hidden="true"><span class="fi-yuz"><i></i><i></i><b></b></span>${A.kitty({ cls: 'fi-k', eyes: 'wink' })}</div>
        <h2>Face ID ile Giriş</h2>
        <p class="muted">Kalenin anahtarı telefonunun geçiş anahtarına bağlanır. Bir daha şifre yazman gerekmez; tarayıcı verileri silinse bile kale Face ID ile açılır. Şifren hiçbir yere gönderilmez.</p>
        <div data-fi-body></div>`,
    });
    const body = K.$('[data-fi-body]', m.body);
    const draw = async () => {
      const cur = st();
      if (!(await supported())) {
        body.innerHTML = '<p class="fi-not">Bu telefonda Face ID ya da parmak izi web siteleri için açık değil. iPhone\'da: Ayarlar → Face ID ve Parola, ve Safari\'yi güncel tut.</p>';
        return;
      }
      body.innerHTML = cur
        ? `<p class="fi-ok">🔐 Kuruldu · ${cur.mode === 'blob' ? 'anahtar passkey\'in içinde' : 'bu telefonda şifreli'}</p>
          <label class="at-tg"><span><b>Her açılışta Face ID sorsun</b><small>Telefonu başkası açsa bile kale kilitli kalır</small></span><input type="checkbox" data-fi-lock ${cur.lock ? 'checked' : ''}><i aria-hidden="true"></i></label>
          <div class="row"><button type="button" class="btn soft small" data-fi-test>Dene</button><button type="button" class="btn ghost small" data-fi-del>Kaldır</button></div>`
        : `<div class="row"><button type="button" class="btn red" data-fi-kur>🔐 Face ID'yi kur</button></div><p class="muted small">Telefon bir kez Face ID soracak, sonra bir kez daha (anahtarı kaydetmek için).</p>`;
    };
    draw();
    m.body.addEventListener('click', async (e) => {
      if (e.target.closest('[data-fi-kur]')) {
        try {
          const mode = await setup();
          K.audio.sfx.success();
          K.fx.confetti({ count: 60 });
          K.stickers.award('faceid');
          K.fx.toast(mode === 'blob' ? '🔐 Face ID kuruldu. Anahtar artık passkey\'in içinde.' : '🔐 Face ID kuruldu.', { duration: 3200 });
        } catch (err) {
          K.fx.toast(/desteklenmiyor/.test(err && err.message) ? 'Bu telefon passkey\'e anahtar saklamayı desteklemiyor.' : 'Face ID kurulamadı ya da iptal edildi.', { duration: 3400 });
        }
        return draw();
      }
      if (e.target.closest('[data-fi-test]')) {
        const ok = await verify();
        K.fx.toast(ok ? '✅ Face ID çalışıyor.' : 'Doğrulanamadı.', { duration: 2200 });
        return;
      }
      if (e.target.closest('[data-fi-del]')) {
        K.store.del('faceid');
        K.fx.toast('Face ID kaldırıldı. (Passkey\'i iPhone Ayarlar → Parolalar\'dan da silebilirsin.)', { duration: 4200 });
        return draw();
      }
    });
    m.body.addEventListener('change', (e) => {
      const c = e.target.closest('[data-fi-lock]');
      if (!c) return;
      const cur = st();
      cur && K.store.set('faceid', Object.assign(cur, { lock: c.checked }));
    });
  }
  // Kurulum önerisi: Face ID destekleyen telefonda, kurulmamışsa ana salonda bir kez
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (st() || K.store.get('faceidOneri') || !window.PublicKeyCredential || K.previewDate) return [];
    return [{ key: 'faceid', icon: 'key', title: '🔐 Kale Face ID ile açılsın mı?', text: 'Şifreyi bir daha yazmana gerek kalmaz; telefonun verileri silinse bile kale seni tanır.', run: () => (K.store.set('faceidOneri', 1), sheet()), cta: 'Kur' }];
  });
  K.faceid = { supported, setup, unlock, verify, sheet, state: st, locked: () => Boolean(st() && st().lock) };
})();
