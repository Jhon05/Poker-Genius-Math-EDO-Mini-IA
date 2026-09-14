# v7.2.1.2 SAFE GPU HOTFIX

Esta variante se crea después de que una inferencia real con Qwen3 0.6B provocara pantalla negra/reinicio en el equipo de prueba. No afirma la causa física exacta. Reduce deliberadamente la presión del runtime:

- solo perfil ligero Qwen3 0.6B;
- ventana de contexto máxima: 2048;
- salida por generación: 256 tokens (clamp 320 en Worker);
- 4 mensajes recientes;
- presupuesto de contexto: 6200 caracteres;
- máximo 1 ronda de herramienta;
- sin regeneraciones automáticas;
- LoopDetector semántico por LLM desactivado; usa comparación local léxica/n-gramas;
- fórmulas verificadas principales se incluyen en el contexto para evitar una segunda inferencia solo para recuperarlas;
- timeout de generación reducido a 60 s.

No debe probarse un modelo mayor en el mismo equipo hasta demostrar estabilidad del perfil seguro. Esta entrega sigue siendo RC y requiere prueba real.
