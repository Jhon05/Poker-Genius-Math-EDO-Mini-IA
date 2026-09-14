# Selección de modelo — v7.2.2 modo seguro

**Versión:** 7.2.2-safe-audited. **Inferencia WebGPU ejecutada en este entorno de auditoría:** no. **Brightspace real:** no. **Modelo expuesto por esta compilación:** únicamente `Qwen3-0.6B-q4f16_1-MLC`.

## Decisión de seguridad

Durante una prueba real previa en GitHub Pages, el usuario consiguió cargar Qwen3 0.6B y superar el smoke test, pero una consulta posterior estuvo asociada a una pantalla negra y reinicio forzado del equipo. Ese hecho no permite diagnosticar por sí solo si la causa fue driver, presión de memoria, WebGPU o una interacción del navegador; sí demuestra que no es responsable escalar automáticamente la carga en ese equipo.

Por ello esta compilación:

- **no ofrece 1.7B ni 4B**;
- **no ofrece fallback q4f32**;
- exige `shader-f16` tanto en página como en Worker;
- limita la ventana de contexto a 1280;
- limita la salida a 128 tokens solicitados / 144 de límite duro;
- realiza **una sola inferencia por turno**;
- no usa un segundo LLM para juzgar bucles;
- no regenera automáticamente;
- impone watchdog interno y timeout externo;
- descarga el modelo de la GPU cuando la pestaña permanece oculta.

## Modelo disponible

| Perfil | Identificador | Memoria de referencia del registro | Descarga estimada |
|---|---|---:|---:|
| Ligero seguro | `Qwen3-0.6B-q4f16_1-MLC` | ~1403 MB | ~0,5 GB |

Las cifras anteriores son metadatos/estimaciones del runtime, **no VRAM libre ni consumo pico medido**. `navigator.deviceMemory`, cuando existe, tampoco mide memoria libre.

## Estado pedagógico

El modelo ligero ha demostrado que puede cargar y generar en al menos una prueba real del usuario, pero **no está certificado todavía como tutor pedagógico estable**. Deben evaluarse continuidad, corrección matemática, ausencia de bucles y estabilidad del equipo en conversaciones reales. Si vuelve a aparecer pantalla negra, reinicio, pérdida del controlador o bloqueo gráfico, debe abandonarse la vía WebGPU local en ese equipo y usarse la Guía compatible o una futura ruta cloud/servidor.

## Prohibición de escalado

No debe interpretarse un fallo del modelo ligero como indicación de probar un modelo mayor. En esta versión `recommendedDefault = null` a nivel de evidencia pedagógica y el único perfil técnico expuesto es el ligero seguro.
