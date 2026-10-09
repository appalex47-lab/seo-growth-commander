import json
from pathlib import Path

ROOT=Path(__file__).parents[1]

def products():
    return json.loads((ROOT/'data/data_mock.json').read_text())['products']

def find(q):
    q=q.strip().lower()
    return [p for p in products() if any(q in str(p.get(k,'')).lower() for k in ['SKU','Nombre_Producto','URL_Slug','Marca','Sustancia_Activa','Categoria'])]

def test_lookup_by_sku():
    r=find('SKU-1002'); assert len(r)==1 and r[0]['Nombre_Producto']=='Omeprazol 20 mg'

def test_lookup_by_brand_returns_multiple():
    r=find('Marca Farma'); assert len(r)==2

def test_lookup_by_active_ingredient():
    r=find('probióticos'); assert len(r)==1 and r[0]['SKU']=='SKU-1005'

def test_lookup_no_match():
    assert find('ZZZ-NO-EXISTE')==[]

def test_lookup_contract_contains_action_and_classification():
    for p in products():
        assert p.get('Clasificacion')
        assert p.get('Accion_IA')
