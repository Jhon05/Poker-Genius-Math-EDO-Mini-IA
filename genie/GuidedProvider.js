/* Explicit non-generative reference mode. Never masquerades as an AI conversation. */
(()=>{'use strict';const G=window.GeniusMath;
G.GuidedProvider={kind:'guided',generative:false,ready:true,
 references(q){const p=G.PedagogyEngine.profile(q);return{title:'Guía de consulta · sin IA',objective:p.objective,prerequisites:p.prerequisites,formulas:p.formulaGuide.records};},
 async complete(){throw Error('La guía de consulta no genera conversación. Activa un modelo para conversar.');},cancel(){}};
})();
