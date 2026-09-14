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

function selectEmergencyTransfer(base,usedIds=[]){
 const used=new Set(usedIds),pool=window.PokerQuestions?.all?.()||[];
 const sameTopic=q=>q&&q.id!==base.id&&q.topic===base.topic&&q.difficulty!=='rescue';
 let c=pool.filter(q=>sameTopic(q)&&!used.has(q.id));
 if(!c.length)c=pool.filter(sameTopic);
 c.sort((a,b)=>{const ga=a.groupId===base.groupId?0:1,gb=b.groupId===base.groupId?0:1;return ga-gb||Math.abs((a.level||1)-(base.level||1))-Math.abs((b.level||1)-(base.level||1))||String(a.id).localeCompare(String(b.id))});
 return c[0]||null;
}
function intervention(student,previous=[]){const failed=student?.unsuccessfulStrategies||{};const last=previous.at(-1)?.strategy;const alternatives=STRATEGIES.filter(s=>s!==last&&(failed[s]||0)<2);return {prefer:student?.recommendedStrategy||'explanation',mustChange:!!last&&(failed[last]||0)>=1,avoid:Object.keys(failed).filter(s=>failed[s]>=2),alternatives:alternatives.length?alternatives:STRATEGIES.filter(s=>s!==last),formulaAllowed:true,finalAnswerAllowed:false,penalty:0};}

function safeFallback(q,message='',previousStrategy=''){
 const p=profile(q),f=p.formulaIds.map(id=>G.FormulaCatalog.get(id)).find(Boolean),m=G.util.clean(message).toLowerCase();
 if(f&&/f[oó]rmula|no (?:me )?acuerdo|olvid/.test(m))return`La propiedad que necesitas recordar es \\[${f.latex}\\]. ${f.conditions?f.conditions+' ':''}Ahora identifica en el enunciado qué símbolos corresponden a esa fórmula y aplica solo ese paso.`;
 if(f)return`Cambiemos de enfoque para no repetirnos. Parte de \\[${f.latex}\\] y úsala únicamente para el objetivo: ${p.objective}. Haz primero la sustitución o identificación de datos, sin saltar a la respuesta final.`;
 return`Cambiemos de enfoque para no repetirnos. El objetivo aquí es: ${p.objective}. Identifica primero qué dato del enunciado controla esa decisión y escribe solo el primer paso; después revisamos ese paso.`;
}
G.PedagogyEngine={profile,selectTransfer,selectEmergencyTransfer,transferInfo,intervention,safeFallback,STRATEGIES,safeSubtopic:q=>profile(q).subtopic};
})();
