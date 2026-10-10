# Growth SEO Command Center

Sistema catalog-centric de inteligencia SEO: transforma datos de producto, rendimiento orgánico, demanda y señales comerciales en oportunidades económicas, prioridades y acciones.

## Ejecutar
```bash
python3 -m http.server 8000
```
Abrir `http://localhost:8000/`.

## Módulos
- Executive Overview
- Strategic Action Matrix
- Operational Backlog
- Product Lookup
- Test Data Lab
- Catálogo y datos: importación CSV/XLSX, mapeo de columnas, validación, vista previa, IndexedDB y exportación CSV
- Integraciones
- Configuración IA — Cohere

## Arquitectura actual
```text
Fuentes → Adaptadores → Merge por SKU → Calidad → Motor matemático → Cohere → Acciones
```

La Fase 9 formaliza el pipeline de extremo a extremo. Revenue Gap, clasificación, prioridad y demás campos calculados son autoridad del motor determinista. Cohere interpreta resultados y no puede sobrescribir la verdad de negocio.

## Estado de integraciones
Los contratos y adaptadores de GSC, GA4, Merchant Center, Google Ads y Trends están preparados. Las llamadas reales a APIs todavía requieren una capa segura de backend/proxy.

## Cohere
Cohere es el único proveedor de IA del producto. La interfaz permite seleccionar modelo y configurar la API Key. La clave no se guarda en localStorage; la conexión de producción debe pasar por una capa segura.

## Fases
0 Arquitectura · 2 Overview/Test Data · 3 Matrix/Lab · 4 Backlog · 5 Lookup · 6 Motor matemático · 7 Integraciones · 8 Cohere/IA · 9 Pipeline completo · 10 CI · 11 Seguridad/Performance/Accesibilidad/IndexedDB · 12 QA · 13 Auditoría/Release.

## Fase 10 — CI

La validación automática se ejecuta con `scripts/ci_check.py` y `.github/workflows/ci.yml`. El gate comprueba tests, sintaxis JS, compilación Python, JSON y smoke HTTP. No requiere APIs reales ni secretos.

## Fase 15 — Catálogo y datos
La aplicación incluye un importador de CSV/XLSX en el módulo Catálogo y datos. El catálogo se guarda localmente en IndexedDB. Los datos de prueba y el catálogo real se almacenan por separado. La importación no conecta automáticamente fuentes Google ni Cohere. Ver `docs/phases/fase-15.md`.

## Fase 13 — Estado final
La aplicación es un release candidate funcional con datos locales/mock y pipeline determinista. Las integraciones Google y la llamada real a Cohere siguen bloqueadas hasta implementar una capa segura de backend/worker y OAuth. Consulta `docs/final-audit.md`, `docs/google-integration-preparation.md` y `docs/release-checklist.md`.


## Fase 16 — Machote y actualización incremental
Consulta `docs/phases/fase-16.md`. En **Catálogo y datos** puedes descargar un machote CSV o XLSX con diccionario de campos e instrucciones. La importación combina por SKU con el catálogo real, preserva productos no incluidos y no sobrescribe valores existentes con celdas vacías.


## Estado de la Fase 17

Se añadieron endpoints de consulta bajo demanda para Google Search Console y GA4 en el gateway. La autenticación OAuth y los tokens siguen siendo de desarrollo y se guardan en memoria; no se considera sincronización productiva. Consulta `docs/phases/fase-17.md` antes de configurar credenciales.

## Fase 18 — Sincronización y calidad de datos

La función `pipeline.synchronization.synchronize_batch(catalog, source, rows, synced_at=None, expected_ctr=0.10)` consolida un lote ya obtenido por un adaptador. Conserva campos omitidos, limita las escrituras a los campos de la fuente, rechaza SKU desconocidos/duplicados y reporta cobertura, errores y trazabilidad por fuente. No realiza llamadas de red ni persiste tokens. Consulta `docs/phases/fase-18.md` para límites y criterios de aceptación.

## Fase 19 — Granularidad de Search Console

`pipeline.gsc_observations.normalize_gsc_response(response, dimensions)` conserva las filas y dimensiones nativas de Search Console. El mapeo automático al catálogo solo se permite con dimensión `page` exclusivamente; combinaciones como `page+query`, `page+date` o `page+device` se conservan como observaciones y quedan bloqueadas para actualización directa de métricas por producto. Consulta `docs/phases/fase-19.md`. Esta capa aún requiere integración en la sincronización real para considerarse operativa con datos de Google.


## Fase 20 — Integración de Search Console con la sincronización

`pipeline.gsc_observations.synchronize_gsc_response(catalog, response, dimensions, synced_at=None, expected_ctr=0.10)` conecta la respuesta cruda de GSC con el normalizador de granularidad y el sincronizador determinista de la Fase 18. Solo filas de dimensión `page` se mapean por URL exacta y pasan al lote `gsc`. Las combinaciones `page+query`, `page+date`, `page+device` u otras se devuelven como observaciones sin alterar métricas de producto. URL no encontradas o ambiguas se informan como excepciones.

Esta función de integración local está cubierta por pruebas, pero el flujo de interfaz todavía debe invocarla con la respuesta obtenida del gateway para completar una sincronización real extremo a extremo. El gateway mantiene tokens en memoria y no es una solución de producción.


## Revisión manual antes de liberar
Sigue `docs/revision-final-paso-a-paso.md`. La suite local pasa, pero eso no equivale a una prueba con credenciales reales ni a un despliegue productivo.
