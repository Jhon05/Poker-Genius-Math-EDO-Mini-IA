# Brightspace / SCORM 1.2 — checklist pendiente de ejecución institucional

**Estado: no ejecutado en un Brightspace real durante esta construcción.** Las suites instrumentales no sustituyen estos pasos. Los nombres concretos de menús dependen de la configuración institucional y de la experiencia de Contenido.

## Publicar sin afectar evaluaciones activas

1. Conserva el ZIP de la actividad anterior y sus datos. Crea un módulo o actividad **nueva de prueba** y añade este ZIP como objeto SCORM/xAPI, utilizando el procedimiento de tu institución. El manifiesto está en la raíz y lanza `index.html` como un SCO de SCORM 1.2.
2. No actualices una actividad calificada en uso. Comprueba publicación, acceso, asociación con calificaciones y política de intento en esa copia de prueba.
3. Prueba tanto con vista previa docente como con una cuenta real de estudiante de prueba. La vista previa sin seguimiento no demuestra el comportamiento del alumno.

## Comunicación y estado

| Verificación | Evidencia a registrar | Estado inicial |
|---|---|---|
| Initialize de SCORM 1.2 | API encontrada e inicialización aceptada. | Pendiente |
| Identidad | Nombre/código correctos recibidos del LMS; el chat no los necesita. | Pendiente |
| Inicio | Solo se crea el intento al iniciar la partida; preload no consume hora. | Pendiente |
| Guardado y Commit | Recuperación de banca, tiempo, pregunta y estado tras recargar. | Pendiente |
| Conversación | Resumen/contexto recuperado sin guardar el transcript entero en `suspend_data`. | Pendiente |
| Transferencia | Recargar una transferencia no habilita Genius. | Pendiente |
| Nota | Valor 0.0–5.0 y min/max coherentes; nota confirmada en el libro. | Pendiente |
| Cierre | `lesson_status`, Commit y Finish aceptados; fallos de envío ofrecen reintento. | Pendiente |
| Informe | HTML legible, descargable, conservado en historial y accesible antes de cerrar. | Pendiente |
| Intento único | Tras cerrar y abrir de nuevo, el estudiante no puede comenzar otro. | Pendiente |
| Vista previa/sin tracking | Cierre claro y nuevas pruebas sin notas al LMS. | Pendiente |

No borres almacenamiento ni reutilices la misma cuenta evaluada para forzar intentos. Usa cuentas y actividades de prueba. La seguridad absoluta contra manipular código cliente no es una propiedad de SCORM; para evaluación de alto impacto se requiere control institucional y, si procede, validación de servidor.

## Genius dentro del reproductor

Abre el panel y exporta el diagnóstico **dentro del iframe real**. Revisa origen, `isSecureContext`, disponibilidad de WebGPU, resultado de `requestAdapter()`, Worker del paquete, capacidad GPU en el Worker, IndexedDB transaccional y cuota estimada. El éxito fuera del LMS no asegura el éxito dentro de su reproductor.

No se intenta salir del iframe ni cambiar el reproductor automáticamente: hacerlo podría romper la comunicación SCORM. Una prueba en pestaña independiente solo sirve para comparar entornos; no demuestra envío de nota desde el iframe.

El administrador puede revisar restricciones de contenido, `script-src`, `worker-src`, `connect-src`, importación de módulos, carga/compilación de WASM, red institucional, almacenamiento del origen/partición y restricciones detectables del iframe. **No se prescribe un permiso WebGPU universal ni se pide desactivar CSP.** Solo deben modificarse políticas institucionales con un error reproducible y la aprobación del administrador.

En esta RC siguen externos el runtime JS fijado, bibliotecas WASM y recursos del modelo. Contrasta los orígenes efectivamente solicitados con `EXTERNAL_DEPENDENCIES.md`; el CDN puede introducir dependencias adicionales. Un fallo de carga por sí solo no identifica una directiva CSP concreta.

## Pruebas reales de tutor y recuperación

Preparar → smoke real → pregunta → «dame la fórmula» → «¿por qué?» → «más fácil» → cancelar generación → nueva consulta. Comprueba que mesa, desplazamiento y controles responden. Repite descarga interrumpida y ausencia de red antes de la preparación: debe explicar la causa y permitir continuar sin IA, sin afectar nota.

Preparar → recargar → preparar de nuevo: registra si el runtime detecta caché. Al cambiar de actividad/origen o partición de almacenamiento puede no reutilizarse. No afirmes caché únicamente porque una ejecución fue más rápida.

La disponibilidad o calidad de Genius no cambia la fórmula de nota. Preguntar algo irrelevante, pedir ayuda, no tener GPU o perder la conexión no produce penalización académica.

Referencia oficial consultada: D2L, «Import and manage SCORM», https://community.d2l.com/brightspace/kb/articles/5387-import-and-manage-scorm. Esta referencia describe el flujo general, no certifica la configuración de una institución concreta.
