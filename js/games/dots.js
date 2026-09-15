/* 👆 점 잇기 — 1, 2, 3 … 순서대로 점을 누르면 선이 이어지고 그림이 나타난다.
   숫자 '모양'을 눈으로 익히는 놀이다. 세는 것과 숫자를 보고 아는 것은 다른 능력이다.
   틀린 점을 눌러도 벌이 없다. 다음 숫자를 다시 알려줄 뿐이다. */
Engine.register({
  id: 'dots',
  name: '점 잇기',
  icon: '👆',
  levels: 3,
  upAfter: 2,
  downAfter: 2,
  supports: function () { return true; },

  round: function (ctx) {
    /* 점을 순서대로 이으면 그림이 된다. 좌표는 100 x 100 기준 */
    var PICS = {
      small: [
        { name: '세모', pts: [[50, 12], [88, 82], [12, 82]] },
        { name: '네모', pts: [[18, 18], [82, 18], [82, 82], [18, 82]] },
        { name: '집', pts: [[50, 10], [88, 42], [76, 42], [76, 88], [24, 88], [24, 42], [12, 42]] }
      ],
      mid: [
        { name: '별', pts: [[50, 6], [61, 38], [95, 38], [68, 59], [78, 92], [50, 71], [22, 92], [32, 59], [5, 38], [39, 38]] },
        { name: '배', pts: [[50, 8], [50, 52], [86, 52], [72, 80], [28, 80], [14, 52], [50, 52]] },
        { name: '물고기', pts: [[16, 50], [40, 24], [70, 24], [86, 44], [98, 22], [98, 78], [86, 56], [70, 76], [40, 76]] }
      ],
      big: [
        { name: '자동차', pts: [[8, 70], [8, 54], [24, 54], [34, 34], [66, 34], [76, 54], [92, 54], [92, 70], [78, 70], [70, 70], [30, 70], [22, 70]] },
        { name: '나무', pts: [[50, 6], [70, 32], [60, 32], [80, 58], [58, 58], [58, 92], [42, 92], [42, 58], [20, 58], [40, 32], [30, 32]] },
        { name: '하트', pts: [[50, 26], [64, 10], [84, 14], [92, 34], [78, 58], [50, 88], [22, 58], [8, 34], [16, 14], [36, 10]] }
      ]
    };
    var sets = [PICS.small, PICS.mid, PICS.big];
    var pic = ctx.one(sets[ctx.level()]);
    var pts = pic.pts;
    var next = 0;
    var timers = [];

    ctx.ask('숫자 순서대로 눌러봐', '');

    var box = ctx.el('div', 'dot-box');
    var SZ = 100;
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'dot-svg');

    var shape = document.createElementNS(svgNS, 'polygon');
    shape.setAttribute('class', 'dot-shape');
    shape.setAttribute('points', pts.map(function (p) { return p.join(','); }).join(' '));
    svg.appendChild(shape);

    var line = document.createElementNS(svgNS, 'polyline');
    line.setAttribute('class', 'dot-line');
    line.setAttribute('points', '');
    svg.appendChild(line);

    var nodes = [];
    pts.forEach(function (p, i) {
      var g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'dot');
      var c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', 6.2);
      var t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', p[0]); t.setAttribute('y', p[1] + 2.6);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = String(i + 1);
      g.appendChild(c); g.appendChild(t);
      g.addEventListener('click', function () { tap(i); });
      svg.appendChild(g);
      nodes.push(g);
    });

    box.appendChild(svg);
    ctx.root.appendChild(box);

    function drawLine() {
      line.setAttribute('points', pts.slice(0, next).map(function (p) { return p.join(','); }).join(' '));
    }

    function tap(i) {
      if (next >= pts.length) return;
      if (i !== next) {
        Sound.wrong();
        nodes[i].classList.add('shake');
        timers.push(setTimeout(function () { nodes[i].classList.remove('shake'); }, 450));
        nodes[next].classList.add('hint');
        timers.push(setTimeout(function () { nodes[next].classList.remove('hint'); }, 1200));
        ctx.say(String(next + 1));
        return;
      }
      nodes[i].classList.add('done');
      next++;
      drawLine();
      Sound.pop();
      ctx.say(String(i + 1));
      if (next >= pts.length) {
        /* 마지막 점에서 처음으로 돌아가 그림이 닫힌다 */
        line.setAttribute('points',
          pts.concat([pts[0]]).map(function (p) { return p.join(','); }).join(' '));
        svg.classList.add('filled');
        timers.push(setTimeout(function () {
          ctx.win({ id: 'dots', name: pic.name, emoji: '👆' });
        }, 900));
      }
    }

    timers.push(setTimeout(function () { ctx.say('하나부터 순서대로 눌러봐'); }, 250));
    return function () { timers.forEach(clearTimeout); };
  }
});
