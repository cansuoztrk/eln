/* Çevrimdışı açılış: önce ağ, olmazsa en son kaydedilen hâl. */
const KASA = 'eln-v3';
const KABUK = ['./', 'index.html', 'css/eln.css?v=3', 'css/yazi.css', 'js/app.js?v=3', 'js/kasa.js', 'js/zaman.js', 'js/sahne.js', 'js/ses.js', 'js/ipek.js', 'js/zambak.js', 'kasa/icerik.bin', 'manifest.webmanifest', 'assets/ikon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(KASA).then((c) => c.addAll(KABUK)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== KASA).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname === 'api.open-meteo.com') return;
  const yazi = u.hostname.endsWith('gstatic.com') || u.hostname.endsWith('googleapis.com');
  if (yazi) {
    // Yazı tipleri değişmez: önce önbellek
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      const k = res.clone();
      caches.open(KASA).then((c) => c.put(e.request, k));
      return res;
    })));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const k = res.clone();
          caches.open(KASA).then((c) => c.put(e.request, k));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: false }).then((r) => r || caches.match('index.html')))
  );
});
