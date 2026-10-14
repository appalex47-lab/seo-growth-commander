# Fase 40 — Inteligencia de búsquedas

## Objetivo
Añadir una sección independiente al menú principal que consolide la exploración de consultas orgánicas de Search Console y términos de búsqueda pagados de Google Ads, sin mezclar sus KPI ni inventar asociaciones producto-término.

## Alcance implementado
- Nueva sección `Inteligencia de búsquedas` en el menú principal.
- Captura local de la última consulta de Search Console en `gssc.gsc.last-query.v1`, incluyendo propiedad, periodo, dimensiones y filas. Solo se guardan filas de consulta + página para el análisis orgánico.
- Lectura del último informe de Google Ads guardado en `gssc.googleads.last-report.v1`; solo se tratan como términos pagados cuando el informe guardado tiene `view=searchTerms`.
- Filtros de producto, fuente y texto de búsqueda.
- KPI de filas disponibles, periodo de la última consulta y cantidad de productos del catálogo.
- Tabla con impresiones, clics, CTR y posición para SEO; impresiones, clics, CTR, gasto, conversiones, valor de conversión y ROAS para Ads, cuando están disponibles.
- Asociación orgánica solo por coincidencia exacta de URL de página con URL de ficha del catálogo.
- Términos de Ads se muestran como no asociados hasta que exista una relación de producto comprobable. No se atribuyen por similitud textual.
- Estados vacíos que indican qué consulta ejecutar en Integraciones.
- Diseño adaptable a móvil y escritorio, con tabla desplazable horizontalmente sin forzar el ancho del resto de la página.

## Fuera de alcance / limitaciones explícitas
- No consulta APIs directamente desde esta vista; reutiliza los últimos resultados guardados por los módulos existentes.
- Para refrescar datos hay que ejecutar Search Console con dimensiones `Consulta + página` y Google Ads con el informe `Términos de búsqueda` en Integraciones.
- El selector global se muestra como contexto; si cambia, la vista advierte que las consultas guardadas deben volver a ejecutarse. No presenta datos antiguos como si pertenecieran al nuevo rango.
- Los términos de búsqueda de Google Ads no incluyen necesariamente una URL de destino en el informe. El vínculo pagado con producto queda pendiente de una señal verificable (por ejemplo, informe de producto/Shopping, landing page accesible o relación de campaña documentada).
- Search Console puede omitir consultas de bajo volumen y no representa el volumen absoluto de búsquedas del mercado.

## Pruebas
Se agregaron pruebas estáticas de la nueva navegación, persistencia de resultados orgánicos, lectura del informe Ads y reglas de asociación. Ejecutar `python scripts/ci_check.py` antes de publicar. Las consultas reales OAuth/API y el render en GitHub Pages requieren validación manual después del despliegue.

## Instalación
Subir los archivos del ZIP al repositorio, reemplazando solo los archivos del mismo proyecto y conservando otros archivos ajenos. Esperar GitHub Actions y abrir `Inteligencia de búsquedas`.
