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


def test_frontend_oauth_message_never_handles_access_tokens():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "gssc:google-connected" in source
    assert 'access_token' not in source
    assert 'client_secret' not in source
