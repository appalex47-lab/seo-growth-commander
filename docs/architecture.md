# Arquitectura — Growth SEO Command Center

## Capas
- UI: módulos Overview, Matrix, Backlog, Lookup, Test Data Lab, Integraciones y Configuración IA.
- Datos: dataset canónico y adaptadores de fuentes.
- Pipeline: normalización → merge por SKU → calidad → cálculo → contexto IA.
- Reglas: motor determinista compartido conceptualmente entre Python y JavaScript.
- IA: Cohere como capa interpretativa posterior al cálculo.

## Regla de autoridad
Los campos `Data_Quality`, `Potential_Traffic`, `Revenue_Gap`, `Organic_Search_Share`, `Clasificacion` y `Prioridad` son protegidos. Una salida de IA nunca puede sustituirlos.

## Flujo extremo a extremo
```text
Fuente → Normalizador → Catálogo canónico → Calidad/Cálculo → Cohere → UI/Acción
```
