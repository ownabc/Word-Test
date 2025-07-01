const CACHE_NAME = 'v1';
const urlsToCache = [
  './',
  './index.html',
  './game.js',
  './manifest.json',
  './icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.2/p5.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.2/addons/p5.dom.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});
