/* 🧩 퍼즐 — 진짜 퍼즐처럼 만든다.
   빈 판이 있고, 조각은 아래(또는 옆) 쟁반에 흩어져 있다.
   조각을 끌어다 제자리에 놓으면 딸깍 들어간다. 끌기가 어려우면 눌렀다 놓는 것도 된다.
   조각마다 돌기와 홈이 있어서 서로 맞물린다. */
Engine.register({
  id: 'puzzle',
  name: '퍼즐',
  icon: '🧩',
  levels: 4,
  upAfter: 1,
  downAfter: 2,

  round: function (ctx) {
    var sizes = [3, 4, 5, 6];
    var N = sizes[ctx.level()];
    var total = N * N;

    var subject, photo;

    /* 부모가 방금 고른 사진이 있으면 그걸로 퍼즐을 만든다.
       이 놀이에 머무는 동안 계속 그 사진을 쓰고, 판이 끝나면 더 어려워진다. */
    if (ctx.customPhoto) {
      subject = { id: 'mine-puzzle', name: ctx.customPhoto.name, src: ctx.customPhoto.src };
      photo = ctx.customPhoto.src;
    }

    /* 조각마다 단서가 있는 사진만 쓴다 */
    var usable = ctx.theme.items.filter(function (i) {
      if (!Art.src(i)) return false;
      /* 내 사진도 조각에 단서가 있는 것만 고른다.
         도감을 잘라 넣은 카드는 흰 여백이 많아 퍼즐이 되지 않는다.
         (🧩 로 직접 고른 사진은 부모가 정한 것이니 그대로 쓴다) */
      if (ctx.theme.custom) return !window.Mine || Mine.puzzleOk(i);
      return !window.PuzzleOk || PuzzleOk[ctx.theme.id + '_' + i.id];
    });
    /* 저장소 주제는 쓸 만한 게 하나도 없으면 그냥 아무거나 쓴다.
       내 사진은 그러면 안 된다 — 도감을 잘라 넣은 카드만 잔뜩인 경우가 있다. */
    if (!usable.length && !ctx.theme.custom) {
      usable = ctx.theme.items.filter(function (i) { return !!Art.src(i); });
    }
    var hasAny = ctx.theme.items.some(function (i) { return !!Art.src(i); });
    if (!subject) {
      if (!usable.length) {
        ctx.root.appendChild(ctx.el('div', 'notice',
          hasAny
            ? '넣어둔 사진은 퍼즐로 만들기 어려워요.<br>' +
              '(잘라 넣은 카드처럼 빈 곳이 많으면 조각에 단서가 없어요)<br>' +
              '아래 📷 로 다른 사진을 골라보세요.'
            : '이 주제엔 아직 사진이 없어요.<br>아래 📷 로 사진을 골라도 돼요.'));
      } else {
        subject = ctx.one(usable);
        photo = Art.src(subject);
      }
    }

    /* 맞물리는 모서리 — 이웃한 두 조각이 같은 곡선을 나눠 갖는다 */
    var H = [], V = [];
    for (var r = 0; r < N; r++) {
      H[r] = []; V[r] = [];
      for (var c = 0; c < N; c++) {
        H[r][c] = Math.random() < 0.5 ? 1 : -1;   // (r,c) 와 (r,c+1) 사이
        V[r][c] = Math.random() < 0.5 ? 1 : -1;   // (r,c) 와 (r+1,c) 사이
      }
    }

    ctx.root.classList.add('split');
    ctx.ask('끼워봐!', subject ? subject.name : '');

    var boardWrap = ctx.el('div', 'jig-wrap');

    /* 폰에 있는 사진을 고르면 바로 그 사진 퍼즐이 시작된다 */
    var bar = ctx.el('div', 'tool-bar');
    var pickBtn = ctx.el('label', 'tool-btn',
      '📷 내 사진으로<input type="file" accept="image/*" hidden>');
    var fileInput = pickBtn.querySelector('input');
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!f) return;
      Mine.shrink(f, 640).then(function (url) {
        ctx.customPhoto = { src: url, name: '내 사진' };
        Sound.pop();
        ctx.next();
      }).catch(function () {
        alert('이 사진은 읽지 못했어요. 다른 사진으로 해보세요.');
      });
    });
    bar.appendChild(pickBtn);

    if (ctx.customPhoto) {
      var backBtn2 = ctx.el('button', 'tool-btn', '🖼️ 원래 사진');
      backBtn2.type = 'button';
      backBtn2.addEventListener('click', function () {
        ctx.customPhoto = null;
        Sound.pop();
        ctx.next();
      });
      bar.appendChild(backBtn2);
    }
    boardWrap.appendChild(bar);

    if (!subject) { ctx.root.appendChild(boardWrap); return; }

    var preview = ctx.el('div', 'puzzle-preview');
    preview.innerHTML = '<div class="preview-box"><img src="' + photo + '" alt=""></div>' +
                        '<div class="preview-name">' + subject.name + '</div>';

    var board = ctx.el('div', 'jig-board');
    boardWrap.appendChild(preview);
    boardWrap.appendChild(board);
    ctx.root.appendChild(boardWrap);

    var tray = ctx.el('div', 'jig-tray');
    ctx.root.appendChild(tray);

    var cell = 0, tab = 0, boardPx = 0, trayCell = 0;
    var placed = {};                 // 자리에 들어간 조각
    var pool = ctx.shuffle((function () {
      var a = []; for (var i = 0; i < total; i++) a.push(i); return a;
    })());
    var trayMax = 6;
    var solved = false;

    /* 한 변을 그린다. s 가 0 이면 곧은 선, 아니면 돌기/홈이 생긴다. */
    function side(x, y, dx, dy, len, s) {
      var p = '';
      var nx = dy, ny = -dx;                      // 바깥쪽 방향
      if (!s) return 'L' + (x + dx * len) + ' ' + (y + dy * len);
      var a = 0.4, b = 0.6, rr = (0.118 * len).toFixed(2);
      p += 'L' + (x + dx * len * a) + ' ' + (y + dy * len * a);
      p += 'A' + rr + ' ' + rr + ' 0 1 ' + (s > 0 ? 1 : 0) + ' ' +
           (x + dx * len * b) + ' ' + (y + dy * len * b);
      p += 'L' + (x + dx * len) + ' ' + (y + dy * len);
      /* nx, ny 는 호의 방향(sweep)으로 이미 반영된다 */
      return p;
    }

    function pathFor(r, c, e, t) {
      var x0 = t, y0 = t;
      var d = 'M' + x0 + ' ' + y0;
      d += side(x0, y0, 1, 0, e, r > 0 ? -V[r - 1][c] : 0);              // 위
      d += side(x0 + e, y0, 0, 1, e, c < N - 1 ? H[r][c] : 0);           // 오른쪽
      d += side(x0 + e, y0 + e, -1, 0, e, r < N - 1 ? V[r][c] : 0);      // 아래
      d += side(x0, y0 + e, 0, -1, e, c > 0 ? -H[r][c - 1] : 0);         // 왼쪽
      return d + 'Z';
    }

    function stylePiece(node, idx, e) {
      e = e || cell;
      var t = Math.round(e * 0.2);
      var r = Math.floor(idx / N), c = idx % N;
      node.style.width = (e + t * 2) + 'px';
      node.style.height = (e + t * 2) + 'px';
      node.style.backgroundImage = 'url("' + photo + '")';
      node.style.backgroundSize = (e * N) + 'px ' + (e * N) + 'px';
      node.style.backgroundPosition = (-(c * e - t)) + 'px ' + (-(r * e - t)) + 'px';
      var d = pathFor(r, c, e, t);
      node.style.clipPath = 'path("' + d + '")';
      node.style.webkitClipPath = 'path("' + d + '")';
    }

    function sizes2() {
      var d = document.documentElement;
      var land = d.clientWidth > d.clientHeight;

      /* 쟁반 크기를 먼저 정한다. 그래야 판에 줄 높이가 얼마인지 알 수 있다. */
      var perRow = land ? 2 : 4;
      var trayW = land ? Math.min(d.clientWidth * 0.34, 300) : d.clientWidth * 0.94;
      trayCell = Math.max(38, Math.min(110, Math.floor((trayW - 20) / perRow) - 12));
      trayMax = land ? 8 : 8;
      var trayRows = Math.ceil(trayMax / perRow);
      var trayH = trayRows * (trayCell * 1.4 + 8) + 18;

      var headH = land ? 72 : 92;
      var previewH = land ? 0 : 104;
      var availW = land ? d.clientWidth * 0.56 : d.clientWidth * 0.95;
      var availH = d.clientHeight - headH - previewH - (land ? 12 : trayH + 14);

      boardPx = Math.floor(Math.min(availW, availH) / N) * N;
      if (boardPx < N * 46) boardPx = N * 46;
      cell = boardPx / N;
      tab = Math.round(cell * 0.2);
      if (trayCell > cell) trayCell = Math.floor(cell);
    }

    function buildBoard() {
      board.innerHTML = '';
      board.style.width = boardPx + 'px';
      board.style.height = boardPx + 'px';
      board.style.setProperty('--n', N);

      var ghost = ctx.el('div', 'jig-ghost');
      ghost.style.backgroundImage = 'url("' + photo + '")';
      board.appendChild(ghost);

      for (var i = 0; i < total; i++) {
        (function (i) {
          var r = Math.floor(i / N), c = i % N;
          var slot = ctx.el('div', 'jig-slot');
          slot.dataset.slot = i;
          slot.style.left = (c * cell) + 'px';
          slot.style.top = (r * cell) + 'px';
          slot.style.width = cell + 'px';
          slot.style.height = cell + 'px';
          slot.addEventListener('click', function () { tryPlace(i); });
          board.appendChild(slot);
        })(i);
      }
      /* 이미 놓은 조각 다시 그리기 */
      Object.keys(placed).forEach(function (k) { drawPlaced(+k); });
    }

    function drawPlaced(idx) {
      var r = Math.floor(idx / N), c = idx % N;
      var node = ctx.el('div', 'jig-fixed');
      node.style.left = (c * cell - tab) + 'px';
      node.style.top = (r * cell - tab) + 'px';
      stylePiece(node, idx);
      board.appendChild(node);
    }

    var selected = -1;

    function fillTray() {
      tray.innerHTML = '';
      var shown = pool.slice(0, trayMax);
      shown.forEach(function (idx) {
        var pc = ctx.el('button', 'jpiece');
        pc.type = 'button';
        pc.dataset.idx = idx;
        stylePiece(pc, idx, trayCell);
        if (idx === selected) pc.classList.add('sel');
        attachDrag(pc, idx);
        tray.appendChild(pc);
      });
      if (!pool.length && !solved) finish();
    }

    function tryPlace(slotIdx) {
      if (solved || selected < 0) return;
      if (slotIdx !== selected) {
        /* 자리가 아니면 들어가지 않는다 — 진짜 퍼즐처럼 */
        var s = board.querySelector('[data-slot="' + slotIdx + '"]');
        if (s) { s.classList.add('nope'); setTimeout(function () { s.classList.remove('nope'); }, 400); }
        Sound.wrong();
        return;
      }
      accept(selected);
    }

    function accept(idx) {
      var i = pool.indexOf(idx);
      if (i >= 0) pool.splice(i, 1);
      placed[idx] = true;
      selected = -1;
      drawPlaced(idx);
      var slot = board.querySelector('[data-slot="' + idx + '"]');
      if (slot) slot.classList.add('done');
      Sound.pop();
      fillTray();
    }

    function finish() {
      solved = true;
      board.classList.add('solved');
      setTimeout(function () { ctx.win(subject); }, 600);
    }

    /* 끌어서 옮기기 — 못 하면 눌렀다 놓기로도 된다 */
    function attachDrag(node, idx) {
      var ghostEl = null, moved = false, startX = 0, startY = 0;

      function down(e) {
        if (solved) return;
        e.preventDefault();
        moved = false;
        startX = e.clientX; startY = e.clientY;
        selected = idx;
        Array.prototype.forEach.call(tray.children, function (x) { x.classList.remove('sel'); });
        node.classList.add('sel');
        node.setPointerCapture && node.setPointerCapture(e.pointerId);
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
      }
      function move(e) {
        if (!moved && Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) < 8) return;
        if (!moved) {
          moved = true;
          ghostEl = node.cloneNode(true);
          ghostEl.className = 'jpiece flying';
          document.body.appendChild(ghostEl);
          node.classList.add('lifted');
        }
        ghostEl.style.left = e.clientX + 'px';
        ghostEl.style.top = e.clientY + 'px';
      }
      function up(e) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        node.classList.remove('lifted');
        if (ghostEl) { ghostEl.remove(); ghostEl = null; }
        if (!moved) return;                    // 그냥 눌렀다 뗀 것 = 고르기
        var el = document.elementFromPoint(e.clientX, e.clientY);
        var slot = el && el.closest && el.closest('.jig-slot');
        if (slot) tryPlace(+slot.dataset.slot);
      }
      node.addEventListener('pointerdown', down);
    }

    /* 머리말·미리보기 높이는 글자 길이에 따라 달라져서 미리 계산하기 어렵다.
       한 번 그려보고 넘친 만큼 판을 줄인다. */
    var adjusted = false;
    function build() {
      sizes2();
      buildBoard();
      fillTray();
      requestAnimationFrame(function () {
        if (adjusted || solved) return;
        var d = document.documentElement;
        var over = d.scrollHeight - d.clientHeight;
        if (over <= 2) return;
        adjusted = true;
        boardPx = Math.max(N * 46, Math.floor((boardPx - over - 10) / N) * N);
        cell = boardPx / N;
        tab = Math.round(cell * 0.2);
        if (trayCell > cell) trayCell = Math.floor(cell);
        buildBoard();
        fillTray();
      });
    }

    build();
    var onResize = function () { if (!solved) { adjusted = false; build(); } };
    window.addEventListener('resize', onResize);
    setTimeout(function () {
      ctx.say(ctx.spoken(subject) + ' 퍼즐이야. 조각을 끼워봐');
    }, 250);

    return function () {
      window.removeEventListener('resize', onResize);
      var f = document.querySelector('.jpiece.flying');
      if (f) f.remove();
    };
  }
});
