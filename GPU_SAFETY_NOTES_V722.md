# Seguridad GPU — Genius Math v7.2.2

Esta versión existe porque una prueba real previa consiguió cargar el modelo local ligero, pero una consulta posterior fue seguida por una pantalla negra y reinicio forzado. La causa exacta no quedó determinada. Por precaución se aplicó una política de carga mínima.

## Límites activos

- Solo `Qwen3-0.6B-q4f16_1-MLC`.
- `shader-f16` obligatorio en página y Worker.
- Sin q4f32 automático.
- Context window: 1280.
- Presupuesto de mensajes: 2600 caracteres y JSON de contexto siempre válido.
- Consulta visible: máximo 700 caracteres; el runtime recibe una versión compacta.
- Salida: 112 tokens primer turno, 128 siguientes, límite duro 144.
- Una inferencia por turno.
- Cero rondas generativas de herramientas.
- Cero regeneraciones automáticas.
- Detector de bucles lexical/local, sin segunda inferencia.
- Watchdog interno de generación y timeout externo.
- Cancelación al ocultar la pestaña durante una generación.
- Descarga del modelo de la GPU tras 45 s en segundo plano.
- Descarga inmediata al abandonar la página cuando no hay generación activa.

## Política de prueba

1. Probar primero en GitHub Pages/HTTPS.
2. Preparar únicamente el perfil ligero seguro.
3. Hacer una sola consulta breve.
4. Esperar a que termine por completo.
5. Solo si el equipo permanece estable, probar un segundo turno corto.
6. Si aparece pantalla negra, congelamiento, reinicio, pérdida del controlador o artefactos gráficos, **no volver a usar el LLM WebGPU local en ese equipo**.
7. No probar 1.7B ni 4B como respuesta a un fallo.

La disponibilidad de WebGPU no constituye una garantía de estabilidad bajo inferencia sostenida.
