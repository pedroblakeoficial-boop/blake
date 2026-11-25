// Blake — modo offline. Página: rede primeiro (pega a versão nova), cópia guardada se estiver sem internet.
// Imagens e fontes: cópia guardada primeiro (rápido), atualiza em segundo plano.
const CACHE = 'blake-v2';
const BASE = ['./', './index.html', './manifest.webmanifest', './app/icone-192.png', './app/icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  // GitHub (pedidos) sempre pela rede, sem guardar
  if (url.hostname.endsWith('github.com')) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const rede = fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => hit);
    return hit || rede;
  }));
});
