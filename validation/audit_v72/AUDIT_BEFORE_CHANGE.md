# Auditoría previa: v7.2 → v7.2.1

Base: Poker_Math_EDO_v72_GENIUS_GENERATIVE_SCORM12.zip. 146 archivos; inventario SHA-256 completo adjunto. Se inspeccionaron app.js, index.html, styles.css, scorm.js, manifiesto, README, módulos genie y validation, y todos los JSON originales.

## Fallos demostrados por código
- PreloadPanel.js invoca confirm() nativo y activa siempre standard. El catch descarta la causa visible y conserva únicamente el mensaje genérico; el detalle queda en title. Las capturas no contienen la URL ni el error original: NO permiten atribuir retrospectivamente el fallo concreto a WebGPU, red, CSP o file://.
- LocalModelProvider comprueba solo contexto seguro, navigator.gpu y adapter; no prueba Worker mediante ida/vuelta, IndexedDB, espacio, iframe, origen ni recursos remotos antes de cargar.
- GenieWorker importa dinámicamente esm.run/@mlc-ai/web-llm@0.2.85. El runtime NO está dentro del ZIP. Pesos/configuración/tokenizadores vienen del registro upstream Hugging Face; bibliotecas WASM de GitHub.
- ready=true se marca tras reload, sin generación comprobada. No hay smoke test ni liveInference verificable.
- Cancelar generación rechaza las promesas y devuelve ready antes de confirmar que la generación anterior terminó: posible carrera.
- La caché se configura como indexeddb pero no se mide ni se verifica reutilización tras recarga. La versión no mide primer token ni transferencia de red.
- El perfil fijo usa estimaciones, sin evidencia pedagógica de selección.
- La pantalla de cierre local menciona Brightspace aunque el perfil no tenga seguimiento, y el menú no explica claramente el cierre que habilita una nueva prueba.

## Evidencia heredada
Los JSON originales registran inferencia real y Brightspace NO ejecutados. Las pruebas con proveedor instrumental y DOM inyectado no son inferencia WebGPU. Su copia se conserva en esta carpeta como evidencia de v7.2; no se convierte en certificación de v7.2.1.

## Conservación
No se reescriben Poker, el banco de 500, recursos, calculadora ni reglas de nota. scorm.js debe permanecer idéntico byte a byte. Se conservan prefijos de guardado e historial y se restringe la mejora de cierre a los perfiles correspondientes.

## Prioridad de especificaciones
El PDF conceptual original propone diagnóstico sin IA y ponderaciones piloto. Las instrucciones posteriores explícitas conservan ayuda antes de responder y la nota oficial existente; tienen prioridad en esta revisión.
