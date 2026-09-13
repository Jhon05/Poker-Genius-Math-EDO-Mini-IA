# Prueba local en Windows — v7.2.1 RC

## 1. Preparar la carpeta

Guarda `Poker_Math_EDO_v721_GENIUS_RUNTIME_RC_SCORM12.zip` y usa **Extraer todo**. Trabaja en la carpeta extraída, no dentro del explorador del ZIP. Deben quedar juntos `index.html`, `imsmanifest.xml`, `serve_local.bat`, `serve_local.py`, `genie/`, `bank/` y `assets/`.

Se necesita Python 3 para el servidor de prueba. La aplicación del estudiante no requiere Python cuando está publicada en Brightspace. En una terminal comprueba:

```bat
py -3 --version
```

El BAT no instala Python ni descarga programas. Si no está disponible, instala Python desde su distribución oficial y repite la comprobación; no desactives controles de seguridad.

## 2. Iniciar el servidor

Haz doble clic en **serve_local.bat**. Este cambia a su propia carpeta, inicia `serve_local.py`, muestra la dirección y abre el navegador. Conserva abierta esa ventana. La alternativa explícita, desde una terminal en la carpeta extraída, es:

```bat
py -3 serve_local.py
```

Abre:

```text
http://localhost:8000/
```

El servidor escucha únicamente en `127.0.0.1`; no publica la carpeta a otros equipos, no acepta subidas y comprueba el encabezado Host. No es un servidor de producción. Se detiene con **Ctrl+C**.

Si el puerto está ocupado, cierra el servidor anterior. También puedes ejecutar `py -3 serve_local.py --port 8001`, pero cambiar de puerto cambia el origen y, por tanto, la ubicación del almacenamiento. Mantén el mismo host y puerto para comparar caché y recuperar intentos.

**Abrir `index.html` como `file://` no es una prueba válida del runtime modular.** El panel lo identifica. Una pestaña privada, las extensiones, la configuración del navegador, el controlador gráfico o las políticas institucionales pueden restringir capacidades; el diagnóstico del propio equipo decide qué se pudo comprobar. No es necesario ni recomendable desactivar la seguridad del navegador.

## 3. Preparar Genius antes de la partida

En el menú, pulsa **PREPARAR GENIUS**. El panel comprueba contexto, GPU/adaptador, Worker e IndexedDB. Antes del consentimiento no descarga pesos. Las pruebas de acceso al runtime y al modelo se completan durante la preparación y no se presentan como aprobadas anticipadamente.

Lee el motivo cuando una comprobación falle. Cada fallo muestra impacto y una acción sugerida; **CONTINUAR SIN IA LOCAL** permite regresar al juego. El modo de respaldo se llama **Guía compatible — sin IA**. No cambia la nota.

Elige un perfil de prueba y pulsa **PREPARAR GENIUS**. Las cifras de descarga son estimaciones y los datos de memoria del registro de modelos no miden tu VRAM libre. No existe un modelo declarado ganador. La sugerencia inicial es conservadora y puede cambiarse manualmente.

Durante la descarga y compilación, observa las etapas. Solo hay porcentaje cuando lo comunica el runtime; puede ser progreso global y no porcentaje de bytes. **Cancelar** detiene o termina el Worker; después puede ser necesario volver a preparar. La etiqueta **Genius listo** exige una respuesta interna no vacía y válida del modelo, no solo que termine la descarga.

Prepararlo desde el menú **no inicia la hora académica**. Si lo preparas cuando una partida ya está en marcha, el temporizador existente continúa: la aplicación no concede tiempo adicional por abrir el tutor.

## 4. Probar una partida y los informes

Inicia la partida. Abre Genius antes de responder y comprueba que la pregunta se incorpora automáticamente; pedir una fórmula o ayuda no resta nota. La transferencia debe volver a bloquear el tutor.

Finaliza una prueba local. Usa **VER INFORME** para leerlo dentro de la actividad o **DESCARGAR INFORME** para conservar otra copia. Luego pulsa **CERRAR INTENTO LOCAL Y VOLVER AL MENÚ**. El informe permanece en el historial y puede iniciarse otra práctica. Un intento pendiente debe cerrarse con esta acción: no se borra por iniciar otro.

No borres los datos del sitio para salir de un intento: eso podría eliminar informes y progreso. Los mecanismos de cierre nuevos no eliminan el historial. Una actualización no migra almacenamiento entre `file://`, distintos hosts, puertos o el dominio de Brightspace.

## 5. Obtener datos reales del modelo

Con el servidor abierto, entra en:

```text
http://localhost:8000/validation/benchmark.html
```

El benchmark no carga SCORM ni inicia Poker ni envía notas. Activa un candidato y ejecuta **A: 24 conversaciones**. Guarda el JSON. Abre `validation/review.html` y revisa las diez dimensiones de cada caso con la rúbrica. Guarda el archivo revisado y cárgalo nuevamente en el benchmark. Solo una etapa A completa, del mismo modelo, con revisión aprobada habilita B; B aprobada habilita C.

B contiene 160 conversaciones. C contiene 20 de 24 turnos; puede tardar bastante. No hay duración prometida: depende de hardware y modelo. La opción de regresión de fórmula prueba explícitamente «No recuerdo la fórmula», «¿por qué?», «No entendí», «Más fácil», «Ponme un ejemplo» y la conexión con el ejercicio.

La revisión humana no autentica por sí sola al evaluador; hay que conservar su procedencia y contrastar sus conclusiones. No uses una autoevaluación del mismo modelo como aprobación independiente.

## 6. Caché y cancelación

En el benchmark, activa el modelo y guarda **ejecución 1**. Un arranque frío requiere que la sonda del runtime indique ausencia de caché; si no es así, queda registrado. Solo con autorización explícita se puede borrar la caché de **ese modelo**, sin tocar informes.

Recarga la página, elige exactamente el mismo candidato, vuelve a prepararlo y pulsa **Comparar ejecución 2 tras recarga**. Guarda su JSON. Una carga más rápida no demuestra por sí sola reutilización: el resultado conserva el indicador del runtime, solicitudes observadas y limitaciones de medición.

Ejecuta **Probar cancelación real**. El instrumento intenta una respuesta larga, mide respuesta del hilo principal, cancela y consulta de nuevo. Si termina antes de cancelar, el resultado es inconcluso, no aprobado. Conserva el JSON junto con el de caché y conversaciones. Repite manualmente el botón de interacción y el desplazamiento mientras genera.

## 7. Cuando algo falla

Exporta el diagnóstico desde el panel. No contiene nombre/código LMS, chats completos ni prompts. Revisa su contenido antes de compartirlo: contiene información técnica del navegador, origen y capacidades. Un error genérico de `fetch` no permite distinguir con certeza CORS, DNS, un corte de red o CSP; solo se atribuye una política específica cuando hay evidencia.

Si el modelo no puede descargarse, el juego sigue disponible con la guía sin IA. El ZIP no contiene los pesos ni, en esta entrega, el runtime JS completo: la primera preparación necesita acceso a las dependencias externas descritas en `EXTERNAL_DEPENDENCIES.md`.

Referencia técnica: documentación oficial de Python `http.server`, https://docs.python.org/3/library/http.server.html. El servidor incluido añade restricciones locales; no debe desplegarse como servicio público.
