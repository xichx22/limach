/* 🎨 색칠하기 — 밑그림의 칸을 눌러서 색을 채운다.
   문제를 푸는 게 아니라 만드는 놀이다. 지칠 때 쉬어가는 자리도 된다.
   색 이름을 말해주고, 칠한 것은 저장해둔다. */
Engine.register({
  id: 'color',
  name: '색칠하기',
  icon: '🎨',
  levels: 1,
  upAfter: 99,
  downAfter: 99,

  /* 어느 주제에서나 같은 밑그림을 쓴다 */
  supports: function () { return true; },

  round: function (ctx) {
    var KEY = 'jihan.color.v1';
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
    function store() {
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* 무시 */ }
    }

    var ids = Object.keys(LineArt.ART);
    var current = ctx.one(ids);
    var color = LineArt.COLORS[0];

    ctx.ask('색칠해봐!', LineArt.ART[current].name);

    var bar = ctx.el('div', 'tool-bar');
    var pick = ctx.el('button', 'tool-btn', '🖼️ 다른 그림');
    pick.type = 'button';
    pick.addEventListener('click', function () {
      current = ids[(ids.indexOf(current) + 1) % ids.length];
      Sound.pop(); draw();
    });
    var erase = ctx.el('button', 'tool-btn', '🧽 지우기');
    erase.type = 'button';
    erase.addEventListener('click', function () {
      saved[current] = {}; store(); Sound.pop(); draw();
    });
    bar.appendChild(pick); bar.appendChild(erase);

    ctx.root.classList.add('split');
    var canvas = ctx.el('div', 'paint');
    ctx.root.appendChild(canvas);

    var side = ctx.el('div', 'answer-side');
    side.appendChild(bar);

    var palette = ctx.el('div', 'palette');
    LineArt.COLORS.forEach(function (c) {
      var sw = ctx.el('button', 'swatch' + (c.light ? ' light' : ''));
      sw.type = 'button';
      sw.style.background = c.hex;
      sw.dataset.name = c.name;
      sw.setAttribute('aria-label', c.name);
      sw.innerHTML = '<span class="swatch-name">' + c.name + '</span>';
      sw.addEventListener('click', function () {
        color = c;
        Array.prototype.forEach.call(palette.children, function (x) { x.classList.remove('on'); });
        sw.classList.add('on');
        Sound.pop(); ctx.say(c.name);
      });
      palette.appendChild(sw);
    });
    palette.firstChild.classList.add('on');
    side.appendChild(palette);
    ctx.root.appendChild(side);

    function draw() {
      ctx.ask('색칠해봐!', LineArt.ART[current].name);
      canvas.innerHTML = LineArt.ART[current].svg;
      var fills = saved[current] || (saved[current] = {});
      var zones = canvas.querySelectorAll('.z');
      Array.prototype.forEach.call(zones, function (zn) {
        var id = zn.dataset.z;
        if (fills[id]) zn.setAttribute('fill', fills[id]);
        zn.addEventListener('click', function () {
          zn.setAttribute('fill', color.hex);
          fills[id] = color.hex;
          store();
          Sound.pop();
          zn.classList.remove('splash');
          void zn.getBoundingClientRect();
          zn.classList.add('splash');
          /* 다 칠하면 칭찬 */
          var left = Array.prototype.filter.call(zones, function (x) { return !fills[x.dataset.z]; });
          if (!left.length) {
            Sound.chime(); ctx.confetti();
            setTimeout(function () { ctx.say('다 칠했다! ' + LineArt.ART[current].name); }, 250);
          }
        });
      });
    }

    draw();
    setTimeout(function () { ctx.say('색을 골라서 색칠해봐'); }, 250);
  }
});
