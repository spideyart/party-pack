const CACHE = 'party-pack-v3';
const FILES = ['index.html', 'styles.css', 'app.js', 'battleship.js', 'ludo.js'];
self.addEventListener('install', function(e) { e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(FILES); })); });
self.addEventListener('fetch', function(e) { e.respondWith(caches.match(e.request).then(function(r) { return r || fetch(e.request); })); });
