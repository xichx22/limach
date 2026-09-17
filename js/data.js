/* 놀이에 나오는 내용.
   사진은 photos/<주제>_<id>.jpg 에 들어 있다 (위키미디어 공용의 자유 이용 사진).
   단어를 추가하려면 여기에 한 줄 넣고 같은 이름으로 사진을 넣으면 된다. */
(function (global) {
  'use strict';

  function withPhotos(theme) {
    theme.items.forEach(function (it) {
      if (!it.photo && !it.emoji) it.photo = theme.id + '_' + it.id + '.jpg';
    });
    return theme;
  }

  var THEMES = [
    /* 예전엔 '특수자동차' 하나에 열두 대를 다 넣었다.
       소방차와 쓰레기차가 한 칸에 섞여 있으면 고르기도 어렵고,
       놀이에서 비슷한 것끼리 나오지도 않는다. 하는 일로 나눴다. */
    withPhotos({
      id: 'fire', name: '소방차', icon: '🚒', color: '#e8503a', sibling: 'build',
      items: [
        { id: 'pumper',    name: '소방차' },
        { id: 'ladder',    name: '사다리차' },
        { id: 'watertank', name: '물탱크차' },
        { id: 'wildfire',  name: '산불차' },
        { id: 'airport',   name: '공항소방차' }
      ]
    }),
    withPhotos({
      id: 'build', name: '공사차', icon: '🚧', color: '#eab308', sibling: 'farm',
      items: [
        { id: 'excavator', name: '굴착기' },
        { id: 'bulldozer', name: '불도저' },
        { id: 'dump',      name: '덤프트럭' },
        { id: 'mixer',     name: '레미콘' },
        { id: 'pumpcar',   name: '콘크리트펌프카' },
        { id: 'crane',     name: '크레인' },
        { id: 'skylift',   name: '고소작업차' },
        { id: 'forklift',  name: '지게차' },
        { id: 'loader',    name: '휠로더' },
        { id: 'grader',    name: '그레이더' },
        { id: 'roller',    name: '로드롤러' },
        { id: 'paver',     name: '도로포장차' }
      ]
    }),
    withPhotos({
      id: 'farm', name: '농사차', icon: '🚜', color: '#3fa85a', sibling: 'build',
      items: [
        { id: 'tractor',      name: '트랙터' },
        { id: 'combine',      name: '콤바인' },
        { id: 'tiller',       name: '경운기' },
        { id: 'transplanter', name: '이앙기' }
      ]
    }),
    withPhotos({
      id: 'cargo', name: '짐차', icon: '🚚', color: '#8b5e3c', sibling: 'clean',
      items: [
        { id: 'cargo',      name: '카고트럭' },
        { id: 'container',  name: '컨테이너차' },
        { id: 'carcarrier', name: '자동차운반차' },
        { id: 'tanklorry',  name: '탱크로리' },
        { id: 'tow',        name: '견인차' }
      ]
    }),
    withPhotos({
      id: 'clean', name: '청소차', icon: '🗑️', color: '#64748b', sibling: 'cargo',
      items: [
        { id: 'garbage',    name: '쓰레기차' },
        { id: 'sweeper',    name: '노면청소차' },
        { id: 'sprinkler',  name: '살수차' },
        { id: 'snowplow',   name: '제설차' },
        { id: 'skiploader', name: '암롤차' }
      ]
    }),
    withPhotos({
      id: 'car', name: '자동차', icon: '🚗', color: '#2f7fe0', sibling: 'cargo',
      items: [
        { id: 'sedan',      name: '승용차' },
        { id: 'jeep',       name: '지프차' },
        { id: 'bus',        name: '버스' },
        { id: 'truck',      name: '트럭' },
        { id: 'pickup',     name: '픽업트럭' },
        { id: 'taxi',       name: '택시' },
        { id: 'police',     name: '경찰차' },
        { id: 'ambulance',  name: '구급차' },
        { id: 'racecar',    name: '경주차' },
        { id: 'van',        name: '승합차' },
        { id: 'moto',       name: '오토바이' },
        { id: 'bike',       name: '자전거' },
        { id: 'plane',      name: '비행기' },
        { id: 'helicopter', name: '헬리콥터' },
        { id: 'ship',       name: '배' }
      ]
    }),
    withPhotos({
      id: 'train', name: '기차', icon: '🚄', color: '#4f46e5', sibling: 'car',
      /* say 는 읽어줄 말. KTX 는 'KTX' 로 보여주고 '케이티엑스' 로 읽어야 한다. */
      items: [
        { id: 'ktx',           name: 'KTX',            say: '케이티엑스' },
        { id: 'ktxsancheon',   name: 'KTX-산천',        say: '케이티엑스 산천' },
        { id: 'ktxeum',        name: 'KTX-이음',        say: '케이티엑스 이음' },
        { id: 'srt',           name: 'SRT',            say: '에스알티' },
        { id: 'itxsaemaeul',   name: 'ITX-새마을',      say: '아이티엑스 새마을' },
        { id: 'itxcheongchun', name: 'ITX-청춘',        say: '아이티엑스 청춘' },
        { id: 'itxmaeum',      name: 'ITX-마음',        say: '아이티엑스 마음' },
        { id: 'mugunghwa',     name: '무궁화호' },
        { id: 'saemaeul',      name: '새마을호' },
        { id: 'nuriro',        name: '누리로' },
        { id: 'subway',        name: '지하철' },
        { id: 'busansubway',   name: '부산지하철' },
        { id: 'monorail',      name: '모노레일' },
        { id: 'lightrail',     name: '경전철' },
        { id: 'maglev',        name: '자기부상열차' },
        { id: 'tram',          name: '트램' },
        { id: 'steam',         name: '증기기관차' },
        { id: 'electricloco',  name: '전기기관차' },
        { id: 'goldtrain',     name: '서해금빛열차' },
        { id: 'arirangtrain',  name: '정선아리랑열차' },
        { id: 'seatrain',      name: '남도해양열차' },
        { id: 'valleytrain',   name: '백두대간협곡열차' }
      ]
    }),
    withPhotos({
      id: 'animal', name: '동물', icon: '🦁', color: '#e08b1f', sibling: 'sea',
      items: [
        { id: 'rhino',    name: '코뿔소' },
        { id: 'hippo',    name: '하마' },
        { id: 'giraffe',  name: '기린' },
        { id: 'zebra',    name: '얼룩말' },
        { id: 'leopard',  name: '표범' },
        { id: 'kangaroo', name: '캥거루' },
        { id: 'koala',    name: '코알라' },
        { id: 'panda',    name: '판다' },
        { id: 'raccoon',  name: '너구리' },
        { id: 'otter',    name: '수달' },
        { id: 'hedgehog', name: '고슴도치' },
        { id: 'sloth',    name: '나무늘보' },
        { id: 'alpaca',   name: '알파카' },
        { id: 'camel',    name: '낙타' },
        { id: 'deer',     name: '사슴' },
        { id: 'orangutan',name: '오랑우탄' }
      ]
    }),
    withPhotos({
      id: 'sea', name: '해양생물', icon: '🐋', color: '#0d9488', sibling: 'animal',
      items: [
        { id: 'whale',     name: '고래' },
        { id: 'shark',     name: '상어' },
        { id: 'dolphin',   name: '돌고래' },
        { id: 'octopus',   name: '문어' },
        { id: 'squid',     name: '오징어' },
        { id: 'crab',      name: '게' },
        { id: 'lobster',   name: '바닷가재' },
        { id: 'shrimp',    name: '새우' },
        { id: 'clownfish', name: '흰동가리' },
        { id: 'puffer',    name: '복어' },
        { id: 'jellyfish', name: '해파리' },
        { id: 'turtle',    name: '바다거북' },
        { id: 'seal',      name: '물개' },
        { id: 'conch',     name: '소라' },
        { id: 'penguin',   name: '펭귄' },
        { id: 'starfish',  name: '불가사리' }
      ]
    })
  ];

  /* 내 사진 — 부모가 직접 넣은 사진. 이 기기 안에만 있다. */
  var MINE = { id: 'mine', name: '내 사진', icon: '📷', color: '#7c5cd6', sibling: 'animal',
               custom: true, items: [] };

  /* 사진 파일이 실제로 있는 항목만 쓴다.
     (사진을 못 구한 단어가 게임에 나오면 빈 칸이 보이기 때문) */
  var MISSING = {};
  function markMissing(map) { MISSING = map || {}; }
  function usable(theme) {
    if (theme.custom) return theme.items;
    return theme.items.filter(function (it) { return !MISSING[theme.id + '/' + it.id]; });
  }

  function themes() {
    MINE.items = (global.Mine ? Mine.all() : []);
    return THEMES.concat([MINE]);
  }

  function theme(id) {
    return themes().filter(function (t) { return t.id === id; })[0];
  }

  global.Data = { THEMES: THEMES, MINE: MINE, themes: themes, theme: theme,
                  usable: usable, markMissing: markMissing };
})(window);
