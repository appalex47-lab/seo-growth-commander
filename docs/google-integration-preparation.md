# Preparación de integraciones Google

Este documento distingue **preparación de credenciales** de **conexión de la aplicación**.

Actualmente la aplicación tiene contratos y adaptadores locales, pero las llamadas reales no están habilitadas.

## Google Search Console

- Crear/usar un proyecto de Google Cloud.
- Habilitar la API de Search Console.
- Definir OAuth 2.0 para acceso a datos privados.
- La cuenta que autorice debe tener acceso a la propiedad de Search Console.
- La integración debe consultar Search Analytics por URL/consulta/fecha y mapear al SKU mediante `URL_Slug`.

Referencia oficial: https://developers.google.com/webmaster-tools/v1/searchanalytics/query

## Google Analytics 4

- Crear/usar el proyecto de Google Cloud.
- Habilitar Google Analytics Data API.
- Autorizar al usuario o cuenta de servicio sobre la propiedad GA4.
- Consultar `runReport` para sesiones, conversiones y AOV según el contrato de datos.
- Mapear a SKU/URL mediante las dimensiones disponibles en la propiedad.

Referencia oficial: https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart

## Google Merchant Center

Usar **Merchant API**, no Content API for Shopping, porque Content API for Shopping llegó a sunset en agosto de 2026.

Para una herramienta interna de una sola empresa, Google documenta el uso de cuenta de servicio; para una aplicación que atienda múltiples cuentas externas, OAuth 2.0.

- Crear proyecto de Google Cloud.
- Habilitar Merchant API.
- Registrar/autenticar la cuenta correspondiente.
- Conceder el acceso necesario en Merchant Center.
- Mapear productos por SKU y obtener stock/disponibilidad.

Referencia oficial: https://developers.google.com/merchant/api/guides/quickstart/authentication

## Google Ads

- Crear/usar proyecto de Google Cloud.
- Habilitar Google Ads API.
- Configurar OAuth 2.0.
- El proyecto de Cloud determina el nivel de acceso de la API; desde septiembre de 2026 el developer token dejó de ser necesario para las nuevas llamadas y su función de acceso fue migrada al proyecto de Cloud.
- Solicitar solo el alcance necesario y obtener acceso a la cuenta/cliente de Ads.

Referencia oficial: https://developers.google.com/google-ads/api/docs/oauth/overview

## Google Trends

Google Trends tiene actualmente una API en **alpha** con acceso anticipado. No se debe diseñar la release de producción suponiendo disponibilidad general.

Mientras la API no esté disponible para nuestro proyecto, mantener el adaptador como fuente opcional y soportar importación de datos de mercado.

Referencia oficial: https://developers.google.com/search/apis/trends

## Arquitectura de producción recomendada

`Frontend -> backend/worker seguro -> OAuth/Google -> adaptador -> datos canónicos -> pipeline -> IndexedDB/artefacto de análisis -> UI`

Los secretos y refresh tokens no deben almacenarse en el navegador.
