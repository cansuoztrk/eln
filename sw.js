/* Eln'in Krallığı — çevrimdışı çalışma. Kurulumda kalenin iskeleti (paket, kasa, simgeler) önceden indirilir; böylece
   internet yokken, uçakta bile açılır. Sayfalar ve kasa önce ağdan, ağ yoksa son kaydedilen hâlden; paket dosyaları adı
   içeriğe göre değiştiği için doğrudan önbellekten. CACHE ve BUNDLE satırlarını tools/bundle.mjs yazar. */
const CACHE = 'eln-kale-53792dbdfa';
const BUNDLE = ['dist/kale.53792dbdfa.js', 'dist/kale.96e02c9470.css'];
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
