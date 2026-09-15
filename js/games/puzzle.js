/* 🧩 퍼즐 — 그림을 조각내서 섞는다. 조각 두 개를 차례로 눌러 자리를 바꾼다.
   드래그가 없어서 작은 손으로도 정확하게 다룰 수 있다.
   4x4(16조각)부터 시작해서 6x6(36조각)까지 올라간다. */
Engine.register({
  id: 'puzzle',
  name: '퍼즐',
  icon: '🧩',
  levels: 3,
  upAfter: 1,
  downAfter: 999,

  round: function (ctx) {
    var sizes = [4, 5, 6];
    var N = sizes[ctx.level()];
    var scene = ctx.one(Data.SCENES[ctx.theme.id]);
    var total = N * N;

    /* 섞기 — 이미 맞춰진 상태로 시작하지 않게 한다 */
    var order = [];
    for (var i = 0; i < total; i++) order.push(i);
    do { order = ctx.shuffle(order); } while (isSolved());

    var selected = -1;
    var solved = false;

    ctx.ask('그림을 맞춰봐!', scene.name);

    /* 완성 그림 미리보기 — 무엇을 만드는지 알아야 맞출 수 있다 */
    var preview = ctx.el('div', 'puzzle-preview');
    var previewBox = ctx.el('div', 'preview-box');
    preview.appendChild(previewBox);
    preview.appendChild(ctx.el('div', 'preview-name', scene.name));
    ctx.root.appendChild(preview);

    var board = ctx.el('div', 'puzzle-board');
    board.style.setProperty('--n', N);
    ctx.root.appendChild(board);

    var pieces = [];
    var boardPx = 0;

    function isSolved() {
      for (var k = 0; k < order.length; k++) if (order[k] !== k) return false;
      return true;
    }

    /* 장면 하나를 그린다. 배경 위에 그림 여러 개를 흩어놓아서
       어느 조각에나 볼 거리가 있게 만든다. */
    function sceneNode(px) {
      var d = ctx.el('div', 'scene');
      d.style.width = px + 'px';
      d.style.height = px + 'px';
      d.style.background = scene.bg;
      scene.parts.forEach(function (p) {
        var s = ctx.el('span', 'scene-part');
        s.style.left = p.x + '%';
        s.style.top = p.y + '%';
        if (p.v) {
          s.className += ' sp-svg';
          s.style.width = (px * p.s / 100) + 'px';
          s.innerHTML = Art.VEHICLES[p.v];
        } else {
          s.className += ' sp-emoji';
          s.style.fontSize = (px * p.s / 100) + 'px';
          s.textContent = p.e;
        }
        d.appendChild(s);
      });
      return d;
    }

    function paint(pos) {
      var piece = pieces[pos];
      var k = order[pos];
      var cell = boardPx / N;
      piece.scene.style.left = (-(k % N) * cell) + 'px';
      piece.scene.style.top = (-Math.floor(k / N) * cell) + 'px';
    }

    function build() {
      boardPx = Math.floor(Math.min(
        document.documentElement.clientWidth * 0.92,
        document.documentElement.clientHeight * 0.56
      ) / N) * N;
      if (boardPx < N * 34) boardPx = N * 34;

      board.style.width = boardPx + 'px';
      board.style.height = boardPx + 'px';
      board.innerHTML = '';
      pieces = [];

      previewBox.innerHTML = '';
      previewBox.appendChild(sceneNode(96));

      for (var pos = 0; pos < total; pos++) {
        (function (pos) {
          var cellEl = ctx.el('button', 'piece');
          cellEl.type = 'button';
          var sc = sceneNode(boardPx);
          cellEl.appendChild(sc);
          cellEl.scene = sc;
          cellEl.addEventListener('click', function () { tap(pos); });
          board.appendChild(cellEl);
          pieces[pos] = cellEl;
        })(pos);
      }
      for (var p2 = 0; p2 < total; p2++) paint(p2);
    }

    function tap(pos) {
      if (solved) return;
      if (selected === -1) {
        selected = pos;
        pieces[pos].classList.add('sel');
        Sound.pop();
        return;
      }
      if (selected === pos) {
        pieces[pos].classList.remove('sel');
        selected = -1;
        return;
      }
      /* 두 조각의 자리를 바꾼다 */
      var a = selected, b = pos;
      pieces[a].classList.remove('sel');
      selected = -1;
      var t = order[a]; order[a] = order[b]; order[b] = t;
      paint(a); paint(b);
      Sound.pop();

      if (isSolved()) {
        solved = true;
        board.classList.add('solved');
        setTimeout(function () {
          ctx.win({ id: 'scene', name: scene.name, emoji: '🧩' });
        }, 600);
      }
    }

    build();
    var onResize = function () { if (!solved) build(); };
    window.addEventListener('resize', onResize);
    setTimeout(function () { ctx.say(scene.name + ' 그림을 맞춰봐'); }, 250);

    /* 화면을 떠날 때 정리 */
    return function () { window.removeEventListener('resize', onResize); };
  }
});
