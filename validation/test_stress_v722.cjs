/* High-volume deterministic stress audit. No live LLM/WebGPU. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');global.window=global;global.dispatchEvent=()=>{};global.CustomEvent=class{constructor(t,o){this.type=t;this.detail=o?.detail}};global.DOMException=global.DOMException||class DOMException extends Error{};
for(const f of ['bank/base_bank.js','bank/extended_bank.js','questions.js','genie/config.js','genie/FormulaCatalog.js','genie/QuestionMetadata.js','genie/FormulaCoach.js','genie/PedagogyEngine.js','genie/TransferCatalog.js','genie/StudentModel.js','genie/GenieMemory.js','genie/AlgebraVerifier.js','genie/EvaluatorBridge.js','genie/ContextBridge.js','genie/PromptContract.js','genie/ToolRegistry.js','genie/LoopDetector.js','genie/OutputGuard.js','genie/GuidedProvider.js','genie/LocalModelProvider.js','genie/CloudModelProvider.js','genie/ModelProvider.js','genie/GenieEngine.js'])vm.runInThisContext(fs.readFileSync(path.join(ROOT,f),'utf8'),{filename:f});
const G=GeniusMath,Q=PokerQuestions.all(),rows=[];const check=(name,pass,detail={})=>rows.push({name,pass:!!pass,...detail});
// Context fuzz: 500 questions x 20 deterministic conversation shapes.
let contexts=0,budgetViol=0,jsonViol=0,hiddenViol=0,maxChars=0;
const phrases=['¿por qué?','No entiendo','No recuerdo la fórmula','Explícamelo más fácil','Ponme un ejemplo','¿qué hago aquí?','x'.repeat(700),'Tengo una duda con el signo menos y la sustitución.'];
for(const q of Q)for(let k=0;k<20;k++){
 const turns=[];for(let j=0;j<(k%4);j++)turns.push({role:j%2?'assistant':'student',text:(j%2?'Explicación previa sobre el concepto sin respuesta final. ':'Pregunta previa del estudiante. ').repeat(10),strategy:'explanation'});
 const cyc={phase:'genie',learning:{genie:{turns,summary:'Resumen pedagógico. '.repeat(k%12),studentModel:G.StudentModel.create(),interventions:turns.filter(t=>t.role==='assistant').map(t=>({strategy:t.strategy,semantic_key:'previo'}))}}};
 const c=G.ContextBridge.build({question:q,cycle:cyc,studentMessage:phrases[k%phrases.length]});const ms=G.ContextBridge.messages(c,cyc),chars=ms.reduce((a,m)=>a+m.content.length,0);contexts++;maxChars=Math.max(maxChars,chars);if(chars>G.config.contextCharBudget)budgetViol++;
 const dm=ms.find(m=>m.content.startsWith('DATOS DEL EJERCICIO'));try{JSON.parse(dm.content.split('\n').slice(1).join('\n'))}catch{jsonViol++}
 const all=JSON.stringify(c);if(/"(?:answer|solution|explanation|hint|canonicalAnswer|bank)"\s*:/.test(all))hiddenViol++;
}
check('context_fuzz_10000',contexts===10000&&budgetViol===0&&jsonViol===0&&hiddenViol===0,{contexts,maxChars,budget:G.config.contextCharBudget,budgetViol,jsonViol,hiddenViol});
// Transfer stress with many used-pool patterns.
let transferRuns=0,transferFail=0;for(const q of Q)for(let k=0;k<20;k++){const used=Q.filter((_,i)=>(i+k)%7===0).map(x=>x.id);used.push(q.id);const strict=G.PedagogyEngine.selectTransfer(q,used),t=strict||G.PedagogyEngine.selectEmergencyTransfer(q,used);transferRuns++;if(!t||t.id===q.id||(strict?!G.PedagogyEngine.transferInfo(q,t):t.topic!==q.topic))transferFail++;}
check('transfer_stress_10000',transferRuns===10000&&transferFail===0,{transferRuns,transferFail});
// Prompt parser malformed corpus must reject instead of accepting arbitrary prose.
let malformedRejected=0;const malformed=['','hola','{','[]','{"text":"x"}','```json\n{"text":"x"}\n```','<think>abc</think> nada'];for(let i=0;i<1000;i++){const s=malformed[i%malformed.length]+(i%3?'':' garbage');try{G.PromptContract.parse(s)}catch{malformedRejected++}}
check('malformed_protocol_rejected',malformedRejected===1000,{malformedRejected});
// One generated turn must cause exactly one provider inference for every bank question.
let calls=0,oneCallFail=0,askFail=0;const provider={kind:'test-local',providerKind:'local-llm',generative:true,ready:true,liveInference:true,model:'TEST_NOT_LLM',async complete(){calls++;return{content:JSON.stringify({text:'Empecemos por identificar la propiedad o método pertinente y el primer dato que debes sustituir, sin saltar a la respuesta final.',strategy:'guided_first_step',summary:'Se orientó el primer paso.',semantic_key:'primer_paso',claims_correct:false,verification_scope:'none'}),firstTokenMs:1,totalGenerationMs:2,tokensPerSecond:1,worker:false,finishReason:'stop'}},cancel(){}};G.ModelProvider.set(provider);G.GenieMemory.record=async()=>true;
(async()=>{for(const q of Q){const before=calls,cycle={qId:q.id,phase:'genie',submitted:false,startedAt:Date.now(),learning:{genie:{threadId:'stress:'+q.id,turns:[],summary:'',studentModel:G.StudentModel.create(),interventions:[],interactions:0,providers:[]}}};try{const r=await G.GenieEngine.ask({question:q,cycle,message:'No entiendo cómo empezar.',sessionId:'stress'});if(calls-before!==1)oneCallFail++;if(r.penalty!==0||!r.text)askFail++;}catch(e){askFail++;}}
 check('one_inference_per_turn_all_500',calls===500&&oneCallFail===0&&askFail===0,{calls,oneCallFail,askFail});
 // Malformed generation: exactly one inference and deterministic fallback, no retry.
 let badCalls=0,badFail=0;provider.complete=async()=>{badCalls++;return{content:'NO JSON'}};for(const q of Q.slice(0,100)){const before=badCalls,cycle={qId:q.id,phase:'genie',submitted:false,startedAt:Date.now(),learning:{genie:{threadId:'bad:'+q.id,turns:[],summary:'',studentModel:G.StudentModel.create(),interventions:[],interactions:0,providers:[]}}};try{const r=await G.GenieEngine.ask({question:q,cycle,message:'No recuerdo la fórmula.',sessionId:'bad'});if(badCalls-before!==1||!r.analytics.fallbackUsed||!r.text)badFail++;}catch{badFail++}}
 check('protocol_failure_no_retry_100',badCalls===100&&badFail===0,{badCalls,badFail});
 const result={version:G.config.version,kind:'DETERMINISTIC_STRESS_NOT_LIVE_LLM',executed:true,liveInferenceExecuted:false,realBrightspaceExecuted:false,total:rows.length,passed:rows.filter(x=>x.pass).length,failed:rows.filter(x=>!x.pass),results:rows};fs.writeFileSync(path.join(__dirname,'STRESS_AUDIT_V722_RESULTS.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,results:undefined},null,2));if(result.failed.length)process.exitCode=1;
})();
