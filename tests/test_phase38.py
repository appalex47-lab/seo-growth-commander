from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
DOC = (ROOT / 'FASE_38_SINCRONIZACION_CENTRAL_ADS.md').read_text(encoding='utf-8')


def test_central_sync_queries_ads_using_global_period():
    assert "queryGoogleAds({customerId:ads.customerId,startDate:period.startDate,endDate:period.endDate,view:'campaign'})" in SOURCE
    assert "id:'ads',name:'Google Ads',status:'success'" in SOURCE


def test_central_sync_ads_product_matching_is_exact_and_unique():
    assert 'syncAdsProductsToCatalog(productReport.rows||[]' in SOURCE
    assert 'matches.length!==1' in SOURCE
    assert 'Ads_ROAS' in SOURCE and 'Ads_Periodo_Inicio' in SOURCE


def test_ads_setup_and_failure_are_reported_without_fake_data():
    assert "id:'ads',name:'Google Ads',status:'needs_setup'" in SOURCE
    assert "id:'ads',name:'Google Ads',status:'error'" in SOURCE
    assert 'no se inventan datos' in DOC.lower()


def test_phase38_keeps_merchant_and_trends_unimplemented():
    assert "['merchant','Google Merchant Center'" in SOURCE
    assert "['trends','Google Trends'" in SOURCE
