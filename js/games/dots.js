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
    /* 점을 순서대로 이으면 그림이 된다. 좌표는 100 x 100 기준.
       점(반지름 6.2)끼리 13 이상 떨어지고 가장자리에서 8 이상 안쪽이어야 한다 —
       '배'의 2번과 7번이 같은 좌표라 2번이 가려져 끝낼 수 없었다(2026-09-26). */
    var PICS = {
      small: [
        { name: '세모', pts: [[50, 12], [88, 82], [12, 82]] },
        { name: '네모', pts: [[18, 18], [82, 18], [82, 82], [18, 82]] },
        { name: '집', pts: [[50, 10], [90, 44], [74, 44], [74, 88], [26, 88], [26, 44], [10, 44]] }
      ],
      mid: [
        { name: '별', pts: [[50, 8], [61, 38], [92, 38], [68, 59], [77, 90], [50, 71], [23, 90], [32, 59], [8, 38], [39, 38]] },
        { name: '배', pts: [[48, 8], [80, 46], [92, 60], [74, 86], [26, 86], [8, 60], [48, 60]] },
        { name: '물고기', pts: [[10, 50], [36, 24], [66, 24], [82, 42], [92, 22], [92, 78], [82, 58], [66, 76], [36, 76]] }
      ],
      big: [
        { name: '자동차', pts: [[8, 70], [8, 54], [24, 54], [34, 34], [66, 34], [76, 54], [92, 54], [92, 70], [66, 70], [34, 70]] },
        { name: '나무', pts: [[50, 8], [74, 34], [60, 34], [82, 60], [58, 60], [58, 92], [42, 92], [42, 60], [18, 60], [40, 34], [26, 34]] },
        { name: '하트', pts: [[50, 26], [64, 10], [84, 14], [92, 34], [78, 58], [50, 88], [22, 58], [8, 34], [16, 14], [36, 10]] }
      ]
    };
    var sets = [PICS.small, PICS.mid, PICS.big];
    var pic = ctx.one(sets[ctx.level()]);
    var pts = pic.pts;
    var next = 0;
    var timers = [];
    /* '1' 을 그대로 읽히면 "일" 이 된다. 세는 말은 "하나, 둘" 이다 */
    var NUM = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열하나', '열둘'];

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
        ctx.say(NUM[next]);
        return;
      }
      nodes[i].classList.add('done');
      next++;
      drawLine();
      Sound.pop();
      ctx.say(NUM[i]);
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
