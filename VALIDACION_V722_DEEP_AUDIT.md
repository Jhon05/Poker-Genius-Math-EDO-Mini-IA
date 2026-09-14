# Poker Math EDO v7.2.2 — auditoría profunda y modo seguro

## Alcance

Esta pasada auditó el proyecto completo derivado de v7.2.1.2, con énfasis en: seguridad GPU, límites del runtime local, continuidad del ciclo pedagógico, fuga de respuestas, transferencias, contexto del LLM, persistencia SCORM, doble despliegue GitHub/Brightspace, integridad del banco y regresiones del juego.

**No se ejecutó inferencia WebGPU real en este entorno y no se probó un Brightspace institucional real.** Por tanto, esta validación no reemplaza las pruebas objetivo.

## Errores o riesgos encontrados y corregidos

1. **Perfiles inconsistentes/arriesgados.** El código podía recomendar perfiles `standard/advanced` aunque la compilación segura solo debía exponer el ligero. Ahora existe un único perfil: Qwen3 0.6B q4f16.
2. **Ruta f32 de mayor consumo.** Se eliminó como fallback automático. `shader-f16` es requisito duro.
3. **Contexto potencialmente demasiado grande.** Se redujo el presupuesto a 2600 caracteres y la ventana a 1280.
4. **JSON de contexto truncado de forma inválida.** El compactador anterior podía cortar a mitad el JSON de `DATOS DEL EJERCICIO`. Ahora reduce campos estructuralmente y el JSON permanece válido. Se comprobó sobre las 500 preguntas.
5. **Demasiadas inferencias por un solo mensaje.** Se eliminaron rondas generativas de herramientas, regeneraciones y evaluación semántica de bucles mediante otro LLM. Una consulta produce como máximo una inferencia principal.
6. **Salida excesiva.** Se redujo a 112/128 tokens con límite duro de 144.
7. **Ausencia de watchdog interno suficiente.** El Worker interrumpe una generación demasiado larga y el proveedor dispone además de timeout externo.
8. **Modelo retenido en GPU al dejar la pestaña en segundo plano.** Ahora una generación se cancela al ocultar la pestaña y un modelo listo se descarga tras 45 segundos oculto; `pagehide` también libera el runtime cuando es seguro hacerlo.
9. **Conteo duplicado de frustración en StudentModel.** Se evitó observar dos veces el mismo mensaje.
10. **Fórmulas de fallback sin delimitadores MathJax válidos.** Corregido `\\[...\\]`.
11. **Riesgo de fuga de respuesta final.** `OutputGuard` bloquea declaración directa de opción/letra/valor final y afirmaciones de corrección sin Evaluator. Prueba explícita: 500/500 fugas simuladas bloqueadas.
12. **Contexto con campos ocultos.** Se comprobó que `answer`, `solution`, `explanation`, `hint`, `canonicalAnswer` y banco completo no llegan al modelo.
13. **Transferencia aparentemente ausente en algunas familias.** La prueba profunda inicialmente omitía `TransferCatalog`. Cargando el catálogo real de la aplicación, las 500 preguntas tienen una transferencia conceptual/estructural válida. El fallback de emergencia se mantiene solo como protección contra deadlock.
14. **Crecimiento de memoria conversacional.** Transcript local y resumen se acotan; SCORM continúa usando estado compacto.
15. **Listener duplicado en preparación.** Eliminado en la pasada segura.
16. **Pruebas antiguas validaban comportamiento pre-seguridad.** Se actualizaron las suites para exigir un único perfil ligero, f16 y ausencia de segunda inferencia.
17. **Empaquetado dual y `.nojekyll`.** El empaquetador se ajustó para conservar `.nojekyll` junto con el manifiesto SCORM.

## Banco y transferencias

- Preguntas originales: 500.
- IDs únicos: 500.
- Distribución fuente: 125 opción múltiple, 75 V/F, 75 numéricas, 75 afirmaciones, 75 ordenamiento, 75 gráficas.
- Normales: 458; rescate/avanzadas: 42.
- Gráficas referenciadas: 75; recursos presentes.
- Transferencia estricta con el catálogo real: 500/500.
- JSON de contexto válido y dentro del presupuesto: 500/500.
- Fuga directa de respuesta simulada bloqueada: 500/500.

## Límites matemáticos

La estructura y los evaluadores del banco pasan las suites existentes. Sin embargo, la auditoría simbólica independiente heredada certifica desde primeros principios solo una parte del banco (158/500, más certificados simbólicos auxiliares). Esto **no significa que las restantes estén mal**, sino que esta pasada no las vuelve a demostrar independientemente una por una. En preguntas de ordenamiento, la validez estructural tampoco demuestra por sí sola que no exista otra secuencia pedagógicamente equivalente; requiere revisión matemática/humana específica.

## Estado de runtime

La compilación sigue dependiendo de WebLLM 0.2.85 y recursos externos para primera carga. No se empaquetan pesos. La aplicación solo declara `liveInference=true` después de smoke test real válido en el dispositivo objetivo. GuidedProvider se muestra explícitamente como guía sin IA.

## Recomendación de uso

Para esta versión auditada: probar primero GitHub Pages, una consulta breve y un segundo turno solo si el equipo permanece estable. Si reaparece un bloqueo gráfico, detener pruebas locales en ese equipo. Brightspace debe probarse después como actividad nueva de prueba, no reemplazando una evaluación activa.

## Pruebas de estrés deterministas añadidas

Se añadió `validation/test_stress_v722.cjs` (no LLM real):

- 10.000 construcciones de contexto: 0 excesos de presupuesto, 0 JSON inválidos, 0 campos ocultos.
- 10.000 selecciones de transferencia con pools de usados variables: 0 deadlocks.
- 1.000 salidas de protocolo malformadas: 1.000 rechazadas.
- 500 preguntas simuladas con proveedor instrumental: exactamente una inferencia solicitada por turno en 500/500.
- 100 fallos de protocolo simulados: 100/100 usaron fallback determinista sin segunda inferencia.

El benchmark de dispositivo también fue limitado en `safeMode`: solo permite una muestra de 3 conversaciones de etapa A; B/C, regresión extensa y cancelación intensiva quedan bloqueadas en esta compilación para no sostener carga GPU en hardware no validado.
