# Fase 28 — Google Analytics 4: conexión y primera consulta

## Implementado
- OAuth de Google Identity Services reutilizado desde la integración existente; añade el alcance de solo lectura `analytics.readonly` sin usar Client Secret.
- Consulta directa a la API oficial Google Analytics Data API `properties.runReport`.
- Configuración de Property ID numérico y filtro de canal `Organic Search` (predeterminado) o todos los canales.
- Consulta por periodo global, con sesiones, usuarios, vistas, eventos clave e ingresos de compra.
- Validación de Property ID, rango y errores HTTP; los tokens siguen en memoria.
- Consulta manual desde Integraciones y consulta GA4 dentro de Sincronizar información.
- Persistencia local del último resumen y marca de sincronización. No se atribuyen aún sesiones ni ventas a SKU: eso se implementa en la Fase 30.
- No se fija una moneda asumida; se indica que ingresos usan la moneda configurada en GA4.

## Configuración necesaria
1. En Google Cloud, habilitar **Google Analytics Data API** en el mismo proyecto del Client ID.
2. En la propiedad de GA4, dar al usuario OAuth al menos permiso de lectura.
3. En la aplicación, usar el Client ID web ya configurado y guardar el Property ID numérico de GA4 (no el ID del flujo `G-...`).
4. Consultar GA4 y verificar los datos contra la propiedad de Google Analytics.
5. Para OAuth, el consentimiento puede solicitar el permiso adicional `analytics.readonly`.

## Límites conocidos
- No incluye exploración automática de propiedades/cuentas; se requiere pegar el Property ID.
- No hay atribución por producto todavía.
- Las cifras solo se validan contra Google real cuando se ejecuta en GitHub Pages con permisos, API habilitada y una propiedad accesible.
- Merchant Center, Google Ads y Trends siguen pendientes y no generan datos ficticios.
