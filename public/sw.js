/* ACS Digital — Service Worker
 * - Pré-cacheia o shell mínimo (index.html, manifest, ícones) para funcionar offline.
 * - Verifica versão (via version.json) quando o usuário abre o PWA (não em segundo plano).
 *   Se houver versão nova, envia mensagem 'atualizacao-disponivel' para a página.
 */

const VERSION = 'acs-digital-v1.1';
const PRECACHE = 'acs-precache-' + VERSION;
const RUNTIME   = 'acs-runtime-' + VERSION;
const PRECACHE_URLS = [
  './',
  './acs-digital.html',
  './manifest.webmanifest',
  './icons/36.png','./icons/48.png','./icons/72.png','./icons/96.png',
  './icons/144.png','./icons/192.png','./icons/512.png',
  './version.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PRECACHE).then(c => c.addAll(PRECACHE_URLS).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== PRECACHE && k !== RUNTIME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Network-first para HTML; cache-first para imagens e manifest.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(RUNTIME).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(req).then(c => c || caches.match('./acs-digital.html')))
    );
    return;
  }
  if (req.destination === 'image' || req.destination === 'manifest') {
    event.respondWith(caches.match(req).then(c => c || fetch(req).then(r => {
      const copy = r.clone();
      caches.open(RUNTIME).then(c => c.put(req, copy)).catch(() => {});
      return r;
    })));
    return;
  }
});

// Recebe ping da página para checar atualização (somente quando o usuário usa o app).
self.addEventListener('message', (event) => {
  if (event.data === 'check-update') {
    fetch('./version.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(v => {
        if (!v || !v.version) return;
        if (v.version !== VERSION) {
          self.clients.matchAll({ type: 'window' }).then(clients => {
            clients.forEach(c => c.postMessage({ type: 'atualizacao-disponivel', version: v.version, notes: v.notes || '' }));
          });
        }
      })
      .catch(() => {});
  }
});
