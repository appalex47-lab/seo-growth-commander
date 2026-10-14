# Fase 43 — Corrección de Inteligencia de búsquedas

## Corrección
- Se corrige el `ReferenceError: gscRows is not defined` al renderizar la vista. `gscRows` y `paidRows` ahora se calculan dentro del alcance de `renderSearchIntelligence()` antes de usarse en las tarjetas KPI.
- Los mensajes `Cross-Origin-Opener-Policy ... window.closed call` provienen del flujo de popup OAuth de Google Identity Services. Son advertencias separadas del error fatal de la vista; esta corrección no cambia la autenticación.

## Validación
- Revisión estática del cambio y comprobación de sintaxis JavaScript (cuando el runtime Node está disponible).
- Debe probarse en GitHub Pages tras subir los archivos y esperar CI; no se declara verificado en producción.
