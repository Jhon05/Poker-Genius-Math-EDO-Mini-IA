(()=>{'use strict';const G=window.GeniusMath;const STATES=['unknown','understands','forgot_formula','method_unknown','algebra_error','sign_error','concept_error','blocked','lost','partial_answer','verifying','asks_solution','off_topic'];
function create(){return{state:'unknown',confidence:0,observations:0,concepts:[],formulas:[],errors:[],examples:[],unsuccessfulStrategies:{},recommendedStrategy:'explanation',evidence:[]};}
function update(old,response){const s={...create(),...old};s.state=STATES.includes(response.student_state)?response.student_state:'unknown';s.confidence=G.util.clamp(response.confidence,0,.95);s.observations++;
 s.concepts=G.util.unique([...s.concepts,...response.concepts||[]]).slice(-12);s.formulas=G.util.unique([...s.formulas,...response.formula_ids||[]]).slice(-12);s.errors=G.util.unique([...s.errors,...response.errors||[]]).slice(-8);
 if(response.needs_new_strategy&&s.lastStrategy)s.unsuccessfulStrategies[s.lastStrategy]=(s.unsuccessfulStrategies[s.lastStrategy]||0)+1;
 if(response.strategy==='concrete_example')s.examples=G.util.unique([...(s.examples||[]),response.semantic_key]).slice(-8);s.lastStrategy=response.strategy;s.recommendedStrategy=response.strategy;s.evidence=[...s.evidence,{state:s.state,confidence:s.confidence,at:Date.now()}].slice(-8);return s;}
G.StudentModel={create,update,STATES};})();
