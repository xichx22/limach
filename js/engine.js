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
    n.innerHTML = Art.html(item) + '<span class="tile-name">' + item.name + '</span>';
    n.dataset.id = item.id;
    return n;
  }

  function gridCols(n) {
    var wide = document.documentElement.clientWidth >= 720;
    if (n <= 6) return wide ? 3 : 2;
    if (n <= 12) return wide ? 4 : 3;
    return wide ? 5 : 4;
  }

  /* 놀이판을 만든다. 칸 크기는 화면 너비와 높이 중 작은 쪽에 맞춰지므로
     6개든 12개든 화면을 꽉 채우면서 잘리지 않는다.
     reserve = 머리말·버튼 등 놀이판 말고 쓰는 세로 공간(px) */
  function makeGrid(cls, n, reserve, cols) {
    cols = cols || gridCols(n);
    var g = el('div', cls);
    g.style.setProperty('--cols', cols);
    g.style.setProperty('--rows', Math.ceil(n / cols));
    g.style.setProperty('--reserve', (reserve || 190) + 'px');
    return g;
  }

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
  function celebrate(item, done) {
    Sound.chime();
    confetti();
    banner.innerHTML =
      '<div class="banner-art">' + Art.html(item) + '</div>' +
      '<div class="banner-word">' + item.name + '</div>';
    banner.hidden = false;
    banner.classList.add('show');
    setTimeout(function () { Sound.speak(item.name); }, 240);
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
      var lv = Level.get(g.id, theme.id);
      var card = el('button', 'game-card');
      card.type = 'button';
      card.innerHTML = '<span class="game-emoji">' + g.icon + '</span>' +
                       '<span class="game-label">' + g.name + '</span>' +
                       '<span class="game-stars">' + stars(lv, g.levels) + '</span>';
      card.addEventListener('click', function () {
        Sound.unlock(); Sound.pop(); play(theme, g);
      });
      grid.appendChild(card);
    });
    app.appendChild(grid);
  }

  /* ---------- 놀이 화면 ---------- */

  function play(theme, game) {
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
        celebrate(item, function () {
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
      confetti: confetti, say: say
    };

    function next() {
      if (current) { try { current(); } catch (e) { /* 무시 */ } current = null; }
      root.innerHTML = '';
      current = game.round(ctx) || null;
    }

    say(theme.name + ' ' + game.name);
    setTimeout(next, 700);
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
