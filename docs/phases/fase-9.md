# Fase 9 — Pipeline completo + validación

## Objetivo
Unificar la ruta de datos del Growth SEO Command Center antes de conexiones externas reales.

## Flujo
1. Fuente o dataset canónico.
2. Normalización mediante adaptador.
3. Merge por SKU.
4. Motor determinista.
5. Resumen de calidad.
6. Contexto listo para IA.
7. Guardrail que impide que IA sobrescriba campos calculados.

## Contratos
El pipeline expone `pipeline_version`, `products`, `quality_summary`, `calculated_fields` y `ai_ready`.

## Fuente de verdad
Revenue Gap, Potential Traffic, Organic Search Share, clasificación y prioridad pertenecen al motor determinista. La IA solo añade interpretación/recomendaciones.

## Seguridad
No se conectan APIs reales ni se procesan secretos en este pipeline. La API key de Cohere continúa fuera de localStorage y la llamada real requiere una capa segura.

## Criterios de aceptación
- [x] El mock atraviesa el pipeline completo.
- [x] Fuentes externas se normalizan y enriquecen por SKU.
- [x] Se informa calidad VALID/INCOMPLETE/INVALID.
- [x] Los campos calculados se recalculan.
- [x] La IA no puede sobrescribir verdad de negocio.
- [x] Existe versionado del pipeline.
- [x] Regresión completa pasa.
