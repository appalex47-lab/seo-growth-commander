from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_ads_search_terms_report_is_available():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'value="searchTerms">Términos de búsqueda' in source
    assert "'search_term_view'" in source
    assert 'search_term_view.search_term' in source


def test_ads_search_terms_metrics_and_labels_are_rendered():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "r.searchTermView?.searchTerm" in source
    assert 'CTR' in source and 'CPA' in source and 'ROAS' in source


def test_phase35_docs_explain_product_mapping_limits():
    docs = (ROOT / 'FASE_35_TERMINOS_BUSQUEDA_ADS.md').read_text(encoding='utf-8')
    assert 'Consulta + página' in docs
    assert 'no se asigna automáticamente a una ficha de producto' in docs
