# Fase 14 — Infraestructura segura de integraciones

## Objetivo
Crear la frontera segura entre el navegador y los proveedores externos, preparando OAuth real sin exponer secretos en el frontend.

## Implementado
- `backend/gateway.py` con endpoints de salud/estado.
- OAuth Google con `state` + PKCE.
- Client ID/secret solo en variables de entorno del gateway.
- Intercambio del authorization code en servidor.
- CORS mediante allowlist explícita.
- UI de Integraciones con estado del gateway y botones `Conectar con Google`.
- Contrato preparado para GSC, GA4, Merchant y Ads.
- Trends permanece como fuente posterior/alternativa de market data.
- Test de seguridad que comprueba que el frontend no contiene client secret ni token endpoint.

## No implementado deliberadamente
- llamadas de datos a GSC/GA4/Merchant/Ads;
- selección de propiedades/cuentas;
- persistencia productiva de refresh tokens;
- revocación/rotación productiva;
- sincronización programada;
- Cohere real.

## Decisión de seguridad
La Fase 14 usa almacenamiento de tokens **solo en memoria** para validar el flujo durante desarrollo. Esto no es una solución de producción. Antes del release se debe sustituir por un almacén seguro gestionado y añadir cifrado, rotación, revocación, TTL y eliminación.

## Criterios de aceptación
- [x] El navegador puede solicitar el inicio de OAuth al gateway.
- [x] El gateway rechaza fuentes no soportadas.
- [x] El gateway no funciona como si estuviera configurado cuando faltan credenciales.
- [x] El frontend no contiene Google client secret.
- [x] Existe allowlist CORS.
- [x] El intercambio OAuth ocurre en servidor.
- [ ] Una cuenta Google real ha sido autorizada (requiere credenciales del usuario).
- [ ] Se ha ejecutado una consulta real a GSC/GA4/Merchant/Ads.

## Rollback
Eliminar `backend/`, revertir `frontend/js/integrations.js`, `frontend/js/app.js` y `tests/test_phase14.py`, conservando los contratos de Fase 7.
