/* 🚦 신호등 운전 — '부릉' 버튼을 누르고 있으면 달리고, 떼면 선다.
   초록불엔 가고 빨간불엔 멈춘다. 깃발까지 가면 도착.
   누르고 싶은 걸 참고 기다리는 힘(억제)을 쓰는 놀이다. 빨간불에 달려도 혼내지 않고
   차가 스스로 멈춰 서서 "빨간불이야" 하고 알려줄 뿐이다.
   단계: 길이 길어지고, 노란불이 생기고, 신호가 더 자주 바뀐다. */
Engine.register({
  id: 'signal',
  name: '신호등 운전',
  icon: '🚦',
  levels: 3,
  upAfter: 2,
  downAfter: 99,
  supports: function (theme) {
    return !!{ fire: 1, build: 1, farm: 1, cargo: 1, clean: 1, car: 1, train: 1 }[theme.id];
  },

  round: function (ctx) {
    var lv = ctx.level();
    var TRIP = [9, 13, 17][lv];           // 초록불에 계속 달리면 걸리는 시간(초)
    var GREEN = [[4, 6], [3, 5], [2.5, 4]][lv];
    var RED = [[2.5, 3.5], [2.5, 4], [3, 4.5]][lv];
    var FIRST_RED = 5.5;                  // 첫 빨간불은 설명을 다 들을 만큼 길게
    var YELLOW = lv >= 1 ? 1.1 : 0;

    var photos = ctx.theme.items.filter(function (i) { return Art.src(i); });
    var car = ctx.one(photos.length ? photos : ctx.theme.items);
    var done = false, timers = [], raf = 0;

    ctx.ask('초록불엔 부릉, 빨간불엔 멈춰!', '🚦');

    var wrap = ctx.el('div', 'sig-wrap');
    wrap.innerHTML =
      '<div class="sig-track"><span class="sig-me"></span><span class="sig-flag">🏁</span></div>' +
      '<div class="sig-light"><i class="r"></i><i class="y"></i><i class="g"></i></div>' +
      '<div class="sig-road"><div class="sig-car">' + Art.html(car, { eager: true }) + '</div></div>' +
      '<button class="sig-pedal" type="button">부릉 👆</button>';
    ctx.root.appendChild(wrap);

    var light = wrap.querySelector('.sig-light');
    var road = wrap.querySelector('.sig-road');
    var carN = wrap.querySelector('.sig-car');
    var me = wrap.querySelector('.sig-me');
    var pedal = wrap.querySelector('.sig-pedal');

    var state = 'g', changedAt = 0, pressing = false, stalled = 0;
    var progress = 0, scroll = 0, speed = 0, last = 0;
    var ranRed = false;      // 이번 빨간불에 한 번이라도 달렸나
    var drove = false;       // 직전 초록불에 달렸나 — 달리다 멈춘 걸 칭찬하려고

    function rand(a) { return a[0] + Math.random() * (a[1] - a[0]); }

    function setLight(s, quiet) {
      state = s;
      changedAt = performance.now();
      light.className = 'sig-light on-' + s;
      if (s === 'r') {
        ranRed = false;
        if (!quiet) ctx.say('빨간불! 멈춰요');
        timers.push(setTimeout(function () {
          if (done) return;
          if (drove && !ranRed) { ctx.say('잘 기다렸어요!'); Sound.pop(); }
          drove = false;
          setLight('g');
        }, (quiet ? FIRST_RED : rand(RED)) * 1000));
      } else if (s === 'y') {
        timers.push(setTimeout(function () { if (!done) setLight('r'); }, YELLOW * 1000));
      } else {
        ctx.say('초록불! 출발');
        timers.push(setTimeout(function () {
          if (!done) setLight(YELLOW ? 'y' : 'r');
        }, rand(GREEN) * 1000));
      }
    }

    function tick(t) {
      raf = requestAnimationFrame(tick);
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      if (done) return;

      var want = pressing && t > stalled;
      /* 빨간불로 바뀐 직후 0.6초는 봐준다 — 손을 뗄 시간 */
      if (want && state === 'r' && t - changedAt > 600) {
        ranRed = true;
        stalled = t + 1400;
        speed = 0;
        Sound.loop('engine', false);
        carN.classList.remove('stop'); void carN.offsetWidth; carN.classList.add('stop');
        ctx.say('빨간불이야! 초록불 될 때까지 기다려');
        ctx.lose(null);
        return;
      }
      if (want && state !== 'r') drove = true;
      var target = want ? 1 : 0;
      speed += (target - speed) * Math.min(dt * 4, 1);
      Sound.loop('engine', speed > 0.15);

      progress += speed * dt / TRIP;
      scroll += speed * dt * 260;
      road.style.backgroundPositionX = (-scroll) + 'px';
      carN.style.setProperty('--bounce', speed > 0.2 ? 1 : 0);
      me.style.left = (Math.min(progress, 1) * 92) + '%';

      if (progress >= 1) {
        done = true;
        Sound.loop('engine', false);
        ctx.say('도착! 운전 잘했어요');
        timers.push(setTimeout(function () { ctx.win(car); }, 500));
      }
    }

    function down(e) { e.preventDefault(); pressing = true; pedal.classList.add('down'); }
    function up() { pressing = false; pedal.classList.remove('down'); }
    pedal.addEventListener('pointerdown', down);
    pedal.addEventListener('pointerup', up);
    pedal.addEventListener('pointercancel', up);
    pedal.addEventListener('pointerleave', up);
    pedal.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    me.innerHTML = Art.html(car, { eager: true });

    timers.push(setTimeout(function () {
      ctx.say('부릉 버튼을 누르고 있으면 달려요. 초록불엔 가고 빨간불엔 멈춰요');
      setLight('r', true);   // 설명이 끝날 때까지 빨간불로 기다린다
      raf = requestAnimationFrame(tick);
    }, 200));

    return function () {
      done = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      Sound.loop('engine', false);
    };
  }
});
