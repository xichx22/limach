/* 난이도 자동 조절.
   너무 쉬우면 지루하고 너무 어려우면 포기한다. 그 사이를 계속 유지하는 게 목표. */
(function (global) {
  'use strict';

  var KEY = 'jihan.level.v1';
  var store = {};

  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 무시 */ }
  }

  function slot(gameId, themeId) {
    var k = gameId + ':' + themeId;
    if (!store[k]) store[k] = { lv: 0, win: 0, lose: 0 };
    return store[k];
  }

  function get(gameId, themeId) {
    return slot(gameId, themeId).lv;
  }

  /* 맞췄을 때. 정해진 횟수만큼 연속으로 맞추면 한 단계 올라간다. */
  function win(game, themeId) {
    var s = slot(game.id, themeId);
    s.lose = 0;
    s.win += 1;
    var up = false;
    if (s.win >= (game.upAfter || 3) && s.lv < game.levels - 1) {
      s.lv += 1; s.win = 0; up = true;
    }
    save();
    return { level: s.lv, leveledUp: up };
  }

  /* 틀렸을 때. 조용히 내려간다 — 지한이가 눈치채지 못하게. */
  function lose(game, themeId) {
    var s = slot(game.id, themeId);
    s.win = 0;
    s.lose += 1;
    var down = false;
    if (s.lose >= (game.downAfter || 2) && s.lv > 0) {
      s.lv -= 1; s.lose = 0; down = true;
    }
    save();
    return { level: s.lv, leveledDown: down };
  }

  function reset() {
    store = {}; save();
  }

  global.Level = { get: get, win: win, lose: lose, reset: reset };
})(window);
