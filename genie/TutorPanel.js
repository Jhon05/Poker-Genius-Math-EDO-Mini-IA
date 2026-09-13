(()=>{'use strict';const G=window.GeniusMath,$=id=>document.getElementById(id);let hooks={},busy=false,lastFocus=null;
const text=(id,value)=>{const el=$(id);if(el)el.textContent=value};
function status(message){text('genieStatus',message)}
function isReady(p){return !!p.generative&&!!p.ready&&(p.kind!=='local'||p.liveInference===true)}
function refresh(){const provider=G.ModelProvider.current(),local=G.ModelProvider.local(),ready=isReady(provider),localBusy=local.initializing||['probing','loading','warming','generating','cancelling'].includes(local.status),blocked=busy||localBusy;
 text('genieHelpBadge',provider.kind==='guided'?'Guía compatible · sin IA':ready?(provider.kind==='cloud'?'IA conectada':'IA en este equipo'):'IA no activada');
 $('genieForm').classList.toggle('hidden',provider.kind==='guided');$('genieSendBtn').disabled=blocked||!ready;$('genieInput').disabled=blocked||!ready;$('genieCancelBtn').classList.toggle('hidden',!blocked);
 $('genieLoadBtn').disabled=blocked;$('genieProfile').disabled=blocked;
 $('genieCloudBtn').classList.toggle('hidden',!G.config.cloud.enabled);$('genieCloudBtn').disabled=blocked;
 $('genieModeDetails').open=!ready&&provider.kind!=='guided';
 text('genieEngineNote',provider.kind==='guided'?'Referencia de fórmulas. No hay generación de respuestas.':ready?'Las respuestas son generadas y pueden contener errores. La calificación la realiza el evaluador del juego.':'El chat necesita activar un modelo real. La Guía compatible funciona sin IA.');
}
function setBusy(value){busy=value;refresh();$('genieChat').setAttribute('aria-busy',String(value))}
function show(){lastFocus=document.activeElement;$('geniePanel').classList.remove('hidden');$('questionModal').classList.add('genius-open');refresh()}
function hide(){hooks.cancel?.();$('geniePanel').classList.add('hidden');$('questionModal').classList.remove('genius-open');if(lastFocus?.isConnected)lastFocus.focus()}
function references(question){const host=$('genieReference');host.replaceChildren();const data=G.GuidedProvider.references(question);const title=document.createElement('h4');title.textContent='Guía compatible — sin IA';host.append(title);const desc=document.createElement('p');desc.textContent=data.objective;host.append(desc);for(const f of data.formulas){const box=document.createElement('div');box.className='genius-formula';const b=document.createElement('b');b.textContent=f.title;const formula=document.createElement('div');formula.textContent='\\['+f.latex+'\\]';const small=document.createElement('small');small.textContent=f.conditions||f.hypotheses||'';box.append(b,formula,small);host.append(box)}host.classList.remove('hidden');hooks.math?.(host)}
function bind(options){hooks=options;
 $('genieCloseBtn').addEventListener('click',()=>hooks.close?.());
 $('genieCancelBtn').addEventListener('click',()=>{hooks.cancel?.();G.ModelProvider.cancel();status('Cancelando la operación. Tu progreso se conserva.');refresh()});
 $('genieLoadBtn').addEventListener('click',()=>{G.PreloadPanel.open({profile:$('genieProfile').value,returnFocus:$('genieLoadBtn')});status('Comprueba el equipo y prepara el modelo en el panel de Genius. Durante una partida ya iniciada el reloj continúa.')});
 $('genieGuideBtn').addEventListener('click',()=>{hooks.cancel?.();G.ModelProvider.useGuided();const q=hooks.question?.();if(q)references(q);hooks.guideUsed?.();status('Guía de fórmulas abierta. Para conversar, activa un modelo.');refresh()});
 $('genieCloudBtn').addEventListener('click',async()=>{if(!G.config.cloud.enabled)return;if(!confirm('El proveedor remoto recibirá tu consulta, el ejercicio visible y el contexto de la conversación, sin tu nombre ni código. ¿Autorizar esta conexión?'))return;try{await G.ModelProvider.activateCloud(true);$('genieReference').classList.add('hidden');status('Tutor remoto conectado.');refresh()}catch(e){status(e.message)}});
 $('genieInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!busy&&!$('genieSendBtn').disabled)$('genieForm').requestSubmit()}});
 $('genieInput').addEventListener('input',()=>hooks.draft?.($('genieInput').value));
 window.addEventListener('genius:model-state',e=>{const d=e.detail;if(['probing','loading','warming'].includes(d.status)){const pct=d.progress;status((d.status==='warming'?'Comprobando generación real':d.status==='probing'?'Comprobando dispositivo':'Preparando Genius')+(typeof pct==='number'&&Number.isFinite(pct)?' · '+Math.round(pct*100)+' % comunicado por el runtime':'')+'. Puedes cancelar.')}else if(d.status==='generating')status('Genius está pensando…');else if(d.status==='cancelling')status('Deteniendo la generación…');else if(d.status==='error')status((d.diagnostic?.cause||d.message||'No se activó el modelo.')+' '+(d.diagnostic?.remedy||''));else if(d.status==='cancelled')status(d.message||'Preparación cancelada.');else if(d.status==='ready'&&G.ModelProvider.current()===G.ModelProvider.local()&&d.liveInference){$('genieReference').classList.add('hidden');if(!busy)status('Genius listo. Escribe tu duda sobre el ejercicio.')}refresh()});
 $('geniePanel').addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();hooks.close?.()}});refresh();
}
G.TutorPanel={bind,show,hide,refresh,status,setBusy,references};})();
