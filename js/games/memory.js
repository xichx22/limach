/* 🧠 기억력 짝맞추기 — 뒤집어서 같은 그림 두 장을 찾는다.
   머릿속에 잠깐 담아두는 힘(작업기억력)을 키운다. */
Engine.register({
  id: 'memory',
  name: '짝 맞추기',
  icon: '🧠',
  levels: 3,
  upAfter: 1,      // 판을 다 끝내면 바로 한 단계 올라간다
  downAfter: 999,  // 내려가는 일은 없다

  round: function (ctx) {
    var pairCounts = [6, 8, 10];
    var pairs = Math.min(pairCounts[ctx.level()], ctx.theme.items.length);
    var chosen = ctx.pick(ctx.theme.items, pairs);
    var deck = ctx.shuffle(chosen.concat(chosen));

    var first = null, lock = false, found = 0;
    ctx.ask('같은 거 두 장 찾아봐!', '');

    var cols = pairs <= 6 ? 3 : 4;
    var grid = ctx.grid('card-grid', pairs * 2, 180, cols);

    deck.forEach(function (it) {
      var card = ctx.el('button', 'card');
      card.type = 'button';
      card.innerHTML =
        '<span class="card-back">❓</span>' +
        '<span class="card-front">' + Art.html(it) +
        '<span class="tile-name">' + it.name + '</span></span>';
      card.dataset.id = it.id;

      card.addEventListener('click', function () {
        if (lock || card.classList.contains('open') || card.classList.contains('done')) return;
        Sound.pop();
        card.classList.add('open');

        if (!first) { first = card; return; }

        if (first.dataset.id === card.dataset.id) {
          /* 맞췄다 */
          var a = first, b = card;
          first = null;
          found++;
          a.classList.add('done'); b.classList.add('done');
          Sound.chime();
          ctx.say(it.name);
          if (found === pairs) {
            lock = true;
            setTimeout(function () { ctx.win(it); }, 700);
          }
        } else {
          /* 틀렸다 — 잠깐 보여준 뒤 다시 덮는다 */
          lock = true;
          var a2 = first; first = null;
          Sound.wrong();
          setTimeout(function () {
            a2.classList.remove('open');
            card.classList.remove('open');
            lock = false;
          }, 850);
        }
      });

      grid.appendChild(card);
    });

    ctx.root.appendChild(grid);
    setTimeout(function () { ctx.say('같은 거 두 장 찾아봐'); }, 250);
  }
});
