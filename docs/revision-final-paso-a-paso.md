# Lista de revisión manual final

1. Descomprime la fase en una carpeta limpia; no mezcles archivos con la versión publicada.
2. Ejecuta `python scripts/ci_check.py`; confirma `CI_CHECK_OK` y 80 tests aprobados.
3. Abre `index.html` mediante un servidor local (por ejemplo, `python -m http.server 8000`) y revisa que todos los módulos carguen sin errores en consola.
4. En Catálogo y datos, importa un CSV/XLSX pequeño con SKU, nombre y URL; confirma vista previa, errores de validación y persistencia tras recargar.
5. Prueba una importación incremental: un SKU nuevo, uno existente y uno omitido. Confirma que el producto omitido no se borre y que las celdas vacías no borren datos existentes.
6. En Integraciones, confirma que la interfaz explica claramente si GSC/GA4 están desconectados; no interpretes la presencia de un endpoint como conexión real.
7. Para GSC, prueba localmente una respuesta con dimensión `page`: la URL exacta debe mapear a un único SKU, actualizar clicks/impresiones/CTR/posición y registrar `_sync.gsc`.
8. Prueba `page+query`: la consulta debe permanecer en las observaciones y NO actualizar totales de producto.
9. Prueba URL desconocida y URL duplicada en catálogo: ambas deben quedar como excepciones; ninguna debe asignarse arbitrariamente.
10. Verifica que GSC no sobrescriba campos que no le pertenecen y que el motor determinista siga calculando Revenue Gap, clasificación y prioridad.
11. Prueba fechas inválidas, dimensiones no permitidas, respuestas vacías y errores del gateway; deben mostrarse errores controlados sin filtrar tokens.
12. Antes de activar OAuth real, configura secretos solo en el backend, usa HTTPS, agrega almacenamiento seguro de tokens, autenticación/autorización de usuarios, protección CSRF y límites de uso.
13. Con una cuenta de prueba autorizada, valida una consulta real de GSC, verifica que el sitio tenga el formato correcto (URL-prefix o Domain property) y compara algunas filas con la interfaz de Search Console.
14. Revisa GA4 por separado: propiedad, rango de fechas, dimensiones/métricas compatibles y moneda/unidades. No mezcles GA4 con GSC como si midieran lo mismo.
15. Prueba despliegue en un entorno de staging; confirma logs sin secretos, manejo de expiración/revocación, reintentos y recuperación ante fallos.
16. Solo después de pasar los pasos anteriores, publicar el release y registrar versión, commit, fecha, evidencias de pruebas y limitaciones conocidas.

## No aprobar producción si
- La suite automatizada falla.
- `page+query` puede sobrescribir métricas agregadas por producto.
- Hay tokens o secretos en frontend, localStorage, IndexedDB, logs o repositorio.
- Se declara conexión real sin una consulta real verificada.
- Una URL desconocida/ambigua se atribuye a un SKU por aproximación.
