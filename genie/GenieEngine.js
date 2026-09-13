(()=>{'use strict';const G=window.GeniusMath;const locks=new Set();
async function ask({question,cycle,message,sessionId='',signal}){
 if(cycle.submitted||!['independent','genie'].includes(cycle.phase))throw Error('Genius no está disponible durante la transferencia.');
 if(!String(message).trim()||message.length>G.config.maxMessageChars)throw Error('Consulta vacía o demasiado extensa.');
 const key=cycle.learning.genie.threadId||`${sessionId}:${question.id}:${cycle.startedAt}`;if(locks.has(key))throw Error('Hay una consulta en curso.');const provider=G.ModelProvider.current();if(!provider.generative||!provider.ready)throw Error('Activa un modelo generativo para conversar. La guía sin IA es solo una referencia.');locks.add(key);
 const g=cycle.learning.genie,evidence=[],context=G.ContextBridge.build({question,cycle,studentMessage:message}),tools=G.ToolRegistry.create({question,cycle,message,evidence});let messages=G.ContextBridge.messages(context,cycle),calls=0,retries=0,loopsPrevented=0,latencies=[],generationMetrics=[],loopMetrics=[];
 try{
  while(true){if(signal?.aborted)throw G.util.abortError();if(cycle.submitted||!['independent','genie'].includes(cycle.phase))throw G.util.abortError();
   const wire=await provider.complete(G.ContextBridge.compact(messages),{schema:G.PromptContract.schema,signal,temperature:.45+retries*.12,maxTokens:G.config.maxOutputTokens});latencies.push(wire.latencyMs??null);generationMetrics.push({firstTokenMs:wire.firstTokenMs??null,totalGenerationMs:wire.totalGenerationMs??wire.latencyMs??null,tokensPerSecond:wire.tokensPerSecond??null,usage:wire.usage??null,worker:wire.worker===true});let response;
   try{response=G.PromptContract.parse(wire.content)}catch(e){if(retries++>=G.config.maxRegenerations)throw Error('El modelo no produjo una explicación validable. Prueba con otro perfil.');messages.push({role:'user',content:'La salida anterior no cumplió el esquema JSON. Devuelve todos los campos requeridos y una explicación breve, sin razonamiento privado.'});continue}
   if(response.action==='tool'){
    if(calls>=G.config.maxToolRounds){if(retries++>=G.config.maxRegenerations)throw Error('El modelo no terminó su explicación.');messages.push({role:'user',content:'Termina ahora con action=reply usando los datos ya obtenidos. No más herramientas.'});continue}
    calls++;const result=await tools.run(response.tool,response.args);messages.push({role:'assistant',content:JSON.stringify({action:'tool',tool:response.tool,args:response.args})},{role:'user',content:JSON.stringify({tool_result:response.tool,data:result})});continue;
   }
   const guard=G.OutputGuard.check(response,question,evidence);
   if(!guard.ok){if(retries++>=G.config.maxRegenerations)throw Error('No se pudo validar esta explicación. Puedes cambiar el perfil del tutor o consultar la guía sin IA.');messages.push({role:'user',content:'Corrige la explicación: '+guard.issues.join(' ')+' No muestres estos controles al alumno.'});continue}
   const metrics=await G.LoopDetector.inspect(response,g.turns||[],provider,message,signal);loopMetrics.push(metrics);
   const directive=G.PedagogyEngine.intervention(g.studentModel,g.interventions),forced=(directive.mustChange||(response.needs_new_strategy&&(g.studentModel?.unsuccessfulStrategies?.[g.interventions?.at(-1)?.strategy]||0)>=1))&&response.strategy===g.interventions?.at(-1)?.strategy;
   if(metrics.duplicate||forced){loopsPrevented++;if(retries++>=G.config.maxRegenerations)throw Error('El modelo repitió su explicación. No la publicaré otra vez. Prueba otro perfil o la guía de consulta.');messages.push({role:'user',content:'La explicación repite lo ya tratado. Cambia de estrategia: '+directive.alternatives.join(', ')+'. Aporta un ejemplo distinto o deriva un paso, sin repetir el texto previo.'});continue}
   if(signal?.aborted||cycle.submitted||!['independent','genie'].includes(cycle.phase))throw G.util.abortError();
   g.studentModel=G.StudentModel.update(g.studentModel,response);g.summary=response.summary.slice(0,950);g.loopPrevented=(g.loopPrevented||0)+loopsPrevented;g.interactions=(g.interactions||0)+1;
   g.interventions=[...(g.interventions||[]),{strategy:response.strategy,semantic_key:response.semantic_key.slice(0,180),at:Date.now()}].slice(-10);
   g.providers=G.util.unique([...(g.providers||[]),provider.kind+':'+(provider.model||provider.config?.model||'')]);
   const analytics={provider:provider.kind,providerKind:provider.providerKind||null,liveInference:provider.liveInference===true,generationMetrics,model:provider.model||null,toolCalls:calls,regenerations:retries,loop_prevented:loopsPrevented,loopMetrics,evaluation:evidence.map(e=>({tool:e.tool,status:e.result.status,scope:e.result.scope})),latencies};
   await G.GenieMemory.record({eventType:'generation_metrics',threadId:key,questionId:question.id,analytics});
   return{text:guard.text,classification:response.student_state,helpLevel:Math.min(3,g.interactions),summary:g.summary,semantic_key:response.semantic_key,strategy:response.strategy,analytics,penalty:0};
  }
 }finally{locks.delete(key)}
}
function summarize(turns=[]){return turns.filter(t=>!t.notice).slice(-4).map(t=>`${t.role==='student'?'Consulta':'Explicación'}: ${String(t.text).slice(0,140)}`).join(' | ').slice(0,600)}
G.GenieEngine={ask,summarize};G.engine=G.GenieEngine;
})();
