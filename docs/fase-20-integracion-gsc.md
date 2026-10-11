# Fase 20 — Integración de GSC con sincronización determinista

## Objetivo
Conectar las observaciones normalizadas de Search Console con el mecanismo de sincronización por SKU, sin colapsar dimensiones que cambien la granularidad.

## Contrato
`pipeline.gsc_observations.synchronize_gsc_response(catalog, response, dimensions, synced_at=None, expected_ctr=0.10)`

- Acepta respuesta cruda con `rows[].keys` y métricas GSC.
- Valida y conserva dimensiones y orden de claves.
- Solo permite actualizar métricas de producto si `dimensions == ["page"]`.
- Mapea por URL exacta normalizada solo quitando `/` final; URLs ambiguas/no encontradas quedan reportadas.
- Ejecuta `synchronize_batch` para aplicar los campos GSC permitidos, trazar sincronización y recalcular reglas deterministas.
- Para otros granos retorna `observations_only`; no modifica el catálogo.

## Pruebas y aceptación
- Página única mapea a SKU y conserva `_sync.gsc`.
- Page+query no actualiza producto y conserva consulta en la observación.
- URL no encontrada se reporta y no crea producto.
- Suite completa: 80 tests; CI local con sintaxis JS, compilación Python, JSON y smoke HTTP.

## Límites
La función ya integra localmente normalización y consolidación, pero no se afirma que la interfaz llame esta función en producción ni que se haya ejecutado OAuth/sincronización contra una cuenta Google real. El gateway usa tokens en memoria. No desplegar con datos reales hasta implementar persistencia segura de tokens, autenticación/autorización de usuario, protección CSRF/rate limit, reintentos, paginación/partición de consultas y prueba E2E contra una propiedad autorizada.
