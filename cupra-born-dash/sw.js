// Service worker : met l'appli en cache pour qu'elle fonctionne sans réseau dans la voiture.
// Changer VERSION à chaque mise à jour des fichiers pour forcer le rafraîchissement.
const VERSION = 'borndash-v1';
const FILES = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './icon.svg',
  './js/main.js', './js/data.js', './js/car3d.js', './js/apps.js', './js/icons.js', './js/settings.js',
  './vendor/three/three.module.min.js',
  './vendor/three/addons/controls/OrbitControls.js',
  './vendor/three/addons/environments/RoomEnvironment.js',
  './vendor/three/addons/loaders/GLTFLoader.js',
  './vendor/three/addons/utils/BufferGeometryUtils.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // météo : toujours réseau
  // Réseau d'abord (mises à jour), cache en secours (hors ligne)
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
