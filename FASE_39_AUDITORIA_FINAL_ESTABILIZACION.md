# Fase 39 — Auditoría final y estabilización

## Alcance
Auditoría de regresión del paquete heredado de la Fase 38. No se modifican las conexiones OAuth ni se simulan respuestas de Google. Esta fase valida las comprobaciones automatizadas del repositorio y documenta los límites que requieren una prueba autenticada en GitHub Pages.

## Resultado de la validación local
- Suite Python: **142 pruebas aprobadas**.
- `scripts/ci_check.py`: **CI_CHECK_OK**.
- `node --check`: todos los módulos JavaScript listados por CI pasaron la comprobación de sintaxis.
- Compilación Python de los módulos del pipeline: aprobada.
- JSON de datos/contratos: validado por CI.
- HTTP smoke check: aprobado según la salida de CI.

## Pruebas manuales necesarias tras desplegar
1. Abrir la aplicación publicada y comprobar menú, navegación y consola del navegador.
2. Confirmar que Search Console y GA4 conservan sus conexiones y devuelven métricas reales.
3. Ejecutar sincronización central con Ads configurado y comprobar estados por fuente; después probar con Ads sin configurar y con un fallo de consulta.
4. Revisar el periodo global y que los periodos comparados sean equivalentes.
5. Validar con la cuenta publicitaria real los términos de búsqueda, moneda de gasto, conversiones y valor de conversión.
6. Confirmar que la sincronización no crea ni modifica campañas y que no guarda tokens OAuth en localStorage.

## Limitaciones conocidas
- Las pruebas locales no confirman autorización OAuth ni respuestas reales de Google Ads, Search Console o GA4.
- La disponibilidad de términos de búsqueda está sujeta a las políticas, umbrales y campos devueltos por Google Ads.
- El enlace de términos de búsqueda con fichas individuales de producto no se considera implementado por esta auditoría; requiere una vista y lógica propias con evidencia de asociación.
- Merchant Center y Google Trends no quedan habilitados por esta fase.

## Siguiente trabajo recomendado
Después de esta auditoría, planear una vista específica que conecte los términos de búsqueda con cada producto y permita comparar sus KPI, separando claramente SEO orgánico (Search Console) y publicidad pagada (Google Ads). Debe mostrar URL/ID que sustenta la asociación, método de vinculación, periodo, clics, impresiones, CTR, posición para SEO y gasto, conversiones, CPA, valor de conversión y ROAS para Ads cuando esos campos estén disponibles. No inferir ni inventar asociaciones ni métricas ausentes.
