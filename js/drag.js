/* 끌어서 옮기기 공통 부품.
   끌기가 어려운 아이도 있으니 '눌렀다 놓기'로도 되게 한다.
   - 조각을 누르면 골라진다
   - 그대로 끌면 따라온다
   - 놓은 자리가 받을 수 있는 곳이면 거기로 간다 */
(function (global) {
  'use strict';

  var picked = null;   // 지금 골라둔 것

  function clear() {
    if (picked && picked.node) picked.node.classList.remove('picked');
    picked = null;
  }

  /* node: 끌 대상, opts.id: 무엇인지, opts.dropSelector: 놓을 수 있는 곳,
     opts.onDrop(dropEl, id), opts.enabled() */
  function make(node, opts) {
    var flying = null, moved = false, sx = 0, sy = 0;

    function down(e) {
      if (opts.enabled && !opts.enabled()) return;
      e.preventDefault();
      moved = false; sx = e.clientX; sy = e.clientY;
      clear();
      picked = { node: node, id: opts.id };
      node.classList.add('picked');
      if (opts.onPick) opts.onPick(opts.id);
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    }
    function move(e) {
      if (!moved && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 8) return;
      if (!moved) {
        moved = true;
        flying = node.cloneNode(true);
        flying.classList.add('flying');
        flying.classList.remove('picked');
        document.body.appendChild(flying);
        node.classList.add('lifted');
      }
      flying.style.left = e.clientX + 'px';
      flying.style.top = e.clientY + 'px';
    }
    function up(e) {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      node.classList.remove('lifted');
      if (flying) { flying.remove(); flying = null; }
      if (!moved) return;                       // 그냥 누른 것 = 고르기
      var el = document.elementFromPoint(e.clientX, e.clientY);
      var drop = el && el.closest && el.closest(opts.dropSelector);
      if (drop) opts.onDrop(drop, opts.id);
    }
    node.addEventListener('pointerdown', down);
  }

  /* 놓을 곳을 눌렀을 때 — 골라둔 게 있으면 거기로 보낸다 */
  function bindDrop(el, handler) {
    el.addEventListener('click', function () {
      if (!picked) return;
      handler(el, picked.id);
    });
  }

  function current() { return picked ? picked.id : null; }

  global.Drag = { make: make, bindDrop: bindDrop, clear: clear, current: current };
})(window);
