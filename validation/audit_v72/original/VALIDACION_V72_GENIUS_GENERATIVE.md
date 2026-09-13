# VALIDACIÓN V72 — POKER MATH EDO + GENIUS MATH GENERATIVO

**Versión:** 7.2.0-rc1 · **Fecha:** 13 de septiembre de 2026  
**Estado:** proyecto modificado y empaquetable; candidato para pruebas, NO certificación de aceptación pedagógica ni de Brightspace.

## 1. Resultado y límite principal

Se modificó el ZIP suministrado, no se reconstruyó Poker. La ruta principal de Genius contiene llamadas reales a un modelo local mediante WebLLM, un trabajador de inferencia, memoria, herramientas, verificación y controles de respuesta. La generación no se reemplaza por textos de un árbol de intenciones. La guía de fórmulas se identifica expresamente como **sin IA**.

**No se ejecutó inferencia real de ninguno de los modelos en este entorno.** No se pudo descargar el runtime/pesos por restricciones DNS; no hay adaptador GPU y el Chromium administrado bloquea navegación y trabajadores de módulos en la página de pruebas. Por ello no hay resultados medidos de calidad conversacional, velocidad, consumo de memoria o aprendizaje. No se afirma que los tres candidatos cumplan la calidad de un buen profesor.

Los pesos NO están dentro del ZIP. La primera activación necesita conexión, HTTPS o localhost, WebGPU y suficiente memoria. El juego y la guía no necesitan esos pesos. El adaptador remoto existe, pero no hay servidor institucional desplegado ni credenciales incorporadas.

Material recibido: prompt maestro TXT y ZIP v7.1.2. El PDF “Actividad SCORM con Genio IA Pedagógico” mencionado en el prompt no se adjuntó; no se atribuye contenido a ese documento.

## 2. Inspección de la base

La versión de entrada tenía un `GuidedProvider` de respuestas predeterminadas, clasificación de intenciones y un proveedor local desactivado. Las continuaciones breves dependían del enrutamiento por intención; esto explica la repetición estructural observada en el código. No se presenta esa inspección como un benchmark del modelo anterior: no había un modelo generativo activo.

La selección de transferencia dependía de coincidencias temáticas demasiado amplias. La base también permitía múltiples intentos de estudiantes: el texto del prompt y ese comportamiento real no coincidían. Se corrigió el bloqueo para el perfil estudiante LMS; el perfil docente y la práctica local conservan intentos libres.

Los documentos de validaciones anteriores y el clasificador obsoleto quedaron en `legacy_validation/`, fuera de la carga de la aplicación. No se usan sus cifras para validar V72.

## 3. Qué se conserva

El banco original sigue teniendo exactamente **500 preguntas**, con los mismos archivos y claves. Se conservan mesa roja, portada, 41 emociones, fichas, gráficos SVG, calculadora, MathJax local, evaluación original, reglas de Poker y el puente SCORM original. La comprobación SHA-256 está en `validation/PACKAGE_TEST_RESULTS.json`.

La distribución fuente sigue siendo 125 opción múltiple, 75 verdadero/falso, 75 numéricas, 75 afirmaciones, 75 ordenamientos y 75 gráficas. El adaptador del juego representa 425 como selección de opciones y 75 como respuesta numérica. Los ordenamientos siguen siendo selección de un orden presentado; no se añadió una interfaz de arrastre ni un nuevo calificador de todos los órdenes parciales posibles.

Se retienen claves de guardado anteriores para migración. La codificación de preguntas usadas admite tanto el formato disperso anterior como un bitset compacto V72. Los cuatro ID complementarios se añaden al final del índice; no desplazan los ID originales.

## 4. Arquitectura implementada

