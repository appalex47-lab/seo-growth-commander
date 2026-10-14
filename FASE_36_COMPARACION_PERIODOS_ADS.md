# Fase 36 — Comparación de periodos en Google Ads

## Objetivo
Comparar los KPI del periodo global seleccionado con el periodo inmediatamente anterior de igual duración, para los informes de campañas, productos de Shopping y términos de búsqueda.

## Cambios
- La consulta de Ads solicita también el rango anterior equivalente, usando la función compartida `previousEquivalentRange`.
- Añade tabla comparativa de impresiones, clics, gasto, conversiones, valor de conversiones, CTR, CPC, CPA y ROAS.
- Presenta ambos rangos de fechas de forma explícita.
- Cuando el periodo anterior no tiene base (valor cero) indica “Sin base” en vez de inventar una variación porcentual.
- Si falla la consulta del periodo anterior, conserva el informe actual y muestra el aviso del error.
- Mantiene consultas de solo lectura; no modifica campañas ni presupuestos.

## Interpretación
La variación porcentual se calcula como (actual − anterior) / |anterior| × 100. Las métricas derivadas se calculan con los totales de cada rango, no promediando CTR/CPC/CPA/ROAS de filas individuales. ROAS no es utilidad neta. El gasto se muestra con formato MXN orientativo: confirmar la moneda configurada en la cuenta antes de tomar decisiones.

## Límites
- Las comparaciones dependen de los datos disponibles y del permiso de Google Ads API.
- Los términos pueden repetirse entre grupos de anuncios; los totales agregados suman las filas devueltas por Ads. La atribución de un término a una ficha de producto sigue pendiente de una vista específica con URL de destino validada.
- La validación automatizada no sustituye una prueba real autenticada con la cuenta del usuario.
