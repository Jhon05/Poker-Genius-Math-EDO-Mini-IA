# Núcleo Genius Math V72

La documentación de arquitectura, límites, pruebas y despliegue está en `../VALIDACION_V72_GENIUS_GENERATIVE.md`. `LocalModelProvider` es el proveedor generativo principal. `GuidedProvider` es solo referencia y lanza un error si se intenta usarlo como modelo. Los tests instrumentales se encuentran separados en `../validation/`.

No cargar `legacy_validation/ScopeClassifier.js`. No incluir claves de proveedores en `config.js`. `GenieWorker.js` realiza importación e inferencia reales solo tras activación explícita; no incluye pesos ni el runtime remoto.
