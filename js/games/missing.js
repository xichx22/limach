/* 🫥 없어진 거 찾기 — 사진 여러 장을 잠깐 보여준 뒤 가리고, 하나를 빼고 다시 보여준다.
   머릿속에 잠깐 담아두는 힘(작업기억)을 쓴다. 짝맞추기보다 한 판이 짧아 지루하지 않다. */
Engine.register({
  id: 'missing',
  name: '없어진 거',
  icon: '🫥',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var counts = [4, 6, 8];
    var lv = ctx.level();
    var n = Math.min(counts[lv], ctx.theme.items.length - 2);
    if (n < 3) {
      ctx.root.appendChild(ctx.el('div', 'notice', '사진이 조금 더 필요해요.'));
      return;
    }
    var pool = ctx.shuffle(ctx.theme.items);
    var shown = pool.slice(0, n);          // 처음에 보여줄 것들
    var extras = pool.slice(n, n + 2);     // 보기에 섞을 딴 것들
    var target = ctx.one(shown);           // 사라질 것
    var rest = shown.filter(function (x) { return x.id !== target.id; });
    var timers = [];

    ctx.ask('잘 봐!', '');

    var board = ctx.grid('play-grid', n, 300);
    shown.forEach(function (it) { board.appendChild(ctx.tile(it)); });
    ctx.root.appendChild(board);

    /* 오래 보여줄수록 쉽다. 개수가 늘면 보는 시간도 늘려준다. */
    var lookMs = 2600 + n * 400;

    timers.push(setTimeout(function () { ctx.say('잘 봤어?'); }, 900));

    timers.push(setTimeout(function () {
      /* 잠깐 가린다 */
      board.classList.add('hide-all');
      ctx.ask('누가 없어졌을까?', '');
      ctx.say('누가 없어졌을까?');

      timers.push(setTimeout(function () {
        ctx.root.innerHTML = '';

        var left = ctx.grid('play-grid', rest.length, 440);
        left.classList.add('small');
        ctx.shuffle(rest).forEach(function (it) { left.appendChild(ctx.tile(it)); });
        ctx.root.appendChild(left);

        ctx.root.appendChild(ctx.el('div', 'sub-label', '없어진 건 누구?'));

        var choices = ctx.shuffle([target].concat(extras));
        var pick = ctx.grid('play-grid', choices.length, 560);
        var answered = false;
        choices.forEach(function (it) {
          var t = ctx.tile(it);
          t.addEventListener('click', function () {
            if (answered) return;
            if (it.id === target.id) { answered = true; ctx.win(it); }
            else {
              ctx.lose(t);
              setTimeout(function () { ctx.say('다시 생각해봐'); }, 620);
            }
          });
          pick.appendChild(t);
        });
        ctx.root.appendChild(pick);
      }, 900));
    }, lookMs));

    return function () { timers.forEach(clearTimeout); };
  }
});
