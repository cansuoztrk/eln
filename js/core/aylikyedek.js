/* Aylık Kendiliğinden Yedek — her ay (o ay ilk kez açıldığında, kale bir dakika boş kalınca) bütün yazıların
   kasanın anahtarıyla şifrelenmiş bir yedeği bu cihazın tarayıcı deposuna (IndexedDB) konur; son altı ay durur.
   Sonsuz Arşiv (R2) kuruluysa bir kopyası oraya da gider. Telefon kaybolsa ya da bulut hesabı kapansa bile bir ay
   öncesine dönülebilir. Kale Yedeği odasında listelenir; "İndir" şifresi çözülmüş, geri yüklenebilir bir JSON verir.
   Kayıtlar: aylikyedek {ay, n, size, r2} (yalnız iz; yedeğin kendisi bulutta değil) */
(function () {
  'use strict';
  const K = window.K;
  const C = window.ELN.config;
  const T = K.time;

  const DB = 'kale-yedek', ST = 'aylar', SAKLA = 6;
  let calisiyor = false;
  function db() {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('idb yok'));
      const q = indexedDB.open(DB, 1);
      q.onupgradeneeded = () => q.result.createObjectStore(ST, { keyPath: 'ay' });
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  }
  async function islem(mod, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const tx = d.transaction(ST, mod), st = tx.objectStore(ST);
      const q = fn(st);
      tx.oncomplete = () => (d.close(), res(q && q.result));
      tx.onerror = () => (d.close(), rej(tx.error));
    });
  }
  const tumu = () => islem('readonly', (st) => st.getAll()).catch(() => []);
  async function list() {
    return (await tumu()).map(({ ay, at, n, size, r2 }) => ({ ay, at, n, size, r2 })).sort((a, b) => b.ay.localeCompare(a.ay));
  }
  async function al(zorla) {
    if (calisiyor || !K.cloud || !K.cloud.enabled || !K.vault) return false;
    const ay = T.todayKey().slice(0, 7);
    if (!zorla && K.store.get('aylikYedek') === ay) return false;
    calisiyor = true;
    try {
      const rows = await K.cloud.dump((K.yedek && K.yedek.MEDIA) || []);
      const obj = { kale: C.herName, at: new Date().toISOString(), media: false, count: rows.length, rows: rows.map((r) => ({ id: r.id, kind: r.kind, who: r.who, at: new Date(r.at).toISOString(), data: r.data })) };
      const sealed = await K.vault.seal(obj);
      let r2 = '';
      if (K.r2 && (await K.r2.ok())) {
        try {
          r2 = await K.r2.put(obj, 'yedek');
        } catch (e) {}
      }
      await islem('readwrite', (st) => st.put({ ay, at: Date.now(), n: rows.length, size: sealed.length, r2, sealed }));
      const eski = (await list()).slice(SAKLA);
      for (const x of eski) await islem('readwrite', (st) => st.delete(x.ay));
      K.store.set('aylikYedek', ay);
      K.cloud.add('aylikyedek', { ay, n: rows.length, size: sealed.length, r2 });
      K.stickers && K.stickers.award('aylikyedek');
      return true;
    } catch (e) {
      return false;
    } finally {
      calisiyor = false;
    }
  }
  async function indir(ay) {
    const x = await islem('readonly', (st) => st.get(ay)).catch(() => null);
    if (!x) return K.fx.toast('Yedek bulunamadı.');
    const obj = await K.vault.unseal(x.sealed);
    if (!obj) return K.fx.toast('Yedek açılamadı.');
    const url = URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: 'application/json' }));
    K.download(url, `kale-aylik-yedek-${ay}.json`);
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
  // Açılıştan bir dakika sonra, sayfa görünürken ve kimse bir şey yazmıyorken
  K.on('cloud', (ok) => {
    if (!ok) return;
    setTimeout(function dene() {
      if (document.hidden || document.body.classList.contains('has-modal')) return setTimeout(dene, 60e3);
      al(false);
    }, 60e3);
  });
  K.aylikyedek = { al, list, indir };
})();
