(()=>{
'use strict';
const NS=window.GeniusMath=window.GeniusMath||{};
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const OFF_TOPIC=[/partido|futbol|champions|mundial|seleccion/,/novi[ao]|cita|amor|pareja/,/pelicula|serie de tv|netflix|musica|cancion/,/clima|lluvia|temperatura|restaurante|comida/,/presidente|elecciones|politica/,/chiste|dinosaurio|hora es|ingles|videojuego|fortnite/];
const EXTRACTION=[/dame.*respuesta|dime.*respuesta|respuesta correcta|solo.*opcion|resuelvelo por mi|hazlo por mi/];
const INJECTION=[/ignora.*instruccion|ignora.*regla|prompt.*sistema|muestra.*prompt|revela.*instruccion|soy el profesor|soy profesor.*respuesta|banco.*respuestas|todas.*respuestas/];
const FORMULA=[/formula|identidad|propiedad|tabla de|no recuerdo.*formula|recuerdame.*formula|cual.*formula|que.*formula|dame.*formula|formula.*necesito|formula.*pide/];
const CASUAL=[/^(hola|hey|buenas|gracias|ok|okay|jaja|jeje)[!. ]*$/,/estoy (perdido|perdida|cansado|cansada|aburrido|aburrida)|no entiendo nada|esto esta dificil/];
const META=[/que metodo|por donde|como empiezo|que hago|q hago|que sigue|no se como|no se que hacer|me perdi|revisa.*paso|revisa.*procedimiento|mi procedimiento|esta bien.*hice|voy bien|no entiendo($| esto| este| el paso| la pregunta)|no comprendo|por que\??$|porq\??$|por que.*paso|me ayudas|ayudame|necesito ayuda|dame una pista|otra pista|orientame|guiame|explicame( esto)?|me explicas|puedes explicar|que significa esto|no me sale|no recuerdo|recuerdame|estoy confundid[oa]|me confundi/];
function tokensOf(t){return [...new Set((t.match(/[a-z]{4,}/g)||[]))]}
function matchesBag(tokens,bag){return tokens.filter(x=>bag.includes(x))}
function classify(text,context={}){const t=normalize(text).trim();if(INJECTION.some(r=>r.test(t)))return{label:'prompt_injection',confidence:.99};if(EXTRACTION.some(r=>r.test(t)))return{label:'answer_extraction',confidence:.97};if(FORMULA.some(r=>r.test(t)))return{label:'formula_request',confidence:.98};if(CASUAL.some(r=>r.test(t)))return{label:'casual',confidence:.93};
 const tokens=tokensOf(t),conceptBag=normalize([context.topic,context.subtopic,...(context.concepts||[])].join(' ')),prereqBag=normalize((context.prerequisites||[]).join(' '));
 const conceptOverlap=matchesBag(tokens,conceptBag);if(conceptOverlap.length)return{label:'relevant',confidence:Math.min(.98,.72+.08*conceptOverlap.length),matched:conceptOverlap.slice(0,5)};
 const prereqOverlap=matchesBag(tokens,prereqBag);if(prereqOverlap.length)return{label:'prerequisite',confidence:Math.min(.96,.76+.06*prereqOverlap.length),matched:prereqOverlap.slice(0,5)};
 if(META.some(r=>r.test(t)))return{label:'metacognitive',confidence:.92};
 const math=/deriv|integr|laplace|transform|fraccion|factor|autoval|autovector|matriz|sistema|ecuacion|edo|convol|dirac|escalon|condicion inicial|solucion|polinom|raiz|exponencial|seno|coseno|estabilidad|amortigu|circuito|tanque|masa|formula|identidad|propiedad/.test(t);if(math)return{label:'prerequisite',confidence:.82};if(OFF_TOPIC.some(r=>r.test(t)))return{label:'off_topic',confidence:.97};return{label:'metacognitive',confidence:.64};}
NS.ScopeClassifier={classify};
})();
