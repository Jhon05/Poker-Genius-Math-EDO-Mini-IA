# Despliegue dual — Poker Math EDO v7.2.2

El mismo código sirve para dos pruebas:

- **GitHub Pages:** publicar contenido extraído. Se ejecuta en modo web sin LMS y permite validar HTTPS/WebGPU/runtime sin escribir notas.
- **Brightspace:** subir el ZIP completo como SCORM 1.2. Detecta la API LMS y conserva identidad, intento, reanudación, nota, informe y cierre.

`.nojekyll` se conserva deliberadamente para GitHub Pages y también está incluido en el paquete; no interfiere con SCORM.

La IA local es experimental y en esta compilación solo expone Qwen3 0.6B q4f16. No hay escalado automático a modelos mayores.
