# Technical Decisions — Fase 0

1. Frontend: HTML5 + CSS3 + JavaScript ES modules + Chart.js, alineado con el PRD.
2. Datos: JSON mock para desacoplar UI de APIs.
3. Eje Y de la matriz: Posición GSC invertida, porque las zonas de prioridad del diseño dependen de ranking.
4. Share of Market se documenta como Organic Search Share / Share of Search para no sobreinterpretar el indicador.
5. Se incorporan estados Loading, Success, Empty y Error desde el primer incremento.
6. La IA es simulada; no se realizan llamadas externas en Fase 0.

## ADR-007 — Integraciones desacopladas
Las fuentes externas se incorporan mediante adaptadores que normalizan datos al contrato canónico. Fase 7 no abre conexiones reales ni almacena secretos en localStorage. Esto permite probar el pipeline con mock y añadir autenticación segura posteriormente sin modificar el motor matemático.
