/* 색칠하기용 밑그림. 칸마다 눌러서 색을 채운다.
   사진과 달리 여기서는 단순한 선 그림이 맞다 — 칸이 뚜렷해야 칠할 수 있다. */
(function (global) {
  'use strict';

  function svg(inner) {
    return '<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">' +
      '<g stroke="#2f2a26" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">' +
      inner + '</g></svg>';
  }
  function wheel(cx) {
    return '<circle class="fixed" cx="' + cx + '" cy="104" r="17" fill="#3a3a3a"/>' +
           '<circle class="fixed" cx="' + cx + '" cy="104" r="7" fill="#d8d8d8"/>';
  }
  /* z = 칠할 수 있는 칸 */
  function z(id, d) { return '<path class="z" data-z="' + id + '" d="' + d + '" fill="#fff"/>'; }
  function zr(id, x, y, w, h, r) {
    return '<rect class="z" data-z="' + id + '" x="' + x + '" y="' + y + '" width="' + w +
           '" height="' + h + '" rx="' + (r || 3) + '" fill="#fff"/>';
  }

  var ART = {
    firetruck: {
      name: '소방차',
      svg: svg(
        z('body', 'M18 62 h58 l14 -26 h42 a8 8 0 0 1 8 8 v18 h42 a6 6 0 0 1 6 6 v22 a4 4 0 0 1 -4 4 H22 a4 4 0 0 1 -4 -4 z') +
        zr('cab', 84, 42, 44, 20, 3) +
        zr('box1', 100, 68, 34, 18) +
        zr('box2', 140, 68, 34, 18) +
        zr('ladder', 30, 40, 46, 9, 4) +
        zr('light', 92, 30, 28, 9, 4) +
        wheel(52) + wheel(152)
      )
    },
    train: {
      name: '기차',
      svg: svg(
        z('body', 'M14 84 V44 a10 10 0 0 1 10 -10 h96 l30 24 h34 a6 6 0 0 1 6 6 v20 a4 4 0 0 1 -4 4 H18 a4 4 0 0 1 -4 -4 z') +
        zr('win1', 26, 46, 26, 20) +
        zr('win2', 62, 46, 26, 20) +
        zr('win3', 98, 46, 22, 20) +
        zr('nose', 132, 60, 44, 14, 5) +
        zr('roof', 20, 26, 104, 10, 5) +
        wheel(48) + wheel(104) + wheel(152)
      )
    },
    whale: {
      name: '고래',
      svg: svg(
        z('body', 'M24 78 C24 46 62 30 104 30 C146 30 172 48 178 66 L196 42 L192 92 L172 78 C160 96 132 104 102 104 C58 104 24 96 24 78 z') +
        z('belly', 'M42 88 C64 100 132 100 160 82 C140 96 62 100 42 88 z') +
        z('fin', 'M92 96 C104 116 126 116 134 100 C120 108 104 106 92 96 z') +
        z('spout', 'M110 30 C108 16 118 8 126 6 C118 14 118 22 122 30 z') +
        '<circle class="fixed" cx="52" cy="66" r="4.5" fill="#2f2a26"/>'
      )
    },
    fish: {
      name: '물고기',
      svg: svg(
        z('body', 'M34 66 C34 40 66 26 100 26 C134 26 158 42 166 62 C158 84 134 100 100 100 C66 100 34 92 34 66 z') +
        z('tail', 'M166 62 L196 36 L190 92 z') +
        z('fin1', 'M96 26 L112 6 L126 32 z') +
        z('fin2', 'M92 98 L104 118 L122 94 z') +
        '<circle class="fixed" cx="60" cy="58" r="5" fill="#2f2a26"/>'
      )
    },
    excavator: {
      name: '굴착기',
      svg: svg(
        zr('track', 14, 92, 128, 22, 11) +
        z('base', 'M30 92 V62 a6 6 0 0 1 6 -6 h56 a6 6 0 0 1 6 6 v30 z') +
        zr('cab', 38, 34, 42, 26, 4) +
        z('arm', 'M98 66 L150 26 L166 34 L120 78 z') +
        z('bucket', 'M158 30 L192 42 L184 72 L150 58 z') +
        '<circle class="fixed" cx="40" cy="103" r="7" fill="#3a3a3a"/>' +
        '<circle class="fixed" cx="72" cy="103" r="7" fill="#3a3a3a"/>' +
        '<circle class="fixed" cx="116" cy="103" r="7" fill="#3a3a3a"/>'
      )
    },
    bus: {
      name: '버스',
      svg: svg(
        z('body', 'M16 92 V40 a10 10 0 0 1 10 -10 h150 a8 8 0 0 1 8 8 v54 a4 4 0 0 1 -4 4 H20 a4 4 0 0 1 -4 -4 z') +
        zr('win1', 28, 42, 30, 22) +
        zr('win2', 68, 42, 30, 22) +
        zr('win3', 108, 42, 30, 22) +
        zr('door', 148, 42, 28, 44, 3) +
        zr('stripe', 16, 72, 128, 10) +
        wheel(52) + wheel(148)
      )
    }
  };

  /* 앞 일곱 개는 무지개 순서 그대로 — 빨강 주황 노랑 초록 파랑 남색 보라.
     light 는 흰 바탕에서 묻히는 색이라 테두리를 진하게 준다. */
  var COLORS = [
    { name: '빨강', hex: '#e8453c' },
    { name: '주황', hex: '#f5872b' },
    { name: '노랑', hex: '#ffd23f', light: true },
    { name: '초록', hex: '#3fb950' },
    { name: '파랑', hex: '#2f80ed' },
    { name: '남색', hex: '#1f3a93' },
    { name: '보라', hex: '#9b59d0' },
    { name: '하늘', hex: '#7fd8ff', light: true },
    { name: '분홍', hex: '#ff86b5' },
    { name: '갈색', hex: '#8b5a2b' },
    { name: '까망', hex: '#3a3a3a' },
    { name: '하양', hex: '#ffffff', light: true }
  ];

  global.LineArt = { ART: ART, COLORS: COLORS };
})(window);
