# Validación v7.1.1 · Genius Math Alpha auditada

## Alcance de la revisión

Se ejecutó una auditoría lógica y de persistencia mucho más amplia del ciclo **Fase I → Fase II → Fase III** sobre el banco completo de Ecuaciones Diferenciales de tercer corte.

### Cobertura principal

- Banco: **500 preguntas** (458 normales y 42 avanzadas).
- Simulaciones completas del ciclo pedagógico: **50,000**.
- Selecciones de transferencia auditadas: **22,900**.
- Respuestas simuladas del `GuidedProvider`: **3,206**.
- Snapshots de reanudación SCORM I/II/III/completo: **2,000**.
- Mensajes naturales/adversariales de clasificación explícita: **46** patrones representativos.

## Resultados

- **50,000/50,000** ciclos mantuvieron las invariantes I→II→III.
- **0 penalizaciones** por conversación irrelevante o por intentos de extracción; las consultas se redirigen al aprendizaje.
- **458/458** pruebas fuera de tema fueron redirigidas correctamente.
- **22,900/22,900** transferencias conservaron el macrotema y nunca reutilizaron la pregunta base.
- Diferencia de contexto en transferencias: **100.0%**.
- Diferencia de familia en transferencias: **100.0%**.
- **2000/2000** snapshots cupieron en el límite práctico de `suspend_data`; máximo observado: **3703 bytes**.
- **2000/2000** reanudaron en la fase exacta.

## Problemas detectados y corregidos durante esta auditoría

1. **Metadatos que podían insinuar la respuesta.** En 6 preguntas de retrato de fase, el campo interno `context` coincidía prácticamente con la respuesta correcta (por ejemplo, “nodo estable”). Ese subtema ya no se entrega al `ContextBridge`, al saludo ni a las pistas cuando se detecta esa coincidencia.
2. **Lenguaje natural muy breve.** Expresiones como “no entiendo”, “¿por qué?”, “ayúdame”, “dame una pista”, “¿voy bien?” o “no me sale” podían clasificarse como fuera de tema. Se amplió el clasificador para tratarlas como metacognitivas y se separó la detección de conceptos de la detección de prerrequisitos.
3. **Agotamiento de preguntas de transferencia.** Si hipotéticamente todas las variantes no usadas de un tema se agotaban, podía cerrarse el ciclo sin Fase III. Ahora existe una reutilización segura dentro del mismo macrotema, excluyendo siempre la pregunta base, de modo que la transferencia sigue disponible.

## Estado de las fases

### Fase I — Independencia
- Genius Math permanece bloqueado.
- La respuesta independiente se evalúa con el evaluador determinista del juego.
- No se revela la corrección antes de la colaboración y la transferencia.

### Fase II — Genius Math
- Acepta texto libre.
- Distingue dudas pertinentes, prerrequisitos, metacognición, conversación casual, irrelevancia, extracción de respuesta y prompt injection.
- Preguntas irrelevantes: **redirección natural, penalización 0**.
- Ayuda graduada limitada a 0–3.
- El contexto entregado no contiene `answer`, `solution`, `explanation`, opciones ocultas ni una solución docente.

### Fase III — Transferencia
- Genius Math se retira.
- La transferencia pertenece al mismo macrotema, es distinta de la pregunta base y favorece contexto/familia diferentes.
- La transferencia sigue siendo diagnóstica en esta Alpha y no altera la nota oficial.

## Persistencia

Se probaron estados guardados en las cuatro posiciones relevantes: `independent`, `genie`, `transfer` y `complete`. Todos los snapshots probados reanudaron en la fase exacta y conservaron la transferencia seleccionada. Los turnos conversacionales se compactan y el resumen se mantiene acotado.

## Limitación que aún requiere prueba real

La auditoría anterior es programática y exhaustiva sobre la lógica del paquete. La ejecución dentro de un navegador Brightspace real todavía debe comprobarse manualmente para validar comportamiento visual, eventos del LMS, descarga del informe y reanudación bajo el contenedor concreto de D2L. El modelo local WebGPU continúa intencionalmente deshabilitado en esta etapa Alpha.
