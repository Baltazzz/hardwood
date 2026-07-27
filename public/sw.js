// Service worker HARDWOOD — mise en cache pour un fonctionnement hors-ligne réel après une
// première visite en ligne. Volontairement fait main (pas de Workbox/vite-plugin-pwa, cohérent
// avec le reste du projet qui évite les dépendances externes) : deux stratégies simples,
// suffisantes pour une appli mono-page sans backend.
//
// - App shell (fichiers stables de public/, jamais hashés par Vite) : précaché à l'installation.
// - Tout le reste same-origin (JS/CSS hashés par le build, navigation HTML) : réseau d'abord,
//   recopié dans le cache runtime à la volée -- sert de repli dès que le réseau est indisponible.
//   Les assets hashés (/assets/...) ne changent jamais de contenu pour un hash donné, donc un
//   simple cache-first est à la fois plus rapide ET correct pour eux.
// - Polices Google Fonts (cross-origin) : cache-first sur les deux domaines utilisés
//   (fonts.googleapis.com/fonts.gstatic.com), réponses opaques mises en cache dès la 1re visite
//   en ligne -- sans ça, le jeu resterait fonctionnel hors-ligne mais avec une police de repli.
//
// Bump la version à chaque changement de stratégie (pas besoin de lister les fichiers hashés :
// ils sont mis en cache automatiquement à l'usage, jamais listés en dur ici).
const CACHE_VERSION = 'hardwood-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

// Uniquement des fichiers de public/ (jamais hashés, chemin stable garanti d'un build à l'autre).
const APP_SHELL_URLS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/logo-mark.png',
  '/icon-72.png', '/icon-96.png', '/icon-128.png', '/icon-144.png', '/icon-152.png',
  '/icon-192.png', '/icon-256.png', '/icon-384.png', '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([APP_SHELL_CACHE, RUNTIME_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function isFontHost(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // pas de mutation d'état hors-ligne, rien à mettre en cache
  const url = new URL(req.url);

  // Polices cross-origin : cache-first (rarement mises à jour, réponses opaques -- on ne peut
  // pas inspecter leur statut, mais les mettre en cache et les resservir fonctionne très bien).
  if (isFontHost(url)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(FONT_CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => hit))
    );
    return;
  }

  if (url.origin !== self.location.origin) return; // laisse passer tout autre cross-origin tel quel

  // Navigation (chargement de page) : réseau d'abord pour avoir la dernière version en ligne,
  // repli sur la page d'accueil mise en cache si hors-ligne -- l'appli est mono-page, il n'y a
  // qu'une seule "route" HTML réelle.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(APP_SHELL_CACHE).then((cache) => cache.put('/', copy));
        return res;
      }).catch(() => caches.match('/').then((hit) => hit || caches.match(req)))
    );
    return;
  }

  // Assets buildés hashés (/assets/...) : un hash donné ne change jamais de contenu -- cache-first
  // est à la fois plus rapide et strictement correct.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Reste (icônes, manifest, autres fichiers stables) : réseau d'abord, repli cache hors-ligne.
  event.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
      return res;
    }).catch(() => caches.match(req))
  );
});
