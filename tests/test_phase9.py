import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from pipeline.pipeline import run_pipeline, assert_ai_boundary

ROOT=Path(__file__).parents[1]


def load_mock():
    return json.loads((ROOT/'data/data_mock.json').read_text())


def test_end_to_end_mock_pipeline_calculates_all_products():
    data=load_mock()
    out=run_pipeline(base_products=data['products'])
    assert out['product_count']==5
    assert out['quality_summary']['VALID']==5
    assert out['quality_summary']['INCOMPLETE']==0
    assert any(p['Clasificacion']=='ANOMALIA' for p in out['products'])
    for p in out['products']:
        assert 'Revenue_Gap' in p and 'Clasificacion' in p and 'Prioridad' in p


def test_external_rows_enrich_catalog_by_sku():
    out=run_pipeline(
        source='gsc',
        source_rows=[{'SKU':'SKU-1001','clicks':999,'impressions':10000,'ctr':0.0999,'position':7}],
        base_products=[{'SKU':'SKU-1001','Volumen_Mercado':50000,'Stock':20,'Conversion_Rate':.03,'AOV':100}]
    )
    p=out['products'][0]
    assert p['Clicks_GSC']==999
    assert p['Impresiones_GSC']==10000
    assert p['Revenue_Gap']==(5000-999)*.03*100


def test_ai_cannot_overwrite_business_truth():
    product={'SKU':'X','Revenue_Gap':123,'Clasificacion':'QUICK_WIN','Prioridad':1,'Insight_IA':'old'}
    ai={'Revenue_Gap':999999,'Clasificacion':'IGNORAR','Prioridad':5,'Insight_IA':'new'}
    out=assert_ai_boundary(product, ai)
    assert out['Revenue_Gap']==123
    assert out['Clasificacion']=='QUICK_WIN'
    assert out['Prioridad']==1
    assert out['Insight_IA']=='new'


def test_pipeline_has_traceable_versions():
    out=run_pipeline(base_products=load_mock()['products'])
    assert out['pipeline_version']=='1.0'
    assert out['calculated_fields']
    assert out['ai_ready'] is True

def test_frontend_pipeline_is_integrated_and_protects_business_fields():
    js=(ROOT/'frontend/js/pipeline.js').read_text()
    data_js=(ROOT/'frontend/js/data.js').read_text()
    assert "export const PIPELINE_VERSION='1.0'" in js
    assert 'runPipeline(data)' in data_js
    assert "'Revenue_Gap'" in js and "'Clasificacion'" in js
