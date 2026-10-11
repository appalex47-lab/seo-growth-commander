import os
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT))

from backend import gateway


def test_gateway_defaults_to_explicit_localhost_origins():
    assert 'http://127.0.0.1:8787' in gateway.ALLOWED_ORIGINS
    assert 'http://localhost:8787' in gateway.ALLOWED_ORIGINS


def test_google_scopes_are_server_side_and_explicit():
    assert gateway.GOOGLE_SCOPES['gsc'].endswith('/webmasters.readonly')
    assert gateway.GOOGLE_SCOPES['ga4'].endswith('/analytics.readonly')
    assert gateway.GOOGLE_SCOPES['merchant'].endswith('/content')
    assert gateway.GOOGLE_SCOPES['ads'].endswith('/adwords')


def test_oauth_start_requires_server_configuration(monkeypatch):
    monkeypatch.setattr(gateway, 'GOOGLE_CLIENT_ID', '')
    monkeypatch.setattr(gateway, 'GOOGLE_CLIENT_SECRET', '')
    status, payload = gateway._oauth_start('gsc')
    assert status == 503
    assert payload['error'] == 'google_not_configured'


def test_oauth_rejects_unknown_source():
    status, payload = gateway._oauth_start('unknown')
    assert status == 400
    assert payload['error'] == 'unsupported_source'


def test_frontend_does_not_embed_google_secret_or_token_endpoint_credentials():
    source = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'GSSC_GOOGLE_CLIENT_SECRET' not in source
    assert 'client_secret' not in source
    assert 'oauth2.googleapis.com/token' not in source
