# Fase 35 — Términos de búsqueda de Google Ads

## Objetivo
Dar visibilidad a las búsquedas que activaron anuncios y sus KPI, sin confundir términos de búsqueda con las palabras clave configuradas en la campaña ni con consultas orgánicas.

## Cambios
- Añade `Términos de búsqueda` al selector de informe de Google Ads.
- Consulta `search_term_view` en modo de solo lectura para el periodo global.
- Muestra término de búsqueda, grupo de anuncios/campaña e impresiones, clics, gasto, CTR, CPC, conversiones, CPA, valor de conversiones y ROAS.
- Conserva los informes existentes de campañas y productos de Shopping.
- No inventa términos que Google Ads omita por privacidad o volumen bajo.

## Dónde ver las búsquedas orgánicas por producto
En Integraciones → Search Console, selecciona la dimensión `Consulta + página`. Filtra/identifica la URL de la ficha y revisa las consultas con clics, impresiones, CTR y posición media. La API de Search Console puede omitir consultas anonimizadas y no representa el 100 % de todas las búsquedas.

## Límites importantes
- Los términos de Google Ads muestran búsquedas que activaron anuncios, no todas las búsquedas orgánicas.
- El informe de términos de búsqueda de Ads no se asigna automáticamente a una ficha de producto: una consulta puede activar anuncios/campañas con distintas páginas de destino. El vínculo por producto requiere usar la URL de destino disponible o una relación adicional validada; no se infiere sin evidencia.
- Los KPI de conversiones y valor dependen de la configuración de medición y atribución de la cuenta.
- Algunas consultas pueden no aparecer por los umbrales de privacidad de Google.

## Validación
Se ejecutan pruebas automatizadas del repositorio y comprobación sintáctica de los módulos JavaScript. Esto no sustituye una consulta en vivo con OAuth y una cuenta Google Ads autorizada.
