# Fase 32 — Auditoría final GA4 + Search Console

## Alcance
Esta fase entrega una lista operativa para validar la versión publicada y delimita qué se ha comprobado localmente frente a qué exige una cuenta Google real. No afirma que el OAuth, GA4 o GSC hayan sido probados en producción.

## Estado de validación
- Pruebas automatizadas locales: ejecutar `pytest -q` en la raíz del proyecto; resultado al preparar esta entrega: 124 aprobadas.
- Sintaxis JavaScript: revisar todos los `frontend/js/*.js` con `node --check`.
- ZIP: validar con `unzip -t`.
- No validado por esta fase: sesión OAuth real, respuestas actuales de GA4/GSC, despliegue en GitHub Pages, persistencia en el navegador del usuario y comparación numérica con la interfaz de Google Analytics/Search Console.

## Lista de auditoría antes de dar por terminada la integración

### A. Publicación y conservación
- [ ] Descargar y descomprimir el ZIP completo.
- [ ] Comparar su carpeta raíz con la estructura del repositorio antes de subirlo.
- [ ] Subir los archivos actualizados sin borrar archivos ajenos a la fase.
- [ ] Confirmar que GitHub Actions finalizó correctamente y que GitHub Pages muestra la versión nueva.
- [ ] Recargar con caché limpia y confirmar que no aparecen errores JavaScript en la consola.

### B. Google Cloud y OAuth
- [ ] Confirmar que el Client ID pertenece al proyecto de Google Cloud correcto.
- [ ] Verificar que el origen autorizado sea exactamente `https://appalex47-lab.github.io` (sin la ruta del repositorio).
- [ ] Confirmar que Google Analytics Data API está habilitada.
- [ ] Confirmar usuario autorizado, pantalla de consentimiento y permisos de solo lectura necesarios.
- [ ] No poner Client Secret en frontend, HTML, JavaScript ni repositorio. Si se expuso previamente, rotarlo/revocarlo.
- [ ] Confirmar que la aplicación no persiste access tokens en `localStorage`.

### C. GA4: conexión y propiedad
- [ ] Usar el Property ID numérico, no el Measurement ID `G-...` ni el ID del flujo web.
- [ ] Autorizar con una cuenta que tenga acceso de lectura a esa propiedad.
- [ ] Ejecutar una consulta manual y comprobar que se muestra éxito o un error explicativo (sin falsa confirmación).
- [ ] Comparar fechas, zona horaria y totales con el informe de GA4 para el mismo alcance.
- [ ] Probar periodo actual parcial, periodo sin datos y periodo anterior equivalente.
- [ ] Probar canal `organic` y canal `all`; confirmar que los totales cambian de forma coherente y que `organic` usa el grupo de canales predeterminado Organic Search.
- [ ] Revisar si la métrica de ingresos corresponde a `purchaseRevenue` y compararla con GA4. No tratarla automáticamente como ventas netas contables.
- [ ] Verificar que los eventos clave y compras estén configurados y tengan datos en la propiedad.

### D. Search Console
- [ ] Confirmar que la propiedad seleccionada corresponde al dominio/protocolo correcto.
- [ ] Ejecutar una consulta para un periodo y URL conocidos.
- [ ] Comparar clics, impresiones, CTR y posición con Search Console, considerando sus retrasos de procesamiento.
- [ ] Confirmar que no se etiqueta impresiones de GSC como volumen total de búsquedas de mercado.
- [ ] Comprobar canonicalización de URL: protocolo, `www`, query string, fragmentos y slash final.
- [ ] Verificar que una URL que coincida con varios SKU se marque como ambigua y no asigne métricas automáticamente.

### E. Catálogo, atribución y persistencia
- [ ] Asegurar que el catálogo activo es el catálogo real antes de sincronizar.
- [ ] Comprobar que catálogos de demostración/prueba no reciben métricas reales.
- [ ] Elegir una URL de destino que exista en GA4 y esté asignada a un único SKU.
- [ ] Confirmar que Product Lookup y Backlog muestran las métricas y el periodo de actualización.
- [ ] Verificar que las URLs no coincidentes y ambiguas se reporten explícitamente.
- [ ] Recargar la aplicación y comprobar que las métricas persisten.
- [ ] No sumar usuarios únicos de varias páginas como si fueran usuarios únicos del sitio.
- [ ] No atribuir automáticamente todos los ingresos de una landing a un SKU si la medición no respalda esa granularidad.

### F. Sincronización centralizada y otras fuentes
- [ ] Ejecutar «Sincronizar información» y revisar por fuente el resultado, periodo y errores.
- [ ] Confirmar que un fallo de GA4 no oculta un resultado correcto de GSC, y viceversa.
- [ ] Verificar que las fuentes aún no implementadas (Merchant Center, Google Ads y Trends) sigan marcadas como pendientes y no generen datos ficticios.
- [ ] Confirmar que ninguna navegación ni sincronización invoque automáticamente el diagnóstico de IA; debe ser manual para controlar consumo de Cohere.

## Criterios de aceptación
La integración puede declararse validada solo cuando: (1) las pruebas locales pasan; (2) la versión desplegada no tiene errores de consola; (3) GA4 y GSC devuelven datos reales con permisos de solo lectura; (4) una muestra de cifras coincide con sus informes de Google para el mismo periodo, propiedad, canal y dimensión; (5) las métricas se conservan tras recargar; y (6) los casos ambiguos, sin datos y de error se muestran sin inventar resultados.

## Limitaciones
La prueba automatizada no confirma credenciales, permisos, propiedad seleccionada, disponibilidad de datos, calidad de etiquetado, latencia de Google ni funcionamiento del despliegue publicado. Estos puntos requieren la auditoría manual de arriba.
