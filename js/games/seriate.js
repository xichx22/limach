/* 📏 크기 순서 — 작은 것부터 큰 것까지 차례로 놓는다.
   '더 크다/더 작다'를 여러 개 사이에서 동시에 견주어야 해서 생각보다 어렵다.
   크기를 줄 세우는 힘은 나중에 수의 크기를 이해하는 바탕이 된다. */
Engine.register({
  id: 'seriate',
  name: '크기 순서',
  icon: '📏',
  levels: 3,
  upAfter: 3,
  downAfter: 2,
  supports: function () { return true; },

  round: function (ctx) {
    var counts = [3, 4, 5];
    var n = counts[ctx.level()];
    var SHAPES = ['🚗', '🐟', '⭐', '🎈', '🍎', '🐻', '🌳', '🚚'];
    var face = ctx.one(SHAPES);
    var placed = 0;
    var timers = [];

    ctx.ask('작은 것부터 순서대로!', '');
    ctx.root.classList.add('split');

    /* 왼쪽(또는 위): 빈 자리 — 왼쪽이 가장 작다 */
    var row = ctx.el('div', 'size-row');
    var slots = [];
    for (var i = 0; i < n; i++) {
      (function (i) {
        var slot = ctx.el('div', 'size-slot');
        slot.dataset.i = i;
        slot.style.setProperty('--s', (0.34 + 0.66 * (i / (n - 1))).toFixed(2));
        slot.innerHTML = '<span class="size-ghost">' + face + '</span>';
        Drag.bindDrop(slot, function (el, id) { tryPut(+el.dataset.i, id); });
        slot.addEventListener('click', function () { });
        row.appendChild(slot);
        slots.push(slot);
      })(i);
    }
    ctx.root.appendChild(row);

    /* 쟁반: 섞인 크기들 */
    var tray = ctx.el('div', 'size-tray');
    var pieces = [];
    ctx.shuffle((function () { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; })())
      .forEach(function (i) {
        var pc = ctx.el('button', 'size-piece');
        pc.type = 'button';
        pc.dataset.i = i;
        pc.style.setProperty('--s', (0.34 + 0.66 * (i / (n - 1))).toFixed(2));
        pc.innerHTML = '<span>' + face + '</span>';
        Drag.make(pc, {
          id: i,
          dropSelector: '.size-slot',
          onDrop: function (el, id) { tryPut(+el.dataset.i, id); }
        });
        tray.appendChild(pc);
        pieces.push(pc);
      });
    ctx.root.appendChild(tray);

    function tryPut(slotIdx, id) {
      if (slotIdx !== id) {
        var s = slots[slotIdx];
        s.classList.add('nope');
        timers.push(setTimeout(function () { s.classList.remove('nope'); }, 400));
        Sound.wrong();
        return;
      }
      var pc = tray.querySelector('.size-piece[data-i="' + id + '"]');
      if (!pc) return;
      pc.remove();
      Drag.clear();
      slots[slotIdx].classList.add('filled');
      slots[slotIdx].innerHTML = '<span class="size-on">' + face + '</span>';
      Sound.pop();
      placed++;
      if (placed >= n) {
        timers.push(setTimeout(function () {
          ctx.win({ id: 'seriate', name: '작은 것부터 큰 것까지!', say: '작은 것부터 큰 것까지',
                    emoji: '📏' });
        }, 500));
      }
    }

    timers.push(setTimeout(function () { ctx.say('작은 것부터 순서대로 놓아봐'); }, 250));
    return function () { Drag.clear(); timers.forEach(clearTimeout); };
  }
});
