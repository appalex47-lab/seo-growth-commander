# Fase 3 — Strategic Action Matrix + Test Data Lab

## Objetivo
Convertir la matriz estratégica en una superficie operativa verificable y crear un laboratorio de datos que permita forzar escenarios de negocio antes de integrar archivos o APIs.

## Implementado
- Vista Strategic Action Matrix.
- Eje X: volumen de búsqueda en escala logarítmica.
- Eje Y: posición GSC invertida visualmente.
- Tamaño de burbuja: clicks actuales.
- Clasificaciones diferenciadas.
- Filtros por clasificación y stock.
- Selección de producto mediante drawer.
- Nueva vista Test Data Lab.
- Cinco escenarios aislados: Quick Win, Proteger, Content Gap, Sin stock y Anomalía/Datos incompletos.
- Carga de escenario hacia el mismo estado de datos que usa el dashboard.
- Conservación de los botones globales Agregar/Borrar información de prueba.

## Decisión
Los escenarios son datos estáticos de prueba y no representan información real. No se conectan APIs, no escriben sobre archivos de producción y no requieren backend.

## Gate
La matriz y sus reglas deben poder probarse con cada escenario antes de avanzar a importación o APIs.
