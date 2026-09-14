(()=>{'use strict'; const G=window.GeniusMath=window.GeniusMath||{};
G.config={version:'7.2.2-safe-audited',productName:'Genius Math',language:'es',provider:'local',
 noPenaltyForOffTopic:true,revealAnswer:false,maxMessageChars:700,maxRecentMessages:2,
 maxToolRounds:0,maxRegenerations:0,maxOutputTokens:128,firstTurnMaxOutputTokens:112,contextCharBudget:2600,safeMode:true,
 localModel:{enabled:true,worker:'genie/GenieWorker.js',runtimeURL:'https://esm.run/@mlc-ai/web-llm@0.2.85',
  profile:'light',loadTimeoutMs:600000,generationTimeoutMs:30000,contextWindowSize:1280,semanticLoopJudge:false,
  requireF16:true,generationCooldownMs:850,hardMaxOutputTokens:144,maxInputChars:3000,maxConsecutiveFailures:2},
 cloud:{enabled:false,endpoint:'',model:'',timeoutMs:90000},
 profiles:{
  light:{label:'Ligero seguro · Qwen3 0.6B',model:'Qwen3-0.6B-q4f16_1-MLC',vramMB:1403.34,downloadEstimateBytes:500000000,downloadEstimate:'aprox. 0,5 GB; estimación, no medición'}
 }};

// Resolve against the package, not the current iframe/benchmark subdirectory.
let scriptURL='http://localhost/genie/config.js';
try{if(typeof document!=='undefined')scriptURL=document.currentScript?.src||new URL('genie/config.js',document.baseURI).href}catch(_){}
G.config.packageRoot=new URL('../',scriptURL).href;
G.config.localModel.worker=new URL('genie/GenieWorker.js',G.config.packageRoot).href;
G.config.localModel.probeWorker=new URL('genie/CapabilityWorker.js',G.config.packageRoot).href;
G.config.localModel.runtimeVersion='0.2.85';
G.config.localModel.runtimeBundled=false;
G.config.localModel.smokeTimeoutMs=30000;
G.config.localModel.cancelTimeoutMs=3500;
G.config.localModel.cacheBackend='indexeddb';
G.config.recommendedDefault=null;

G.util={id:()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${++G.util.counter}`,counter:0,
 clean:s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(),
 clamp:(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),
 unique:xs=>[...new Set((xs||[]).filter(x=>typeof x==='string'&&x.length<240))],
 abortError:()=>new DOMException('Generación cancelada.','AbortError'),
 sleep:ms=>new Promise(r=>setTimeout(r,Math.max(0,Number(ms)||0)))};
})();
