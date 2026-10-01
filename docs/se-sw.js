/* Service Worker — Mariachi Sentimientos
   v2 (1-oct-2026): solo atiende peticiones del propio sitio; no toca terceros (Clarity, YouTube),
   ni el vídeo, ni peticiones parciales (Range). La v1 precargaba archivos que no existen
   (/manifest.json, /pwa.js), bajaba el logo grande y la foto JPG que el sitio ya no usa. */
const C = 'ms-v2';
const CORE = ['/', '/se-manifest.json', '/logo-sm.webp', '/fotos/hero-m.avif'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE).catch(()=>{}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;                       // terceros: directo a la red
  if (r.headers.has('range') || /\.(mp4|webm)$/i.test(u.pathname)) return; // vídeo: directo a la red
  const html = r.mode === 'navigate' || (r.headers.get('accept')||'').includes('text/html');
  if (html) { e.respondWith(fetch(r).then(res=>{ if (res.ok) { const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp)); } return res; }).catch(()=>caches.match(r).then(m=>m||caches.match('/')))); }
  else { e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{ if (res.ok && res.status===200) { const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp)); } return res; }))); }
});
