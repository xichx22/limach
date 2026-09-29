/* 한글 놀이 공통 — 어떤 이름이 한글 놀이에 쓸 만한지 고르고, 익힌 글자를 모은다.
   'KTX-산천'처럼 영어·기호가 섞인 이름은 글자 놀이에서 뺀다. */
(function (global) {
  'use strict';

  var KEY = 'jihan.hangul.v1';
  var store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 무시 */ }
  }

  /* 한글 음절로만 된 이름 (길이 min~max) */
  function words(items, min, max) {
    min = min || 2; max = max || 6;
    return items.filter(function (i) {
      var n = i.name || '';
      return /^[가-힣]+$/.test(n) && n.length >= min && n.length <= max;
    });
  }

  /* 맞힌 이름의 글자를 '내가 아는 글자'에 넣는다 */
  function learn(name) {
    (name || '').split('').forEach(function (s) {
      if (/[가-힣]/.test(s)) store[s] = (store[s] || 0) + 1;
    });
    save();
  }

  /* 많이 만난 글자부터 */
  function known() {
    return Object.keys(store).sort(function (a, b) { return store[b] - store[a]; });
  }

  global.Hangul = { words: words, learn: learn, known: known };
})(window);
