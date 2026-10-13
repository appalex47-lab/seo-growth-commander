from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "frontend/js/integrations.js").read_text(encoding="utf-8")
DOC = (ROOT / "FASE_31_SINCRONIZACION_CENTRAL_GA4.md").read_text(encoding="utf-8")

def test_central_sync_uses_global_period_for_ga4():
    assert "startDate:period.startDate,endDate:period.endDate,channel:ga4.channel||'organic'" in SOURCE

def test_ga4_catalog_sync_reports_updated_products_and_ambiguous_urls():
    assert "productSync.updated" in SOURCE
    assert "productSync.ambiguous" in SOURCE
    assert "productSync.unmatched" in SOURCE

def test_ga4_channel_can_be_all_or_organic():
    assert "ga4.channel==='all'?'todos los canales':'Organic Search'" in SOURCE
    assert "value:'Organic Search'" in SOURCE

def test_document_explains_channel_scope():
    assert "No está limitado técnicamente a Organic Search" in DOC
    assert "`all`" in DOC

def test_other_integrations_not_faked():
    assert "todavía no está disponible" in SOURCE
