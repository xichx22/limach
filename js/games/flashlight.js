/* 🔦 손전등으로 찾기 — 화면이 깜깜하다. 손가락을 댄 곳만 동그랗게 밝아진다.
   한 번에 하나씩만 보이니, 어디를 봤는지 기억하면서 찾아야 한다.
   틀려도 벌이 없다. 그냥 그 자리가 밝아질 뿐이다. */
Engine.register({
  id: 'flashlight',
  name: '손전등 찾기',
  icon: '🔦',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var counts = [6, 9, 12];
    var beams  = [120, 100, 84];   // 손전등 동그라미 반지름(px) — 작을수록 어렵다
    var lv = ctx.level();
    var n = Math.min(counts[lv], ctx.theme.items.length);
    var items = ctx.pick(ctx.theme.items, n);
    var target = ctx.one(items);
    var answered = false;

    ctx.ask('손전등으로 찾아봐', target.name);

    var stage = ctx.el('div', 'torch-stage');
    var grid = ctx.grid('play-grid', n, 240, null, 170);
    items.forEach(function (it) {
      var t = ctx.tile(it);
      t.addEventListener('click', function (e) {
        if (answered) return;
        moveLight(e);
        if (it.id === target.id) {
          answered = true;
          dark.classList.add('off');       // 정답이면 불이 켜진다
          setTimeout(function () { ctx.win(it); }, 450);
        } else {
          Sound.pop();
        }
      });
      grid.appendChild(t);
    });
    stage.appendChild(grid);

    var dark = ctx.el('div', 'torch-dark');
    dark.style.setProperty('--beam', beams[lv] + 'px');
    stage.appendChild(dark);
    ctx.root.appendChild(stage);

    function moveLight(e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX != null ? e.clientX : r.left + r.width / 2) - r.left;
      var y = (e.clientY != null ? e.clientY : r.top + r.height / 2) - r.top;
      dark.style.setProperty('--x', x + 'px');
      dark.style.setProperty('--y', y + 'px');
    }

    /* 빈 곳을 눌러도 손전등이 따라간다 */
    stage.addEventListener('pointerdown', moveLight);

    setTimeout(function () {
      ctx.say(ctx.spoken(target) + ', 손전등으로 찾아봐');
    }, 250);
  }
});
