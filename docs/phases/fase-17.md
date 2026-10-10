# Fase 17 — Consultas reales de Google Search Console y GA4

## Objetivo
Añadir la primera capa de consultas de datos de Google al gateway, manteniendo OAuth, tokens y llamadas a proveedores fuera del navegador. Esta fase habilita consultas bajo demanda; no constituye un sincronizador productivo.

## Alcance implementado
- Consulta Search Console: `POST /api/sync/gsc/query` con `connection_id`, `site_url`, `start_date`, `end_date`, dimensiones y límite.
- Informe GA4 Data API: `POST /api/sync/ga4/report` con `connection_id`, `property_id`, rango de fechas, dimensiones, métricas y límite.
- Validación de rango ISO `YYYY-MM-DD`, dimensiones/métricas permitidas y límites máximos.
- Renovación de access token usando refresh token cuando está próximo a expirar.
- Las respuestas incluyen fuente y rango consultado. Los errores del proveedor no exponen el cuerpo de respuesta.
- El callback OAuth comparte con la ventana original únicamente un identificador opaco de conexión, nunca access/refresh tokens. La UI registra ese identificador en configuración local como referencia, no como secreto OAuth.
- Pruebas de validación de fechas, asociación conexión/fuente y contrato de endpoints.

## Cómo probar
Configura `GSSC_GOOGLE_CLIENT_ID`, `GSSC_GOOGLE_CLIENT_SECRET`, `GSSC_PUBLIC_BASE_URL` y `GSSC_ALLOWED_ORIGINS` en el entorno del gateway. Registra exactamente `GSSC_PUBLIC_BASE_URL/api/oauth/google/callback` en Google Cloud. Ejecuta `python backend/gateway.py` y abre la app desde un origen permitido.

Ejemplo Search Console:
```json
{"connection_id":"<id-opaco>","site_url":"sc-domain:example.com","start_date":"2026-09-01","end_date":"2026-09-30","dimensions":["query","page"],"row_limit":250}
```
Ejemplo GA4:
```json
{"connection_id":"<id-opaco>","property_id":"123456789","start_date":"2026-09-01","end_date":"2026-09-30","dimensions":[{"name":"landingPagePlusQueryString"}],"metrics":[{"name":"sessions"},{"name":"keyEvents"},{"name":"totalRevenue"}],"limit":1000}
```

## Límites y riesgos pendientes
- Tokens y estados continúan en memoria; reiniciar el proceso invalida conexiones. No desplegar así en producción.
- Aún no se ha agregado selección guiada de propiedades/sitios, sincronización programada, persistencia de resultados, incrementalidad, paginación completa ni deduplicación de datos.
- No se ha ejecutado una autorización contra una cuenta Google real en este entorno; por tanto no se afirma que las credenciales o propiedades del usuario estén conectadas.
- La UI aún no incluye controles de sincronización completos para elegir sitio/propiedad y rango; los endpoints pueden invocarse desde el cliente o pruebas controladas.
- CORS no sustituye autenticación de usuario ni protección CSRF. Antes de producción se requiere identidad, autorización por usuario/tenant, token vault cifrado, rate limiting, auditoría y revocación.
- Merchant Center, Google Ads y Cohere no reciben llamadas reales en esta fase.
