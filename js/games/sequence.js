/* 👆 순서대로 — 이름 몇 개를 차례로 들려주고, 그 순서 그대로 누르게 한다.
   머릿속에 몇 개까지 담아둘 수 있는지(기억 폭)를 늘린다.
   들을 때는 글자를 같이 보여주고, 누를 때는 가린다. */
Engine.register({
  id: 'sequence',
  name: '순서대로',
  icon: '👆',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var lens = [2, 3, 4];
    var want = Math.min(lens[ctx.level()], ctx.theme.items.length);
    var pool = ctx.shuffle(ctx.theme.items);
    var order = pool.slice(0, want);                 // 눌러야 할 순서
    var extras = pool.slice(want, want + 2);         // 헷갈리게 섞을 것
    var board = ctx.shuffle(order.concat(extras));
    var step = 0, locked = true;
    var timers = [];

    function words() {
      return order.map(function (i) { return i.name; }).join(', ');
    }

    /* 들려주면서 글자도 같이 보여준다. 다 들려준 뒤에는 글자를 가린다. */
    function play() {
      locked = true;
      step = 0;
      tiles.forEach(function (t) { t.classList.remove('done'); });
      ctx.ask('순서대로 눌러봐', words());
      ctx.say(order.map(function (i) { return ctx.spoken(i); }).join(', '));
      timers.push(setTimeout(function () {
        ctx.ask('순서대로 눌러봐', '');
        locked = false;
      }, 1100 * want + 700));
    }

    var bar = ctx.el('div', 'tool-bar');
    var again = ctx.el('button', 'tool-btn', '🔊 다시 들려줘');
    again.type = 'button';
    again.addEventListener('click', function () { play(); });
    bar.appendChild(again);
    ctx.root.appendChild(bar);

    var grid = ctx.grid('play-grid', board.length, 250, null, 170);
    var tiles = [];
    board.forEach(function (it) {
      var t = ctx.tile(it);
      t.addEventListener('click', function () {
        if (locked) return;
        if (it.id === order[step].id) {
          t.classList.add('done');
          Sound.pop();
          step++;
          if (step >= order.length) {
            locked = true;
            ctx.win(order[order.length - 1]);
          }
        } else {
          ctx.lose(t);
          /* 틀리면 처음부터 다시 — 순서는 그대로 두고 한 번 더 들려준다 */
          timers.push(setTimeout(function () {
            tiles.forEach(function (x) { x.classList.remove('done'); });
            step = 0;
            ctx.say('다시 해볼까? ' + order.map(function (i) { return ctx.spoken(i); }).join(', '));
          }, 700));
        }
      });
      tiles.push(t);
      grid.appendChild(t);
    });
    ctx.root.appendChild(grid);

    timers.push(setTimeout(play, 300));
    return function () { timers.forEach(clearTimeout); };
  }
});
