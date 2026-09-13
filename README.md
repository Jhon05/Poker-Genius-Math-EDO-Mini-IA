# Despliegue dual de esta entrega

Este mismo proyecto puede probarse de dos maneras: **GitHub Pages (HTTPS, sin LMS)** publicando el contenido extraído, o **Brightspace SCORM 1.2** subiendo el ZIP completo. Consulta `DUAL_DEPLOYMENT_README.md`, `GITHUB_PAGES_TEST_CHECKLIST.md` y `BRIGHTSPACE_TEST_CHECKLIST.md`.

# Poker Math EDO v7.2.1 — Genius Runtime RC

**Paquete completo para pruebas controladas.** Conserva el juego, las 500 preguntas, el adaptador SCORM 1.2 y la nota original. Añade diagnóstico, preparación integrada, comprobación de generación real, cancelación controlada y cierre claro de pruebas locales.

No es una certificación de un modelo ni una validación institucional. En la construcción no se ejecutó inferencia real, caché de pesos ni una sesión en Brightspace. Las pruebas con proveedores o LMS instrumentales están identificadas como tales. `recommendedDefault = null`.

## Empezar en Windows

Extrae **todo** el ZIP en una carpeta. Con Python 3 instalado, ejecuta `serve_local.bat`. Abre `http://localhost:8000/`; no abras `index.html` mediante doble clic. La preparación desde el menú no crea un intento ni inicia la hora. Consulta **LOCAL_TEST_INSTRUCTIONS.md**.

La descarga del runtime JavaScript sigue siendo externa y está fijada a WebLLM 0.2.85. La biblioteca WASM, el tokenizador y los pesos también son externos. **No hay pesos dentro del ZIP.** El intento de incorporar el runtime al paquete falló por resolución de nombres en el entorno de construcción; no se ocultó esta dependencia. Véase **EXTERNAL_DEPENDENCIES.md**.

## Documentos de esta entrega

| Archivo | Contenido |
|---|---|
| `VALIDACION_V721_GENIUS_RUNTIME.md` | Cambios, evidencia, alcance y límites. |
| `TEST_RESULTS_V721_GENIUS_RUNTIME.json` | Resumen automático de las suites y pruebas pendientes. |
| `LOCAL_TEST_INSTRUCTIONS.md` | Preparación, prueba y cierre local en Windows. |
| `BRIGHTSPACE_TEST_CHECKLIST.md` | Publicación y verificación real en el LMS. |
| `MODEL_SELECTION_REPORT.md` | Candidatos; ninguna selección pedagógica declarada sin datos. |
| `validation/BENCHMARK_RUBRIC.md` | Protocolo por etapas y evaluación humana. |
| `validation/benchmark.html` | Ejecución real en el dispositivo objetivo, independiente de las notas. |
| `validation/review.html` | Formulario local para revisar y conservar transcripciones. |
| `validation/*RESULTS*.json` | Resultados detallados, clasificados por tipo de evidencia. |
| `validation/audit_v72/` | Auditoría de la base y evidencia histórica identificada. |

Los archivos que llevan **V72**, `legacy_validation/` y `validation/audit_v72/original/` son antecedentes, no resultados actuales de v7.2.1. Los informes originales se conservaron por trazabilidad.

## Publicación

El `imsmanifest.xml` está en la raíz. Sube el ZIP como **una actividad nueva de prueba**; no sustituyas una evaluación activa. Para el estudiante LMS se conserva un solo intento. Las prácticas locales, la vista previa y los perfiles sin seguimiento permiten cerrar un intento conservando su informe y volver al menú.

## Desarrollo y reproducción

`genie/config.js` centraliza modelo, perfiles y configuración. Las pruebas de desarrollo usan Node.js, Python, Playwright/Chromium y SymPy según cada suite; estas herramientas no son necesarias para el estudiante. `tools/package_scorm.py` regenera el manifiesto y el ZIP sin bibliotecas externas. `tools/vendor_runtime.py` permite incorporar el runtime solo después de descargar y verificar sus archivos reales y su licencia. No incluye claves privadas.