| Componente | Responsabilidad real |
|---|---|
| `PedagogyEngine` | Metadatos, intervenciones permitidas y selección conceptual de transferencia. No redacta el chat. |
| `GenieEngine` | Ciclo generativo, herramientas, esquema JSON, validación, cancelación y regeneración limitada. |
| `LocalModelProvider` + `GenieWorker` | Activación de un Web Worker, importación real de WebLLM 0.2.85, descarga del modelo y `chat.completions.create`. |
| `CloudModelProvider` | Cliente opcional para un proxy institucional HTTPS, con consentimiento y sin clave privada en el navegador. |
| `GuidedProvider` | Catálogo de consulta sin IA. No simula conversación ni devuelve respuestas de modelo. |
| `ContextBridge` | Pregunta visible, opciones, objetivo, índice de fórmulas, resumen y mensajes recientes. No envía el banco ni las claves ocultas. |
| `EvaluatorBridge` | Calificador original para candidatos de respuesta y verificador independiente para pasos admitidos. |
| `AlgebraVerifier` | Álgebra racional exacta con enteros grandes y límites explícitos. No ejecuta `eval`, no usa muestreo para declarar identidades verdaderas. |
| `ToolRegistry` | Herramientas cerradas, control de fase y de trabajo literal del estudiante. |
| `StudentModel` + `GenieMemory` | Hipótesis pedagógicas inciertas, estrategias, conceptos, errores, resumen y transcript en IndexedDB. |
| `LoopDetector` | Duplicados exactos, similitud léxica y comparación semántica mediante el modelo real cuando esté activo. |
| `OutputGuard` | Alcance de verificación, fórmulas autorizadas, patrones de revelado y etiquetas internas. No es una prueba formal de toda salida. |
| `TutorPanel` + CSS | Panel flotante cerrable, textarea, Enter/Shift+Enter, cancelación, estados y guía. |
| `ReportBridge` | Autonomía, consultas, conceptos, fórmulas, errores y transferencia, sin transcript ni prompt del sistema. |

El proveedor es intercambiable sin reescribir Poker. Los metadatos de las 500 preguntas se documentan en `genie/CONCEPT_INVENTORY.json`. Se agrupan por concepto, familia normalizada, método/decisión, dificultad, prerrequisitos y puntos críticos. Es un enriquecimiento por familias, no 500 respuestas de tutor redactadas a mano.

### Herramientas disponibles

`getCurrentProblem`, `getLearningObjective`, `getRelevantFormula`, `getPrerequisite`, `getMisconceptions`, `evaluateStudentAnswer`, `evaluateStudentStep`, `getAllowedNextStep`, `getWorkedExampleSkeleton`, `selectTransferProblem`, `getConversationSummary`.

El modelo pide una herramienta mediante JSON; el registro ejecuta solo funciones conocidas. El trabajo a verificar tiene que aparecer literalmente en el mensaje del alumno. La comprobación de candidatos finales tiene un presupuesto de dos por pregunta, guardado también en el estado compacto. La herramienta de transferencia no revela el reto futuro.

## 5. Flujo, nota y transferencia

Antes de responder, el estudiante puede resolver solo o abrir Genius. Abrirlo registra `independent_first_attempt=false` y `assisted_before_first_answer=true`, incluso si después no activa un modelo. Es una medida de apertura de ayuda, no prueba de que haya recibido una explicación generativa. La guía y la IA tienen indicadores separados.

Después de la respuesta base se presenta transferencia. No se permite abrir Genius, pedir herramientas ni publicar una generación tardía en esa fase. Cerrar el panel no borra el indicador de ayuda. La fase y el objetivo de transferencia sobreviven a la hidratación del estado probada.

**No se cambia la fórmula oficial de nota.** Pedir ayuda, una fórmula, una explicación elemental o conversar fuera del tema no resta puntos. La transferencia se registra en paralelo y no modifica la banca o la nota.

La selección exige el mismo núcleo conceptual y una decisión o representación distinta, excluyendo la misma pregunta y una simple variante numérica. Diez preguntas no tenían compañero adecuado en el banco; se añadieron **cuatro retos exclusivos de transferencia**, sobre traslación/convergencia y residencia/lavado. El banco base sigue siendo de 500 y la selección tiene cobertura para las 500.

Si se agotan los candidatos nuevos compatibles se admite un reto compatible ya visto, registrando `previouslySeen`. Ese resultado no debe interpretarse como transferencia a un problema completamente nuevo. La pertinencia conceptual de los emparejamientos necesita revisión docente; la coincidencia de metadatos no demuestra equivalencia de dificultad.

## 6. Memoria y continuidad

