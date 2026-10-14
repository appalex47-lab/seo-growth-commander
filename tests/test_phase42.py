from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
INTEL = (ROOT / "frontend/js/searchIntelligence.js").read_text(encoding="utf-8")

def test_paid_attribution_card_reports_evidence_status_and_counts():
    assert 'id="si-paid-attribution-status"' in INTEL
    assert '0 atribuciones confirmadas' in INTEL
    assert "paidRows.length?'Sin validar':'Sin datos'" in INTEL

def test_ads_terms_are_never_automatically_assigned_to_catalog_product():
    assert "const matchedProduct=null" in INTEL
    assert "association:'Requiere vínculo verificable'" in INTEL
    assert 'ningún término se atribuye automáticamente a una ficha' in INTEL
    assert 'Las coincidencias de nombre, marca o SKU pueden servir como candidatos' in INTEL

def test_paid_metrics_stay_at_ads_level_until_traceable_evidence_exists():
    assert 'gasto, clics y conversiones permanecen en el nivel de Ads' in INTEL
