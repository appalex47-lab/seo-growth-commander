# Fase 31 — Sincronización centralizada GA4

## Objetivo
Consolidar la consulta de GA4 dentro de “Sincronizar información” y mostrar el resultado de sincronización con el catálogo sin ocultar URLs no emparejadas ni ambiguas.

## Alcance
- Respeta el periodo global seleccionado.
- Usa el filtro de canal configurado en GA4: `organic` (predeterminado) o `all`.
- El resumen central informa propiedad, canal, periodo, métricas agregadas y resultado de asociación con catálogo.
- La respuesta de GA4 incluye el objeto `productSync` para que la interfaz pueda informar actualizaciones, URLs no emparejadas y URLs ambiguas.
- Mantiene las fuentes no implementadas (Merchant Center, Google Ads y Trends) marcadas como pendientes; no simula datos.

## Sobre ventas por canal
No está limitado técnicamente a Organic Search: el filtro `organic` consulta el grupo de canales predeterminado “Organic Search”; `all` no aplica ese filtro e incluye todos los canales disponibles en la propiedad. El selector de configuración determina cuál se usa. El nombre `purchaseRevenue` representa ingresos de compra registrados por GA4; no garantiza por sí mismo que sean ventas netas contables ni que cada ingreso pertenezca a un SKU.

## Validación pendiente
Las pruebas locales no sustituyen la consulta en la propiedad real, la revisión del selector de canal ni la comprobación de datos persistidos en GitHub Pages.
