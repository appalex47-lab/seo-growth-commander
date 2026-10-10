# Fase 5 — Product Lookup

## Objetivo
Convertir Product Lookup en una herramienta de consulta de catálogo utilizable para análisis individual y revisión de decisiones.

## Alcance
- Búsqueda por SKU, nombre, URL slug, marca, sustancia activa y categoría.
- Soporte para múltiples coincidencias.
- Resultado resumido con clasificación, stock, posición GSC, conversión y Revenue Gap.
- Insight y acción recomendada.
- Acceso a detalle completo mediante el drawer existente.
- Manejo explícito de valores ausentes para escenarios de anomalía.
- Botón Limpiar y soporte de Enter.

## Fuera de alcance
- APIs reales.
- Edición permanente de productos.
- Persistencia local de cambios.
- IA como fuente de cálculo.

## Criterios de aceptación
1. SKU exacto encuentra el producto esperado.
2. Una marca o categoría puede devolver múltiples productos.
3. La búsqueda no encontrada muestra estado vacío útil.
4. Los valores null no rompen el resultado.
5. El detalle reutiliza el drawer global.
6. Los controles tienen estados y feedback claros.
7. Las pruebas de Fase 0–4 siguen pasando.

## Decisiones
- La búsqueda es local sobre el dataset cargado.
- La indexación avanzada queda para una fase posterior si el volumen real lo exige.
- La persistencia no se incorpora todavía.
