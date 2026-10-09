# Growth SEO Command Center

Sistema catalog-centric de inteligencia SEO: transforma datos de producto, rendimiento orgánico, demanda y señales comerciales en oportunidades económicas, prioridades y acciones.

## Ejecutar
```bash
python3 -m http.server 8000
```
Abrir `http://localhost:8000/`.

## Módulos
- Executive Overview
- Strategic Action Matrix
- Operational Backlog
- Product Lookup
- Test Data Lab
- Integraciones
- Configuración IA — Cohere

## Arquitectura actual
```text
Fuentes → Adaptadores → Merge por SKU → Calidad → Motor matemático → Cohere → Acciones
```

La Fase 9 formaliza el pipeline de extremo a extremo. Revenue Gap, clasificación, prioridad y demás campos calculados son autoridad del motor determinista. Cohere interpreta resultados y no puede sobrescribir la verdad de negocio.

## Estado de integraciones
Los contratos y adaptadores de GSC, GA4, Merchant Center, Google Ads y Trends están preparados. Las llamadas reales a APIs todavía requieren una capa segura de backend/proxy.

## Cohere
Cohere es el único proveedor de IA del producto. La interfaz permite seleccionar modelo y configurar la API Key. La clave no se guarda en localStorage; la conexión de producción debe pasar por una capa segura.

## Fases
0 Arquitectura · 2 Overview/Test Data · 3 Matrix/Lab · 4 Backlog · 5 Lookup · 6 Motor matemático · 7 Integraciones · 8 Cohere/IA · 9 Pipeline completo · 10 CI · 11 Seguridad/Performance/Accesibilidad/IndexedDB · 12 QA · 13 Auditoría/Release.

## Fase 10 — CI

La validación automática se ejecuta con `scripts/ci_check.py` y `.github/workflows/ci.yml`. El gate comprueba tests, sintaxis JS, compilación Python, JSON y smoke HTTP. No requiere APIs reales ni secretos.

## Fase 13 — Estado final
La aplicación es un release candidate funcional con datos locales/mock y pipeline determinista. Las integraciones Google y la llamada real a Cohere siguen bloqueadas hasta implementar una capa segura de backend/worker y OAuth. Consulta `docs/final-audit.md`, `docs/google-integration-preparation.md` y `docs/release-checklist.md`.
