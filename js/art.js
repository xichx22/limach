/* 그림 담당.
   - 기본 주제: 저장소에 들어있는 실제 사진 (photos/…)
   - 내 사진: 기기 안에만 저장된 사진 (data URL)
   사진이 없으면 이모지로 대신한다. */
(function (global) {
  'use strict';

  function src(item) {
    if (item.src) return item.src;              // 내 사진 (data URL)
    if (item.photo) return 'img/' + item.photo;
    return null;
  }

  function html(item, opts) {
    opts = opts || {};
    var s = src(item);
    if (s) {
      return '<span class="art art-photo">' +
             '<img src="' + s + '" alt="" draggable="false"' +
             (opts.eager ? '' : ' loading="lazy"') + '></span>';
    }
    return '<span class="art art-emoji">' + (item.emoji || '❓') + '</span>';
  }

  global.Art = { html: html, src: src };
})(window);
