# Poker Math EDO v7.2.1.1 RC2 — corrección del protocolo JSON del smoke test

## Problema observado en hardware real
En GitHub Pages, el dispositivo superó HTTPS/contexto seguro, WebGPU y obtención del adaptador GPU. El modelo ligero Qwen3 0.6B llegó hasta la fase de smoke test, pero el Worker rechazó la respuesta por JSON inválido.

## Causa de implementación corregida
`GenieWorker.js` enviaba `enable_thinking:false` dentro de `extra_body`. En WebLLM 0.2.85 `enable_thinking` forma parte de `GenerationConfig` y debe enviarse a nivel superior del request. Con modelos Qwen, permitir involuntariamente contenido de razonamiento puede anteponer texto a la respuesta estructurada y romper `JSON.parse`.

## Cambios
- `enable_thinking:false` pasa a nivel superior del request de WebLLM.
- Se conserva `response_format: {type: "json_object", schema: ...}`.
- El smoke test normaliza envolturas inocuas (` ```json ` y bloques `<think>...</think>`) y extrae un único objeto JSON balanceado antes de validarlo.
- `PromptContract` aplica la misma normalización defensiva, pero mantiene la validación estricta de todos los campos, tipos y enumeraciones.
- No se acepta texto libre como sustituto del contrato JSON y no se activa `liveInference` hasta que la salida validada pasa el smoke test.
- Versión interna: 7.2.1.1-rc2.

## Estado
Esta corrección no constituye validación de inferencia en este entorno. Debe probarse nuevamente en el mismo origen GitHub Pages o en localhost con WebGPU real. Si el modelo ya está en caché, la nueva preparación debería reutilizarlo cuando WebLLM lo detecte.
