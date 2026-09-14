# Poker Math EDO v7.2.2 — Genius Math seguro auditado

Paquete dual para **GitHub Pages (HTTPS, sin LMS)** y **Brightspace SCORM 1.2**. Conserva Poker Math EDO, banco de 500 preguntas, portada roja, gráficas, calculadora, guardado/reanudación, intento único LMS, historial, informe y nota original.

## Por qué existe v7.2.2

Una prueba real anterior consiguió cargar el LLM ligero local, pero una consulta posterior fue seguida por pantalla negra y reinicio del equipo. La causa no pudo atribuirse con certeza. Esta versión reduce radicalmente la presión del runtime y bloquea perfiles mayores. Consulta `GPU_SAFETY_NOTES_V722.md` y `VALIDACION_V722_DEEP_AUDIT.md`.

## IA local

- Único modelo expuesto: `Qwen3-0.6B-q4f16_1-MLC`.
- WebGPU + `shader-f16` obligatorios.
- Una sola inferencia por turno.
- Sin regeneraciones ni segunda inferencia para antibucles.
- Contexto y salida limitados.
- Watchdog, cancelación y liberación de GPU en segundo plano.
- La guía determinista existe como **Guía compatible — sin IA** y nunca se presenta como LLM.

La primera carga todavía necesita recursos externos; no hay pesos dentro del ZIP. `recommendedDefault` continúa sin ser una certificación pedagógica.

## GitHub Pages

Extrae el contenido del ZIP y publícalo con `index.html` y `.nojekyll` en la raíz. Usa HTTPS. Sigue `GITHUB_PAGES_TEST_CHECKLIST.md`.

## Brightspace

Sube **el ZIP completo sin recomprimir** como SCORM 1.2 a una actividad nueva de prueba. Sigue `BRIGHTSPACE_TEST_CHECKLIST.md`.

## Evidencia

- `VALIDACION_V722_DEEP_AUDIT.md`
- `GPU_SAFETY_NOTES_V722.md`
- `validation/DEEP_AUDIT_V722_RESULTS.json`
- resultados de suites bajo `validation/`

Los documentos V72/V721 anteriores se conservan como antecedentes y no sustituyen esta auditoría.
