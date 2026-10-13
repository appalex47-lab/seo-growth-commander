from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def test_gsc_url_matching_normalizes_www_trailing_slash_and_query():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "u.hostname.toLowerCase().replace(/^www\\./,'')" in js
    assert "u.pathname.replace(/\\/+$/,'')" in js
    assert "split(/[?#]/)" in js

def test_gsc_sync_refuses_to_write_to_demo_or_scenario_catalog():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "stored?.source!=='real'" in js
    assert 'Activa el catálogo real para asociar métricas' in js

def test_duplicate_product_urls_are_not_assigned_ambiguous_metrics():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'same.length!==1' in js
    assert 'ambiguous' in js
    assert "GSC_Estado:'sincronizado'" in js

def test_backlog_shows_gsc_metrics_period_and_sync_status_consistently():
    js = (ROOT / 'frontend/js/backlog.js').read_text(encoding='utf-8')
    assert '<th>Periodo GSC</th><th>Estado GSC</th>' in js
    assert 'GSC_Periodo_Inicio' in js
    assert 'metricStatus(p)' in js

def test_product_lookup_explains_missing_gsc_metrics():
    js = (ROOT / 'frontend/js/lookup.js').read_text(encoding='utf-8')
    assert 'Estado de métricas GSC' in js
    assert 'Sin métricas guardadas' in js
