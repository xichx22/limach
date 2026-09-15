/* 👂 소리 듣고 찾기 — 이름을 들려주고 여러 개 중에서 찾게 한다.
   어휘력과 청각 주의집중을 키운다. 단어를 글자로도 같이 보여준다. */
Engine.register({
  id: 'listen',
  name: '듣고 찾기',
  icon: '👂',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var counts = [6, 9, 12];
    var n = Math.min(counts[ctx.level()], ctx.theme.items.length);
    var items = ctx.pick(ctx.theme.items, n);
    var target = ctx.one(items);
    var answered = false;

    ctx.ask('어디 있어?', target.name);

    var said = ctx.spoken(target);

    var bar = ctx.el('div', 'tool-bar');
    var again = ctx.el('button', 'tool-btn', '🔊 다시 들려줘');
    again.type = 'button';
    again.addEventListener('click', function () { ctx.say(target.name + ', 어디 있어?'); });
    bar.appendChild(again);
    ctx.root.appendChild(bar);

    var grid = ctx.grid('play-grid', n, 250, null, 170);

    items.forEach(function (it) {
      var t = ctx.tile(it);
      t.addEventListener('click', function () {
        if (answered) return;
        if (it.id === target.id) {
          answered = true;
          ctx.win(it);
        } else {
          ctx.lose(t);
          setTimeout(function () { ctx.say(said + ' 찾아봐'); }, 620);
        }
      });
      grid.appendChild(t);
    });

    ctx.root.appendChild(grid);
    setTimeout(function () { ctx.say(said + ', 어디 있어?'); }, 250);
  }
});
