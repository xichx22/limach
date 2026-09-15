/* 🔎 확대해서 맞추기 — 사진의 한 부분만 크게 확대해서 보여주고 원래 사진을 찾는다.
   전체를 못 보고 일부만으로 알아맞혀야 해서, 머릿속에서 나머지를 그려내는 힘을 쓴다.
   단계가 오를수록 더 크게 확대되어 단서가 줄어든다. */
Engine.register({
  id: 'zoom',
  name: '확대 맞추기',
  icon: '🔎',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var counts = [4, 6, 9];
    var zooms  = [230, 320, 460];   // 확대 배율(%) — 클수록 어렵다
    var lv = ctx.level();
    var n = Math.min(counts[lv], ctx.theme.items.length);
    var items = ctx.pick(ctx.theme.items, n);
    var target = ctx.one(items);
    var answered = false;

    ctx.ask('어느 사진일까?', '');

    /* 사진의 한가운데만 보여주면 늘 같은 부분이라 재미없다. 매번 다른 곳을 확대한다. */
    var px = 20 + Math.random() * 60;
    var py = 20 + Math.random() * 60;

    ctx.root.classList.add('split');

    var box = ctx.el('div', 'zoom-box');
    var src = Art.src(target);
    if (src) {
      box.style.backgroundImage = 'url("' + src + '")';
      box.style.backgroundSize = zooms[lv] + '%';
      box.style.backgroundPosition = px.toFixed(0) + '% ' + py.toFixed(0) + '%';
    } else {
      box.innerHTML = '<span class="zoom-emoji">' + (target.emoji || '❓') + '</span>';
    }
    ctx.root.appendChild(box);

    var grid = ctx.grid('play-grid', n, 380, null, 150, 0.58);
    items.forEach(function (it) {
      var t = ctx.tile(it);
      t.addEventListener('click', function () {
        if (answered) return;
        if (it.id === target.id) { answered = true; ctx.win(it); }
        else {
          ctx.lose(t);
          setTimeout(function () { ctx.say('다시 잘 봐'); }, 620);
        }
      });
      grid.appendChild(t);
    });
    ctx.root.appendChild(grid);

    setTimeout(function () { ctx.say('어느 사진일까?'); }, 250);
  }
});
