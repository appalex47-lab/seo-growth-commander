# Fase 22 — Google Search Console desde frontend (sin backend propio)

## Objetivo
Conectar la aplicación estática publicada en GitHub Pages directamente con Google Search Console mediante Google Identity Services (GIS), OAuth de navegador con ventana emergente y la Search Console API. Esta fase habilita únicamente Search Console; GA4, Merchant Center y Google Ads no se activan con este flujo.

## Configuración de Google Cloud
1. Habilitar **Google Search Console API** en el proyecto.
2. Configurar Google Auth Platform / pantalla de consentimiento. Mientras la app esté en pruebas, agregar la cuenta que se usará para autorizar en la lista de usuarios de prueba.
3. Crear credencial OAuth de tipo **Aplicación web**.
4. En **Orígenes autorizados de JavaScript**, agregar exactamente `https://appalex47-lab.github.io` (sin ruta ni barra final).
5. Para el flujo GIS de token en popup, no se necesita una URI de redirección de backend. No registrar el origen como redirect URI.
6. Copiar únicamente el **ID de cliente** que termina en `.apps.googleusercontent.com` a la pantalla Integraciones. El **Client Secret no se usa** en frontend y no debe publicarse ni incluirse en el repositorio.
7. Confirmar que Search Console API está habilitada y que la cuenta autorizada tiene acceso a la propiedad consultada.

## Uso
1. Abrir la app en el origen publicado.
2. Ir a Integraciones, introducir el ID de cliente y pulsar **Conectar con Google**.
3. Autorizar el permiso `https://www.googleapis.com/auth/webmasters.readonly` en la ventana emergente.
4. Introducir la propiedad exactamente como aparece en Search Console: URL-prefix como `https://www.ejemplo.com/` o dominio como `sc-domain:ejemplo.com`.
5. Seleccionar fechas, dimensiones y límite de filas; consultar. La tabla muestra dimensiones, clics, impresiones, CTR y posición.

## Diseño y seguridad
- GIS entrega un access token temporal al navegador. Se conserva solo en memoria de la pestaña, nunca en localStorage ni en el repositorio.
- El ID de cliente y la propiedad se guardan en localStorage del navegador. El ID de cliente OAuth es público por diseño.
- El Client Secret no debe estar en el frontend. Rotar cualquier secreto que haya sido compartido o fotografiado públicamente.
- El usuario debe autorizar la cuenta y tener permisos sobre la propiedad. Los tokens expiran; volver a autorizar cuando sea necesario.
- La Search Console API puede devolver filas principales, no necesariamente todas las filas de bajo volumen.
- Esta modalidad evita un backend propio, pero no proporciona un proxy, sincronización programada ni almacenamiento centralizado. No extiende automáticamente el acceso a GA4, Merchant Center o Google Ads.

## Limitaciones / criterios de aceptación
- No afirmar conexión real hasta que la autorización GIS termine y una consulta real devuelva respuesta de la API.
- Si la ventana emergente está bloqueada, permitir popups para el sitio.
- Errores de origen, consentimiento, API no habilitada, permisos de propiedad o fechas deben mostrarse en estado de interfaz.
- La desconexión borra el token de memoria y metadatos locales de la integración; los permisos otorgados pueden requerir revocación desde la cuenta de Google.
- No se ha realizado una prueba E2E con la cuenta Google del usuario ni con sus propiedades reales desde este entorno.
