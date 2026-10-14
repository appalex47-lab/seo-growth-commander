# Fase 41 — Rendimiento de Search Console y actualización de Inteligencia de búsquedas

## Cambios
- La tabla de resultados de Search Console pagina 100 filas por vista; las 5,000 filas siguen disponibles mediante Anterior/Siguiente.
- Inteligencia de búsquedas pagina 100 filas y vuelve a leer los resultados guardados cuando termina una consulta GSC o Ads, sin navegar fuera de la sección.
- La consulta GSC emite un evento de actualización para que otras vistas abiertas en la misma aplicación puedan refrescarse.
- El guardado del resultado GSC captura errores de almacenamiento para no ocultarlos y muestra un aviso si el navegador no puede persistir los datos.
- No se cambia el límite de API ni se descartan filas intencionalmente.

## Validación
Ejecutar `python scripts/ci_check.py`. Las pruebas estáticas y de sintaxis no sustituyen una prueba autenticada contra la cuenta real de Google; esa prueba debe hacerse en GitHub Pages.

## Instalación
Subir el contenido del ZIP a la raíz del repositorio sin borrar archivos no relacionados. Conservar los archivos existentes y reemplazar únicamente los homónimos incluidos en el ZIP.
