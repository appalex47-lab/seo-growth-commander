# Fase 8 — Inteligencia con Cohere

## Objetivo
Preparar la capa de inteligencia artificial de Growth SEO Command Center específicamente para Cohere.

## Implementado
- Cohere como único proveedor de IA.
- Configuración desde la interfaz.
- Selector de modelo Cohere.
- API Key de Cohere mediante campo protegido.
- Activación/desactivación de la capa IA.
- Contexto determinista para la IA.
- Guardrails: la IA no modifica Revenue Gap, clasificación ni prioridad.
- API Key mantenida en `sessionStorage` durante esta fase; nunca en `localStorage`.
- Adaptador real todavía no ejecuta llamadas externas.

## Modelos visibles
- `command-a-plus-05-2026`
- `command-a-03-2025`
- `command-a-reasoning-08-2025`
- `command-r7b-12-2024`
- `command-r-plus-08-2024`
- `command-r-08-2024`

La lista se basa en la documentación oficial de Cohere consultada durante esta fase. La API de Cohere también permite listar modelos disponibles dinámicamente; esa sincronización se implementará en la conexión segura.

## Seguridad
`sessionStorage` reduce persistencia accidental, pero sigue siendo almacenamiento del lado cliente. Para producción, la llamada a Cohere deberá pasar por un adaptador/backend seguro para no exponer una clave de producción al navegador.

## Fuera de alcance
- Llamadas reales a Cohere.
- Rotación de secretos.
- Proxy/backend de producción.
- Automatización de prompts.

## Criterios de aceptación
- [x] Cohere es el único proveedor visible.
- [x] Existe selector de modelo.
- [x] Existe campo de API Key.
- [x] La clave no se escribe en localStorage.
- [x] La IA recibe métricas calculadas por el motor determinista.
- [x] 32/32 pruebas pasan.
