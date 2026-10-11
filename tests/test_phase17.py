import json
import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT))
from backend import gateway


def test_date_range_validation():
    assert gateway._validate_dates('2026-01-01', '2026-01-31')
    assert not gateway._validate_dates('2026-02-01', '2026-01-31')
    assert not gateway._validate_dates('01/01/2026', '2026-01-31')


def test_connection_lookup_enforces_source():
    gateway._tokens['test-phase17'] = {'source': 'gsc', 'token': {}, 'created_at': 0}
    try:
        assert gateway._connection_for('test-phase17', 'gsc')[1] is None
        assert gateway._connection_for('test-phase17', 'ga4')[1] == 'connection_source_mismatch'
        assert gateway._connection_for('missing', 'gsc')[1] == 'connection_not_found'
    finally:
        gateway._tokens.pop('test-phase17', None)


def test_provider_endpoints_and_validation_are_present():
    source = (ROOT / 'backend/gateway.py').read_text(encoding='utf-8')
    assert '/api/sync/gsc/query' in source
    assert '/api/sync/ga4/report' in source
    assert 'webmasters.readonly' in source
    assert 'analytics.readonly' in source


def test_frontend_search_console_uses_browser_oauth_without_gateway_tokens():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'https://accounts.google.com/gsi/client' in source
    assert 'https://www.googleapis.com/auth/webmasters.readonly' in source
    assert 'GATEWAY_URL' not in source
    assert "localStorage.setItem('gssc.google.client_id',clientId)" in source
    assert 'accessToken=response.access_token' in source
    assert 'client_secret' not in source
