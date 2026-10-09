# Fase 6 — Motor matemático y reglas de negocio

## Objetivo
Convertir las fórmulas y clasificaciones del producto en un motor determinista, independiente de la UI y preparado para recibir datos reales posteriormente.

## Alcance
- Revenue Gap calculado, no confiado al valor almacenado.
- Potential Traffic.
- Organic Search Share.
- Clasificación estratégica.
- Prioridad derivada de clasificación.
- Estado de calidad de datos: VALID, INCOMPLETE, INVALID.
- Espejo del motor en Python y JavaScript para pipeline y frontend.

## Fórmulas
Revenue Gap = max(0, (Volumen Mercado × CTR esperado − Clicks GSC) × Conversion Rate × AOV).

CTR esperado por defecto: 10%.

Organic Search Share = Impresiones GSC / Volumen de búsqueda de mercado, cuando el denominador es mayor que cero.

## Precedencia de clasificación
1. Datos incompletos o inválidos → ANOMALIA.
2. Stock conocido menor a 5 → IGNORAR.
3. Posición 4–15 + volumen >= 50,000 → QUICK_WIN.
4. Posición 1–3 + volumen >= 50,000 → PROTEGER.
5. Volumen >= 50,000 + posición > 20 → CONTENT_GAP.
6. Resto → ANOMALIA.

La separación entre `Stock = 0` y `Stock = null` es deliberada: cero es una condición operativa conocida; null es ausencia de información.

## Decisión importante
Los campos derivados (`Revenue_Gap`, `Potential_Traffic`, `Organic_Search_Share`, `Clasificacion`, `Prioridad`) se recalculan al cargar el dataset. El valor precalculado recibido desde una fuente nunca se considera fuente de verdad.

## Compatibilidad
El motor conserva la fórmula y las categorías definidas por el producto. La única aclaración necesaria es la precedencia entre datos incompletos y stock nulo para evitar que una ausencia de dato se interprete como disponibilidad conocida.

## Criterios de aceptación
- El Revenue Gap coincide con la fórmula oficial.
- Nunca produce un Revenue Gap negativo.
- Datos incompletos no provocan excepciones de UI.
- Las cinco pruebas del Test Data Lab producen su clasificación declarada.
- La prioridad se deriva de la clasificación.
- Python y JavaScript implementan las mismas reglas.
- Los valores derivados no dependen de un Revenue Gap precargado.
