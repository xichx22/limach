/* 🔍 다른 것 하나 고르기 — 같은 무리 속에 섞인 하나를 찾는다.
   "이건 차, 이건 동물" 하고 묶어서 생각하는 힘(범주화)을 키운다.
   지능검사에도 자주 나오는 유형이다. */
Engine.register({
  id: 'oddone',
  name: '다른 거 찾기',
  icon: '🔍',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var lv = ctx.level();
    var counts = [6, 9, 9];
    var n = counts[lv];

    /* 마지막 단계에서는 '비슷한 주제'에서 가져와서 훨씬 헷갈리게 만든다 */
    var others = Data.themes().filter(function (t) {
      return t.id !== ctx.theme.id && Data.usable(t).length > 0;
    });
    var pool;
    if (lv >= 2) {
      pool = others.filter(function (t) { return t.id === ctx.theme.sibling; });
    } else {
      pool = others.filter(function (t) { return t.id !== ctx.theme.sibling; });
    }
    if (!pool.length) pool = others;

    var oddTheme = ctx.one(pool);
    var odd = ctx.one(Data.usable(oddTheme));
    var same = ctx.pick(ctx.theme.items, n - 1);
    var items = ctx.shuffle(same.concat([odd]));
    var answered = false;

    ctx.ask('다른 거 하나 찾아봐!', '');

    var grid = ctx.grid('play-grid', n, 180);

    items.forEach(function (it) {
      var t = ctx.tile(it);
      t.addEventListener('click', function () {
        if (answered) return;
        if (it.id === odd.id) {
          answered = true;
          setTimeout(function () { ctx.say(ctx.spoken(odd) + '만 달라요'); }, 900);
          ctx.win(it);
        } else {
          ctx.lose(t);
          setTimeout(function () { ctx.say('다른 거 하나 찾아봐'); }, 620);
        }
      });
      grid.appendChild(t);
    });

    ctx.root.appendChild(grid);
    setTimeout(function () { ctx.say('여기서 다른 거 하나 찾아봐'); }, 250);
  }
});
