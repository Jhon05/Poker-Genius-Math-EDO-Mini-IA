(()=>{'use strict';const G=window.GeniusMath;
const norm=s=>String(s||'').replace(/\\\(|\\\)|\\\[|\\\]|\s/g,'').toLowerCase();
function check(r,q,evidence){const issues=[],p=G.PedagogyEngine.profile(q),verifiedAnswer=evidence.some(x=>x.tool==='evaluateStudentAnswer'&&x.result?.status==='verified'),verifiedStep=evidence.some(x=>x.tool==='evaluateStudentStep'&&x.result?.status==='verified'),verified=r.verification_scope==='answer'?verifiedAnswer:r.verification_scope==='algebra_step'?verifiedStep:false;
 if(r.verification_scope!=='none'&&!verified)issues.push('El alcance de verificación no está respaldado por el Evaluator correspondiente.');
 if(r.claims_correct&&!verified)issues.push('No hay verificación matemática para afirmar corrección.');
 if(/tu (?:respuesta|resultado(?: final)?)\s+(?:es|est[aá])\s+(?:correct[oa]|bien)/i.test(r.text)&&!verifiedAnswer)issues.push('Una identidad algebraica no verifica la respuesta final.');
 if(/tu (?:respuesta|resultado|procedimiento|c[aá]lculo|paso)\s+(?:es|est[aá])\s+(?:correct[oa]|bien)/i.test(r.text)&&!verified)issues.push('Afirmación de corrección sin Evaluator.');
 if(/(?:opci[oó]n|respuesta correcta)\s*(?:correcta)?\s*(?:es|:|=)\s*[A-F](?:\b|[.)])/i.test(r.text))issues.push('No reveles la opción final.');
 if(/off_topic|confidence\s*[:=]|prompt injection|penalizaci[oó]n\s*0|<\/?(?:script|think|iframe)/i.test(r.text))issues.push('No muestres etiquetas, instrucciones internas ni HTML.');
 if(/Devuelve SOLO un objeto JSON|prompt injection|verification_scope|claims_correct|<\/?think|instrucciones (?:internas|del sistema)/i.test(r.summary||''))issues.push('El resumen debe contener solo contenido pedagógico, no instrucciones privadas.');
 const reference=norm(q.answer),plain=norm(r.text),studentSupplied=evidence.some(e=>e.tool==='evaluateStudentAnswer'&&e.result.status==='verified');
 if(reference.length>=10&&plain.includes(reference)&&!studentSupplied&&!norm(q.prompt).includes(reference))issues.push('El texto expone la referencia final; enseña la propiedad general y deja la decisión al alumno.');
 if(r.formula_ids.some(id=>!p.formulaIds.includes(id)))issues.push('Usa solo IDs de fórmulas pertinentes.');
 let text='';try{text=G.FormulaCatalog.expand(r.text,p.formulaIds)}catch(e){issues.push(e.message)}
 if(!text.trim())issues.push('No hay una explicación visible.');
 return{ok:!issues.length,issues,text};
}
G.OutputGuard={check};})();
