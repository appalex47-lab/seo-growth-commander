# Fase 24 — Vincular catálogo y Search Console

## Objetivo
Relacionar una ficha del catálogo activo con su URL exacta en Google Search Console y comparar las métricas orgánicas del periodo consultado contra el periodo inmediatamente anterior de la misma duración.

## Flujo
1. Ejecutar una consulta normal de Search Console.
2. El panel lee el catálogo activo desde IndexedDB, sin modificarlo.
3. El usuario selecciona una ficha y se propone su URL desde `URL_Slug`; puede corregirla antes de consultar.
4. Se ejecutan dos consultas filtradas por la dimensión `page` con operador `equals`: periodo actual y periodo anterior de igual duración.
5. Se muestran clics, impresiones, CTR y posición media ponderada por impresiones, junto con variaciones de clics, impresiones y CTR.
6. El diagnóstico separa hechos, drivers a investigar e hipótesis; no atribuye ventas ni causalidad a Search Console.

## Alcance y límites
- La URL debe pertenecer a la propiedad autorizada y coincidir con la URL que Search Console registra (incluidos host, protocolo, ruta y canonicalización cuando aplique).
- `URL_Slug` relativo se convierte en URL absoluta usando la propiedad URL-prefix. En propiedades `sc-domain:` el usuario debe revisar y confirmar manualmente la URL absoluta propuesta.
- Si el periodo anterior no tiene datos, la variación se muestra como sin base comparable, no como 0%.
- Search Console puede omitir filas de bajo volumen; los datos no equivalen a ventas, sesiones ni conversiones.
- La integración sigue siendo frontend-only: token temporal en memoria; no se usa Client Secret.

## Pruebas
`tests/test_phase24.py` verifica el enlace con el catálogo, el filtro exacto por página, la comparación de periodos equivalentes y el lenguaje sin atribución causal.
