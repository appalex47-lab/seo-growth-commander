# Fase 29 — GA4: métricas, dimensiones y periodos

## Cambios
- Selector de desglose de reporte: día, página de destino, fuente/medio y grupo de canales predeterminado de GA4.
- Métricas de sesiones, usuarios, vistas de página, eventos clave e ingresos de compra.
- Comparación del periodo seleccionado con el periodo anterior equivalente en duración.
- Para reportes desglosados, las métricas actuales se agregan antes de compararse con el total del periodo anterior; no se toma únicamente la primera fila como total.
- Se conserva el selector global de periodos y el filtro de Organic Search / todos los canales.
- La moneda de ingresos no se presupone; se indica que corresponde a la moneda configurada en GA4.

## Validación local
Ejecutar `python -m pytest -q` y `node --check` en cada archivo JavaScript del proyecto.

## Pendiente de validación real
La suite local no acredita autorización OAuth, datos de propiedad, compatibilidad de cada dimensión con la propiedad ni concordancia con la interfaz de GA4. Se debe validar en GitHub Pages con el Property ID real.
