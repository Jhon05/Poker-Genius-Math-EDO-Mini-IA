/* Genius Math v7.2.2 SAFE/AUDITED — real WebLLM inference in a module Worker.
   No fixtures, canned chat replies or grading code. Conservative limits reduce GPU pressure. */
let engine=null,lib=null,appConfig=null,record=null,loadedModel=null,loading=false,generating=false,cancelRequested=false,currentStage='idle',live=false;
const VERSION='7.2.2-safe-audited',RUNTIME_VERSION='0.2.85';
const clock=()=>performance.now();
const nativeFetch=self.fetch.bind(self);
let fetchLog=[],weightPaths=new Set();
let runtimeLimits={hardMaxOutputTokens:160,maxInputChars:4000,contextWindowSize:1280,maxOutputChars:5000,generationWatchdogMs:28000};

function resourceType(url){
 if(/\.wasm(?:\?|$)/.test(url))return'wasm';
 if(/mlc-chat-config\.json/.test(url))return'config';
 if(/ndarray-cache\.json/.test(url))return'manifest';
 if(/tokenizer/.test(url))return'tokenizer';
 if(/\.bin(?:\?|$)/.test(url)||[...weightPaths].some(x=>url.includes(x)))return'weights';
 return'other';
}
self.fetch=async(input,init)=>{
 const url=typeof input==='string'?input:input.url||String(input);
 const row={type:resourceType(url),origin:(()=>{try{return new URL(url,self.location.href).origin}catch(_){return'unknown'}})(),startMs:clock(),status:null};
 fetchLog.push(row);if(fetchLog.length>1500)fetchLog.shift();
 try{const r=await nativeFetch(input,init);row.status=r.status;row.responseHeadersMs=clock()-row.startMs;return r}
 catch(e){row.error=String(e.message||e);throw e}
};
function send(id,kind,value){self.postMessage({id,kind,value})}
function progress(id,stage,text,raw){currentStage=stage;send(id,'progress',{stage,text,progress:typeof raw?.progress==='number'&&Number.isFinite(raw.progress)?raw.progress:null,progressScope:raw?'reported_by_runtime_not_bytes':null,timeElapsed:raw?.timeElapsed??null})}
function check(id,label,status,message,value=null){send(id,'check',{id:({'Runtime JavaScript':'runtime','Configuración / CORS':'modelConfig'})[label]||label,label,status,message,value,required:status==='fail',continueWithoutAI:true})}
const aborted=()=>Object.assign(Error('Generación cancelada.'),{name:'AbortError'});
const coded=(message,code,stage=currentStage)=>Object.assign(Error(message),{code,stage});
function validText(s){return typeof s==='string'&&s.trim().length>0&&!/\uFFFD|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s)}
function totalMessageChars(messages){return (messages||[]).reduce((sum,m)=>sum+String(m?.content??'').length,0)}
function schemaChars(schema){try{return schema?JSON.stringify(schema).length:0}catch(_){return Infinity}}
function parseJSONObject(raw){
 let s=String(raw??'').trim();s=s.replace(/<think>[\s\S]*?<\/think>/gi,'').trim();
 if(s.startsWith('```'))s=s.replace(/^```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'').trim();
 try{return JSON.parse(s)}catch(_){}
 const start=s.indexOf('{');if(start<0)throw coded('Smoke test: respuesta JSON inválida.','SMOKE_JSON_INVALID','warming');
 let depth=0,inStr=false,esc=false;
 for(let i=start;i<s.length;i++){
  const ch=s[i];if(inStr){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')inStr=false;continue}
  if(ch==='"'){inStr=true;continue}
  if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0){return JSON.parse(s.slice(start,i+1))}}
 }
 throw coded('Smoke test: respuesta JSON inválida.','SMOKE_JSON_INVALID','warming');
}
function cleanModelURL(url){const u=new URL(url);if(!/^https?:$/.test(u.protocol))throw Error('El registro contiene un origen de modelo no admitido.');if(u.hostname==='huggingface.co'&&!u.pathname.includes('/resolve/'))u.pathname=u.pathname.replace(/\/$/,'')+'/resolve/main/';else if(!u.pathname.endsWith('/'))u.pathname+='/';return u.href}
async function fetchJSON(url,maxBytes=4*1024*1024){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);
 try{
  const r=await fetch(url,{signal:ctl.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('HTTP '+r.status+' al leer '+resourceType(url));
  if(!r.body)throw Error('El navegador no expuso el cuerpo del recurso de metadatos.');
  const reader=r.body.getReader();let size=0,chunks=[];
  for(;;){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('El archivo de metadatos supera el límite seguro.')}chunks.push(x.value)}
  const bytes=new Uint8Array(size);let at=0;for(const x of chunks){bytes.set(x,at);at+=x.length}
  return{data:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),observedBodyBytes:size};
 }catch(e){if(e.name==='AbortError'&&ctl.signal.aborted)throw coded('Tiempo de espera agotado al leer metadatos del modelo.','TIMEOUT','model_config');throw e}
 finally{clearTimeout(timer)}
}
async function cacheIndicator(){try{if(typeof lib?.hasModelInCache!=='function')return{value:null,reason:'El runtime no expone hasModelInCache.'};return{value:await lib.hasModelInCache(record.model_id,appConfig),reason:null}}catch(e){return{value:null,reason:String(e.message||e)}}}
async function prepareMetadata(m){
 progress(m.id,'runtime','Cargando el runtime JavaScript; todavía no se descargan pesos.');const t=clock();
 const u=new URL(m.runtimeURL,self.location.href);if(!['https:','http:'].includes(u.protocol))throw coded('Origen del runtime no admitido.','RUNTIME_ORIGIN_INVALID','runtime');
 lib=await import(u.href);if(typeof lib.MLCEngine!=='function'||!Array.isArray(lib.prebuiltAppConfig?.model_list))throw coded('El módulo no expone MLCEngine y el registro esperado.','RUNTIME_API_INVALID','runtime');
 check(m.id,'Runtime JavaScript','pass','Importación real completada.',{version:RUNTIME_VERSION,origin:u.origin,bundled:m.runtimeBundled===true});
 appConfig={...lib.prebuiltAppConfig,cacheBackend:'indexeddb'};record=appConfig.model_list.find(x=>x.model_id===m.model);if(!record)throw coded('Modelo no encontrado en el registro real de WebLLM '+RUNTIME_VERSION+'.','MODEL_REGISTRY_MISS','runtime');
 check(m.id,'Registro del modelo','pass','Identificador confirmado en el runtime importado.',{modelId:record.model_id,vramRegistryMB:record.vram_required_MB??null,modelOrigin:new URL(record.model).origin,wasmOrigin:new URL(record.model_lib,self.location.href).origin});
 const a=await navigator.gpu?.requestAdapter();if(!a)throw coded('El Worker no obtuvo adaptador WebGPU.','GPU_ADAPTER_UNAVAILABLE','capabilities');
 for(const f of record.required_features||[])if(!a.features.has(f))throw coded('Falta la característica GPU requerida: '+f,'GPU_FEATURE_MISSING','capabilities');
 if(!a.features.has('shader-f16'))throw coded('El modo seguro requiere shader-f16 para evitar la variante de mayor consumo de memoria.','F16_REQUIRED_SAFE_MODE','capabilities');
 if(record.buffer_size_required_bytes&&a.limits.maxStorageBufferBindingSize<record.buffer_size_required_bytes)throw coded('maxStorageBufferBindingSize es menor que el requerido por el registro.','GPU_LIMIT_TOO_LOW','capabilities');
 const before=await cacheIndicator(),base=cleanModelURL(record.model);let config=null,manifest=null,manifestBytes=null,declaredWeightBytes=null,networkChecks=[];
 if(before.value===true){check(m.id,'Indicador de caché','pass','El runtime detecta tensores en caché. Se comprobará la carga; no garantiza todos los archivos.',before)}
 else{
  progress(m.id,'model_config','Comprobando configuración del modelo y acceso CORS.');
  const result=await fetchJSON(new URL('mlc-chat-config.json',base).href);config=result.data;
  if(!Array.isArray(config.tokenizer_files)||!config.conv_template)throw coded('Configuración del modelo inválida o incompatible.','MODEL_CONFIG_INVALID','model_config');
  check(m.id,'Configuración / CORS','pass','JSON de configuración recibido y leído desde este Worker.',{bodyBytes:result.observedBodyBytes,tokenizerFiles:config.tokenizer_files});
  try{const r=await fetchJSON(new URL('ndarray-cache.json',base).href);manifest=r.data;manifestBytes=r.observedBodyBytes;const rows=manifest.records;if(Array.isArray(rows)){weightPaths=new Set(rows.map(x=>x.dataPath).filter(x=>typeof x==='string'));if(rows.length&&rows.every(x=>Number.isFinite(x.nbytes)))declaredWeightBytes=rows.reduce((s,x)=>s+x.nbytes,0)}check(m.id,'Manifiesto de pesos','pass','Manifiesto accesible. El tamaño declarado NO es descarga medida.',{manifestBodyBytes:manifestBytes,declaredWeightBytes,shards:weightPaths.size})}
  catch(e){check(m.id,'Manifiesto de pesos','warning','No se completó la sonda opcional: '+e.message);networkChecks.push({stage:'manifest',error:e.message})}
  for(const [label,url]of [['Biblioteca WASM',record.model_lib],...(weightPaths.size?[['Servidor de pesos',new URL([...weightPaths][0],base).href]]:[])]){
   const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
   try{const r=await fetch(url,{method:'HEAD',signal:ctl.signal,credentials:'omit',referrerPolicy:'no-referrer'});check(m.id,label,r.ok?'pass':'warning',r.ok?'Servidor accesible por HEAD; el cuerpo aún no se ha descargado.':'HEAD devolvió HTTP '+r.status+'. La carga GET real decidirá compatibilidad.',{httpStatus:r.status,bodyDownloaded:false})}
   catch(e){check(m.id,label,'warning','HEAD no completado: '+e.message+'. La carga real puede dar más información.')}
   finally{clearTimeout(timer)}
  }
 }
 return{runtimeImportAndPreflightMs:clock()-t,cacheBefore:before,declaredWeightBytes,manifestBytes,networkChecks,worker:true,adapterObtained:true,f16:a.features.has('shader-f16'),modelId:m.model,runtime:'@mlc-ai/web-llm@'+RUNTIME_VERSION,vramRegistryMB:record.vram_required_MB??null};
}
async function generate(m){
 const inputChars=totalMessageChars(m.messages);if(inputChars>runtimeLimits.maxInputChars)throw coded('El contexto de la consulta supera el límite seguro ('+inputChars+' caracteres).','INPUT_TOO_LARGE','generation');
 const sc=schemaChars(m.schema);if(sc>2600)throw coded('El esquema de salida supera el límite seguro.','SCHEMA_TOO_LARGE','generation');
 const hard=Math.max(32,Math.min(Number(runtimeLimits.hardMaxOutputTokens)||192,192));
 const maxTokens=Math.max(24,Math.min(Number(m.maxTokens)||128,hard));
 const start=clock();let first=null,content='',usage=null,finishReason=null,interruptSent=false;
 const req={messages:m.messages,model:loadedModel,temperature:m.temperature??.25,top_p:.88,max_tokens:maxTokens,stream:true,stream_options:{include_usage:true},enable_thinking:false};
 if(m.schema)req.response_format={type:'json_object',schema:JSON.stringify(m.schema)};
 let watchdogFired=false;const watchdog=setTimeout(()=>{watchdogFired=true;try{engine.interruptGenerate()}catch(_){}},runtimeLimits.generationWatchdogMs);
 try{const stream=await engine.chat.completions.create(req);
  for await(const chunk of stream){
   if(cancelRequested&&!interruptSent){interruptSent=true;try{engine.interruptGenerate()}catch(_){}}
   const text=chunk.choices?.[0]?.delta?.content;
   if(typeof text==='string'&&text){if(first===null)first=clock()-start;content+=text;if(content.length>runtimeLimits.maxOutputChars){try{engine.interruptGenerate()}catch(_){}throw coded('La salida del modelo superó el límite de seguridad.','OUTPUT_TOO_LARGE','generation')}}
   if(chunk.usage)usage=chunk.usage;if(chunk.choices?.[0]?.finish_reason)finishReason=chunk.choices[0].finish_reason;
  }
 }catch(e){if(watchdogFired)throw coded('La generación superó el límite conservador de tiempo dentro del Worker.','TIMEOUT','generation');throw e}finally{clearTimeout(watchdog)}
 if(watchdogFired)throw coded('La generación superó el límite conservador de tiempo dentro del Worker.','TIMEOUT','generation');
 if(cancelRequested)throw aborted();
 if(!validText(content))throw coded('El modelo no produjo texto utilizable.','EMPTY_GENERATION','generation');
 if(finishReason==='length')throw coded('La salida alcanzó el límite antes de cerrar el protocolo.','PROTOCOL_TRUNCATED','generation');
 const total=clock()-start,nt=usage?.completion_tokens??null;
 return{content,usage,finishReason,latencyMs:total,firstTokenMs:first,totalGenerationMs:total,tokensPerSecond:usage?.extra?.decode_tokens_per_s??(typeof nt==='number'&&total>0?nt/(total/1000):null),tokensPerSecondScope:usage?.extra?.decode_tokens_per_s?'runtime_decode':'end_to_end_including_prefill',peakMemoryBytes:null,measurementUnavailableReason:{peakMemory:'No hay medida portátil de RAM/VRAM pico.',firstToken:first===null?'No llegó ningún fragmento de texto.':null},worker:true,model:loadedModel,inputChars,maxTokens};
}
self.onmessage=async({data:m})=>{
 try{
  if(m.type==='ping'){send(m.id,'result',{worker:true,engineReady:!!engine&&!loading,liveInference:live,version:VERSION});return}
  if(m.type==='interrupt'){cancelRequested=true;try{engine?.interruptGenerate()}catch(_){}send(m.id,'result',{interruptReceived:true,generationStopped:!generating});return}
  if(m.type==='cache'){send(m.id,'result',await cacheIndicator());return}
  if(m.type==='deleteCache'){if(generating||loading)throw coded('El modelo está ocupado.','MODEL_BUSY');if(!lib||!record||typeof lib.deleteModelAllInfoInCache!=='function')throw coded('Primero activa el runtime para identificar su caché.','RUNTIME_NOT_READY');await engine?.unload();engine=null;loadedModel=null;live=false;await lib.deleteModelAllInfoInCache(record.model_id,appConfig);send(m.id,'result',{deletedModel:record.model_id,cacheAfter:await cacheIndicator(),reportsTouched:false});return}
  if(m.type==='init'){
   if(loading||generating)throw coded('El modelo está ocupado.','MODEL_BUSY');loading=true;cancelRequested=false;const start=clock();fetchLog=[];
   runtimeLimits={hardMaxOutputTokens:Math.min(160,Math.max(64,Number(m.hardMaxOutputTokens)||160)),maxInputChars:Math.min(4400,Math.max(2600,Number(m.maxInputChars)||4000)),contextWindowSize:Math.min(1280,Math.max(1024,Number(m.contextWindowSize)||1280)),maxOutputChars:5000,generationWatchdogMs:28000};
   try{
    await engine?.unload();engine=null;loadedModel=null;live=false;const meta=await prepareMetadata(m);send(m.id,'metadata',meta);const fetchStart=fetchLog.length;
    progress(m.id,'initializing','Inicializando motor; el progreso siguiente lo comunica el runtime.');
    engine=new lib.MLCEngine({appConfig,logLevel:'WARN',initProgressCallback:p=>{const text=String(p.text||'');const stage=/compil|pipeline|shader/i.test(text)?'compiling':/fetch|download|load.*param|tensor/i.test(text)?'weights':'initializing';progress(m.id,stage,text||'Preparando recursos del modelo.',p)}});
    const loadStart=clock();await engine.reload(m.model,{context_window_size:runtimeLimits.contextWindowSize});const modelLoadMs=clock()-loadStart;loadedModel=m.model;
    progress(m.id,'warming','Ejecutando una generación breve de comprobación; aún no se declara listo.');
    const smokeSchema={type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false};
    const smoke=await generate({messages:[{role:'system',content:'Tutor breve de EDO en español. Devuelve SOLO JSON {"answer":"..."}. Sin razonamiento interno.'},{role:'user',content:"Clasifica y' + y = 0 en máximo cinco palabras."}],schema:smokeSchema,maxTokens:64,temperature:0});
    let parsed;try{parsed=parseJSONObject(smoke.content)}catch(e){const err=coded('Smoke test: respuesta JSON inválida incluso tras normalización.','SMOKE_JSON_INVALID','warming');err.smokePreview=String(smoke.content||'').replace(/<think>[\s\S]*?<\/think>/gi,'[thinking removed]').slice(0,240);throw err}
    if(!validText(parsed.answer))throw coded('Smoke test: respuesta vacía o codificación inválida.','SMOKE_EMPTY','warming');
    const after=await cacheIndicator(),weightFetches=fetchLog.slice(fetchStart).filter(x=>x.type==='weights'),out={...meta,version:VERSION,providerKind:'local-llm',liveInference:true,modelLoadMs,modelReadyTimeMs:clock()-start,geniusPreparationTimeMs:clock()-start,smoke:{executed:true,responseNonEmpty:true,schemaValid:true,encodingValid:true,answer:parsed.answer,metrics:{firstTokenMs:smoke.firstTokenMs,totalGenerationMs:smoke.totalGenerationMs,tokensPerSecond:smoke.tokensPerSecond}},cacheAfter:after,cacheHit:meta.cacheBefore.value===null?null:meta.cacheBefore.value===true&&weightFetches.length===0,cacheMiss:meta.cacheBefore.value===null?null:meta.cacheBefore.value===false,cacheEvidence:'runtime_tensor_indicator_and_observed_fetch_calls; not a guarantee of offline completeness',runtimeWeightFetchRequests:weightFetches.length,resourceRequests:fetchLog,bytesDownloaded:null,peakMemoryBytes:null,limits:{...runtimeLimits},measurementUnavailableReason:{bytesDownloaded:'No se interceptan cuerpos de pesos; HEAD/content-length no son bytes transferidos. Fetch puede usar caché HTTP.',peakMemory:'La API no expone VRAM libre ni memoria pico portátil.'}};
    live=true;progress(m.id,'ready','Genius listo: generación interna real completada.');send(m.id,'result',out);
   }finally{loading=false}
   return;
  }
  if(m.type==='complete'){
   if(!engine||!loadedModel||loading)throw coded('Modelo no cargado.','MODEL_NOT_LOADED','generation');if(generating)throw coded('Hay otra generación en curso.','MODEL_BUSY','generation');generating=true;cancelRequested=false;currentStage='generation';
   try{send(m.id,'result',await generate(m))}finally{generating=false}
   return;
  }
  if(m.type==='dispose'){await engine?.unload();engine=null;loadedModel=null;live=false;send(m.id,'result',{disposed:true});return}
  throw coded('Solicitud de Worker desconocida.','UNKNOWN_WORKER_REQUEST');
 }catch(e){if(m.type==='init'){try{await engine?.unload()}catch(_){}engine=null;loadedModel=null;live=false}self.postMessage({id:m.id,kind:'error',error:{name:e.name||'Error',message:String(e.message||e),stage:e.stage||currentStage,code:e.code||null}})}
};
