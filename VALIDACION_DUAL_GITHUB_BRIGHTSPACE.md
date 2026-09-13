# Validación del paquete dual GitHub Pages + Brightspace

## Objetivo

Preparar **un único contenido** que pueda:

- publicarse extraído como sitio estático en GitHub Pages por HTTPS; y
- subirse sin modificar como paquete SCORM 1.2 a Brightspace.

## Cambios de compatibilidad

- Se conserva `imsmanifest.xml` en la raíz y `index.html` como SCO de lanzamiento.
- Todos los recursos de interfaz continúan usando rutas relativas, por lo que funcionan bajo un subdirectorio tipo `https://usuario.github.io/repositorio/` y también dentro del directorio de contenido del LMS.
- `genie/config.js` resuelve la raíz del paquete desde la URL real de `genie/config.js`, no desde `/`.
- El modo standalone alojado por HTTPS se identifica visualmente como **MODO WEB · SIN LMS**; la lógica sigue siendo de práctica sin seguimiento y no intenta enviar nota.
- El diagnóstico de Genius acepta HTTPS (GitHub Pages/Brightspace) o localhost y sus mensajes de recuperación mencionan ambos caminos.
- Se incluye `.nojekyll` para GitHub Pages. No forma parte de los recursos SCORM funcionales y Brightspace puede ignorarlo.

## Alcance de la comprobación

`validation/test_dual_hosting.py` verifica de forma estática:

- ausencia de rutas raíz `/...` en recursos estáticos del `index.html`;
- resolución dinámica de `packageRoot`;
- aceptación de HTTPS y localhost;
- presencia de SCORM adapter y manifiesto SCO;
- documentación de ambos despliegues;
- presencia de `.nojekyll`.

Esta validación **no sustituye** una prueba real de WebGPU/modelo en GitHub Pages ni una prueba real de API SCORM/nota en Brightspace. La entrega conserva el estado RC de v7.2.1.
