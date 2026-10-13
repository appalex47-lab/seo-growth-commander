from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def test_ga4_uses_official_analytics_data_api_and_readonly_scope():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'https://www.googleapis.com/auth/analytics.readonly' in js
    assert 'https://analyticsdata.googleapis.com/v1beta/properties/' in js
    assert ':runReport' in js
    assert 'Authorization:`Bearer ${token}`' in js

def test_ga4_validates_numeric_property_id_and_dates():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "if(!/^\\d+$/.test(id))throw new Error('El Property ID de GA4 debe ser numérico.')" in js
    assert "if(!startDate||!endDate||startDate>endDate)" in js

def test_ga4_defaults_to_organic_and_has_explicit_all_channel_option():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "channel='organic'" in js
    assert "value:'Organic Search'" in js
    assert 'Todos los canales' in js

def test_central_sync_reports_ga4_real_result_or_setup_error():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "id:'ga4',name:'Google Analytics 4',status:'needs_setup'" in js
    assert "id:'ga4',name:'Google Analytics 4',status:'success'" in js
    assert "id:'ga4',name:'Google Analytics 4',status:'error'" in js

def test_ga4_does_not_assume_currency_or_write_product_attribution_yet():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'moneda configurada en GA4' in js
    # Product-level mapping belongs to the following phase, so this phase only persists the report.
    assert "localStorage.setItem(GA4_STORAGE_KEY,JSON.stringify(reportData))" in js
