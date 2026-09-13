(()=>{'use strict';const G=window.GeniusMath;
function create({question,cycle,message,evidence}){const p=G.PedagogyEngine.profile(question),g=cycle.learning.genie;
 const functions={
  getCurrentProblem:()=>G.ContextBridge.visible(question),
  getLearningObjective:()=>({objective:p.objective,concepts:p.concepts,criticalPoints:p.criticalPoints}),
  getRelevantFormula:args=>{const ids=args.id?[args.id]:p.formulaIds.slice(0,3);return{formulas:ids.filter(id=>p.formulaIds.includes(id)).map(id=>G.FormulaCatalog.get(id)),allowedIds:p.formulaIds}},
  getPrerequisite:()=>({prerequisites:p.prerequisites}),getMisconceptions:()=>({misconceptions:p.misconceptions}),
  evaluateStudentStep:args=>{const w=String(args.work||'');if(!w||!message.includes(w))return{status:'unknown',reason:'not_literal_student_work'};const result=G.EvaluatorBridge.evaluateStudentStep(w);evidence.push({tool:'evaluateStudentStep',result});return result;},
  evaluateStudentAnswer:args=>{const w=String(args.work||'');if(!w||!message.includes(w))return{status:'unknown',reason:'not_literal_student_work'};if((g.answerChecks||0)>=2)return{status:'unknown',reason:'candidate_check_budget',instruction:'Trabaja el procedimiento y deja que el alumno registre su respuesta en el formulario.'};g.answerChecks=(g.answerChecks||0)+1;const result=G.EvaluatorBridge.evaluateStudentAnswer(question,w);evidence.push({tool:'evaluateStudentAnswer',result});return result;},
  getAllowedNextStep:()=>({...G.PedagogyEngine.intervention(g.studentModel,g.interventions),objective:p.objective}),
  getWorkedExampleSkeleton:()=>({concept:p.concepts,formulaIds:p.formulaIds,constraints:'Genera un ejemplo corto con función o representación distinta al ejercicio. No sustituyas todos los datos del ejercicio actual.'}),
  selectTransferProblem:()=>({available:false,reason:'La transferencia se selecciona al enviar la respuesta; se mantiene oculta y sin IA.'}),
  getConversationSummary:()=>({summary:g.summary||'',explained:g.studentModel?.concepts||[],formulas:g.studentModel?.formulas||[],unsuccessfulStrategies:g.studentModel?.unsuccessfulStrategies||{}})
 };
 return{names:Object.keys(functions),run(name,args={}){if(!Object.hasOwn(functions,name))return{status:'denied',reason:'unknown_tool'};if(!['independent','genie'].includes(cycle.phase)||cycle.submitted)return{status:'denied',reason:'phase_closed'};return functions[name](args)}};
}
G.ToolRegistry={create};})();
