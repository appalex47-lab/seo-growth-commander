# Data Contract — Fase 0

Cada producto contiene SKU, URL_Slug, Nombre_Producto, Marca, Sustancia_Activa, Categoria, Stock, Precio, métricas GSC, métricas GA4, señales de mercado, Ads, Revenue_Gap, Prioridad, Clasificacion, Insight_IA y Accion_IA.

Los campos numéricos principales se validan en `frontend/js/data.js`. Stock negativo, posiciones negativas, tasas de conversión fuera de 0..1 y campos ausentes provocan error de dataset en esta fase.
