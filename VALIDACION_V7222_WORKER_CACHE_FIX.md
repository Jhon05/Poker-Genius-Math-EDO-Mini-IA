# VALIDACIÓN v7.2.2.2 — Worker cache fix

## Motivo
En GitHub Pages se observó que la página nueva podía cargar scripts con cache-busting, pero los Workers dinámicos (`CapabilityWorker.js` y `GenieWorker.js`) se construían sin versión en la URL. Esto permitía reutilizar un Worker antiguo desde caché, provocando un timeout de handshake aunque el archivo nuevo existiera.

## Correcciones
- Ambos Workers usan ahora `?v=72222safe`.
- El `CapabilityWorker` declara `probeVersion=7.2.2.2`.
- La página exige la misma versión y reporta explícitamente un `WORKER_VERSION_MISMATCH`.
- Se añadió `onmessageerror` y error con URL/archivo/línea cuando el navegador los expone.
- Timeout de sonda ampliado de 8 s a 12 s.
- La memoria reportada por `navigator.deviceMemory < 8 GB` sigue siendo un bloqueo deliberado en esta compilación segura; no se elimina porque el equipo objetivo ya presentó una pantalla negra bajo carga WebGPU.

## Importante
Esta corrección NO autoriza a forzar IA local en un equipo bloqueado por memoria/seguridad. Su objetivo es eliminar el falso fallo del Worker y producir diagnósticos consistentes en equipos compatibles.
