import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline.integrations import normalize_row, merge_rows, SPECS

ROOT=Path(__file__).parents[1]
CONTRACT=json.loads((ROOT/'data/integration_contract.json').read_text())

def test_all_required_sources_have_contracts():
    assert {x.id for x in SPECS} == {'gsc','ga4','merchant','ads','trends'}
    assert {x['id'] for x in CONTRACT['sources']} == {'gsc','ga4','merchant','ads','trends'}

def test_gsc_normalizes_common_payload_names():
    row=normalize_row('gsc',{'sku':'A-1','clicks':120,'impressions':4000,'ctr':.03,'position':8})
    assert row['SKU']=='A-1'
    assert row['Clicks_GSC']==120
    assert row['Impresiones_GSC']==4000
    assert row['CTR_GSC']==.03
    assert row['Posicion_GSC']==8

def test_sources_merge_by_sku():
    rows=[
        normalize_row('gsc',{'sku':'A-1','clicks':100}),
        normalize_row('ga4',{'sku':'A-1','sessions':900,'conversion_rate':.04,'aov':300}),
        normalize_row('merchant',{'sku':'A-1','stock':25})
    ]
    merged=merge_rows(rows)
    assert merged['A-1']['Clicks_GSC']==100
    assert merged['A-1']['Conversion_Rate']==.04
    assert merged['A-1']['Stock']==25

def test_unknown_source_is_rejected():
    try:
        normalize_row('unknown',{'sku':'A-1'})
    except ValueError as exc:
        assert 'Fuente no soportada' in str(exc)
    else:
        raise AssertionError('Expected ValueError')

def test_secrets_are_not_claimed_as_local_storage_capability():
    assert CONTRACT['security']['secrets_storage']=='not implemented in phase 7'
    assert CONTRACT['security']['live_requests'] is False
