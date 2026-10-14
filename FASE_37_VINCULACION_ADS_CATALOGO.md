# Fase 37 — Vinculación de productos de Google Ads con el catálogo

## Objetivo
Conectar el rendimiento de productos de Shopping con los productos del catálogo local usando una clave exacta y auditable, sin inferir asociaciones ambiguas.

## Cambios
- Al consultar el informe de productos de Shopping, se agregan las filas por `segments.product_item_id`.
- Se busca una coincidencia exacta y única con `SKU` del catálogo activo.
- Para coincidencias únicas se guardan impresiones, clics, gasto, conversiones, valor de conversiones, CTR, CPC, CPA y ROAS, junto con fechas y marca temporal.
- El resumen muestra cuántos productos se actualizaron, cuántos no tienen coincidencia y cuántos SKU resultan ambiguos.
- No sobrescribe las métricas de GSC ni GA4. La actualización es aditiva mediante campos `Ads_*`.
- No vincula términos de búsqueda con fichas de producto: esa vista específica sigue pendiente y requiere una relación comprobada con la URL de destino.

## Límites
- La coincidencia se basa en SKU exacto contra `segments.product_item_id`. Si Merchant Center utiliza identificadores diferentes a los SKU internos, se necesita una tabla de equivalencias validada.
- Solo se actualiza el catálogo si existe un SKU único; duplicados se reportan como ambiguos y no se escriben.
- Las métricas de Shopping pueden tener reglas de atribución propias; sus totales de clics/impresiones no necesariamente coinciden con los totales de campaña.
- La validación local no sustituye una prueba autenticada contra la cuenta real.
