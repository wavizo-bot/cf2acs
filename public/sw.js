/* ACS Digital - service worker
   Estratégia: rede primeiro (sempre pega a versão mais nova quando há internet),
   cache como reserva para uso offline. */
const APP_VERSION = '2026.09.15';
const CACHE_NAME = 'acs-digital-' + APP_VERSION;
const PRECACHE = ['./', './acs-digital.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy).catch(() => {}));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./acs-digital.html')))
  );
});
