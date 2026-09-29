/* 🧽 세차장 — 진흙투성이 탈것을 손가락으로 문질러 닦는다.
   ① 진흙을 문질러 벗기면 ② 비누 거품이 덮이고 ③ 물로 헹구면 반짝반짝.
   닦을수록 밑에 있던 사진이 드러나서, 다 보기 전에 "뭐지?" 하고 맞혀보는 재미도 있다.
   틀리는 게 없는 쉬어가는 놀이라 단계도 하나다. */
Engine.register({
  id: 'wash',
  name: '세차장',
  icon: '🧽',
  levels: 1,
  supports: function (theme) {
    return !!{ fire: 1, build: 1, farm: 1, cargo: 1, clean: 1, car: 1, train: 1 }[theme.id];
  },

  round: function (ctx) {
    var photos = ctx.theme.items.filter(function (i) { return Art.src(i); });
    var item = ctx.one(photos.length ? photos : ctx.theme.items);
    var STAGES = [
      { ask: '진흙투성이야! 문질러서 닦아줘', word: '🟤 진흙', paint: mud,     sound: 500 },
      { ask: '거품이 가득! 물로 헹궈줘',      word: '🫧 거품', paint: bubbles, sound: 2600 }
    ];
    var stage = 0, done = false, timers = [];

    var box = ctx.el('div', 'wash-box');
    box.innerHTML = Art.html(item, { eager: true }) + '<canvas class="wash-dirt"></canvas>';
    ctx.root.appendChild(box);

    var cv = box.querySelector('canvas');
    var g = cv.getContext('2d');
    var S = 0;   // 캔버스 한 변 (기기 픽셀)

    function setup() {
      var r = box.getBoundingClientRect();
      S = Math.round(r.width * Math.min(window.devicePixelRatio || 1, 2));
      cv.width = cv.height = S;
    }

    /* 진흙 — 사진이 어렴풋이 비칠 만큼만 두껍게 */
    function mud() {
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(122,82,48,.93)';
      g.fillRect(0, 0, S, S);
      for (var i = 0; i < 70; i++) {
        g.fillStyle = ['#6b4526', '#8a5c34', '#5a3a20', '#9c6b3f'][i % 4];
        g.globalAlpha = 0.55 + Math.random() * 0.4;
        g.beginPath();
        g.arc(Math.random() * S, Math.random() * S, S * (0.03 + Math.random() * 0.08), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }

    /* 거품 — 하얀 동그라미를 겹겹이 */
    function bubbles() {
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.fillRect(0, 0, S, S);
      for (var i = 0; i < 160; i++) {
        var x = Math.random() * S, y = Math.random() * S, r = S * (0.02 + Math.random() * 0.06);
        g.fillStyle = 'rgba(255,255,255,.95)';
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = ['#9ad3ff', '#ffc2e6', '#c9b6ff'][i % 3];
        g.lineWidth = Math.max(1.5, S / 260);
        g.stroke();
      }
    }

    /* 얼마나 닦였나 — 격자로 찍어 투명한 칸의 비율을 본다 */
    function cleaned() {
      var d = g.getImageData(0, 0, S, S).data, step = Math.max(4, Math.floor(S / 40));
      var clear = 0, all = 0;
      for (var y = step >> 1; y < S; y += step) {
        for (var x = step >> 1; x < S; x += step) {
          all++;
          if (d[(y * S + x) * 4 + 3] < 60) clear++;
        }
      }
      return clear / all;
    }

    var lastPt = null, lastSound = 0, checkAt = 0;

    function rub(e) {
      var r = box.getBoundingClientRect();
      var k = S / r.width;
      var p = { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
      g.globalCompositeOperation = 'destination-out';
      g.lineCap = 'round';
      g.lineWidth = S * 0.16;
      g.beginPath();
      g.moveTo((lastPt || p).x, (lastPt || p).y);
      g.lineTo(p.x, p.y);
      g.stroke();
      lastPt = p;

      var now = Date.now();
      if (now - lastSound > 140) { Sound.burst(STAGES[stage].sound, 0.12, 0.12); lastSound = now; }
      if (now - checkAt > 250) { checkAt = now; if (cleaned() > 0.86) nextStage(); }
    }

    function nextStage() {
      stage++;
      lastPt = null;
      if (stage < STAGES.length) {
        Sound.pop();
        STAGES[stage].paint();
        ctx.ask(STAGES[stage].ask, STAGES[stage].word);
        ctx.say(STAGES[stage].ask);
        return;
      }
      done = true;
      g.clearRect(0, 0, S, S);
      box.classList.add('shine');
      ctx.ask('반짝반짝!', item.name);
      timers.push(setTimeout(function () { ctx.win(item); }, 600));
    }

    var pressing = false;
    cv.addEventListener('pointerdown', function (e) {
      if (done) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      pressing = true; lastPt = null; rub(e);
    });
    cv.addEventListener('pointermove', function (e) { if (pressing && !done) rub(e); });
    function up() { pressing = false; lastPt = null; }
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    setup();
    STAGES[0].paint();
    ctx.ask(STAGES[0].ask, STAGES[0].word);
    timers.push(setTimeout(function () { ctx.say('뭐가 숨어 있을까? ' + STAGES[0].ask); }, 250));

    return function () { done = true; timers.forEach(clearTimeout); };
  }
});
