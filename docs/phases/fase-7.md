# Fase 7 — Capa de integraciones

## Objetivo
Preparar una capa desacoplada para recibir datos de GSC, GA4, Merchant Center, Google Ads y Trends/Market Data sin acoplar las APIs al motor de negocio.

## Implementado
- Contrato versionado en `data/integration_contract.json`.
- Catálogo de fuentes en `frontend/js/integrations.js`.
- Centro de Integraciones en la interfaz.
- Configuración local de metadatos (activación, cuenta, endpoint/proyecto).
- Adaptadores Python para normalizar payloads ya obtenidos.
- Merge por SKU para enriquecer un producto desde varias fuentes.
- Protección conceptual: los campos derivados continúan calculándose en el motor de Fase 6.

## No implementado deliberadamente
- Llamadas reales a APIs.
- OAuth.
- Almacenamiento de API keys/secrets en navegador.
- Refresh tokens.
- Sincronización programada.
- Dependencia de una API externa para pruebas.

## Flujo contractual
Fuente externa → adaptador → registro canónico → validación/calidad → motor matemático → clasificación → módulos UI.

## Criterios de aceptación
1. Las cinco fuentes tienen contrato identificable.
2. Un payload de cada fuente puede normalizarse sin calcular métricas derivadas.
3. Registros de varias fuentes se fusionan por SKU.
4. Una fuente desconocida falla explícitamente.
5. La UI permite activar/configurar metadatos sin guardar secretos.
6. El pipeline sigue siendo determinista aunque no haya APIs conectadas.

## Decisiones
- `localStorage` solo contiene configuración no secreta de la interfaz.
- Las credenciales reales quedan fuera del navegador hasta definir backend/secret manager.
- Los adaptadores no calculan Revenue Gap ni clasificación.
- La API nunca será fuente de verdad para métricas derivadas.
