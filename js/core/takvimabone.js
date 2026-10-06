/* Kale 2.0 — Takvim Aboneliği: kalenin takvimi telefonun Takvim uygulamasına abone olur. Her 21'i ("N. ayımız"),
   yıldönümü, tanışma günü, doğum günleri, tarihli sözler, ikinizin sınavları, dolunaylar ve yıldız kayması geceleri,
   yılbaşının iki gece yarısı orada kendiliğinden görünür ve güncellenir.
   Nasıl: ikinize ortak rastgele bir takvim anahtarı (bulutta kasa anahtarıyla mühürlü 'takvimkey' kaydı). Kale açılınca
   günde bir kez etkinlik paketini bu anahtarla şifreleyip buluta koyar ('takvimpub', ham kayıt); yeni adresin sunucu
   işlevi (functions/takvim.js) paketi anahtarla çözüp .ics olarak verir. Anahtar yalnız abonelik adresinde durur. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const b64u = (u8) => btoa(String.fromCharCode.apply(null, u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64 = (u8) => {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  };
  let keyRow = null, loaded = false;
  const ok = () => Boolean(K.cloud && K.cloud.enabled && K.cloud.raw);

  async function ensureKey() {
    if (keyRow) return keyRow.data.k;
    const k = b64u(crypto.getRandomValues(new Uint8Array(32)));
    const r = await K.cloud.add('takvimkey', { k });
    if (r) keyRow = r;
    return r ? k : null;
  }
  function link(k) {
    const r = K.cloud.raw;
    const tok = b64u(new TextEncoder().encode(JSON.stringify({ u: r.url, a: r.key, s: r.space, k })));
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    return { https: `${base}takvim?t=${tok}`, webcal: `${base.replace(/^https?:/, 'webcal:')}takvim?t=${tok}` };
  }
  // Etkinlikler
  const plusMonths = (y, m, d, n) => `${y + Math.floor((m - 1 + n) / 12)}-${K.pad(((m - 1 + n) % 12) + 1)}-${K.pad(d)}`;
  async function events() {
    const out = [];
    const today = T.todayKey();
    const site = location.origin + location.pathname;
    if (C.togetherDate) {
      const [y0, m0, d0] = C.togetherDate.split('-').map(Number);
      const n0 = T.monthsTogether();
      for (let i = 0; i <= 13; i++) {
        const n = n0 + i;
        if (n < 1) continue;
        const day = plusMonths(y0, m0, d0, n);
        if (day < today) continue;
        const year = n % 12 === 0;
        out.push({ uid: `ay-${n}`, allDay: true, start: day, title: year ? `💗 ${n / 12}. yılımız` : `💗 ${n}. ayımız`, desc: `${C.myPet} ve ${C.herPet}: bir ay daha. Kalede bugün bir sahne var.`, url: site, alarm: '-PT0H' });
      }
    }
    const yearly = (uid, mmdd, title, desc) => mmdd && out.push({ uid, allDay: true, start: `${T.nextAnnual(mmdd).year}-${mmdd}`, rrule: 'FREQ=YEARLY', title, desc });
    C.togetherDate && yearly('yildonumu', C.togetherDate.slice(5), '💞 Yıldönümümüz', 'Sevgili olduğumuz gün.');
    C.metDate && yearly('tanisma', C.metDate.slice(5), '✨ Tanıştığımız gün', 'Her şeyin başladığı gün.');
    C.herBirthday && yearly('dg-her', C.herBirthday, `🎂 ${K.ek(C.herPet, 'in')} doğum günü`, 'Kale bugün onun için süslenir.');
    C.myBirthday && yearly('dg-me', C.myBirthday, `🎂 ${K.ek(C.myPet, 'in')} doğum günü`, 'Ters Kale açılır.');
    // Tarihli sözler (tutulmamışlar)
    try {
      const [sz, tut] = await Promise.all([K.cloud.list('soz', 500), K.cloud.list('soztut', 500)]);
      const kept = new Set(tut.map((r) => r.data.ref || r.data.id));
      sz.filter((r) => r.data.due && r.data.due >= today && !kept.has(r.id)).forEach((r) => out.push({ uid: `soz-${r.id}`, allDay: true, start: r.data.due, title: `🤞 ${nameOf(r.who)}: ${r.data.text}`, desc: 'Söz Defteri\'nden.', url: K.roomUrl('soz') }));
    } catch (e) {}
    // Sınavlar (Sınav Kalkanı)
    try {
      (K.kalkan ? K.kalkan.ranges() : []).filter((x) => x[0] >= today).forEach((x, i) => out.push({ uid: `sinav-${x[0]}-${i}`, allDay: true, start: x[0], title: `📚 ${x[2]}`, desc: 'Şans tılsımı göndermeyi unutma.', url: K.roomUrl('kalkan') }));
    } catch (e) {}
    // Gök: dolunaylar ve yıldız kayması geceleri
    if (K.gok) K.gok.fullMoons(Date.now(), 13).forEach((t) => out.push({ uid: `dolunay-${t}`, start: t, end: t + 60 * 60e3, title: '🌕 Dolunay: ikiniz de aynı aya bakın', desc: 'Gök Takvimi\'nde dilek kutusu açılır.', url: K.roomUrl('goktakvimi') }));
    if (K.goktakvimi) K.goktakvimi.showers().forEach((s) => out.push({ uid: `yildiz-${s.key}`, allDay: true, start: s.day, title: `🌠 ${s.name}`, desc: s.desc, url: K.roomUrl('goktakvimi') }));
    // Yılbaşı: önce Bakü, bir saat sonra İstanbul
    const ny = T.baku().y + 1;
    out.push({ uid: `yy-baku-${ny}`, start: Date.UTC(ny, 0, 1) - C.tzBaku * 36e5, end: Date.UTC(ny, 0, 1) - C.tzBaku * 36e5 + 15 * 60e3, title: `🎆 Bakü ${ny}'e girdi`, desc: 'İki Kez Yeni Yıl: önce Bakü.', url: site });
    out.push({ uid: `yy-ist-${ny}`, start: Date.UTC(ny, 0, 1) - C.tzIstanbul * 36e5, end: Date.UTC(ny, 0, 1) - C.tzIstanbul * 36e5 + 15 * 60e3, title: `🎆 İstanbul ${ny}'e girdi`, desc: 'İki Kez Yeni Yıl: ikinci gece yarısı.', url: site });
    return out;
  }
  async function publish(force) {
    if (!ok() || !keyRow) return false;
    const evs = await events();
    const sig = String(K.hash(JSON.stringify(evs)));
    const st = K.store.get('takvimPub', {});
    if (!force && st.day === T.todayKey() && st.sig === sig) return true;
    const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(keyRow.data.k.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)), 'AES-GCM', false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ v: 1, at: Date.now(), name: `${C.herName}'in Krallığı`, events: evs }))));
    const all = new Uint8Array(12 + ct.length);
    all.set(iv);
    all.set(ct, 12);
    const t0 = Date.now();
    if (!(await K.cloud.rawAdd('takvimpub', b64(all)))) return false;
    K.store.set('takvimPub', { day: T.todayKey(), sig, at: t0 });
    K.cloud.rawPrune('takvimpub', t0 - 60e3);
    return true;
  }
  async function sheet() {
    if (!ok()) return K.fx.toast('Takvim aboneliği için ortak kalenin buluta bağlı olması gerekiyor.', { duration: 3200 });
    const m = K.ui.modal({ label: 'Takvim Aboneliği', cls: 'ky-sheet ta-sheet', html: '<p class="muted">Hazırlanıyor...</p>' });
    const k = await ensureKey();
    if (!k) return (m.body.innerHTML = '<p>Takvim anahtarı oluşturulamadı. İnternetini kontrol et.</p>');
    await publish(true);
    const l = link(k);
    const evs = await events();
    m.body.innerHTML = `<div class="ky-hero ta-hero" aria-hidden="true"><span class="ta-cal"><b>21</b><i>${K.esc(K.MONTHS[T.baku().mo - 1])}</i></span><b>Kale takvimin</b></div>
      <h2>Takvim Aboneliği</h2>
      <p class="muted">Telefonunun Takvim uygulamasına bir kez abone ol; ${evs.length} etkinlik (her 21'i, sözler, sınavlar, dolunaylar, yılbaşının iki gece yarısı) orada görünür ve kendiliğinden güncellenir. Adres ikinize özel; kimseyle paylaşma.</p>
      <div class="row"><a class="btn red" href="${K.esc(l.webcal)}">📅 Takvime ekle</a></div>
      <ol class="ky-steps"><li><b>1</b><p>"Takvime ekle"ye dokun, iPhone "Abone ol" diye sorar; onayla.</p></li><li><b>2</b><p>Açılmazsa: Ayarlar → Takvim → Hesaplar → Hesap Ekle → Diğer → Abone Olunan Takvim Ekle → aşağıdaki adresi yapıştır.</p></li><li><b>3</b><p>${K.esc(K.otherName())} da kendi telefonunda aynı adımları yapabilir; takvim ikinizin ortak takvimi.</p></li></ol>
      <div class="ky-fields"><div class="ky-field"><small>Abonelik adresi</small><code>${K.esc(l.https)}</code><button type="button" class="btn ghost small" data-ta-copy>${A.ui('copy')}<span class="sr-only">Kopyala</span></button></div></div>
      <p class="card-eyebrow">Yaklaşanlar</p><ul class="ta-list">${evs
        .filter((e) => (e.allDay ? e.start : T.key(T.baku(new Date(e.start)))) >= T.todayKey())
        .sort((a, b) => String(a.allDay ? a.start : T.key(T.baku(new Date(a.start)))).localeCompare(String(b.allDay ? b.start : T.key(T.baku(new Date(b.start))))))
        .slice(0, 8)
        .map((e) => `<li><small>${K.esc(T.fmtShort(e.allDay ? e.start : new Date(e.start)))}</small><span>${K.esc(e.title)}</span></li>`)
        .join('')}</ul>`;
    m.body.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-ta-copy]')) return;
      const okc = await K.copy(l.https);
      K.fx.toast(okc ? 'Kopyalandı.' : 'Kopyalanamadı; elle seç.', { duration: 1600, log: false });
    });
    K.stickers.award('takvimabone');
  }
  K.on('cloud', async (en) => {
    if (!en || !ok()) return;
    const rows = await K.cloud.list('takvimkey', 20);
    keyRow = rows[rows.length - 1] || null;
    loaded = true;
    K.cloud.on('takvimkey', (r) => (keyRow = r));
    if (keyRow) setTimeout(() => publish(false), 8000);
  });
  K.takvimabone = { sheet, events, publish, ready: () => loaded };
})();
