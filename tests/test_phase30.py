from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRATIONS = (ROOT / "frontend/js/integrations.js").read_text()
LOOKUP = (ROOT / "frontend/js/lookup.js").read_text()
BACKLOG = (ROOT / "frontend/js/backlog.js").read_text()


def test_ga4_catalog_sync_is_defined_and_requires_real_catalog():
    assert "export async function syncGA4LandingPagesToCatalog" in INTEGRATIONS
    assert "stored?.source!=='real'" in INTEGRATIONS


def test_ga4_catalog_sync_keeps_period_channel_and_metrics():
    for field in ["GA4_Sesiones", "GA4_Usuarios", "GA4_Vistas", "GA4_Eventos_Clave",
                  "GA4_Ingresos", "GA4_Canal", "GA4_Periodo_Inicio",
                  "GA4_Periodo_Fin", "GA4_Ultima_Actualizacion", "GA4_Estado"]:
        assert field in INTEGRATIONS


def test_ga4_sync_rejects_ambiguous_urls():
    assert "matches.length===1" in INTEGRATIONS
    assert "ambiguous" in INTEGRATIONS


def test_product_lookup_exposes_ga4_metrics_and_period():
    for field in ["Sesiones GA4", "Usuarios GA4", "Vistas GA4", "Eventos clave GA4", "Ingresos GA4", "Periodo GA4"]:
        assert field in LOOKUP


def test_backlog_exposes_ga4_metrics_and_status():
    for field in ["Sesiones GA4", "Usuarios GA4", "Vistas GA4", "Eventos clave GA4", "Ingresos GA4", "Periodo GA4", "Estado GA4"]:
        assert field in BACKLOG


def test_ga4_sync_is_invoked_by_manual_and_central_sync_paths():
    assert INTEGRATIONS.count("syncGA4LandingPagesToCatalog(") >= 3
