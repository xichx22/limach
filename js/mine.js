/* 내 사진 — 부모가 폰에서 고른 사진을 이 기기 안에만 저장한다.
   서버로 아무것도 보내지 않고, 저장소에도 올라가지 않는다.
   지한이가 실제로 아는 것(장난감, 우리 차, 가족)으로 놀 수 있게 하는 게 목적이다. */
(function (global) {
  'use strict';

  var DB = 'jihan-photos', STORE = 'items', VER = 1;
  var cache = [];

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
    return tx('readonly', function (s) { return s.getAll(); }).then(function (rows) {
      cache = (rows || []).sort(function (a, b) { return a.at - b.at; });
      return cache;
    }).catch(function () { cache = []; return cache; });
  }

  function all() { return cache; }

  function add(name, dataUrl) {
    var item = { id: 'my' + Date.now() + Math.floor(Math.random() * 999),
                 name: name, src: dataUrl, at: Date.now() };
    return tx('readwrite', function (s) { return s.put(item); }).then(function () {
      cache.push(item); return item;
    });
  }

  function remove(id) {
    return tx('readwrite', function (s) { return s.delete(id); }).then(function () {
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

  global.Mine = { load: load, all: all, add: add, remove: remove, shrink: shrink };
})(window);
