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

    var watch = null;
    var live = [];   // 지금 떠 있는 풍선들

    /* 풍선이 터지면서 조각이 사방으로 튄다 */
    function burst(node) {
      var fx = document.getElementById('fx');
      if (!fx) return;
      var r = node.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height * 0.42;
      var tint = node.style.getPropertyValue('--tint') || '#e8503a';
      for (var i = 0; i < 12; i++) {
        var bit = ctx.el('span', 'burst-bit');
        var ang = (Math.PI * 2 / 12) * i + Math.random() * 0.5;
        var dist = 55 + Math.random() * 80;
        bit.style.left = cx + 'px';
        bit.style.top = cy + 'px';
        bit.style.background = tint;
        bit.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
        bit.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(0) + 'px');
        fx.appendChild(bit);
        (function (n) { setTimeout(function () { n.remove(); }, 750); })(bit);
      }
    }

    function needTarget() {
      return !live.some(function (b) { return b.item.id === target.id; });
    }

    /* noTarget 이면 정답이 아닌 것만 고른다 — 처음 띄울 때 순서를 정해두기 위해서다 */
    function spawn(forceTarget, noTarget) {
      if (done) return;
      var item = forceTarget ||
        (!noTarget && needTarget() && Math.random() < 0.5 ? target : ctx.one(others));
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
          clearInterval(watch);
          /* 터지는 풍선까지 멈추면 터지는 게 안 보인다. 나머지만 멈춘다. */
          live.forEach(function (x) { if (x !== b) x.classList.add('freeze'); });
          b.classList.remove('wobble');
          b.classList.add('pop');
          Sound.pop();
          burst(b);
          /* 터지는 걸 보고 나서 칭찬 화면으로 넘어간다 */
          timers.push(setTimeout(function () {
            b.remove();
            ctx.win(item);
          }, 520));
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

    /* 처음엔 조금씩 시차를 두고 띄운다.
       정답을 맨 앞에 띄우면 늘 첫 풍선만 누르면 맞는다 — 찾는 놀이가 되지 않는다.
       그래서 정답이 몇 번째로 뜰지 매번 다시 뽑는다. */
    var targetAt = Math.floor(Math.random() * many);
    for (var i = 0; i < many; i++) {
      (function (k) {
        var go = function () { spawn(k === targetAt ? target : null, k !== targetAt); };
        if (k === 0) go(); else timers.push(setTimeout(go, k * 700));
      })(i);
    }

    /* 목표가 오래 안 보이면 하나 더 띄워준다 */
    watch = setInterval(function () {
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
