# Fase 30 — Integración de GA4 con catálogo y fichas de producto

## Cambios
- Añade `syncGA4LandingPagesToCatalog`, que agrega sesiones, usuarios, vistas, eventos clave e ingresos por landing page.
- Solo escribe en el catálogo activo si su fuente es `real`; no modifica catálogos de prueba/escenario.
- Solo asigna métricas cuando la URL canónica coincide con una ficha única. Las coincidencias ambiguas se omiten.
- Guarda canal y periodo de la consulta junto con estado y fecha de actualización.
- La consulta manual de GA4 y la sincronización centralizada intentan obtener el desglose por landing page y vincularlo con el catálogo.
- Product Lookup y Backlog muestran métricas GA4 guardadas y el periodo correspondiente.

## Consideraciones
- GA4 informa sobre landing pages, no necesariamente vistas de producto. La coincidencia por URL es una asociación operativa y no demuestra que una sesión o ingreso haya sido causado por un SKU.
- Usuarios por landing page no deben sumarse para reconstruir usuarios únicos del sitio, porque un usuario puede visitar varias páginas.
- Ingresos reflejan la moneda configurada en GA4; el formato visual no realiza conversión de moneda.
- Las métricas solo se actualizan tras una consulta real y con el canal/periodo mostrados.
- No se validó OAuth/API contra la propiedad real ni se ejecutó una prueba visual en navegador en esta fase.
