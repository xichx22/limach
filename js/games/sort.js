/* 🎯 담기 — 색깔(또는 모양)이 같은 통에 담는다.
   '무엇이냐'가 아니라 '어떤 성질로 묶이느냐'를 본다.
   같은 사과라도 색으로 묶을 수도, 모양으로 묶을 수도 있다는 걸 몸으로 익힌다. */
Engine.register({
  id: 'sort',
  name: '담기',
  icon: '🎯',
  levels: 3,
  upAfter: 3,
  downAfter: 2,
  supports: function () { return true; },

  round: function (ctx) {
    var COLORS = [
      { id: 'red', name: '빨강', hex: '#e8453c' },
      { id: 'blue', name: '파랑', hex: '#2f80ed' },
      { id: 'yellow', name: '노랑', hex: '#ffd23f' },
      { id: 'green', name: '초록', hex: '#3fb950' }
    ];
    var SHAPES = [
      { id: 'circle', name: '동그라미' },
      { id: 'square', name: '네모' },
      { id: 'triangle', name: '세모' },
      { id: 'star', name: '별' }
    ];
    var bins = [2, 3, 4][ctx.level()];
    var each = 3;
    /* 2단계부터는 모양으로도 묶어본다 */
    var byShape = ctx.level() >= 1 && Math.random() < 0.5;
    var groups = ctx.pick(byShape ? SHAPES : COLORS, bins);
    var timers = [];
    var left = bins * each;

    ctx.ask(byShape ? '모양끼리 담아봐!' : '같은 색끼리 담아봐!', '');
    ctx.root.classList.add('split');

    function svgFor(shapeId, hex) {
      var inner = {
        circle: '<circle cx="50" cy="50" r="40"/>',
        square: '<rect x="12" y="12" width="76" height="76" rx="8"/>',
        triangle: '<polygon points="50,8 92,88 8,88"/>',
        star: '<polygon points="50,5 61,38 96,38 68,59 79,92 50,71 21,92 32,59 4,38 39,38"/>'
      }[shapeId] || '<circle cx="50" cy="50" r="40"/>';
      return '<svg viewBox="0 0 100 100" fill="' + hex + '">' + inner + '</svg>';
    }

    /* 담을 통 */
    var binRow = ctx.el('div', 'bin-row');
    groups.forEach(function (g) {
      var bin = ctx.el('div', 'bin');
      bin.dataset.g = g.id;
      var hex = byShape ? '#9aa3aa' : g.hex;
      bin.innerHTML = '<span class="bin-mark">' +
        svgFor(byShape ? g.id : 'circle', hex) + '</span>' +
        '<span class="bin-name">' + g.name + '</span>' +
        '<span class="bin-count">0</span>';
      Drag.bindDrop(bin, function (el, id) { tryPut(el, id); });
      binRow.appendChild(bin);
    });
    ctx.root.appendChild(binRow);

    /* 담을 것들 */
    var tray = ctx.el('div', 'sort-tray');
    var items = [];
    groups.forEach(function (g, gi) {
      for (var k = 0; k < each; k++) {
        items.push({
          key: g.id + '-' + k,
          g: g.id,
          shape: byShape ? g.id : ctx.one(SHAPES).id,
          hex: byShape ? ctx.one(COLORS).hex : g.hex
        });
      }
    });
    ctx.shuffle(items).forEach(function (it) {
      var pc = ctx.el('button', 'sort-piece');
      pc.type = 'button';
      pc.dataset.key = it.key;
      pc.dataset.g = it.g;
      pc.innerHTML = svgFor(it.shape, it.hex);
      Drag.make(pc, {
        id: it.key,
        dropSelector: '.bin',
        onDrop: function (el, id) { tryPut(el, id); }
      });
      tray.appendChild(pc);
    });
    ctx.root.appendChild(tray);

    function tryPut(bin, key) {
      var pc = tray.querySelector('.sort-piece[data-key="' + key + '"]');
      if (!pc) return;
      if (pc.dataset.g !== bin.dataset.g) {
        bin.classList.add('nope');
        timers.push(setTimeout(function () { bin.classList.remove('nope'); }, 400));
        Sound.wrong();
        return;
      }
      pc.remove();
      Drag.clear();
      var cnt = bin.querySelector('.bin-count');
      cnt.textContent = String(+cnt.textContent + 1);
      bin.classList.add('got');
      timers.push(setTimeout(function () { bin.classList.remove('got'); }, 300));
      Sound.pop();
      left--;
      if (left <= 0) {
        timers.push(setTimeout(function () {
          ctx.win({ id: 'sort', name: byShape ? '모양끼리 다 담았다!' : '색깔끼리 다 담았다!',
                    say: '다 담았다', emoji: '🎯' });
        }, 500));
      }
    }

    timers.push(setTimeout(function () {
      ctx.say(byShape ? '같은 모양끼리 통에 담아봐' : '같은 색끼리 통에 담아봐');
    }, 250));
    return function () { Drag.clear(); timers.forEach(clearTimeout); };
  }
});
