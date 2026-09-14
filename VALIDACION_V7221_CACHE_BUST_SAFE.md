# Poker Math EDO v7.2.2.1 SAFE — cache busting

Corrección específica para GitHub Pages/navegador: la captura del usuario mostró el menú antiguo con Qwen3 0.6B/1.7B/4B, aunque la compilación SAFE solo contiene 0.6B. Eso demuestra que se estaban ejecutando recursos JS cacheados o una publicación anterior.

Cambios:
- todos los scripts/CSS de `index.html` llevan `?v=7221safe`;
- metadatos de no-cache en el documento;
- panel muestra `v7.2.2.1 SAFE`;
- `PreloadPanel` aplica defensa adicional y solo presenta `light` con `Qwen3-0.6B-q4f16_1-MLC`, aunque una configuración vieja quedara mezclada;
- no se habilitan 1.7B/4B.

Criterio visual: si la cabecera del panel no dice `v7.2.2.1 SAFE`, NO se está ejecutando esta versión.
