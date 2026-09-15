/* 🧩 퍼즐 — 사진 한 장을 조각내서 섞는다. 조각 두 개를 차례로 눌러 자리를 바꾼다.
   드래그가 없어서 작은 손으로도 정확하게 다룰 수 있다.
   4x4(16조각)부터 6x6(36조각)까지 올라간다. */
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
    var total = N * N;

    /* 사진이 있는 것만 퍼즐로 쓸 수 있다 */
    var usable = ctx.theme.items.filter(function (i) { return !!Art.src(i); });
    if (!usable.length) {
      ctx.root.appendChild(ctx.el('div', 'notice', '이 주제엔 아직 사진이 없어요.'));
      return;
    }
    var subject = ctx.one(usable);
    var photo = Art.src(subject);

    var order = [];
    for (var i = 0; i < total; i++) order.push(i);
    do { order = ctx.shuffle(order); } while (isSolved());

    var selected = -1, solved = false;

    ctx.ask('그림을 맞춰봐!', subject.name);

    /* 완성 그림 미리보기 — 무엇을 만드는지 알아야 맞출 수 있다 */
    ctx.root.classList.add('split');

    var preview = ctx.el('div', 'puzzle-preview');
    preview.innerHTML = '<div class="preview-box"><img src="' + photo + '" alt=""></div>' +
                        '<div class="preview-name">' + subject.name + '</div>';
    ctx.root.appendChild(preview);

    var board = ctx.el('div', 'puzzle-board');
    board.style.setProperty('--n', N);
    ctx.root.appendChild(board);

    var pieces = [], boardPx = 0;

    function isSolved() {
      for (var k = 0; k < order.length; k++) if (order[k] !== k) return false;
      return true;
    }

    function paint(pos) {
      var cell = boardPx / N, k = order[pos];
      pieces[pos].style.backgroundPosition =
        (-(k % N) * cell) + 'px ' + (-Math.floor(k / N) * cell) + 'px';
    }

    function build() {
      var d = document.documentElement;
      var land = d.clientWidth > d.clientHeight;
      /* 가로모드에선 미리보기가 옆에 있으니 세로를 거의 다 쓴다 */
      boardPx = Math.floor(Math.min(
        d.clientWidth * (land ? 0.62 : 0.94),
        d.clientHeight - (land ? 150 : 215)
      ) / N) * N;
      if (boardPx < N * 34) boardPx = N * 34;

      board.style.width = boardPx + 'px';
      board.style.height = boardPx + 'px';
      board.innerHTML = '';
      pieces = [];

      for (var pos = 0; pos < total; pos++) {
        (function (pos) {
          var c = ctx.el('button', 'piece');
          c.type = 'button';
          c.style.backgroundImage = 'url("' + photo + '")';
          c.style.backgroundSize = boardPx + 'px ' + boardPx + 'px';
          c.addEventListener('click', function () { tap(pos); });
          board.appendChild(c);
          pieces[pos] = c;
        })(pos);
      }
      for (var p = 0; p < total; p++) paint(p);
    }

    function tap(pos) {
      if (solved) return;
      if (selected === -1) {
        selected = pos; pieces[pos].classList.add('sel'); Sound.pop(); return;
      }
      if (selected === pos) {
        pieces[pos].classList.remove('sel'); selected = -1; return;
      }
      var a = selected, b = pos;
      pieces[a].classList.remove('sel');
      selected = -1;
      var t = order[a]; order[a] = order[b]; order[b] = t;
      paint(a); paint(b);
      Sound.pop();

      if (isSolved()) {
        solved = true;
        board.classList.add('solved');
        setTimeout(function () { ctx.win(subject); }, 600);
      }
    }

    build();
    var onResize = function () { if (!solved) build(); };
    window.addEventListener('resize', onResize);
    setTimeout(function () { ctx.say(ctx.spoken(subject) + ' 그림을 맞춰봐'); }, 250);
    return function () { window.removeEventListener('resize', onResize); };
  }
});