En IndexedDB se conservan transcript, resumen incremental, conceptos, fórmulas, errores, ejemplos/ideas usadas y estrategias que no funcionaron. El contexto usa diez mensajes recientes como máximo y un resumen breve. No guarda cadena de pensamiento: el resumen pedido al modelo describe solo contenidos enseñados y dudas visibles.

El guardado LMS lleva identificador de conversación, flags, contadores y resumen compacto, no conversaciones completas. Si IndexedDB falla, se conserva una copia local limitada de los seis mensajes más recientes y el resumen; no se promete transcript completo en ese caso. La reapertura sin acceso al mismo IndexedDB reconstruye desde el resumen, no desde todas las intervenciones antiguas.

La prueba de éxito de IndexedDB en un origen real, recarga real y recuperación después de cerrar el navegador queda pendiente. Se comprobó el manejo de su rechazo en origen opaco. La memoria extensa no se sincroniza entre dispositivos mediante SCORM. La conservación histórica de informes sigue dependiendo también del almacenamiento local del proyecto.

## 7. Verificación matemática y revelado

El evaluador generativo no decide la nota. `evaluateStudentAnswer` usa el calificador original del banco; una clave fuente incorrecta seguiría requiriendo corrección independiente. `evaluateStudentStep` acepta identidades racionales y ciertas transformaciones de ecuaciones, con condiciones de dominio explícitas.

Una identidad verificada no valida una EDO, sus condiciones iniciales o todo un procedimiento. El campo interno `verification_scope` diferencia `answer`, `algebra_step` y `none`; no se publica la validación final a partir de una mera verificación algebraica. Funciones o transformaciones fuera del alcance devuelven `unknown`.

Para ecuaciones no proporcionales se pueden encontrar contraejemplos exactos para rechazar una equivalencia. La falta de un contraejemplo no se convierte en una demostración. Por ejemplo, el verificador no declara incorrecto pasar de `x^2=0` a `x=0`: lo considera fuera de su procedimiento de prueba.

Las fórmulas generales se solicitan por herramienta y se insertan desde el catálogo mediante identificadores autorizados. Su visualización no se considera revelado de una opción. Los controles de texto contra revelado y prompt injection son defensas parciales, no garantías de seguridad frente a todo mensaje adversarial. Un modelo todavía puede producir una derivación errónea o una afirmación no detectada por patrones: requiere benchmark real y revisión humana.

## 8. Modelos: candidatos configurados, no ganadores evaluados

WebLLM está fijado a **0.2.85**. Se usan tres presupuestos de parámetros/memoria disponibles en su registro. No se eligieron por un resultado pedagógico que no se ha medido.

| Perfil | Modelo q4f16 | VRAM indicada en el registro, MB | Resultado medido aquí |
|---|---|---:|---|
| Ligero | Qwen3-0.6B-q4f16_1-MLC | 1403.34 | No ejecutado |
| Estándar | Qwen3-1.7B-q4f16_1-MLC | 2036.66 | No ejecutado |
| Avanzado | Qwen3-4B-q4f16_1-MLC | 3431.59 | No ejecutado |

Sin `shader-f16` se selecciona la variante q4f32 del mismo perfil; requiere más memoria según el registro. Los valores de VRAM del registro y los tamaños aproximados mostrados en configuración no son mediciones del proyecto. No hay valores inventados de RAM, velocidad, precisión o tamaño descargado.

El contexto local se limita a 4096 tokens configurados. El recorte actual del cliente es heurístico por caracteres, no un tokenizador exacto: mensajes grandes, esquemas y herramientas pueden excederlo. Si el modelo no produce una respuesta validable en el presupuesto de reintentos, se informa del fallo sin fabricar tutoría. Un modelo pequeño puede fallar con frecuencia; el perfil mayor no garantiza por sí solo corrección.

### Activación y dependencia de red

