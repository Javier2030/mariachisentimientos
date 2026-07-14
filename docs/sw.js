/* Service Worker — Mariachi Sentimientos */
const C = 'ms-v1';
const CORE = ['/', '/manifest.json', '/logo.png', '/pwa.js', '/fotos/hero-m.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE).catch(()=>{}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const html = r.mode === 'navigate' || (r.headers.get('accept')||'').includes('text/html');
  if (html) { e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('/')))); }
  else { e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res;}))); }
});
