/* ➡️ 다음은 뭘까 — 규칙대로 늘어놓은 줄의 다음 칸을 맞춘다.
   스스로 규칙을 찾아내는 힘(계열 추론). 지능검사에 가장 자주 나오는 유형이다. */
Engine.register({
  id: 'pattern',
  name: '다음은 뭘까',
  icon: '➡️',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var lv = ctx.level();
    var pool = ctx.shuffle(ctx.theme.items);
    var seq, answer, need;

    if (lv === 0) {
      /* ㄱㄴㄱㄴㄱ → ㄴ */
      need = 2;
      var a = pool[0], b = pool[1];
      seq = [a, b, a, b];
      answer = a;
    } else if (lv === 1) {
      /* ㄱㄱㄴㄴㄱㄱ → ㄴ */
      need = 2;
      var c = pool[0], d = pool[1];
      seq = [c, c, d, d, c];
      answer = c;
    } else {
      /* ㄱㄴㄷㄱㄴㄷㄱ → ㄴ */
      need = 3;
      var e = pool[0], f = pool[1], g = pool[2];
      seq = [e, f, g, e, f];
      answer = g;
    }
    if (pool.length < need + 2) {
      ctx.root.appendChild(ctx.el('div', 'notice', '사진이 조금 더 필요해요.'));
      return;
    }

    ctx.ask('다음은 뭘까?', '');

    var strip = ctx.el('div', 'pattern-strip');
    strip.style.setProperty('--n', seq.length + 1);
    seq.forEach(function (it) {
      var c = ctx.el('div', 'pattern-cell');
      c.innerHTML = Art.html(it);
      strip.appendChild(c);
    });
    var q = ctx.el('div', 'pattern-cell q', '?');
    strip.appendChild(q);
    ctx.root.appendChild(strip);

    ctx.root.appendChild(ctx.el('div', 'sub-label', '다음에 올 건?'));

    /* 보기: 정답 + 줄에 나온 다른 것 + 아예 새로운 것 */
    var wrongs = seq.filter(function (x) { return x.id !== answer.id; });
    var uniq = [];
    wrongs.forEach(function (x) {
      if (!uniq.some(function (y) { return y.id === x.id; })) uniq.push(x);
    });
    var extra = pool.filter(function (x) {
      return !seq.some(function (y) { return y.id === x.id; });
    })[0];
    var choices = ctx.shuffle([answer].concat(uniq.slice(0, 2)).concat(extra ? [extra] : []));

    var grid = ctx.grid('play-grid', choices.length, 430);
    var answered = false;
    choices.forEach(function (it) {
      var t = ctx.tile(it);
      t.addEventListener('click', function () {
        if (answered) return;
        if (it.id === answer.id) { answered = true; ctx.win(it); }
        else {
          ctx.lose(t);
          setTimeout(function () { ctx.say('줄을 다시 잘 봐'); }, 620);
        }
      });
      grid.appendChild(t);
    });
    ctx.root.appendChild(grid);

    setTimeout(function () { ctx.say('다음은 뭘까?'); }, 250);
  }
});