En el menú inicial, **PREPARAR GENIUS · OPCIONAL** descarga el perfil estándar sin iniciar un intento ni poner en marcha el tiempo. Una segunda pulsación cancela esa preparación. Dentro de una pregunta, **ACTIVAR IA LOCAL** permite elegir otro perfil; una descarga iniciada entonces sí ocurre durante el tiempo de la partida. La importación se realiza desde `https://esm.run/@mlc-ai/web-llm@0.2.85`; WebLLM obtiene sus artefactos compilados y pesos de las ubicaciones de su registro. La caché configurada es IndexedDB. El primer uso no es offline y no se asegura funcionamiento offline tras una recarga si el runtime remoto no está disponible en caché. Para distribución totalmente autocontenida habría que alojar y verificar también runtime, WASM y pesos; esta entrega no los incluye.

Una política CSP, permisos de iframe, filtros de red, almacenamiento restringido o un equipo sin WebGPU pueden impedir la activación. Debe probarse en el reproductor SCORM concreto de la institución; usar una ventana externa cuando el iframe no disponga de los permisos necesarios, conservando la comunicación SCORM.

### Proveedor remoto opcional

En `genie/config.js`, `cloud.enabled`, `cloud.endpoint` y `cloud.model` permiten configurar el servicio. La autenticación y clave del proveedor deben quedar en un servidor institucional, con límites de uso, validación del esquema, protección CSRF y una política CORS restringida. El cliente usa HTTPS, cookies de sesión y consentimiento explícito; las restricciones de cookies de terceros pueden afectar al uso dentro de Brightspace.

El proxy debe aceptar mensajes y `response_format` según el contrato del cliente y devolver `choices[0].message.content` o `content` como JSON textual. Si el proveedor externo utiliza otra API, el proxy debe traducirla. No se suministra un servidor desplegado ni se ha probado un proveedor remoto. El contexto no añade nombre o código del alumno; cualquier dato personal que este escriba voluntariamente sí forma parte de su mensaje.

## 9. Resultados ejecutados

| Batería | Resultado | Alcance |
|---|---:|---|
| Núcleo y álgebra exacta | 2686 / 2686 | Metadatos, 500 selecciones, separación, herramientas, guardas, álgebra; tres pruebas usan proveedores instrumentales claramente identificados. |
| Navegador, integración offline | 541 / 541 | DOM y código reales; almacenamiento local y API LMS son fixtures explícitos. No inferencia. |
| Claves verificadas independientemente con SymPy | 158 / 158 | 75 numéricas y 83 seleccionadas de familias compatibles. Las otras 342 no quedan certificadas. |
| Certificados simbólicos auxiliares | 8 / 8 | Fracciones parciales, conservación/modos de tanques y un PVI de respuesta al escalón/Duhamel. |
| MathJax | 889 expresiones, 0 errores | Compilación de LaTeX, NO corrección matemática. |
| Navegación/Worker real en Chromium administrado | Bloqueado | No se sustituye por una afirmación de funcionamiento real. |
| Inferencia de tres modelos | No ejecutada | Métricas de calidad y recursos quedan `null`. |
| Brightspace real | No ejecutado | Requiere prueba con cuentas y reproductor institucionales. |

El navegador de pruebas ejecutó 500 transiciones respuesta→transferencia y una conversación de transporte de 22 turnos usando un proveedor instrumental, no un modelo. Probó cancelación, descarte de respuesta tardía, borrador, hidratación, cierre del panel, reporte real HTML, bloqueo de intento, reconocimiento de identidad fixture, nota SCORM fixture, preview sin escrituras y pantalla móvil. No hubo errores JavaScript no capturados.

El mayor `suspend_data` de los 500 estados de transición probados fue **2709 bytes**. El estado de estrés con los 504 ID usados, resumen largo y presupuesto de evaluador ocupó **2433 bytes**. Son mediciones de estados concretos, no una garantía de todos los tamaños posibles. El límite preventivo del puente original sigue en 3800 bytes.

La auditoría identificó **13 grupos de enunciados repetidos o variantes de etiqueta** en la fuente. Se documentaron y no se borraron preguntas para maquillar la cobertura. No se certificaron todos los gráficos ni todos los ordenamientos alternativos.

## 10. Antibucles: métrica y evidencia

Se compara cada respuesta con las tres explicaciones recientes. Un duplicado normalizado exacto se rechaza. La similitud léxica usa coseno sobre frecuencias de palabras; no se presenta como similitud semántica. Con modelo activo, se pide además un juicio de equivalencia; se considera duplicado si `equivalent=true` y la similitud estimada es al menos 0.84. Cuando falla ese juicio se usa una alarma léxica de 0.90.

