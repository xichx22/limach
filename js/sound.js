/* 소리 담당: 한국어 음성(TTS) + 효과음 합성
   외부 음원 파일 없이 브라우저 기능만 사용한다. */
(function (global) {
  'use strict';

  var ctx = null;
  var koVoice = null;
  var ready = false;
  var voiceChecked = false;

  function pickVoice() {
    if (!global.speechSynthesis) return;
    var voices = global.speechSynthesis.getVoices() || [];
    if (!voices.length) return;
    koVoice =
      voices.find(function (v) { return v.lang === 'ko-KR'; }) ||
      voices.find(function (v) { return (v.lang || '').replace('_', '-').indexOf('ko') === 0; }) ||
      null;
    voiceChecked = true;
  }

  if (global.speechSynthesis) {
    pickVoice();
    global.speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }

  /* 모바일은 사용자가 화면을 만진 뒤에야 소리를 낼 수 있다. */
  function unlock() {
    if (ready) return;
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();
      }
    } catch (e) { ctx = null; }

    if (global.speechSynthesis) {
      try {
        var warm = new SpeechSynthesisUtterance(' ');
        warm.volume = 0;
        global.speechSynthesis.speak(warm);
      } catch (e) { /* 무시 */ }
      pickVoice();
    }
    ready = true;
  }

  /* 한국어 음성이 기기에 없으면 화면 글자로만 안내해야 한다. */
  function canSpeakKorean() {
    if (!global.speechSynthesis) return false;
    if (!voiceChecked) pickVoice();
    return !!koVoice || (global.speechSynthesis.getVoices() || []).length === 0;
  }

  function speak(text, opts) {
    if (!global.speechSynthesis || !text) return;
    opts = opts || {};
    try {
      global.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'ko-KR';
      if (koVoice) u.voice = koVoice;
      u.rate = opts.rate == null ? 0.85 : opts.rate;    // 따라할 수 있게 천천히
      u.pitch = opts.pitch == null ? 1.2 : opts.pitch;  // 밝은 목소리
      u.volume = 1;
      global.speechSynthesis.speak(u);
    } catch (e) { /* 무시 */ }
  }

  function tone(freq, dur, type, delay, peak) {
    if (!ctx) return;
    var t0 = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak || 0.2, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /* 무언가를 눌렀을 때 */
  function pop() {
    tone(660, 0.11, 'triangle', 0, 0.16);
    tone(990, 0.09, 'sine', 0.05, 0.12);
  }

  /* 맞췄을 때 — 딩동댕 */
  function chime() {
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      tone(f, 0.3, 'sine', i * 0.1, 0.18);
    });
  }

  /* 틀렸을 때 — 혼내는 소리가 아니라 부드럽게 내려가는 음 */
  function wrong() {
    tone(392, 0.18, 'sine', 0, 0.14);
    tone(311, 0.24, 'sine', 0.13, 0.12);
  }

  /* 한 단계 올라갔을 때 — 올라가는 음계 */
  function levelUp() {
    [523, 659, 784, 1047, 1319].forEach(function (f, i) {
      tone(f, 0.22, 'triangle', i * 0.08, 0.16);
    });
  }

  /* 피아노 음 하나 */
  function note(freq, dur) {
    tone(freq, dur || 0.55, 'triangle', 0, 0.24);
    tone(freq * 2, (dur || 0.55) * 0.5, 'sine', 0, 0.06);
  }

  /* ---------- 탈것 효과음 (파일 없이 합성) ---------- */

  /* 삐뽀삐뽀 — 두 음을 번갈아 */
  function siren(times) {
    for (var i = 0; i < (times || 3) * 2; i++) {
      tone(i % 2 ? 660 : 880, 0.34, 'triangle', i * 0.36, 0.13);
    }
  }

  /* 빵빵 */
  function horn() {
    [0, 0.28].forEach(function (d) {
      tone(349, 0.2, 'square', d, 0.07);
      tone(440, 0.2, 'square', d, 0.05);
    });
  }

  /* 칙칙폭폭 뒤에 뿌우 */
  function whistle() {
    tone(587, 0.7, 'sine', 0, 0.12);
    tone(740, 0.7, 'sine', 0, 0.08);
  }

  /* 백색소음 한 토막 (물·흙·문지르기 소리의 재료) */
  var noiseBuf = null;
  function noiseBuffer() {
    if (!ctx) return null;
    if (noiseBuf) return noiseBuf;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  /* 짧은 소음: 흙 퍼기(낮게)·문지르기(높게) */
  function burst(freq, dur, peak) {
    var buf = noiseBuffer();
    if (!buf) return;
    var t0 = ctx.currentTime;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq || 800; f.Q.value = 0.8;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.25, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.25));
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + (dur || 0.25) + 0.05);
  }

  /* 켜고 끄는 긴 소리: 물 뿌리기('water')·엔진('engine').
     같은 이름으로 다시 켜면 무시하고, off 로 끈다. */
  var loops = {};
  function loop(name, on) {
    if (!ctx) return;
    if (!on) {
      var l = loops[name];
      if (l) {
        l.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
        (function (x) { setTimeout(function () { try { x.src.stop(); } catch (e) {} }, 300); })(l);
        delete loops[name];
      }
      return;
    }
    if (loops[name]) return;
    var g = ctx.createGain();
    g.gain.value = 0.0001;
    var src;
    if (name === 'engine') {
      src = ctx.createOscillator();
      src.type = 'sawtooth'; src.frequency.value = 58;
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 9; lg.gain.value = 10;
      lfo.connect(lg).connect(src.frequency); lfo.start();
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 420;
      src.connect(lp).connect(g);
      g.gain.setTargetAtTime(0.12, ctx.currentTime, 0.08);
      src.onended = function () { try { lfo.stop(); } catch (e) {} };
    } else {
      src = ctx.createBufferSource();
      src.buffer = noiseBuffer(); src.loop = true;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.6;
      src.connect(bp).connect(g);
      g.gain.setTargetAtTime(0.16, ctx.currentTime, 0.05);
    }
    g.connect(ctx.destination);
    src.start();
    loops[name] = { src: src, g: g };
  }

  function stopLoops() { Object.keys(loops).forEach(function (k) { loop(k, false); }); }

  function stop() {
    stopLoops();
    if (global.speechSynthesis) {
      try { global.speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
    }
  }

  global.Sound = {
    unlock: unlock,
    speak: speak,
    pop: pop,
    chime: chime,
    note: note,
    wrong: wrong,
    levelUp: levelUp,
    stop: stop,
    siren: siren,
    horn: horn,
    whistle: whistle,
    burst: burst,
    loop: loop,
    canSpeakKorean: canSpeakKorean
  };
})(window);
