/* 🚂 글자 기차 — 탈것 이름이 빈 기차 칸으로 나오고, 글자 블록을 순서대로 태운다.
   "소방차"면 칸 세 개에 소 → 방 → 차. 다 태우면 칙칙폭폭 떠난다.
   통글자(이름 전체)에서 한 글자(음절)로 넘어가는 다리 역할. 블록을 누를 때마다 그 글자를
   읽어주니, 글자 하나하나에 소리가 있다는 걸 몸으로 익힌다.
   단계: ① 칸에 옅은 글자가 비쳐 있고 딴 블록 없음 ② 첫 칸만 비치고 딴 블록 1개
         ③ 비치는 글자 없이 딴 블록 2개 */
Engine.register({
  id: 'wordtrain',
  name: '글자 기차',
  icon: '🚂',
  levels: 3,
  upAfter: 3,
  downAfter: 3,
  supports: function (theme) { return Hangul.words(theme.items, 2, 5).length >= 2; },

  round: function (ctx) {
    var lv = ctx.level();
    var pool = Hangul.words(ctx.theme.items, 2, lv === 0 ? 3 : 5);
    if (!pool.length) pool = Hangul.words(ctx.theme.items, 2, 5);
    var target = ctx.one(pool);
    var sy = target.name.split('');
    var done = false, filled = 0, timers = [];

    /* 딴 블록은 같은 주제의 다른 이름에서 빌려온다 — 주제와 어울리는 글자라야 헷갈린다 */
    var spare = [];
    Hangul.words(ctx.theme.items).forEach(function (i) {
      i.name.split('').forEach(function (s) {
        if (sy.indexOf(s) < 0 && spare.indexOf(s) < 0) spare.push(s);
      });
    });
    var blocks = ctx.shuffle(sy.map(function (s, k) { return { s: s, k: k }; })
      .concat(ctx.pick(spare, [0, 1, 2][lv]).map(function (s) { return { s: s, k: -1 }; })));

    ctx.ask('글자를 순서대로 태워줘!', lv < 2 ? target.name : '🚂');   // 마지막 단계는 보고 베끼지 않게

    var train = ctx.el('div', 'wt-train');
    train.innerHTML = '<div class="wt-engine">' + Art.html(target, { eager: true }) + '</div>';
    var cars = sy.map(function (s, k) {
      var ghost = lv === 0 || (lv === 1 && k === 0);
      var c = ctx.el('div', 'wt-car', '<span class="wt-ghost">' + (ghost ? s : '') + '</span>');
      train.appendChild(c);
      return c;
    });
    ctx.root.appendChild(ctx.el('div', 'wt-rail')).appendChild(train);

    var tray = ctx.el('div', 'wt-tray');
    blocks.forEach(function (b) {
      var n = ctx.el('button', 'wt-block', b.s);
      n.type = 'button';
      n.addEventListener('click', function () {
        if (done || n.disabled) return;
        ctx.say(b.s);
        if (b.s === sy[filled]) {
          n.disabled = true;
          n.classList.add('used');
          var car = cars[filled];
          car.innerHTML = '<span class="wt-letter">' + b.s + '</span>';
          car.classList.add('in');
          Sound.pop();
          filled++;
          if (filled === sy.length) finish();
        } else {
          ctx.lose(n);
          /* 다음에 태울 칸을 반짝여서 어디를 채울 차례인지 보여준다 */
          cars[filled].classList.remove('next'); void cars[filled].offsetWidth;
          cars[filled].classList.add('next');
        }
      });
      tray.appendChild(n);
    });
    ctx.root.appendChild(tray);

    function finish() {
      done = true;
      Hangul.learn(target.name);
      timers.push(setTimeout(function () { ctx.say(ctx.spoken(target) + '! 출발!'); }, 350));
      timers.push(setTimeout(function () {
        Sound.whistle();
        Sound.loop('engine', true);
        train.classList.add('go');
      }, 1300));
      timers.push(setTimeout(function () {
        Sound.loop('engine', false);
        ctx.win(target);
      }, 3000));
    }

    cars[0].classList.add('next');
    timers.push(setTimeout(function () {
      ctx.say(ctx.spoken(target) + ', 글자를 순서대로 태워줘');
    }, 250));

    return function () { done = true; timers.forEach(clearTimeout); Sound.loop('engine', false); };
  }
});
