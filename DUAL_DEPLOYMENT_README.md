# Paquete dual: GitHub Pages + Brightspace SCORM 1.2

## Un solo ZIP, dos formas de prueba

### GitHub Pages
Extrae el ZIP y publica **su contenido** en la raíz del sitio. GitHub Pages lanza `index.html` por HTTPS y el juego opera en modo web sin LMS. Consulta `GITHUB_PAGES_TEST_CHECKLIST.md`.

### Brightspace
Sube **el ZIP completo tal como se entrega**, sin recomprimir una subcarpeta interior. `imsmanifest.xml` está en la raíz y lanza `index.html` como SCO. Consulta `BRIGHTSPACE_TEST_CHECKLIST.md`.

## Importante

- El mismo código detecta si existe una API SCORM. Si existe, usa el perfil LMS; si no, queda en práctica web/local sin envío de nota.
- Los pesos del modelo no están incluidos. La RC sigue necesitando acceso a las dependencias externas descritas en `EXTERNAL_DEPENDENCIES.md` para la primera preparación.
- La versión continúa siendo **release candidate**: inferencia local real y Brightspace real siguen requiriendo prueba en el dispositivo/institución objetivo.
