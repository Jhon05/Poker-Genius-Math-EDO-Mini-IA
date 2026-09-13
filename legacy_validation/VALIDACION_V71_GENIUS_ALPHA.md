# Validación v7.1 · Genius Math Alpha

## Alcance de esta primera entrega

- Se conserva Poker Math EDO con banco de 500 preguntas y la portada roja integrada.
- Se añade el ciclo pedagógico en intervenciones normales de carta: **Fase 1 Independencia → Fase 2 Genius Math → Fase 3 Transferencia sin IA**.
- La respuesta independiente sigue siendo la única que controla la consecuencia de póker y la nota oficial de esta versión Alpha.
- Genius Math acepta texto libre mediante `GuidedProvider`.
- `ScopeClassifier` distingue consultas relevantes, prerrequisitos, metacognición, conversación casual, fuera de tema, extracción de respuesta y prompt injection.
- Las consultas fuera de tema se redirigen al ejercicio o a un prerrequisito; **penalización = 0**.
- La solución correcta no se entrega al proveedor conversacional; el proveedor trabaja con objetivo, conceptos y pistas autorizadas.
- Se añadió selección automática de transferencia del mismo macrotema, evitando la pregunta base y favoreciendo familia/contexto diferente.
- El transcript detallado se intenta registrar en IndexedDB; el estado SCORM conserva una versión compacta del ciclo actual.
- Se incorporó un perfil Genius Math en el informe HTML.
- `LocalModelProvider` y `GenieWorker.js` quedan preparados pero el modelo local se mantiene deshabilitado en esta etapa.

## Pruebas automáticas realizadas

1. Sintaxis JavaScript de `app.js` y todos los módulos `/genie` mediante `node --check`.
2. Carga lógica de los módulos Genius Math en un entorno aislado y pruebas de clasificación.
3. Confirmación de que una consulta deportiva se clasifica `off_topic` y devuelve `penalty: 0`.
4. Confirmación de que una solicitud de respuesta directa se clasifica `answer_extraction` y no revela la respuesta final.
5. Confirmación de selección de transferencia: ID distinto de la pregunta base y mismo `groupId`.
6. Banco académico: 500 preguntas disponibles.
7. Validación de que todos los recursos declarados en `imsmanifest.xml` existen físicamente.
8. Verificación de que todas las rutas `<script src>` y `<link href>` del `index.html` existen.
9. Parseo XML correcto del manifiesto SCORM 1.2.

## Limitación intencional

Esta v7.1 valida arquitectura, flujo pedagógico, redirección, transferencia y persistencia. Todavía **no integra un LLM local WebGPU**. Esa integración se realizará después de auditar el comportamiento Alpha y comparar perfiles de modelo; así se evita acoplar el juego a un modelo antes de comprobar el motor pedagógico.
