/* 🎹 피아노 — 눌러서 소리를 내고, 들려준 대로 따라 친다.
   소리를 순서대로 기억하는 힘과 박자 감각을 쓴다.
   자유롭게 눌러보는 것만으로도 재밌어서, 지칠 때 쉬어가는 자리가 된다. */
Engine.register({
  id: 'piano',
  name: '피아노',
  icon: '🎹',
  levels: 4,
  upAfter: 2,
  downAfter: 2,
  supports: function () { return true; },

  round: function (ctx) {
    var KEYS = [
      { n: '도', f: 261.63, c: '#e8453c' },
      { n: '레', f: 293.66, c: '#f5872b' },
      { n: '미', f: 329.63, c: '#ffd23f', light: true },
      { n: '파', f: 349.23, c: '#3fb950' },
      { n: '솔', f: 392.00, c: '#2f80ed' },
      { n: '라', f: 440.00, c: '#1f3a93' },
      { n: '시', f: 493.88, c: '#9b59d0' },
      { n: '높은도', f: 523.25, c: '#ff86b5' }
    ];
    var lens = [2, 3, 4, 5];
    var want = lens[ctx.level()];
    var seq = [], step = 0, listening = false, free = true;
    var timers = [];

    var bar = ctx.el('div', 'tool-bar');
    var modeBtn = ctx.el('button', 'tool-btn', '🎧 따라 치기');
    modeBtn.type = 'button';
    var againBtn = ctx.el('button', 'tool-btn', '🔊 다시 들려줘');
    againBtn.type = 'button';
    againBtn.hidden = true;
    bar.appendChild(modeBtn); bar.appendChild(againBtn);
    ctx.root.appendChild(bar);

    var keys = ctx.el('div', 'piano');
    var keyNodes = [];
    KEYS.forEach(function (k, i) {
      var key = ctx.el('button', 'pkey' + (k.light ? ' light' : ''));
      key.type = 'button';
      key.style.background = k.c;
      key.innerHTML = '<span>' + k.n + '</span>';
      key.addEventListener('click', function () { press(i); });
      keys.appendChild(key);
      keyNodes.push(key);
    });
    ctx.root.appendChild(keys);

    function hit(i) {
      Sound.note(KEYS[i].f);
      var k = keyNodes[i];
      k.classList.add('on');
      timers.push(setTimeout(function () { k.classList.remove('on'); }, 260));
    }

    function press(i) {
      if (listening) return;
      hit(i);
      if (free) return;
      if (i === seq[step]) {
        step++;
        if (step >= seq.length) {
          timers.push(setTimeout(function () {
            ctx.win({ id: 'piano', name: seq.map(function (x) { return KEYS[x].n; }).join(' '),
                      emoji: '🎹' });
          }, 400));
        }
      } else {
        ctx.lose(keyNodes[i]);
        step = 0;
        timers.push(setTimeout(playSeq, 700));
      }
    }

    function playSeq() {
      listening = true;
      step = 0;
      seq.forEach(function (i, k) {
        timers.push(setTimeout(function () { hit(i); }, 500 + k * 620));
      });
      timers.push(setTimeout(function () { listening = false; }, 500 + seq.length * 620));
    }

    function startQuiz() {
      free = false;
      modeBtn.textContent = '🎵 자유 연주';
      againBtn.hidden = false;
      ctx.ask('들은 대로 눌러봐', '');
      seq = [];
      for (var i = 0; i < want; i++) seq.push(Math.floor(Math.random() * KEYS.length));
      playSeq();
    }

    function startFree() {
      free = true;
      modeBtn.textContent = '🎧 따라 치기';
      againBtn.hidden = true;
      ctx.ask('아무거나 눌러봐!', '');
    }

    modeBtn.addEventListener('click', function () {
      Sound.pop();
      if (free) startQuiz(); else startFree();
    });
    againBtn.addEventListener('click', function () { if (!listening) playSeq(); });

    startFree();
    timers.push(setTimeout(function () { ctx.say('피아노야. 눌러봐'); }, 250));
    return function () { timers.forEach(clearTimeout); };
  }
});
