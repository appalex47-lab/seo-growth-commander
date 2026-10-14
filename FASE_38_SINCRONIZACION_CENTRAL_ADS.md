# Fase 38 — Google Ads en la sincronización central

## Objetivo
Incorporar Google Ads a la acción **Sincronizar información** sin alterar las conexiones ya funcionales de Search Console y GA4.

## Comportamiento
- Usa el ID de cliente de Google Ads guardado en Integraciones y el mismo periodo global.
- Consulta campañas en modo de solo lectura y guarda el resumen real del periodo.
- Intenta consultar Shopping y sincronizar métricas por coincidencia exacta y única entre `segments.product_item_id` y `SKU`.
- Informa filas, clics, gasto reportado, productos actualizados, productos sin coincidencia y SKU ambiguos.
- Si la consulta de Shopping falla, conserva el resultado de campañas y registra el motivo en el resumen de la fuente.
- Si Ads no está configurado, la fuente queda como `needs_setup`; no se inventan datos.
- Merchant Center y Trends siguen indicándose como no implementados.

## Seguridad y límites
- Todas las consultas son de solo lectura; no se crean ni modifican campañas, presupuestos o anuncios.
- No se guarda el token OAuth en `localStorage`.
- La moneda del gasto debe interpretarse según la moneda real de la cuenta; no se debe asumir MXN en análisis financieros.
- La asociación de Shopping es exacta por SKU/item_id; no se asocian términos de búsqueda a productos en esta fase.
- La prueba local no equivale a una prueba autenticada con la cuenta real de Ads.

## Validación
Se ejecuta la suite completa, comprobación de sintaxis de todos los módulos JavaScript y CI local. Tras desplegar, validar manualmente en GitHub Pages que el usuario tenga el scope `https://www.googleapis.com/auth/adwords`, que la API y el nivel de acceso estén habilitados y que el ID de cliente permita consultar campañas.
