from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_ads_queries_previous_equivalent_period():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'const previous=previousEquivalentRange(period)' in source
    assert 'startDate:previous.startDate,endDate:previous.endDate,view:reportView' in source


def test_ads_comparison_has_core_kpis_and_dates():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    for kpi in ['Impresiones', 'Clics', 'Gasto', 'Conversiones', 'CTR', 'CPC', 'CPA', 'ROAS']:
        assert kpi in source
    assert 'Comparación con el periodo anterior equivalente' in source
    assert 'previous.startDate' in source and 'previous.endDate' in source


def test_phase36_documents_limits_and_no_base_handling():
    docs = (ROOT / 'FASE_36_COMPARACION_PERIODOS_ADS.md').read_text(encoding='utf-8')
    assert 'Sin base' in docs
    assert 'sigue pendiente de una vista específica' in docs
