'use strict';
// Service worker de la versió web (PWA) de Cims. No s'usa a l'app d'Android.
// BUILD el substitueix el flux de publicació (publish-web.yml) amb un identificador del contingut,
// així el navegador veu un sw.js nou cada cop que canvia alguna cosa i baixa la versió nova.
const BUILD = 'ecc96e1ce5e4';
const CACHE = 'cims-' + BUILD;
const SCOPE = self.registration.scope;
const abs = (p) => new URL(p, SCOPE).href;

async function sha256(buf) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(h, (b) => b.toString(16).padStart(2, '0')).join('');
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const man = await (await fetch(abs('version.json'), { cache: 'reload' })).json();
    const cache = await caches.open(CACHE);
    // tot el contingut de version.json, comprovant el hash de cada fitxer (com fa l'actualització d'Android):
    // si la publicació encara no és completa, la instal·lació falla i es torna a provar més endavant
    for (const f of man.files) {
      if (f.p === 'sw.js') continue;   // el publicador li canvia BUILD, així que el seu hash no coincideix (i el navegador ja el gestiona)
      const url = abs(f.p.split('/').map(encodeURIComponent).join('/'));
      const r = await fetch(url, { cache: 'reload' });
      if (!r.ok) throw new Error(f.p + ' ' + r.status);
      const buf = await r.clone().arrayBuffer();
      if (f.s && (await sha256(buf)) !== f.s) throw new Error('hash ' + f.p);
      await cache.put(url, r);
    }
    const vj = await fetch(abs('version.json'), { cache: 'reload' });
    await cache.put(abs('version.json'), vj);
    const idx = await cache.match(abs('index.html'));
    if (idx) await cache.put(SCOPE, idx.clone());
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('cims-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                 // mapes, Dropbox...: xarxa normal
  if (!url.href.startsWith(SCOPE)) return;
  const rel = url.href.slice(SCOPE.length);
  if (rel.startsWith('fotos/')) return;                        // les fotos les baixa l'app a IndexedDB
  if (rel === 'sw.js') return;
  if (rel.split('?')[0] === 'version.json') {                  // primer la xarxa: així l'app veu la versió real
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(async () => (await caches.open(CACHE)).match(abs('version.json'))));
    return;
  }
  e.respondWith((async () => {
    const key = req.mode === 'navigate' || rel === '' || rel.split('?')[0] === 'index.html' ? SCOPE : req.url.split('?')[0].split('#')[0];
    const mine = await caches.open(CACHE);
    const hit = await mine.match(key, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(req); }
    catch (err) {
      if (req.mode === 'navigate') { const i = await mine.match(SCOPE); if (i) return i; }
      throw err;
    }
  })());
});
