/* 🌑 그림자 맞추기 — 검은 실루엣만 보고 원래 그림을 찾는다.
   색이 사라진 형태만으로 알아보는 힘(형태 인지, 추상화)을 키운다. */
Engine.register({
  id: 'shadow',
  name: '그림자 맞추기',
  icon: '🌑',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var counts = [4, 6, 9];
    var n = Math.min(counts[ctx.level()], ctx.theme.items.length);
    var items = ctx.pick(ctx.theme.items, n);
    var target = ctx.one(items);
    var answered = false;

    ctx.ask('누구 그림자일까?', '');

    var box = ctx.el('div', 'shadow-box');
    box.innerHTML = '<div class="shadow-art">' + Art.html(target) + '</div>';
    ctx.root.appendChild(box);

    var grid = ctx.grid('play-grid', n, 380);

    items.forEach(function (it) {
      var t = ctx.tile(it);
      t.addEventListener('click', function () {
        if (answered) return;
        if (it.id === target.id) {
          answered = true;
          ctx.win(it);
        } else {
          ctx.lose(t);
          setTimeout(function () { ctx.say('다시 잘 봐'); }, 620);
        }
      });
      grid.appendChild(t);
    });

    ctx.root.appendChild(grid);
    setTimeout(function () { ctx.say('누구 그림자일까?'); }, 250);
  }
});
