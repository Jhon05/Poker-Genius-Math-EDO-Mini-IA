/* v7.2.1 LocalModelProvider: real Worker RPC, proof-of-inference and cancellation barrier. */
(()=>{'use strict';const G=window.GeniusMath;
class LocalModelProvider{
 constructor(){this.kind='local';this.providerKind='uninitialized';this.generative=true;this.ready=false;this.liveInference=false;this.worker=null;this.pending=new Map();this.sequence=0;this.epoch=0;this.status='idle';this.stage='idle';this.model=null;this.lastError=null;this.diagnostic=null;this.lastLoad=null;this.lastMetrics=null;this.runtimeChecks=[];this.controller=null;this.initializing=false;this.cancelTimer=null;}
 emit(status,extra={}){this.status=status;window.dispatchEvent(new CustomEvent('genius:model-state',{detail:{provider:this.kind,providerKind:this.providerKind,liveInference:this.liveInference,status,model:this.model,stage:this.stage,...extra}}));}
 async capabilities(options={}){return G.GenieCapabilityProbe.probe(options)}
 createWorker(){if(this.worker)return;const epoch=++this.epoch;this.worker=new Worker(G.config.localModel.worker,{type:'module',name:'GeniusMathInference'});
  this.worker.onmessage=({data:m})=>{if(epoch!==this.epoch)return;const p=this.pending.get(m.id);if(!p)return;
   if(m.kind==='check'){this.runtimeChecks.push(m.value);if(this.runtimeChecks.length>50)this.runtimeChecks.shift();window.dispatchEvent(new CustomEvent('genius:runtime-check',{detail:m.value}));return}
   if(m.kind==='metadata'){this.preflight=m.value;window.dispatchEvent(new CustomEvent('genius:runtime-metadata',{detail:m.value}));return}
   if(m.kind==='progress'){this.stage=m.value?.stage||this.stage;if(this.stage==='warming'){clearTimeout(p.timer);p.timer=setTimeout(()=>this.failTimeout(m.id,'El smoke test superó el límite de espera.'),G.config.localModel.smokeTimeoutMs)}this.emit(this.stage==='warming'?'warming':'loading',m.value||{});return}
   clearTimeout(p.timer);this.pending.delete(m.id);if(p.type==='complete'){clearTimeout(this.cancelTimer);this.cancelTimer=null}
   if(p.cancelled){p.reject(G.util.abortError());return}
   if(m.kind==='error')p.reject(Object.assign(Error(m.error?.message||'Fallo de Worker'),{name:m.error?.name||'Error',stage:m.error?.stage||this.stage,code:m.error?.code||null}));else p.resolve(m.value);
  };
  this.worker.onerror=e=>{const error=Object.assign(Error(e.message||'El navegador bloqueó la carga del Worker.'),{stage:'worker'});this.fail(error)};
  this.worker.onmessageerror=()=>this.fail(Object.assign(Error('No se pudo decodificar un mensaje del Worker.'),{stage:'worker'}));
 }
 failTimeout(id,message){const p=this.pending.get(id);if(!p)return;const error=Object.assign(Error(message),{code:'TIMEOUT',stage:this.stage});this.fail(error)}
 fail(error){this.diagnostic=G.RuntimeDiagnostics.classify(error,error.stage||this.stage);this.lastError=this.diagnostic.cause;this.dispose(error,false);this.emit('error',{message:this.lastError,diagnostic:this.diagnostic});}
 request(type,payload={},timeoutMs=120000){this.createWorker();const id=++this.sequence;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>this.failTimeout(id,'La operación '+type+' superó el límite de espera.'),timeoutMs);this.pending.set(id,{resolve,reject,timer,type,cancelled:false});try{this.worker.postMessage({id,type,...payload})}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e)}})}
 async initialize(profile){
  if(this.initializing||['generating','cancelling'].includes(this.status))throw Error('Genius está ocupado. Espera o cancela la operación actual.');this.initializing=true;this.controller=new AbortController();const ctl=this.controller,start=performance.now();this.diagnostic=null;this.lastError=null;this.runtimeChecks=[];this.stage='capabilities';this.emit('probing');
  try{
   const cap=await this.capabilities({signal:ctl.signal,onCheck:(check,report)=>window.dispatchEvent(new CustomEvent('genius:capability-check',{detail:{check,report}}))});this.lastCapabilities=cap;
   if(!cap.supported){const first=cap.checks.find(x=>x.required&&x.status!=='pass');const diagnostic={code:first.code,cause:first.message,impact:first.impact||'El proveedor local no puede arrancar en este entorno.',remedy:first.remedy,continueWithoutAI:true,stage:'capabilities'};throw Object.assign(Error(diagnostic.cause),{diagnostic})}
   profile=profile||cap.recommendation.profile;const cfg=G.config.profiles[profile];if(!cfg)throw Error('Perfil de modelo desconocido.');const f16=cap.adapter.f16&&cap.worker?.f16!==false,model=f16?cfg.model:cfg.f32;
   if(this.ready&&this.liveInference&&this.model===model){this.emit('ready',{message:'Genius listo en esta sesión.'});return{...this.lastLoad,reuseReadyInstance:true}}
   this.dispose(G.util.abortError(),false);this.controller=ctl;if(ctl.signal.aborted)throw G.util.abortError();this.profile=profile;this.model=model;this.stage='runtime';this.emit('loading',{text:'Preparando runtime y metadatos.'});
   const result=await this.request('init',{model,runtimeURL:G.config.localModel.runtimeURL,runtimeBundled:G.config.localModel.runtimeBundled},G.config.localModel.loadTimeoutMs);
   if(ctl.signal.aborted)throw G.util.abortError();if(result?.liveInference!==true||result?.providerKind!=='local-llm'||result?.smoke?.responseNonEmpty!==true||result?.smoke?.schemaValid!==true||result?.smoke?.encodingValid!==true||result.worker!==true||result.adapterObtained!==true||result.modelId!==model)throw Error('El Worker no devolvió prueba válida de inferencia real.');
   this.ready=true;this.liveInference=true;this.providerKind='local-llm';this.stage='ready';this.lastLoad={...result,runtimeChecks:this.runtimeChecks.slice(),id:G.util.id('load'),pageId:G.RuntimeDiagnostics.pageId,at:new Date().toISOString(),profile,geniusPreparationTimeMs:performance.now()-start,capabilities:cap};void G.RuntimeDiagnostics.save(this.lastLoad);this.emit('ready',{message:'Genius listo. La generación interna fue comprobada.'});return this.lastLoad;
  }catch(e){this.ready=false;this.liveInference=false;this.providerKind='uninitialized';this.diagnostic=G.RuntimeDiagnostics.classify(e,e.stage||this.stage);this.lastError=this.diagnostic.cause;this.dispose(e,false);this.emit(e.name==='AbortError'?'cancelled':'error',{message:this.lastError,diagnostic:this.diagnostic});throw Object.assign(e,{diagnostic:this.diagnostic})}
  finally{this.initializing=false;if(this.controller===ctl)this.controller=null}
 }
 async complete(messages,{schema,signal,temperature,maxTokens}={}){
  if(signal?.aborted)throw G.util.abortError();if(!this.ready||!this.liveInference)throw Error('Activa Genius y completa su comprobación real antes de conversar.');if(['generating','cancelling'].includes(this.status))throw Error('La generación anterior aún no terminó.');
  this.stage='generation';this.emit('generating',{message:'Genius está pensando…'});const abort=()=>this.cancel();signal?.addEventListener('abort',abort,{once:true});
  try{const result=await this.request('complete',{messages,schema,temperature,maxTokens},G.config.localModel.generationTimeoutMs);if(signal?.aborted)throw G.util.abortError();this.lastMetrics={firstTokenMs:result.firstTokenMs,totalGenerationMs:result.totalGenerationMs,tokensPerSecond:result.tokensPerSecond,tokensPerSecondScope:result.tokensPerSecondScope,usage:result.usage,worker:result.worker,model:result.model};return result}
  catch(e){if(e.name!=='AbortError'){this.diagnostic=G.RuntimeDiagnostics.classify(e,e.stage||'generation');if(/GPU|STORAGE|TIMEOUT|MODEL_NOT_LOADED/.test(this.diagnostic.code)){this.fail(e)}else this.emit('generation-error',{message:this.diagnostic.cause,diagnostic:this.diagnostic})}throw e}
  finally{signal?.removeEventListener('abort',abort);if(this.ready){this.stage='ready';this.emit('ready')}}
 }
 cancel(){
  if(this.initializing||['probing','loading','warming'].includes(this.status)){this.controller?.abort();this.dispose(G.util.abortError(),false);this.emit('cancelled',{message:'Preparación cancelada. Poker sigue disponible.'});return}
  const jobs=[...this.pending.values()].filter(p=>p.type==='complete');if(!jobs.length)return;if(this.status==='cancelling')return;
  for(const p of jobs)p.cancelled=true;this.emit('cancelling',{message:'Deteniendo la generación…'});this.worker?.postMessage({id:++this.sequence,type:'interrupt'});
  // Do not advertise ready until the old generation settles. A stuck Worker is terminated.
  this.cancelTimer=setTimeout(()=>{this.dispose(G.util.abortError(),false);this.emit('cancelled',{message:'El Worker no confirmó la detención a tiempo y fue terminado. Prepara Genius de nuevo.'})},G.config.localModel.cancelTimeoutMs);
 }
 async cacheStatus(){if(!this.worker)throw Error('No hay runtime cargado.');return this.request('cache')}
 async clearModelCache(){if(!this.worker)throw Error('Primero prepara el runtime.');if(this.status!=='ready')throw Error('Espera a que termine la operación.');const result=await this.request('deleteCache');this.dispose();return result}
 dispose(error=G.util.abortError(),emit=true){++this.epoch;this.worker?.terminate();this.worker=null;this.ready=false;this.liveInference=false;this.providerKind='uninitialized';clearTimeout(this.cancelTimer);this.cancelTimer=null;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(error)}this.pending.clear();if(emit){this.stage='idle';this.emit('idle')}}
}
G.LocalModelProvider=LocalModelProvider;
})();
