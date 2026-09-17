/* 오프라인 실행 + 새 버전 바로 받기.
   코드는 인터넷을 먼저 보고(새 버전이 있으면 바로 반영), 사진은 저장해둔 걸 먼저 쓴다.
   전부 저장해둔 걸 먼저 쓰면 앱을 고쳐도 폰에 옛날 화면이 계속 남는다. */
var CACHE = 'jihan-play-v14';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/art.js',
  './js/collect.js',
  './js/data.js',
  './js/drag.js',
  './js/engine.js',
  './js/level.js',
  './js/lineart.js',
  './js/mine.js',
  './js/photos.js',
  './js/puzzleok.js',
  './js/sound.js',
  './js/games/balloon.js',
  './js/games/color.js',
  './js/games/dots.js',
  './js/games/flashlight.js',
  './js/games/listen.js',
  './js/games/maze.js',
  './js/games/oddone.js',
  './js/games/pattern.js',
  './js/games/puzzle.js',
  './js/games/sequence.js',
  './js/games/seriate.js',
  './js/games/voice.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* 받아온 걸 저장해둔다. 단, 제대로 온 것만 저장한다.
   404 나 오류 화면까지 저장해버리면, 사진 이름을 바꾼 날
   폰에 '없음'이 영영 저장돼서 사진이 계속 깨진 채로 남는다. */
function put(req, res) {
  if (!res || !res.ok) return res;
  var copy = res.clone();
  caches.open(CACHE).then(function (c) { c.put(req, copy); });
  return res;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* 사진은 한 번 받으면 바뀌지 않는다 — 저장해둔 걸 바로 쓴다 */
  if (url.pathname.indexOf('/img/') !== -1) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { return put(req, res); });
      })
    );
    return;
  }

  /* 화면과 코드는 인터넷을 먼저 본다 — 고친 게 바로 반영되도록 */
  e.respondWith(
    fetch(req).then(function (res) { return put(req, res); })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});
