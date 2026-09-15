/* 사진을 구하지 못한 항목. 게임에 빈 칸이 나오지 않도록 여기서 걸러낸다.
   photos/ 에 사진을 넣고 이 목록에서 지우면 바로 게임에 나온다. */
(function () {
  'use strict';
  Data.markMissing({
  });
})();
