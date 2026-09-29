/* ═══════════════════════════════════════════════════════════
   [의심구역] 공용 스크립트 — 효과음 + 공통 헬퍼
   모든 화면이 이 파일을 공유합니다. (수정 시 전체 반영)
   효과음은 WebAudio로 즉석 생성 → 소리 파일 불필요, 오프라인 동작.
   ═══════════════════════════════════════════════════════════ */
'use strict';

const GF = (() => {
  const AC = window.AudioContext ? new AudioContext() : null;

  function beep(freq, dur, type = 'square', vol = 0.15) {
    if (!AC) return;
    try {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, AC.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
      o.connect(g); g.connect(AC.destination);
      o.start(); o.stop(AC.currentTime + dur);
    } catch (e) { /* 오디오 실패는 무시 (진행에 영향 없음) */ }
  }

  // 절제된 기계식 클릭음 (필터링된 노이즈 버스트) — 연구소 단말기 느낌, 삑삑거리는 톤 대신 사용
  function mechClick(vol = 0.14, freq = 2200) {
    if (!AC) return;
    try {
      const dur = 0.018;
      const n = Math.max(1, Math.floor(AC.sampleRate * dur));
      const buf = AC.createBuffer(1, n, AC.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = AC.createBufferSource(); src.buffer = buf;
      const filt = AC.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = freq; filt.Q.value = 0.7;
      const g = AC.createGain();
      g.gain.setValueAtTime(vol, AC.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
      src.connect(filt); filt.connect(g); g.connect(AC.destination);
      src.start();
    } catch (e) { /* 오디오 실패는 무시 */ }
  }

  // 브라우저 정책상 첫 사용자 입력 후 오디오가 켜집니다.
  function resumeAudio() { if (AC && AC.state === 'suspended') AC.resume(); }
  document.addEventListener('keydown', resumeAudio, true);
  document.addEventListener('pointerdown', resumeAudio, true);

  return {
    /* ── 효과음 (절제된 톤 — 명랑한 멜로디 대신 짧고 담백하게) ── */
    sndKey:   () => mechClick(),
    sndWrong: () => { beep(196, .16, 'triangle', .12); setTimeout(() => beep(147, .26, 'triangle', .12), 130); },
    sndRight: () => { beep(523, .1, 'sine', .11); setTimeout(() => beep(659, .2, 'sine', .11), 110); },
    sndPop:   () => beep(700, .05, 'sine', .09),
    sndAlarm: (n = 4) => { for (let i = 0; i < n; i++) setTimeout(() => { beep(900, .22, 'sawtooth', .12); setTimeout(() => beep(600, .22, 'sawtooth', .12), 250); }, i * 500); },
    sndBoot:  () => beep(392, .09, 'sine', .1),
    beep,

    /* ── 오답 연출: 요소 흔들기 ── */
    shake(el) {
      el.classList.remove('gf-shake');
      void el.offsetWidth;
      el.classList.add('gf-shake');
    },

    /* ── 별표 슬롯 렌더링 (다음 입력 칸에 깜빡이는 _ 커서 표시) ── */
    renderSlots(slotEls, len) {
      const n = Math.min(len, slotEls.length);
      slotEls.forEach((s, i) => {
        s.classList.toggle('filled', i < n);
        s.classList.toggle('cur', i === n);
        s.classList.remove('error');
      });
    },
    errorSlots(slotEls) { slotEls.forEach(s => { s.classList.add('error'); s.classList.remove('cur'); }); }
  };
})();
