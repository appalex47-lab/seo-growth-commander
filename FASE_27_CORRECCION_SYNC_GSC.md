# Fase 27 — Corrección de asociación y visibilidad de métricas GSC

## Cambios
- Normalización de URLs de producto para comparar host sin `www`, query string, fragmentos y barras finales.
- La sincronización central solo escribe métricas si el catálogo activo es el catálogo real; evita contaminar datos de prueba.
- Si una misma URL corresponde a más de un SKU, no asigna las métricas automáticamente y la reporta como ambigua.
- Guarda clics, impresiones, CTR, posición ponderada por impresiones, período y estado de sincronización.
- El informe de sincronización incluye productos sin coincidencia única y URLs ambiguas.
- Product Lookup y Backlog muestran estado y período de las métricas GSC.
- Backlog mantiene las mismas columnas al filtrar y muestra los cuatro campos principales de Search Console.

## Validación
- Pruebas automatizadas: 102 aprobadas.
- `node --check`: 15 archivos JavaScript comprobados, sin errores de sintaxis.
- No se ejecutó una prueba OAuth/GSC real ni validación visual en navegador; requiere abrir la app publicada y autorizar una cuenta Google.

## Importante
Los productos sin una URL coincidente, con URL duplicada entre varios SKU o sin datos para el período consultado no deben recibir métricas inventadas. El informe los identifica para corregir el catálogo o la asociación.
