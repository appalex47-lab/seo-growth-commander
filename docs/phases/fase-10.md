# Fase 10 — Automatización y CI

## Objetivo
Convertir la validación del proyecto en una puerta automática para detectar regresiones antes de integrar cambios.

## Alcance
- Workflow de GitHub Actions para `push` y `pull_request` sobre `main`/`master`.
- Ejecución reproducible de la suite Python.
- Compilación/sintaxis de todos los módulos JavaScript.
- Validación de contratos JSON.
- Smoke test HTTP de recursos críticos.
- Script local único `scripts/ci_check.py` para reproducir la misma puerta antes de subir cambios.

## Fuera de alcance
- Despliegue a producción.
- Conexión real a APIs.
- Secretos de Cohere en CI.
- Automatización de cargas de datos reales.

## Criterios de aceptación
1. Un PR ejecuta automáticamente la validación.
2. Un fallo de tests, sintaxis, JSON o HTTP hace fallar el job.
3. La misma validación puede ejecutarse localmente.
4. El workflow no requiere API keys ni servicios externos de negocio.
5. No se imprimen secretos en CI.

## Decisiones
- Python 3.12 para CI.
- `pytest` como runner de pruebas.
- Node se utiliza solo para `node --check`; no se introduce un bundler.
- El smoke test sirve archivos estáticos; no prueba proveedores externos.
- Cohere queda fuera de CI hasta disponer de una capa segura y tests contractuales/mocks explícitos.

## Trazabilidad
Esta fase protege F0–F9: contratos, reglas, integraciones, pipeline y configuración Cohere.
