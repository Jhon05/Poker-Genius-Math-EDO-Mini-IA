(()=>{'use strict'; const G=window.GeniusMath;
const STRATEGIES=['explanation','concrete_example','derivation','prerequisite','visual_description','guided_first_step','verification','socratic'];
function profile(q){const m=G.QuestionMetadata[q?.id];if(!m)throw Error('Pregunta sin metadatos pedagógicos');return {...m,questionId:q.id,groupId:q.groupId,topic:q.topic,subtopic:m.concepts[0],formulaGuide:G.FormulaCoach.forQuestion(q),revealPolicy:{revealAnswer:false,maxHelpLevel:3}};}
function skeleton(s){return G.util.clean(s).replace(/-?\d+(?:[.,]\d+)?/g,'#').replace(/variante\s*#/gi,'').toLowerCase();}
function transferInfo(base,q){const a=profile(base),b=profile(q);if(q.id===base.id||b.conceptKey!==a.conceptKey)return null;
 if(skeleton(q.prompt)===skeleton(base.prompt))return null;
 // Variants of the same exercise are not transfer. Graph questions may share the plot but must change the requested decision.
 if(a.family===b.family&&!base.hasGraphic)return null;
 return {sharedConcept:a.conceptKey,baseDecision:a.decision,newDecision:b.decision,reason:a.decision!==b.decision?'Cambia la decisión: '+a.decision+' → '+b.decision:'Contrasta otra propiedad o hipótesis del mismo concepto; no es una sustitución numérica.',selection:'concept-and-structure'};
}
function selectTransfer(base,usedIds=[]){const used=new Set(usedIds);const pool=[...(window.PokerQuestions?.all?.()||[]),...(G.TransferCatalog?.all?.()||[])];let available=pool.filter(q=>!used.has(q.id)&&transferInfo(base,q));if(!available.length)available=pool.filter(q=>transferInfo(base,q));const candidates=available.map(q=>({q,info:transferInfo(base,q)})).filter(x=>x.info);
 candidates.sort((a,b)=>{const s=x=>(x.info.baseDecision!==x.info.newDecision?8:0)+(x.q.hasGraphic!==base.hasGraphic?2:0)+(x.q.sourceType!==base.sourceType?3:0)-Math.abs(x.q.level-base.level);return s(b)-s(a)||a.q.id.localeCompare(b.q.id)});return candidates[0]?.q||null;
}
function intervention(student,previous=[]){const failed=student?.unsuccessfulStrategies||{};const last=previous.at(-1)?.strategy;const alternatives=STRATEGIES.filter(s=>s!==last&&(failed[s]||0)<2);return {prefer:student?.recommendedStrategy||'explanation',mustChange:!!last&&(failed[last]||0)>=2,avoid:Object.keys(failed).filter(s=>failed[s]>=2),alternatives:alternatives.length?alternatives:STRATEGIES.filter(s=>s!==last),formulaAllowed:true,finalAnswerAllowed:false,penalty:0};}
G.PedagogyEngine={profile,selectTransfer,transferInfo,intervention,STRATEGIES,safeSubtopic:q=>profile(q).subtopic};
})();
