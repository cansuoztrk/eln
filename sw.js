/* Eln'in Krallığı — çevrimdışı çalışma. Kurulumda kalenin iskeleti (paket, kasa, simgeler) önceden indirilir; böylece
   internet yokken, uçakta bile açılır. Sayfalar ve kasa önce ağdan, ağ yoksa son kaydedilen hâlden; paket dosyaları adı
   içeriğe göre değiştiği için doğrudan önbellekten. CACHE ve BUNDLE satırlarını tools/bundle.mjs yazar. */
const CACHE = 'eln-kale-60deb63944';
const BUNDLE = ['dist/kale.8d3edee092.js', 'dist/odalar.164cad6ada.js', 'dist/kale.69db84a7a5.css'];
const CORE = ['./', 'manifest.webmanifest', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/vault/keys.json', 'assets/vault/private.bin', 'js/vendor/supabase.js'].concat(BUNDLE);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const keep = (req, res) => {
  if (res && res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/push/')) return;
  // İçerik özetli paketler hiç değişmez: önce önbellek
  if (url.pathname.includes('/dist/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => keep(req, res))));
    return;
  }
  e.respondWith(
    fetch(req)
      .then((res) => keep(req, res))
      .catch(() =>
        caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./', { ignoreSearch: true }) : undefined))
      )
  );
});

// Kalenin kendi bildirimleri (Web Push): şifreli içerik tarayıcıda çözülmüş gelir; bildirim gösterilir, dokununca kale açılır
self.addEventListener('push', (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch (err) {
    d = { title: 'Eln\'in Krallığı', body: e.data ? e.data.text() : '' };
  }
  e.waitUntil(self.registration.showNotification(d.title || 'Eln\'in Krallığı', { body: d.body || '', icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png', tag: d.tag || undefined, renotify: Boolean(d.tag), data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const hedef = new URL((e.notification.data && e.notification.data.url) || './', self.location.href).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) => {
      const w = l.find((c) => c.url.startsWith(self.registration.scope));
      if (w) return w.navigate(hedef).then((c) => (c || w).focus()).catch(() => w.focus());
      return self.clients.openWindow(hedef);
    })
  );
});
