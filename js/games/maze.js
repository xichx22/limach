/* 🌀 미로 — 손가락으로 길을 따라가 목적지까지 간다.
   벽에 막히면 돌아나와야 해서 '어디로 갈지 미리 생각하는 힘'을 쓴다.
   손가락을 떼지 않고 쭉 끌어도 되고, 옆 칸을 하나씩 눌러도 된다. */
Engine.register({
  id: 'maze',
  name: '미로',
  icon: '🌀',
  levels: 3,
  upAfter: 2,
  downAfter: 2,
  supports: function () { return true; },

  round: function (ctx) {
    var sizes = [4, 5, 6];
    var N = sizes[ctx.level()];
    var timers = [];

    /* 미로 만들기 — 한 붓 그리기로 길을 파면 막다른 길이 생긴다 */
    var wall = [];   // wall[r][c] = {N,E,S,W} true 면 벽
    for (var r = 0; r < N; r++) {
      wall[r] = [];
      for (var c = 0; c < N; c++) wall[r][c] = { n: true, e: true, s: true, w: true };
    }
    var seen = {};
    (function dig(r, c) {
      seen[r + ',' + c] = 1;
      var dirs = ctx.shuffle([['n', -1, 0, 's'], ['s', 1, 0, 'n'], ['e', 0, 1, 'w'], ['w', 0, -1, 'e']]);
      dirs.forEach(function (d) {
        var nr = r + d[1], nc = c + d[2];
        if (nr < 0 || nc < 0 || nr >= N || nc >= N) return;
        if (seen[nr + ',' + nc]) return;
        wall[r][c][d[0]] = false;
        wall[nr][nc][d[3]] = false;
        dig(nr, nc);
      });
    })(0, 0);

    var at = { r: 0, c: 0 };
    var goal = { r: N - 1, c: N - 1 };
    var done = false;

    var hero = ctx.theme.icon || '🚗';
    ctx.ask('길을 따라 가봐!', '');

    var board = ctx.el('div', 'maze');
    board.style.setProperty('--n', N);
    var cells = [];
    for (var i = 0; i < N * N; i++) {
      (function (i) {
        var rr = Math.floor(i / N), cc = i % N;
        var cell = ctx.el('div', 'mcell');
        var w = wall[rr][cc];
        if (w.n) cell.classList.add('wn');
        if (w.e) cell.classList.add('we');
        if (w.s) cell.classList.add('ws');
        if (w.w) cell.classList.add('ww');
        cell.dataset.r = rr; cell.dataset.c = cc;
        if (rr === goal.r && cc === goal.c) cell.classList.add('goal');
        board.appendChild(cell);
        cells.push(cell);
      })(i);
    }
    ctx.root.appendChild(board);

    var me = ctx.el('div', 'maze-me', hero);
    board.appendChild(me);

    var flag = ctx.el('div', 'maze-flag', '🏁');
    board.appendChild(flag);

    function place() {
      me.style.setProperty('--r', at.r);
      me.style.setProperty('--c', at.c);
      flag.style.setProperty('--r', goal.r);
      flag.style.setProperty('--c', goal.c);
      cells[at.r * N + at.c].classList.add('trail');
    }

    function canGo(r, c, nr, nc) {
      if (nr < 0 || nc < 0 || nr >= N || nc >= N) return false;
      if (nr === r - 1 && nc === c) return !wall[r][c].n;
      if (nr === r + 1 && nc === c) return !wall[r][c].s;
      if (nc === c + 1 && nr === r) return !wall[r][c].e;
      if (nc === c - 1 && nr === r) return !wall[r][c].w;
      return false;
    }

    function moveTo(nr, nc) {
      if (done) return false;
      if (!canGo(at.r, at.c, nr, nc)) return false;
      at = { r: nr, c: nc };
      place();
      Sound.pop();
      if (at.r === goal.r && at.c === goal.c) {
        done = true;
        board.classList.add('cleared');
        timers.push(setTimeout(function () {
          ctx.win({ id: 'maze', name: '도착!', say: '도착', emoji: '🏁' });
        }, 500));
      }
      return true;
    }

    /* 손가락이 빨리 움직이면 pointermove 사이에 칸을 건너뛴다. 옆 칸만 받으면
       거기서 멈춰버려서, 미로 안 최단 길이 3칸 이내면 그 길을 한 칸씩 따라간다.
       방향만 보고 '세로 먼저' 식으로 고르면 막다른 갈래로 빠진다(시뮬레이션 200판 중 95판).
       3칸보다 멀면 벽 너머로 순간이동하는 셈이라 받지 않는다. */
    function stepToward(tr, tc) {
      if (done || (at.r === tr && at.c === tc)) return;
      var prev = {}, q = [[at.r, at.c, 0]], key = function (r, c) { return r + ',' + c; };
      prev[key(at.r, at.c)] = null;
      while (q.length) {
        var cur = q.shift(), r = cur[0], c = cur[1];
        if (r === tr && c === tc) break;
        if (cur[2] >= 3) continue;
        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (n) {
          if (!(key(n[0], n[1]) in prev) && canGo(r, c, n[0], n[1])) {
            prev[key(n[0], n[1])] = [r, c];
            q.push([n[0], n[1], cur[2] + 1]);
          }
        });
      }
      if (!(key(tr, tc) in prev)) return;
      var path = [];
      for (var p = [tr, tc]; p && (p[0] !== at.r || p[1] !== at.c); p = prev[key(p[0], p[1])]) path.unshift(p);
      path.forEach(function (p) { moveTo(p[0], p[1]); });
    }

    function cellAt(x, y) {
      var el = document.elementFromPoint(x, y);
      return el && el.closest ? el.closest('.mcell') : null;
    }

    var dragging = false;
    board.addEventListener('pointerdown', function (e) {
      dragging = true;
      var cell = cellAt(e.clientX, e.clientY);
      if (cell) moveTo(+cell.dataset.r, +cell.dataset.c);
    });
    board.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var cell = cellAt(e.clientX, e.clientY);
      if (cell) stepToward(+cell.dataset.r, +cell.dataset.c);
    });
    function stop() { dragging = false; }
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);

    place();
    timers.push(setTimeout(function () { ctx.say('깃발까지 길을 따라 가봐'); }, 250));
    return function () {
      timers.forEach(clearTimeout);
      document.removeEventListener('pointerup', stop);
      document.removeEventListener('pointercancel', stop);
    };
  }
});