Tras dos dificultades atribuidas a una estrategia se exige cambiarla. Las regeneraciones tienen un máximo de dos. Si no se obtiene una explicación diferente validable, se muestra un error operativo, no otra copia de la misma explicación.

Se probaron duplicado exacto, canal del juez semántico mediante fixture y rechazo→regeneración→cambio de estrategia mediante fixture. Esto demuestra los controles de flujo, no la capacidad semántica del modelo ni la calidad de la estrategia alternativa. El juicio del mismo modelo puede fallar o autoaprobarse; no sustituye la revisión humana independiente.

## 11. Benchmark reproducible de modelos reales

Abrir `validation/benchmark.html` servido desde el proyecto mediante HTTPS o localhost, no con `file://`. Tiene **20 perfiles × 8 familias = 160 conversaciones por modelo**, incluyendo 22 turnos consecutivos. Las entradas son mensajes de estudiantes; no hay salidas de tutor precocinadas. No carga `app.js` ni SCORM y no escribe notas.

La selección inicial es un caso de olvido de fórmula en traslación. Activar un perfil y ejecutar esa selección permite una comprobación pequeña antes del producto cruzado completo. Repetir en los tres perfiles, guardando cada JSON. La ejecución solo acepta una instancia real de `LocalModelProvider`; no acepta `GuidedProvider` ni los proveedores instrumentales de los tests.

Se registran latencias de pared por turno, percentiles 50/95, errores, regeneraciones, herramientas, similitud léxica, estrategias y transcript. La latencia incluye herramientas, guardas y juicio semántico, no solo inferencia. RAM/VRAM y bytes descargados permanecen sin medir si no hay instrumentación externa. Los archivos pueden contener trabajo escrito por estudiantes: no compartirlos sin revisión y autorización.

**Umbrales propuestos antes de declarar aceptación** — son objetivos, no resultados:

- Cero opciones ocultas reveladas, cero penalizaciones y cero validaciones finales sin Evaluator.
- Al menos 95% de intervenciones matemáticamente correctas, juzgadas por revisión independiente y con tolerancia cero a errores graves en fórmulas enseñadas.
- Al menos 90% de seguimientos breves con referente resuelto correctamente.
- Como máximo 5% de reiteraciones sin contenido nuevo, juzgadas semánticamente por una persona; registrar aparte el proxy léxico.
- Cambio de estrategia en el 100% de los casos aplicables después de dos explicaciones fallidas; comprobar que cambia la enseñanza, no solo el nombre de estrategia.
- Medir p50/p95 de latencia en los equipos objetivo y acordar un límite de usabilidad institucional. No se declara un tiempo universal a partir de este contenedor.

Las simulaciones de estudiantes no prueban aprendizaje humano. La mejora entre desempeño base y transferencia necesita además un piloto con estudiantes y consideración de dificultad/exposición previa.

## 12. Prueba en Brightspace

Usar primero un curso/módulo de prueba y una actividad nueva, no reemplazar una evaluación activa con intentos existentes. La documentación de D2L advierte que actualizar un paquete puede afectar todos sus usos.

1. En Contenido, seleccionar un módulo y añadir el ZIP como objeto SCORM/xAPI. En la experiencia clásica: Cargar/Crear → Nuevo objeto SCORM/xAPI. En la nueva experiencia: Agregar existente → Objeto SCORM/xAPI. Los nombres pueden variar por idioma/configuración. Vincular o crear su elemento de calificación y comprobar la escala 0–5.
2. Abrir con un estudiante real de prueba. Verificar nombre/código automáticos y que el modo docente no se le asigne por error. Iniciar, abrir una pregunta y pedir ayuda **antes** de contestar.
3. Activar el modelo, esperar a que la interfaz indique disponibilidad y mantener una conversación de fórmula→“¿por qué?”→“más fácil”→ejemplo. Verificar matemáticamente cada respuesta. Probar también una petición ajena al tema y una petición de respuesta directa, sin variación de nota.
4. Cerrar/reabrir Genius, recargar en la misma pregunta, recuperar borrador/memoria y comprobar banca, tiempo, cartas y contadores. Responder, entrar en transferencia y recargar de nuevo: el tutor debe permanecer inaccesible.
5. Finalizar; revisar informe, historial, descarga permitida por el navegador y calificación/estado en Brightspace. Reabrir como el mismo alumno: no debe poder iniciar otro intento. Comprobar por separado docente Without Tracking/Preview sin escrituras de nota.
6. Repetir en otro dispositivo/origen para identificar los límites del resumen LMS frente al transcript local; probar CSP, WebGPU, red restringida, pérdida de conexión y recuperación de caché.

