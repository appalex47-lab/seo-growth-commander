from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def test_global_sync_button_is_persistent_in_app_shell():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert 'id="sync-information"' in html
    assert 'id="add-test-data"' in html
    assert 'id="remove-test-data"' in html

def test_central_sync_runs_real_gsc_and_reports_unsupported_sources_honestly():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'export async function syncAllSources' in js
    assert "dimensions:['page'],rowLimit:25000" in js
    assert "['ga4','Google Analytics 4'" in js
    assert "['merchant','Google Merchant Center'" in js
    assert "['ads','Google Ads'" in js
    assert "['trends','Google Trends'" in js
    assert "status:'not_implemented'" in js

def test_global_sync_has_result_report_and_does_not_trigger_ai_automatically():
    js = (ROOT / 'frontend/js/app.js').read_text(encoding='utf-8')
    assert "addEventListener('click',syncInformation)" in js
    assert 'showSyncReport(result)' in js
    assert 'syncAllSources({onProgress:' in js
    assert 'runAI(' not in js
