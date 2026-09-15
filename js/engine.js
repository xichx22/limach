/* 화면 전환, 타일 그리기, 칭찬 효과, 부모 잠금 뒤로가기.
   게임 5개가 공통으로 쓰는 부분은 전부 여기에 있다. */
(function (global) {
  'use strict';

  var app, fx, banner;
  var games = {};      // 게임 모듈들이 스스로 등록한다
  var current = null;  // 지금 돌아가는 게임의 정리 함수

  /* ---------- 작은 도구들 ---------- */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pick(arr, n) { return shuffle(arr).slice(0, n); }

  function one(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- 타일: 그림 + 이름.
     지한이가 글자를 배우는 중이라 이름은 항상 같이 보여준다. ---------- */

  function tile(item, opts) {
    opts = opts || {};
    var n = el('button', 'tile' + (opts.cls ? ' ' + opts.cls : ''));
    n.type = 'button';
    /* '백두대간협곡열차' 같은 긴 이름은 글씨를 줄여야 잘리지 않는다 */
    var longName = (item.name || '').length >= 7 ? ' long' : '';
    n.innerHTML = Art.html(item) +
      '<span class="tile-name' + longName + '">' + item.name + '</span>';
    n.dataset.id = item.id;
    return n;
  }

  /* 앱이 쓸 수 있는 가로 폭 (CSS 와 같은 값을 쓴다) */
  function appWidth() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--appw');
    var max = parseFloat(v) || 760;
    return Math.min(document.documentElement.clientWidth, max);
  }

  /* 칸 수를 화면 모양에 맞춰 정한다.
     세로로 길면 칸을 적게, 가로로 넓으면 칸을 많이 둬야 타일이 커진다.
     가능한 칸 수를 전부 재보고 타일이 가장 커지는 쪽을 고른다. */
  function gridCols(n, reserve, width) {
    reserve = reserve || 190;
    var gap = 10;
    var availW = (width || appWidth()) - 32;
    var availH = document.documentElement.clientHeight - reserve;
    var best = 1, bestSize = -1;
    for (var c = 1; c <= n; c++) {
      var r = Math.ceil(n / c);
      var cw = (availW - (c - 1) * gap) / c;
      var ch = (availH - (r - 1) * gap) / r;
      var size = Math.min(cw, ch);
      if (size > bestSize + 0.5) { bestSize = size; best = c; }
    }
    return best;
  }

  /* 놀이판을 만든다. 칸 크기는 화면 너비와 높이 중 작은 쪽에 맞춰지므로
     6개든 12개든 화면을 꽉 채우면서 잘리지 않는다.
     reserve = 머리말·버튼 등 놀이판 말고 쓰는 세로 공간(px) */
  function isLandscape() {
    var d = document.documentElement;
    return d.clientWidth > d.clientHeight;
  }

  /* reserve = 놀이판 말고 쓰는 세로 공간(px).
     landReserve = 가로모드에서의 값. 가로모드에선 문제를 옆에 두므로 훨씬 작다. */
  function makeGrid(cls, n, reserve, cols, landReserve, landFrac) {
    reserve = reserve || 190;
    var g = el('div', cls);
    g.dataset.n = n;
    g.dataset.reserve = reserve;
    g.dataset.landReserve = landReserve || reserve;
    g.dataset.landFrac = landFrac || 1;   // 가로모드에서 이 판이 쓰는 가로 비율
    if (cols) g.dataset.fixedCols = cols;
    layoutGrid(g);
    return g;
  }

  /* 칸 수와 칸 크기를 모두 여기서 정한다.
     CSS 가 따로 계산하면 서로 어긋나서 화면 밖으로 넘친다. */
  function layoutGrid(g) {
    var land = isLandscape();
    var n = parseInt(g.dataset.n, 10) || 1;
    var reserve = parseInt(
      land ? (g.dataset.landReserve || g.dataset.reserve) : g.dataset.reserve, 10) || 190;
    var frac = land ? (parseFloat(g.dataset.landFrac) || 1) : 1;
    var width = appWidth() * frac;
    var cols = parseInt(g.dataset.fixedCols, 10) || gridCols(n, reserve, width);
    g.style.setProperty('--gridw', Math.round(width) + 'px');
    g.style.setProperty('--cols', cols);
    g.style.setProperty('--rows', Math.ceil(n / cols));
    g.style.setProperty('--reserve', reserve + 'px');
  }

  /* 화면을 돌리면 칸 수를 다시 잡는다. 놀던 내용은 그대로 둔다. */
  var relayoutTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(function () {
      var grids = document.querySelectorAll('.play-grid, .card-grid');
      Array.prototype.forEach.call(grids, layoutGrid);
    }, 120);
  });

  /* ---------- 칭찬 / 아쉬움 ---------- */

  function confetti(n) {
    var chars = ['🎉', '⭐', '✨', '🎊', '💫', '🌟'];
    for (var i = 0; i < (n || 22); i++) {
      var c = el('span', 'confetti', chars[i % chars.length]);
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.top = (-10 - Math.random() * 20) + 'vh';
      c.style.setProperty('--dur', (1.1 + Math.random() * 0.9) + 's');
      c.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      c.style.fontSize = (18 + Math.random() * 20) + 'px';
      fx.appendChild(c);
      (function (node) { setTimeout(function () { node.remove(); }, 2200); })(c);
    }
  }

  /* 맞췄을 때 — 그림과 단어를 화면 가득 크게 보여주고 또박또박 읽어준다 */
  function celebrate(item, isNew, done) {
    if (typeof isNew === 'function') { done = isNew; isNew = false; }
    Sound.chime();
    confetti();
    banner.innerHTML =
      '<div class="banner-art">' + Art.html(item) +
      (isNew ? '<span class="new-sticker">새 스티커!</span>' : '') + '</div>' +
      '<div class="banner-word">' + item.name + '</div>';
    banner.hidden = false;
    banner.classList.add('show');
    setTimeout(function () { Sound.speak(spoken(item)); }, 240);
    setTimeout(function () {
      banner.classList.remove('show');
      setTimeout(function () { banner.hidden = true; if (done) done(); }, 260);
    }, 1500);
  }

  /* 틀렸을 때 — 혼내지 않는다. 살짝 흔들고 넘어간다. */
  function nope(node) {
    Sound.wrong();
    if (node) {
      node.classList.add('shake');
      setTimeout(function () { node.classList.remove('shake'); }, 500);
    }
  }

  function say(text) { Sound.speak(text); }

  /* 화면에 보이는 글자와 읽어주는 말이 다를 수 있다.
     KTX 는 'KTX' 로 보여주고 '케이티엑스' 로 읽어야 한다. */
  function spoken(item) { return (item && (item.say || item.name)) || ''; }

  /* ---------- 화면 틀 ---------- */

  /* 뒤로가기는 1.2초 길게 눌러야 동작한다. 지한이가 실수로 나가서 우는 일 방지. */
  function backButton(onBack) {
    var b = el('button', 'back-btn', '<span class="ring"></span><span class="ico">🏠</span>');
    b.type = 'button';
    b.setAttribute('aria-label', '뒤로 (길게 누르기)');
    var timer = null, raf = null, start = 0;
    var HOLD = 1200;

    function tick() {
      var p = Math.min(1, (Date.now() - start) / HOLD);
      b.style.setProperty('--p', (p * 360) + 'deg');
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    function begin(e) {
      e.preventDefault();
      start = Date.now();
      tick();
      timer = setTimeout(function () { cancel(); Sound.pop(); onBack(); }, HOLD);
    }
    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      b.style.setProperty('--p', '0deg');
    }
    b.addEventListener('pointerdown', begin);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      b.addEventListener(ev, cancel);
    });
    return b;
  }

  function stars(lv, max) {
    var s = '';
    for (var i = 0; i < max; i++) s += (i <= lv ? '★' : '☆');
    return s;
  }

  function clearScreen() {
    if (current) { try { current(); } catch (e) { /* 무시 */ } current = null; }
    Sound.stop();
    app.innerHTML = '';
  }

  /* ---------- 홈: 주제 고르기 ---------- */

  function home() {
    clearScreen();
    app.className = 'app home';
    var head = el('div', 'screen-head');
    head.appendChild(el('h1', 'screen-title', '지한이 놀이터'));
    var album = el('button', 'album-btn', '🏆');
    album.type = 'button';
    album.setAttribute('aria-label', '모은 것 보기');
    album.addEventListener('click', function () { Sound.unlock(); Sound.pop(); albumScreen(); });
    head.appendChild(album);
    app.appendChild(head);

    var grid = el('div', 'home-grid');
    Data.themes().forEach(function (t) {
      var card = el('button', 'menu-card');
      card.type = 'button';
      card.style.background = 'linear-gradient(150deg, ' + t.color + ', ' + shade(t.color, -22) + ')';
      card.innerHTML = '<span class="menu-emoji">' + t.icon + '</span>' +
                       '<span class="menu-label">' + t.name + '</span>';
      card.addEventListener('click', function () {
        Sound.unlock(); Sound.pop(); say(t.name); menu(t);
      });
      grid.appendChild(card);
    });
    app.appendChild(grid);

    /* 사진 출처 표기 — 위키미디어 공용 사진의 이용 조건이다 */
    var credit = el('div', 'credit',
      '사진 출처: <a href="https://github.com/xichx22/limach/blob/main/CREDITS.md" ' +
      'target="_blank" rel="noopener">위키미디어 공용</a>');
    app.appendChild(credit);
  }

  /* ---------- 주제 안: 게임 고르기 ---------- */

  function menu(theme) {
    clearScreen();
    app.className = 'app';
    app.style.background = 'linear-gradient(170deg, #fff8ea, ' + shade(theme.color, 78) + ')';

    var head = el('div', 'screen-head');
    head.appendChild(backButton(home));
    head.appendChild(el('h1', 'screen-title', theme.icon + ' ' + theme.name));
    app.appendChild(head);

    if (theme.custom) {
      var manage = el('button', 'manage-btn', '📷 사진 넣고 빼기');
      manage.type = 'button';
      manage.addEventListener('click', function () { Sound.pop(); photoManager(theme); });
      app.appendChild(manage);
      if (Data.usable(theme).length < 4) {
        app.appendChild(el('div', 'notice',
          '사진을 4장 넘게 넣으면 놀이를 할 수 있어요.<br>' +
          '넣은 사진은 이 기기에만 저장되고 아무 데도 올라가지 않아요.'));
        return;
      }
    }

    var grid = el('div', 'game-grid');
    Object.keys(games).forEach(function (k) {
      var g = games[k];
      /* 주제에 맞지 않는 놀이는 아예 보여주지 않는다 */
      if (g.supports && !g.supports(theme)) return;
      var lv = Level.get(g.id, theme.id);
      var card = el('button', 'game-card');
      card.type = 'button';
      /* 단계가 하나뿐인 놀이(색칠·따라 말하기)는 별을 보여주지 않는다 */
      card.innerHTML = '<span class="game-emoji">' + g.icon + '</span>' +
                       '<span class="game-label">' + g.name + '</span>' +
                       (g.levels > 1 ? '<span class="game-stars">' + stars(lv, g.levels) + '</span>' : '');
      card.addEventListener('click', function () {
        Sound.unlock(); Sound.pop(); play(theme, g);
      });
      grid.appendChild(card);
    });
    app.appendChild(grid);
  }

  /* ---------- 놀이 화면 ---------- */

  function play(theme, game, seed) {
    clearScreen();
    app.className = 'app';
    app.style.background = 'linear-gradient(170deg, #fffaf0, ' + shade(theme.color, 82) + ')';

    var head = el('div', 'screen-head');
    head.appendChild(backButton(function () { menu(theme); }));
    var ask = el('div', 'ask');
    head.appendChild(ask);
    app.appendChild(head);

    var root = el('div', 'play-root');
    app.appendChild(root);

    /* 사진이 없는 항목은 빈 칸으로 보이므로 게임에 내보내지 않는다 */
    var playable = { id: theme.id, name: theme.name, icon: theme.icon,
                     color: theme.color, sibling: theme.sibling, custom: theme.custom,
                     items: Data.usable(theme) };

    var ctx = {
      theme: playable,
      customPhoto: (seed && seed.customPhoto) || null,
      game: game,
      root: root,
      /* 문제를 말과 글자로 동시에 보여준다 — 소리와 글자를 잇는 게 읽기의 시작 */
      ask: function (text, word) {
        ask.innerHTML = word
          ? '<span class="ask-text">' + text + '</span><span class="ask-word">' + word + '</span>'
          : '<span class="ask-text">' + text + '</span>';
      },
      level: function () { return Level.get(game.id, theme.id); },
      win: function (item) {
        var r = Level.win(game, theme.id);
        /* 주제에 실제로 들어있는 것만 도감에 모은다 (개수·장소 같은 건 제외) */
        var real = playable.items.some(function (i) { return i.id === item.id; });
        var isNew = real ? Collect.add(theme.id, item.id) : false;
        celebrate(item, isNew, function () {
          if (r.leveledUp) {
            Sound.levelUp();
            setTimeout(function () { say('더 어려운 거 해볼까?'); }, 260);
            setTimeout(next, 1400);
          } else {
            next();
          }
        });
      },
      lose: function (node) {
        nope(node);
        Level.lose(game, theme.id);
      },
      next: function () { next(); },
      el: el, tile: tile, gridCols: gridCols, grid: makeGrid, shuffle: shuffle, pick: pick, one: one,
      confetti: confetti, say: say, spoken: spoken
    };

    function next() {
      if (current) { try { current(); } catch (e) { /* 무시 */ } current = null; }
      root.className = 'play-root';
      root.innerHTML = '';
      current = game.round(ctx) || null;
    }

    say(theme.name + ' ' + game.name);
    setTimeout(next, 700);
  }

  /* ---------- 🏆 모은 것 도감 ---------- */

  function albumScreen(openId) {
    clearScreen();
    app.className = 'app';
    app.style.background = 'linear-gradient(170deg, #fffaf0, #ffe9c9)';

    var head = el('div', 'screen-head');
    head.appendChild(backButton(home));
    head.appendChild(el('h1', 'screen-title', '🏆 내가 모은 것'));
    app.appendChild(head);

    var wrap = el('div', 'album');
    Data.themes().forEach(function (t) {
      var items = Data.usable(t);
      if (!items.length) return;
      var p = Collect.progress(t);

      var head2 = el('button', 'album-head');
      head2.type = 'button';
      head2.innerHTML = '<span class="album-icon">' + t.icon + '</span>' +
        '<span class="album-name">' + t.name + '</span>' +
        '<span class="album-count">' + p.got + ' / ' + p.total + '</span>' +
        '<span class="album-bar"><i style="width:' +
        (p.total ? Math.round(p.got / p.total * 100) : 0) + '%"></i></span>';

      var grid = el('div', 'album-grid');
      grid.hidden = (openId ? openId !== t.id : p.got === 0);

      items.forEach(function (it) {
        var got = Collect.has(t.id, it.id);
        var cell = el('button', 'album-cell' + (got ? '' : ' empty'));
        cell.type = 'button';
        cell.innerHTML = got
          ? Art.html(it) + '<span class="album-label">' + it.name + '</span>'
          : '<span class="album-q">?</span><span class="album-label">?</span>';
        if (got) {
          cell.addEventListener('click', function () {
            Sound.pop(); Sound.speak(spoken(it));
          });
        }
        grid.appendChild(cell);
      });

      head2.addEventListener('click', function () {
        Sound.pop();
        grid.hidden = !grid.hidden;
      });

      wrap.appendChild(head2);
      wrap.appendChild(grid);
    });
    app.appendChild(wrap);
  }

  /* ---------- 내 사진 관리 (부모용) ----------
     고른 사진은 이 기기 안에만 저장된다. 서버로 보내지 않는다. */

  function photoManager(theme) {
    clearScreen();
    app.className = 'app';
    app.style.background = 'linear-gradient(170deg, #fffaf0, ' + shade(theme.color, 82) + ')';

    var head = el('div', 'screen-head');
    head.appendChild(backButton(function () { menu(theme); }));
    head.appendChild(el('h1', 'screen-title', '📷 내 사진'));
    app.appendChild(head);

    var note = el('div', 'notice',
      '넣은 사진은 <b>이 기기에만</b> 저장돼요. 인터넷으로 올라가지 않아요.');
    app.appendChild(note);

    var picker = el('label', 'add-photo', '➕ 사진 고르기 (여러 장 한 번에)' +
      '<input type="file" accept="image/*" multiple hidden>');
    var input = picker.querySelector('input');
    app.appendChild(picker);

    /* 여러 개를 한 장에 모아둔 그림(도감 같은)을 칸칸이 잘라서 넣는다 */
    var sliceBtn = el('button', 'add-photo alt', '🔳 모아놓은 사진 잘라서 넣기');
    sliceBtn.type = 'button';
    sliceBtn.addEventListener('click', function () {
      Sound.pop(); sheetSlicer(theme);
    });
    app.appendChild(sliceBtn);

    var form = el('div', 'name-form');
    form.hidden = true;
    app.appendChild(form);

    var list = el('div', 'photo-list');
    app.appendChild(list);

    function draw() {
      list.innerHTML = '';
      var items = Mine.all();
      if (!items.length) {
        list.appendChild(el('div', 'notice', '아직 넣은 사진이 없어요.'));
        return;
      }
      items.forEach(function (it) {
        var row = el('div', 'photo-row');
        row.innerHTML = '<img src="' + it.src + '" alt=""><span class="photo-name">' +
                        it.name + '</span>';
        /* 이 사진으로 바로 퍼즐 */
        var go = el('button', 'photo-go', '🧩');
        go.type = 'button';
        go.setAttribute('aria-label', it.name + ' 퍼즐');
        go.addEventListener('click', function () {
          Sound.pop();
          play(theme, games.puzzle, { customPhoto: { src: it.src, name: it.name } });
        });
        row.appendChild(go);

        var del = el('button', 'photo-del', '✕');
        del.type = 'button';
        del.addEventListener('click', function () {
          Mine.remove(it.id).then(draw);
        });
        row.appendChild(del);
        list.appendChild(row);
      });
    }

    /* 여러 장을 한 번에 고르면 한 장씩 차례로 이름을 묻는다 */
    var queue = [];

    function askName() {
      if (!queue.length) { form.hidden = true; form.innerHTML = ''; return; }
      var f = queue[0];
      Mine.shrink(f, 480).then(function (dataUrl) {
        form.hidden = false;
        form.innerHTML =
          '<div class="name-count">' + (queue.length > 1 ? queue.length + '장 남음' : '마지막 한 장') + '</div>' +
          '<img class="name-preview" src="' + dataUrl + '" alt="">' +
          '<input class="name-input" type="text" placeholder="이름을 적어주세요 (예: 타요)" maxlength="14">' +
          '<div class="name-row">' +
          '<button class="name-skip" type="button">건너뛰기</button>' +
          '<button class="name-save" type="button">저장</button>' +
          '</div>';
        var box = form.querySelector('.name-input');
        try { box.focus(); } catch (e) { /* 무시 */ }

        function next() { queue.shift(); draw(); askName(); }
        function save() {
          var v = (box.value || '').trim();
          if (!v) { try { box.focus(); } catch (e) {} return; }
          Mine.add(v, dataUrl).then(function () {
            Sound.pop(); Sound.speak(v);
            next();
          });
        }
        form.querySelector('.name-save').addEventListener('click', save);
        form.querySelector('.name-skip').addEventListener('click', next);
        box.addEventListener('keydown', function (e) { if (e.key === 'Enter') save(); });
      }).catch(function () {
        queue.shift();
        askName();
      });
    }

    input.addEventListener('change', function () {
      var files = input.files ? Array.prototype.slice.call(input.files) : [];
      input.value = '';
      if (!files.length) return;
      queue = queue.concat(files);
      askName();
    });

    draw();
  }

  /* ---------- 모아놓은 사진 자르기 ----------
     캐릭터 도감처럼 여러 개가 한 장에 모여 있는 그림을 칸 수에 맞춰 잘라
     한 번에 넣는다. 자르는 일은 전부 이 기기 안에서 일어난다. */

  function sheetSlicer(theme) {
    clearScreen();
    app.className = 'app';
    app.style.background = 'linear-gradient(170deg, #fffaf0, ' + shade(theme.color, 82) + ')';

    var head = el('div', 'screen-head');
    head.appendChild(backButton(function () { photoManager(theme); }));
    head.appendChild(el('h1', 'screen-title', '🔳 잘라서 넣기'));
    app.appendChild(head);

    app.appendChild(el('div', 'notice',
      '여러 개가 한 장에 모여 있는 그림을 칸칸이 잘라서 넣어요.<br>' +
      '아래 미리보기를 보면서 칸 수를 맞추면 돼요.'));

    var pick = el('label', 'add-photo', '① 모아놓은 사진 고르기' +
      '<input type="file" accept="image/*" hidden>');
    var file = pick.querySelector('input');
    app.appendChild(pick);

    var panel = el('div', 'slice-panel');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="slice-grid">' +
      '<label>가로 칸<input class="s-cols" type="number" value="4" min="1" max="12"></label>' +
      '<label>세로 칸<input class="s-rows" type="number" value="15" min="1" max="30"></label>' +
      '<label>위 여백 %<input class="s-top" type="number" value="3" min="0" max="40"></label>' +
      '<label>아래 여백 %<input class="s-bot" type="number" value="0" min="0" max="40"></label>' +
      '<label>칸 아래 글자 잘라내기 %<input class="s-cut" type="number" value="18" min="0" max="50"></label>' +
      '</div>' +
      '<div class="slice-hint">② 이름을 한 줄에 하나씩 적어주세요 (왼쪽→오른쪽, 위→아래 순서)</div>' +
      '<textarea class="s-names" rows="5" placeholder="타요\n로기\n라니\n가니"></textarea>' +
      '<div class="slice-preview"></div>' +
      '<button class="s-save" type="button">③ 전부 넣기</button>';
    app.appendChild(panel);

    var img = null;

    function nums() {
      function v(sel, d) {
        var n = parseInt(panel.querySelector(sel).value, 10);
        return isNaN(n) ? d : n;
      }
      return { cols: Math.max(1, v('.s-cols', 4)), rows: Math.max(1, v('.s-rows', 15)),
               top: v('.s-top', 0), bot: v('.s-bot', 0), cut: v('.s-cut', 0) };
    }

    function names() {
      return panel.querySelector('.s-names').value
        .split(/[\n,]/).map(function (x) { return x.trim(); }).filter(Boolean);
    }

    /* 칸 하나를 잘라 정사각형 사진으로 만든다 */
    function cut(r, c, n, size) {
      var top = img.height * n.top / 100;
      var bottom = img.height * (1 - n.bot / 100);
      var cellH = (bottom - top) / n.rows;
      var cellW = img.width / n.cols;
      var sw = cellW, sh = cellH * (1 - n.cut / 100);
      var side = Math.min(sw, sh);
      var sx = c * cellW + (sw - side) / 2;
      var sy = top + r * cellH + (sh - side) / 2;
      var cv = document.createElement('canvas');
      cv.width = cv.height = size || 480;
      var g = cv.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, sx, sy, side, side, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/jpeg', 0.82);
    }

    function preview() {
      if (!img) return;
      var n = nums(), nm = names();
      var box = panel.querySelector('.slice-preview');
      box.innerHTML = '';
      var total = n.cols * n.rows, shown = Math.min(total, 60);
      for (var i = 0; i < shown; i++) {
        var cell = el('div', 'slice-cell');
        cell.innerHTML = '<img src="' + cut(Math.floor(i / n.cols), i % n.cols, n, 120) + '">' +
                         '<span>' + (nm[i] || '?') + '</span>';
        box.appendChild(cell);
      }
      box.appendChild(el('div', 'slice-more',
        '모두 ' + total + '칸 / 이름 ' + nm.length + '개' +
        (nm.length < total ? ' (이름 적은 만큼만 들어가요)' : '')));
    }

    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var url = URL.createObjectURL(f);
      var im = new Image();
      im.onload = function () {
        img = im;
        URL.revokeObjectURL(url);
        panel.hidden = false;
        preview();
      };
      im.onerror = function () { URL.revokeObjectURL(url); alert('사진을 읽지 못했어요.'); };
      im.src = url;
    });

    ['.s-cols', '.s-rows', '.s-top', '.s-bot', '.s-cut'].forEach(function (sel) {
      panel.querySelector(sel).addEventListener('input', preview);
    });
    panel.querySelector('.s-names').addEventListener('input', preview);

    panel.querySelector('.s-save').addEventListener('click', function () {
      if (!img) return;
      var n = nums(), nm = names();
      if (!nm.length) { alert('이름을 한 줄에 하나씩 적어주세요.'); return; }
      var btn = panel.querySelector('.s-save');
      btn.disabled = true;
      btn.textContent = '넣는 중…';
      var i = 0;
      (function step() {
        if (i >= nm.length || i >= n.cols * n.rows) {
          Sound.chime();
          photoManager(theme);
          return;
        }
        var url = cut(Math.floor(i / n.cols), i % n.cols, n, 480);
        Mine.add(nm[i], url).then(function () {
          i++;
          btn.textContent = '넣는 중… ' + i + '/' + nm.length;
          setTimeout(step, 0);
        });
      })();
    });
  }

  /* 색을 밝게/어둡게 (퍼센트) */
  function shade(hex, pct) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function m(v) {
      return Math.max(0, Math.min(255, Math.round(v + (pct > 0 ? (255 - v) : v) * (pct / 100))));
    }
    return '#' + [m(r), m(g), m(b)].map(function (v) {
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  }

  function register(game) { games[game.id] = game; }

  function boot() {
    app = document.getElementById('app');
    fx = document.getElementById('fx');
    banner = document.getElementById('banner');

    var splash = document.getElementById('splash');
    document.getElementById('startBtn').addEventListener('click', function () {
      Sound.unlock();
      Sound.pop();
      splash.classList.add('hide');
      setTimeout(function () { splash.remove(); }, 400);
      Mine.load().then(home, home);
      if (!Sound.canSpeakKorean()) {
        setTimeout(function () {
          var w = el('div', 'novoice', '🔇 이 기기에 한국어 음성이 없어요.<br>글자로만 나와요.');
          document.body.appendChild(w);
          setTimeout(function () { w.remove(); }, 6000);
        }, 600);
      }
    });
  }

  global.Engine = { register: register, boot: boot, home: home, shuffle: shuffle, pick: pick, one: one };
})(window);
