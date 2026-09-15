/* 그림 담당.
   특수자동차는 이모지에 없어서 SVG로 직접 그린다. 전부 옆모습, 같은 크기(120x70)로
   통일해서 그림자 맞추기 게임에서도 실루엣이 제대로 비교되게 했다. */
(function (global) {
  'use strict';

  var W = 120, H = 70;

  function wheels() {
    var xs = Array.prototype.slice.call(arguments);
    return xs.map(function (x) {
      return '<circle cx="' + x + '" cy="57" r="9.5" fill="#2b2b2b"/>' +
             '<circle cx="' + x + '" cy="57" r="3.8" fill="#d9d9d9"/>';
    }).join('');
  }

  /* 운전석 — 왼쪽을 보고 있다 */
  function cab(color) {
    return '<path d="M6 52 V34 q0 -7 7 -7 h23 v25 z" fill="' + color + '"/>' +
           '<path d="M12.5 31 h21 v11 h-23 v-7 q0 -4 2 -4 z" fill="#bfe3ff"/>' +
           '<rect x="4" y="43" width="5" height="6" rx="2" fill="#ffe27a"/>';
  }

  /* 지붕 경광등 */
  function beacon(x) {
    return '<rect x="' + x + '" y="21" width="19" height="6" rx="3" fill="#1f6fff"/>' +
           '<rect x="' + (x + 9) + '" y="21" width="10" height="6" rx="3" fill="#e03127"/>';
  }

  function svg(inner) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }

  var RED = '#e03127', DARKRED = '#b5241c', YELLOW = '#f2b705', GREEN = '#2f9e44';

  /* 옆칸(수납함) 무늬 — 소방차 특유의 은색 문들 */
  function lockers(x0, y, n, w) {
    var out = '';
    for (var i = 0; i < n; i++) {
      out += '<rect x="' + (x0 + i * (w + 3)) + '" y="' + y + '" width="' + w +
             '" height="13" rx="2" fill="#eef2f4" stroke="#c3ccd2" stroke-width="1"/>';
    }
    return out;
  }

  var VEHICLES = {
    /* 1. 펌프차 — 지붕에 사다리를 눕혀 싣고 있다 */
    pump: svg(
      '<rect x="36" y="30" width="79" height="22" rx="3" fill="' + RED + '"/>' +
      lockers(41, 34, 3, 21) +
      '<rect x="45" y="23" width="62" height="5" rx="2.5" fill="#cfd6db"/>' +
      '<rect x="45" y="24.5" width="62" height="2" fill="#9fa9b0"/>' +
      '<rect x="100" y="33" width="14" height="10" rx="2" fill="#9fb2bd"/>' +
      cab(RED) + beacon(13) + wheels(22, 78, 100)
    ),

    /* 2. 굴절사다리차 — 팔이 한 번 꺾여 올라간다. 이게 다른 소방차와 다른 점 */
    articulated: svg(
      '<rect x="36" y="34" width="79" height="18" rx="3" fill="' + RED + '"/>' +
      lockers(41, 37, 3, 21) +
      '<rect x="52" y="28" width="16" height="8" rx="3" fill="#8d979e"/>' +
      '<line x1="60" y1="31" x2="82" y2="12" stroke="#efc02a" stroke-width="8" stroke-linecap="round"/>' +
      '<line x1="82" y1="12" x2="108" y2="21" stroke="#efc02a" stroke-width="8" stroke-linecap="round"/>' +
      '<rect x="101" y="12" width="15" height="11" rx="2" fill="#f7f9fa" stroke="#6d7880" stroke-width="1.6"/>' +
      '<rect x="88" y="48" width="5" height="12" rx="2" fill="#6d7880"/>' +
      cab(RED) + beacon(13) + wheels(22, 74, 96)
    ),

    /* 3. 물탱크차 — 커다란 원통 물탱크 */
    tanker: svg(
      '<rect x="37" y="26" width="76" height="26" rx="13" fill="' + RED + '"/>' +
      '<ellipse cx="112" cy="39" rx="4.5" ry="13" fill="' + DARKRED + '"/>' +
      '<rect x="37" y="37" width="76" height="4" fill="' + DARKRED + '" opacity=".5"/>' +
      '<rect x="62" y="20" width="13" height="7" rx="2.5" fill="#c9cfd4"/>' +
      '<rect x="44" y="50" width="62" height="5" rx="2" fill="#7d868c"/>' +
      cab(RED) + beacon(13) + wheels(22, 76, 98)
    ),

    /* 4. 화학차 — 지붕에 거품을 쏘는 대포가 달려 있다 */
    chemical: svg(
      '<rect x="36" y="28" width="79" height="24" rx="3" fill="' + RED + '"/>' +
      '<rect x="36" y="39" width="79" height="5" fill="#ffd400"/>' +
      lockers(41, 45, 3, 21) +
      '<circle cx="72" cy="27" r="6" fill="#77818a"/>' +
      '<line x1="72" y1="27" x2="97" y2="15" stroke="#9aa3aa" stroke-width="6.5" stroke-linecap="round"/>' +
      '<circle cx="98" cy="14.5" r="4" fill="#c9cfd4"/>' +
      cab(RED) + beacon(13) + wheels(22, 78, 100)
    ),

    /* 5. 구조공작차 — 뒤쪽에 짧은 구조용 팔과 조명이 있다 */
    rescue: svg(
      '<rect x="36" y="26" width="79" height="26" rx="3" fill="' + RED + '"/>' +
      lockers(41, 30, 3, 21) +
      lockers(41, 45, 3, 21) +
      '<line x1="97" y1="26" x2="113" y2="11" stroke="#c9a227" stroke-width="6" stroke-linecap="round"/>' +
      '<line x1="113" y1="12" x2="113" y2="25" stroke="#5a6268" stroke-width="2"/>' +
      '<path d="M110 25 a3.5 3.5 0 1 0 6 0" fill="none" stroke="#3f4448" stroke-width="2.4"/>' +
      '<rect x="46" y="17" width="11" height="9" rx="2" fill="#ffe89a" stroke="#c9b25f" stroke-width="1.2"/>' +
      '<path d="M46 21.5 h-9" stroke="#ffe89a" stroke-width="3" stroke-linecap="round"/>' +
      cab(RED) + beacon(13) + wheels(22, 78, 100)
    ),

    /* 6. 고소작업차 — 곧게 뻗은 팔 하나에 바구니 */
    aerial: svg(
      '<rect x="36" y="34" width="79" height="18" rx="3" fill="#eceff1" stroke="#aab4bb" stroke-width="1.6"/>' +
      '<rect x="36" y="41" width="79" height="5" fill="#f47b20"/>' +
      '<rect x="54" y="29" width="15" height="7" rx="2.5" fill="#8d979e"/>' +
      '<line x1="61" y1="32" x2="103" y2="10" stroke="#f47b20" stroke-width="7.5" stroke-linecap="round"/>' +
      '<rect x="98" y="8" width="16" height="11" rx="2" fill="#f7f9fa" stroke="#6d7880" stroke-width="1.6"/>' +
      '<path d="M44 52 l-6 8" stroke="#6d7880" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M92 52 l6 8" stroke="#6d7880" stroke-width="4" stroke-linecap="round"/>' +
      cab('#dfe5e9') + wheels(24, 80)
    ),

    /* 7. 살수차 — 앞쪽에서 물을 뿌린다 */
    sprinkler: svg(
      '<rect x="37" y="28" width="76" height="24" rx="12" fill="' + GREEN + '"/>' +
      '<ellipse cx="112" cy="40" rx="4.5" ry="12" fill="#25823a"/>' +
      '<rect x="37" y="38" width="76" height="4" fill="#25823a" opacity=".5"/>' +
      '<rect x="61" y="22" width="13" height="7" rx="2.5" fill="#c9cfd4"/>' +
      '<rect x="2" y="50" width="16" height="4" rx="2" fill="#6d7880"/>' +
      '<path class="no-shadow" d="M8 54 q-5 6 -2 12" stroke="#4db6ff" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path class="no-shadow" d="M14 54 q-2 7 2 12" stroke="#4db6ff" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path class="no-shadow" d="M2 54 q-6 5 -1 11" stroke="#4db6ff" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      cab(GREEN) + wheels(26, 78, 100)
    ),

    /* 8. 청소차 — 뒤가 비스듬히 솟은 쓰레기칸 */
    garbage: svg(
      '<path d="M36 28 h58 l20 12 v12 h-78 z" fill="' + GREEN + '"/>' +
      '<rect x="42" y="33" width="46" height="14" rx="2" fill="#27803a" opacity=".55"/>' +
      '<rect x="104" y="38" width="11" height="19" rx="2" fill="#6d7880"/>' +
      '<rect x="100" y="52" width="19" height="4" rx="2" fill="#4f585e"/>' +
      cab(GREEN) + wheels(24, 82)
    ),

    /* 9. 견인차 — 뒤로 뻗은 갈고리 팔 */
    tow: svg(
      '<rect x="36" y="34" width="67" height="18" rx="3" fill="' + YELLOW + '"/>' +
      '<rect x="36" y="41" width="67" height="4" fill="#d69c00"/>' +
      '<rect x="52" y="28" width="16" height="7" rx="2.5" fill="#8d979e"/>' +
      '<line x1="60" y1="31" x2="112" y2="43" stroke="#6d7880" stroke-width="7" stroke-linecap="round"/>' +
      '<line x1="112" y1="43" x2="112" y2="50" stroke="#3f4448" stroke-width="2.2"/>' +
      '<path d="M109 50 a3.5 3.5 0 1 0 6 0" fill="none" stroke="#3f4448" stroke-width="2.4"/>' +
      cab(YELLOW) + beacon(13) + wheels(24, 84)
    ),

    /* 10. 믹서트럭 — 비스듬히 누운 커다란 드럼이 돈다 */
    mixer: svg(
      '<g transform="rotate(-11 78 34)">' +
      '<rect x="46" y="18" width="64" height="30" rx="15" fill="#e9edf0" stroke="#98a4ac" stroke-width="2"/>' +
      '<path d="M60 19 q10 14 0 28" stroke="#aeb9c0" stroke-width="3" fill="none"/>' +
      '<path d="M76 19 q10 14 0 28" stroke="#aeb9c0" stroke-width="3" fill="none"/>' +
      '<path d="M92 19 q10 14 0 28" stroke="#aeb9c0" stroke-width="3" fill="none"/>' +
      '</g>' +
      '<path d="M108 40 l12 8 v6 h-10 z" fill="#9aa3aa"/>' +
      '<rect x="36" y="44" width="76" height="8" rx="2" fill="#5f6a70"/>' +
      cab('#3b7dd8') + wheels(24, 80, 100)
    ),

    /* 11. 덤프트럭 — 짐칸이 뒤로 기울어 올라가 있다 */
    dump: svg(
      '<rect x="36" y="42" width="79" height="10" rx="2" fill="#5f6a70"/>' +
      '<polygon points="46,36 112,17 117,31 53,49" fill="' + YELLOW + '"/>' +
      '<polygon points="46,36 112,17 113,21 48,40" fill="#d69c00"/>' +
      '<line x1="58" y1="46" x2="72" y2="36" stroke="#9aa3aa" stroke-width="5" stroke-linecap="round"/>' +
      cab('#e07b1f') + wheels(24, 82, 102)
    ),

    /* 12. 크레인차 — 길게 뻗은 팔이 제일 높이 올라간다 */
    crane: svg(
      '<rect x="30" y="37" width="85" height="15" rx="3" fill="' + YELLOW + '"/>' +
      '<rect x="44" y="28" width="17" height="10" rx="3" fill="#d69c00"/>' +
      '<line x1="50" y1="33" x2="112" y2="10" stroke="#e8a800" stroke-width="9" stroke-linecap="round"/>' +
      '<line x1="82" y1="21" x2="117" y2="6" stroke="#ffd34d" stroke-width="6" stroke-linecap="round"/>' +
      '<line x1="116" y1="7" x2="116" y2="22" stroke="#3f4448" stroke-width="2"/>' +
      '<path d="M113 22 a3.5 3.5 0 1 0 6 0" fill="none" stroke="#3f4448" stroke-width="2.4"/>' +
      '<path d="M38 52 l-7 8" stroke="#6d7880" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M104 52 l7 8" stroke="#6d7880" stroke-width="4.5" stroke-linecap="round"/>' +
      cab(YELLOW) + wheels(26, 86)
    )
  };

  /* 그림 하나를 화면에 그릴 HTML로 바꾼다 */
  function html(item) {
    if (item.svg && VEHICLES[item.svg]) {
      return '<span class="art art-svg">' + VEHICLES[item.svg] + '</span>';
    }
    return '<span class="art art-emoji">' + item.emoji + '</span>';
  }

  global.Art = { html: html, VEHICLES: VEHICLES };
})(window);
