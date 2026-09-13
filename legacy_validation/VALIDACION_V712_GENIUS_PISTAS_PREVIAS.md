# VALIDACIÓN V7.1.2 — GENIUS MATH CON PISTAS ANTES DE RESPONDER

## Problema corregido
La v7.1.1 obligaba a registrar primero una respuesta y luego habilitaba Genius Math. En consultas vagas o de fórmula, el proveedor guiado podía redirigir de forma repetitiva sin ayudar de manera suficientemente concreta.

## Nuevo flujo
1. Se presenta el reto.
2. El estudiante puede responder directamente **o** abrir Genius Math antes de responder.
3. Al abrir Genius, recibe automáticamente una primera pista contextual.
4. Puede pedir explícitamente una fórmula, cómo empezar u otra pista más concreta.
5. La primera respuesta registrada conserva la consecuencia oficial del Poker.
6. Después de esa respuesta Genius se retira y se inicia la transferencia sin IA.

## FormulaCoach
Se añadió `genie/FormulaCoach.js`, que entrega referencias contextuales de Laplace, derivadas, escalón, impulso, convolución, sistemas, autovalores, Duhamel y aplicaciones. Las fórmulas son generales y se usan para orientar antes de que el estudiante responda.

Caso auditado de la captura del usuario (`EDO-C3-130`):

- Consulta: “dame la fórmula que se me pide”.
- Clasificación: `formula_request`.
- Respuesta esperada del Genio incluye: `L{e^{at}f(t)} = F(s-a)`.
- Penalización: 0.
- Ya no se clasifica como fuera de tema ni entra en el bucle de redirección observado.

## Simulación automática
- 458/458 preguntas normales tienen ahora una guía de fórmulas no vacía.
- 458/458 solicitudes “dame la fórmula que se me pide” se clasifican como `formula_request`.
- 458/458 preguntas generan una pista inicial útil al abrir Genius.
- 458/458 secuencias progresivas alcanzan niveles 1 → 2 → 3.
- 458/458 secuencias producen tres respuestas distintas (sin bucle textual de la misma ayuda).
- 458/458 consultas fuera del tema conservan penalización 0.
- 458/458 consultas fuera del tema no consumen un nivel adicional de ayuda.
- 9.160/9.160 transferencias simuladas conservan macrotema, usan otra pregunta y dificultad normal.
- 10.000/10.000 ciclos sintéticos con y sin ayuda previa completan correctamente la transición a transferencia.

## Integridad
- Todos los módulos JavaScript pasan `node --check`.
- `imsmanifest.xml` se analiza correctamente.
- 103/103 recursos declarados existen.
- `FormulaCoach.js` está incluido tanto en `index.html` como en el manifiesto SCORM.

## Nota pedagógica
La independencia ya no se fuerza bloqueando Genius antes de la primera respuesta. En su lugar, el sistema registra si la primera respuesta fue hecha sin abrir Genius o después de recibir ayuda. Esto permite apoyar a un estudiante perdido sin impedir medir cuánta ayuda necesitó.
