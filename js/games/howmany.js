/* 🔢 몇 개일까 — 위에 보여준 개수와 같은 개수를 아래에서 고른다.
   숫자를 못 읽어도 된다. 개수 자체를 한눈에 아는 힘(수 감각)이 자라는데,
   이게 나중에 수학의 바탕이 된다. */
Engine.register({
  id: 'howmany',
  name: '몇 개일까',
  icon: '🔢',
  levels: 3,
  upAfter: 3,
  downAfter: 2,

  round: function (ctx) {
    var maxes = [3, 5, 7];
    var pickCounts = [3, 4, 4];
    var lv = ctx.level();
    var max = maxes[lv];
    var howMany = pickCounts[lv];

    var target = 1 + Math.floor(Math.random() * max);
    var KOR = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱'];

    /* 문제와 보기는 서로 다른 사진을 쓴다. 사진이 같으면 개수가 아니라
       그림만 보고 맞출 수 있기 때문이다. */
    var items = ctx.pick(ctx.theme.items, howMany + 1);
    var qItem = items[0];
    var choiceItems = items.slice(1);

    /* 보기마다 서로 다른 개수 — 정답은 그중 하나 */
    var used = { };
    var counts = [target];
    used[target] = 1;
    while (counts.length < howMany) {
      var c = 1 + Math.floor(Math.random() * max);
      if (!used[c]) { used[c] = 1; counts.push(c); }
    }
    counts = ctx.shuffle(counts);

    ctx.ask('몇 개일까? 같은 개수를 찾아봐', '');

    function group(item, k, cls) {
      var box = ctx.el('div', 'count-box' + (cls ? ' ' + cls : ''));
      var inner = ctx.el('div', 'count-items');
      inner.style.setProperty('--k', Math.min(k, 4));
      for (var i = 0; i < k; i++) inner.innerHTML += Art.html(item);
      box.appendChild(inner);
      return box;
    }

    ctx.root.appendChild(group(qItem, target, 'question'));
    ctx.root.appendChild(ctx.el('div', 'sub-label', '같은 개수는?'));

    var row = ctx.el('div', 'count-row');
    var answered = false;
    counts.forEach(function (c, i) {
      var box = group(choiceItems[i], c, 'choice');
      box.addEventListener('click', function () {
        if (answered) return;
        if (c === target) {
          answered = true;
          setTimeout(function () { ctx.say('모두 ' + KOR[target] + '개!'); }, 950);
          ctx.win({ id: 'count', name: KOR[target] + ' 개', say: KOR[target] + '개',
                    emoji: '🔢' });
        } else {
          ctx.lose(box);
          setTimeout(function () { ctx.say('개수를 세어봐'); }, 620);
        }
      });
      row.appendChild(box);
    });
    ctx.root.appendChild(row);

    setTimeout(function () { ctx.say('몇 개인지 세어보고 같은 개수를 찾아봐'); }, 250);
  }
});
