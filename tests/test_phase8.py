import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from pipeline.business_rules import calculate_product

ROOT=Path(__file__).parents[1]

def test_ai_context_fields_are_deterministic_contract_fields():
    p=calculate_product(json.loads((ROOT/'data/data_mock.json').read_text())['products'][0])
    required={'SKU','Nombre_Producto','Revenue_Gap','Clasificacion','Prioridad','Data_Quality','Potential_Traffic'}
    assert required.issubset(p)

def test_ai_must_receive_calculated_revenue_gap_not_fixture_value():
    p=json.loads((ROOT/'data/data_mock.json').read_text())['products'][0]
    calculated=calculate_product(p)
    assert calculated['Revenue_Gap'] != p['Revenue_Gap']

def test_anomaly_context_is_not_promoted_to_valid():
    data=json.loads((ROOT/'data/test_scenarios.json').read_text())
    scenario=next(x for x in data['scenarios'] if x['id']=='anomalia')
    p=calculate_product(scenario['products'][0])
    assert p['Data_Quality']=='INCOMPLETE'
    assert p['Clasificacion']=='ANOMALIA'

def test_cohere_is_the_only_ai_provider():
    js=(ROOT/'frontend/js/ai.js').read_text()
    assert "provider:'cohere'" in js
    assert "id:'cohere'" not in js
    assert "openai" not in js.lower()

def test_cohere_model_selector_contains_current_live_models():
    js=(ROOT/'frontend/js/ai.js').read_text()
    for model in ['command-a-plus-05-2026','command-a-03-2025','command-a-reasoning-08-2025','command-r7b-12-2024','command-r-plus-08-2024','command-r-08-2024']:
        assert model in js

def test_cohere_api_key_is_not_stored_in_localstorage():
    js=(ROOT/'frontend/js/ai.js').read_text()
    assert "sessionStorage.setItem(SECRET_KEY" in js
    assert "localStorage.setItem(CONFIG_KEY" in js
    assert "apiKey:config.apiKey" not in js

def test_cohere_settings_ui_has_model_and_api_key_fields():
    js=(ROOT/'frontend/js/ai.js').read_text()
    assert 'id="ai-model"' in js
    assert 'id="ai-key"' in js
    assert 'type="password"' in js
