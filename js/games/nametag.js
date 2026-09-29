/* 🏷️ 이름표 붙이기 — 사진을 보여주고, 글자로 된 이름표 중에서 맞는 걸 고른다.
   지한이가 제일 좋아하는 '이름 듣고 그림 찾기'를 거꾸로 뒤집은 것 — 그림은 알고 있으니
   이번엔 글자 모양을 보고 고른다. 한글의 첫걸음은 글자를 통째로 알아보는 것(통글자).
   이름표를 누르면 읽어주니, 틀려도 "이건 굴착기야" 하고 글자와 소리가 이어진다.
   단계: 이름표 2 → 3 → 4장. 마지막 단계는 이름을 말해주지 않는다(사진만 보고 읽기). */
Engine.register({
  id: 'nametag',
  name: '이름표 붙이기',
  icon: '🏷️',
  levels: 3,
  upAfter: 3,
  downAfter: 2,
  supports: function (theme) { return Hangul.words(theme.items).length >= 3; },

  round: function (ctx) {
    var lv = ctx.level();
    var pool = Hangul.words(ctx.theme.items);
    var target = ctx.one(pool);
    var others = pool.filter(function (i) { return i.id !== target.id; });
    /* 처음엔 첫 글자가 다른 것끼리 — 모양이 확 달라야 구별이 쉽다 */
    if (lv === 0) {
      var diff = others.filter(function (i) { return i.name[0] !== target.name[0]; });
      if (diff.length) others = diff;
    }
    var choices = ctx.shuffle([target].concat(ctx.pick(others, [1, 2, 3][lv])));
    var misses = 0, answered = false;
    var sayName = lv < 2;

    ctx.ask('이름표를 붙여줘!', '🏷️');

    var photo = ctx.el('div', 'nt-photo', Art.html(target, { eager: true }) +
                                          '<span class="nt-slot">?</span>');
    ctx.root.appendChild(photo);
    var slot = photo.querySelector('.nt-slot');

    var row = ctx.el('div', 'nt-cards');
    choices.forEach(function (it) {
      var c = ctx.el('button', 'nt-card' + (it.name.length >= 5 ? ' long' : ''), it.name);
      c.type = 'button';
      c.dataset.id = it.id;
      c.addEventListener('click', function () {
        if (answered) return;
        if (it.id === target.id) {
          answered = true;
          ctx.say(it.name);
          c.classList.add('fly');
          slot.textContent = it.name;
          slot.classList.add('on');
          Hangul.learn(it.name);
          setTimeout(function () { ctx.win(target); }, 700);
        } else {
          ctx.lose(c);
          ctx.say('이건 ' + it.name + '야');
          if (++misses >= 2) ctx.hint(row.querySelector('[data-id="' + target.id + '"]'));
        }
      });
      row.appendChild(c);
    });
    ctx.root.appendChild(row);

    setTimeout(function () {
      ctx.say(sayName ? ctx.spoken(target) + ' 이름표는 어디 있을까?' : '이건 이름이 뭘까? 이름표를 찾아봐');
    }, 250);
  }
});
