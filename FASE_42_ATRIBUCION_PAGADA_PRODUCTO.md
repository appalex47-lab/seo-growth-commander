# Fase 42 — Atribución pagada a producto

## Cambio
- La tarjeta “Atribución pagada a producto” muestra el estado dinámico “Sin validar” cuando existe un informe de términos de búsqueda y “Sin datos” cuando no existe.
- Muestra el volumen de términos disponibles y declara explícitamente que hay cero atribuciones confirmadas por defecto.
- Los términos de Ads permanecen “Sin asociación comprobada”; las coincidencias de texto pueden orientar una investigación, pero no son evidencia de atribución.
- Solo se debe confirmar una relación cuando haya evidencia trazable (URL de destino vinculada al clic, relación de Shopping verificable o asociación revisada y documentada).
- No se redistribuyen clics, gasto ni conversiones de Google Ads entre productos sin una regla comprobada.

## Validación
Se agregaron pruebas de regresión para el estado y conteo de la tarjeta, la prohibición de asociación automática y la conservación de métricas en el nivel de Ads.
