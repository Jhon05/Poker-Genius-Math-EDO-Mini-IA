# Poker Math EDO v7.2.0-rc1 — Genius generativo

Paquete SCORM 1.2 basado en el ZIP v7.1.2 suministrado. Conserva las 500 preguntas originales y añade 4 retos exclusivos de transferencia.

**Estado: candidato de prueba.** La integración generativa está implementada, pero no se ejecutó inferencia real ni una sesión Brightspace real en el entorno de construcción. No se presenta el fallback como IA ni las pruebas con fixtures como benchmarks del modelo.

- Entrada del juego: `index.html`.
- Documento completo: `VALIDACION_V72_GENIUS_GENERATIVE.md`.
- Evidencia automática resumida: `TEST_RESULTS_V72_GENIUS_GENERATIVE.json`.
- Benchmark real: `validation/benchmark.html`, servido por HTTPS o localhost.
- Configuración de perfiles/proveedor: `genie/config.js`.

El menú **PREPARAR GENIUS · OPCIONAL** permite descargar el modelo estándar antes de iniciar el tiempo. La IA local requiere activación explícita, descarga de runtime/pesos externos y WebGPU. No se incluyen los pesos en el ZIP. El catálogo “Guía sin IA” funciona sin un modelo. No hay servidor cloud desplegado ni claves privadas.

Subir como una actividad SCORM nueva en un módulo de prueba de Brightspace. No reemplazar una evaluación activa hasta completar la validación del documento principal. Las validaciones anteriores se conservaron en `legacy_validation/` y no acreditan esta entrega.
