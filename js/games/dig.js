/* 🏗️ 공사장 — 굴착기로 흙을 퍼서 덤프트럭에 싣는다. 짐칸이 차면 트럭이 부릉 떠난다.
   굴착기를 흙더미로 끌어가면 퍼 올리고, 트럭으로 끌어가면 쏟는다.
   끌기가 어려우면 흙더미를 톡, 트럭을 톡 눌러도 굴착기가 알아서 간다.
   '퍼서 → 옮겨서 → 붓기'를 되풀이하는 게 순서 계획의 첫걸음이다. */
Engine.register({
  id: 'dig',
  name: '공사장',
  icon: '🏗️',
  levels: 3,
  upAfter: 2,
  downAfter: 99,
  supports: function (theme) {
    return theme.id === 'build' &&
      theme.items.some(function (i) { return i.id === 'excavator'; }) &&
      theme.items.some(function (i) { return i.id === 'dump'; });
  },

  round: function (ctx) {
    var LOADS = [3, 4, 5][ctx.level()];
    var digger = ctx.theme.items.filter(function (i) { return i.id === 'excavator'; })[0];
    var truck = ctx.theme.items.filter(function (i) { return i.id === 'dump'; })[0];
    var loaded = 0, full = false, done = false, busy = false, timers = [];

    ctx.ask('흙을 트럭에 실어줘!', '0 / ' + LOADS);

    var site = ctx.el('div', 'dig-site');
    var piles = ctx.el('div', 'dig-piles');
    var pileNodes = [];
    for (var i = 0; i < 3; i++) {
      var p = ctx.el('button', 'dig-pile');
      p.type = 'button';
      p.dataset.left = Math.floor(LOADS / 3) + (i < LOADS % 3 ? 1 : 0);   // 합이 딱 LOADS
      p.style.setProperty('--k', 1);
      piles.appendChild(p);
      pileNodes.push(p);
    }
    var bed = ctx.el('button', 'dig-truck',
      Art.html(truck, { eager: true }) + '<span class="dig-load"><i></i></span>');
    bed.type = 'button';
    var arm = ctx.el('div', 'dig-arm', Art.html(digger, { eager: true }) + '<span class="dig-scoop"></span>');

    site.appendChild(piles);
    site.appendChild(bed);
    site.appendChild(arm);
    ctx.root.appendChild(site);

    /* 굴착기 위치(site 안 좌표, 가운데 기준) */
    function place(x, y, slow) {
      arm.style.transition = slow ? 'left .45s ease, top .45s ease' : 'none';
      arm.style.left = x + 'px';
      arm.style.top = y + 'px';
    }
    function home() {
      var s = site.getBoundingClientRect();
      place(s.width * 0.5, s.height * 0.5, true);
    }
    function centerOf(node) {
      var s = site.getBoundingClientRect(), r = node.getBoundingClientRect();
      return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
    }

    function scoop(pile) {
      if (full || done || +pile.dataset.left <= 0) return false;
      pile.dataset.left = +pile.dataset.left - 1;
      var total = Math.floor(LOADS / 3) + 1;
      pile.style.setProperty('--k', Math.max(+pile.dataset.left / total, 0.15));
      if (+pile.dataset.left <= 0) pile.classList.add('empty');
      full = true;
      arm.classList.add('full');
      Sound.burst(260, 0.35, 0.35);   // 흙 퍼는 소리
      if (loaded === 0) ctx.say('영차! 이제 트럭에 부어줘');
      return true;
    }

    function dump() {
      if (!full || done) return false;
      full = false;
      arm.classList.remove('full');
      loaded++;
      Sound.burst(180, 0.6, 0.4);     // 와르르
      bed.style.setProperty('--fill', (loaded / LOADS).toFixed(2));
      bed.classList.remove('bump'); void bed.offsetWidth; bed.classList.add('bump');
      ctx.ask('흙을 트럭에 실어줘!', loaded + ' / ' + LOADS);
      if (loaded >= LOADS) finish();
      else ctx.say(['잘했어!', '또 퍼볼까?', '영차영차!'][loaded % 3]);
      return true;
    }

    function finish() {
      done = true;
      ctx.say('짐칸이 꽉 찼다! 덤프트럭 출발!');
      timers.push(setTimeout(function () {
        Sound.loop('engine', true);
        bed.classList.add('leave');
      }, 700));
      timers.push(setTimeout(function () {
        Sound.loop('engine', false);
        ctx.win(truck);
      }, 2300));
    }

    /* ---------- 끌기: 굴착기를 잡고 옮긴다 ---------- */
    var dragging = false;
    function hitAt(x, y) {
      arm.style.pointerEvents = 'none';
      var n = document.elementFromPoint(x, y);
      arm.style.pointerEvents = '';
      return n && n.closest && (n.closest('.dig-pile') || n.closest('.dig-truck'));
    }
    arm.addEventListener('pointerdown', function (e) {
      if (done || busy) return;
      e.preventDefault();
      try { arm.setPointerCapture(e.pointerId); } catch (x) {}
      dragging = true;
      arm.classList.add('held');
    });
    arm.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var s = site.getBoundingClientRect();
      place(e.clientX - s.left, e.clientY - s.top);
      var hit = hitAt(e.clientX, e.clientY);
      if (!hit) return;
      if (hit.classList.contains('dig-pile')) scoop(hit);
      else dump();
    });
    function release() {
      if (!dragging) return;
      dragging = false;
      arm.classList.remove('held');
      if (!done) home();
    }
    arm.addEventListener('pointerup', release);
    arm.addEventListener('pointercancel', release);

    /* ---------- 톡 누르기: 굴착기가 스스로 가서 한다 ---------- */
    function visit(node, act) {
      if (done || busy || dragging) return;
      busy = true;
      var c = centerOf(node);
      place(c.x, c.y - 20, true);
      timers.push(setTimeout(function () {
        if (!act()) Sound.wrong();
        timers.push(setTimeout(function () { busy = false; if (!done) home(); }, 250));
      }, 480));
    }
    pileNodes.forEach(function (p) {
      p.addEventListener('click', function () { visit(p, function () { return scoop(p); }); });
    });
    bed.addEventListener('click', function () { visit(bed, dump); });

    timers.push(setTimeout(function () {
      home();
      ctx.say('굴착기로 흙을 퍼서 덤프트럭에 실어줘');
    }, 60));

    return function () { done = true; timers.forEach(clearTimeout); Sound.loop('engine', false); };
  }
});
