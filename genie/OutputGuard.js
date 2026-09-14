(()=>{'use strict';const G=window.GeniusMath;
const norm=s=>String(s||'').replace(/\\\(|\\\)|\\\[|\\\]|\s/g,'').toLowerCase();
function formulaIds(text){return[...String(text||'').matchAll(/\[\[formula:([^\]]+)\]\]/g)].map(m=>m[1])}
function check(r,q,evidence=[]){const issues=[],p=G.PedagogyEngine.profile(q),verifiedAnswer=evidence.some(x=>x.tool==='evaluateStudentAnswer'&&x.result?.status==='verified'),verifiedStep=evidence.some(x=>x.tool==='evaluateStudentStep'&&x.result?.status==='verified'),scope=r.verification_scope||'none',verified=scope==='answer'?verifiedAnswer:scope==='algebra_step'?verifiedStep:false,textRaw=String(r.text||''),summary=String(r.summary||'');
 if(scope!=='none'&&!verified)issues.push('El alcance de verificación no está respaldado por el Evaluator correspondiente.');
 if(r.claims_correct===true&&!verified)issues.push('No hay verificación matemática para afirmar corrección.');
 if(/tu (?:respuesta|resultado(?: final)?)\s+(?:es|est[aá])\s+(?:correct[oa]|bien)/i.test(textRaw)&&!verifiedAnswer)issues.push('Una identidad algebraica no verifica la respuesta final.');
 if(/tu (?:respuesta|resultado|procedimiento|c[aá]lculo|paso)\s+(?:es|est[aá])\s+(?:correct[oa]|bien)/i.test(textRaw)&&!verified)issues.push('Afirmación de corrección sin Evaluator.');
 if(/(?:opci[oó]n|respuesta correcta)\s*(?:correcta)?\s*(?:es|:|=)\s*[A-F](?:\b|[.)])/i.test(textRaw))issues.push('No reveles la opción final.');
 if(!verifiedAnswer&&/(?:la\s+)?(?:respuesta|resultado)(?:\s+final|\s+del\s+ejercicio)?\s*(?:es|vale|:|=)/i.test(textRaw))issues.push('No declares directamente la respuesta final del ejercicio.');
 if(/off_topic|confidence\s*[:=]|prompt injection|penalizaci[oó]n\s*0|<\/?(?:script|think|iframe|object|embed|form)/i.test(textRaw))issues.push('No muestres etiquetas, instrucciones internas ni HTML.');
 if(/Devuelve SOLO un objeto JSON|prompt injection|verification_scope|claims_correct|<\/?think|instrucciones (?:internas|del sistema)/i.test(summary))issues.push('El resumen debe contener solo contenido pedagógico, no instrucciones privadas.');
 const ids=formulaIds(textRaw);if(ids.some(id=>!p.formulaIds.includes(id)))issues.push('Usa solo IDs de fórmulas pertinentes.');
 const reference=norm(q.answer),plain=norm(textRaw),studentSupplied=evidence.some(e=>e.tool==='evaluateStudentAnswer'&&e.result?.status==='verified'),promptNorm=norm(q.prompt);
 if(!studentSupplied&&q.type==='mcq'&&reference.length>=2&&plain.includes(reference)&&!promptNorm.includes(reference))issues.push('El texto expone directamente la opción/referencia correcta; enseña la propiedad general y deja la decisión al alumno.');
 if(!studentSupplied&&q.type==='numeric'&&Number.isFinite(Number(q.answer))){const v=String(q.answer).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),assign=new RegExp('(?:respuesta|resultado|valor|coeficiente|entero|\\b[cCkK]\\b)\\s*(?:es|vale|=|:)\\s*'+v+'(?:\\b|$)','i');if(assign.test(textRaw))issues.push('El texto revela el valor numérico final solicitado.');}
 if(textRaw.length>1800)issues.push('La explicación supera el límite visible del modo seguro.');
 let text='';try{text=G.FormulaCatalog.expand(textRaw,p.formulaIds)}catch(e){issues.push(e.message)}
 if(!text.trim())issues.push('No hay una explicación visible.');
 return{ok:!issues.length,issues,text,formulaIds:ids};
}
G.OutputGuard={check,formulaIds};})();
