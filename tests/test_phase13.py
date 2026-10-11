from pathlib import Path
import json

ROOT = Path(__file__).parents[1]


def test_final_audit_explicitly_blocks_production_google_release():
    text = (ROOT / 'docs/final-audit.md').read_text(encoding='utf-8')
    assert 'No es todavía una release de producción' in text
    assert 'Conectores reales a las APIs de Google' in text
    assert 'Capa backend/worker segura' in text


def test_google_preparation_uses_merchant_api_not_content_api():
    text = (ROOT / 'docs/google-integration-preparation.md').read_text(encoding='utf-8')
    assert 'Merchant API' in text
    assert 'Content API for Shopping' in text
    assert 'sunset' in text


def test_release_checklist_covers_core_and_production_blockers():
    text = (ROOT / 'docs/release-checklist.md').read_text(encoding='utf-8')
    for item in ['[x] Overview', '[x] Pipeline', '[x] IndexedDB', '[x] Cohere config/guardrails']:
        assert item in text
    for item in ['[ ] OAuth Google real', '[ ] Backend/worker seguro', '[ ] Conectores GSC/GA4/Merchant/Ads', '[ ] Cohere API real vía backend']:
        assert item in text


def test_integration_contract_keeps_sources_explicit():
    data = json.loads((ROOT / 'data/integration_contract.json').read_text(encoding='utf-8'))
    ids = {item['id'] for item in data['sources']}
    assert {'gsc', 'ga4', 'merchant', 'ads', 'trends'} <= ids
