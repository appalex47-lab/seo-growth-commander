> Fase 21: el importador del catálogo detecta automáticamente encabezados conocidos; el ajuste manual es opcional y está plegado inicialmente. Pruebas automatizadas locales: 84/84 aprobadas. No está desplegada automáticamente en GitHub Pages.

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


## Fase 22 — Search Console
La pantalla Integraciones permite consultar Google Search Console desde el frontend mediante Google Identity Services (OAuth popup), sin backend propio. Revisa `docs/phases/fase-22-search-console.md` para registrar el origen JavaScript, configurar el ID de cliente y probar una propiedad autorizada. El token se conserva solo en memoria; no se utiliza el Client Secret en el navegador. La prueba E2E requiere credenciales y una propiedad reales.


## Fase 23 — Diagnóstico SEO con Search Console

Tras una consulta exitosa en Integraciones, el panel muestra hechos, métricas descriptivas, señales priorizadas (CTR bajo con impresiones, posiciones 4–20 y principales aportadores de clics) e hipótesis por validar. Revisa `docs/phases/fase-23-diagnostico-search-console.md`.

## Fase 24 — Diagnóstico SEO por producto

La sección de consulta de Search Console incorpora un panel que lee el catálogo activo de IndexedDB, permite seleccionar una ficha, revisar su URL y comparar clics, impresiones, CTR y posición contra el periodo anterior de igual duración. Ver `docs/phases/fase-24-vinculo-producto-search-console.md`.


## Fase 33 — Google Ads
Consulta inicial de solo lectura para campañas y productos de Shopping desde Integraciones. Reutiliza OAuth de Google y el selector global de periodo. Ver `FASE_33_GOOGLE_ADS.md`. La consulta real depende del acceso API del proyecto y del consentimiento del usuario; no se consideran verificados datos en vivo hasta ejecutar una consulta en la cuenta.


## Fase 37 — Google Ads y catálogo

La consulta de productos de Shopping puede sincronizar KPI al catálogo por coincidencia exacta y única entre `segments.product_item_id` y `SKU`. Los campos se guardan como `Ads_*`, sin sobrescribir GSC/GA4. Los SKU duplicados o sin coincidencia se reportan y no se asignan a ciegas. Ver `FASE_37_VINCULACION_ADS_CATALOGO.md`.


## Fase 38 — Sincronización central de Google Ads

Google Ads ahora participa en la acción de sincronización central si el ID de cliente está guardado en Integraciones. Se consultan campañas en modo de solo lectura y se intentan sincronizar métricas de Shopping al catálogo por SKU/item_id exacto y único. La fuente informa configuración faltante, errores, filas y resultados de asociación. Merchant Center y Trends siguen pendientes. Consulta `FASE_38_SINCRONIZACION_CENTRAL_ADS.md` para límites y validación manual.

## Fase 39 — Auditoría final y estabilización

Consulta `FASE_39_AUDITORIA_FINAL_ESTABILIZACION.md` para el resultado de la suite local, validaciones manuales pendientes y limitaciones conocidas.

## Fase 40 — Inteligencia de búsquedas
La herramienta incluye ahora una sección independiente `Inteligencia de búsquedas` en el menú principal. Consulta la documentación `FASE_40_INTELIGENCIA_BUSQUEDAS.md` para el alcance, la persistencia local, los filtros y las limitaciones de asociación entre términos y productos. Para poblarla, consulta Search Console con dimensiones `Consulta + página` y Google Ads con el informe `Términos de búsqueda`.


## Fase 41
Mejoras de rendimiento de tablas GSC/Inteligencia de búsquedas, paginación de 100 filas y eventos de actualización al completar consultas. Consulta `FASE_41_RENDIMIENTO_SEARCH_CONSOLE.md`.
