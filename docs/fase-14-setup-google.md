# Fase 14 — Cómo preparar la primera conexión desde la aplicación

Esta guía corresponde a la infraestructura implementada en Fase 14. **No necesitas poner ninguna API key de Google dentro de la interfaz de GSSC.** Las credenciales de OAuth pertenecen al gateway/backend.

## 1. Qué vas a conseguir

Al terminar esta preparación, el flujo será:

```text
GSSC → Integraciones → Conectar con Google
                  ↓
          Gateway seguro :8787
                  ↓
           Google OAuth
                  ↓
        autorización de tu cuenta
                  ↓
          callback al gateway
```

La Fase 14 todavía no descarga datos de GSC/GA4/Merchant/Ads. Eso corresponde a las siguientes fases.

## 2. Crear un proyecto en Google Cloud

1. Entra a la Consola de Google Cloud.
2. Crea un proyecto para GSSC o selecciona uno existente dedicado a la aplicación.
3. Habilita las APIs que iremos usando. Para GA4, Google indica habilitar la Google Analytics Data API; para Merchant, habilitaremos Merchant API. GSC y Ads se incorporarán según sus APIs específicas.
4. Configura la pantalla de consentimiento OAuth.

Google recomienda OAuth incremental: pedir cada permiso cuando realmente se necesita. Esto reduce permisos innecesarios y facilita la revisión. Ver documentación oficial: https://developers.google.com/identity/protocols/oauth2/web-server

## 3. Crear las credenciales OAuth

En Google Cloud crea un cliente OAuth 2.0 de tipo **Aplicación web**.

Para desarrollo local usa como URI de redireccionamiento autorizado:

```text
http://127.0.0.1:8787/api/oauth/google/callback
```

También puedes usar `localhost` si decides que `GSSC_PUBLIC_BASE_URL` utilice ese host. Debe coincidir exactamente con el valor configurado en Google.

Google permite HTTP para URIs localhost durante desarrollo; para producción debes usar HTTPS. Fuente oficial: https://developers.google.com/identity/protocols/oauth2/web-server

## 4. Copiar las credenciales al servidor

No las pegues en `integrations.js`, `index.html`, localStorage ni IndexedDB.

En la terminal donde arrancarás GSSC configura:

```bash
export GSSC_GOOGLE_CLIENT_ID='TU_CLIENT_ID'
export GSSC_GOOGLE_CLIENT_SECRET='TU_CLIENT_SECRET'
export GSSC_GATEWAY_HOST='127.0.0.1'
export GSSC_GATEWAY_PORT='8787'
export GSSC_PUBLIC_BASE_URL='http://127.0.0.1:8787'
export GSSC_ALLOWED_ORIGINS='http://127.0.0.1:8000,http://localhost:8000'
```

En Windows PowerShell:

```powershell
$env:GSSC_GOOGLE_CLIENT_ID='TU_CLIENT_ID'
$env:GSSC_GOOGLE_CLIENT_SECRET='TU_CLIENT_SECRET'
$env:GSSC_GATEWAY_HOST='127.0.0.1'
$env:GSSC_GATEWAY_PORT='8787'
$env:GSSC_PUBLIC_BASE_URL='http://127.0.0.1:8787'
$env:GSSC_ALLOWED_ORIGINS='http://127.0.0.1:8000,http://localhost:8000'
```

## 5. Arrancar el gateway

Desde la raíz del proyecto:

```bash
python backend/gateway.py
```

Debe mostrar algo parecido a:

```text
GSSC gateway listening on http://127.0.0.1:8787
Google OAuth configured: True
```

Si aparece `False`, las variables de Google no llegaron al proceso.

## 6. Arrancar la aplicación

En otra terminal, desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Abre:

```text
http://127.0.0.1:8000
```

## 7. Probar primero el gateway

Abre en el navegador:

```text
http://127.0.0.1:8787/api/health
```

Debe responder JSON con `ok: true`.

Después:

```text
http://127.0.0.1:8787/api/integrations/status
```

Debe indicar que Google está configurado.

## 8. Probar desde GSSC

1. Abre **Integraciones**.
2. Comprueba que aparezca **Gateway disponible**.
3. En Google Search Console pulsa **Conectar con Google**.
4. Se abrirá la pantalla de autorización de Google.
5. Selecciona la cuenta que tenga acceso al recurso que queremos analizar.
6. Acepta el permiso solicitado.
7. Google regresará al gateway.
8. El gateway confirmará que la conexión fue creada.

Importante: en esta fase el gateway mantiene temporalmente los tokens **solo en memoria** para comprobar el flujo. Si reinicias el gateway, esa conexión se pierde. Esto es intencional y no debe considerarse almacenamiento de producción.

## 9. Qué permisos usará cada fuente

| Fuente | Scope previsto en esta arquitectura |
|---|---|
| Search Console | `https://www.googleapis.com/auth/webmasters.readonly` |
| GA4 | `https://www.googleapis.com/auth/analytics.readonly` |
| Merchant API | `https://www.googleapis.com/auth/content` |
| Google Ads | `https://www.googleapis.com/auth/adwords` |

Google documenta `webmasters.readonly` para lectura de Search Console y `analytics.readonly` para consultas de GA4. Merchant API usa el scope `content`; para una aplicación SaaS/terceros se utiliza OAuth 2.0. Fuentes oficiales: https://developers.google.com/identity/protocols/oauth2/scopes y https://developers.google.com/merchant/api/guides/authorization/access-client-accounts

## 10. Merchant Center tiene un paso adicional

Si GSSC se va a usar como aplicación de terceros para una cuenta Merchant Center, la cuenta de Google utilizada para autorizar debe existir como usuario de Merchant Center y, para el registro indicado por Google, tener rol `Admin`. Además, las apps que acceden a Merchant API pasan por el proceso de verificación OAuth. Fuente oficial: https://developers.google.com/merchant/api/guides/authorization/access-client-accounts

## 11. GA4 tiene otro requisito

La cuenta de Google que autorices debe tener acceso a la propiedad de Google Analytics que posteriormente seleccionaremos. Google también requiere habilitar la Google Analytics Data API antes de realizar llamadas de datos. Fuente oficial: https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart

## 12. Qué NO debes hacer

- No pegar el `client_secret` en el frontend.
- No guardar refresh tokens en localStorage.
- No guardar refresh tokens en IndexedDB.
- No publicar `.env` ni credenciales OAuth en GitHub.
- No llamar directamente desde el navegador a los endpoints de token de Google.
- No marcar una fuente como conectada solo porque existe una configuración local.

## 13. Qué haremos después

Una vez que el gateway OAuth funcione, la siguiente fase será **GSC real**:

1. listar los sitios disponibles para la cuenta autorizada;
2. seleccionar el sitio dentro de GSSC;
3. ejecutar una consulta real de Search Analytics;
4. normalizar sus filas al contrato interno;
5. guardar el dataset normalizado;
6. ejecutar el motor determinista;
7. mostrar fecha de última sincronización y errores;
8. probar revocación/expiración.

Después repetiremos el patrón con GA4, Merchant y Ads.
