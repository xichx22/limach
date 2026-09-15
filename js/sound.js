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

  function stop() {
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
    canSpeakKorean: canSpeakKorean
  };
})(window);
