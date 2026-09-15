/* 🏆 모으기 — 게임에서 맞출 때마다 그 사진이 도감에 채워진다.
   빈 칸이 채워지는 걸 보면 나머지를 채우고 싶어진다.
   '끝까지 해보는 힘'은 놀이로 익히는 게 가장 쉽다. */
(function (global) {
  'use strict';

  var KEY = 'jihan.collect.v1';
  var store = {};

  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 무시 */ }
  }

  /* 처음 모은 것이면 true 를 돌려준다 (칭찬 화면에서 새 스티커라고 알려주려고) */
  function add(themeId, itemId) {
    var k = themeId + '/' + itemId;
    var isNew = !store[k];
    store[k] = (store[k] || 0) + 1;
    save();
    return isNew;
  }

  function has(themeId, itemId) { return !!store[themeId + '/' + itemId]; }
  function count(themeId, itemId) { return store[themeId + '/' + itemId] || 0; }

  function progress(theme) {
    var items = Data.usable(theme);
    var got = items.filter(function (i) { return has(theme.id, i.id); }).length;
    return { got: got, total: items.length };
  }

  function reset() { store = {}; save(); }

  global.Collect = { add: add, has: has, count: count, progress: progress, reset: reset };
})(window);
