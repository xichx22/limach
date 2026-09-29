/* 🃏 짝 맞추기 — 뒤집힌 카드 두 장을 뒤집어 같은 그림을 찾는다.
   뒤집을 때마다 이름을 읽어줘서, 기억하는 연습과 이름 익히기를 같이 한다.
   (예전 '키즈게임' 앱에 있던 놀이를 옮겨왔다, 2026-09-29) */
Engine.register({
  id: 'memory',
  name: '짝 맞추기',
  icon: '🃏',
  levels: 3,
  upAfter: 2,
  downAfter: 3,
  supports: function (theme) { return theme.items.length >= 3; },

  round: function (ctx) {
    var pairs = Math.min([3, 4, 6][ctx.level()], ctx.theme.items.length);
    var items = ctx.pick(ctx.theme.items, pairs);
    var deck = ctx.shuffle(items.concat(items));
    var open = [], matched = 0, lock = false, timers = [];

    ctx.ask('똑같은 그림을 찾아봐!', pairs + '쌍');

    var grid = ctx.grid('play-grid', deck.length, 200, null, 150);
    deck.forEach(function (it) {
      var c = ctx.tile(it, { cls: 'mem-card' });
      c.insertAdjacentHTML('beforeend', '<span class="mem-back">?</span>');
      c.addEventListener('click', function () {
        if (lock || c.classList.contains('open')) return;
        c.classList.add('open');
        Sound.pop();
        ctx.say(ctx.spoken(it));
        open.push(c);
        if (open.length < 2) return;

        lock = true;
        var a = open[0], b = open[1];
        open = [];
        if (a.dataset.id === b.dataset.id) {
          timers.push(setTimeout(function () {
            a.classList.add('done'); b.classList.add('done');
            Sound.chime();
            matched++;
            lock = false;
            if (matched === pairs) ctx.win(it);
          }, 450));
        } else {
          timers.push(setTimeout(function () {
            a.classList.remove('open'); b.classList.remove('open');
            lock = false;
          }, 1000));
        }
      });
      grid.appendChild(c);
    });
    ctx.root.appendChild(grid);
    timers.push(setTimeout(function () { ctx.say('카드를 뒤집어서 똑같은 그림을 찾아봐'); }, 250));

    return function () { timers.forEach(clearTimeout); };
  }
});
