/* 놀이에 나오는 내용 전부.
   새 단어를 넣고 싶으면 여기만 고치면 된다. 게임 5개가 알아서 같이 늘어난다. */
(function (global) {
  'use strict';

  /* 주제 하나 = { id, name, emoji(메뉴 아이콘), sibling(비슷한 주제), items[] }
     items 하나 = { id, name, emoji } 또는 { id, name, svg:'그림이름' } */

  var THEMES = [
    {
      id: 'special',
      name: '특수자동차',
      icon: '🚒',
      color: '#e8503a',
      sibling: 'car',
      items: [
        { id: 'pump',        name: '펌프차',       svg: 'pump' },
        { id: 'articulated', name: '굴절사다리차', svg: 'articulated' },
        { id: 'tanker',      name: '물탱크차',     svg: 'tanker' },
        { id: 'chemical',    name: '화학차',       svg: 'chemical' },
        { id: 'rescue',      name: '구조공작차',   svg: 'rescue' },
        { id: 'aerial',      name: '고소작업차',   svg: 'aerial' },
        { id: 'sprinkler',   name: '살수차',       svg: 'sprinkler' },
        { id: 'garbage',     name: '청소차',       svg: 'garbage' },
        { id: 'tow',         name: '견인차',       svg: 'tow' },
        { id: 'mixer',       name: '믹서트럭',     svg: 'mixer' },
        { id: 'dump',        name: '덤프트럭',     svg: 'dump' },
        { id: 'crane',       name: '크레인차',     svg: 'crane' }
      ]
    },
    {
      id: 'car',
      name: '자동차',
      icon: '🚗',
      color: '#2f7fe0',
      sibling: 'special',
      /* 산타페처럼 실제 차 이름을 쓰고 싶으면 name 만 바꾸면 된다 */
      items: [
        { id: 'sedan',   name: '승용차',   emoji: '🚗' },
        { id: 'suv',     name: '에스유브이', emoji: '🚙' },
        { id: 'bus',     name: '버스',     emoji: '🚌' },
        { id: 'truck',   name: '트럭',     emoji: '🚚' },
        { id: 'pickup',  name: '픽업트럭', emoji: '🛻' },
        { id: 'taxi',    name: '택시',     emoji: '🚕' },
        { id: 'police',  name: '경찰차',   emoji: '🚓' },
        { id: 'ambul',   name: '구급차',   emoji: '🚑' },
        { id: 'race',    name: '경주차',   emoji: '🏎️' },
        { id: 'van',     name: '승합차',   emoji: '🚐' },
        { id: 'tractor', name: '트랙터',   emoji: '🚜' },
        { id: 'moto',    name: '오토바이', emoji: '🏍️' }
      ]
    },
    {
      id: 'animal',
      name: '동물',
      icon: '🦁',
      color: '#e08b1f',
      sibling: 'sea',
      items: [
        { id: 'rhino',  name: '코뿔소',   emoji: '🦏' },
        { id: 'hippo',  name: '하마',     emoji: '🦛' },
        { id: 'giraf',  name: '기린',     emoji: '🦒' },
        { id: 'zebra',  name: '얼룩말',   emoji: '🦓' },
        { id: 'leopard',name: '표범',     emoji: '🐆' },
        { id: 'kanga',  name: '캥거루',   emoji: '🦘' },
        { id: 'koala',  name: '코알라',   emoji: '🐨' },
        { id: 'panda',  name: '판다',     emoji: '🐼' },
        { id: 'racoon', name: '너구리',   emoji: '🦝' },
        { id: 'otter',  name: '수달',     emoji: '🦦' },
        { id: 'hedge',  name: '고슴도치', emoji: '🦔' },
        { id: 'sloth',  name: '나무늘보', emoji: '🦥' },
        { id: 'alpaca', name: '알파카',   emoji: '🦙' },
        { id: 'camel',  name: '낙타',     emoji: '🐫' },
        { id: 'deer',   name: '사슴',     emoji: '🦌' },
        { id: 'orang',  name: '오랑우탄', emoji: '🦧' }
      ]
    },
    {
      id: 'sea',
      name: '해양생물',
      icon: '🐋',
      color: '#0d9488',
      sibling: 'animal',
      items: [
        { id: 'whale',   name: '고래',     emoji: '🐋' },
        { id: 'shark',   name: '상어',     emoji: '🦈' },
        { id: 'dolphin', name: '돌고래',   emoji: '🐬' },
        { id: 'octopus', name: '문어',     emoji: '🐙' },
        { id: 'squid',   name: '오징어',   emoji: '🦑' },
        { id: 'crab',    name: '게',       emoji: '🦀' },
        { id: 'lobster', name: '랍스터',   emoji: '🦞' },
        { id: 'shrimp',  name: '새우',     emoji: '🦐' },
        { id: 'tropical',name: '열대어',   emoji: '🐠' },
        { id: 'puffer',  name: '복어',     emoji: '🐡' },
        { id: 'fish',    name: '물고기',   emoji: '🐟' },
        { id: 'turtle',  name: '바다거북', emoji: '🐢' },
        { id: 'seal',    name: '물개',     emoji: '🦭' },
        { id: 'shell',   name: '소라',     emoji: '🐚' },
        { id: 'penguin', name: '펭귄',     emoji: '🐧' },
        { id: 'blowing', name: '아기고래', emoji: '🐳' }
      ]
    }
  ];

  /* 퍼즐 그림 — 배경 위에 여러 개를 흩어놓아서 어느 조각에나 볼 게 있게 만든다.
     x, y, s 는 그림 전체를 100 으로 봤을 때의 위치와 크기 */
  /* 퍼즐 그림 — 배경 위에 여러 개를 촘촘히 흩어놓는다.
     6x6(36조각)까지 가기 때문에, 어느 조각을 집어도 단서가 보여야 한다.
     x, y, s 는 그림 전체를 100 으로 봤을 때의 위치와 크기 */
  var SCENES = {
    special: [
      {
        name: '소방서',
        bg: 'linear-gradient(#bfe6ff 0%, #e8f6ff 50%, #9aa5ad 50%, #7d878e 100%)',
        parts: [
          { e: '\u2600\ufe0f', x: 88, y: 8, s: 12 }, { e: '\u2601\ufe0f', x: 20, y: 8, s: 14 },
          { e: '\u2601\ufe0f', x: 55, y: 14, s: 11 }, { e: '\ud83d\udc26', x: 72, y: 9, s: 9 },
          { e: '\ud83c\udfe2', x: 9, y: 30, s: 20 }, { e: '\ud83c\udfe5', x: 33, y: 30, s: 20 },
          { e: '\ud83c\udfec', x: 56, y: 31, s: 18 }, { e: '\ud83c\udf33', x: 76, y: 33, s: 17 },
          { e: '\ud83d\udea6', x: 93, y: 36, s: 12 },
          { v: 'pump', x: 27, y: 60, s: 42 }, { v: 'articulated', x: 74, y: 60, s: 42 },
          { e: '\ud83e\uddef', x: 50, y: 52, s: 10 },
          { v: 'rescue', x: 28, y: 82, s: 42 }, { v: 'tanker', x: 76, y: 82, s: 42 },
          { e: '\ud83d\udea7', x: 50, y: 74, s: 11 }, { e: '\ud83d\udea7', x: 8, y: 95, s: 11 },
          { e: '\ud83e\uddef', x: 92, y: 95, s: 11 }
        ]
      },
      {
        name: '공사장',
        bg: 'linear-gradient(#ffe9a8 0%, #ffd97a 48%, #c9a36b 48%, #a9834f 100%)',
        parts: [
          { e: '\u2601\ufe0f', x: 78, y: 9, s: 13 }, { e: '\u2601\ufe0f', x: 32, y: 12, s: 11 },
          { e: '\ud83c\udfd7\ufe0f', x: 13, y: 24, s: 20 }, { e: '\u26a0\ufe0f', x: 52, y: 22, s: 12 },
          { e: '\ud83e\uddf1', x: 88, y: 26, s: 14 },
          { v: 'crane', x: 50, y: 38, s: 46 },
          { e: '\ud83d\udea7', x: 10, y: 48, s: 13 }, { e: '\ud83d\udc77', x: 90, y: 50, s: 13 },
          { v: 'dump', x: 27, y: 68, s: 42 }, { v: 'mixer', x: 74, y: 68, s: 42 },
          { e: '\u26a0\ufe0f', x: 50, y: 60, s: 11 },
          { v: 'tow', x: 30, y: 88, s: 42 }, { v: 'garbage', x: 76, y: 88, s: 40 },
          { e: '\ud83e\uddf1', x: 10, y: 96, s: 13 }, { e: '\ud83d\udea7', x: 52, y: 96, s: 12 }
        ]
      }
    ],
    car: [
      {
        name: '도시 길',
        bg: 'linear-gradient(#cfe9ff 0%, #eaf6ff 46%, #5c666d 46%, #3f474d 100%)',
        parts: [
          { e: '\ud83c\udf24\ufe0f', x: 88, y: 9, s: 13 }, { e: '\u2601\ufe0f', x: 40, y: 9, s: 12 },
          { e: '\ud83c\udfd9\ufe0f', x: 18, y: 27, s: 26 }, { e: '\ud83c\udfec', x: 46, y: 29, s: 18 },
          { e: '\ud83c\udf33', x: 66, y: 30, s: 16 }, { e: '\ud83d\udea6', x: 86, y: 30, s: 13 },
          { e: '\ud83d\ude8c', x: 24, y: 58, s: 22 }, { e: '\ud83d\ude97', x: 60, y: 58, s: 20 },
          { e: '\ud83d\udeb6', x: 88, y: 56, s: 13 },
          { e: '\ud83d\ude95', x: 28, y: 80, s: 20 }, { e: '\ud83d\ude93', x: 64, y: 80, s: 20 },
          { e: '\ud83c\udfcd\ufe0f', x: 90, y: 80, s: 15 },
          { e: '\ud83d\ude91', x: 22, y: 96, s: 19 }, { e: '\ud83d\ude9a', x: 62, y: 96, s: 19 }
        ]
      },
      {
        name: '주차장',
        bg: 'linear-gradient(#e7edf2 0%, #d4dde4 46%, #b6c2ca 46%, #98a6b0 100%)',
        parts: [
          { e: '\ud83c\udd7f\ufe0f', x: 50, y: 9, s: 16 }, { e: '\ud83c\udfec', x: 14, y: 14, s: 16 },
          { e: '\ud83d\udea6', x: 87, y: 14, s: 12 },
          { e: '\ud83d\ude99', x: 20, y: 34, s: 21 }, { e: '\ud83d\udefb', x: 50, y: 34, s: 21 },
          { e: '\ud83d\ude90', x: 80, y: 34, s: 21 },
          { e: '\ud83c\udfce\ufe0f', x: 20, y: 58, s: 20 }, { e: '\ud83d\ude95', x: 50, y: 58, s: 20 },
          { e: '\ud83d\ude9b', x: 80, y: 58, s: 20 },
          { e: '\ud83c\udfcd\ufe0f', x: 22, y: 82, s: 17 }, { e: '\ud83d\ude9c', x: 52, y: 82, s: 20 },
          { e: '\ud83d\ude8c', x: 82, y: 82, s: 20 },
          { e: '\ud83d\udea7', x: 12, y: 96, s: 11 }, { e: '\ud83d\udea7', x: 88, y: 96, s: 11 }
        ]
      }
    ],
    animal: [
      {
        name: '초원',
        bg: 'linear-gradient(#bfe6ff 0%, #ddf3c9 42%, #8fcf6a 42%, #5aa83f 100%)',
        parts: [
          { e: '\u2600\ufe0f', x: 86, y: 8, s: 14 }, { e: '\u2601\ufe0f', x: 30, y: 9, s: 13 },
          { e: '\ud83e\udd85', x: 60, y: 11, s: 11 },
          { e: '\ud83c\udf33', x: 11, y: 28, s: 20 }, { e: '\ud83e\udd92', x: 42, y: 26, s: 22 },
          { e: '\ud83c\udf3f', x: 68, y: 33, s: 13 }, { e: '\ud83c\udf34', x: 88, y: 28, s: 18 },
          { e: '\ud83e\udd93', x: 20, y: 58, s: 21 }, { e: '\ud83e\udd8f', x: 52, y: 58, s: 21 },
          { e: '\ud83e\udd9b', x: 82, y: 58, s: 21 },
          { e: '\ud83e\udd8c', x: 22, y: 84, s: 20 }, { e: '\ud83d\udc2b', x: 54, y: 84, s: 21 },
          { e: '\ud83e\udd98', x: 84, y: 84, s: 20 },
          { e: '\ud83c\udf3a', x: 10, y: 96, s: 12 }, { e: '\ud83c\udf3f', x: 45, y: 97, s: 12 }
        ]
      },
      {
        name: '숲속',
        bg: 'linear-gradient(#cdeccd 0%, #9ed49e 42%, #6ab26a 42%, #3f7f42 100%)',
        parts: [
          { e: '\ud83c\udf32', x: 10, y: 16, s: 20 }, { e: '\ud83c\udf32', x: 90, y: 16, s: 20 },
          { e: '\ud83c\udf43', x: 50, y: 10, s: 12 }, { e: '\ud83d\udc3f\ufe0f', x: 70, y: 20, s: 13 },
          { e: '\ud83e\udda5', x: 30, y: 28, s: 21 }, { e: '\ud83d\udc3b', x: 58, y: 32, s: 20 },
          { e: '\ud83e\udd9d', x: 20, y: 56, s: 20 }, { e: '\ud83e\udd94', x: 50, y: 58, s: 19 },
          { e: '\ud83d\udc28', x: 80, y: 56, s: 20 },
          { e: '\ud83e\udda6', x: 24, y: 82, s: 20 }, { e: '\ud83e\udd8c', x: 56, y: 82, s: 20 },
          { e: '\ud83c\udf44', x: 84, y: 84, s: 14 },
          { e: '\ud83c\udf3f', x: 12, y: 96, s: 13 }, { e: '\ud83c\udf44', x: 46, y: 96, s: 12 }
        ]
      }
    ],
    sea: [
      {
        name: '바닷속',
        bg: 'linear-gradient(#7fd4ff 0%, #2b9fd8 42%, #0a6ea8 78%, #e9d8a6 100%)',
        parts: [
          { e: '\ud83d\udc0b', x: 38, y: 22, s: 28 }, { e: '\ud83d\udc20', x: 76, y: 14, s: 15 },
          { e: '\ud83d\udc1f', x: 12, y: 18, s: 14 }, { e: '\ud83d\udc21', x: 14, y: 42, s: 16 },
          { e: '\ud83e\udd91', x: 88, y: 34, s: 17 },
          { e: '\ud83e\udd88', x: 64, y: 48, s: 24 }, { e: '\ud83d\udc2c', x: 34, y: 50, s: 20 },
          { e: '\ud83d\udc19', x: 20, y: 70, s: 21 }, { e: '\ud83d\udc22', x: 52, y: 70, s: 19 },
          { e: '\ud83e\udd90', x: 82, y: 68, s: 16 },
          { e: '\ud83e\udd80', x: 60, y: 88, s: 17 }, { e: '\ud83d\udc1a', x: 22, y: 90, s: 14 },
          { e: '\ud83e\udd9e', x: 86, y: 90, s: 16 }, { e: '\ud83c\udf0a', x: 44, y: 94, s: 16 }
        ]
      },
      {
        name: '바닷가',
        bg: 'linear-gradient(#bfe6ff 0%, #7fd4ff 36%, #3aa7dd 58%, #f0dfae 58%, #e0c98d 100%)',
        parts: [
          { e: '\u2600\ufe0f', x: 86, y: 8, s: 14 }, { e: '\u2601\ufe0f', x: 32, y: 8, s: 12 },
          { e: '\ud83e\udd85', x: 62, y: 12, s: 11 },
          { e: '\u26f5', x: 22, y: 26, s: 19 }, { e: '\ud83d\udea2', x: 74, y: 28, s: 19 },
          { e: '\ud83d\udc2c', x: 50, y: 44, s: 20 }, { e: '\ud83d\udc1f', x: 16, y: 48, s: 15 },
          { e: '\ud83d\udc0b', x: 84, y: 48, s: 18 },
          { e: '\ud83d\udc22', x: 20, y: 70, s: 19 }, { e: '\ud83e\udd6d', x: 52, y: 68, s: 18 },
          { e: '\ud83c\udfd6\ufe0f', x: 84, y: 70, s: 17 },
          { e: '\ud83d\udc27', x: 26, y: 90, s: 19 }, { e: '\ud83e\udd80', x: 58, y: 90, s: 17 },
          { e: '\ud83d\udc1a', x: 86, y: 92, s: 14 }
        ]
      }
    ]
  };

  function theme(id) {
    return THEMES.filter(function (t) { return t.id === id; })[0];
  }

  global.Data = { THEMES: THEMES, SCENES: SCENES, theme: theme };
})(window);
