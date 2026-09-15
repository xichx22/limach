/* 오프라인에서도 돌아가게 파일을 미리 저장해둔다.
   차 안이나 지하철처럼 인터넷이 없는 곳에서도 놀 수 있다. */
var CACHE = 'jihan-play-v2';
var FILES = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css',
  './js/sound.js', './js/art.js', './js/data.js', './js/photos.js', './js/mine.js',
  './js/level.js', './js/engine.js',
  './js/games/listen.js', './js/games/oddone.js', './js/games/zoom.js', './js/games/puzzle.js',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                           .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
