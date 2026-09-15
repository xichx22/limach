/* 🎤 따라 말하기 — 앱이 이름을 말해주면 지한이가 따라 하고, 자기 목소리를 다시 듣는다.
   자기가 낸 소리를 들어보는 것이 발음이 자라는 데 크게 도움이 된다.
   녹음은 이 기기 안에만 저장된다. 서버로 보내지 않는다. */
Engine.register({
  id: 'voice',
  name: '따라 말하기',
  icon: '🎤',
  levels: 1,
  upAfter: 99,
  downAfter: 99,

  round: function (ctx) {
    var item = ctx.one(ctx.theme.items);
    var rec = null, chunks = [], url = null, timer = null;

    ctx.ask('따라 해봐!', item.name);

    ctx.root.classList.add('split');

    var card = ctx.el('div', 'voice-card');
    card.innerHTML = '<div class="voice-art">' + Art.html(item, { eager: true }) + '</div>';
    ctx.root.appendChild(card);

    var row = ctx.el('div', 'voice-row');

    var listen = ctx.el('button', 'voice-btn', '🔊<span>들어보기</span>');
    listen.type = 'button';
    listen.addEventListener('click', function () { ctx.say(ctx.spoken(item)); });

    var mic = ctx.el('button', 'voice-btn mic', '🎤<span>녹음</span>');
    mic.type = 'button';

    var play = ctx.el('button', 'voice-btn', '▶️<span>내 목소리</span>');
    play.type = 'button';
    play.disabled = true;
    play.addEventListener('click', function () {
      if (!url) return;
      var a = new Audio(url);
      a.play().catch(function () { /* 무시 */ });
    });

    var next = ctx.el('button', 'voice-btn', '➡️<span>다음</span>');
    next.type = 'button';
    next.addEventListener('click', function () { stop(); ctx.next(); });

    row.appendChild(listen); row.appendChild(mic); row.appendChild(play); row.appendChild(next);

    var side = ctx.el('div', 'answer-side');
    side.appendChild(row);
    var note = ctx.el('div', 'notice', '녹음은 이 기기에만 저장돼요.');
    side.appendChild(note);
    ctx.root.appendChild(side);

    function stop() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (rec && rec.state === 'recording') { try { rec.stop(); } catch (e) { /* 무시 */ } }
    }

    function finish(stream) {
      mic.classList.remove('on');
      mic.innerHTML = '🎤<span>녹음</span>';
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    }

    mic.addEventListener('click', function () {
      if (rec && rec.state === 'recording') { stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        note.innerHTML = '이 브라우저는 녹음을 지원하지 않아요.';
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        chunks = [];
        rec = new MediaRecorder(stream);
        rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          finish(stream);
          if (!chunks.length) return;
          if (url) URL.revokeObjectURL(url);
          url = URL.createObjectURL(new Blob(chunks, { type: chunks[0].type || 'audio/webm' }));
          play.disabled = false;
          Sound.chime();
          note.innerHTML = '잘했어! ▶️ 를 눌러서 들어봐요.';
          setTimeout(function () {
            var a = new Audio(url);
            a.play().catch(function () { /* 무시 */ });
          }, 400);
        };
        rec.start();
        mic.classList.add('on');
        mic.innerHTML = '⏹<span>그만</span>';
        note.innerHTML = '듣고 있어요… 말해봐!';
        timer = setTimeout(stop, 4000);   // 4초까지만 녹음한다
      }).catch(function () {
        note.innerHTML = '마이크를 쓸 수 없어요.<br>브라우저 설정에서 마이크를 켜주세요.';
      });
    });

    setTimeout(function () { ctx.say(ctx.spoken(item) + '. 따라 해봐'); }, 300);

    return function () {
      stop();
      if (url) URL.revokeObjectURL(url);
    };
  }
});
