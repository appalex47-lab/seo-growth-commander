# Fase 18 — Sincronización, normalización y calidad de datos

## Alcance entregado
- Nuevo `pipeline.synchronization.synchronize_batch`: aplica lotes ya obtenidos por adaptadores, no hace llamadas de red ni administra credenciales.
- Consolidación por SKU; si la fila no trae SKU, se permite resolver por URL únicamente cuando coincide con una sola ficha del catálogo.
- Rechazo explícito de filas no válidas, SKU ausente, SKU repetido dentro del lote y productos desconocidos.
- Una fuente solo actualiza los campos que le pertenecen y que vienen presentes; un campo ausente no borra el valor anterior.
- Trazabilidad `_sync[source]` con fecha UTC, hash de fila, estado y número de fila.
- Resumen de lote: recibidas, aceptadas, actualizadas, sin cambio, rechazadas, errores, hash de lote y cobertura/frescura por fuente.
- Las métricas calculadas se regeneran con `calculate_product`; el proceso no delega matemáticas a Cohere.

## Límites explícitos
- No programa sincronizaciones, no guarda lotes en base de datos y no realiza peticiones reales a Google.
- El caller debe persistir el resultado en el almacén seguro elegido para producción.
- `synced_at` indica cuándo se procesó el lote, no necesariamente la fecha más reciente de los datos en el proveedor.
- La resolución por URL es exacta tras quitar `/` final; no hace fuzzy matching.
- GA4 y GSC pueden tener granularidades distintas. No deben sumarse filas de consulta y página como si fueran productos sin una agregación definida por el consumidor.

## Validación
`tests/test_phase18.py` cubre actualización y recálculo, retención de campos omitidos, duplicados, SKU desconocido, mapeo por URL único, cobertura de fuente y rechazo de fuente desconocida.

## Criterios de aceptación
1. Una fila de una fuente no modifica campos propiedad de otras fuentes.
2. Una fuente que omite un campo no lo pone en cero ni lo borra.
3. No se crean productos desconocidos de manera silenciosa.
4. Toda fila rechazada tiene razón explícita.
5. Se preservan productos no incluidos en el lote.
6. Se recalculan los campos derivados con el motor determinista existente.
7. La cobertura de fuente informa productos sincronizados y faltantes.
