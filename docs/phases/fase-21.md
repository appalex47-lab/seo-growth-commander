# Fase 21 — Detección automática de columnas del catálogo

## Objetivo
Eliminar la obligación de relacionar manualmente cada columna al cargar CSV/XLSX. El importador detecta automáticamente encabezados conocidos y deja la edición manual como una opción secundaria.

## Cambios
- La pantalla informa cuántas columnas/filas leyó y cuántos campos reconoció automáticamente.
- Los encabezados conocidos se asignan usando nombres normalizados (sin distinguir mayúsculas, acentos, guiones bajos, guiones ni espacios).
- Los campos ambiguos no se asignan automáticamente; se muestran como conflicto para evitar atribuciones arbitrarias.
- La sección `Ajustar asignaciones (opcional)` está plegada inicialmente.
- Los campos obligatorios faltantes se explican antes de validar/importar.
- Se mantienen validación estructural, vista previa, importación incremental por SKU y conservación de campos entrantes vacíos.

## Criterios de aceptación
1. El CSV con encabezados `SKU`, `Nombre_Producto`, `URL_Slug`, `Stock`, `Precio`, `Categoria` reconoce esos campos sin abrir el mapeo manual.
2. La pantalla deja visible la revisión automática y permite validar.
3. Los campos requeridos no reconocidos se reportan y la validación no permite una importación inválida.
4. El usuario puede desplegar el mapeo y corregirlo voluntariamente.
5. Los encabezados ambiguos no se asignan automáticamente.

## Alcance y limitaciones de pruebas
Las pruebas incluidas son pruebas automatizadas de regresión/estructura y sintaxis. No sustituyen una prueba E2E en navegador con la app publicada ni confirman la compatibilidad de todos los formatos CSV/XLSX posibles. No se ha desplegado esta fase en GitHub Pages.


## Siguiente fase
La Fase 22 incorpora una interfaz operativa para consultas reales de Search Console. Ver `fase-22-search-console.md`.
