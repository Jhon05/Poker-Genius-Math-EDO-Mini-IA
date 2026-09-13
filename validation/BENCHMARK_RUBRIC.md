# Protocolo y rúbrica de conversación — v7.2.1

Este instrumento **no contiene respuestas de tutor precargadas**. Los archivos de casos contienen mensajes de estudiantes y referencias a preguntas reales del banco. La ejecución utiliza `LocalModelProvider` y requiere `liveInference=true` establecido después de una generación de comprobación. El benchmark no carga SCORM ni cambia notas.

## Etapas

A: 8 familias reales × 3 perfiles (fuerte, medio y perdido) = 24 conversaciones por candidato. Incluye la secuencia de fórmula y referencias anafóricas. B: 8 × 20 perfiles = 160 conversaciones por finalista. C: 20 conversaciones de 24 turnos con perfiles y familias distribuidos, solo después de aprobar B. La opción REGRESSION reúne la secuencia específica de fórmula en las 8 familias.

Las familias son las definidas en `benchmark_cases.js`, obtenidas del banco suministrado, no una promesa de cobertura de todos los cursos de EDO. No se identificaron preguntas Cauchy–Euler en este banco; esa materia tiene controles simbólicos auxiliares separados, no se inventaron preguntas como si fueran parte de las 500 originales.

## Revisión independiente

Guarda el JSON del benchmark, abre `review.html`, carga el archivo y lee cada transcripción completa. Registra revisor, puntuaciones y observaciones, guarda cada caso y descarga el JSON revisado. Ese archivo se carga en `benchmark.html` para habilitar la siguiente etapa. El formulario no modifica mensajes, errores, modelo ni la declaración de ejecución real. No genera notas automáticamente. Descargar sin guardar el caso actual conserva solo los casos ya guardados.

La revisión en cliente no autentica al revisor ni impide manipular un JSON. El protocolo requiere confianza documental y revisión docente independiente; no es un sistema antifraude ni una certificación. No incluir nombres de alumnos en ejemplos ni notas.

## Diez dimensiones, de 0 a 4

| Clave del JSON | Qué se revisa |
|---|---|
| mathematicalCorrectness | Fórmulas, signos, hipótesis y pasos correctos; la corrección no se decide por seguridad verbal. |
| continuity | Mantiene el ejercicio y el referente de «¿por qué?», «eso», «el paso anterior». |
| intentUnderstanding | Reconoce fórmula/prerrequisito/duda; no toma pedir fórmula como fuera del tema. |
| adaptation | Cambia de enfoque cuando el alumno no entiende; no solo parafrasea. |
| pedagogicalUsefulness | Enseña una idea pertinente y devuelve una decisión realizable sin abandonar al alumno. |
| nonRepetition | Evita bucles y preguntas diagnósticas idénticas sin avance. |
| disclosurePolicy | No revela solución/opción final ni instrucciones privadas; sí permite fórmulas legítimas. |
| naturalness | Español comprensible y humano, sin etiquetas internas ni respuestas de menú. |
| appropriateConciseness | Longitud adecuada; aumenta detalle al pedir formalidad y simplifica cuando corresponde. |
| recovery | Reconoce incertidumbre y se recupera de ambigüedad, error o incomprensión. |

0: ausente, dañino para el objetivo o fallo grave. 1: deficiencias graves persistentes. 2: parcialmente útil con errores o discontinuidades relevantes. 3: adecuado, con defectos menores que no invalidan la ayuda. 4: cumple consistentemente el criterio en esta conversación. Deja `null` cuando no se revisó o falta evidencia; no sustituyas `null` por cero.

## Regla conservadora de paso

Se exige ejecución real completa, modelo y versión coincidentes, todas las conversaciones/turnos, sin errores del runtime, revisión identificada y las diez dimensiones ≥3. **Matemática y política de revelado requieren 4.** Es una regla de aceptación declarada para este piloto, no un umbral calibrado estadísticamente. No demuestra corrección universal.

A aprobada habilita B; B aprobada habilita C. Un archivo cancelado, incompleto, sin inferencia real, de otro modelo o sin revisión suficiente no habilita la siguiente etapa. Un error no se sustituye por un mensaje de guía para hacer pasar el modelo.

## Antibucles y rendimiento

Se registran similitud léxica, solapamiento de n-gramas, estrategia, regeneraciones y un juicio semántico del modelo marcado como incierto. Este último es una señal auxiliar del control, **no** la verdad de la evaluación humana. Después de ayudas equivalentes fallidas se fuerza una estrategia distinta; la eficacia real debe juzgarse en la transcripción.

Se guardan latencia observada por turno y métricas comunicadas por el runtime. El reloj total del turno puede incluir herramientas y varias generaciones. Primer token es primer token del runtime y puede incluir contenido que luego se filtra; no equivale necesariamente al primer texto visible del tutor. No se inventan bytes transferidos, RAM libre ni pico GPU.

## Prueba de caché/Worker

La comparación de caché requiere dos páginas/sesiones distintas, mismo modelo y cuantización. Un arranque frío se acredita solo con un indicador negativo previo. Se registra la segunda observación del runtime; tiempo menor no es prueba suficiente. El contador de solicitudes no equivale a bytes.

El ensayo de cancelación ejecuta una generación real larga, pulsa un control DOM, muestrea el hilo principal, cancela y vuelve a consultar. Su umbral de intervalo máximo menor de 500 ms con muestreo de 50 ms es un control práctico declarado, no un estándar de fluidez ni una medición de FPS. Registra visibilidad de la pestaña. Repite manualmente controles y desplazamiento. Si el texto termina antes de cancelar, la prueba es inconclusa.
