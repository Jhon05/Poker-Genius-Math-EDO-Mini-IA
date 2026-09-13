# Selección de modelo — sin ganador experimental todavía

**Versión:** 7.2.1-rc1. **Inferencia ejecutada aquí:** no. **Benchmark pedagógico real:** no ejecutado. **recommendedDefault:** `null`.

Se mantienen tres candidatos reemplazables mediante `ModelProvider`, no porque su calidad de tutor esté demostrada sino para permitir la comparación solicitada sin reescribir Poker. No se recomienda automáticamente Qwen3 1.7B como mejor tutor.

## Candidatos y cifras de referencia

| Perfil de prueba | Identificador q4f16 | Memoria de referencia q4f16 / q4f32 (MB) | Descarga aproximada mostrada |
|---|---|---:|---:|
| Ligero | Qwen3-0.6B-q4f16_1-MLC | 1403.34 / 1924.98 | 0,5 GB |
| Estándar | Qwen3-1.7B-q4f16_1-MLC | 2036.66 / 2635.44 | 1,2 GB |
| Avanzado | Qwen3-4B-q4f16_1-MLC | 3431.59 / 4327.71 | 2,6 GB |

Los MB son metadatos `vram_required_MB` del registro **WebLLM v0.2.85**, no VRAM libre ni pico medido en el equipo. Las descargas son estimaciones de planificación, no tamaños de respuesta HTTP medidos; otra cuantización puede cambiar consumo y tamaño. Si el adaptador no expone `shader-f16`, el proveedor usa el identificador `q4f32_1-MLC` correspondiente. La carga real puede fallar aunque la sugerencia inicial sea favorable.

## Heurística de capacidad, no clasificación pedagógica

La selección de prueba favorece ligero cuando faltan datos. Para sugerir estándar utiliza indicio de memoria del dispositivo de al menos 8 GB, `maxBufferSize >= 256 MiB`, `maxStorageBufferBindingSize >= 128 MiB` y espacio estimado disponible de al menos 3 GB. Para avanzado exige indicio de memoria de al menos 16 GB, límites de 1 GiB y 256 MiB, y espacio de al menos 7 GB. Los valores se registran con la decisión.

Son márgenes conservadores declarados para reducir intentos demasiado costosos, **no umbrales calibrados mediante experimentos ni garantías de suficiencia**. `deviceMemory` es un indicio opcional/reducido y no mide memoria disponible; puede no permitir sugerir automáticamente avanzado. El usuario puede elegir manualmente otro perfil. Ningún límite WebGPU permite inferir por sí solo la VRAM libre total.

## Evidencia disponible y pendiente

| Dimensión | 0.6B | 1.7B | 4B |
|---|---|---|---|
| Registro de identificadores y variantes | Comprobado en fuente primaria | Comprobado | Comprobado |
| Carga e inferencia en dispositivo objetivo | No ejecutada | No ejecutada | No ejecutada |
| Etapa A: 24 conversaciones | Preparada, no ejecutada | Preparada, no ejecutada | Preparada, no ejecutada |
| Etapa B: 160 conversaciones revisadas | Pendiente de A | Pendiente de A | Pendiente de A |
| Conversaciones largas | Pendiente de B | Pendiente de B | Pendiente de B |
| Matemática/continuidad/adaptación | Sin puntuación real | Sin puntuación real | Sin puntuación real |
| Latencia, tokens/s, caché | Sin medición | Sin medición | Sin medición |
| Memoria libre/pico | No medida | No medida | No medida |

El navegador de construcción fue Chromium Headless 144 en Linux. La navegación a localhost fue bloqueada por una política administrativa y los recursos externos no pudieron descargarse por resolución de nombres. No se obtuvo un adaptador en un contexto de ejecución autorizado. Esto **no identifica la GPU física del servidor ni el equipo del usuario**.

## Criterio para una selección posterior

Ejecuta A para cada candidato realmente viable. Revisa las transcripciones con la rúbrica independiente; B solo se habilita para quienes pasen A y C requiere B. Compara resultados de tutoría, primera latencia, tiempo total, cancelación, estabilidad y segundo arranque en los equipos de los estudiantes. No conviertas una puntuación producida por el mismo modelo en una evaluación independiente.

El modelo mínimo será el menor que cumpla **ambas** condiciones: diálogo matemático aceptable y ejecución utilizable. El avanzado será una opción solo si ofrece mejora relevante y el coste es viable. Hasta obtener esos datos no hay modelo mínimo/estándar/avanzado pedagógicamente certificado, ni es posible afirmar que ninguno sirve.

La ausencia de selección experimental no cambia la nota ni activa cloud de forma encubierta. El fallback continúa explícitamente como guía sin IA.

Fuente primaria de las cifras: https://raw.githubusercontent.com/mlc-ai/web-llm/v0.2.85/src/config.ts. Contexto de Worker/caché: https://webllm.mlc.ai/docs/user/advanced_usage.html.
