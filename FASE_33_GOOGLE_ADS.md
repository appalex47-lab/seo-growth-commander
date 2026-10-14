# Fase 33 — Integración inicial de Google Ads

## Alcance
- Añade una sección Google Ads dentro de Integraciones, sin reemplazar las consultas existentes de Search Console ni GA4.
- Reutiliza el ID de cliente OAuth configurado en la aplicación y solicita el ámbito `https://www.googleapis.com/auth/adwords`.
- Consulta en modo de solo lectura campañas o productos de Shopping para el periodo global.
- Guarda configuración y último resumen en el almacenamiento local. No guarda tokens de acceso ni secretos.
- No crea ni modifica campañas, anuncios, pujas ni presupuestos.

## Configuración
1. En Google Cloud, habilitar Google Ads API en el mismo proyecto dueño del ID de cliente OAuth.
2. Confirmar que el proyecto tenga acceso API Explorer o superior.
3. En Integraciones, introducir el ID de cliente de Google Ads (10 dígitos, guiones opcionales).
4. Seleccionar Campañas o Productos de Shopping y pulsar Consultar Google Ads.
5. Si Google no solicita el permiso `adwords` y la consulta falla por autorización, volver a autorizar Google desde el botón de Search Console y aceptar el permiso solicitado; no introducir Client Secret en la app.

## Datos y límites
- Campañas: impresiones, clics, coste en micros, conversiones y valor de conversiones.
- Productos de Shopping: identificador y título del producto, campaña y las mismas métricas, cuando la cuenta tenga ese tipo de campañas/datos.
- El coste se muestra con formato MXN orientativo; la moneda real depende de la cuenta de Ads. Verificarla antes de comparar con ingresos.
- Esta primera versión no vincula automáticamente productos Ads al catálogo canónico; muestra el identificador de producto de Shopping para facilitar la siguiente fase.
- No se simulan datos. Una consulta sin filas se muestra como tal.
- La consulta directa desde GitHub Pages depende de que Google permita la petición desde el navegador, del consentimiento OAuth y del nivel de acceso API del proyecto.

## Seguridad
No pegar Client Secret ni developer tokens en la interfaz. La app usa OAuth en navegador y no almacena el token en localStorage. Solo consultas de lectura.

## Pruebas realizadas en el paquete
Se valida la sintaxis JavaScript y la integridad de archivos del ZIP. La consulta en vivo requiere las credenciales y permisos del usuario y no puede darse por verificada en pruebas locales.
