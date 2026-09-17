/* 내 사진 — 부모가 폰에서 고른 사진을 이 기기 안에만 저장한다.
   서버로 아무것도 보내지 않고, 저장소에도 올라가지 않는다.
   지한이가 실제로 아는 것(장난감, 우리 차, 가족)으로 놀 수 있게 하는 게 목적이다. */
(function (global) {
  'use strict';

  var DB = 'jihan-photos', STORE = 'items', VER = 1;
  var cache = [];

  /* 파이가 앱을 내려준 경우에만 사진을 파이에 둔다.
     그러면 기기를 바꿔도, 지한이 태블릿에서도 같은 사진이 보인다.

     깃허브판(github.io)에서는 파이를 부를 수 없다 — 크롬이 공개 주소에 있는
     페이지가 사설망 부르는 것을 막기 때문이다(2026-09-17 실측). 그래서 거기선
     예전처럼 이 기기 안에만 저장한다. 두 경우를 여기 한 군데서만 가른다. */
  var onPi = false;

  function server(path, opt) {
    return fetch(path, opt).then(function (r) {
      if (!r.ok) throw new Error('파이가 거절했어 (' + r.status + ')');
      return r.json();
    });
  }

  /* 파이가 준 한 줄을 앱이 쓰는 모양으로. src 는 data URL 대신 주소다 —
     사진 100장을 전부 data URL 로 들고 있으면 메모리가 남아나지 않는다. */
  function fromPi(row) {
    row.src = './api/photos/' + row.file;
    return row;
  }

  function open() {
    return new Promise(function (ok, no) {
      var r = indexedDB.open(DB, VER);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
      };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { no(r.error); };
    });
  }

  function tx(mode, fn) {
    return open().then(function (d) {
      return new Promise(function (ok, no) {
        var t = d.transaction(STORE, mode);
        var req = fn(t.objectStore(STORE));
        t.oncomplete = function () { ok(req && req.result); };
        t.onerror = function () { no(t.error); };
      });
    });
  }

  function load() {
    // 파이가 내려준 앱인지 먼저 물어본다. 실패하면 예전대로 기기 안에서 읽는다.
    return server('./api/photos').then(function (d) {
      onPi = true;
      cache = (d.photos || []).map(fromPi);
      return cache;
    }).catch(function () {
      onPi = false;
      return tx('readonly', function (s) { return s.getAll(); }).then(function (rows) {
        cache = (rows || []).sort(function (a, b) { return a.at - b.at; });
        return cache;
      }).catch(function () { cache = []; return cache; });
    });
  }

  function all() { return cache; }

  function add(name, dataUrl, meta) {
    var item = { id: 'my' + Date.now() + Math.floor(Math.random() * 999),
                 name: name, src: dataUrl, at: Date.now() };
    if (meta) for (var k in meta) item[k] = meta[k];
    return detail(dataUrl).then(function (score) {
      item.score = score;
      if (onPi) {
        return server('./api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        }).then(function (d) {
          // 파이가 저장한 모양으로 바꿔 담는다. 보낸 data URL 은 버린다 —
          // 들고 있어봐야 메모리만 먹고, 이제 진짜는 파이에 있다.
          item = fromPi(d.photo);
        });
      }
      return tx('readwrite', function (s) { return s.put(item); });
    }).then(function () {
      cache.push(item); return item;
    });
  }

  /* 사진을 6x6 으로 잘랐을 때 '단색 조각'이 얼마나 나오는지 잰다.
     흰 여백이 많은 사진(도감을 잘라 넣은 카드 같은)은 퍼즐로 쓸 수 없다.
     조각에 아무 단서가 없으면 맞출 방법이 없기 때문이다. */
  function detail(dataUrl) {
    return new Promise(function (done) {
      var img = new Image();
      img.onload = function () {
        try {
          var S = 192, N = 6, cell = S / N;
          var c = document.createElement('canvas');
          c.width = c.height = S;
          var g = c.getContext('2d');
          g.drawImage(img, 0, 0, S, S);
          var d = g.getImageData(0, 0, S, S).data;
          var flat = 0;
          for (var ry = 0; ry < N; ry++) {
            for (var rx = 0; rx < N; rx++) {
              var sum = 0, sq = 0, n = 0;
              for (var y = ry * cell; y < (ry + 1) * cell; y += 2) {
                for (var x = rx * cell; x < (rx + 1) * cell; x += 2) {
                  var i = ((y | 0) * S + (x | 0)) * 4;
                  var L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                  sum += L; sq += L * L; n++;
                }
              }
              var m = sum / n;
              if (Math.sqrt(Math.max(0, sq / n - m * m)) < 16) flat++;
            }
          }
          done(flat / (N * N));
        } catch (e) { done(0); }
      };
      img.onerror = function () { done(0); };
      img.src = dataUrl;
    });
  }

  /* 예전에 넣어둔 사진에는 점수가 없다. 한 번 재서 저장해 둔다. */
  function ensureScores() {
    // 파이에 둘 때는 넣는 순간 점수를 같이 보내므로 뒤늦게 잴 일이 없다.
    // 여기서 굳이 돌리면 기기 저장소에 엉뚱하게 써버린다.
    if (onPi) return Promise.resolve();
    var todo = cache.filter(function (x) { return typeof x.score !== 'number'; });
    if (!todo.length) return Promise.resolve();
    return todo.reduce(function (chain, it) {
      return chain.then(function () {
        return detail(it.src).then(function (sc) {
          it.score = sc;
          return tx('readwrite', function (s) { return s.put(it); });
        });
      });
    }, Promise.resolve());
  }

  /* 퍼즐로 쓸 만한 사진인지 */
  function puzzleOk(item) {
    if (item.from === 'sheet') return false;                 // 도감을 잘라 넣은 것
    if (typeof item.score === 'number' && item.score > 0.12) return false;
    return true;
  }

  function remove(id) {
    var done = onPi
      ? server('./api/photos/' + encodeURIComponent(id), { method: 'DELETE' })
      : tx('readwrite', function (s) { return s.delete(id); });
    return done.then(function () {
      cache = cache.filter(function (x) { return x.id !== id; });
    });
  }

  /* 고른 사진을 정사각형으로 잘라 작게 줄인다.
     원본 그대로 두면 기기 저장 공간이 금방 찬다. */
  function shrink(file, size) {
    size = size || 480;
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var side = Math.min(img.width, img.height);
        var c = document.createElement('canvas');
        c.width = c.height = size;
        var g = c.getContext('2d');
        g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); no(new Error('사진을 읽지 못했어요')); };
      img.src = url;
    });
  }

  /* 사진이 어디 있는지. 화면에 그대로 알려줘야 한다 — 파이에 올라가는데
     "이 기기에만 저장돼요" 라고 쓰여 있으면 거짓말이 된다. */
  function onPi_() { return onPi; }

  global.Mine = { load: load, all: all, add: add, remove: remove, shrink: shrink,
                  ensureScores: ensureScores, puzzleOk: puzzleOk, onPi: onPi_ };
})(window);
