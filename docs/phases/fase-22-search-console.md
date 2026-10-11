# Fase 22 — Integración operativa de Google Search Console

## Incluido
- Panel de consulta de Search Console en Integraciones.
- Consulta OAuth existente del gateway y `POST /api/sync/gsc/query`.
- Propiedad manual con soporte para URL-prefix (`https://dominio/`) o Domain property (`sc-domain:dominio.com`).
- Rango de fechas, granularidad y límite de filas configurables.
- Tabla de clics, impresiones, CTR y posición; respuesta JSON disponible para auditoría.
- Mensajes de error para OAuth, permisos, propiedad y fechas.
- Consulta por defecto a nivel `page`, para preservar la granularidad útil para mapear URLs a productos.
- La consulta no modifica el catálogo automáticamente ni mezcla page+query con métricas de página.

## Configuración requerida
1. Crear/configurar credenciales OAuth de tipo Web application en Google Cloud.
2. Activar Google Search Console API.
3. Agregar el URI de redirección exacto: `GSSC_PUBLIC_BASE_URL/api/oauth/google/callback`.
4. Configurar `GSSC_GOOGLE_CLIENT_ID`, `GSSC_GOOGLE_CLIENT_SECRET`, `GSSC_PUBLIC_BASE_URL` y `GSSC_ALLOWED_ORIGINS` en el servidor del gateway.
5. Ejecutar `python backend/gateway.py` en un entorno local/servidor accesible por HTTPS en uso remoto.
6. En `frontend/js/integrations.js`, definir `localStorage` key `gssc.gateway.url` con la URL del gateway desplegado si no es localhost.
7. Autorizar Google, escribir la propiedad exacta, elegir fechas y ejecutar la consulta.

## Seguridad y límites
- Se usa el scope de solo lectura `https://www.googleapis.com/auth/webmasters.readonly`.
- El navegador solo recibe un identificador opaco de conexión, no tokens OAuth.
- En esta base los tokens están solo en memoria; reiniciar el gateway invalida la conexión.
- El gateway aún no debe considerarse producción: requiere almacenamiento cifrado de tokens, autenticación de usuarios/tenants, CSRF/rate limits, revocación, auditoría y pruebas E2E con una cuenta autorizada.
- No se declara conexión real hasta completar OAuth y obtener respuesta de Google con una propiedad accesible.
- Search Analytics puede devolver solo las filas principales por límites internos de Google. El resultado no debe interpretarse como una exportación exhaustiva.
