from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def test_product_gsc_diagnostic_is_linked_to_catalog_and_exact_page_filter():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert "import {loadCatalog,saveCatalog} from './storage.js'" in js
    assert "dimension:'page',operator:'equals',expression:pageUrl" in js
    assert "gsc-product-select" in js
    assert "gsc-product-compare" in js
    assert "GSC_Ultima_Actualizacion" in js
    assert "gssc:catalog-updated" in js

def test_product_diagnostic_compares_equal_length_previous_periods():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'const days=Math.round((end-start)/86400000)+1' in js
    assert 'prevStart=new Date(prevEnd.getTime()-(days-1)*86400000)' in js
    assert "['Clics',c.clicks,p.clicks" in js
    assert "['Impresiones',c.impressions,p.impressions" in js
    assert "['CTR',ctr(c),ctr(p)" in js

def test_product_diagnostic_avoids_claiming_sales_causality():
    js = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')
    assert 'no demuestra por sí sola la causa comercial ni las ventas del producto' in js
