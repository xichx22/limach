/* 🎈 풍선 터뜨리기 — 그림이 붙은 풍선이 떠오른다. 부르는 것만 터뜨린다.
   찾아내는 힘과 '딴 건 안 누르고 참는 힘'을 같이 쓴다.
   참는 힘은 나중 학교생활을 가장 잘 예측하는 능력인데, 놀이로 익히는 게 좋다.
   틀려도 벌은 없다. 풍선이 흔들리고 그냥 날아갈 뿐이다. */
Engine.register({
  id: 'balloon',
  name: '풍선 터뜨리기',
  icon: '🎈',
  levels: 3,
  upAfter: 2,
  downAfter: 4,   // 빨리 눌러야 해서 실수가 잦다. 쉽게 내려가지 않게 한다.

  round: function (ctx) {
    var atOnce = [3, 5, 7];          // 한 번에 떠 있는 풍선 수
    var seconds = [9, 7.5, 6];       // 바닥에서 꼭대기까지 걸리는 시간
    var lv = ctx.level();
    var many = Math.min(atOnce[lv], ctx.theme.items.length);
    var dur = seconds[lv];

    var target = ctx.one(ctx.theme.items);
    var others = ctx.theme.items.filter(function (x) { return x.id !== target.id; });
    var done = false;
    var timers = [];
    var COLORS = ['#e8503a', '#2f7fe0', '#e8a62a', '#3fa85a', '#9b59d0', '#e7699a'];

    ctx.ask('터뜨려봐!', target.name);

    var sky = ctx.el('div', 'sky');
    ctx.root.appendChild(sky);

    var live = [];   // 지금 떠 있는 풍선들

    function needTarget() {
      return !live.some(function (b) { return b.item.id === target.id; });
    }

    function spawn(forceTarget) {
      if (done) return;
      var item = forceTarget || (needTarget() && Math.random() < 0.5 ? target : ctx.one(others));
      var b = ctx.el('button', 'balloon');
      b.type = 'button';
      b.item = item;
      b.style.left = (6 + Math.random() * 82) + '%';
      b.style.setProperty('--dur', (dur * (0.85 + Math.random() * 0.3)).toFixed(1) + 's');
      b.style.setProperty('--sway', (2.2 + Math.random() * 1.4).toFixed(1) + 's');
      b.style.setProperty('--tint', COLORS[Math.floor(Math.random() * COLORS.length)]);
      b.innerHTML =
        '<span class="balloon-body">' + Art.html(item) + '</span>' +
        '<span class="balloon-string"></span>' +
        '<span class="balloon-name">' + item.name + '</span>';

      b.addEventListener('click', function () {
        if (done) return;
        if (item.id === target.id) {
          done = true;
          b.classList.add('pop');
          live.forEach(function (x) { x.classList.add('freeze'); });
          ctx.win(item);
        } else {
          /* 틀려도 혼내지 않는다. 풍선이 흔들리고 지나간다. */
          Sound.wrong();
          b.classList.add('wobble');
          timers.push(setTimeout(function () { b.classList.remove('wobble'); }, 500));
        }
      });

      b.addEventListener('animationend', function (e) {
        if (e.animationName !== 'rise') return;
        var i = live.indexOf(b);
        if (i >= 0) live.splice(i, 1);
        b.remove();
        if (!done) spawn();
      });

      sky.appendChild(b);
      live.push(b);
    }

    /* 처음엔 조금씩 시차를 두고 띄운다 */
    spawn(target);
    for (var i = 1; i < many; i++) {
      (function (k) { timers.push(setTimeout(function () { spawn(); }, k * 700)); })(i);
    }

    /* 목표가 오래 안 보이면 하나 더 띄워준다 */
    var watch = setInterval(function () {
      if (done) return;
      if (needTarget()) spawn(target);
    }, 2500);

    timers.push(setTimeout(function () { ctx.say(ctx.spoken(target) + ' 풍선을 터뜨려봐'); }, 300));

    return function () {
      done = true;
      clearInterval(watch);
      timers.forEach(clearTimeout);
    };
  }
});
