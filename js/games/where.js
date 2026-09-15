/* 🌍 어디에 있을까 — 이게 어디 사는지, 어디를 다니는지 고른다.
   "이게 뭐야"를 넘어 "이게 어디에 속하지"를 묻는다. 세상을 묶어서 이해하는 힘이다. */
Engine.register({
  id: 'where',
  name: '어디 있을까',
  icon: '🌍',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  /* 내 사진은 어디에 사는지 알 수 없으니 이 놀이는 나오지 않는다 */
  supports: function (theme) {
    return !theme.custom && !!Data.PLACES[theme.id];
  },

  round: function (ctx) {
    var counts = [3, 4, 5];
    var n = counts[ctx.level()];
    var right = Data.PLACES[ctx.theme.id];
    if (!right) {
      ctx.root.appendChild(ctx.el('div', 'notice', '이 주제는 아직 준비 중이에요.'));
      return;
    }
    var others = Data.PLACE_LIST.filter(function (p) { return p.id !== right.id; });
    var choices = ctx.shuffle([right].concat(ctx.pick(others, n - 1)));
    var subject = ctx.one(ctx.theme.items);
    var answered = false;

    ctx.ask('어디에 있을까?', subject.name);

    var big = ctx.el('div', 'where-subject');
    big.innerHTML = Art.html(subject, { eager: true });
    ctx.root.appendChild(big);

    var grid = ctx.grid('play-grid', choices.length, 430);
    choices.forEach(function (p) {
      var t = ctx.tile(p);
      t.addEventListener('click', function () {
        if (answered) return;
        if (p.id === right.id) {
          answered = true;
          setTimeout(function () {
            ctx.say(ctx.spoken(subject) + '는 ' + p.name + '에 있어요');
          }, 950);
          ctx.win(p);
        } else {
          ctx.lose(t);
          setTimeout(function () { ctx.say(ctx.spoken(subject) + '는 어디 있을까?'); }, 620);
        }
      });
      grid.appendChild(t);
    });
    ctx.root.appendChild(grid);

    setTimeout(function () { ctx.say(ctx.spoken(subject) + '는 어디에 있을까?'); }, 250);
  }
});
