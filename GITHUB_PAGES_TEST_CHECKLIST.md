# Prueba en GitHub Pages — Poker Math EDO v7.2.1 RC

Este mismo paquete puede usarse como **SCORM 1.2 en Brightspace** y como **sitio estático de prueba en GitHub Pages**. En GitHub Pages no existe la API SCORM del LMS: el juego entra deliberadamente en modo **MODO WEB · SIN LMS**, con intentos de práctica locales y sin envío de nota.

## Publicar

1. Extrae todo el ZIP. No subas el ZIP cerrado como contenido del sitio.
2. Crea un repositorio de prueba en GitHub.
3. Sube **el contenido extraído manteniendo la estructura y `index.html` en la raíz**. Deben quedar, entre otros: `index.html`, `imsmanifest.xml`, `app.js`, `genie/`, `bank/`, `assets/`, `validation/` y `.nojekyll`.
4. En **Settings → Pages**, selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
5. Abre la URL HTTPS de Pages. No uses una URL `raw.githubusercontent.com` ni el visor de archivos del repositorio.

## Qué debe ocurrir

- La pantalla inicial debe mostrar **MODO WEB · SIN LMS**.
- `PREPARAR GENIUS` debe reconocer un origen HTTPS seguro.
- El diagnóstico debe comprobar WebGPU, adaptador, Worker e IndexedDB.
- Si el dispositivo es compatible, la primera preparación intentará descargar las dependencias externas y el modelo configurado.
- El temporizador académico no debe comenzar durante la preparación previa.
- El juego debe funcionar también si Genius local no puede iniciarse, usando la guía compatible sin IA.

## Benchmark

Abre `validation/benchmark.html` bajo la misma URL de Pages, por ejemplo:

`https://USUARIO.github.io/REPOSITORIO/validation/benchmark.html`

Guarda los JSON reales antes de cambiar de modelo o dispositivo.

## Lo que GitHub Pages NO valida

GitHub Pages no valida la API SCORM, intento único institucional, identidad LMS, envío de nota, `Finish` ni comportamiento del iframe de Brightspace. Para ello sube **este mismo ZIP sin modificar** como paquete SCORM 1.2 a una actividad de prueba en Brightspace y sigue `BRIGHTSPACE_TEST_CHECKLIST.md`.
