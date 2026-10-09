import json
import re
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).parents[1]


def test_indexeddb_storage_contract_exists():
    js=(ROOT/'frontend/js/storage.js').read_text()
    assert "indexedDB.open" in js
    assert "gssc.catalog" in js
    assert "saveCatalog" in js and "loadCatalog" in js and "deleteCatalog" in js


def test_catalog_persistence_is_integrated_into_app():
    js=(ROOT/'frontend/js/app.js').read_text()
    assert "./storage.js" in js
    assert "await saveCatalog(data,'test')" in js
    assert "await loadCatalog()" in js
    assert "await deleteCatalog()" in js


def test_api_key_is_not_persisted_in_local_storage():
    js=(ROOT/'frontend/js/ai.js').read_text()
    assert "localStorage.setItem(CONFIG_KEY" in js
    assert "localStorage.setItem(SECRET_KEY" not in js
    assert "sessionStorage.setItem(SECRET_KEY" in js


def test_no_raw_unsanitized_product_html_in_drawer():
    js=(ROOT/'frontend/js/app.js').read_text()
    assert "escapeHtml(p.Nombre_Producto)" in js
    assert "escapeHtml(p.SKU)" in js
    assert "escapeHtml(p.Insight_IA)" in js


def test_business_engine_handles_extreme_inputs_without_nan():
    sys.path.insert(0,str(ROOT))
    from pipeline.business_rules import calculate_product
    cases=[
        {'SKU':'X','Stock':20,'Posicion_GSC':1,'Conversion_Rate':0,'AOV':100,'Volumen_Mercado':100000,'Clicks_GSC':0,'Impresiones_GSC':0},
        {'SKU':'Y','Stock':20,'Posicion_GSC':100,'Conversion_Rate':1,'AOV':1000000,'Volumen_Mercado':1_000_000,'Clicks_GSC':0,'Impresiones_GSC':0},
        {'SKU':'Z','Stock':20,'Posicion_GSC':1,'Conversion_Rate':.1,'AOV':100,'Volumen_Mercado':0,'Clicks_GSC':0,'Impresiones_GSC':0},
    ]
    for p in cases:
        out=calculate_product(p)
        assert out['Revenue_Gap'] is not None
        assert out['Revenue_Gap'] >= 0
        assert all(v==v for v in out.values() if isinstance(v,float))


def test_invalid_negative_inputs_are_anomalies():
    sys.path.insert(0,str(ROOT))
    from pipeline.business_rules import calculate_product
    out=calculate_product({'SKU':'BAD','Stock':-1,'Posicion_GSC':4,'Conversion_Rate':.1,'AOV':100,'Volumen_Mercado':100000,'Clicks_GSC':10,'Impresiones_GSC':100})
    assert out['Data_Quality']=='INVALID'
    assert out['Clasificacion']=='ANOMALIA'


def test_ci_includes_phase12_suite():
    script=(ROOT/'scripts/ci_check.py').read_text()
    assert 'pytest' in script
    assert 'tests' in script


def test_html_has_accessible_landmarks_and_buttons():
    html=(ROOT/'index.html').read_text()
    assert 'aria-label="Navegación principal"' in html
    assert 'type="button"' in html
    assert 'role="status"' in html
