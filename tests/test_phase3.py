import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def test_scenarios_file():
    payload=json.loads((ROOT/'data'/'test_scenarios.json').read_text())
    ids=[s['id'] for s in payload['scenarios']]
    assert ids==['quick-win','proteger','content-gap','sin-stock','anomalia']
    assert all(len(s['products'])==1 for s in payload['scenarios'])

def test_index_exposes_lab():
    html=(ROOT/'index.html').read_text()
    assert 'data-view="lab"' in html
    assert 'add-test-data' in html and 'remove-test-data' in html

def test_lab_module_exists():
    js=(ROOT/'frontend'/'js'/'testLab.js').read_text()
    assert 'loadScenarios' in js
    assert 'renderTestLab' in js
    assert 'bindTestLab' in js
