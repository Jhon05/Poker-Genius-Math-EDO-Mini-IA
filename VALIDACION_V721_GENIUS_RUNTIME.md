# Poker Math EDO v7.2.1 — validación del runtime y entrega SCORM RC

**Estado del código y empaquetado:** proyecto completo para prueba controlada, no una selección de archivos sueltos. **Estado de inferencia:** no ejecutada aquí. **Estado Brightspace real:** no ejecutado. **Modelo recomendado por evidencia pedagógica:** ninguno todavía (`recommendedDefault = null`).

La denominación RC conserva esa distinción. No se presenta una prueba estática, un proveedor instrumental, una simulación de almacenamiento ni un ping como inferencia real. El código llama al runtime real cuando se ejecuta en un dispositivo compatible.

## 1. Base y trazabilidad

Se extrajo el ZIP v72 completo y se integraron los archivos de trabajo parciales de la pasada anterior. No se reconstruyó Poker desde cero. `validation/audit_v72/INVENTORY_V72_SHA256.json` inventaría los 146 archivos de la base; `AUDIT_BEFORE_CHANGE.md` conserva la auditoría anterior. `FILE_INVENTORY_V721.json` enumera añadidos y modificaciones y compara los recursos preservados con la base. Los documentos V72 son antecedentes, no evidencia nueva.

El banco de 500 preguntas, imágenes de portada/mesa/emociones/fichas, MathJax existente, calculadora, `poker.js`, `questions.js`, `scorm.js`, `styles.css` y recursos gráficos se contrastan por SHA-256 con el ZIP v72. Se comparan además el evaluador completo `answerCorrect`, reglas de apuesta/rescate y expresión final de nota. No se sustituyen preguntas ni se cambia la nota por disponibilidad de IA, pedir ayuda, solicitar fórmulas o desviarse del tema.

## 2. Qué causaba la experiencia de las capturas

La preparación anterior usaba un `confirm()` nativo, elegía el perfil estándar y terminaba mostrando un resumen genérico que ocultaba el error concreto. Eso impedía distinguir origen no compatible, WebGPU ausente, falta de adaptador, restricciones del Worker, almacenamiento, importación de módulos o acceso al modelo. La cancelación también podía devolver el estado a «listo» antes de que terminara la operación.

**La captura del usuario no permite identificar retrospectivamente qué fallo ocurrió en su equipo.** El defecto comprobado es el recorrido y la pérdida de información diagnóstica; no se atribuye sin evidencia a su GPU, navegador, `file://` o Brightspace.

## 3. Correcciones integradas

**Preparación.** El menú y el botón de cargar desde el chat usan el mismo panel rojo/dorado, sin confirmación nativa local. Hay cierre, foco inicial y restauración, ciclo de Tab, Escape, semántica ARIA, fondo inerte, adaptación móvil, reintento, cancelación y salida sin IA. La preparación desde el menú no crea un intento ni consume la hora. Si se abre durante una partida ya iniciada, no detiene el temporizador existente.

**Diagnóstico.** Se comprueban contexto, protocolo/origen/iframe, `navigator.gpu`, `requestAdapter()`, características/límites, creación y respuesta del Worker, GPU en el Worker, transacción real de IndexedDB y estimaciones de almacenamiento. Los recursos externos se comprueban al autorizar preparación, no se dan por disponibles antes de probarlos. Los errores aportan causa, impacto y remedio. Un `fetch` fallido sin más evidencia no se declara automáticamente un error CORS o CSP.

**Runtime real.** `LocalModelProvider` ejecuta `GenieWorker.js` como módulo, importa la versión fijada de WebLLM, comprueba registro/configuración, carga el modelo y exige una generación interna no vacía y válida antes de declarar `liveInference=true`. Ese smoke no califica al alumno ni garantiza calidad matemática. El indicador de progreso solo usa números comunicados por el runtime; no inventa porcentajes de bytes.

**Cancelación y recuperación.** Las operaciones llevan identificadores/épocas; se descartan respuestas tardías. Una generación cancelada conserva la barrera de espera hasta confirmación; un Worker que no responde se termina y obliga a preparar de nuevo. Se registran timeouts, errores de recurso y fallos de protocolo sin fabricar una respuesta de tutor. La guía es explícitamente **sin IA**, no un LLM de sustitución.

**Conversación y matemática.** Se conserva la arquitectura generativa, contexto mínimo, herramientas y evaluador separados. La memoria tiene historial reciente/resumen, persistencia acotada y manejo no fatal del fallo de IndexedDB. El control antibucles combina duplicación, similitud/n-gramas, estrategia y señales semánticas inciertas; fuerza cambios de enfoque y regeneración limitada. Pedir una fórmula sigue autorizado y no equivale a pedir la opción final. La eficacia semántica debe medirse con modelos reales.

**Cierre local.** Un intento terminado ofrece informe legible, descarga y botón claro para cerrar y volver al menú. La vista segura muestra todas las secciones seguidas, sin ejecutar scripts ni cargar recursos externos; el HTML descargado mantiene su navegación completa. El historial no se elimina. El estudiante LMS sigue bloqueado tras su intento; vista previa y perfiles sin tracking no escriben nota. Se conserva el cierre previo a nuevo intento y el reintento cuando el LMS no confirma Finish.

## 4. Pruebas ejecutadas sobre esta versión

