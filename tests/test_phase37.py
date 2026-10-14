from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_ads_product_metrics_match_catalog_only_by_unique_sku():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "reportView==='product'" in source
    assert "String(seg.productItemId??'').trim()" in source
    assert 'matches.length!==1' in source
    assert 'Ads_Impresiones' in source and 'Ads_ROAS' in source


def test_ads_catalog_sync_reports_unmatched_and_ambiguous_items():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'adsProductSync.unmatched' in source
    assert 'adsProductSync.ambiguous.length' in source
    assert "source:'google-ads-product'" in source


def test_phase37_documents_exact_matching_and_limits():
    docs = (ROOT / 'FASE_37_VINCULACION_ADS_CATALOGO.md').read_text(encoding='utf-8')
    assert 'SKU exacto' in docs
    assert 'términos de búsqueda' in docs
    assert 'ambigu' in docs.lower()
