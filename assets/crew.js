/* ════════════════════════════════════════════════════════════════════════
   assets/crew.js — 제작진용 "단계 이동" 패널 (1·3·4·5·6번 공용)

   공통 단축키 (Ctrl + Shift + Alt, 맥은 Option) — 전부 KeyboardEvent.code로 판별
   (한/영 전환, 맥 Option이 만드는 특수문자의 영향을 받지 않도록)
     Ctrl+Shift+Alt+P : 패널 열기/닫기
     Ctrl+Shift+Alt+H : 첫 화면
     Ctrl+Shift+Alt+J : 이전 단계
     Ctrl+Shift+Alt+K : 다음 단계
     Ctrl+Shift+Alt+L : 마지막 화면
     Ctrl+Shift+Alt+R : 현재 단계 다시 시작
     Esc              : (패널이 열려 있을 때만) 패널 닫기

   사용법 (각 HTML 파일에서):
     GF_CREW.init([
       { name:'1. 첫 화면',   apply: function(isRestart){ ... } },
       { name:'2. 다음 단계', apply: function(isRestart){ ... } },
       ...
     ]);
   - apply(isRestart)는 "그 단계의 화면 상태를 처음부터 완전히 구성"하는 함수로 작성하면
     이동(goto)과 다시 시작(restart)에 동일하게 재사용할 수 있음.
   - 플레이어가 정상적으로 진행해서 자연스럽게 다음 단계에 도달했을 때는
     GF_CREW.setCurrent(n)을 호출해 패널 표시만 그 단계로 조용히 맞춰줌(화면은 건드리지 않음) —
     그래야 제작진이 단축키를 처음 누르는 순간에도 "현재 진짜 단계"부터 정확히 이동/표시됨.
   - 이 스크립트는 절대 스스로 화면을 바꾸지 않음(제작진이 실제로 단축키/버튼을 눌렀을 때만 apply 호출).
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var steps = [];
  var current = 0;
  var panelOpen = false;
  var panelEl = null, stepNameEl = null;

  function build(){
    var css = document.createElement('style');
    css.textContent =
      '#gfCrewPanel{position:fixed;top:10px;right:10px;z-index:2147483000;' +
        'background:rgba(18,18,22,.94);color:#eaeaea;border:1px solid #777;border-radius:5px;' +
        'padding:10px 12px;font-family:"DungGeunMo","Galmuri11","MS Gothic",monospace;' +
        'font-size:13px;line-height:1.5;display:none;min-width:210px;' +
        'box-shadow:0 6px 22px rgba(0,0,0,.55);user-select:none;}' +
      '#gfCrewPanel.show{display:block;}' +
      '#gfCrewPanel .gf-crew-title{font-weight:bold;margin-bottom:5px;color:#ffd54a;' +
        'display:flex;justify-content:space-between;align-items:center;}' +
      '#gfCrewPanel .gf-crew-step{margin-bottom:9px;color:#8fd1ff;word-break:break-all;' +
        'border-top:1px solid #444;border-bottom:1px solid #444;padding:6px 0;}' +
      '#gfCrewPanel .gf-crew-btns{display:grid;grid-template-columns:1fr 1fr;gap:5px;}' +
      '#gfCrewPanel button{font-family:inherit;font-size:12px;padding:6px 6px;cursor:pointer;' +
        'background:#3a3a42;color:#eee;border:1px solid #777;border-radius:3px;}' +
      '#gfCrewPanel button:hover{background:#4d4d57;}' +
      '#gfCrewPanel button:active{background:#2c2c33;}' +
      '#gfCrewPanel button.gf-wide{grid-column:1 / -1;}' +
      '#gfCrewPanel button.gf-close{grid-column:1 / -1;background:#5a2323;border-color:#a55;margin-top:2px;}' +
      '#gfCrewPanel button.gf-close:hover{background:#732b2b;}';
    document.head.appendChild(css);

    panelEl = document.createElement('div');
    panelEl.id = 'gfCrewPanel';
    panelEl.innerHTML =
      '<div class="gf-crew-title"><span>제작진 패널</span></div>' +
      '<div class="gf-crew-step" id="gfCrewStepName"></div>' +
      '<div class="gf-crew-btns">' +
        '<button type="button" data-act="first">첫 화면</button>' +
        '<button type="button" data-act="last">마지막 화면</button>' +
        '<button type="button" data-act="prev">◀ 이전 단계</button>' +
        '<button type="button" data-act="next">다음 단계 ▶</button>' +
        '<button type="button" class="gf-wide" data-act="restart">현재 단계 다시 시작</button>' +
        '<button type="button" class="gf-close" data-act="close">닫기</button>' +
      '</div>';
    document.body.appendChild(panelEl);
    stepNameEl = panelEl.querySelector('#gfCrewStepName');

    panelEl.addEventListener('click', function(e){
      var btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if(!btn) return;
      var act = btn.getAttribute('data-act');
      if(act === 'first') goFirst();
      else if(act === 'last') goLast();
      else if(act === 'prev') goPrev();
      else if(act === 'next') goNext();
      else if(act === 'restart') goRestart();
      else if(act === 'close') closePanel();
    });
  }

  function refreshLabel(){
    if(!stepNameEl) return;
    var total = steps.length;
    var name = (steps[current] && steps[current].name) || '';
    stepNameEl.textContent = total ? ('[' + (current + 1) + ' / ' + total + ']  ' + name) : '(등록된 단계 없음)';
  }

  function apply(idx, isRestart){
    if(!steps.length) return;
    if(idx < 0) idx = 0;
    if(idx > steps.length - 1) idx = steps.length - 1;
    current = idx;
    refreshLabel();
    try{ steps[current].apply(!!isRestart); }
    catch(err){ console.error('[GF_CREW] 단계 적용 중 오류:', err); }
  }

  function goFirst(){ apply(0, false); }
  function goLast(){ apply(steps.length - 1, false); }
  function goPrev(){ apply(current - 1, false); }
  function goNext(){ apply(current + 1, false); }
  function goRestart(){ apply(current, true); }
  function goTo(idx){ apply(idx, false); }

  function openPanel(){
    if(!panelEl) build();
    panelOpen = true;
    panelEl.classList.add('show');
    refreshLabel();
  }
  function closePanel(){
    panelOpen = false;
    if(panelEl) panelEl.classList.remove('show');
  }
  function togglePanel(){ panelOpen ? closePanel() : openPanel(); }

  function isCrewCombo(e){
    return !!(e.ctrlKey && e.shiftKey && e.altKey);
  }

  /* 캡처 단계 + stopImmediatePropagation으로, 각 파일에 이미 있는 document keydown
     핸들러(예: 비밀번호 문자 입력)보다 항상 먼저 가로채서 그쪽으로 전달되지 않게 함 */
  document.addEventListener('keydown', function(e){
    if(e.repeat) return;

    if(panelOpen && e.code === 'Escape'){
      e.preventDefault(); e.stopImmediatePropagation();
      closePanel();
      return;
    }

    if(!isCrewCombo(e)) return;

    switch(e.code){
      case 'KeyP': e.preventDefault(); e.stopImmediatePropagation(); togglePanel(); break;
      case 'KeyH': e.preventDefault(); e.stopImmediatePropagation(); goFirst(); break;
      case 'KeyJ': e.preventDefault(); e.stopImmediatePropagation(); goPrev(); break;
      case 'KeyK': e.preventDefault(); e.stopImmediatePropagation(); goNext(); break;
      case 'KeyL': e.preventDefault(); e.stopImmediatePropagation(); goLast(); break;
      case 'KeyR': e.preventDefault(); e.stopImmediatePropagation(); goRestart(); break;
      default: break;
    }
  }, true);

  window.GF_CREW = {
    init: function(stepList, opts){
      steps = stepList || [];
      current = (opts && typeof opts.startAt === 'number') ? opts.startAt : 0;
      if(!panelEl) build();
      refreshLabel();
    },
    setCurrent: function(idx){
      if(idx < 0 || idx > steps.length - 1) return;
      current = idx;
      refreshLabel();
    },
    goFirst: goFirst, goPrev: goPrev, goNext: goNext, goLast: goLast, goRestart: goRestart,
    goTo: goTo,
    isOpen: function(){ return panelOpen; },
    currentIndex: function(){ return current; }
  };
})();