No se ha comprobado esta secuencia en una cuenta Brightspace real. El bloqueo cliente no es una barrera inviolable contra herramientas de desarrollador o reinicios administrativos del LMS. El banco de un SCORM cliente tampoco constituye un almacén secreto de claves; la separación implementada es frente al contexto del tutor.

## 13. Reproducción de las pruebas automáticas

Desde la carpeta descomprimida:

```sh
node validation/test_core.cjs
python validation/audit_math.py
python validation/test_browser_integration.py
python validation/test_mathjax.py
python validation/test_package.py --original /ruta/al/ZIP_original.zip
```

Requisitos de auditoría: Node.js, Python, SymPy y Playwright; los scripts de navegador usan `/usr/bin/chromium`, que se debe ajustar si la instalación local está en otra ruta. Las versiones observadas aquí fueron Node 22.16 y SymPy 1.14.0. Los módulos productivos no requieren Python ni Node para que el estudiante los use.

`browser_harness.py` declara sus fixtures y usa inyección de DOM porque la navegación estaba bloqueada. Los hooks de inspección privados se añaden solo al texto del script dentro del harness; no están en `app.js` distribuido. La captura `panel_conversation_fixture.png` NO muestra una conversación generada por un modelo.

Los tests de empaquetado revisan XML bien formado, metadatos, rutas, sintaxis JS y conservación de fuentes. No realizan certificación ADL ni validación XSD completa: la base no traía los XSD locales referenciados. El nuevo manifiesto omite referencias XSD locales inexistentes, manteniendo los espacios de nombres y metadatos SCORM 1.2.

## 14. Archivos y riesgos pendientes

El inventario completo creado/modificado/conservado está en `validation/FILE_INVENTORY_V72.json`. Las modificaciones principales están en `app.js`, `index.html`, `imsmanifest.xml`, `genie/`, esta documentación y `validation/`. Las reglas originales verificadas por igualdad textual y los recursos verificados por SHA-256 se enumeran en el resultado de empaquetado.

**Pendientes que impiden afirmar aceptación completa:** inferencia real, comparación pedagógica de modelos, éxito real de IndexedDB, recarga sobre origen institucional, WebGPU en el iframe, servidor cloud, validación Brightspace de identidad/nota/intento y revisión matemática de las 342 claves no auditadas. Además, el verificador no prueba derivaciones generales, el control de revelado es parcial, el recorte del contexto es heurístico y la memoria histórica extensa no se sincroniza por LMS.

## 15. Fuentes técnicas consultadas

Las siguientes fuentes sustentan la integración prevista y las instrucciones, no los resultados de tests del proyecto:

- WebLLM, documentación 0.2.85, uso de Workers y caché IndexedDB: https://webllm.mlc.ai/docs/user/advanced_usage.html
- Registro oficial de modelos y VRAM declarada: https://raw.githubusercontent.com/mlc-ai/web-llm/main/src/config.ts
- Paquete y versión oficial: https://raw.githubusercontent.com/mlc-ai/web-llm/main/package.json
- D2L, importar y gestionar SCORM (documentación consultada el 13/09/2026): https://community.d2l.com/brightspace/kb/articles/5387-import-and-manage-scorm
- D2L, agregar contenido en la nueva experiencia: https://community.d2l.com/brightspace/kb/articles/3681-add-and-organize-learning-materials-in-the-new-content-experience

Los documentos del registro en la rama principal pueden cambiar. Los valores anteriores se transcribieron de la consulta indicada; no son telemetría de una ejecución local.
