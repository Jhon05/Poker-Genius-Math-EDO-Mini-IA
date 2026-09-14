(()=>{'use strict';const G=window.GeniusMath;const locks=new Set();
function maybeEvaluateMessage(message){const s=String(message||'').trim();if(!s||s.length>700||!/[=]/.test(s))return null;const r=G.EvaluatorBridge.evaluateStudentStep(s);return r?.status&&r.status!=='unknown'?r:null}
async function ask({question,cycle,message,sessionId='',signal}){
 if(cycle.submitted||!['independent','genie'].includes(cycle.phase))throw Error('Genius no está disponible durante la transferencia.');
 message=String(message||'').trim();if(!message||message.length>G.config.maxMessageChars)throw Error('Consulta vacía o demasiado extensa.');
 const key=cycle.learning.genie.threadId||`${sessionId}:${question.id}:${cycle.startedAt}`;if(locks.has(key))throw Error('Hay una consulta en curso.');
 const provider=G.ModelProvider.current();if(!provider.generative||!provider.ready||(provider.kind==='local'&&provider.liveInference!==true))throw Error('Activa un modelo generativo para conversar. La guía sin IA es solo una referencia.');
 locks.add(key);const g=cycle.learning.genie,evidence=[],generationMetrics=[],loopMetrics=[];let fallbackReason=null;
 try{
  // Learn from the student's latest message before selecting the next teaching strategy.
  g.studentModel=G.StudentModel.observeMessage(g.studentModel,message);
  const pre=maybeEvaluateMessage(message);if(pre)evidence.push({tool:'evaluateStudentStep',result:pre});
  const context=G.ContextBridge.build({question,cycle,studentMessage:message,evaluation:pre});const messages=G.ContextBridge.messages(context,cycle);
  if(signal?.aborted)throw G.util.abortError();
  const maxTokens=g.interactions?G.config.maxOutputTokens:G.config.firstTurnMaxOutputTokens;
  let wire,response,guard;
  try{
   wire=await provider.complete(messages,{schema:G.PromptContract.safeSchema,signal,temperature:.35,maxTokens});
   generationMetrics.push({firstTokenMs:wire.firstTokenMs??null,totalGenerationMs:wire.totalGenerationMs??wire.latencyMs??null,tokensPerSecond:wire.tokensPerSecond??null,usage:wire.usage??null,worker:wire.worker===true,finishReason:wire.finishReason??null});
   response=G.PromptContract.parse(wire.content);guard=G.OutputGuard.check(response,question,evidence);
   if(!guard.ok){fallbackReason='output_guard:'+guard.issues.join('|');response=null;}
  }catch(e){
   if(e.name==='AbortError')throw e;
   // A single failed generation must not trigger a second GPU inference in safe mode.
   fallbackReason='generation_or_protocol:'+String(e.message||e).slice(0,220);response=null;
  }
  if(signal?.aborted||cycle.submitted||!['independent','genie'].includes(cycle.phase))throw G.util.abortError();
  let text,strategy,semanticKey,summary,loop={duplicate:false,method:'not_checked'};
  if(response){
   loop=await G.LoopDetector.inspect(response,g.turns||[],null,message,signal);loopMetrics.push(loop);
   if(loop.duplicate){fallbackReason='loop:'+loop.method;response=null;g.loopPrevented=(g.loopPrevented||0)+1;}
  }
  if(response){
   text=guard.text;strategy=response.strategy;semanticKey=response.semantic_key;summary=response.summary;
  }else{
   strategy=G.PedagogyEngine.intervention(g.studentModel,g.interventions).alternatives?.[0]||'guided_first_step';
   text=G.PedagogyEngine.safeFallback(question,message,g.interventions?.at(-1)?.strategy||'');
   semanticKey='fallback_'+strategy;summary=`Se ofreció una ayuda segura de respaldo sobre ${G.PedagogyEngine.profile(question).objective}.`;
  }
  g.studentModel=G.StudentModel.update(g.studentModel,response||{strategy,semantic_key:semanticKey,text,formula_ids:G.OutputGuard.formulaIds(text),concepts:[],errors:[],confidence:.25},'');
  g.summary=String(summary||'').slice(0,520);g.interactions=(g.interactions||0)+1;g.interventions=[...(g.interventions||[]),{strategy,semantic_key:String(semanticKey||'').slice(0,180),at:Date.now()}].slice(-8);g.providers=G.util.unique([...(g.providers||[]),provider.kind+':'+(provider.model||provider.config?.model||'')]);
  const analytics={provider:provider.kind,providerKind:provider.providerKind||null,liveInference:provider.liveInference===true,generationMetrics,model:provider.model||null,toolCalls:0,regenerations:0,loop_prevented:fallbackReason?.startsWith('loop:')?1:0,loopMetrics,evaluation:evidence.map(e=>({tool:e.tool,status:e.result.status,scope:e.result.scope})),fallbackUsed:!!fallbackReason,fallbackReason};
  await G.GenieMemory.record({eventType:'generation_metrics',threadId:key,questionId:question.id,analytics});
  return{text,classification:g.studentModel.state,helpLevel:Math.min(3,g.interactions),summary:g.summary,semantic_key:semanticKey,strategy,analytics,penalty:0};
 }finally{locks.delete(key)}
}
function summarize(turns=[]){return turns.filter(t=>!t.notice).slice(-3).map(t=>`${t.role==='student'?'Consulta':'Explicación'}: ${String(t.text).slice(0,120)}`).join(' | ').slice(0,420)}
G.GenieEngine={ask,summarize};G.engine=G.GenieEngine;
})();
