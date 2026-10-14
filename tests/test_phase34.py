from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_ads_efficiency_metrics_are_rendered():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'ROAS (valor de conversión / gasto)' in source
    assert 'CTR' in source and 'CPC' in source and 'CPA' in source
    assert "sum.roas=sum.cost?sum.value/sum.cost:null" in source
    assert "sum.cpa=sum.conversions?sum.cost/sum.conversions:null" in source


def test_ads_explains_metric_denominators_and_currency_caveat():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'CTR = clics/impresiones' in source
    assert 'confirma la moneda real de la cuenta' in source
    assert 'no equivale necesariamente a rentabilidad' in source


def test_phase34_documentation_exists():
    assert (ROOT / 'FASE_34_METRICAS_RENTABILIDAD_ADS.md').exists()
