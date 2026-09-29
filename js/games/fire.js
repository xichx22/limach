/* 🚒 불 끄기 출동 — 소방차가 사이렌을 울리며 들어오고, 손가락을 대고 있는 곳으로
   물줄기가 뻗는다. 불 위에 물을 대고 있으면 불이 점점 작아지다 꺼진다.
   '누르면 바로 무슨 일이 일어난다'가 30개월 놀이의 핵심이라 정답·오답이 없다.
   단계가 올라가면 불이 많아지고, 오래 대고 있어야 꺼진다. */
Engine.register({
  id: 'fire',
  name: '불 끄기 출동',
  icon: '🧯',
  levels: 3,
  upAfter: 2,
  downAfter: 99,
  supports: function (theme) { return theme.id === 'fire'; },

  round: function (ctx) {
    var lv = ctx.level();
    var FIRES = [3, 5, 7][lv];
    var NEED = [0.7, 1.0, 1.3][lv];     // 불 하나를 끄는 데 드는 물 뿌린 시간(초)
    var REACH = 70;                     // 손가락에서 이만큼 안의 불이 물을 맞는다(px)

    var truck = ctx.one(ctx.theme.items);
    var done = false, timers = [], raf = 0;

    ctx.ask('불을 꺼줘!', '🔥 ' + FIRES + '개');

    var scene = ctx.el('div', 'fire-scene');
    scene.innerHTML =
      '<div class="fire-town"><span>🏠</span><span>🏢</span><span>🏡</span><span>🏫</span></div>' +
      '<canvas class="fire-water"></canvas>';
    var rig = ctx.el('div', 'fire-truck', Art.html(truck, { eager: true }));
    scene.appendChild(rig);
    ctx.root.appendChild(scene);

    var cv = scene.querySelector('canvas');
    var g = cv.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      var r = scene.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* 불은 건물 줄 위아래로 흩어 놓되 서로 겹치지 않게 */
    var fires = [];
    function place() {
      size();
      for (var i = 0; i < FIRES; i++) {
        var x, y, tries = 0;
        do {
          x = 0.12 + Math.random() * 0.76;
          y = 0.12 + Math.random() * 0.46;
          tries++;
        } while (tries < 40 && fires.some(function (f) {
          return Math.abs(f.x - x) * W < 80 && Math.abs(f.y - y) * H < 80;
        }));
        var n = ctx.el('span', 'flame', '🔥');
        n.style.left = (x * 100) + '%';
        n.style.top = (y * 100) + '%';
        n.style.animationDelay = (-Math.random()) + 's';
        scene.appendChild(n);
        fires.push({ x: x, y: y, hp: NEED, node: n });
      }
    }

    /* ---------- 물 뿌리기 ---------- */
    var aim = null;          // 손가락 위치 (scene 안 좌표)
    var drops = [];
    var last = 0;

    function nozzle() {
      var a = rig.getBoundingClientRect(), s = scene.getBoundingClientRect();
      return { x: a.left - s.left + a.width * 0.55, y: a.top - s.top + a.height * 0.15 };
    }

    function tick(t) {
      raf = requestAnimationFrame(tick);
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;

      if (aim && !done) {
        var o = nozzle();
        for (var k = 0; k < 4; k++) {
          var sp = 0.9 + Math.random() * 0.25;
          drops.push({
            x: o.x, y: o.y, life: 0,
            vx: (aim.x - o.x) * sp + (Math.random() - 0.5) * 30,
            vy: (aim.y - o.y) * sp + (Math.random() - 0.5) * 30
          });
        }
        fires.forEach(function (f) {
          if (f.hp <= 0) return;
          var dx = f.x * W - aim.x, dy = f.y * H - aim.y;
          if (dx * dx + dy * dy > REACH * REACH) return;
          f.hp -= dt;
          var k2 = Math.max(f.hp / NEED, 0);
          f.node.style.setProperty('--s', (0.35 + 0.65 * k2).toFixed(2));
          if (f.hp <= 0) out(f);
        });
      }

      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(80,160,255,.75)';
      drops = drops.filter(function (d) {
        d.life += dt;
        d.x += d.vx * dt * 1.6;
        d.y += d.vy * dt * 1.6 + d.life * d.life * 120;
        if (d.life > 0.7) return false;
        g.beginPath();
        g.arc(d.x, d.y, 5 + d.life * 7, 0, Math.PI * 2);
        g.fill();
        return true;
      });
    }

    function out(f) {
      Sound.burst(1800, 0.35, 0.3);           // 치익
      f.node.textContent = '💨';
      f.node.classList.add('smoke');
      timers.push(setTimeout(function () { f.node.remove(); }, 900));
      var left = fires.filter(function (x) { return x.hp > 0; }).length;
      ctx.ask('불을 꺼줘!', left ? '🔥 ' + left + '개' : '다 껐다!');
      if (!left) finish();
    }

    function finish() {
      done = true;
      aim = null;
      Sound.loop('water', false);
      timers.push(setTimeout(function () {
        ctx.say('불을 다 껐어요! 고마워 ' + ctx.spoken(truck));
        ctx.win(truck);
      }, 700));
    }

    function pos(e) {
      var s = scene.getBoundingClientRect();
      return { x: e.clientX - s.left, y: e.clientY - s.top };
    }
    function down(e) {
      if (done) return;
      e.preventDefault();
      try { scene.setPointerCapture(e.pointerId); } catch (x) {}
      aim = pos(e);
      Sound.loop('water', true);
    }
    function move(e) { if (aim) aim = pos(e); }
    function up() { aim = null; Sound.loop('water', false); }

    scene.addEventListener('pointerdown', down);
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerup', up);
    scene.addEventListener('pointercancel', up);
    window.addEventListener('resize', size);

    /* 사이렌을 울리며 들어온다 → 그다음 불이 보인다 */
    Sound.siren(2);
    timers.push(setTimeout(function () {
      place();
      ctx.say('불이 났어요! 손가락을 대고 물을 뿌려봐');
      raf = requestAnimationFrame(tick);
    }, 900));

    return function () {
      done = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', size);
      Sound.loop('water', false);
    };
  }
});
