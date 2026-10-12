from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def test_global_period_selector_persists_and_defaults_to_28_days():
    js = (ROOT / 'frontend/js/period.js').read_text(encoding='utf-8')
    assert "const KEY='gssc.global.period.v1'" in js
    assert "p.key||'28d'" in js
    assert 'Últimos 28 días (predeterminado)' in js
    assert "value==='custom'" in js

def test_sync_uses_global_range_and_equivalent_previous_period():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'period=getGlobalPeriod()' in js
    assert 'const startDate=period.startDate,endDate=period.endDate' in js
    assert "querySearchConsole({siteUrl:gsc.siteUrl,startDate:fmt(prevStart),endDate:fmt(prevEnd)" in js
    assert 'sin base anterior (0)' in js

def test_integrations_date_query_uses_global_period_not_local_date_fields():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'const {startDate,endDate}=getGlobalPeriod()' in js
    assert 'id="gsc-start-date"' not in js
    assert 'id="gsc-end-date"' not in js

def test_global_period_does_not_trigger_ai_calls():
    js = (ROOT / 'frontend/js/app.js').read_text(encoding='utf-8')
    assert "window.addEventListener('gssc:period-changed'" in js
    assert "syncAllSources({onProgress:" in js
