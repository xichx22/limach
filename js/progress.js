/* 놀이터 진도를 파이로 — '지한이 배움' 앱이 읽어서 다음 놀이를 고를 때 쓴다 (2026-09-30).
   보내는 건 맞힌 글자·놀이별 단계·모은 개수뿐이다. 파이에서 열었을 때만 보낸다
   (깃허브 주소로 열면 파이에 닿지 않는다 — mine.js 참고). */
(function (global) {
  'use strict';
  var t = null;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }

  function send() {
    if (!global.Mine || !Mine.onPi()) return;
    var lv = read('jihan.level.v1'), levels = {};
    Object.keys(lv).forEach(function (k) { levels[k] = lv[k].lv || 0; });
    var body = JSON.stringify({
      letters: global.Hangul ? Hangul.known() : [],
      levels: levels,
      collected: Object.keys(read('jihan.collect.v1')).length
    });
    try {
      fetch('api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
        .catch(function () { /* 다음에 */ });
    } catch (e) { /* 무시 */ }
  }

  /* 맞힐 때마다 부르되, 몰아서 한 번만 보낸다 */
  function later() { clearTimeout(t); t = setTimeout(send, 3000); }

  global.Progress = { later: later, send: send };
})(window);
