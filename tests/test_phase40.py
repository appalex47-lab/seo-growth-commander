from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / 'frontend/js/app.js').read_text(encoding='utf-8')
INTEL = (ROOT / 'frontend/js/searchIntelligence.js').read_text(encoding='utf-8')
INTEGRATIONS = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
DOC = (ROOT / 'FASE_40_INTELIGENCIA_BUSQUEDAS.md').read_text(encoding='utf-8')


def test_search_intelligence_has_independent_navigation_and_renderer():
    assert 'data-view="searchIntelligence"' in HTML
    assert 'renderSearchIntelligence' in APP and "state.view==='searchIntelligence'" in APP


def test_gsc_saves_query_plus_page_for_search_intelligence():
    assert "gssc.gsc.last-query.v1" in INTEGRATIONS
    assert "{siteUrl,startDate,endDate,dimensions,rows,updatedAt:new Date().toISOString(),source:'search-console'}" in INTEGRATIONS
    assert "(gsc.dimensions||[]).includes('query')" in INTEL
    assert "(gsc.dimensions||[]).includes('page')" in INTEL


def test_paid_terms_are_only_shown_from_search_terms_report():
    assert "ads?.view==='searchTerms'" in INTEL
    assert 'gssc.googleads.last-report.v1' in INTEL


def test_product_association_is_exact_url_for_organic_and_not_guessed_for_ads():
    assert 'normUrl(p.URL_Slug,gsc?.siteUrl)===normUrl(url,gsc?.siteUrl)' in INTEL
    assert "association:'Requiere vínculo verificable'" in INTEL
    assert 'no se atribuyen por similitud' in DOC.lower()


def test_global_period_and_data_limitations_are_explained():
    assert 'getGlobalPeriod' in INTEL
    assert 'vuelve a ejecutar las consultas' in INTEL
    assert 'no representa el volumen absoluto' in DOC.lower()
