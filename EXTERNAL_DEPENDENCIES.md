# Dependencias externas y licencia — v7.2.1 RC

## Lo que sí está dentro del ZIP

Juego, banco de 500 preguntas, imágenes, calculadora, MathJax existente, módulos propios del tutor, diagnóstico, Worker, proveedores, evaluador, instrumentos de prueba, documentos y scripts locales de empaquetado/servidor. No hay claves de API, tokens privados ni servidor cloud preconfigurado.

## Lo que continúa fuera

| Componente | Configuración observada | Alcance |
|---|---|---|
| Runtime JavaScript | `https://esm.run/@mlc-ai/web-llm@0.2.85` | Importación remota en Worker; versión npm fijada. El CDN puede resolver subdependencias/redirecciones. |
| Biblioteca WebGPU/WASM | Registro `prebuiltAppConfig` de WebLLM; repositorio `mlc-ai/binary-mlc-llm-libs`, ruta `web-llm-models/v0_2_84/base/` | La versión del runtime y la de esa carpeta son distintas por diseño del registro oficial. |
| Configuración, tokenizador y pesos | Modelos `mlc-ai/Qwen3-*-q4f16_1-MLC` y `q4f32_1-MLC` en Hugging Face, enlaces del registro de WebLLM | Pueden usar redirecciones/CDN de almacenamiento. Los pesos no se añadieron al ZIP. |
| CloudModelProvider | Desactivado y sin endpoint/credenciales | No se utiliza para ocultar un fallo local. Su futura activación requiere consentimiento y configuración controlada. |

Fijar la versión npm no convierte en inmutables todos los recursos de modelos/CDN. Esta entrega no verificó un hash de cada peso ni fijó una revisión de cada repositorio remoto; esa reproducibilidad adicional queda pendiente de un alojamiento institucional de los recursos y su inventario.

## Intento real de incorporar el runtime

Se ejecutó `python tools/vendor_runtime.py --accept-upstream-license`. La obtención de metadatos oficiales npm falló con **Temporary failure in name resolution**. El registro está en `validation/environment/VENDOR_ATTEMPT.log`. No se creó un bundle sustituto ni se cambió `runtimeBundled=false`.

El script usa Python estándar, verifica versión e integridad SHA-512 de la distribución npm y conserva licencia/archivos reales antes de cambiar configuración. Debe ejecutarse en un entorno con acceso a npm; revisa su salida y repite las pruebas y empaquetado. No basta con marcar `runtimeBundled=true` a mano. El fallo de este intento significa que **la solicitud de reducir la dependencia del CDN no quedó materializada como un runtime autocontenido en esta RC**.

Aunque se incorpore el runtime JS posteriormente, los pesos y bibliotecas de modelos seguirán externos hasta alojarlos y versionarlos explícitamente. No se prometen consultas offline sin comprobar antes las dos ejecuciones de caché y todos los recursos necesarios.

## Fuentes técnicas primarias

- WebLLM, uso avanzado y Worker/caché: https://webllm.mlc.ai/docs/user/advanced_usage.html
- Registro exacto del runtime usado: https://raw.githubusercontent.com/mlc-ai/web-llm/v0.2.85/src/config.ts
- Repositorio y licencia de WebLLM: https://github.com/mlc-ai/web-llm
- GPU.requestAdapter: https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter

Consulta la licencia de cada distribución/modelo antes de redistribuir sus archivos. Este paquete no contiene archivos de fuente tipográfica descargados del sistema.
