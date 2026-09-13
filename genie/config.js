(()=>{'use strict'; const G=window.GeniusMath=window.GeniusMath||{};
G.config={version:'7.2.1.1-rc2',productName:'Genius Math',language:'es',provider:'local',
 noPenaltyForOffTopic:true,revealAnswer:false,maxMessageChars:2400,maxRecentMessages:10,
 maxToolRounds:3,maxRegenerations:2,maxOutputTokens:850,contextCharBudget:10500,
 localModel:{enabled:true,worker:'genie/GenieWorker.js',runtimeURL:'https://esm.run/@mlc-ai/web-llm@0.2.85',
  profile:null,loadTimeoutMs:600000,generationTimeoutMs:120000},
 cloud:{enabled:false,endpoint:'',model:'',timeoutMs:90000},
 profiles:{
  light:{label:'Ligero · Qwen3 0.6B',model:'Qwen3-0.6B-q4f16_1-MLC',f32:'Qwen3-0.6B-q4f32_1-MLC',vramMB:1403.34,vramF32MB:1924.98,downloadEstimateBytes:500000000,downloadEstimate:'aprox. 0,5 GB; estimación, no medición'},
  standard:{label:'Estándar · Qwen3 1.7B',model:'Qwen3-1.7B-q4f16_1-MLC',f32:'Qwen3-1.7B-q4f32_1-MLC',vramMB:2036.66,vramF32MB:2635.44,downloadEstimateBytes:1200000000,downloadEstimate:'aprox. 1,2 GB; estimación, no medición'},
  advanced:{label:'Avanzado · Qwen3 4B',model:'Qwen3-4B-q4f16_1-MLC',f32:'Qwen3-4B-q4f32_1-MLC',vramMB:3431.59,vramF32MB:4327.71,downloadEstimateBytes:2600000000,downloadEstimate:'aprox. 2,6 GB; estimación, no medición'}
 }};

// Resolve against the package, not the current iframe/benchmark subdirectory.
let scriptURL='http://localhost/genie/config.js';
try{if(typeof document!=='undefined')scriptURL=document.currentScript?.src||new URL('genie/config.js',document.baseURI).href}catch(_){}
G.config.packageRoot=new URL('../',scriptURL).href;
G.config.localModel.worker=new URL('genie/GenieWorker.js',G.config.packageRoot).href;
G.config.localModel.probeWorker=new URL('genie/CapabilityWorker.js',G.config.packageRoot).href;
G.config.localModel.runtimeVersion='0.2.85';
G.config.localModel.runtimeBundled=false; // Set only by the reproducible vendoring tool after it writes the actual bundle.
G.config.localModel.smokeTimeoutMs=120000;
G.config.localModel.cancelTimeoutMs=7000;
G.config.localModel.cacheBackend='indexeddb';
G.config.recommendedDefault=null; // Requires completed, independently reviewed target-device benchmark.

G.util={id:()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${++G.util.counter}`,counter:0,
 clean:s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(),
 clamp:(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),
 unique:xs=>[...new Set((xs||[]).filter(x=>typeof x==='string'&&x.length<240))],
 abortError:()=>new DOMException('Generación cancelada.','AbortError')};
})();
