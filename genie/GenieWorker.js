/* Actual WebLLM inference in a module Worker. No fixtures, canned replies or grading code. */
let engine=null,lib=null,appConfig=null,record=null,loadedModel=null,loading=false,generating=false,cancelRequested=false,currentStage='idle',live=false;
const VERSION='7.2.1.1-rc2',RUNTIME_VERSION='0.2.85';
const clock=()=>performance.now();const nativeFetch=self.fetch.bind(self);let fetchLog=[],weightPaths=new Set();
function resourceType(url){if(/\.wasm(?:\?|$)/.test(url))return'wasm';if(/mlc-chat-config\.json/.test(url))return'config';if(/ndarray-cache\.json/.test(url))return'manifest';if(/tokenizer/.test(url))return'tokenizer';if(/\.bin(?:\?|$)/.test(url)||[...weightPaths].some(x=>url.includes(x)))return'weights';return'other'}
self.fetch=async(input,init)=>{const url=typeof input==='string'?input:input.url||String(input);const row={type:resourceType(url),origin:(()=>{try{return new URL(url,self.location.href).origin}catch(_){return'unknown'}})(),startMs:clock(),status:null};fetchLog.push(row);if(fetchLog.length>1500)fetchLog.shift();try{const r=await nativeFetch(input,init);row.status=r.status;row.responseHeadersMs=clock()-row.startMs;return r}catch(e){row.error=String(e.message||e);throw e}};
function send(id,kind,value){self.postMessage({id,kind,value})}
function progress(id,stage,text,raw){currentStage=stage;send(id,'progress',{stage,text,progress:typeof raw?.progress==='number'&&Number.isFinite(raw.progress)?raw.progress:null,progressScope:raw?'reported_by_runtime_not_bytes':null,timeElapsed:raw?.timeElapsed??null})}
function check(id,label,status,message,value=null){send(id,'check',{id:({'Runtime JavaScript':'runtime','Configuración / CORS':'modelConfig'})[label]||label,label,status,message,value,required:status==='fail',continueWithoutAI:true})}
const aborted=()=>Object.assign(Error('Generación cancelada.'),{name:'AbortError'});
function validText(s){return typeof s==='string'&&s.trim().length>0&&!/\uFFFD|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s)}
function parseJSONObject(raw){let s=String(raw??'').trim();s=s.replace(/<think>[\s\S]*?<\/think>/gi,'').trim();if(s.startsWith('```'))s=s.replace(/^```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'').trim();try{return JSON.parse(s)}catch(_){}const start=s.indexOf('{');if(start<0)throw Error('Smoke test: respuesta JSON inválida.');let depth=0,inStr=false,esc=false;for(let i=start;i<s.length;i++){const ch=s[i];if(inStr){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')inStr=false;continue}if(ch==='"'){inStr=true;continue}if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0){const candidate=s.slice(start,i+1);return JSON.parse(candidate)}}}throw Error('Smoke test: respuesta JSON inválida.')}
function cleanModelURL(url){const u=new URL(url);if(!/^https?:$/.test(u.protocol))throw Error('El registro contiene un origen de modelo no admitido.');if(u.hostname==='huggingface.co'&&!u.pathname.includes('/resolve/'))u.pathname=u.pathname.replace(/\/$/,'')+'/resolve/main/';else if(!u.pathname.endsWith('/'))u.pathname+='/';return u.href}
async function fetchJSON(url,maxBytes=4*1024*1024){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);try{const r=await fetch(url,{signal:ctl.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('HTTP '+r.status+' al leer '+resourceType(url));const reader=r.body.getReader();let size=0,chunks=[];for(;;){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('El archivo de metadatos supera el límite seguro.')}chunks.push(x.value)}const bytes=new Uint8Array(size);let at=0;for(const x of chunks){bytes.set(x,at);at+=x.length}return{data:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),observedBodyBytes:size}}catch(e){if(e.name==='AbortError'&&ctl.signal.aborted)throw Object.assign(Error('Tiempo de espera agotado al leer metadatos del modelo.'),{code:'TIMEOUT',stage:'model_config'});throw e}finally{clearTimeout(timer)}}
async function cacheIndicator(){try{if(typeof lib?.hasModelInCache!=='function')return{value:null,reason:'El runtime no expone hasModelInCache.'};return{value:await lib.hasModelInCache(record.model_id,appConfig),reason:null}}catch(e){return{value:null,reason:String(e.message||e)}}}
async function prepareMetadata(m){
 progress(m.id,'runtime','Cargando el runtime JavaScript; todavía no se descargan pesos.');const t=clock();
 // URL originates only from the fixed application config, never student chat.
 const u=new URL(m.runtimeURL,self.location.href);if(!['https:','http:'].includes(u.protocol))throw Error('Origen del runtime no admitido.');
 lib=await import(u.href);if(typeof lib.MLCEngine!=='function'||!Array.isArray(lib.prebuiltAppConfig?.model_list))throw Error('El módulo no expone MLCEngine y el registro esperado.');
 check(m.id,'Runtime JavaScript','pass','Importación real completada.',{version:RUNTIME_VERSION,origin:u.origin,bundled:m.runtimeBundled===true});
 appConfig={...lib.prebuiltAppConfig,cacheBackend:'indexeddb'};record=appConfig.model_list.find(x=>x.model_id===m.model);if(!record)throw Error('Modelo no encontrado en el registro real de WebLLM '+RUNTIME_VERSION+'.');
 check(m.id,'Registro del modelo','pass','Identificador confirmado en el runtime importado.',{modelId:record.model_id,vramRegistryMB:record.vram_required_MB??null,modelOrigin:new URL(record.model).origin,wasmOrigin:new URL(record.model_lib,self.location.href).origin});
 const a=await navigator.gpu?.requestAdapter();if(!a)throw Error('El Worker no obtuvo adaptador WebGPU.');
 for(const f of record.required_features||[])if(!a.features.has(f))throw Error('Falta la característica GPU requerida: '+f);
 if(record.buffer_size_required_bytes&&a.limits.maxStorageBufferBindingSize<record.buffer_size_required_bytes)throw Error('maxStorageBufferBindingSize es menor que el requerido por el registro.');
 const before=await cacheIndicator(),base=cleanModelURL(record.model);let config=null,manifest=null,manifestBytes=null,declaredWeightBytes=null,networkChecks=[];
 if(before.value===true){check(m.id,'Indicador de caché','pass','El runtime detecta tensores en caché. Se comprobará la carga; no garantiza todos los archivos.',before)}
 else{
  progress(m.id,'model_config','Comprobando configuración del modelo y acceso CORS.');
  const result=await fetchJSON(new URL('mlc-chat-config.json',base).href);config=result.data;
  if(!Array.isArray(config.tokenizer_files)||!config.conv_template)throw Error('Configuración del modelo inválida o incompatible.');check(m.id,'Configuración / CORS','pass','JSON de configuración recibido y leído desde este Worker.',{bodyBytes:result.observedBodyBytes,tokenizerFiles:config.tokenizer_files});
  try{const r=await fetchJSON(new URL('ndarray-cache.json',base).href);manifest=r.data;manifestBytes=r.observedBodyBytes;const rows=manifest.records;if(Array.isArray(rows)){weightPaths=new Set(rows.map(x=>x.dataPath).filter(x=>typeof x==='string'));if(rows.length&&rows.every(x=>Number.isFinite(x.nbytes)))declaredWeightBytes=rows.reduce((s,x)=>s+x.nbytes,0)}check(m.id,'Manifiesto de pesos','pass','Manifiesto accesible. El tamaño declarado NO es descarga medida.',{manifestBodyBytes:manifestBytes,declaredWeightBytes,shards:weightPaths.size})}catch(e){check(m.id,'Manifiesto de pesos','warning','No se completó la sonda opcional: '+e.message);networkChecks.push({stage:'manifest',error:e.message})}
  // HEAD checks avoid accidentally fetching gigabytes. Lack of HEAD support is a warning, not proof of broken GET.
  for(const [label,url]of [['Biblioteca WASM',record.model_lib],...(weightPaths.size?[['Servidor de pesos',new URL([...weightPaths][0],base).href]]:[])]){
   const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(url,{method:'HEAD',signal:ctl.signal,credentials:'omit',referrerPolicy:'no-referrer'});check(m.id,label,r.ok?'pass':'warning',r.ok?'Servidor accesible por HEAD; el cuerpo aún no se ha descargado.':'HEAD devolvió HTTP '+r.status+'. La carga GET real decidirá compatibilidad.',{httpStatus:r.status,bodyDownloaded:false})}catch(e){check(m.id,label,'warning','HEAD no completado: '+e.message+'. La carga real puede dar más información.')}finally{clearTimeout(timer)}
  }
 }
 return{runtimeImportAndPreflightMs:clock()-t,cacheBefore:before,declaredWeightBytes,manifestBytes,networkChecks,worker:true,adapterObtained:true,f16:a.features.has('shader-f16'),modelId:m.model,runtime:'@mlc-ai/web-llm@'+RUNTIME_VERSION,vramRegistryMB:record.vram_required_MB??null};
}
async function generate(m){const start=clock();let first=null,content='',usage=null,finishReason=null;const req={messages:m.messages,model:loadedModel,temperature:m.temperature??.35,top_p:.9,max_tokens:m.maxTokens||850,stream:true,stream_options:{include_usage:true},enable_thinking:false};
 if(m.schema)req.response_format={type:'json_object',schema:JSON.stringify(m.schema)};
 const stream=await engine.chat.completions.create(req);
 for await(const chunk of stream){if(cancelRequested)engine.interruptGenerate();const text=chunk.choices?.[0]?.delta?.content;if(typeof text==='string'&&text){if(first===null)first=clock()-start;content+=text}if(chunk.usage)usage=chunk.usage;if(chunk.choices?.[0]?.finish_reason)finishReason=chunk.choices[0].finish_reason;}
 if(cancelRequested)throw aborted();const total=clock()-start,nt=usage?.completion_tokens??null;return{content,usage,finishReason,latencyMs:total,firstTokenMs:first,totalGenerationMs:total,tokensPerSecond:usage?.extra?.decode_tokens_per_s??(typeof nt==='number'&&total>0?nt/(total/1000):null),tokensPerSecondScope:usage?.extra?.decode_tokens_per_s?'runtime_decode':'end_to_end_including_prefill',peakMemoryBytes:null,measurementUnavailableReason:{peakMemory:'No hay medida portátil de RAM/VRAM pico.',firstToken:first===null?'No llegó ningún fragmento de texto.':null},worker:true,model:loadedModel};}
self.onmessage=async({data:m})=>{
 try{
  if(m.type==='ping'){send(m.id,'result',{worker:true,engineReady:!!engine&&!loading,liveInference:live,version:VERSION});return}
  if(m.type==='interrupt'){cancelRequested=true;engine?.interruptGenerate();send(m.id,'result',{interruptReceived:true,generationStopped:!generating});return}
  if(m.type==='cache'){send(m.id,'result',await cacheIndicator());return}
  if(m.type==='deleteCache'){if(generating||loading)throw Error('El modelo está ocupado.');if(!lib||!record||typeof lib.deleteModelAllInfoInCache!=='function')throw Error('Primero activa el runtime para identificar su caché.');await engine?.unload();engine=null;loadedModel=null;live=false;await lib.deleteModelAllInfoInCache(record.model_id,appConfig);send(m.id,'result',{deletedModel:record.model_id,cacheAfter:await cacheIndicator(),reportsTouched:false});return}
  if(m.type==='init'){
   if(loading||generating)throw Error('El modelo está ocupado.');loading=true;cancelRequested=false;const start=clock();fetchLog=[];
   try{
    await engine?.unload();engine=null;loadedModel=null;live=false;const meta=await prepareMetadata(m);send(m.id,'metadata',meta);const fetchStart=fetchLog.length;
    progress(m.id,'initializing','Inicializando motor; el progreso siguiente lo comunica el runtime.');
    engine=new lib.MLCEngine({appConfig,logLevel:'WARN',initProgressCallback:p=>{const text=String(p.text||'');const stage=/compil|pipeline|shader/i.test(text)?'compiling':/fetch|download|load.*param|tensor/i.test(text)?'weights':'initializing';progress(m.id,stage,text||'Preparando recursos del modelo.',p)}});
    const loadStart=clock();await engine.reload(m.model,{context_window_size:4096});const modelLoadMs=clock()-loadStart;loadedModel=m.model;
    progress(m.id,'warming','Ejecutando una generación de comprobación interna; aún no se declara listo.');
    const smokeSchema={type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false};
    const smoke=await generate({messages:[{role:'system',content:'Tutor breve de EDO en español. Devuelve un objeto JSON con una sola clave answer. No incluyas razonamiento interno.'},{role:'user',content:"Clasifica y' + y = 0. Responde brevemente."}],schema:smokeSchema,maxTokens:180,temperature:0});
    let parsed;try{parsed=parseJSONObject(smoke.content)}catch(e){const err=Error('Smoke test: respuesta JSON inválida incluso tras normalización.');err.code='SMOKE_JSON_INVALID';err.smokePreview=String(smoke.content||'').replace(/<think>[\s\S]*?<\/think>/gi,'[thinking removed]').slice(0,240);throw err}
    if(!validText(parsed.answer))throw Error('Smoke test: respuesta vacía o codificación inválida.');
    const after=await cacheIndicator(),weightFetches=fetchLog.slice(fetchStart).filter(x=>x.type==='weights'),out={...meta,version:VERSION,providerKind:'local-llm',liveInference:true,modelLoadMs,modelReadyTimeMs:clock()-start,geniusPreparationTimeMs:clock()-start,smoke:{executed:true,responseNonEmpty:true,schemaValid:true,encodingValid:true,answer:parsed.answer,metrics:{firstTokenMs:smoke.firstTokenMs,totalGenerationMs:smoke.totalGenerationMs,tokensPerSecond:smoke.tokensPerSecond}},cacheAfter:after,cacheHit:meta.cacheBefore.value===null?null:meta.cacheBefore.value===true&&weightFetches.length===0,cacheMiss:meta.cacheBefore.value===null?null:meta.cacheBefore.value===false,cacheEvidence:'runtime_tensor_indicator_and_observed_fetch_calls; not a guarantee of offline completeness',runtimeWeightFetchRequests:weightFetches.length,resourceRequests:fetchLog,bytesDownloaded:null,peakMemoryBytes:null,measurementUnavailableReason:{bytesDownloaded:'No se interceptan cuerpos de pesos; HEAD/content-length no son bytes transferidos. Fetch puede usar caché HTTP.',peakMemory:'La API no expone VRAM libre ni memoria pico portátil.'}};
    live=true;progress(m.id,'ready','Genius listo: generación interna real completada.');send(m.id,'result',out);
   }finally{loading=false}
   return;
  }
  if(m.type==='complete'){
   if(!engine||!loadedModel||loading)throw Error('Modelo no cargado.');if(generating)throw Error('Hay otra generación en curso.');generating=true;cancelRequested=false;currentStage='generation';
   try{send(m.id,'result',await generate(m))}finally{generating=false}
   return;
  }
  if(m.type==='dispose'){await engine?.unload();engine=null;loadedModel=null;live=false;send(m.id,'result',{disposed:true});return}
  throw Error('Solicitud de Worker desconocida.');
 }catch(e){if(m.type==='init'){try{await engine?.unload()}catch(_){}engine=null;loadedModel=null}self.postMessage({id:m.id,kind:'error',error:{name:e.name||'Error',message:String(e.message||e),stage:currentStage,code:e.code||null}})}
};
