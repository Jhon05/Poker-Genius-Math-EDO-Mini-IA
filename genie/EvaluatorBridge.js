(()=>{'use strict';const G=window.GeniusMath;let adapter=null;
function register(a){adapter=a||null}
function evaluate(q,raw){if(!adapter?.evaluate)throw Error('Evaluator no registrado');return adapter.evaluate(q,raw)}
function evaluateStudentAnswer(q,raw){if(!adapter?.evaluate)return{status:'unknown',reason:'no_evaluator'};const candidate=typeof raw==='number'?String(raw):String(raw||'').trim();if(q.type==='mcq'&&!q.options.includes(candidate))return{status:'unknown',reason:'candidate_not_literal_option'};if(q.type==='numeric'&&!/^[-+]?\d+(?:[.,]\d+)?(?:\s*\/\s*[-+]?\d+(?:[.,]\d+)?)?$/.test(candidate))return{status:'unknown',reason:'unsupported_numeric'};return{status:evaluate(q,candidate)?'verified':'incorrect',scope:'submitted_candidate_only',method:'existing_poker_evaluator',referenceOrigin:'original_bank',canonicalAnswerDisclosed:false};}
G.EvaluatorBridge={register,evaluate,feedback:()=>adapter?.feedback?.()??null,evaluateStudentAnswer,evaluateStudentStep:text=>G.AlgebraVerifier.work(text)};
})();
