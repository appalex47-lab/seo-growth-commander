# Fase 16 — Plantilla y actualización incremental del catálogo

## Objetivo
Cerrar la importación del catálogo con una plantilla oficial y comportamiento seguro al volver a cargar SKUs existentes.

## Cambios
- Se eliminó el botón de navegación duplicado `Catálogo y datos`.
- Se eliminó la segunda inclusión duplicada de SheetJS; el CDN aparece una sola vez.
- Se agregaron descargas de machote CSV y Excel XLSX. El XLSX contiene `Catalogo`, `Diccionario` e `Instrucciones`; el CSV incluye encabezados y una fila de ejemplo marcada para eliminar.
- La plantilla incluye todos los campos que reconoce el importador: `SKU`, `Nombre_Producto`, `URL_Slug`, `Marca`, `Sustancia_Activa`, `Categoria`, `Stock`, `Precio`, `Impresiones_GSC`, `Clicks_GSC`, `CTR_GSC`, `Posicion_GSC`, `Sesiones_Organicas`, `Conversion_Rate`, `AOV`, `Volumen_Mercado`, `Tendencia_Mercado`, `Tendencia_Marca`, `Tendencia_Sustancia`, `CPC`, `Gasto_Ads`.
- La importación válida combina por SKU contra el catálogo real existente: añade SKUs nuevos, actualiza los existentes y conserva los valores previos cuando un campo de la nueva carga viene vacío. Los productos no incluidos en el archivo se conservan.
- La pantalla informa conteos de productos nuevos, actualizados y sin cambios.
- El catálogo real permanece en su registro IndexedDB independiente del dataset de prueba. Al importar, el catálogo real pasa a estar activo.

## Reglas y limitaciones
- Obligatorios: `SKU`, `Nombre_Producto`, `URL_Slug`.
- Los SKU duplicados dentro del mismo archivo y los errores estructurales bloquean la importación completa.
- Un campo vacío no borra un valor existente; esta decisión evita borrar datos accidentalmente. Para limpiar un valor se necesita una futura acción explícita de edición/borrado de campo.
- La plantilla XLSX necesita que SheetJS esté disponible. Si el CDN no está cargado, el botón de Excel descarga CSV como alternativa; el botón de CSV siempre está disponible.
- La plantilla es orientativa; no aporta datos reales de Google ni de Cohere.

## Verificación
La CI de esta fase incluye tests automatizados de estructura: unicidad del botón de navegación, unicidad del script XLSX, existencia de campos requeridos en la plantilla/importador, lógica de merge por SKU y documentación. Los tests de Python/JS y smoke HTTP se ejecutan por `scripts/ci_check.py`.

## No cubierto
No se afirma haber realizado pruebas E2E en navegador real ni sincronización multiusuario/dispositivos. Las integraciones reales de Google y Cohere permanecen en fases posteriores.
