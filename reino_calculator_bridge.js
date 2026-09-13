(()=>{
'use strict';
const $=id=>document.getElementById(id);
function open(){const modal=$('reinoCalcModal'),frame=$('reinoCalcFrame');if(!modal||!frame)return;modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');document.body.classList.add('reino-calc-open');setTimeout(()=>frame.focus(),30);}
function close(){const modal=$('reinoCalcModal');if(!modal)return;modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');document.body.classList.remove('reino-calc-open');}
function bind(){
 document.addEventListener('click',e=>{const b=e.target.closest('#openCalcBtn,[data-open-reino-calc]');if(b){e.preventDefault();open();return;}if(e.target===$('reinoCalcModal'))close();});
 window.addEventListener('message',e=>{const frame=$('reinoCalcFrame');if(!frame||e.source!==frame.contentWindow)return;const m=e.data||{};if(m.type==='ecomat-calculator-close')close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('reinoCalcModal')?.classList.contains('hidden')){e.preventDefault();close();}});
 window.ReinoIntegralCalculator={open,close};
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();
