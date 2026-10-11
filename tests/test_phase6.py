import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline.business_rules import calculate_product, classify, data_quality, revenue_gap, organic_search_share

ROOT=Path(__file__).parents[1]
MOCK=json.loads((ROOT/'data/data_mock.json').read_text())['products']
SCENARIOS=json.loads((ROOT/'data/test_scenarios.json').read_text())['scenarios']

def test_revenue_gap_uses_formula_not_stored_value():
    p=next(x for x in MOCK if x['SKU']=='SKU-1001')
    assert revenue_gap(p)==91392
    assert revenue_gap(p)!=p['Revenue_Gap']

def test_revenue_gap_never_negative():
    p={'Volumen_Mercado':1000,'Clicks_GSC':1000,'Conversion_Rate':.1,'AOV':100}
    assert revenue_gap(p)==0

def test_search_share():
    p={'Impresiones_GSC':52000,'Volumen_Mercado':120000}
    assert round(organic_search_share(p),6)==round(52000/120000,6)

def test_known_low_stock_is_ignore():
    p={'Stock':0,'Posicion_GSC':6,'Volumen_Mercado':100000,'Clicks_GSC':1000,'Conversion_Rate':.03,'AOV':300}
    assert classify(p)=='IGNORAR'

def test_missing_business_inputs_are_anomaly():
    p={'Stock':None,'Posicion_GSC':150,'Volumen_Mercado':0,'Clicks_GSC':500,'Conversion_Rate':None,'AOV':None}
    assert data_quality(p)['status']=='INCOMPLETE'
    assert classify(p)=='ANOMALIA'

def test_all_lab_scenarios_classify_as_declared():
    for scenario in SCENARIOS:
        p=scenario['products'][0]
        assert calculate_product(p)['Clasificacion']==p['Clasificacion'], scenario['id']

def test_priority_is_derived_from_classification():
    assert calculate_product(MOCK[0])['Prioridad']==1
    assert calculate_product(MOCK[1])['Prioridad']==2
    assert calculate_product(MOCK[2])['Prioridad']==3
    assert calculate_product(MOCK[3])['Prioridad']==5
    assert calculate_product(MOCK[4])['Prioridad']==4
