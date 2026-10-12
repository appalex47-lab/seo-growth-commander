# Fase 26 — Selector global persistente de períodos

## Alcance implementado
- Selector global persistido en `localStorage` bajo `gssc.global.period.v1`.
- Predeterminado: últimos 28 días.
- Presets: últimos 7 días, últimos 28 días, mes actual, mes anterior, trimestre actual, año actual y rango personalizado.
- La fecha final calculada para presets excluye los últimos tres días por el retraso habitual de Search Console. El rango personalizado respeta las fechas que el usuario selecciona; debe tenerse presente la posible incompletitud de datos recientes.
- El botón de sincronización central usa el mismo rango global para Search Console.
- La consulta manual de Search Console usa el rango global; se retiraron los controles de fecha independientes de Integraciones.
- La sincronización consulta el periodo actual y el periodo inmediatamente anterior de igual duración para comparar clics e impresiones. Si el periodo anterior no tiene base, no calcula un porcentaje inventado.
- La sincronización actualiza las métricas GSC actuales del catálogo y muestra la comparación en el informe. No crea series históricas locales ni datos simulados.
- Las fuentes GA4, Merchant Center, Google Ads y Trends siguen marcadas como pendientes: esta fase no las presenta como conectadas.
- No se ejecutan llamadas a IA al cambiar período, navegar o sincronizar.

## Persistencia y eventos
- `frontend/js/period.js`: rango, presets, persistencia y render del selector.
- `frontend/js/app.js`: control global y entrega del rango a sincronización central.
- `frontend/js/integrations.js`: usa el rango global para consultas y sincronización GSC.
- `frontend/css/main.css`: estilos adaptables para escritorio y móvil.

## Limitaciones conocidas
- Los módulos de datos de demostración (por ejemplo, Executive Overview) contienen valores simulados sin granularidad temporal y no deben interpretarse como filtrados por fecha. La fase no inventa granularidad para ellos.
- Para que los módulos con datos reales se filtren temporalmente, su fuente debe almacenar fechas por registro o exponer métricas por periodo. Search Console se consulta por rango; el catálogo guarda la última ventana consultada, no un histórico completo.
- Solo Search Console está implementado en esta versión frontend-only. Las otras integraciones necesitan conectores/autorizaciones específicos.

## Validación
Ejecutar `python -m pytest -q` y verificar sintaxis JavaScript con `node --check` en los módulos afectados. La prueba real OAuth/API y visual de navegador requiere probar en el despliegue con el Client ID y permisos de la propiedad del usuario.