| Suite | Resultado | Alcance |
|---|---:|---|
| Núcleo, herramientas, separación de contexto y álgebra exacta | 2686 / 2686; 0 fallos | Código real con proveedores instrumentales cuando corresponde. |
| Diagnóstico/proveedor/cancelación y puertas de benchmark | 87 / 87; 0 fallos | APIs GPU/Worker/IndexedDB instrumentales explícitas, no hardware real. |
| Integración de Poker en Chromium | 541 / 541; 0 fallos | DOM real inyectado; almacenamiento/API LMS instrumentales. |
| Panel, informes, cierre local, vista previa y estudiante | 64 / 64; 0 fallos | Incluye restauración de estado mediante otra página instrumental. |
| Adaptador SCORM exacto, comunicación y estados | 34 / 34; 0 fallos | API LMS instrumental; no libro de notas institucional. |
| Certificados matemáticos auxiliares nuevos | 24 / 24; 0 fallos | SymPy, EDO/Laplace/sistemas/Cauchy–Euler, no LLM. |
| Revisor humano y servidor local | 17 / 17; 0 fallos | DOM y solicitudes HTTP locales reales; fixture de conversación declarado. |
| Manifiesto, rutas, sintaxis y preservación | 465 de 465; 0 fallos | No certificación SCORM ni validación XSD. |
| Respuestas del banco verificadas independientemente | 158 / 500; 0 discrepancias | Las otras 342 no quedaron certificadas por este script. |
| Certificados simbólicos heredados, reejecutados | 8 | Separados de las 158 respuestas. |
| Expresiones MathJax | 889; 0 errores de sintaxis | Procesar TeX no demuestra verdad matemática. |

La auditoría del banco conserva las agrupaciones de enunciados duplicados detectadas en la base y no las reescribe en una entrega de runtime. El benchmark no sustituye una auditoría completa de las 500 respuestas.

El ensayo de 22 turnos de la suite de integración es **transporte instrumental**, no una conversación de un modelo. Las pruebas antibucles con proveedor de prueba demuestran rutas de control, no comprensión. `WORKER_TEST_RESULTS_V721.json` distingue esas rutas del ping real de navegador: **el ping del Worker también fue bloqueado en este entorno**, por lo que no se declara una ejecución real exitosa del Worker.

## 5. Entorno observado, caché y dependencias

Chromium Headless 144 en Linux rechazó navegar a `http://localhost:8000/` con `ERR_BLOCKED_BY_ADMINISTRATOR`. La interfaz se probó cargando HTML/CSS/JS en un contexto instrumental de origen opaco; el diagnóstico de ese contexto detectó incompatibilidad. No es evidencia de la GPU física del servidor ni del computador del usuario. Las solicitudes HTTP del servidor de prueba desde Python sí pudieron probarse; eso no elimina el bloqueo del navegador.

El intento de descargar el runtime npm para incorporarlo al SCORM falló por resolución de nombres. **El runtime JavaScript continúa externo**, fijado a WebLLM 0.2.85; también son externos WASM, tokenizador/configuración y pesos. La dependencia del CDN no se ocultó ni se reemplazó por un simulador. `EXTERNAL_DEPENDENCIES.md` detalla orígenes, riesgos y el script reproducible para incorporarlo posteriormente cuando la descarga sea posible.

No se ejecutaron inferencia, segunda carga de caché de pesos ni comparación de modelos. Sus JSON tienen `executed=false`, métricas `null` y razones. Un resultado de IndexedDB simulado o un segundo tiempo menor no se convierte en una prueba de caché de modelo.

## 6. Pruebas ejecutables en el dispositivo objetivo

El ZIP incluye `serve_local.bat`/`.py`, instrucciones Windows, `validation/benchmark.html`, casos A=24, B=160 y C=20 conversaciones de 24 turnos, una regresión explícita de fórmula y un formulario de revisión independiente. B requiere A revisada; C requiere B. No se generan puntuaciones pedagógicas automáticamente. Los umbrales de paso son reglas conservadoras declaradas, no una calibración experimental.

El mismo instrumento ejecuta dos preparaciones separadas por recarga, consulta indicadores de caché y registra una prueba de generación/cancelación/recuperación con interacción del hilo principal. Guarda transcripciones, errores y latencias; las medidas no disponibles permanecen nulas. Ni benchmark ni revisión cargan SCORM o modifican notas.

## 7. Uso y pendientes reales

Para Windows, extrae todo el ZIP y ejecuta `serve_local.bat`; usa `http://localhost:8000/`, no `file://`. Para Brightspace, publica una actividad nueva de prueba y sigue `BRIGHTSPACE_TEST_CHECKLIST.md`, con una cuenta real de estudiante además de la vista previa. No sustituyas una evaluación activa ni borres datos para forzar otro intento.

Quedan pendientes, no aprobados: inferencia real en equipos objetivo; calidad matemática/conversacional y selección del modelo; caché fría/caliente; fluidez y cancelación durante inferencia; recuperación en un origen real; permisos/red/almacenamiento del iframe institucional; aceptación efectiva de la nota y cierre en Brightspace. El proyecto y el ZIP están entregados; estas validaciones requieren ejecutarse en esos entornos.

La seguridad cliente tiene límites: los datos incluidos en JavaScript no son secretos absolutos y los controles de salida no garantizan inmunidad a toda extracción. Cloud está desactivado y no se usa para encubrir un fallo local. Las señales de asistencia/transferencia no cambian la fórmula de nota original.

## Evidencia incluida

`TEST_RESULTS_V721_GENIUS_RUNTIME.json` resume resultados. En `validation/` están capacidades, inferencia, benchmark, caché, Worker, conversación, antibucles, matemáticas, SCORM, interfaz, revisor y paquete. `evidence_v721/` contiene capturas reales del panel incompatible y cierre local, no un modelo cargado. `environment/` conserva los registros de bloqueo. `RELEASE_SOURCE_HASHES_V721.json` identifica el código examinado.
