(()=>{
'use strict';
const BANK=window.ECOMAT_EXTENDED;
if(!BANK) throw new Error('No se cargó el Banco EDO Corte 3 de 500 preguntas.');
const SEED='POKER-MATH-EDO-CORTE3-500-2026-2';
const source=BANK.generateBank(SEED);
const bankErrors=typeof BANK.validateBank==='function'?BANK.validateBank(source):[];
if(bankErrors.length)throw new Error(`Banco EDO Corte 3 inválido: ${bankErrors.slice(0,8).join(' | ')}`);
const TOPIC_BY_ID=Object.fromEntries((BANK.TOPICS||[]).map(t=>[t.id,t]));
const GRAPHICS=BANK.GRAPHICS||{};

function promptHtml(text){return String(text||'').replace(/\r?\n/g,'<br>')}
function answerDisplay(q,options){
  if(q?.type==='numeric') return Number(q?.answer?.value);
  if(q?.type==='true_false') return q?.answer?.value?'Verdadero':'Falso';
  const idx=Number(q?.answer?.index);
  return Number.isInteger(idx)&&idx>=0&&idx<options.length?String(options[idx]):String(q?.answer?.display||'');
}
function adapt(q,difficulty){
  const topicMeta=TOPIC_BY_ID[q.topic]||{label:q.topic};
  const isGraphic=Boolean(q.graphic);
  const g=isGraphic?(GRAPHICS[q.graphic]||{}):{};
  const base={
    id:q.id,
    originalId:q.id,
    family:q.family||q.id,
    variant:q.variant||'taller3',
    level:Number(q.level)||1,
    difficulty,
    groupId:q.topic,
    topic:topicMeta.label||q.topicLabel||q.topic,
    sourceTopicId:q.topic,
    sourceDifficulty:difficulty==='rescue'?'hard':'easy',
    sourceGame:'Ecuaciones Diferenciales · Tercer Corte · Banco 500 · Formato ECONOMATICA',
    sourceRef:String(q.source||''),
    sourceType:q.type,
    typeLabel:q.typeLabel||q.type,
    context:String(q.context||''),
    prompt:promptHtml(q.prompt),
    hint:String(q.hint||''),
    solution:String(q.explanation||''),
    explanation:String(q.explanation||''),
    hasGraphic:isGraphic,
    graphicClassification:isGraphic?'con-grafica':'sin-grafica',
    graphicKind:isGraphic?'vectorial-estatica':'ninguna',
    interactiveGraphic:null,
    graphic:q.graphic||null,
    graphicSrc:isGraphic?`assets/tikz/svg/${encodeURIComponent(q.graphic)}.svg`:null,
    graphicTitle:String(g.title||q.graphic||''),
    graphicAlt:String(g.alt||g.title||'Gráfica matemática')
  };
  if(q.type==='numeric'){
    return {...base,type:'numeric',answer:Number(q.answer?.value),tolerance:Number(q.answer?.tolerance)||0};
  }
  let options=[];
  if(q.type==='true_false') options=['Verdadero','Falso'];
  else options=(q.choices||[]).map(String);
  if(!options.length) throw new Error(`${q.id}: pregunta sin opciones adaptables (${q.type}).`);
  const correct=answerDisplay(q,options);
  if(!options.includes(String(correct))) throw new Error(`${q.id}: la respuesta correcta no coincide con las opciones.`);
  return {...base,type:'mcq',answer:String(correct),options};
}

// El banco fuente trae 500 preguntas verificadas. Poker usa niveles 1-2 como retos
// normales y nivel 3 como retos avanzados para subidas y Rescate de Conocimiento.
const normal=source.filter(q=>Number(q.level)<3).map(q=>adapt(q,'normal'));
const rescue=source.filter(q=>Number(q.level)>=3).map(q=>adapt(q,'rescue'));
const allQuestions=[...normal,...rescue];
const byId=new Map(allQuestions.map(q=>[q.id,q]));
if(byId.size!==allQuestions.length)throw new Error('Banco EDO Corte 3 adaptado contiene IDs duplicados.');
if(allQuestions.length!==source.length)throw new Error(`Adaptación EDO Corte 3 incompleta: ${allQuestions.length}/${source.length}.`);
const graphCount=allQuestions.filter(q=>q.hasGraphic).length;
if(graphCount!==source.filter(q=>q.graphic).length)throw new Error('La clasificación de preguntas gráficas se perdió durante la adaptación a Poker Math.');

const topicGroups=(BANK.TOPICS||[]).map(t=>({
  id:t.id,
  label:t.label,
  description:'Ecuaciones Diferenciales · Corte 3',
  normal:[t.id],
  rescue:[t.id]
}));
const validGroups=new Set(topicGroups.map(g=>g.id));
function normalizeGroups(selectedGroups){const arr=(selectedGroups||[]).filter(x=>validGroups.has(x));return arr.length?arr:topicGroups.map(g=>g.id)}
function groupForQuestion(q){return topicGroups.find(g=>g.id===q?.groupId)||null}
function scopedQuestions(difficulty,selectedGroups=[],fallbackRescue=true){const src=difficulty==='rescue'?rescue:normal,selected=new Set(normalizeGroups(selectedGroups));let scoped=src.filter(q=>selected.has(q.groupId));if(difficulty==='rescue'&&!scoped.length&&fallbackRescue)scoped=[...rescue];return scoped}
function get(id){return byId.get(id)||null}
function pick(difficulty,usedIds=[],rng=Math.random,selectedGroups=[]){const src=scopedQuestions(difficulty,selectedGroups),used=new Set(usedIds||[]);let pool=src.filter(q=>!used.has(q.id));if(!pool.length)pool=[...src];if(!pool.length)throw new Error(`No hay preguntas disponibles para ${difficulty}.`);return pool[Math.floor(rng()*pool.length)]}
function countsFor(selectedGroups=[]){return{normal:scopedQuestions('normal',selectedGroups,false).length,rescue:scopedQuestions('rescue',selectedGroups,false).length}}
const uniqueFamilies=new Set(source.map(q=>q.family||q.id)).size;
window.PokerQuestions={
  normal,rescue,all:()=>[...allQuestions],get,pick,topicGroups,countsFor,groupForQuestion,
  counts:{normal:normal.length,rescue:rescue.length,total:allQuestions.length,graphics:graphCount,withoutGraphics:allQuestions.length-graphCount},
  source:{name:'Banco EDO Corte 3 · 500 preguntas · Formato ECONOMATICA',seed:SEED,families:uniqueFamilies,instances:source.length,validationErrors:bankErrors.length,graphics:graphCount,uniqueGraphics:Object.keys(GRAPHICS).length}
};
})();
