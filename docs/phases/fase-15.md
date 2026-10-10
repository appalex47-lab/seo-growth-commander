# Fase 15 — Catálogo y datos reales

## Objetivo
Permitir importar y administrar un catálogo propio sin confundirlo con los datasets de prueba.

## Implementado
- Nuevo módulo de navegación **Catálogo y datos**.
- Importación de CSV con delimitador detectado (coma, punto y coma o tabulador) y soporte de comillas.
- Importación XLS/XLSX mediante SheetJS CDN; requiere que el navegador pueda descargar la biblioteca. Si no está disponible, se informa y se ofrece CSV como alternativa.
- Detección inicial de encabezados y mapeo manual de campos.
- Vista previa de ocho filas y validación de SKU/nombre/URL, duplicados, números y forma de URL.
- Confirmación explícita antes de activar un archivo; no se activa el archivo si hay errores estructurales.
- Persistencia local con IndexedDB y exportación del catálogo activo a CSV.
- Almacenamiento independiente de datasets test/real/escenario; borrar datos de prueba no elimina el catálogo real.
- El análisis usa el pipeline determinista existente; no se inventan métricas faltantes.

## Limitaciones conocidas
- La importación sucede en el navegador actual y no sincroniza entre dispositivos.
- No hay todavía actualización incremental/merge de SKU; la importación confirmada reemplaza el dataset activo, conservando guardados los datasets de prueba y real por separado.
- El mapeo permite importar los campos reconocidos; las métricas ausentes quedan nulas.
- No implementa conexiones reales a Google ni a Cohere; son fases posteriores.
- El lector XLSX usa CDN. Para despliegue sin internet, debe incluirse localmente una copia verificada de SheetJS.

## Pruebas de aceptación
1. Navegar a Catálogo y datos sin dataset activo no rompe la interfaz.
2. CSV con encabezados reconocidos ofrece mapeo y vista previa.
3. SKU duplicado o campos obligatorios vacíos bloquean la importación.
4. Un archivo válido puede activarse y guardarse en IndexedDB.
5. La exportación genera CSV.
6. Borrar dataset de prueba no borra el catálogo real guardado.
7. GitHub Actions valida sintaxis, tests existentes y smoke HTTP.
