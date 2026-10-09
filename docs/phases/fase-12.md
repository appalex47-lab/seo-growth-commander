# Fase 12 — QA y regresión integral

## Objetivo
Intentar romper deliberadamente el sistema y validar que las fases anteriores mantienen sus contratos, cálculos, seguridad, persistencia, accesibilidad y pipeline.

## Alcance
- regresión Python/JS/JSON;
- casos extremos del motor matemático;
- entradas inválidas y anomalías;
- frontera de IA/Cohere;
- protección de API Key;
- sanitización de datos renderizados;
- persistencia del catálogo en IndexedDB;
- borrado explícito del dataset de prueba;
- smoke HTTP y navegador headless;
- CI.

## Persistencia validada
El catálogo se guarda en IndexedDB mediante `frontend/js/storage.js`, con DB `gssc.catalog`, versión 1 y store `catalogs`. La API Key de Cohere permanece fuera de IndexedDB y localStorage.

## Criterio de cierre
La fase se considera cerrada únicamente con suite completa verde, smoke HTTP verde y prueba headless de persistencia verde.

## Fuera de alcance
- conexión real a Cohere;
- APIs externas reales;
- nuevas reglas de negocio;
- rediseño funcional.
