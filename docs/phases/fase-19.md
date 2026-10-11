# Fase 19 — Granularidad nativa de Google Search Console

## Objetivo
Preservar la granularidad que devuelve Search Analytics API y evitar que datos por consulta, fecha, dispositivo o país se conviertan accidentalmente en totales de producto.

## Cambios
- `pipeline/gsc_observations.py` normaliza respuestas GSC conservando cada fila y su combinación explícita de dimensiones.
- Las dimensiones permitidas son `page`, `query`, `country`, `device`, `searchAppearance` y `date`.
- Solo una consulta cuya dimensión sea exactamente `page` se puede mapear automáticamente al catálogo por URL. Las consultas `page+query`, `page+date`, etc. permanecen como observaciones y no actualizan métricas de producto.
- URLs sin coincidencia se reportan como `unmatched_url`; URLs duplicadas en el catálogo se reportan como `ambiguous_url`.
- La capa no suma ni mezcla granos distintos y no cambia los cálculos deterministas existentes.

## Contrato
`normalize_gsc_response(response, dimensions)` devuelve `source`, `dimensions`, `grain`, `row_count`, `observations`, `product_mapping_allowed` y `mapping_reason`.
`map_page_observations_to_catalog(normalized, catalog)` bloquea explícitamente cualquier grano que no sea exclusivamente `page`.

## Límites honestos
Esta fase prepara la normalización y el mapeo local; no realiza OAuth, llamadas reales a Google, persistencia de observaciones ni sincronización programada. El endpoint GSC de la fase 17 puede consultar varias dimensiones, pero esta nueva capa debe integrarse en el flujo real de sincronización antes de afirmar que toda la aplicación consume estas observaciones en producción.

## Criterios de aceptación
- Mantener las filas y claves `page+query` separadas.
- Bloquear mapeo a producto si existe cualquier dimensión adicional a `page`.
- Mapear solo URL única y reportar URL no encontrada/ambigua.
- Rechazar dimensiones inválidas y respuestas con `keys` inconsistentes.
- Pasar suite completa de pruebas existente más pruebas específicas de fase 19.
